import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types/book";
import { BookFilters, BookQueryResult } from "./bookTypes";
import { mapBookFromDatabase } from "./bookMapper";
import {
  handleBookServiceError,
  logBookServiceError,
} from "./bookErrorHandler";
import {
  logError,
  getErrorMessage,
  logDatabaseError,
} from "@/utils/errorUtils";
import { formatSupabaseError } from "@/utils/safeErrorLogger";
import { getSafeErrorMessage } from "@/utils/errorMessageUtils";
// Simple retry function to replace the missing connectionHealthCheck
const retryWithConnection = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};
import { getFallbackBooks } from "@/utils/fallbackBooksData";

// Circuit breaker to prevent error spam
let bookQueryErrorCount = 0;
let lastBookQueryError = 0;
const ERROR_SPAM_THRESHOLD = 5;
const ERROR_COOLDOWN_PERIOD = 60000; // 1 minute

const shouldLogBookError = (): boolean => {
  const now = Date.now();

  // Reset error count after cooldown period
  if (now - lastBookQueryError > ERROR_COOLDOWN_PERIOD) {
    bookQueryErrorCount = 0;
  }

  // Only log if we haven't exceeded the threshold
  if (bookQueryErrorCount < ERROR_SPAM_THRESHOLD) {
    bookQueryErrorCount++;
    lastBookQueryError = now;
    return true;
  }

  // Log warning about suppressing errors (only once)
  if (bookQueryErrorCount === ERROR_SPAM_THRESHOLD) {
    bookQueryErrorCount++;
  }

  return false;
};

// Enhanced error logging function with spam protection
const logDetailedError = (context: string, error: unknown) => {
  // Check if we should log this error (spam protection)
  if (!shouldLogBookError()) {
    return;
  }

  // Safe error handling without logging
  const errorMessage = error instanceof Error ? error.message :
                      (typeof error === 'object' && error !== null) ?
                      JSON.stringify(error, Object.getOwnPropertyNames(error)) :
                      String(error);
};

export const getBooks = async (filters?: BookFilters): Promise<Book[]> => {
  try {
    const fetchBooksOperation = async (retryCount = 0): Promise<any[]> => {
      try {
        // SIMPLIFIED QUERY: Get ALL books first to debug
        let query = supabase
          .from("books")
          .select(`
            *,
            seller_profile:profiles!seller_id(
              id
            )
          `)
          .eq("sold", false)  // Only show available books
          .order("created_at", { ascending: false });

        // Apply filters if provided
        if (filters) {
          if (filters.search) {
            query = query.or(
              `title.ilike.%${filters.search}%,author.ilike.%${filters.search}%`,
            );
          }
          if (filters.category) {
            query = query.eq("category", filters.category);
          }
          if (filters.condition) {
            query = query.eq("condition", filters.condition);
          }
          if (filters.grade) {
            query = query.eq("grade", filters.grade);
          }
          if (filters.genre) {
            query = query.eq("genre", filters.genre);
          }
          if (filters.universityYear) {
            query = query.eq("university_year", filters.universityYear);
          }
          if (filters.university) {
            query = query.eq("university", filters.university);
          }
          if (filters.curriculum) {
            query = query.eq("curriculum", filters.curriculum);
          }
          if (filters.province) {
            query = query.eq("province", filters.province);
          }
          if (filters.minPrice !== undefined) {
            query = query.gte("price", filters.minPrice);
          }
          if (filters.maxPrice !== undefined) {
            query = query.lte("price", filters.maxPrice);
          }
        }

        const { data: booksData, error: booksError } = await query;

        if (booksError) {
          logDetailedError("Books query failed", booksError);

          // If it's a connection error and we haven't retried too many times, try again
          if (retryCount < 3 && (
            booksError.message?.includes('fetch') ||
            booksError.message?.includes('network') ||
            booksError.message?.includes('Failed to fetch') ||
            booksError.message?.includes('timeout')
          )) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
            return fetchBooksOperation(retryCount + 1);
          }

          throw new Error(
            `Failed to fetch books after ${retryCount + 1} attempts: ${booksError.message || "Unknown database error"}`,
          );
        }

        if (!booksData) {
          return [];
        }

        return booksData;
      } catch (networkError) {
        logDetailedError("Network exception in books query", networkError);

        // If it's a network error and we haven't retried too many times, try again
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchBooksOperation(retryCount + 1);
        }

        throw networkError;
      }
    };

    // Execute the books query with retry logic
    const booksData = await fetchBooksOperation();

    if (!booksData || booksData.length === 0) {
      return [];
    }

    // EMERGENCY: Show ALL books regardless of seller profile or address
    const validBooks = booksData; // Show everything!

    if (validBooks.length === 0) {
      return [];
    }

    // Get unique seller IDs from valid books only
    const sellerIds = [...new Set(validBooks.map((book) => book.seller_id))];

    // Fetch seller profiles separately with error handling
    let profilesMap = new Map();
    try {
      // Add retry logic for profile fetching
      const fetchProfiles = async (retryCount = 0): Promise<void> => {
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email, preferred_delivery_locker_data, pickup_address_encrypted")
            .in("id", sellerIds);

          if (profilesError) {
            logDetailedError("Error fetching profiles", profilesError);

            // Check network connectivity
            const isNetworkError = (
              profilesError.message?.includes('fetch') ||
              profilesError.message?.includes('network') ||
              profilesError.message?.includes('Failed to fetch') ||
              profilesError.message?.includes('NetworkError')
            );

            // If it's a connection error and we haven't retried too many times, try again
            if (retryCount < 2 && isNetworkError) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              return fetchProfiles(retryCount + 1);
            }
          } else if (profilesData) {
            profilesData.forEach((profile: any) => {
              const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.name || (profile.email ? profile.email.split("@")[0] : "Anonymous");
              profilesMap.set(profile.id, {
                id: profile.id,
                name: displayName,
                email: profile.email || "",
                preferred_delivery_locker_data: profile.preferred_delivery_locker_data,
                has_pickup_address: !!profile.pickup_address_encrypted
              });
            });
          }
        } catch (innerError) {
          if (retryCount < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return fetchProfiles(retryCount + 1);
          }
          throw innerError;
        }
      };

      await fetchProfiles();
    } catch (profileFetchError) {
      logDetailedError("Critical exception in profile fetching", profileFetchError);
    }

    // Combine valid books with profile data
    const books: Book[] = validBooks.map((book: any) => {
      const profile = profilesMap.get(book.seller_id);
      const bookData: BookQueryResult = {
        ...book,
        profiles: profile
          ? {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              preferred_delivery_locker_data: profile.preferred_delivery_locker_data,
              has_pickup_address: profile.has_pickup_address
            }
          : null,
      };
      return mapBookFromDatabase(bookData);
    });

    return books;
  } catch (error) {
    logDetailedError("Error in getBooks", error);

    // Provide user-friendly error message
    const userMessage =
      error instanceof Error && error.message.includes("Failed to fetch")
        ? "Unable to connect to the book database. Please check your internet connection and try again."
        : "Failed to load books. Please try again later.";

    // If it's a network error, return fallback data instead of empty array
    if (error instanceof Error && (
      error.message.includes("Failed to fetch") ||
      error.message.includes("fetch") ||
      error.message.includes("network")
    )) {
      return getFallbackBooks();
    }

    // For other errors, return empty array to prevent app crashes
    return [];
  }
};

export const getBookById = async (id: string): Promise<Book | null> => {
  try {
    // UUID validation - allow any format that looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      // Return null instead of throwing to let the component handle it gracefully
      return null;
    }

    const fetchBookOperation = async () => {
      // Get book first
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .single();

      if (bookError) {
        if (bookError.code === "PGRST116") {
          return null; // Book not found
        }

        logDetailedError("Error fetching book", bookError);

        throw new Error(
          `Failed to fetch book: ${bookError.message || "Unknown database error"}`,
        );
      }

      if (!bookData) {
        return null;
      }

      // Get seller profile separately - handle case where profile might not exist
      let profileData = null;
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, preferred_delivery_locker_data, pickup_address_encrypted")
          .eq("id", bookData.seller_id)
          .maybeSingle();

        if (profileError) {
          // Continue without profile data rather than failing
        } else {
          profileData = profile;
        }
      } catch (profileFetchError) {
        // Continue with null profile
      }

      const bookWithProfile: BookQueryResult = {
        ...bookData,
        profiles: profileData
          ? {
              id: profileData.id,
              name: [profileData.first_name, profileData.last_name].filter(Boolean).join(" ") || (profileData as any).name || (profileData.email ? profileData.email.split("@")[0] : ""),
              email: profileData.email,
              preferred_delivery_locker_data: (profileData as any).preferred_delivery_locker_data,
              has_pickup_address: !!(profileData as any).pickup_address_encrypted
            }
          : null,
      };

      const mappedBook = mapBookFromDatabase(bookWithProfile);

      return mappedBook;
    };

    // Use retry logic for network resilience
    return await retryWithConnection(fetchBookOperation, 2, 1000);
  } catch (error) {
    logDetailedError("Error in getBookById", error);

    if (
      error instanceof Error &&
      error.message.includes("Invalid book ID format")
    ) {
      throw error; // Re-throw validation errors
    }

    // For other errors, return null instead of throwing
    return null;
  }
};

export const getUserBooks = async (userId: string): Promise<Book[]> => {
  try {
    if (!userId) {
      return [];
    }

    // Use fallback function with retry logic
    return await retryWithConnection(
      () => getUserBooksWithFallback(userId),
      2,
      1000,
    );
  } catch (error) {
    // Try one more time without retry wrapper as a final fallback
    try {
      return await getUserBooksWithFallback(userId);
    } catch (fallbackError) {
      return [];
    }
  }
};

// Enhanced fallback function with better error handling
const getUserBooksWithFallback = async (userId: string): Promise<Book[]> => {
  try {
    // Get books for user
    const { data: booksData, error: booksError } = await supabase
      .from("books")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (booksError) {
      logDetailedError("getUserBooksWithFallback - books query failed", booksError);
      throw new Error(
        `Failed to fetch user books: ${booksError.message || "Unknown database error"}`,
      );
    }

    if (!booksData || booksData.length === 0) {
      return [];
    }

    // Get user profile separately with error handling
    let profileData = null;
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, preferred_delivery_locker_data, pickup_address_encrypted")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        logDetailedError("getUserBooksWithFallback - profile query failed", profileError);
      } else {
        profileData = profile;
      }
    } catch (profileFetchError) {
      logDetailedError("Exception fetching user profile", profileFetchError);
    }

    const displayName = profileData ? [profileData.first_name, profileData.last_name].filter(Boolean).join(" ") || (profileData as any).name || (profileData.email ? profileData.email.split("@")[0] : "Anonymous") : "Anonymous";
    const mappedBooks = booksData.map((book: any) => {
      const bookData: BookQueryResult = {
        ...book,
        profiles: profileData ? {
          id: userId,
          name: displayName,
          email: profileData.email || "",
          preferred_delivery_locker_data: (profileData as any).preferred_delivery_locker_data,
          has_pickup_address: !!(profileData as any).pickup_address_encrypted
        } : {
          id: userId,
          name: "Anonymous",
          email: "",
        },
      };
      return mapBookFromDatabase(bookData);
    });

    return mappedBooks;
  } catch (error) {
    // If it's a network error, throw it so retry can handle it
    if (
      error instanceof Error &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("fetch") ||
        error.message.includes("timeout") ||
        error.name === "NetworkError" ||
        error.name === "TypeError")
    ) {
      throw error;
    }

    return [];
  }
};
