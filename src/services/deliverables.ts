import { createClient } from "@/utils/supabase/client";
import { Deliverable, DeliverableStatus, DeliverableWithProfile } from "@/types/database";

export class DeliverableService {
  private supabase = createClient();

  async getCurrentUser() {
    return await this.supabase.auth.getUser();
  }

  async getDeliverables(issueId: string): Promise<{ data: DeliverableWithProfile[] | null; error: any }> {
    console.log("🔍 Fetching deliverables for issue:", issueId);
    const { data, error } = await this.supabase
      .from("deliverables")
      .select(`
        *,
        profile:accountable_id (
          email
        )
      `)
      .eq("issue_id", issueId)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("❌ Error fetching deliverables:", error);
    } else {
      console.log("✅ Successfully fetched deliverables:", data?.length, "deliverables found");
    }

    return { data, error };
  }

  async createDeliverable(
    issueId: string,
    title: string,
    description: string,
    dueDate: string,
    accountableId: string
  ): Promise<{ data: Deliverable | null; error: any }> {
    console.log("📝 Creating new deliverable:", { title, description, dueDate, accountableId });
    
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      console.error("❌ No authenticated user found");
      return { data: null, error: new Error("User not authenticated") };
    }

    const { data, error } = await this.supabase
      .from("deliverables")
      .insert([
        {
          title,
          description,
          due_date: dueDate,
          accountable_id: accountableId,
          issue_id: issueId,
          status: 'pending' as DeliverableStatus,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating deliverable:", error);
    } else {
      console.log("✅ Successfully created deliverable:", data);
    }

    return { data, error };
  }

  async updateDeliverableStatus(
    id: string,
    status: DeliverableStatus
  ): Promise<{ data: Deliverable | null; error: any }> {
    console.log("🔄 Starting status update process", { id, newStatus: status });
    
    try {
      // 1. Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        return { 
          data: null, 
          error: { 
            code: 'NOT_FOUND',
            message: "User not found" 
          }
        };
      }

      console.log("👤 Current user:", user.id);

      // 2. Update the deliverable status
      console.log("📝 Updating deliverable status with:", {
        updateData: {
          status,
          updated_at: new Date().toISOString()
        },
        conditions: {
          id,
          accountable_id: user.id
        }
      });

      const { data: updatedDeliverable, error: updateError } = await this.supabase
        .from("deliverables")
        .update({
          status,
          updated_at: new Date().toISOString(),
          last_updated_by: user.id
        })
        .eq("id", id)
        .eq("accountable_id", user.id)
        .select("*")
        .single();

      if (updateError) {
        console.error("❌ Error updating deliverable status:", updateError);
        console.error("Full error details:", JSON.stringify(updateError, null, 2));
        return { 
          data: null, 
          error: { 
            code: 'UPDATE_ERROR',
            message: "Failed to update deliverable status",
            details: updateError 
          }
        };
      }

      console.log("✅ Successfully updated deliverable");
      return { data: updatedDeliverable, error: null };
      
    } catch (error) {
      console.error("❌ Unexpected error during status update:", error);
      return { 
        data: null, 
        error: { 
          code: 'UNEXPECTED_ERROR',
          message: "An unexpected error occurred",
          details: error 
        }
      };
    }
  }
} 