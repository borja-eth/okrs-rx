import { createClient } from "@/utils/supabase/client";
import { Issue, IssueStatus, IssueWithProfile } from "@/types/database";

export class IssueService {
  private supabase = createClient();

  async getCurrentUser() {
    return await this.supabase.auth.getUser();
  }

  async getIssues(weekFilter?: string): Promise<{ data: IssueWithProfile[] | null; error: any }> {
    console.log("🔍 Fetching issues...", weekFilter ? `for week ${weekFilter}` : "for all weeks");
    let query = this.supabase
      .from("issues")
      .select(`
        *,
        profile (
          email
        )
      `);

    if (weekFilter) {
      // Parse the week string (format: "YYYY-WXX")
      const [year, week] = weekFilter.split("-W");
      const weekNumber = parseInt(week);

      // For Week 1 (2025-W01), explicitly set the date range
      let startDate: Date;
      let endDate: Date;

      if (year === "2025" && weekNumber === 1) {
        startDate = new Date(2024, 11, 30); // Dec 30, 2024
        endDate = new Date(2025, 0, 5); // Jan 5, 2025
      } else {
        startDate = new Date(parseInt(year), 11, 30); // Dec 30 of the year
        startDate.setDate(startDate.getDate() + ((weekNumber - 1) * 7)); // Move to start of specified week
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // End of the week
      }

      // Format dates for the query
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      console.log("Filtering issues between:", { startDateStr, endDateStr });
      query = query
        .gte("created_at", startDateStr)
        .lt("created_at", endDateStr);
    } else {
      // If no week filter, only show unsolved issues by default
      query = query.not("status", "eq", "solved");
    }

    // Always order by creation date, newest first
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching issues:", error);
    } else {
      console.log("✅ Successfully fetched issues:", data?.length, "issues found");
    }

    return { data, error };
  }

  async createIssue(
    title: string,
    description: string
  ): Promise<{ data: Issue | null; error: any }> {
    console.log("📝 Creating new issue:", { title, description });
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      console.error("❌ No authenticated user found");
      return { data: null, error: new Error("User not authenticated") };
    }

    const { data, error } = await this.supabase
      .from("issues")
      .insert([
        {
          title,
          description,
          created_by: user.id,
          status: 'pending' as IssueStatus,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating issue:", error);
    } else {
      console.log("✅ Successfully created issue:", data);
    }

    return { data, error };
  }

  // Edit is for modifying title and description
  async editIssue(
    id: string,
    title: string,
    description: string
  ): Promise<{ data: Issue | null; error: any }> {
    console.log("✏️ Editing issue content:", { id, title, description });
    
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      console.error("❌ No authenticated user found");
      return { data: null, error: new Error("User not authenticated") };
    }

    const { data, error } = await this.supabase
      .from("issues")
      .update({
        title,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("created_by", user.id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error editing issue:", error);
    } else {
      console.log("✅ Successfully edited issue content:", data);
    }

    return { data, error };
  }

  // Update is specifically for changing the status
  async updateIssueStatus(
    id: string,
    status: IssueStatus
  ): Promise<{ data: IssueWithProfile | null; error: any }> {
    try {
      console.log("🔄 Starting issue status update:", { id, status });
      
      const { data: { user } } = await this.supabase.auth.getUser();
      console.log("👤 Current user:", user?.id);
      
      if (!user) {
        console.error("❌ No authenticated user found");
        return { data: null, error: new Error("User not authenticated") };
      }

      console.log("📝 Attempting to update issue with:", {
        id,
        status,
        user_id: user.id,
        update_time: new Date().toISOString()
      });

      const { data, error } = await this.supabase
        .from("issues")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("created_by", user.id)
        .select("*")
        .single();

      if (error) {
        console.error("❌ Error updating issue status:", error);
        console.error("Full error details:", JSON.stringify(error, null, 2));
        return { data: null, error };
      }

      console.log("✅ Successfully updated issue:", data);

      // If we need profile info, fetch it separately
      if (data) {
        console.log("🔍 Fetching updated issue with profile...");
        const { data: issueWithProfile, error: fetchError } = await this.supabase
          .from("issues")
          .select(`
            *,
            profile (
              email
            )
          `)
          .eq("id", id)
          .single();

        if (fetchError) {
          console.error("⚠️ Error fetching profile info:", fetchError);
          // Return success anyway since the update worked
          return { data, error: null };
        }

        console.log("✅ Successfully fetched issue with profile:", issueWithProfile);
        return { data: issueWithProfile, error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.error("❌ Unexpected error during status update:", error);
      return { data: null, error };
    }
  }
} 