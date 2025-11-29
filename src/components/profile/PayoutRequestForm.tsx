import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { PayoutService } from "@/services/payoutService";
import { toast } from "sonner";

interface PayoutRequestFormProps {
  availableBalance: number;
  onSubmitted: () => void;
  onCancel: () => void;
}

const PayoutRequestForm: React.FC<PayoutRequestFormProps> = ({
  availableBalance,
  onSubmitted,
  onCancel,
}) => {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const amountValue = amount ? parseFloat(amount) : 0;
  const isValid = amountValue > 0 && amountValue <= (availableBalance || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      toast.error("Invalid amount");
      return;
    }

    try {
      setLoading(true);
      const result = await PayoutService.createPayoutRequest({
        amount: amountValue,
        notes: notes || undefined,
      });

      if (result.success) {
        setSubmitted(true);
        toast.success("Payout request created successfully!");
        setTimeout(() => {
          onSubmitted();
        }, 2000);
      } else {
        toast.error(result.error || "Failed to create payout request");
      }
    } catch (error) {
      toast.error("An error occurred while creating the payout request");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payout Request Submitted</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Request Submitted
            </h3>
            <p className="text-gray-600 text-center text-sm mb-4">
              Your payout request for {PayoutService.formatZAR(amountValue)} has been submitted. Our team will process it shortly.
            </p>
            <p className="text-gray-500 text-xs text-center">
              You'll be notified once your payment is sent to your banking account.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Withdraw funds from your available balance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Balance Info */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Available Balance:</strong> {PayoutService.formatZAR(availableBalance)}
            </AlertDescription>
          </Alert>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Amount (ZAR)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={loading}
              className="border-gray-300"
            />
            {amount && !isValid && (
              <p className="text-sm text-red-600">
                Amount must be between R0 and {PayoutService.formatZAR(availableBalance)}
              </p>
            )}
            {amount && isValid && (
              <p className="text-sm text-green-600">
                ✓ Valid amount
              </p>
            )}
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payout request..."
              disabled={loading}
              className="border-gray-300 resize-none"
              rows={3}
            />
          </div>

          {/* Info Alert */}
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              Payout requests are processed within 2-3 business days to your registered banking account.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={!isValid || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutRequestForm;
