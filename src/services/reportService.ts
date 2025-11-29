import { supabase } from "@/integrations/supabase/client";

export interface ReportData {
  reportedUserId: string;
  reporterUserId: string;
  bookId?: string;
  bookTitle: string;
  sellerName: string;
  reason: string;
}

export interface GeneralReportData {
  userId: string | null;
  name: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
}

export const submitReport = async (
  reportData: GeneralReportData,
): Promise<{ id: string }> => {
  try {
    if (!reportData.userId) {
      throw new Error("You must be logged in to submit a report");
    }


    const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    // Map general report into reports schema
    const { error } = await supabase.from("reports").insert({
      id,
      reporter_user_id: reportData.userId,
      reported_user_id: reportData.userId, // general issue (no target user)
      book_id: null,
      book_title: reportData.subject || "General Issue",
      seller_name: reportData.name || "Unknown",
      reason: `${reportData.category.toUpperCase()}: ${reportData.description}`,
      status: "pending",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error((error as any)?.message || "Failed to submit report");
    }

    return { id };
  } catch (error) {
    throw new Error((error as any)?.message || "Failed to submit report");
  }
};

export const submitBookReport = async (
  reportData: ReportData,
): Promise<void> => {
  try {
    
    const { error } = await supabase.from("reports").insert({
      reported_user_id: reportData.reportedUserId,
      reporter_user_id: reportData.reporterUserId,
      book_id: reportData.bookId,
      book_title: reportData.bookTitle,
      seller_name: reportData.sellerName,
      reason: reportData.reason,
      status: "pending",
    });

    if (error) {
      throw error;
    }

  } catch (error) {
    throw error;
  }
};

export const getAllReports = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getReportsByStatus = async (
  status: "pending" | "resolved" | "dismissed",
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getSuspendedUsers = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "suspended")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
};

export const dismissReport = async (reportId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("reports")
      .update({ status: "dismissed", updated_at: new Date().toISOString() })
      .eq("id", reportId);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

export const banUserFromReport = async (
  reportId: string,
  reason: string,
): Promise<void> => {
  try {
    // First get the report to find the reported user
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("reported_user_id")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    // Ban the user
    const { error: banError } = await supabase
      .from("profiles")
      .update({
        status: "banned",
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
      })
      .eq("id", report.reported_user_id);

    if (banError) {
      throw banError;
    }

    // Mark report as resolved
    const { error: resolveError } = await supabase
      .from("reports")
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .eq("id", reportId);

    if (resolveError) {
      throw resolveError;
    }
  } catch (error) {
    throw error;
  }
};

export const suspendUserFromReport = async (
  reportId: string,
  reason: string,
): Promise<void> => {
  try {
    // First get the report to find the reported user
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("reported_user_id")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    // Suspend the user
    const { error: suspendError } = await supabase
      .from("profiles")
      .update({
        status: "suspended",
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
      })
      .eq("id", report.reported_user_id);

    if (suspendError) {
      throw suspendError;
    }

    // Mark report as resolved
    const { error: resolveError } = await supabase
      .from("reports")
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .eq("id", reportId);

    if (resolveError) {
      throw resolveError;
    }
  } catch (error) {
    throw error;
  }
};
