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
    console.error('Auth error:', error);
    return null;
  }

  return user;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Processing banking details decryption request

    const user = await getUserFromRequest(req);
    if (!user) {
      console.error('Authentication failed - no user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please login first' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User authenticated

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
      console.error('No banking details found for user:', user.id, 'Error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'No banking details found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Banking details found for user

    // Check if data is encrypted
    const hasEncryptedData = !!(
      bankingDetails.encrypted_account_number &&
      bankingDetails.encrypted_bank_code &&
      bankingDetails.encrypted_bank_name &&
      bankingDetails.encrypted_business_name
    );

    if (!hasEncryptedData) {
      console.error('No encrypted banking data found for user:', user.id);
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
      const decryptedAccountNumber = await decryptGCM(
        bankingDetails.encrypted_account_number as unknown as EncryptedBundle,
        encryptionKey
      );
      const decryptedBankCode = await decryptGCM(
        bankingDetails.encrypted_bank_code as unknown as EncryptedBundle,
        encryptionKey
      );
      const decryptedBankName = await decryptGCM(
        bankingDetails.encrypted_bank_name as unknown as EncryptedBundle,
        encryptionKey
      );
      const decryptedBusinessName = await decryptGCM(
        bankingDetails.encrypted_business_name as unknown as EncryptedBundle,
        encryptionKey
      );

      let decryptedEmail: string | null = null;
      if (bankingDetails.encrypted_email) {
        try {
          decryptedEmail = await decryptGCM(
            bankingDetails.encrypted_email as unknown as EncryptedBundle,
            encryptionKey
          );
        } catch (_) {
          console.warn('Failed to decrypt email');
          decryptedEmail = null;
        }
      }

      console.log('✅ Successfully decrypted banking details for user:', user.id);

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
      console.error('Failed to decrypt banking details:', decryptError);
      return new Response(
        JSON.stringify({ error: 'Failed to decrypt banking details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error in decrypt-banking-details:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
