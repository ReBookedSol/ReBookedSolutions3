import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ActivityService } from "@/services/activityService";
import BankingEncryptionService from "@/services/bankingEncryptionService";

const SOUTH_AFRICAN_BANKS = [
  { name: "ABSA Bank", branchCode: "632005" },
  { name: "Capitec Bank", branchCode: "470010" },
  { name: "First National Bank (FNB)", branchCode: "250655" },
  { name: "Nedbank", branchCode: "198765" },
  { name: "Standard Bank", branchCode: "051001" },
  { name: "TymeBank", branchCode: "678910" },
  { name: "African Bank", branchCode: "430000" },
  { name: "Bidvest Bank", branchCode: "679000" },
  { name: "Discovery Bank", branchCode: "679000" },
  { name: "Investec Bank", branchCode: "580105" },
  { name: "Mercantile Bank", branchCode: "450905" },
  { name: "Sasfin Bank", branchCode: "683000" },
];

interface BankingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BankingForm({ onSuccess, onCancel }: BankingFormProps) {
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    bankName: "",
    accountNumber: "",
  });
  const [branchCode, setBranchCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadExistingBankingDetails();
  }, []);

  const loadExistingBankingDetails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Read banking details from database
      const { data: bankingRecord } = await supabase
        .from("banking_subaccounts")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (bankingRecord) {
        // Note: Plain text fields are no longer stored. For updates, user must enter fresh details.
        setFormData({
          businessName: "",
          email: session.user.email || "",
          bankName: "",
          accountNumber: "",
        });
        setBranchCode("");
        setIsEditMode(true);
      } else {
        setFormData((p) => ({ ...p, email: session.user.email || "" }));
      }
    } catch (e) {
      console.error("Error loading banking details:", e);
    }
  };

  const validateForm = () => {
    if (!formData.businessName.trim()) { 
      toast({ title: "Name is required", variant: "destructive" }); 
      return false; 
    }
    if (!formData.email.includes("@")) { 
      toast({ title: "Enter a valid email", variant: "destructive" }); 
      return false; 
    }
    if (!formData.bankName) { 
      toast({ title: "Select a bank", variant: "destructive" }); 
      return false; 
    }
    if (formData.accountNumber.length < 8) { 
      toast({ title: "Account number must be at least 8 digits", variant: "destructive" }); 
      return false; 
    }
    return true;
  };

  const handleBankChange = (bankName: string) => {
    const bank = SOUTH_AFRICAN_BANKS.find(b => b.name === bankName);
    setFormData((p) => ({ ...p, bankName }));
    setBranchCode(bank?.branchCode || "");
  };

  const handleAccountNumberChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setFormData((p) => ({ ...p, accountNumber: digitsOnly }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in to continue");

      // Encrypt and save banking details via edge function (which handles DB save)
      console.log("🔒 Starting banking details encryption and save...");
      const encryptionResult = await BankingEncryptionService.encryptBankingDetails(
        formData.accountNumber,
        branchCode,
        formData.bankName,
        formData.businessName,
        formData.email
      );

      if (!encryptionResult.success) {
        throw new Error(encryptionResult.error || "Failed to encrypt and save banking details");
      }

      console.log("✅ Banking details encrypted and saved successfully");

      // Edge function already saved to banking_subaccounts, now just update profile
      const subaccountCode = `ACCT_${session.user.id}_${Date.now()}`;

      // Update profile with subaccount code and preferences
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          subaccount_code: subaccountCode,
          preferences: {
            banking_setup_complete: true,
            business_name: formData.businessName,
            bank_details: {
              bank_name: formData.bankName,
              bank_code: branchCode,
              account_number_masked: `****${formData.accountNumber.slice(-4)}`
            }
          }
        })
        .eq("id", session.user.id);

      if (profileError) {
        console.warn("⚠️ Warning: Profile update had an issue (non-critical):", profileError);
      }

      // Log the banking update activity
      try {
        await ActivityService.logBankingUpdate(session.user.id, isEditMode);
        console.log("✅ Banking update activity logged");
      } catch (activityError) {
        console.warn("⚠️ Failed to log banking update activity:", activityError);
      }

      toast({ title: "Success!", description: isEditMode ? "Banking details updated securely!" : "Banking details saved securely!" });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/profile");
      }
    } catch (err: any) {
      console.error("Banking form submission error:", err);
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Name */}
      <div className="space-y-2">
        <Label htmlFor="businessName">Your Name *</Label>
        <Input 
          id="businessName" 
          value={formData.businessName}
          onChange={(e) => setFormData((p) => ({ ...p, businessName: e.target.value }))} 
          required 
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input 
          id="email" 
          type="email" 
          value={formData.email}
          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} 
          required 
        />
      </div>

      {/* Bank */}
      <div className="space-y-2">
        <Label>Select Bank *</Label>
        <Select onValueChange={handleBankChange} value={formData.bankName}>
          <SelectTrigger>
            <SelectValue placeholder="Choose your bank" />
          </SelectTrigger>
          <SelectContent>
            {SOUTH_AFRICAN_BANKS.map((b) => (
              <SelectItem key={b.name} value={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Branch code (auto) */}
      {branchCode && (
        <div className="space-y-2">
          <Label>Branch Code (Auto-filled)</Label>
          <Input value={branchCode} readOnly className="bg-gray-50" />
        </div>
      )}

      {/* Account Number */}
      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number *</Label>
        <Input 
          id="accountNumber" 
          value={formData.accountNumber}
          onChange={(e) => handleAccountNumberChange(e.target.value)} 
          maxLength={15} 
          required 
          placeholder="Enter your account number"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting 
            ? (isEditMode ? "Updating Account..." : "Creating Account...") 
            : (isEditMode ? "Update Payment Account" : "Create Payment Account")
          }
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
