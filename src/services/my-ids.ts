import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

export class MyIDSService {
  private supabase;

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async getMyIssues() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("User not found") };

    return await this.supabase
      .from("issues")
      .select(`
        *,
        profile:created_by (
          email
        )
      `)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
  }

  async getMyHeadlines() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("User not found") };

    return await this.supabase
      .from("headlines")
      .select(`
        *,
        profile:created_by (
          email
        )
      `)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
  }

  async getMyTodos() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("User not found") };

    return await this.supabase
      .from("deliverables")
      .select(`
        *,
        profile!accountable_id (
          email
        ),
        issue:issue_id (
          title
        )
      `)
      .eq("accountable_id", user.id)
      .order("created_at", { ascending: false });
  }
} 