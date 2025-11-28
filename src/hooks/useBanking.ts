import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BankingService } from "@/services/bankingService";
import type { BankingSubaccount, BankingDetails } from "@/types/banking";

export const useBanking = () => {
  const { user } = useAuth();
  const [bankingDetails, setBankingDetails] =
    useState<BankingSubaccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankingDetails = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setBankingDetails(null);
      return;
    }

    try {
      setError(null);
      const details = await BankingService.getUserBankingDetails(user.id);
      setBankingDetails(details); // null is valid - means no banking setup yet
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";

      // Only set error for actual failures, not for missing setup
      if (
        !errorMessage.includes("development fallback") &&
        !errorMessage.includes("does not exist")
      ) {
        setError(`Failed to load banking details: ${errorMessage}`);
      } else {
        // For development fallbacks, just continue
        setBankingDetails(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBankingDetails();
  }, [fetchBankingDetails]);

  const setupBanking = async (
    details: BankingDetails,
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const result = await BankingService.createOrUpdateBankingDetails(
        user.id,
        details,
      );

      if (result.success) {
        // Refresh banking details after successful setup
        await fetchBankingDetails();
      }

      return result;
    } catch (err) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const updateBanking = async (
    details: BankingDetails,
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    try {
      const result = await BankingService.createOrUpdateBankingDetails(user.id, details);

      if (result.success) {
        // Refresh banking details after successful update
        await fetchBankingDetails();
      }

      return result;
    } catch (err) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const validateAccountNumber = async (
    accountNumber: string,
    bankCode: string,
  ): Promise<{ valid: boolean; accountName?: string; error?: string }> => {
    try {
      return await BankingService.validateAccountNumber(
        accountNumber,
        bankCode,
      );
    } catch (err) {
      return { valid: false, error: "Validation service unavailable" };
    }
  };

  const refreshBankingDetails = () => {
    setIsLoading(true);
    fetchBankingDetails();
  };

  return {
    bankingDetails,
    isLoading,
    error,
    setupBanking,
    updateBanking,
    validateAccountNumber,
    refreshBankingDetails,

    // Computed properties
    hasBankingSetup: !!bankingDetails,
    isActive: bankingDetails?.status === "active",
    subaccountCode: bankingDetails?.subaccount_code,
    // Plain text fields no longer stored - decrypt via BankingDecryptionService for display
    businessName: undefined,
    bankName: undefined,
    // Always show masked account number - actual account number only available after decryption
    maskedAccountNumber: bankingDetails
      ? "••••••••"
      : undefined,
  };
};

export default useBanking;
