import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EncryptedBundle {
  ciphertext: string
  iv: string
  authTag: string
  version?: number
}

function parseEncryptedBundle(data: unknown): EncryptedBundle {
  // If it's a string, parse it as JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return parsed as EncryptedBundle
    } catch {
      throw new Error('INVALID_ENCRYPTED_DATA_FORMAT')
    }
  }

  // If it's already an object (from JSONB), validate and return it
  if (typeof data === 'object' && data !== null) {
    const bundle = data as Record<string, unknown>
    if (
      typeof bundle.ciphertext === 'string' &&
      typeof bundle.iv === 'string' &&
      typeof bundle.authTag === 'string'
    ) {
      return {
        ciphertext: bundle.ciphertext,
        iv: bundle.iv,
        authTag: bundle.authTag,
        version: typeof bundle.version === 'number' ? bundle.version : undefined
      }
    }
  }

  throw new Error('INVALID_ENCRYPTED_DATA_FORMAT')
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

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

function getEncryptionKey(version?: number): string | null {
  const v = version ?? 1
  const keyVar = `ENCRYPTION_KEY_V${v}`
  const fallbackVar = 'ENCRYPTION_KEY'
  return Deno.env.get(keyVar) || Deno.env.get(fallbackVar) || null
}

async function importAesKeyForDecrypt(rawKeyString: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  let keyBytes: Uint8Array = enc.encode(rawKeyString)

  if (keyBytes.byteLength !== 32) {
    try {
      const b64 = base64ToBytes(rawKeyString)
      if (b64.byteLength !== 32) {
        throw new Error('INVALID_KEY_LENGTH')
      }
      keyBytes = new Uint8Array(b64)
    } catch (_e) {
      throw new Error('INVALID_KEY_LENGTH')
    }
  }

  // @ts-ignore - Deno edge runtime types
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
}

async function decryptGCM(bundle: EncryptedBundle, keyString: string): Promise<string> {
  if (!keyString) throw new Error('MISSING_KEY')

  const cryptoKey = await importAesKeyForDecrypt(keyString)
  const cipherBytes = base64ToBytes(bundle.ciphertext)
  const ivBytes = base64ToBytes(bundle.iv)
  const authTagBytes = base64ToBytes(bundle.authTag)

  const combined = new Uint8Array(cipherBytes.byteLength + authTagBytes.byteLength)
  combined.set(cipherBytes, 0)
  combined.set(authTagBytes, cipherBytes.byteLength)

  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBytes),
        tagLength: 128,
      },
      cryptoKey,
      new Uint8Array(combined),
    )

    return bytesToString(new Uint8Array(decrypted))
  } catch (_e) {
    throw new Error('DECRYPTION_FAILED')
  }
}

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    return null;
  }

  return user;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please login first' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get banking details for the user - select only encrypted columns
    const { data: bankingDetails, error: fetchError } = await supabase
      .from('banking_subaccounts')
      .select('encrypted_account_number, encrypted_bank_code, encrypted_bank_name, encrypted_business_name, encrypted_email')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (fetchError || !bankingDetails) {
      return new Response(
        JSON.stringify({ error: 'No banking details found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if data is encrypted
    const hasEncryptedData = !!(
      bankingDetails.encrypted_account_number &&
      bankingDetails.encrypted_bank_code &&
      bankingDetails.encrypted_bank_name &&
      bankingDetails.encrypted_business_name
    );

    if (!hasEncryptedData) {
      return new Response(
        JSON.stringify({ error: 'Banking details incomplete - encryption required' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get encryption key for decryption
    const encryptionKey = getEncryptionKey()
    if (!encryptionKey) {
      return new Response(
        JSON.stringify({ error: 'Encryption key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decrypt the encrypted data
    try {
      // Parse and validate encrypted bundles (handles both string and JSONB objects)
      const accountBundle = parseEncryptedBundle(bankingDetails.encrypted_account_number)
      const bankCodeBundle = parseEncryptedBundle(bankingDetails.encrypted_bank_code)
      const bankNameBundle = parseEncryptedBundle(bankingDetails.encrypted_bank_name)
      const businessNameBundle = parseEncryptedBundle(bankingDetails.encrypted_business_name)

      // Decrypt all fields
      const decryptedAccountNumber = await decryptGCM(accountBundle, encryptionKey);
      const decryptedBankCode = await decryptGCM(bankCodeBundle, encryptionKey);
      const decryptedBankName = await decryptGCM(bankNameBundle, encryptionKey);
      const decryptedBusinessName = await decryptGCM(businessNameBundle, encryptionKey);

      let decryptedEmail: string | null = null;
      if (bankingDetails.encrypted_email) {
        try {
          const emailBundle = parseEncryptedBundle(bankingDetails.encrypted_email)
          decryptedEmail = await decryptGCM(emailBundle, encryptionKey);
        } catch (emailError) {
          decryptedEmail = null;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            account_number: decryptedAccountNumber,
            bank_code: decryptedBankCode,
            bank_name: decryptedBankName,
            business_name: decryptedBusinessName,
            ...(decryptedEmail && { email: decryptedEmail })
          },
          encrypted: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (decryptError) {
      const errorMessage = decryptError instanceof Error ? decryptError.message : 'Unknown decryption error'

      return new Response(
        JSON.stringify({
          error: 'Failed to decrypt banking details',
          details: errorMessage
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
