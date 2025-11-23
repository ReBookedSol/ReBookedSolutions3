import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { validateSAPhoneNumber, normalizeZAPhoneNumber } from "@/utils/shippingUtils";
import {
  User,
  Edit,
  Shield,
  UserX,
  Pause,
  Mail,
  Calendar,
  Settings,
  AlertTriangle,
  Info,
  Phone,
  CheckCircle,
} from "lucide-react";
import { UserProfile } from "@/types/address";
import { useState } from "react";

interface AccountInformationProps {
  profile: UserProfile | null;
  isTemporarilyAway: boolean;
  setIsTemporarilyAway: (value: boolean) => void;
  setIsEditDialogOpen: (value: boolean) => void;
}

const AccountInformation = ({
  profile,
  isTemporarilyAway,
  setIsTemporarilyAway,
  setIsEditDialogOpen,
}: AccountInformationProps) => {
  const { user } = useAuth();
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [lockedNumber, setLockedNumber] = useState<string | null>(null);

  const hasPhone = Boolean((profile as any)?.phone_number || lockedNumber);

  const handleSavePhone = async () => {
    const value = phoneInput.trim();
    if (!value) {
      toast.error("Please enter your phone number");
      return;
    }
    const normalized = normalizeZAPhoneNumber(value);
    if (!validateSAPhoneNumber(normalized)) {
      toast.error("Enter a valid South African phone number");
      return;
    }
    if (!user?.id) {
      toast.error("Not authenticated");
      return;
    }
    if (hasPhone) {
      toast.error("Phone number already set and cannot be changed");
      return;
    }

    setSavingPhone(true);
    try {
      // Fire auth metadata update in background (non-blocking)
      supabase.auth.updateUser({ data: { phone_number: normalized, phone: normalized } }).catch(() => {});

      // Persist to profiles table only if empty
      const { error } = await supabase
        .from("profiles")
        .update({ phone_number: normalized, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .is("phone_number", null);

      if (error) {
        console.error("Failed to save phone:", error);
        toast.error("Could not save phone number. Try again.");
        return;
      }

      // Optimistic lock without page reload
      setLockedNumber(normalized);
      toast.success("Phone number saved");
      setPhoneInput("");
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card className="border-2 border-purple-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
          <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
            <User className="h-6 w-6 text-purple-600" />
            Personal Information
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="ml-auto"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Name
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {(() => {
                    const fullName = (profile as any)?.full_name;
                    if (fullName) return fullName;
                    const fn = (profile as any)?.first_name;
                    const ln = (profile as any)?.last_name;
                    const combined = [fn, ln].filter(Boolean).join(" ");
                    return combined || profile?.name || "Not provided";
                  })()}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Email Address
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.email || "Not provided"}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Phone Number</span>
                </div>
                {hasPhone ? (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-gray-900">{(profile as any)?.phone_number || lockedNumber}</p>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-gray-500">Locked</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="e.g., 081 234 5678"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !savingPhone && phoneInput.trim()) {
                          handleSavePhone();
                        }
                      }}
                      disabled={savingPhone}
                      className="sm:max-w-xs"
                    />
                    <Button onClick={handleSavePhone} disabled={savingPhone || !phoneInput.trim()} className="bg-book-600 hover:bg-book-700">
                      {savingPhone ? "Saving..." : "Save"}
                    </Button>
                    <p className="text-xs text-gray-500">You can only set this once.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Member Since
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unknown"}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">
                    Account Status
                  </span>
                </div>
                <Badge className="bg-green-600 text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  Active & Verified
                </Badge>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card className="border-2 border-blue-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
          <CardTitle className="text-xl flex items-center gap-3">
            <Settings className="h-5 w-5 text-blue-600" />
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Temporarily Away Toggle */}
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4 text-orange-600" />
                  <Label
                    htmlFor="temporarily-away"
                    className="text-base font-medium"
                  >
                    Temporarily Away
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  Pause your listings when you're unavailable. Your books will
                  be hidden from search results.
                </p>
              </div>
              <Switch
                id="temporarily-away"
                checked={isTemporarilyAway}
                onCheckedChange={setIsTemporarilyAway}
              />
            </div>

            {isTemporarilyAway && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <Pause className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Your listings are currently paused and hidden from other
                  users. Turn off "Temporarily Away" to make them visible again.
                </AlertDescription>
              </Alert>
            )}

            {/* Account Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Account Information
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your account is secure and verified</li>
                <li>• Profile changes are updated immediately</li>
                <li>• Email notifications are enabled by default</li>
                <li>• Your data is protected and encrypted</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card className="border-2 border-red-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 rounded-t-lg">
          <CardTitle className="text-xl flex items-center gap-3 text-red-700">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your personal information is secure and only shared with buyers
                during transactions. We never share your contact details
                publicly.
              </AlertDescription>
            </Alert>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <UserX className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800 mb-2">
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-600 mb-4">
                    Permanently delete your account and all associated data.
                    This action cannot be undone and will remove all your
                    listings.
                  </p>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => {

                      alert(
                        "Account deletion feature will be implemented soon.",
                      );
                    }}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountInformation;
