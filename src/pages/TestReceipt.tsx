import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RotateCw } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface TestReceipt {
  order_id: string;
  payment_reference: string;
  created_at: string;
  book_title: string;
  book_id: string;
  book_price: number;
  seller_id: string;
  buyer_id: string;
  delivery_method: string;
  delivery_price: number;
  platform_fee: number;
  total_paid: number;
  status: string;
}

const TestReceipt: React.FC = () => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receipt, setReceipt] = React.useState<TestReceipt | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const bookTitles = [
    "The Great Gatsby",
    "To Kill a Mockingbird",
    "1984",
    "Pride and Prejudice",
    "The Catcher in the Rye",
    "Brave New World",
    "The Lord of the Rings",
    "Harry Potter and the Philosopher's Stone",
    "The Hobbit",
    "Dune",
    "The Midnight Library",
    "Educated",
    "Atomic Habits",
    "Sapiens",
    "The Art of War",
  ];

  const deliveryMethods = [
    "Standard Delivery",
    "Express Delivery",
    "Same Day Delivery",
    "Locker Pickup",
    "Store Pickup",
  ];

  const generateRandomReceipt = () => {
    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const randomBookPrice = Math.floor(Math.random() * 500) + 50;
    const deliveryPrice = [50, 100, 150, 200][Math.floor(Math.random() * 4)];

    const newReceipt: TestReceipt = {
      order_id: `ORD-${randomId}-${Date.now().toString(36).toUpperCase()}`,
      payment_reference: `PAY-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      created_at: new Date().toISOString(),
      book_title: bookTitles[Math.floor(Math.random() * bookTitles.length)],
      book_id: `BOOK-${Math.floor(Math.random() * 10000)}`,
      book_price: randomBookPrice,
      seller_id: `SELLER-${Math.floor(Math.random() * 10000)}`,
      buyer_id: `BUYER-${Math.floor(Math.random() * 10000)}`,
      delivery_method: deliveryMethods[Math.floor(Math.random() * deliveryMethods.length)],
      delivery_price: deliveryPrice,
      platform_fee: 20,
      total_paid: randomBookPrice + deliveryPrice + 20,
      status: "completed",
    };

    setReceipt(newReceipt);
    toast.success("New receipt generated!");
  };

  const downloadReceipt = async () => {
    if (!receiptRef.current || !receipt) {
      toast.error("Receipt not found");
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
      link.download = `receipt-${receipt.order_id}.png`;
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

  React.useEffect(() => {
    generateRandomReceipt();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Test Receipt Generator</h1>
          <p className="text-gray-600">Generate random receipts and download them as PNG images</p>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4 mb-8 justify-center flex-wrap">
          <Button onClick={generateRandomReceipt} size="lg" className="gap-2">
            <RotateCw className="w-5 h-5" />
            Generate New Receipt
          </Button>
          <Button
            onClick={downloadReceipt}
            disabled={isDownloading || !receipt}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <Download className="w-5 h-5" />
            {isDownloading ? "Downloading..." : "Download as PNG"}
          </Button>
        </div>

        {/* Receipt Preview */}
        {receipt && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="text-lg font-mono font-bold">{receipt.order_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Reference</p>
                <p className="text-lg font-mono">{receipt.payment_reference}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="text-lg">{new Date(receipt.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-green-600">PAID</p>
              </div>
            </div>

            <hr className="my-6" />

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>📚 Book Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-2">{receipt.book_title}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <span>Book ID: {receipt.book_id}</span>
                  <span className="text-right">R{receipt.book_price.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>👤 Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p className="text-gray-600">Seller ID</p>
                  <p className="font-mono">{receipt.seller_id}</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-600">Buyer ID</p>
                  <p className="font-mono">{receipt.buyer_id}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>🚚 Delivery Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <span className="font-medium">{receipt.delivery_method}</span>
                  <span className="font-bold">R{receipt.delivery_price.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💰 Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Book Price</span>
                  <span>R{receipt.book_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>R{receipt.delivery_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Platform Fee</span>
                  <span>R{receipt.platform_fee.toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Paid</span>
                  <span className="text-green-600">R{receipt.total_paid.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hidden Receipt for Download */}
        {receipt && (
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    fontSize: "14px",
                  }}
                >
                  <div>
                    <p style={{ margin: "0 0 5px 0", color: "#4e7a63", fontWeight: "bold" }}>
                      Order ID
                    </p>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "16px",
                        fontWeight: "bold",
                        fontFamily: "monospace",
                      }}
                    >
                      {receipt.order_id}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 5px 0", color: "#4e7a63", fontWeight: "bold" }}>
                      Payment Reference
                    </p>
                    <p style={{ margin: "0", fontSize: "14px", fontFamily: "monospace" }}>
                      {receipt.payment_reference}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 5px 0", color: "#4e7a63", fontWeight: "bold" }}>
                      Date
                    </p>
                    <p style={{ margin: "0" }}>
                      {new Date(receipt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 5px 0", color: "#4e7a63", fontWeight: "bold" }}>
                      Time
                    </p>
                    <p style={{ margin: "0" }}>
                      {new Date(receipt.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "30px 0" }} />

              {/* Book Details */}
              <div style={{ marginBottom: "30px" }}>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "15px",
                    color: "#1f4e3d",
                  }}
                >
                  📚 Book Details
                </h2>
                <div
                  style={{
                    backgroundColor: "#f3fef7",
                    padding: "15px",
                    borderRadius: "8px",
                  }}
                >
                  <p style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "bold" }}>
                    {receipt.book_title}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "13px" }}>
                    <p style={{ margin: "0", color: "#4e7a63" }}>Book ID: {receipt.book_id}</p>
                    <p style={{ margin: "0", textAlign: "right", fontWeight: "bold" }}>
                      R{receipt.book_price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div style={{ marginBottom: "30px" }}>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "15px",
                    color: "#1f4e3d",
                  }}
                >
                  👤 Transaction Details
                </h2>
                <div
                  style={{
                    backgroundColor: "#f3fef7",
                    padding: "15px",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                >
                  <p style={{ margin: "0 0 8px 0", color: "#4e7a63" }}>
                    Seller ID: {receipt.seller_id}
                  </p>
                  <p style={{ margin: "0", color: "#4e7a63" }}>Buyer ID: {receipt.buyer_id}</p>
                </div>
              </div>

              {/* Delivery Information */}
              <div style={{ marginBottom: "30px" }}>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "15px",
                    color: "#1f4e3d",
                  }}
                >
                  🚚 Delivery Information
                </h2>
                <div
                  style={{
                    backgroundColor: "#f3fef7",
                    padding: "15px",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <p style={{ margin: "0", color: "#4e7a63" }}>
                      Method: {receipt.delivery_method}
                    </p>
                    <p style={{ margin: "0", textAlign: "right", fontWeight: "bold" }}>
                      R{receipt.delivery_price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "30px 0" }} />

              {/* Price Breakdown */}
              <div style={{ marginBottom: "30px" }}>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "15px",
                    color: "#1f4e3d",
                  }}
                >
                  💰 Price Breakdown
                </h2>
                <div
                  style={{
                    backgroundColor: "#f3fef7",
                    padding: "15px",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Book Price</span>
                    <span>R{receipt.book_price.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Delivery Fee</span>
                    <span>R{receipt.delivery_price.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span>Platform Fee</span>
                    <span>R{receipt.platform_fee.toFixed(2)}</span>
                  </div>
                  <hr style={{ border: "none", borderTop: "1px solid #d0d0d0", margin: "12px 0" }} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#3ab26f",
                    }}
                  >
                    <span>Total Paid</span>
                    <span>R{receipt.total_paid.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div style={{ marginBottom: "30px" }}>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    marginBottom: "15px",
                    color: "#1f4e3d",
                  }}
                >
                  ✅ Status
                </h2>
                <div
                  style={{
                    backgroundColor: "#d4f4e8",
                    padding: "15px",
                    borderRadius: "8px",
                    color: "#1f4e3d",
                    fontWeight: "bold",
                  }}
                >
                  PAID - Payment completed successfully
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  textAlign: "center",
                  marginTop: "40px",
                  paddingTop: "20px",
                  borderTop: "1px solid #e0e0e0",
                  fontSize: "12px",
                  color: "#4e7a63",
                }}
              >
                <p style={{ margin: "10px 0" }}>Thank you for your purchase!</p>
                <p style={{ margin: "10px 0", fontStyle: "italic" }}>
                  "Pre-Loved Pages, New Adventure"
                </p>
                <p style={{ margin: "10px 0" }}>© ReBooked Solutions</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestReceipt;
