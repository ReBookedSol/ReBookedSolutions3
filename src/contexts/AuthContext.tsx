import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/utils/edgeFunctionClient";
import {
  Profile,
  loginUser,
  registerUser,
  fetchUserProfile,
  fetchUserProfileQuick,
  createUserProfile,
  upgradeToUserProfile,
} from "@/services/authOperations";
import { addNotification } from "@/services/notificationService";
import { logError, getErrorMessage } from "@/utils/errorUtils";


export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  status: string;
  profile_picture_url?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  initError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone: string,
    affiliateCode?: string,
  ) => Promise<{ needsVerification?: boolean; isExistingUnverified?: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider. Check your component tree structure.");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!session;
  const isAdmin = profile?.isAdmin === true;

  const createFallbackProfile = useCallback(
    (user: User): UserProfile => ({
      id: user.id,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      isAdmin: false,
      status: "active",
      profile_picture_url: user.user_metadata?.avatar_url,
      bio: undefined,
    }),
    [],
  );

  const handleError = useCallback((error: unknown, context: string) => {
    const errorMessage = getErrorMessage(
      error,
      `${context} failed. Please try again.`,
    );
    throw new Error(errorMessage);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        const result = await loginUser(email, password);

        // After successful login, give Supabase a moment to update auth state
        if (result && result.user) {
          // Small delay to let auth state propagate
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        return result;
      } catch (error) {
        // Only handle error if we're sure login actually failed
        // Check one more time if user is actually authenticated
        try {
          const { data: sessionCheck } = await supabase.auth.getSession();
          if (sessionCheck.session && sessionCheck.user) {
            return sessionCheck;
          }
        } catch (sessionError) {
          // Session check failed
        }

        handleError(error, "Login");
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

  const register = useCallback(
    async (email: string, password: string, firstName: string, lastName: string, phone: string, affiliateCode?: string) => {
      try {
        setIsLoading(true);

        // Check if user already exists in our profiles table
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id, email, status')
          .eq('email', email)
          .maybeSingle();

        if (existingProfile && !checkError) {

          // Try to resend verification email for existing profile users
          try {
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: email,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
              }
            });

            if (!resendError) {
              return {
                needsVerification: true,
                isExistingUnverified: true
              };
            } else if (resendError.message?.includes("already confirmed")) {
              throw new Error("Your account already exists and is fully verified. Please log in instead.");
            }
          } catch (resendException) {
            // Could not resend to profile user
          }

          throw new Error("An account with this email already exists. Please try logging in instead.");
        }

        // If checkError is not "PGRST116" (no rows), then it's a real error
        if (checkError && checkError.code !== 'PGRST116') {
          // Error checking existing user (non-critical)
        }

        // Create user account - Supabase handles email confirmation automatically

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, last_name: lastName, phone_number: phone, phone, ...(affiliateCode ? { affiliate_code: affiliateCode } : {}) },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          },
        });

        // If we have an affiliate code and a new user id, track referral via Edge Function
        try {
          if (affiliateCode && data?.user?.id) {
            await callEdgeFunction('track-referral', {
              method: 'POST',
              body: { affiliate_code: affiliateCode, new_user_id: data.user.id }
            });
          }
        } catch (refErr) {
          // Referral tracking failed (non-blocking)
        }

        // Stash phone to ensure we can sync it on first login even if metadata is missing
        try {
          localStorage.setItem('pending_phone_number', phone);
        } catch (_) {}

        if (error) {
          // Handle specific Supabase auth errors more gracefully
          if (error.message?.includes("User already registered") ||
              error.message?.includes("already been registered") ||
              error.message?.includes("already exists")) {

            // Try to check if the user just needs to verify their email
            try {
              const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                  emailRedirectTo: `${window.location.origin}/auth/callback`
                }
              });

              if (!resendError) {
                // Email resent successfully - user exists but needs verification
                return {
                  needsVerification: true,
                  isExistingUnverified: true
                };
              } else if (resendError.message?.includes("already confirmed")) {
                // User exists and is already verified - they should just login
                throw new Error("An account with this email already exists and is verified. Please log in instead.");
              }
            } catch (resendException) {
              // Could not resend verification email
            }

            // Default to asking user to login
            throw new Error("An account with this email already exists. Please try logging in instead.");
          }

          // Handle other Supabase errors
          throw new Error(error.message);
        }

        // Handle successful Supabase signup
        if (data.user && !data.session) {
          // Email verification is required - Supabase should send confirmation email automatically
          console.log("✅ Supabase signup successful - email confirmation required");
          console.log("📧 Attempting to ensure confirmation email is sent...");

          try {
            // Use the same reliable method as password reset - resend confirmation email
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: email,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
              }
            });

            if (resendError) {
              console.warn("��️ Resend confirmation email failed:", resendError);
              // Don't fail registration, just log the warning
            } else {
              console.log("✅ Confirmation email sent successfully using resend method");
            }
          } catch (resendException) {
            console.warn("⚠️ Exception during confirmation email resend:", resendException);
            // Don't fail registration, just log the warning
          }

          return { needsVerification: true };
        }

        if (data.user && data.session) {
          // User is immediately logged in - no email verification needed
          console.log("✅ User immediately logged in - no email verification required");
          return { needsVerification: false };
        }

        // Fallback case
        console.log("✅ Registration completed successfully");
        return { needsVerification: false };
      } catch (error) {

        // Provide more specific error messages
        const errorMessage =
          error instanceof Error ? error.message : "Registration failed";

        if (errorMessage.includes("Email service")) {
          throw new Error(
            "Registration succeeded but email confirmation is currently unavailable. You can still log in.",
          );
        }

        if (errorMessage.includes("already registered") ||
            errorMessage.includes("User already registered") ||
            errorMessage.includes("already been registered") ||
            errorMessage.includes("email address is already registered")) {
          throw new Error(
            "An account with this email already exists. Please try logging in instead.",
          );
        }

        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();

      // Clear local state regardless of signOut result
      setUser(null);
      setProfile(null);
      setSession(null);

      // Only throw if it's a real error (not just session missing)
      if (error) {
        // Common "success" scenarios that shouldn't be treated as errors
        const isAcceptableError =
          error.message?.includes("session") ||
          error.message?.includes("not authenticated") ||
          error.message?.includes("JWT") ||
          error.message?.includes("token");

        if (!isAcceptableError) {
          // Don't throw - the user is effectively logged out
        }
      }
    } catch (error) {
      // Always clear local state even if signOut fails
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      const updatedProfile = await fetchUserProfile(user);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error) {
      // Failed to refresh profile
    }
  }, [user]);

  // Simplified auth state change handler
  const handleAuthStateChange = useCallback(
    async (session: Session | null) => {
      try {
        if (session?.user) {
          setSession(session);
          setUser(session.user);

          // Create fallback profile immediately
          const fallbackProfile = createFallbackProfile(session.user);
          setProfile(fallbackProfile);

          // Try to load full profile in background (only if we don't have one)
          if (!profile || profile.id !== session.user.id) {
            fetchUserProfileQuick(session.user)
              .then(async (userProfile) => {
                const finalProfile = userProfile ?? await fetchUserProfile(session.user!);
                if (finalProfile && finalProfile.id === session.user?.id) {
                  setProfile(finalProfile);

                  // Background sync: ensure phone_number is stored in profiles table
                  (async () => {
                    try {
                      let phoneVal = ((session.user?.user_metadata as any)?.phone_number || (session.user?.user_metadata as any)?.phone || "").toString().trim();
                      if (!phoneVal && typeof window !== 'undefined') {
                        try {
                          const cached = localStorage.getItem('pending_phone_number');
                          if (cached) {
                            phoneVal = cached.trim();
                            localStorage.removeItem('pending_phone_number');
                          }
                        } catch (_) {}
                      }

                      if (phoneVal) {
                        // Ensure auth metadata has both keys
                        try {
                          await supabase.auth.updateUser({ data: { phone_number: phoneVal, phone: phoneVal } });
                        } catch (e) {
                          // Auth metadata phone sync failed
                        }

                        await supabase
                          .from('profiles')
                          .update({ phone_number: phoneVal })
                          .eq('id', session.user!.id);
                      }
                    } catch (e) {
                      // Phone sync to profiles failed (non-fatal)
                    }
                  })();

                  // Prefetch addresses and banking requirements in background for snappy UI
                  (async () => {
                    try {
                      const userId = session.user!.id;

                      // Run address & banking checks in parallel
                      const [addrRes, bankingReqRes, subacctRes] = await Promise.allSettled([
                        import("@/services/addressService").then(m => m.getUserAddresses(userId)),
                        import("@/services/bankingService").then(m => m.getSellerRequirements(userId)),
                        import("@/services/paystackSubaccountService").then(m => m.getUserSubaccountStatus(userId)),
                      ]);

                      // Save address cache for fast UI
                      if (addrRes.status === "fulfilled" && addrRes.value) {
                        try {
                          localStorage.setItem(`cached_address_${userId}`, JSON.stringify(addrRes.value));
                        } catch (e) {
                          // ignore storage errors
                        }
                      }

                      // Save banking quick status cache
                      if (bankingReqRes.status === "fulfilled") {
                        try {
                          localStorage.setItem(`banking_requirements_${userId}`, JSON.stringify(bankingReqRes.value));
                        } catch (e) {}
                      }

                      // Save subaccount detection cache
                      if (subacctRes.status === "fulfilled") {
                        try {
                          localStorage.setItem(`subaccount_status_${userId}`, JSON.stringify(subacctRes.value));
                        } catch (e) {}
                      }

                    } catch (prefetchError) {
                      // Prefetch error (non-fatal)
                    }
                  })();

                  // Check if this is a first-time login (profile exists but no welcome email sent)
                  // We'll use a simple heuristic: if profile was created recently (within 24 hours)
                  // and user is logging in, send welcome email
                  try {
                    const profileCreatedAt = new Date(finalProfile.id); // Approximation; create time not stored here
                    const now = new Date();
                    const hoursSinceCreation = (now.getTime() - profileCreatedAt.getTime()) / (1000 * 60 * 60);

                    // If profile created within last 24 hours, likely first login after verification
                    if (hoursSinceCreation <= 24) {
                      console.log("🎉 Detected first login after verification, sending welcome email");

                      // Import email service dynamically
                      const { emailService } = await import("@/services/emailService");

                      // Use direct HTML email instead of template to avoid deprecated template system
                      await emailService.sendEmail({
                        to: session.user.email!,
                        subject: "Welcome to ReBooked Solutions! 📚",
                        html: `
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <meta charset="utf-8">
                            <title>Welcome to ReBooked Solutions!</title>
                          </head>
                          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ReBooked Solutions!</h1>
                            </div>

                            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
                              <h2 style="color: #333; margin-top: 0;">Hello ${finalProfile.name}!</h2>

                              <p>🎉 Congratulations! Your email has been verified and your ReBooked Solutions account is now fully active.</p>

                              <p><strong>What you can do now:</strong></p>
                              <ul>
                                <li>📚 Browse thousands of textbooks from fellow students</li>
                                <li>💰 List your own textbooks for sale</li>
                                <li>🚚 Enjoy hassle-free courier delivery</li>
                                <li>💳 Secure payment processing</li>
                                <li>�� Track your orders in real-time</li>
                              </ul>

                              <div style="text-align: center; margin: 30px 0;">
                                <a href="${window.location.origin}/profile"
                                   style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                  View My Profile
                                </a>
                              </div>

                              <p><strong>Need help getting started?</strong></p>
                              <p>Check out our quick start guide or browse books by university to find exactly what you need.</p>

                              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                              <p style="font-size: 14px; color: #666;">
                                <strong>ReBooked Solutions</strong><br>
                                South Africa's Premier Student Textbook Marketplace<br>
                                <a href="mailto:support@rebookedsolutions.co.za">support@rebookedsolutions.co.za</a>
                              </p>
                            </div>
                          </body>
                          </html>
                        `,
                        text: `Welcome to ReBooked Solutions!

Hello ${finalProfile.name}!

🎉 Congratulations! Your email has been verified and your ReBooked Solutions account is now fully active.

What you can do now:
- 📚 Browse thousands of textbooks from fellow students
- 💰 List your own textbooks for sale
- 🚚 Enjoy hassle-free courier delivery
- 💳 Secure payment processing
- ���� Track your orders in real-time

Visit your profile: ${window.location.origin}/profile

Need help getting started? Check out our quick start guide or browse books by university to find exactly what you need.

Best regards,
ReBooked Solutions Team
support@rebookedsolutions.co.za`
                      });

                    }
                  } catch (welcomeError) {
                    // Don't fail the login process for email issues
                  }
                }
              })
              .catch((error) => {
                // Background profile load failed
              });
          }
        } else {
          // Only clear state if it's not already cleared to prevent unnecessary re-renders
          if (user !== null || profile !== null || session !== null) {
            setUser(null);
            setProfile(null);
            setSession(null);
          }
        }
      } catch (error) {
        // Don't throw - just ensure loading is cleared
      } finally {
        setIsLoading(false);
      }
    },
    [createFallbackProfile, profile, user],
  );

  // Initialize auth
  useEffect(() => {
    if (authInitialized) return;

    const initAuth = async () => {
      try {
        // Get current session with retry logic for network failures
        let sessionResult;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            sessionResult = await supabase.auth.getSession();
            break; // Success, exit retry loop
          } catch (networkError) {
            retryCount++;

            if (retryCount >= maxRetries) {
              // Handle network failure gracefully
              if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
                setInitError("Network connectivity issues - some features may be limited");
                setUser(null);
                setSession(null);
                setProfile(null);
                setAuthInitialized(true);
                setIsLoading(false);
                return;
              }
              throw networkError;
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
          }
        }

        if (!sessionResult) {
          throw new Error("Failed to get session after retries");
        }

        const { data: { session }, error } = sessionResult;

        if (error && !error.message.includes("code verifier")) {
          // Handle specific network-related errors gracefully
          if (error.message?.includes('Failed to fetch') ||
              error.message?.includes('NetworkError') ||
              error.message?.includes('fetch')) {
            setInitError("Network connectivity issues - some features may be limited");
          } else {
            setInitError(error.message);
          }
        }

        await handleAuthStateChange(session);
        setAuthInitialized(true);
      } catch (error) {
        const errorMessage = getErrorMessage(error, "Failed to initialize authentication");

        // For network errors, provide a more user-friendly message
        if (errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('fetch')) {
          setInitError("Network connectivity issues - some features may be limited");
          setUser(null);
          setSession(null);
          setProfile(null);
        } else {
          setInitError(errorMessage);
        }

        setAuthInitialized(true);
        setIsLoading(false);
      }
    };

    initAuth();
  }, [authInitialized, handleAuthStateChange]);

  // Listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only handle actual changes, not redundant events
      if (
        event === "SIGNED_OUT" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        await handleAuthStateChange(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [handleAuthStateChange]);

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      isLoading,
      isAuthenticated,
      isAdmin,
      initError,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [
      user,
      profile,
      session,
      isLoading,
      isAuthenticated,
      isAdmin,
      initError,
      login,
      register,
      logout,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
