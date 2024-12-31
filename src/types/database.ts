export interface Profile {
  id: string        // Foreign key to auth.users.id - This is the Supabase Auth User ID
  email: string
}

export type HeadlineStatus = 'pending' | 'completed';

export interface Headline {
  id: string
  title: string
  description: string
  created_by: string    // Foreign key to profile.id (which is auth.users.id)
  created_at: string
  status: HeadlineStatus
}

export type IssueStatus = 'pending' | 'discussed' | 'solved';

export interface Issue {
  id: string
  title: string
  description: string
  created_by: string    // Foreign key to profile.id (which is auth.users.id)
  status: IssueStatus
  created_at: string
  updated_at: string
}

export interface IssueWithProfile extends Issue {
  profile: {
    email: string;
  };
}

export type DeliverableStatus = 'pending' | 'in_progress' | 'completed';

export interface Deliverable {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: DeliverableStatus;
  created_at: string;
  updated_at: string;
  accountable_id: string;
  issue_id: string;
  created_by: string;
}

export interface DeliverableWithProfile extends Deliverable {
  profile: {
    email: string;
  };
  issue?: {
    title: string;
  };
}

export interface DeliverableHistory {
  id: string;
  deliverable_id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  updated_by: string;    // Foreign key to profile.id (which is auth.users.id)
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profile: {
        Row: Profile
        Insert: Profile
        Update: Partial<Profile>
      }
      headlines: {
        Row: Headline
        Insert: Omit<Headline, 'id' | 'created_at'>
        Update: Partial<Omit<Headline, 'id' | 'created_at'>>
      }
      issues: {
        Row: Issue
        Insert: Omit<Issue, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Issue, 'id' | 'created_at' | 'updated_at'>>
      }
      deliverables: {
        Row: Deliverable
        Insert: Omit<Deliverable, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Deliverable, 'id' | 'created_at' | 'updated_at'>>
      }
      deliverable_history: {
        Row: DeliverableHistory
        Insert: Omit<DeliverableHistory, 'id' | 'created_at'>
        Update: Partial<Omit<DeliverableHistory, 'id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
