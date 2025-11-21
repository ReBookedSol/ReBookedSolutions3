import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { WalletService, WalletBalance, WalletTransaction } from "@/services/walletService";
import { toast } from "sonner";
import PayoutRequestForm from "./PayoutRequestForm";

const WalletTab: React.FC = () => {
  const [balance, setBalance] = useState<WalletBalance>({
    available_balance: 0,
    pending_balance: 0,
    total_earned: 0,
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [balanceData, transactionData] = await Promise.all([
        WalletService.getWalletBalance(),
        WalletService.getTransactionHistory(),
      ]);

      setBalance(balanceData);
      setTransactions(transactionData);
    } catch (error) {
      console.error("Error loading wallet data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutSubmitted = () => {
    setShowPayoutForm(false);
    loadWalletData();
  };

  if (loading) {
    return (
      <Card className="border-2 border-blue-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-100">
          <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
            <Wallet className="h-6 w-6 text-blue-600" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-600">Available Balance</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {WalletService.formatZAR(balance.available_balance)}
            </div>
            <p className="text-xs text-gray-500 mt-2">Ready to withdraw</p>
          </CardContent>
        </Card>

        {/* Pending Balance */}
        <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-600">Pending Payout</CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {WalletService.formatZAR(balance.pending_balance)}
            </div>
            <p className="text-xs text-gray-500 mt-2">Being processed</p>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-600">Total Earned</CardTitle>
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {WalletService.formatZAR(balance.total_earned)}
            </div>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => setShowPayoutForm(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          disabled={balance.available_balance === 0}
        >
          <TrendingDown className="h-4 w-4 mr-2" />
          Request Payout
        </Button>
        <Button
          onClick={loadWalletData}
          variant="outline"
        >
          Refresh
        </Button>
      </div>

      {/* Payout Form Modal */}
      {showPayoutForm && (
        <PayoutRequestForm
          availableBalance={balance?.available_balance || 0}
          onSubmitted={handlePayoutSubmitted}
          onCancel={() => setShowPayoutForm(false)}
        />
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {tx.type === "credit" ? (
                        <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{tx.reason || "Transaction"}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right flex-shrink-0">
                    <div className={`font-bold ${WalletService.getTransactionTypeColor(tx.type)}`}>
                      {tx.type === "credit" ? "+" : "-"}
                      {WalletService.formatZAR(tx.amount)}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>How it works:</strong> When a buyer marks a book as received, 90% of the book price is automatically added to your available balance. You can request a payout anytime.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default WalletTab;
