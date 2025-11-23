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
        return <Truck className="h-8 w-8 text-blue-600" />;
      default:
        return <Package className="h-8 w-8 text-gray-600" />;
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
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter tracking number (e.g., BOG123456789)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrack()}
                className="text-base h-12 border-2 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
              />
            </div>
            <Button
              onClick={handleTrack}
              disabled={loading || !trackingNumber.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 font-semibold rounded-lg transition"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                  Tracking...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Track
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="border-0 shadow-lg">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">Tracking your package...</p>
                  <p className="text-sm text-gray-600 mt-1">Please wait a moment</p>
                </div>
              </div>
            </CardContent>
          </div>
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
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                    <div className="bg-white rounded-full p-2 sm:p-3 shadow-md flex-shrink-0">
                      {getProviderIcon(trackingData.provider)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                        {trackingData.courier_name ? trackingData.courier_name : trackingData.provider === "bobgo" ? "Bob Go" : "Shipment"}
                      </CardTitle>
                      <p className="text-gray-600 text-xs sm:text-sm mt-1 break-all">
                        Tracking: <span className="font-mono font-semibold text-gray-900">{trackingData.tracking_number}</span>
                      </p>
                      {trackingData.merchant_name && (
                        <p className="text-gray-500 text-xs mt-1 truncate">
                          {trackingData.merchant_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(trackingData.status)} text-xs sm:text-base py-1 sm:py-2 px-2 sm:px-4 font-semibold border-2 flex-shrink-0`}
                  >
                    {getStatusText(trackingData.status)}
                  </Badge>
                </div>
              </CardHeader>
            </div>
            <CardContent className="space-y-4 sm:space-y-5 p-4 sm:p-6">
              {/* Current Status */}
              <div className={`flex items-start sm:items-center space-x-3 sm:space-x-4 p-3 sm:p-5 rounded-xl border-2 ${
                trackingData.status === "delivered" || trackingData.status === "ready-for-pickup"
                  ? "bg-green-50 border-green-200"
                  : trackingData.status === "cancelled"
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}>
                <div className="flex-shrink-0">
                  {getStatusIcon(trackingData.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-base sm:text-lg">
                    {getStatusText(trackingData.status)}
                  </h4>
                  {trackingData.current_location && (
                    <p className="text-xs sm:text-sm text-gray-700 mt-1 flex items-center break-words">
                      <MapPin className="h-3 sm:h-4 w-3 sm:w-4 mr-2 text-gray-600 flex-shrink-0" />
                      {trackingData.current_location}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                  <div className="flex items-start space-x-2 mb-2">
                    <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estimated Delivery</p>
                  </div>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm break-words">
                    {trackingData.estimated_delivery && trackingData.estimated_delivery.trim() ? formatDateTime(trackingData.estimated_delivery) : "Not specified"}
                  </p>
                </div>
                {trackingData.actual_delivery && trackingData.actual_delivery.trim() && (
                  <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                    <div className="flex items-start space-x-2 mb-2">
                      <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Delivered</p>
                    </div>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm break-words">
                      {formatDateTime(trackingData.actual_delivery)}
                    </p>
                  </div>
                )}
              </div>

              {/* Courier & Service Info */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  {trackingData.courier_name && (
                    <div className="bg-white rounded p-2 sm:p-3 text-center border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Courier</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 break-words">{trackingData.courier_name}</p>
                    </div>
                  )}
                  {trackingData.service_level && (
                    <div className="bg-white rounded p-2 sm:p-3 text-center border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Service</p>
                      <p className="text-xs font-bold text-gray-900 break-words">{trackingData.service_level}</p>
                    </div>
                  )}
                  {trackingData.created_at && (
                    <div className="bg-white rounded p-2 sm:p-3 text-center border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Created</p>
                      <p className="text-xs font-bold text-gray-900">{formatDateTime(trackingData.created_at)}</p>
                    </div>
                  )}
                  {trackingData.last_updated && (
                    <div className="bg-white rounded p-2 sm:p-3 text-center border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Updated</p>
                      <p className="text-xs font-bold text-gray-900">{formatDateTime(trackingData.last_updated)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Signature */}
              {trackingData.recipient_signature && (
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <User className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase">Signed by</p>
                    <p className="font-medium text-gray-900">
                      {trackingData.recipient_signature}
                    </p>
                  </div>
                </div>
              )}

              {/* External Tracking Link */}
              <div className="pt-2 flex gap-2 flex-wrap">
                <Button
                  onClick={() => {
                    const url = trackingData.tracking_url || `https://track.bobgo.co.za/${encodeURIComponent(trackingData.tracking_number)}`;
                    window.open(url, "_blank");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Courier Website
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tracking History */}
          <Card className="border-0 shadow-lg">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-orange-100">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-lg sm:text-xl font-bold text-gray-900">
                  <div className="bg-white rounded-full p-1.5 sm:p-2 shadow-md flex-shrink-0">
                    <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-orange-600" />
                  </div>
                  <span>Tracking History</span>
                </CardTitle>
              </CardHeader>
            </div>
            <CardContent className="p-3 sm:p-6">
              {trackingData.events.length > 0 ? (
                <div className="space-y-0">
                  {trackingData.events.map((event, index) => (
                    <div key={index} className="relative">
                      {/* Timeline line - hidden on mobile for cleaner look */}
                      {index < trackingData.events.length - 1 && (
                        <div className="absolute left-4 sm:left-8 top-14 sm:top-16 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-gray-200"></div>
                      )}

                      {/* Event item */}
                      <div className="flex gap-2 sm:gap-4 pb-6">
                        {/* Icon circle */}
                        <div className="relative flex-shrink-0 mt-1">
                          <div className="flex items-center justify-center h-8 sm:h-12 w-8 sm:w-12 rounded-full bg-white border-2 sm:border-3 border-blue-500 shadow-md relative z-10">
                            {getStatusIcon(event.status)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition hover:border-blue-300 min-w-0">
                          <div className="flex flex-col gap-1 mb-2">
                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm break-words">
                              {event.description}
                            </h4>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit">
                              {formatDateTime(event.timestamp)}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-start text-xs sm:text-sm text-gray-600 mt-2 gap-1">
                              <MapPin className="h-3 sm:h-4 w-3 sm:w-4 mr-1 flex-shrink-0 text-gray-400 mt-0.5" />
                              <span className="font-medium break-words">{event.location}</span>
                            </div>
                          )}

                          {event.signature && (
                            <div className="flex items-center text-xs sm:text-sm text-green-700 bg-green-50 rounded p-2 mt-2 border border-green-200 gap-1">
                              <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 mr-1 flex-shrink-0" />
                              <span className="font-medium break-words">Signed by: {event.signature}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Package className="h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-600 font-medium text-sm sm:text-base">
                    No tracking events available yet
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    Check back soon for updates
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
