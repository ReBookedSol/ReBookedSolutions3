import { supabase } from "@/integrations/supabase/client";

export interface ContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read";
  created_at: string;
  updated_at: string;
}

export const submitContactMessage = async (
  messageData: ContactMessageData,
): Promise<{ id: string }> => {
  try {
    const id = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const { error } = await supabase.from("contact_messages").insert({
      id,
      name: messageData.name,
      email: messageData.email,
      subject: messageData.subject,
      message: messageData.message,
      status: "unread",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error((error as any)?.message || "Failed to submit contact message");
    }

    return { id };
  } catch (error) {
    throw new Error(
      (error as any)?.message || "Failed to submit contact message",
    );
  }
};

export const getAllContactMessages = async (): Promise<ContactMessage[]> => {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Contact messages error: ${error.message}`);
  }

  return (data || []).map((message) => ({
    ...message,
    status: message.status as "unread" | "read",
  }));
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("contact_messages")
      .update({
        status: "read",
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      throw error;
    }
  } catch (error) {
    throw new Error("Failed to mark message as read");
  }
};

export const clearAllMessages = async (): Promise<void> => {
  try {
    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .gte("created_at", "1900-01-01"); // This will match all records safely

    if (error) {
      throw error;
    }
  } catch (error) {
    throw new Error("Failed to clear all messages");
  }
};
