import { createClient } from "@/utils/supabase/client";
import { Deliverable, DeliverableStatus, DeliverableWithProfile } from "@/types/database";

export class TodoService {
  private supabase = createClient();

  async getTodos(weekFilter?: string): Promise<{ data: DeliverableWithProfile[] | null; error: any }> {
    console.log("🔍 Fetching todos...", { weekFilter });
    
    // First, let's check what user we're querying as
    const { data: { user } } = await this.supabase.auth.getUser();
    console.log("Current user:", user?.id);

    // Start building the query
    let query = this.supabase
      .from("deliverables")
      .select(`
        *,
        profile:accountable_id (
          email
        ),
        issue:issue_id (
          title,
          description
        )
      `);

    // Apply week filter if provided
    if (weekFilter) {
      const [year, week] = weekFilter.split('-W');
      const startDate = this.getWeekDates(parseInt(year), parseInt(week)).start;
      const endDate = this.getWeekDates(parseInt(year), parseInt(week)).end;
      
      query = query
        .gte('due_date', startDate.toISOString())
        .lt('due_date', endDate.toISOString());
    }

    // Execute the query with ordering
    const { data, error } = await query.order("due_date", { ascending: true });

    if (error) {
      console.error("❌ Error fetching todos:", error);
    } else {
      console.log("✅ Successfully fetched todos:", data?.length, "todos found");
      console.log("First todo complete data:", data?.[0]);
      console.log("All accountable_ids:", data?.map(d => d.accountable_id));
      console.log("All profiles:", data?.map(d => d.profile));
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

  async updateTodo(
    id: string,
    updates: {
      status?: DeliverableStatus;
      accountable_id?: string;
      due_date?: string;
      title?: string;
      description?: string;
    }
  ): Promise<{ data: Deliverable | null; error: any }> {
    console.log("🔄 Updating todo:", { id, updates });
    
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      console.error("❌ No authenticated user found");
      return { data: null, error: new Error("User not authenticated") };
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
      last_updated_by: user.id,
    };

    const { data, error } = await this.supabase
      .from("deliverables")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating todo:", error);
    } else {
      console.log("✅ Successfully updated todo:", data);
    }

    return { data, error };
  }

  async getTodoHistory(id: string): Promise<{ data: any[] | null; error: any }> {
    console.log("🔍 Fetching todo history:", id);
    const { data, error } = await this.supabase
      .from("deliverable_history")
      .select(`
        *,
        profile!fk_history_updated_by_profile (
          email
        )
      `)
      .eq("deliverable_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching todo history:", error);
    } else {
      console.log("✅ Successfully fetched todo history:", data?.length, "records found");
    }

    return { data, error };
  }
} 