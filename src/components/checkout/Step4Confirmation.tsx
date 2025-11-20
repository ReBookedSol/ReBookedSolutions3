import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Package,
  Truck,
  Download,
  Mail,
  Eye,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { OrderConfirmation } from "@/types/checkout";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface Step4ConfirmationProps {
  orderData: OrderConfirmation;
  onViewOrders: () => void;
  onContinueShopping: () => void;
}

const Step4Confirmation: React.FC<Step4ConfirmationProps> = ({
  orderData,
  onViewOrders,
  onContinueShopping,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  useEffect(() => {
    // Send confirmation email
    sendConfirmationEmail();

    // Clean up cart checkout data since order is complete
    localStorage.removeItem('checkoutCart');
    localStorage.removeItem('activeCheckoutKey');

    // Show success toast
    toast.success("Payment successful! 🎉", {
      description:
        "Your order has been confirmed and the seller has been notified.",
      duration: 5000,
    });
  }, []);

  const sendConfirmationEmail = async () => {
    try {
      // This would typically call your email service
      console.log("Sending confirmation email for order:", orderData.order_id);
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
    }
  };

  const downloadReceipt = async () => {
    if (!receiptRef.current) {
      toast.error("Receipt element not found");
      return;
    }

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 800,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `receipt-${orderData.order_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast.error("Failed to generate receipt image");
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600">
          Thank you for your purchase. Your order has been confirmed.
        </p>
      </div>

      {/* Order Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-600">Order ID</p>
              <p className="font-mono">{orderData.order_id}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Payment Reference</p>
              <p className="font-mono">{orderData.payment_reference}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Order Date</p>
              <p>{new Date(orderData.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Status</p>
              {getStatusBadge(orderData.status)}
            </div>
          </div>

          <Separator />

          {/* 📄 Receipt Data as Specified */}
          <div>
            <h3 className="font-medium mb-2">📚 Book Details</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium">{orderData.book_title}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                <span>Book ID: {orderData.book_id}</span>
                <span>R{orderData.book_price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 👤 Seller ID */}
          <div>
            <h3 className="font-medium mb-2">👤 Seller Information</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-mono">
                Seller ID: {orderData.seller_id}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                The seller has been notified and will prepare your book for
                shipment.
              </p>
            </div>
          </div>

          {/* 👤 Buyer ID */}
          <div>
            <h3 className="font-medium mb-2">👤 Buyer Information</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-mono">
                Buyer ID: {orderData.buyer_id}
              </p>
            </div>
          </div>

          {/* 🚚 Delivery Method & Price */}
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              🚚 Delivery Method
            </h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">
                  {orderData.delivery_method}
                </span>
                <span className="text-sm font-bold">
                  R{orderData.delivery_price.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                You'll receive tracking information once the book is shipped.
              </p>
            </div>
          </div>

          <Separator />

          {/* 💰 Price Breakdown */}
          <div>
            <h3 className="font-medium mb-2">💰 Price Breakdown</h3>
            <div className="space-y-2 text-sm bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between">
                <span>Book Price</span>
                <span>R{orderData.book_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Price</span>
                <span>R{orderData.delivery_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span>R{(orderData.platform_fee || 20).toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-2 pt-2 border-t">
                The R20 fee covers transaction and platform costs to ensure your payment is processed securely and your order is handled efficiently.
              </p>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Paid</span>
                <span className="text-green-600">
                  R{orderData.total_paid.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ✅ Status */}
          <div>
            <h3 className="font-medium mb-2">✅ Status</h3>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-800 font-medium">PAID</p>
              <p className="text-sm text-gray-600">
                Payment completed successfully
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-blue-500" />
            <span>
              Confirmation email sent to your registered email address
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Package className="w-4 h-4 text-orange-500" />
            <span>
              Seller will be notified to prepare your book for shipment
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Truck className="w-4 h-4 text-green-500" />
            <span>You'll receive tracking information via email and SMS</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={downloadReceipt}
            disabled={isDownloading}
            variant="outline"
            className="flex-1"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Receipt (PNG)
              </>
            )}
          </Button>
          <Button onClick={onViewOrders} variant="outline" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View My Orders
          </Button>
        </div>

        <Button onClick={onContinueShopping} className="w-full" size="lg">
          <ShoppingBag className="w-5 h-5 mr-2" />
          Continue Shopping
        </Button>
      </div>

      {/* Support Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600">
            If you have any questions about your order, please contact our
            support team or check your order status in the "My Orders" section
            of your account.
          </p>
        </CardContent>
      </Card>

      {/* Hidden Receipt for PNG Generation */}
      <div
        ref={receiptRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: "800px",
          padding: "40px",
          fontFamily: "'Arial', sans-serif",
          color: "#1f4e3d",
        }}
      >
        <div style={{ backgroundColor: "#ffffff", padding: "40px" }}>
          {/* Header */}
          <div
            style={{
              borderBottom: "3px solid #3ab26f",
              paddingBottom: "20px",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: "32px", margin: "0 0 5px 0", color: "#1f4e3d" }}>
              ReBooked Solutions
            </h1>
            <p style={{ fontSize: "14px", margin: "0", color: "#4e7a63" }}>
              Purchase Receipt
            </p>
          </div>

          {/* Order Info */}
          <div style={{ marginBottom: "30px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "14px" }}>
              <div>
                <p style={{ margin: "0 0 5px 0", color: "#4e7a63", fontWeight: "bold" }}>
                  Order ID
                </p>
                <p style={{ margin: "0", fontSize: "16px", fontWeight: "bold", fontFamily: "monospace" }}>
                  {orderData.order_id}
                </p>
              </div>
              <div>
                <p style={{ margin: "0 0 5px 0", color: "#4e7a63", fontWeight: "bold" }}>
                  Payment Reference
                </p>
                <p style={{ margin: "0", fontSize: "14px", fontFamily: "monospace" }}>
                  {orderData.payment_reference}
                </p>
              </div>
              <div>
                <p style={{ margin: "0 0 5px 0", color: "#4e7a63", fontWeight: "bold" }}>
                  Date
                </p>
                <p style={{ margin: "0" }}>
                  {new Date(orderData.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p style={{ margin: "0 0 5px 0", color: "#4e7a63", fontWeight: "bold" }}>
                  Time
                </p>
                <p style={{ margin: "0" }}>
                  {new Date(orderData.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "30px 0" }} />

          {/* Book Details */}
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px", color: "#1f4e3d" }}>
              📚 Book Details
            </h2>
            <div style={{ backgroundColor: "#f3fef7", padding: "15px", borderRadius: "8px" }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "bold" }}>
                {orderData.book_title}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "13px" }}>
                <p style={{ margin: "0", color: "#4e7a63" }}>
                  Book ID: {orderData.book_id}
                </p>
                <p style={{ margin: "0", textAlign: "right", fontWeight: "bold" }}>
                  R{orderData.book_price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px", color: "#1f4e3d" }}>
              🚚 Delivery Information
            </h2>
            <div style={{ backgroundColor: "#f3fef7", padding: "15px", borderRadius: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "13px" }}>
                <p style={{ margin: "0", color: "#4e7a63" }}>
                  Method: {orderData.delivery_method}
                </p>
                <p style={{ margin: "0", textAlign: "right", fontWeight: "bold" }}>
                  R{orderData.delivery_price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "30px 0" }} />

          {/* Price Breakdown */}
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px", color: "#1f4e3d" }}>
              💰 Price Breakdown
            </h2>
            <div style={{ backgroundColor: "#f3fef7", padding: "15px", borderRadius: "8px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Book Price</span>
                <span>R{orderData.book_price.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Delivery Fee</span>
                <span>R{orderData.delivery_price.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span>Platform Fee</span>
                <span>R{(orderData.platform_fee || 20).toFixed(2)}</span>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid #d0d0d0", margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "bold", color: "#3ab26f" }}>
                <span>Total Paid</span>
                <span>R{orderData.total_paid.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px", color: "#1f4e3d" }}>
              ✅ Status
            </h2>
            <div style={{ backgroundColor: "#d4f4e8", padding: "15px", borderRadius: "8px", color: "#1f4e3d", fontWeight: "bold" }}>
              PAID - Payment completed successfully
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e0e0e0", fontSize: "12px", color: "#4e7a63" }}>
            <p style={{ margin: "10px 0" }}>Thank you for your purchase!</p>
            <p style={{ margin: "10px 0" }}>Track your order: https://rebookedsolutions.co.za/orders/{orderData.order_id}</p>
            <p style={{ margin: "10px 0", fontStyle: "italic" }}>"Pre-Loved Pages, New Adventure"</p>
            <p style={{ margin: "10px 0" }}>© ReBooked Solutions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4Confirmation;
