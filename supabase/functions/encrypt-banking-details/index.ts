import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EncryptedBundle {
  ciphertext: string
  iv: string
  authTag: string
  version?: number
}

interface BankingEncryptionRequest {
  account_number: string
  bank_code: string
  bank_name?: string
  subaccount_code?: string
}

interface BankingEncryptionResponse {
  success: boolean
  data?: {
    encrypted_account_number: EncryptedBundle
    encrypted_bank_code: EncryptedBundle
    encrypted_bank_name?: EncryptedBundle
    encrypted_subaccount_code?: EncryptedBundle
  }
  error?: string
}

function base64ToBytes(b64: string): Uint8Array {
  try {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  } catch (_e) {
    throw new Error('INVALID_BASE64')
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function getEncryptionKey(version?: number): string | null {
  const v = version ?? 1
  const keyVar = `ENCRYPTION_KEY_V${v}`
  const fallbackVar = 'ENCRYPTION_KEY'
  const key = Deno.env.get(keyVar) || Deno.env.get(fallbackVar) || null
  return key
}

async function importAesKey(rawKeyString: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyBytes = enc.encode(rawKeyString)
  if (keyBytes.byteLength !== 32) {
    try {
      const b64Bytes = base64ToBytes(rawKeyString)
      if (b64Bytes.byteLength !== 32) {
        throw new Error('INVALID_KEY_LENGTH')
      }
      return crypto.subtle.importKey('raw', b64Bytes, 'AES-GCM', false, ['encrypt'])
    } catch (_e) {
      throw new Error('INVALID_KEY_LENGTH')
    }
  }
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
}

function getOrGenerateIv(): { ivBytes: Uint8Array; ivB64: string } {
  const ivBytes = crypto.getRandomValues(new Uint8Array(12))
  const ivB64 = bytesToBase64(ivBytes)
  return { ivBytes, ivB64 }
}

async function encryptGCM(plaintext: string, keyString: string, version?: number): Promise<EncryptedBundle> {
  if (!keyString) throw new Error('MISSING_KEY')

  const cryptoKey = await importAesKey(keyString)
  const { ivBytes, ivB64 } = getOrGenerateIv()

  try {
    const encoded = new TextEncoder().encode(plaintext)
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        tagLength: 128,
      },
      cryptoKey,
      encoded,
    )

    const full = new Uint8Array(encrypted)
    if (full.byteLength < 16) throw new Error('ENCRYPTION_FAILED')
    const tagBytes = full.slice(full.byteLength - 16)
    const cipherBytes = full.slice(0, full.byteLength - 16)

    return {
      ciphertext: bytesToBase64(cipherBytes),
      iv: ivB64,
      authTag: bytesToBase64(tagBytes),
      version,
    }
  } catch (_e) {
    throw new Error('ENCRYPTION_FAILED')
  }
}

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return null
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error) {
    console.error('Auth error:', error)
    return null
  }

  return user
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Encrypt Banking Details Request ===')
    
    const user = await getUserFromRequest(req)
    if (!user) {
      console.error('Authentication failed - no user found')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - please login first' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Authenticated user:', user.id)

    let body: BankingEncryptionRequest
    try {
      body = await req.json()
    } catch (_e) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { account_number, bank_code, bank_name, subaccount_code } = body

    if (!account_number || !bank_code) {
      return new Response(
        JSON.stringify({ success: false, error: 'account_number and bank_code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const encryptionKey = getEncryptionKey()
    if (!encryptionKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Encryption key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
      const encrypted_account_number = await encryptGCM(account_number, encryptionKey, 1)
      const encrypted_bank_code = await encryptGCM(bank_code, encryptionKey, 1)
      
      let encrypted_bank_name: EncryptedBundle | undefined
      let encrypted_subaccount_code: EncryptedBundle | undefined

      if (bank_name) {
        encrypted_bank_name = await encryptGCM(bank_name, encryptionKey, 1)
      }

      if (subaccount_code) {
        encrypted_subaccount_code = await encryptGCM(subaccount_code, encryptionKey, 1)
      }

      console.log('✅ Successfully encrypted banking details for user:', user.id)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            encrypted_account_number,
            encrypted_bank_code,
            ...(encrypted_bank_name && { encrypted_bank_name }),
            ...(encrypted_subaccount_code && { encrypted_subaccount_code }),
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (encryptError) {
      console.error('Failed to encrypt banking details:', encryptError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to encrypt banking details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Unexpected error in encrypt-banking-details:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
