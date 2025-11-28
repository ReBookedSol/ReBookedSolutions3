import { supabase } from "@/integrations/supabase/client";

/** Display name builder with fallbacks.
 * Order: full_name -> [first_name, last_name] -> legacy name -> "Anonymous"
 * Never use email prefix for display name.
 */
export const buildDisplayName = (input: any): string => {
  if (!input) return "Anonymous";
  const fullName = input.full_name ?? undefined;
  if (fullName) return fullName;
  const fn = input.first_name ?? input.firstName ?? undefined;
  const ln = input.last_name ?? input.lastName ?? undefined;
  const fromSplit = fn || ln ? [fn, ln].filter(Boolean).join(" ") : undefined;
  const legacy = input.name ?? undefined;
  return fromSplit || legacy || "Anonymous";
};

/**
 * Safely fetch a user profile, handling cases where the profile might not exist
 * Use this instead of .single() when you're not certain the profile exists
 */
export const safeGetProfile = async <T = any>(
  userId: string,
  selectFields: string = "*",
): Promise<{ data: T | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(selectFields)
      .eq("id", userId)
      .maybeSingle();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Safely fetch a user profile with error handling and logging
 * Throws an error only if specified, otherwise returns null on failure
 */
export const getUserProfile = async <T = any>(
  userId: string,
  selectFields: string = "*",
  throwOnError: boolean = false,
): Promise<T | null> => {
  const { data, error } = await safeGetProfile<T>(userId, selectFields);

  if (error) {
    const errorMessage = `Failed to fetch profile for user ${userId}: ${error.message}`;

    if (throwOnError) {
      throw new Error(errorMessage);
    }

    return null;
  }

  return data;
};

/**
 * Check if a user profile exists
 */
export const profileExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    return !error && data !== null;
  } catch (error) {
    return false;
  }
};
