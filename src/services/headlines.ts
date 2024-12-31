import { createClient } from "@/utils/supabase/client";
import { Headline, HeadlineStatus } from "@/types/database";

interface HeadlineWithProfile extends Headline {
  profile: {
    email: string;
  };
}

export class HeadlineService {
  public supabase = createClient();

  async getCurrentUser() {
    return await this.supabase.auth.getUser();
  }

  async getHeadlines(weekFilter?: string): Promise<{ data: HeadlineWithProfile[] | null; error: any }> {
    console.log("🔍 Fetching headlines...", { weekFilter });
    let query = this.supabase
      .from("headlines")
      .select(`
        *,
        profile!inner (
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (weekFilter) {
      const [year, week] = weekFilter.split('-W');
      const startDate = this.getWeekDates(parseInt(year), parseInt(week)).start;
      const endDate = this.getWeekDates(parseInt(year), parseInt(week)).end;
      
      query = query
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching headlines:", error);
    } else {
      console.log("✅ Successfully fetched headlines:", data?.length, "headlines found");
    }

    return { data, error };
  }

  // Helper function to get start and end dates of a week
  private getWeekDates(year: number, week: number) {
    const start = new Date(year, 0, 1 + (week - 1) * 7);
    while (start.getDay() !== 1) start.setDate(start.getDate() - 1);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    
    return { start, end };
  }

  async createHeadline(title: string, description: string): Promise<{ error: any }> {
    console.log("📝 Creating new headline:", { title, description });
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      console.error("❌ No authenticated user found");
      return { error: new Error("User not authenticated") };
    }

    const { error } = await this.supabase
      .from("headlines")
      .insert([
        {
          title,
          description,
          created_by: user.id,
          status: 'pending' as HeadlineStatus
        },
      ]);

    if (error) {
      console.error("❌ Error creating headline:", error);
    } else {
      console.log("✅ Successfully created headline");
    }

    return { error };
  }

  async deleteHeadline(id: string): Promise<{ error: any }> {
    console.log("🗑️ Attempting to delete headline:", id);
    
    // Get current user
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      const error = new Error("User not authenticated");
      console.error("❌ Delete failed:", error);
      return { error };
    }

    // First verify the headline belongs to the user
    const { data: headline } = await this.supabase
      .from("headlines")
      .select("*")
      .eq("id", id)
      .single();

    console.log("🔍 Found headline to delete:", headline);

    if (!headline) {
      const error = new Error("Headline not found");
      console.error("❌ Delete failed:", error);
      return { error };
    }

    if (headline.created_by !== user.id) {
      const error = new Error("Not authorized to delete this headline");
      console.error("❌ Delete failed:", error);
      return { error };
    }

    // Proceed with deletion
    const { error } = await this.supabase
      .from("headlines")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) {
      console.error("❌ Error deleting headline:", error);
    } else {
      console.log("✅ Successfully deleted headline:", id);
    }

    return { error };
  }

  async updateHeadline(
    id: string, 
    title: string, 
    description: string, 
    status?: HeadlineStatus
  ): Promise<{ error: any }> {
    console.log("📝 Updating headline:", { id, title, description, status });
    
    // Get current user
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      const error = new Error("User not authenticated");
      console.error("❌ Update failed:", error);
      return { error };
    }

    const updateData: Partial<Headline> = {
      title,
      description,
      ...(status && { status })
    };

    const { error } = await this.supabase
      .from("headlines")
      .update(updateData)
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) {
      console.error("❌ Error updating headline:", error);
    } else {
      console.log("✅ Successfully updated headline:", id);
    }

    return { error };
  }

  async updateHeadlineStatus(id: string, status: HeadlineStatus): Promise<{ error: any }> {
    console.log("🔄 Updating headline status:", { id, status });
    
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      const error = new Error("User not authenticated");
      console.error("❌ Status update failed:", error);
      return { error };
    }

    const { error } = await this.supabase
      .from("headlines")
      .update({ status })
      .eq("id", id)
      .eq("created_by", user.id);

    if (error) {
      console.error("❌ Error updating headline status:", error);
    } else {
      console.log("✅ Successfully updated headline status:", { id, status });
    }

    return { error };
  }
} 