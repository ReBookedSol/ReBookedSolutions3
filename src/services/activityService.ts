import { supabase } from "@/integrations/supabase/client";

// Define activity types
export type ActivityType =
  | "profile_updated"
  | "purchase"
  | "sale"
  | "listing_created"
  | "login"
  | "banking_updated"
  | "order_paid"
  | "order_committed";

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Silent activities that don't need notifications
const SILENT_ACTIVITY_TYPES = new Set<ActivityType>(["login"]);

export class ActivityService {
  /**
   * Log a profile update activity
   */
  static async logProfileUpdate(userId: string): Promise<void> {
    try {
      if (!userId) {
        return;
      }

      // Create notification for profile update
      try {
        const { NotificationService } = await import('./notificationService');
        await NotificationService.createNotification({
          userId: userId,
          type: "success",
          title: "Profile Updated",
          message: "Your profile has been successfully updated",
        });
      } catch (notifError) {
      }

    } catch (error) {
    }
  }

  /**
   * Log a banking details update activity
   */
  static async logBankingUpdate(userId: string, isUpdate: boolean = true): Promise<void> {
    try {
      if (!userId) {
        return;
      }

      const title = isUpdate ? "Banking Details Updated" : "Banking Details Added";
      const description = isUpdate
        ? "Your banking information has been successfully updated"
        : "Your banking information has been successfully added";

      // Log the activity
      const result = await this.logActivity(
        userId,
        "banking_updated",
        title,
        description,
        {
          action: isUpdate ? "update" : "create",
          timestamp: new Date().toISOString(),
          secure: true
        }
      );

    } catch (error) {
    }
  }

  /**
   * Generic activity logging method
   */
  static async logActivity(
    userId: string,
    type: ActivityType,
    title: string,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string; details?: unknown }> {
    try {
      // Validate required parameters
      if (!userId || !type || !title || !description) {
        const error = "Missing required parameters for activity logging";
        return { success: false, error };
      }

      // For silent activities, we can create a simple log without notification
      if (SILENT_ACTIVITY_TYPES.has(type)) {
        return { success: true };
      }

      // For important activities, create a notification (if table exists)
      try {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            title: `Activity: ${title}`,
            message: description,
            type: this.getNotificationTypeForActivity(type),
            read: false,
          });

        if (notificationError) {
          // Check if it's a table not found error
          if (
            notificationError.code === "42P01" ||
            notificationError.message?.includes("relation") ||
            notificationError.message?.includes("does not exist") ||
            notificationError.message?.includes("schema cache")
          ) {
            return { success: true };
          }
          throw notificationError;
        }

        return { success: true };
      } catch (notificationError) {
        return {
          success: true, // Don't fail the whole operation for notification issues
          warning: "Notification not created",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "Exception occurred during activity logging",
        details: error,
      };
    }
  }

  /**
   * Get user activities by reading from notifications table
   */
  static async getUserActivities(
    userId: string,
    limit: number = 50,
    type?: ActivityType,
  ): Promise<Activity[]> {
    try {
      if (!userId) {
        return [];
      }

      // Try to get activities from a dedicated activity_logs table first
      try {
        let activitiesQuery = supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (type) {
          activitiesQuery = activitiesQuery.eq("type", type);
        }

        const { data: activities, error } = await activitiesQuery;

        if (!error && activities && activities.length > 0) {
          console.log(
            `✅ Found ${activities.length} activities from activity_logs table`,
          );
          return activities.map((activity) => ({
            id: activity.id,
            user_id: activity.user_id,
            type: activity.type,
            title: activity.title,
            description: activity.description,
            metadata: activity.metadata,
            created_at: activity.created_at,
          }));
        }
      } catch (activitiesError) {
        // Activity_logs table might not exist, fall back to notifications
      }

      // Fallback: Get activities from notifications table AND create sample activities
      try {
        const notifQuery = supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        const { data: notifications, error: notifError } = await notifQuery;

        if (notifError) {
          // Check if it's a table not found error
          if (
            notifError.code === "42P01" ||
            notifError.message?.includes("relation") ||
            notifError.message?.includes("does not exist") ||
            notifError.message?.includes("schema cache")
          ) {
            return [];
          }

          // Return empty array as fallback
          return [];
        }

        // If no notifications found, return empty array
        if (!notifications || notifications.length === 0) {
          return [];
        }

        // Convert notifications to activities with safety checks
        return (notifications || []).map((notif) => {
          return {
            id: notif.id || `notif-${Date.now()}-${Math.random()}`,
            user_id: notif.user_id || userId,
            type: this.mapNotificationToActivityType(notif.type || "info"),
            title: notif.title || "Activity",
            description:
              notif.message || notif.description || "Activity recorded",
            metadata: {
              notificationId: notif.id,
              read: notif.read || false,
              originalType: notif.type,
            },
            created_at: notif.created_at || new Date().toISOString(),
          };
        });
      } catch (fallbackError) {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Helper method to get notification type for activity
   */
  private static getNotificationTypeForActivity(
    activityType: ActivityType,
  ): string {
    const typeMap: Record<ActivityType, string> = {
      profile_updated: "success",
      purchase: "info",
      sale: "success",
      listing_created: "info",
      login: "info",
      banking_updated: "success",
    };
    return typeMap[activityType] || "info";
  }



  /**
   * Maps notification types to activity types
   */
  private static mapNotificationToActivityType(
    notificationType: string,
  ): ActivityType {
    switch (notificationType?.toLowerCase()) {
      case "purchase":
      case "bought":
        return "purchase";
      case "sale":
      case "sold":
        return "sale";
      case "listing":
      case "listing_created":
        return "listing_created";
      case "login":
        return "login";
      case "profile":
      case "profile_updated":
        return "profile_updated";
      case "banking":
      case "banking_updated":
        return "banking_updated";
      default:
        return "profile_updated";
    }
  }

}
