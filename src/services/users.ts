import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/types/database";

export class UserService {
  private supabase = createClient();

  async getUsers(): Promise<{ data: Profile[] | null; error: any }> {
    console.log("🔍 Fetching users...");
    const { data, error } = await this.supabase
      .from("profile")
      .select("*")
      .order("email");

    if (error) {
      console.error("❌ Error fetching users:", error);
    } else {
      console.log("✅ Successfully fetched users:", data?.length, "users found");
    }

    return { data, error };
  }
} 