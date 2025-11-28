import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function base64ToBytes(b64: string): Uint8Array {
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  } catch (_e) {
    throw new Error('INVALID_BASE64');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getEncryptionKey(version?: number): string | null {
  const v = version ?? 1;
  const keyVar = `ENCRYPTION_KEY_V${v}`;
  const fallbackVar = 'ENCRYPTION_KEY';
  const key = Deno.env.get(keyVar) || Deno.env.get(fallbackVar) || null;
  return key;
}

async function importAesKey(rawKeyString: string): Promise<CryptoKey> {
  let keyBytes: Uint8Array;

  // Try base64 decoding first (most common format for encryption keys)
  try {
    const decoded = base64ToBytes(rawKeyString);
    if (decoded.byteLength === 32) {
      keyBytes = decoded;
    } else {
      throw new Error('Base64 decoded key is not 32 bytes');
    }
  } catch (_e) {
    // If base64 fails, try UTF-8 encoding
    const enc = new TextEncoder();
    keyBytes = enc.encode(rawKeyString);
    
    if (keyBytes.byteLength !== 32) {
      throw new Error('INVALID_KEY_LENGTH: Key must be exactly 32 bytes');
    }
  }

  return await crypto.subtle.importKey(
    'raw',
    keyBytes as BufferSource,
    'AES-GCM',
    false,
    ['encrypt']
  );
}

function getOrGenerateIv() {
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const ivB64 = bytesToBase64(ivBytes);
  return { ivBytes, ivB64 };
}

async function encryptGCM(plaintext: string, keyString: string, version: number) {
  if (!keyString) throw new Error('MISSING_KEY');

  const cryptoKey = await importAesKey(keyString);
  const { ivBytes, ivB64 } = getOrGenerateIv();

  try {
    const encoded = new TextEncoder().encode(plaintext);
    
    // Encrypt with AES-GCM
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        tagLength: 128
      },
      cryptoKey,
      encoded
    );

    // AES-GCM returns ciphertext + auth tag (last 16 bytes)
    const full = new Uint8Array(encrypted);
    
    if (full.byteLength < 16) {
      throw new Error('ENCRYPTION_FAILED: Output too short');
    }

    // Extract auth tag (last 16 bytes) and ciphertext (everything else)
    const tagBytes = full.slice(full.byteLength - 16);
    const cipherBytes = full.slice(0, full.byteLength - 16);

    return {
      ciphertext: bytesToBase64(cipherBytes),
      iv: ivB64,
      authTag: bytesToBase64(tagBytes),
      version
    };
  } catch (error) {
    throw new Error('ENCRYPTION_FAILED: ' + (error as Error).message);
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
    // Processing banking details encryption request

    const user = await getUserFromRequest(req);
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized - please login first'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // User authenticated

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { account_number, bank_code, bank_name, business_name, email, subaccount_code } = body;

    // Validate required fields
    if (!account_number || !bank_code || !bank_name || !business_name || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required banking details: account_number, bank_code, bank_name, business_name, email'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Banking details received

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user already has a banking record
    const { data: existingRow } = await supabase
      .from('banking_subaccounts')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const source = {
      account_number,
      bank_code,
      bank_name,
      business_name,
      email
    };

    const encryptionKey = getEncryptionKey();
    if (!encryptionKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Encryption key not configured'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // Encrypting banking fields
      
      // Encrypt all fields
      const encrypted_account_number = await encryptGCM(source.account_number, encryptionKey, 1);
      const encrypted_bank_code = await encryptGCM(source.bank_code, encryptionKey, 1);
      const encrypted_bank_name = await encryptGCM(source.bank_name, encryptionKey, 1);
      const encrypted_business_name = await encryptGCM(source.business_name, encryptionKey, 1);
      const encrypted_email = await encryptGCM(source.email, encryptionKey, 1);

      const encryptedData = {
        user_id: user.id,
        encrypted_account_number: JSON.stringify(encrypted_account_number),
        encrypted_bank_code: JSON.stringify(encrypted_bank_code),
        encrypted_bank_name: JSON.stringify(encrypted_bank_name),
        encrypted_business_name: JSON.stringify(encrypted_business_name),
        encrypted_email: JSON.stringify(encrypted_email),
        subaccount_code: subaccount_code || null,
        status: 'active'
      };

      let savedRecord;

      if (existingRow) {
        // Update existing record
        const { data, error: updateError } = await supabase
          .from('banking_subaccounts')
          .update(encryptedData)
          .eq('id', existingRow.id)
          .select()
          .single();

        if (updateError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to update encrypted banking data: ' + updateError.message
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        savedRecord = data;
      } else {
        // Create new record
        const { data, error: insertError } = await supabase
          .from('banking_subaccounts')
          .insert(encryptedData)
          .select()
          .single();

        if (insertError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to save encrypted banking data: ' + insertError.message
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        savedRecord = data;
      }

      // Banking details encrypted and saved successfully

      return new Response(
        JSON.stringify({
          success: true,
          message: existingRow ? 'Banking details updated and encrypted' : 'Banking details created and encrypted',
          record_id: savedRecord.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (encryptError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to encrypt banking details: ' + (encryptError as Error).message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error: ' + (error as Error).message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
