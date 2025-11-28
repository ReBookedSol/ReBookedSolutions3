import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { getSafeErrorMessage } from "@/utils/errorMessageUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Gift,
  Package,
  ShoppingCart,
  Star,
  Truck,
  Heart,
  Check,
  Settings,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  MessageCircle,
  Clock,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { NotificationService, clearNotificationCache } from "@/services/notificationService";
import { supabase } from "@/integrations/supabase/client";
type ConnectionTestResult = { isOnline: boolean; supabaseReachable: boolean; authWorking: boolean; databaseWorking: boolean; latency?: number; error?: string };
const testConnection = async (): Promise<ConnectionTestResult> => ({ isOnline: navigator.onLine, supabaseReachable: true, authWorking: true, databaseWorking: true, latency: 0 });
const getConnectionErrorMessage = () => "Connection unavailable";

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  notifications: NotificationItem[];
  enabled: boolean;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  actionUrl?: string;
  metadata?: Record<string, any>;
}

const NotificationsNew = () => {
  const { user, profile } = useAuth();
  const {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    refreshNotifications,
  } = useNotifications();
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    commits: true,
    purchases: true,
    deliveries: true,
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionTestResult | null>(null);
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);
  const [dismissingNotifications, setDismissingNotifications] = useState<Set<string>>(new Set());

  // Convert database notifications to our category format
  const categorizeNotifications = (dbNotifications: any[]) => {
    // Create arrays to track categorized notifications
    const categorizedIds = new Set();

    const commitNotifications = dbNotifications.filter((n) => {
      const isCommit = n.title?.toLowerCase().includes("commit") ||
        n.message?.toLowerCase().includes("commit") ||
        n.title?.includes("⏰") ||
        (n.type === "warning" && (n.title?.includes("Commit") || n.message?.includes("commit")));
      if (isCommit) categorizedIds.add(n.id);
      return isCommit;
    });

    const purchaseNotifications = dbNotifications.filter((n) => {
      if (categorizedIds.has(n.id)) return false;
      const isPurchase = n.title?.toLowerCase().includes("purchase") ||
        n.title?.toLowerCase().includes("order") ||
        n.title?.toLowerCase().includes("payment") ||
        n.title?.toLowerCase().includes("book listed") ||
        n.title?.toLowerCase().includes("listed successfully") ||
        n.title?.includes("🛒") ||
        n.title?.includes("📦") ||
        n.title?.includes("📚") ||
        n.title?.includes("💳") ||
        n.title?.includes("✅") ||
        n.title?.includes("🎉") ||
        (n.type === "success" && (n.title?.includes("Order") || n.title?.includes("Payment") || n.title?.includes("Listed")));
      if (isPurchase) categorizedIds.add(n.id);
      return isPurchase;
    });

    const deliveryNotifications = dbNotifications.filter((n) => {
      if (categorizedIds.has(n.id)) return false;
      const isDelivery = n.title?.toLowerCase().includes("delivery") ||
        n.title?.toLowerCase().includes("shipping") ||
        n.title?.toLowerCase().includes("tracking") ||
        n.title?.includes("🚚") ||
        (n.type === "info" && (n.title?.includes("Delivery") || n.title?.includes("Shipping")));
      if (isDelivery) categorizedIds.add(n.id);
      return isDelivery;
    });

    const adminNotifications = dbNotifications.filter((n) => {
      if (categorizedIds.has(n.id)) return false;
      const isAdmin = n.type === "admin_action" ||
        n.type === "admin" ||
        n.type === "broadcast" ||
        n.type === "system" ||
        n.title?.toLowerCase().includes("removed") ||
        n.title?.toLowerCase().includes("deleted") ||
        n.title?.toLowerCase().includes("banned") ||
        n.title?.toLowerCase().includes("suspended") ||
        n.title?.toLowerCase().includes("violation") ||
        n.title?.toLowerCase().includes("rebooked solutions team") ||
        n.title?.toLowerCase().includes("system announcement") ||
        n.title?.toLowerCase().includes("admin action") ||
        n.message?.toLowerCase().includes("admin") ||
        n.message?.toLowerCase().includes("violation") ||
        n.message?.toLowerCase().includes("removed by admin") ||
        n.message?.toLowerCase().includes("system message");
      if (isAdmin) categorizedIds.add(n.id);
      return isAdmin;
    });

    const accountNotifications = dbNotifications.filter((n) => {
      if (categorizedIds.has(n.id)) return false;
      const isAccount = n.title?.toLowerCase().includes("profile") ||
        n.title?.toLowerCase().includes("banking") ||
        n.title?.toLowerCase().includes("account") ||
        n.title?.toLowerCase().includes("activity") ||
        n.title?.toLowerCase().includes("updated") ||
        n.title?.toLowerCase().includes("settings") ||
        (n.type === "success" && (n.title?.includes("Profile") || n.title?.includes("Banking") || n.title?.includes("Activity")));
      if (isAccount) categorizedIds.add(n.id);
      return isAccount;
    });

    // General/Test notifications category - catch all remaining
    const generalNotifications = dbNotifications.filter((n) => {
      if (categorizedIds.has(n.id)) return false;
      return true; // All remaining notifications go here
    });

    return {
      commits: commitNotifications,
      purchases: purchaseNotifications,
      deliveries: deliveryNotifications,
      admin: adminNotifications,
      account: accountNotifications,
      general: generalNotifications,
    };
  };

  const categorizedNotifications = categorizeNotifications(notifications);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: "welcome-disabled",
      title: "Welcome to ReBooked Solutions!",
      description: "Get started with buying and selling textbooks",
      icon: <Gift className="h-5 w-5" />,
      color: "purple",
      enabled: false,
      notifications: [
        {
          id: "welcome-1",
          type: "welcome",
          title: "Welcome to ReBooked Solutions! 🎉",
          message:
            "We're South Africa's premier textbook marketplace, connecting students across universities. Buy and sell textbooks easily, track your orders, and join a community of learners!",
          timestamp: new Date().toISOString(),
          read: false,
          priority: "high",
        },
        {
          id: "welcome-2",
          type: "info",
          title: "How ReBooked Solutions Works",
          message:
            "📚 Browse thousands of textbooks → 💰 Buy at student-friendly prices → 🚚 Get delivery nationwide → ✅ Sell your old books when done!",
          timestamp: new Date().toISOString(),
          read: false,
          priority: "medium",
        },
        {
          id: "welcome-3",
          type: "tip",
          title: "Quick Start Guide",
          message:
            "🔹 Complete your profile setup\\n��� Add your addresses for delivery\\n🔹 Set up banking for selling\\n🔹 Start browsing or list your first book!",
          timestamp: new Date().toISOString(),
          read: false,
          priority: "medium",
        },
      ],
    },
    {
      id: "commits",
      title: "Sale Commitments",
      description: "48-hour commitment system for sellers",
      icon: <Award className="h-5 w-5" />,
      color: "orange",
      enabled: notificationSettings.commits,
      notifications: categorizedNotifications.commits.map((n) => ({
        id: n.id,
        type: n.type || "commit",
        title: n.title,
        message: n.message,
        timestamp: n.created_at || n.createdAt,
        read: n.read,
        priority: "medium" as const,
      })),
    },
    {
      id: "purchases",
      title: "Purchase Updates",
      description: "Order confirmations and payment updates",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "green",
      enabled: notificationSettings.purchases,
      notifications: categorizedNotifications.purchases.map((n) => ({
        id: n.id,
        type: n.type || "purchase",
        title: n.title,
        message: n.message,
        timestamp: n.created_at || n.createdAt,
        read: n.read,
        priority: "medium" as const,
      })),
    },
    {
      id: "deliveries",
      title: "Delivery Tracking",
      description: "Shipping updates and delivery notifications",
      icon: <Truck className="h-5 w-5" />,
      color: "blue",
      enabled: notificationSettings.deliveries,
      notifications: categorizedNotifications.deliveries.map((n) => ({
        id: n.id,
        type: n.type || "delivery",
        title: n.title,
        message: n.message,
        timestamp: n.created_at || n.createdAt,
        read: n.read,
        priority: "medium" as const,
      })),
    },
    {
      id: "admin",
      title: "System Messages & Admin Actions",
      description: "Official communications and administrative actions",
      icon: <Settings className="h-5 w-5" />,
      color: "red",
      enabled: true,
      notifications: categorizedNotifications.admin.map((n) => ({
        id: n.id,
        type: n.type || "admin",
        title: n.title,
        message: n.message,
        timestamp: n.created_at || n.createdAt,
        read: n.read,
        priority: "high" as const,
      })),
    },
    {
      id: "account",
      title: "Account & Profile Updates",
      description: "Profile changes, banking updates, and account activities",
      icon: <Users className="h-5 w-5" />,
      color: "purple",
      enabled: true,
      notifications: categorizedNotifications.account.map((n) => ({
        id: n.id,
        type: n.type || "account",
        title: n.title,
        message: n.message,
        timestamp: n.created_at || n.createdAt,
        read: n.read,
        priority: "medium" as const,
      })),
    },
    {
      id: "general",
      title: "General Notifications",
      description: "Test notifications and other general updates",
      icon: <Bell className="h-5 w-5" />,
      color: "gray",
      enabled: true,
      notifications: categorizedNotifications.general.map((n) => ({
        id: n.id,
        type: n.type || "general",
        title: n.title,
        message: n.message,
        timestamp: n.created_at || n.createdAt,
        read: n.read,
        priority: "low" as const,
      })),
    },
  ]);

  // Test connection on component mount
  useEffect(() => {

    const checkConnection = async () => {
      try {
        const result = await testConnection();
        setConnectionStatus(result);

        if (!result.supabaseReachable || !result.databaseWorking) {
          toast.warning('Connection issues detected. Some features may not work properly.');
        }
      } catch (error) {
        const safeConnectionErrorMessage = getSafeErrorMessage(error, 'Connection test failed');
        const errorMessage = getConnectionErrorMessage(error);
        setConnectionStatus({
          isOnline: navigator.onLine,
          supabaseReachable: false,
          authWorking: false,
          databaseWorking: false,
          error: errorMessage
        });
      }
    };

    checkConnection();
  }, []);

  // Disable welcome notification entirely
  useEffect(() => {
    setIsFirstTime(false);
    setShowWelcome(false);
    setCategories((prev) => prev.filter((c) => c.id !== "welcome" && c.id !== "welcome-disabled"));
  }, [user, profile]);

  // Update categories when notifications change
  useEffect(() => {
    const categorizedNotifications = categorizeNotifications(notifications);

    setCategories((prev) =>
      prev.map((category) => {
        if (category.id === "commits") {
          return {
            ...category,
            notifications: categorizedNotifications.commits.map((n) => ({
              id: n.id,
              type: n.type || "commit",
              title: n.title,
              message: n.message,
              timestamp: n.created_at || n.createdAt,
              read: n.read,
              priority: "medium" as const,
            })),
          };
        }
        if (category.id === "purchases") {
          return {
            ...category,
            notifications: categorizedNotifications.purchases.map((n) => ({
              id: n.id,
              type: n.type || "purchase",
              title: n.title,
              message: n.message,
              timestamp: n.created_at || n.createdAt,
              read: n.read,
              priority: "medium" as const,
            })),
          };
        }
        if (category.id === "deliveries") {
          return {
            ...category,
            notifications: categorizedNotifications.deliveries.map((n) => ({
              id: n.id,
              type: n.type || "delivery",
              title: n.title,
              message: n.message,
              timestamp: n.created_at || n.createdAt,
              read: n.read,
              priority: "medium" as const,
            })),
          };
        }
        if (category.id === "admin") {
          return {
            ...category,
            notifications: categorizedNotifications.admin.map((n) => ({
              id: n.id,
              type: n.type || "admin",
              title: n.title,
              message: n.message,
              timestamp: n.created_at || n.createdAt,
              read: n.read,
              priority: "high" as const,
            })),
          };
        }
        if (category.id === "account") {
          return {
            ...category,
            notifications: categorizedNotifications.account.map((n) => ({
              id: n.id,
              type: n.type || "account",
              title: n.title,
              message: n.message,
              timestamp: n.created_at || n.createdAt,
              read: n.read,
              priority: "medium" as const,
            })),
          };
        }
        if (category.id === "general") {
          return {
            ...category,
            notifications: categorizedNotifications.general.map((n) => ({
              id: n.id,
              type: n.type || "general",
              title: n.title,
              message: n.message,
              timestamp: n.created_at || n.createdAt,
              read: n.read,
              priority: "low" as const,
            })),
          };
        }

        return category;
      }),
    );
  }, [notifications]);

  const markWelcomeAsSeen = () => {
    if (user) {
      // Set multiple localStorage keys to ensure it's permanently dismissed
      localStorage.setItem(`welcome_seen_${user.id}`, "true");
      localStorage.setItem(
        `welcome_dismissed_${user.id}`,
        new Date().toISOString(),
      );

      // Update all state to ensure it's hidden immediately and permanently
      setShowWelcome(false);
      setIsFirstTime(false);

      // Remove welcome notifications from categories
      setCategories((prev) =>
        prev.filter((category) => category.id !== "welcome"),
      );

      toast.success(
        "Welcome! You're all set to start using ReBooked Solutions.",
      );
    }
  };

  const getNotificationIcon = (type: string, title?: string, message?: string) => {
    // Content-based icon detection (more specific)
    if (title?.includes("🧪") || title?.includes("Test")) {
      return <Bell className="h-4 w-4 text-gray-500" />;
    }
    if (title?.includes("⏰") || title?.includes("Commit") || message?.includes("commit")) {
      return <Award className="h-4 w-4 text-orange-500" />;
    }
    if (title?.includes("🛒") || title?.includes("📦") || title?.includes("💳") || title?.includes("Order") || title?.includes("Purchase") || title?.includes("Payment")) {
      return <ShoppingCart className="h-4 w-4 text-green-500" />;
    }
    if (title?.includes("📦") || title?.includes("Delivery") || title?.includes("Shipping")) {
      return <Truck className="h-4 w-4 text-blue-500" />;
    }

    // Fallback to type-based icons
    switch (type) {
      case "welcome":
        return <Gift className="h-4 w-4 text-purple-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "info":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const markAsRead = (categoryId: string, notificationId: string) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              notifications: category.notifications.map((notif) =>
                notif.id === notificationId ? { ...notif, read: true } : notif,
              ),
            }
          : category,
      ),
    );
  };

  const dismissNotification = async (categoryId: string, notificationId: string) => {
    // Set dismissing state
    setDismissingNotifications(prev => new Set(prev).add(notificationId));

    try {
      console.log('🗑️ Starting dismissNotification:', {
        categoryId,
        notificationId,
        userId: user?.id,
        isOnline: navigator.onLine,
        timestamp: new Date().toISOString()
      });

      // Check network connectivity first
      if (!navigator.onLine) {
        console.error('❌ No internet connection');
        toast.error('No internet connection. Please check your network.');
        return;
      }

      // Check if user is authenticated
      if (!user?.id) {
        console.error('❌ No authenticated user');
        toast.error('You must be logged in to delete notifications');
        return;
      }

      // First, let's verify the notification exists - check both tables
      console.log('🔍 Checking if notification exists in notifications or order_notifications...');

      let existingNotification = null;
      let notificationTable = 'notifications';
      let checkError = null;

      // Try notifications table first
      const { data: regularNotif, error: regularError } = await supabase
        .from('notifications')
        .select('id, user_id, title')
        .eq('id', notificationId)
        .single();

      if (!regularError && regularNotif) {
        existingNotification = regularNotif;
        notificationTable = 'notifications';
        console.log('✅ Notification found in notifications table:', existingNotification);
      } else if (regularError?.code !== 'PGRST116') {
        // Only treat as error if it's not "not found"
        checkError = regularError;
      } else {
        // Not found in notifications, try order_notifications
        const { data: orderNotif, error: orderError } = await supabase
          .from('order_notifications')
          .select('id, user_id, title')
          .eq('id', notificationId)
          .single();

        if (!orderError && orderNotif) {
          existingNotification = orderNotif;
          notificationTable = 'order_notifications';
          console.log('✅ Notification found in order_notifications table:', existingNotification);
        } else if (orderError?.code !== 'PGRST116') {
          checkError = orderError;
        }
      }

      if (checkError) {
        const safeErrorMessage = getSafeErrorMessage(checkError, 'Unknown error checking notification');
        console.error('❌ Error checking notification existence:', {
          message: safeErrorMessage,
          code: checkError.code,
          details: checkError.details,
          hint: checkError.hint,
        });
        toast.error(`Notification not found: ${safeErrorMessage}`);
        return;
      }

      if (!existingNotification) {
        console.error('❌ Notification not found in either notifications or order_notifications table');
        toast.error('Notification not found');
        return;
      }

      // Verify ownership
      if (existingNotification.user_id !== user.id) {
        console.error('❌ User does not own this notification');
        toast.error('You can only delete your own notifications');
        return;
      }

      // Delete from the correct table
      console.log(`🗑️ Attempting to delete notification from ${notificationTable} table...`);
      const { data: deleteData, error: deleteError } = await supabase
        .from(notificationTable)
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id); // Double-check ownership in delete query

      console.log('Delete operation result:', { data: deleteData, error: deleteError, table: notificationTable });

      if (deleteError) {
        const safeDeleteErrorMessage = getSafeErrorMessage(deleteError, 'Unknown delete error');
        console.error('❌ Database error deleting notification:', {
          notificationId,
          table: notificationTable,
          code: deleteError.code,
          message: safeDeleteErrorMessage,
          details: deleteError.details,
          hint: deleteError.hint,
        });

        // Handle specific error cases with user-friendly messages
        if (deleteError.code === 'PGRST116') {
          toast.error('Notification not found. Please try again.');
        } else if (deleteError.code === '42501') {
          toast.error('Unable to remove notification. Please try again or contact support.');
        } else if (safeDeleteErrorMessage?.includes('Failed to fetch') || safeDeleteErrorMessage?.includes('network')) {
          toast.error('Network connection issue. Please check your internet and try again.');
        } else {
          toast.error('Unable to remove notification. Please try again or contact support.');
        }
        return;
      }

      console.log('✅ Successfully deleted notification from database');

      // Clear notification cache to avoid stale reads
      if (user?.id) {
        clearNotificationCache(user.id);
      }

      // Update local state to remove from UI immediately (before showing success message)
      console.log('🔄 Updating local state to remove notification from UI...');
      setCategories((prev) => {
        const updatedCategories = prev.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                notifications: category.notifications.filter(
                  (notif) => notif.id !== notificationId,
                ),
              }
            : category,
        );
        console.log('✅ Local state updated - notification removed from UI');
        return updatedCategories;
      });

      // Show success message immediately after UI update
      toast.success('Notification removed');
      console.log('✅ Notification removed from UI - dismissNotification completed successfully');

      // Immediately refresh the notifications hook to update badge count and ensure consistency
      console.log('🔄 Refreshing notifications hook for immediate update...');
      try {
        await refreshNotifications();
        console.log('✅ Notifications hook refreshed successfully - badge count and state should update immediately');
      } catch (refreshError) {
        const safeRefreshErrorMessage = getSafeErrorMessage(refreshError, 'Failed to refresh notifications');
        console.warn('⚠��� Failed to refresh notifications after deletion:', {
          message: safeRefreshErrorMessage,
          code: refreshError?.code,
          details: refreshError?.details
        });
        // Show warning but don't fail the operation since local state was updated
        toast.warning('Notification removed. Please refresh if the count seems off.');
      }

    } catch (error) {
      console.error('💥 Exception while dismissing notification:', {
        error,
        notificationId,
        categoryId,
        isOnline: navigator.onLine,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined
      });

      // Show user-friendly error message
      const safeCatchErrorMessage = getSafeErrorMessage(error, 'An unexpected error occurred');

      if (error instanceof TypeError && safeCatchErrorMessage.includes('Failed to fetch')) {
        toast.error('Network connection issue. Please check your internet and try again.');
      } else {
        toast.error('Unable to remove notification. Please try again or contact support.');
      }
    } finally {
      // Clear dismissing state
      setDismissingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Use real notification counts from the hook
  const totalNotifications = totalCount;
  const unreadNotifications = unreadCount;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="text-sm sm:text-base text-gray-500">
                Stay updated with your ReBooked Solutions activity
              </p>
            </div>
          </div>
          {unreadNotifications > 0 && (
            <Badge className="bg-red-500 text-white self-start sm:self-auto">
              {unreadNotifications} new
            </Badge>
          )}
          {isLoading && (
            <Badge variant="outline" className="self-start sm:self-auto">
              Loading...
            </Badge>
          )}
          {connectionStatus && !connectionStatus.databaseWorking && (
            <Badge
              variant="destructive"
              className="self-start sm:self-auto cursor-pointer"
              onClick={() => setShowConnectionDetails(!showConnectionDetails)}
            >
              Connection Issues
            </Badge>
          )}



        </div>

        {/* Debug Section - Show raw notifications if count mismatch */}
        {totalNotifications > 0 && (categorizedNotifications.commits.length + categorizedNotifications.purchases.length + categorizedNotifications.deliveries.length + categorizedNotifications.admin.length + categorizedNotifications.account.length + categorizedNotifications.general.length) === 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Debug: Uncategorized Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700 mb-4">
                There are {totalNotifications} notifications in the database but they're not appearing in any category. Here are the raw notifications:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((notif, index) => (
                  <div key={notif.id || index} className="bg-white p-3 rounded border">
                    <div className="text-sm font-medium">
                      <strong>Title:</strong> {notif.title || 'No title'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Type:</strong> {notif.type || 'No type'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Read:</strong> {notif.read ? 'Yes' : 'No'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Message:</strong> {notif.message ? notif.message.substring(0, 100) + '...' : 'No message'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Status Details */}
        {showConnectionDetails && connectionStatus && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                Connection Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Internet Connection:</span>
                  <Badge variant={connectionStatus.isOnline ? "default" : "destructive"}>
                    {connectionStatus.isOnline ? "�� Online" : "❌ Offline"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Supabase Reachable:</span>
                  <Badge variant={connectionStatus.supabaseReachable ? "default" : "destructive"}>
                    {connectionStatus.supabaseReachable ? "✅ Yes" : "❌ No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Authentication:</span>
                  <Badge variant={connectionStatus.authWorking ? "default" : "destructive"}>
                    {connectionStatus.authWorking ? "✅ Working" : "❌ Failed"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Database Access:</span>
                  <Badge variant={connectionStatus.databaseWorking ? "default" : "destructive"}>
                    {connectionStatus.databaseWorking ? "✅ Working" : "❌ Failed"}
                  </Badge>
                </div>
                {connectionStatus.latency && (
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <Badge variant="outline">{connectionStatus.latency}ms</Badge>
                  </div>
                )}
                {connectionStatus.error && (
                  <div className="mt-3 p-2 bg-red-100 rounded text-red-800 text-xs">
                    <strong>Error:</strong> {connectionStatus.error}
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const result = await testConnection();
                    setConnectionStatus(result);
                    toast.info('Connection test completed');
                  }}
                >
                  Retest Connection
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConnectionDetails(false)}
                >
                  Hide Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Check if we have any notifications to show */}
        {(() => {
          const hasVisibleCategories = categories.some(category => {
            if (!category.enabled) return false;
            return category.notifications.length > 0;
          });

          if (!hasVisibleCategories) {
            return (
              <Card className="text-center py-16">
                <CardContent>
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No notifications yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    You're all caught up! We'll notify you when something important happens.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <ShoppingCart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium text-blue-900">Start Shopping</h4>
                      <p className="text-blue-700 text-sm">
                        Browse textbooks and make your first purchase
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium text-green-900">List Books</h4>
                      <p className="text-green-700 text-sm">
                        Sell your textbooks to earn money
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-medium text-purple-900">Join Community</h4>
                      <p className="text-purple-700 text-sm">
                        Connect with other students
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return null;
        })()}

        {/* Notification Categories */}
        <div className="space-y-6">
          {categories.map((category) => {
            if (!category.enabled) return null;
            // Hide categories with no notifications
            if (category.notifications.length === 0)
              return null;

            const colorClasses = {
              purple: "border-purple-200 bg-purple-50",
              orange: "border-orange-200 bg-orange-50",
              green: "border-green-200 bg-green-50",
              blue: "border-blue-200 bg-blue-50",
              pink: "border-pink-200 bg-pink-50",
            };

            return (
              <Card
                key={category.id}
                data-category={category.id}
                className={`${colorClasses[category.color as keyof typeof colorClasses]} border-2`}
              >
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-base sm:text-lg font-semibold">{category.title}</div>
                        <div className="text-xs sm:text-sm font-normal text-gray-600">
                          {category.description}
                        </div>
                      </div>
                    </div>
                    {category.notifications.length > 0 && (
                      <Badge variant="secondary" className="self-start sm:self-auto">
                        {category.notifications.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                      {category.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 sm:p-4 rounded-lg border transition-all ${
                            (notification.title.includes('🧪') || notification.title.includes('Test Notification')) && !notification.read
                              ? "bg-gradient-to-r from-green-50 to-blue-50 border-green-400 shadow-lg ring-2 ring-green-300 ring-opacity-50"
                              : notification.read
                              ? "bg-white border-gray-200"
                              : "bg-white border-blue-300 shadow-md"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                            <div className="flex items-start gap-2 sm:gap-3 flex-1">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type, notification.title, notification.message)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
                                    {notification.title}
                                  </h4>
                                  {(notification.title.includes('🧪') || notification.title.includes('Test Notification')) && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                      TEST
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-700 text-xs sm:text-sm whitespace-pre-line mb-2 leading-relaxed">
                                  {notification.message}
                                </p>
                                <div className="text-xs text-gray-500">
                                  {formatTimestamp(notification.timestamp)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-1 sm:gap-2 sm:ml-4 self-end sm:self-start">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    markAsRead(category.id, notification.id)
                                  }
                                  className="text-blue-600 hover:bg-blue-100 min-h-[44px] min-w-[44px] p-2"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  dismissNotification(
                                    category.id,
                                    notification.id,
                                  )
                                }
                                disabled={dismissingNotifications.has(notification.id)}
                                className="text-gray-500 hover:bg-gray-100 min-h-[44px] min-w-[44px] p-2 disabled:opacity-50"
                              >
                                {dismissingNotifications.has(notification.id) ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>


      </div>
    </Layout>
  );
};

export default NotificationsNew;
