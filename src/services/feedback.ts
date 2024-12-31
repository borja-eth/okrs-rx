import { createClient } from "@/utils/supabase/client";

export type FeedbackCategory = "bug" | "feature" | "improvement" | "other";
export type FeedbackPriority = "low" | "medium" | "high";
export type FeedbackStatus = "pending" | "in_review" | "implemented" | "rejected";

export interface Feedback {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  tags: string[];
  screenshots?: string[];
}

export class FeedbackService {
  private supabase = createClient();

  async submitFeedback(feedback: Omit<Feedback, "id" | "created_at">) {
    const { data, error } = await this.supabase
      .from("feedback")
      .insert(feedback)
      .select()
      .single();

    return { data, error };
  }

  async getFeedback() {
    const { data, error } = await this.supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    return { data, error };
  }

  async getMyFeedback() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("Not authenticated") };

    const { data, error } = await this.supabase
      .from("feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return { data, error };
  }

  async updateFeedbackStatus(id: string, status: FeedbackStatus) {
    const { data, error } = await this.supabase
      .from("feedback")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  }
} 