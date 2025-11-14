/**
 * Security utility for safe logging
 * Prevents accidental logging of sensitive user data
 */

const SENSITIVE_KEYS = [
  // Personal information
  'email',
  'phone',
  'phone_number',
  'name',
  'first_name',
  'last_name',
  'full_name',
  
  // Address information
  'address',
  'street',
  'street_address',
  'streetAddress',
  'city',
  'province',
  'postal_code',
  'postalCode',
  'suburb',
  'zip_code',
  'zipCode',
  'country',
  
  // Shipping/pickup
  'shipping_address',
  'shipping_address_encrypted',
  'pickup_address',
  'pickup_address_encrypted',
  'delivery_address',
  
  // Banking
  'account_number',
  'accountNumber',
  'account_name',
  'accountName',
  'bank_code',
  'bankCode',
  'bank_name',
  'bankName',
  'business_name',
  'businessName',
  'subaccount_code',
  'subaccountCode',
  'banking_details',
  'bankingDetails',
  
  // Payment
  'payment_reference',
  'paymentReference',
  'card_number',
  'cardNumber',
  'cvv',
  'pin',
  
  // Order sensitive data
  'buyer_id',
  'seller_id',
  'buyer_full_name',
  'seller_full_name',
  'buyer_email',
  'seller_email',
  'buyer_phone',
  'buyer_phone_number',
  'seller_phone',
  'seller_phone_number',
];

interface SanitizationOptions {
  maxDepth?: number;
  includeKeys?: boolean;
}

/**
 * Sanitizes an object by removing or masking sensitive data
 * @param data The data to sanitize
 * @param options Sanitization options
 * @returns Sanitized data safe for logging
 */
export function sanitizeForLogging(
  data: unknown,
  options: SanitizationOptions = {}
): unknown {
  const { maxDepth = 2, includeKeys = false } = options;

  function sanitizeRecursive(
    value: unknown,
    depth: number = 0
  ): unknown {
    // Stop recursion at max depth
    if (depth > maxDepth) {
      return '[Object - Max Depth Reached]';
    }

    // Handle null and undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle primitives
    if (typeof value !== 'object') {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeRecursive(item, depth + 1));
    }

    // Handle objects
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeRecursive(val, depth + 1);
      }
    }

    return sanitized;
  }

  return sanitizeRecursive(data);
}

/**
 * Checks if a key is sensitive
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensitiveKey) =>
    lowerKey.includes(sensitiveKey.toLowerCase())
  );
}

/**
 * Creates a safe log message
 * Useful for development logging that won't expose sensitive data
 */
export function createSafeLog(
  message: string,
  context?: unknown
): string {
  if (!context) {
    return message;
  }

  const sanitized = sanitizeForLogging(context);
  return `${message} ${JSON.stringify(sanitized)}`;
}

/**
 * Safe console.log wrapper for development
 */
export function safeLog(message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    if (data) {
      const sanitized = sanitizeForLogging(data);
      console.log(message, sanitized);
    } else {
      console.log(message);
    }
  }
}

/**
 * Safe console.error wrapper for development
 */
export function safeError(message: string, error?: unknown): void {
  if (import.meta.env.DEV) {
    if (error) {
      const sanitized = sanitizeForLogging(error);
      console.error(message, sanitized);
    } else {
      console.error(message);
    }
  }
}

/**
 * Safe console.warn wrapper for development
 */
export function safeWarn(message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    if (data) {
      const sanitized = sanitizeForLogging(data);
      console.warn(message, sanitized);
    } else {
      console.warn(message);
    }
  }
}
