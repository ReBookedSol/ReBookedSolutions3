import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  listingsCount: number;
  totalSales: number;
  averageRating: number;
}

interface UserProfileViewerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileViewer = ({
  userId,
  isOpen,
  onClose,
}: UserProfileViewerProps) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) {
      setUserProfile(null);
      setError(null);
      return;
    }

    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (queryError) {
          throw new Error(queryError.message);
        }

        setUserProfile(data as UserProfile);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load user profile"
        );
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View detailed information about this user
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {userProfile && !loading && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Name
                    </label>
                    <p className="mt-1 font-semibold text-gray-900">
                      {userProfile.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <p className="mt-1 font-semibold text-gray-900">
                      {userProfile.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        variant={
                          userProfile.status === "active"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {userProfile.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Member Since
                    </label>
                    <p className="mt-1 font-semibold text-gray-900">
                      {new Date(userProfile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">
                      Total Listings
                    </p>
                    <p className="mt-2 text-2xl font-bold text-blue-600">
                      {userProfile.listingsCount}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">
                      Total Sales
                    </p>
                    <p className="mt-2 text-2xl font-bold text-green-600">
                      {userProfile.totalSales}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg col-span-2">
                    <p className="text-sm font-medium text-gray-600">
                      Average Rating
                    </p>
                    <p className="mt-2 text-2xl font-bold text-yellow-600">
                      {userProfile.averageRating.toFixed(1)} ★
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Created
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(userProfile.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Last Updated
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(userProfile.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileViewer;
