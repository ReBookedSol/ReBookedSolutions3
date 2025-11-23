import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  ExternalLink,
  Calendar,
  User,
} from "lucide-react";
import {
  trackUnifiedShipment,
  UnifiedTrackingResponse,
} from "@/services/unifiedDeliveryService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UnifiedTrackingComponentProps {
  initialTrackingNumber?: string;
  provider?: "bobgo";
  onClose?: () => void;
}

const UnifiedTrackingComponent: React.FC<UnifiedTrackingComponentProps> = ({
  initialTrackingNumber = "",
  provider,
  onClose,
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [trackingData, setTrackingData] =
    useState<UnifiedTrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrackingNumber) {
      handleTrack();
    }
  }, [initialTrackingNumber, provider]);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Tracking shipment:", { trackingNumber, provider });

      const data = await trackUnifiedShipment(trackingNumber.trim(), provider);
      setTrackingData(data);

      if (data.status === "delivered") {
        toast.success("Package delivered!");
      }
    } catch (err) {
      console.error("Error tracking shipment:", err);
      setError(
        "Unable to track this shipment. Please check the tracking number and try again.",
      );
      toast.error("Failed to track shipment");
    } finally {
      setLoading(false);
    }
  };


  const getStatusIcon = (status: string) => {
    const normalizedStatus = (status || "").toLowerCase().replace(/_/g, "-");
    switch (normalizedStatus) {
      case "delivered":
      case "ready-for-pickup":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "out-for-delivery":
      case "out_for_delivery":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "in-transit":
      case "in_transit":
        return <Package className="h-5 w-5 text-orange-500" />;
      case "collected":
      case "awaiting-dropoff":
        return <CheckCircle className="h-5 w-5 text-yellow-500" />;
      case "failed":
      case "failed-delivery":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "cancelled":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = (status || "").toLowerCase().replace(/_/g, "-");
    switch (normalizedStatus) {
      case "delivered":
      case "ready-for-pickup":
        return "bg-green-100 text-green-700 border-green-200";
      case "out-for-delivery":
      case "out_for_delivery":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in-transit":
      case "in_transit":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "collected":
      case "awaiting-dropoff":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "failed":
      case "failed-delivery":
        return "bg-red-100 text-red-700 border-red-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    const normalizedStatus = (status || "").toLowerCase().replace(/_/g, "-");
    switch (normalizedStatus) {
      case "pending":
      case "awaiting-dropoff":
        return "Order Confirmed";
      case "collected":
        return "Collected";
      case "in-transit":
      case "in_transit":
        return "In Transit";
      case "out-for-delivery":
      case "out_for_delivery":
        return "Out for Delivery";
      case "delivered":
      case "ready-for-pickup":
        return "Delivered";
      case "failed":
      case "failed-delivery":
        return "Delivery Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return status || "Unknown Status";
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "bobgo":
        return "🚚";
      default:
        return "🚛";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Track Your Package
        </h2>
        <p className="text-gray-600">
          Enter your tracking number to see real-time delivery updates
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter tracking number (e.g., BOG123456789)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrack()}
                className="text-lg"
              />
            </div>
            <Button
              onClick={handleTrack}
              disabled={loading || !trackingNumber.trim()}
              className="sm:px-8"
            >
              {loading ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <LoadingSpinner />
            <span className="ml-2">Tracking your package...</span>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Tracking Failed
            </h3>
            <p className="text-red-700 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tracking Results */}
      {trackingData && (
        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-2xl">
                    {getProviderIcon(trackingData.provider)}
                  </span>
                  <div className="flex-1">
                    <CardTitle className="text-xl">
                      {trackingData.courier_name ? trackingData.courier_name : trackingData.provider === "bobgo" ? "Bob Go" : "Shipment"}
                    </CardTitle>
                    <p className="text-gray-600 text-sm">
                      Tracking: {trackingData.tracking_number}
                    </p>
                    {trackingData.merchant_name && (
                      <p className="text-gray-500 text-xs">
                        {trackingData.merchant_name}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={getStatusColor(trackingData.status)}
                >
                  {getStatusText(trackingData.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Status */}
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                {getStatusIcon(trackingData.status)}
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {getStatusText(trackingData.status)}
                  </h4>
                  {trackingData.current_location && (
                    <p className="text-sm text-gray-600">
                      Location: {trackingData.current_location}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Estimated Delivery</p>
                    <p className="font-medium">
                      {trackingData.estimated_delivery ? formatDateTime(trackingData.estimated_delivery) : "Not available"}
                    </p>
                  </div>
                </div>
                {trackingData.actual_delivery && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Delivered</p>
                      <p className="font-medium">
                        {formatDateTime(trackingData.actual_delivery)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Courier & Service Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t">
                {trackingData.courier_name && (
                  <div>
                    <p className="text-sm text-gray-600">Courier</p>
                    <p className="font-medium">{trackingData.courier_name}</p>
                  </div>
                )}
                {trackingData.service_level && (
                  <div>
                    <p className="text-sm text-gray-600">Service Level</p>
                    <p className="font-medium text-sm">{trackingData.service_level}</p>
                  </div>
                )}
                {trackingData.created_at && (
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium text-sm">{formatDateTime(trackingData.created_at)}</p>
                  </div>
                )}
                {trackingData.last_updated && (
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium text-sm">{formatDateTime(trackingData.last_updated)}</p>
                  </div>
                )}
              </div>

              {/* Delivery Signature */}
              {trackingData.recipient_signature && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Signed by</p>
                    <p className="font-medium">
                      {trackingData.recipient_signature}
                    </p>
                  </div>
                </div>
              )}

              {/* External Tracking Link */}
              <div className="pt-2 flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = trackingData.tracking_url || `https://track.bobgo.co.za/${encodeURIComponent(trackingData.tracking_number)}`;
                    window.open(url, "_blank");
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Courier Website
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tracking History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Tracking History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trackingData.events.length > 0 ? (
                <div className="space-y-4">
                  {trackingData.events.map((event, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {event.description}
                              </p>
                              {event.location && (
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 whitespace-nowrap">
                              {formatDateTime(event.timestamp)}
                            </p>
                          </div>
                          {event.signature && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ Signed by: {event.signature}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No tracking events available yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <div className="flex justify-center">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default UnifiedTrackingComponent;
