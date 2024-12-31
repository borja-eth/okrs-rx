"use client";

import { useState } from "react";
import { IssueForm } from "@/components/issues/IssueForm";
import { IssuesList } from "@/components/issues/IssuesList";

export default function IssuesPage() {
  const [key, setKey] = useState(0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Issues</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage team issues
          </p>
        </div>
        <IssueForm onIssueCreated={() => setKey(prev => prev + 1)} />
      </div>

      {/* Issues List */}
      <IssuesList key={key} />
    </div>
  );
} 