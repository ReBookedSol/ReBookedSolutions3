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
  business_name?: string
  email?: string
  subaccount_code?: string
}

interface BankingEncryptionResponse {
  success: boolean
  data?: {
    encrypted_account_number: EncryptedBundle
    encrypted_bank_code: EncryptedBundle
    encrypted_bank_name?: EncryptedBundle
    encrypted_business_name?: EncryptedBundle
    encrypted_email?: EncryptedBundle
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
  } catch (e) {
    console.error('base64ToBytes error:', e)
    throw new Error('INVALID_BASE64')
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function getEncryptionKey(): string | null {
  const key = Deno.env.get('ENCRYPTION_KEY_V1') || null
  console.log('Encryption key check:', key ? 'Key found' : 'Key NOT found')
  return key
}

async function importAesKey(rawKeyString: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyBytes = enc.encode(rawKeyString)

  console.log('Key string length:', rawKeyString.length, 'Key bytes length:', keyBytes.byteLength)

  if (keyBytes.byteLength !== 32) {
    try {
      const b64Bytes = base64ToBytes(rawKeyString)
      console.log('Decoded base64 key bytes length:', b64Bytes.byteLength)
      if (b64Bytes.byteLength !== 32) {
        throw new Error('INVALID_KEY_LENGTH: Expected 32 bytes, got ' + b64Bytes.byteLength)
      }
      return crypto.subtle.importKey('raw', b64Bytes.buffer as ArrayBuffer, 'AES-GCM', false, ['encrypt'])
    } catch (e) {
      console.error('Key import error:', e)
      throw new Error('INVALID_KEY_LENGTH: Key must be 32 bytes')
    }
  }
  return crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, 'AES-GCM', false, ['encrypt'])
}

function getOrGenerateIv(): { ivBytes: Uint8Array; ivB64: string } {
  const ivBytes = crypto.getRandomValues(new Uint8Array(12))
  const ivB64 = bytesToBase64(ivBytes)
  return { ivBytes, ivB64 }
}

async function encryptGCM(plaintext: string, keyString: string, version?: number): Promise<EncryptedBundle> {
  if (!keyString) throw new Error('MISSING_KEY')

  console.log('Encrypting plaintext of length:', plaintext.length)

  const cryptoKey = await importAesKey(keyString)
  const { ivBytes, ivB64 } = getOrGenerateIv()

  try {
    const encoded = new TextEncoder().encode(plaintext)
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes.buffer as ArrayBuffer,
        tagLength: 128,
      },
      cryptoKey,
      encoded.buffer as ArrayBuffer,
    )

    const full = new Uint8Array(encrypted)
    console.log('Encrypted bytes length:', full.byteLength)

    if (full.byteLength < 16) throw new Error('ENCRYPTION_FAILED: Output too short')
    const tagBytes = full.slice(full.byteLength - 16)
    const cipherBytes = full.slice(0, full.byteLength - 16)

    return {
      ciphertext: bytesToBase64(cipherBytes),
      iv: ivB64,
      authTag: bytesToBase64(tagBytes),
      version,
    }
  } catch (e) {
    console.error('Encryption error:', e)
    throw new Error('ENCRYPTION_FAILED: ' + (e as Error).message)
  }
}

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    console.log('No authorization header found')
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
    console.log('Method:', req.method)
    console.log('URL:', req.url)

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
      console.log('Request body fields:', Object.keys(body))
    } catch (e) {
      console.error('Invalid request body:', e)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { account_number, bank_code, bank_name, business_name, email, subaccount_code } = body

    if (!account_number || !bank_code) {
      console.error('Missing required fields: account_number or bank_code')
      return new Response(
        JSON.stringify({ success: false, error: 'account_number and bank_code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const encryptionKey = getEncryptionKey()
    if (!encryptionKey) {
      console.error('❌ ENCRYPTION_KEY_V1 not configured in environment')
      return new Response(
        JSON.stringify({ success: false, error: 'Encryption key not configured. Please add ENCRYPTION_KEY_V1 secret.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
      console.log('Starting encryption...')
      const encrypted_account_number = await encryptGCM(account_number, encryptionKey, 1)
      console.log('✅ Encrypted account number')

      const encrypted_bank_code = await encryptGCM(bank_code, encryptionKey, 1)
      console.log('✅ Encrypted bank code')

      let encrypted_bank_name: EncryptedBundle | undefined
      let encrypted_business_name: EncryptedBundle | undefined
      let encrypted_email: EncryptedBundle | undefined
      let encrypted_subaccount_code: EncryptedBundle | undefined

      if (bank_name) {
        encrypted_bank_name = await encryptGCM(bank_name, encryptionKey, 1)
        console.log('✅ Encrypted bank name')
      }

      if (business_name) {
        encrypted_business_name = await encryptGCM(business_name, encryptionKey, 1)
        console.log('✅ Encrypted business name')
      }

      if (email) {
        encrypted_email = await encryptGCM(email, encryptionKey, 1)
        console.log('✅ Encrypted email')
      }

      if (subaccount_code) {
        encrypted_subaccount_code = await encryptGCM(subaccount_code, encryptionKey, 1)
        console.log('✅ Encrypted subaccount code')
      }

      console.log('✅ Successfully encrypted all banking details for user:', user.id)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            encrypted_account_number,
            encrypted_bank_code,
            ...(encrypted_bank_name && { encrypted_bank_name }),
            ...(encrypted_business_name && { encrypted_business_name }),
            ...(encrypted_email && { encrypted_email }),
            ...(encrypted_subaccount_code && { encrypted_subaccount_code }),
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (encryptError) {
      console.error('❌ Failed to encrypt banking details:', encryptError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to encrypt banking details: ' + (encryptError as Error).message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('❌ Unexpected error in encrypt-banking-details:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error: ' + (error as Error).message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
