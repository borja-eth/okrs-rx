"use client";

import { useState, useEffect } from "react";
import { IssueService } from "@/services/issues";
import { IssueCard } from "@/components/issues/IssueCard";
import { IssueStatus, IssueWithProfile } from "@/types/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface IssuesListProps {
  onUpdate?: () => void;
}

export function IssuesList({ onUpdate }: IssuesListProps) {
  // Get current week value in the format "YYYY-WXX"
  function getCurrentWeekValue() {
    const now = new Date();
    const startDate = new Date(2024, 11, 30); // Dec 30, 2024 - Start of Week 1
    
    // Calculate the difference in weeks
    const diffTime = now.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
    
    // If we're before the start date, return Week 1 of 2025
    if (diffWeeks <= 0) {
      return "2025-W01";
    }
    
    // If we're after the start date, calculate the current week
    const year = now.getFullYear();
    return `${year}-W${diffWeeks.toString().padStart(2, '0')}`;
  }

  const [issues, setIssues] = useState<IssueWithProfile[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | IssueStatus>("all");
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [owners, setOwners] = useState<{ id: string; email: string }[]>([]);
  const issueService = new IssueService();

  // Generate weeks for the current year
  const getWeekOptions = () => {
    const weeks = [];

    // Add Week 1 (Dec 30, 2024 - Jan 5, 2025) explicitly
    weeks.push({
      value: "2025-W01",
      label: `Week 1 (Dec 30 - Jan 5)`,
    });

    // Start from Jan 6, 2025 for Week 2
    const startDate = new Date(2025, 0, 6); // Jan 6, 2025
    let weekNumber = 2;

    // Generate next 51 weeks (since we already added Week 1)
    for (let i = 0; i < 51; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      weeks.push({
        value: `2025-W${weekNumber.toString().padStart(2, '0')}`,
        label: `Week ${weekNumber} (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')})`,
      });

      weekNumber++;
    }

    return weeks;
  };

  const fetchIssues = async () => {
    setIsLoading(true);
    const { data, error } = await issueService.getIssues(
      selectedWeek === "all" ? undefined : selectedWeek
    );

    if (error) {
      console.error("Error fetching issues:", error);
      setIsLoading(false);
      return;
    }

    // Apply additional filters
    let filteredData = data || [];

    // Filter by status
    if (selectedStatus !== "all") {
      filteredData = filteredData.filter(i => i.status === selectedStatus);
    }

    // Filter by owner
    if (selectedOwner !== "all") {
      filteredData = filteredData.filter(i => i.created_by === selectedOwner);
    }

    setIssues(filteredData);
    
    // Update owners list
    const uniqueOwners = Array.from(new Set(data?.map(i => JSON.stringify({ 
      id: i.created_by, 
      email: i.profile.email 
    })) || [])).map(str => JSON.parse(str));
    setOwners(uniqueOwners);
    
    setIsLoading(false);
  };

  // Fetch issues when filters change
  useEffect(() => {
    fetchIssues();
  }, [selectedWeek, selectedStatus, selectedOwner]);

  // Handle status change to ensure solved issues are only shown with week filter
  useEffect(() => {
    if (selectedStatus === "solved" && selectedWeek === "all") {
      setSelectedWeek(getCurrentWeekValue());
    }
  }, [selectedStatus]);

  const statusCounts = {
    all: issues.length,
    pending: issues.filter(i => i.status === 'pending').length,
    discussed: issues.filter(i => i.status === 'discussed').length,
    solved: issues.filter(i => i.status === 'solved').length,
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="p-2 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Week Filter */}
            <div className="lg:col-span-3">
              <label className="text-sm font-medium mb-2 block">Created In Week</label>
              <Select
                value={selectedWeek}
                onValueChange={(value) => {
                  setSelectedWeek(value);
                  // If deselecting week filter and status is solved, reset status
                  if (value === "all" && selectedStatus === "solved") {
                    setSelectedStatus("all");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Weeks</SelectItem>
                  {getWeekOptions().map((week) => (
                    <SelectItem key={week.value} value={week.value}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Owner Filter */}
            <div className="lg:col-span-3">
              <label className="text-sm font-medium mb-2 block">Owner</label>
              <Select
                value={selectedOwner}
                onValueChange={setSelectedOwner}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2 lg:col-span-6">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Tabs 
                value={selectedStatus} 
                onValueChange={(value) => {
                  const newStatus = value as "all" | IssueStatus;
                  setSelectedStatus(newStatus);
                  // If selecting solved status and no week filter, set current week
                  if (newStatus === "solved" && selectedWeek === "all") {
                    setSelectedWeek(getCurrentWeekValue());
                  }
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    All
                    <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                      {statusCounts.all}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="hidden sm:inline">Pending</span>
                    <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                      {statusCounts.pending}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="discussed" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span className="hidden sm:inline">Discussed</span>
                    <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                      {statusCounts.discussed}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="solved" className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="hidden sm:inline">Solved</span>
                    <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                      {statusCounts.solved}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[300px] rounded-lg border bg-card text-card-foreground shadow-sm animate-pulse"
            />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold">No issues found</h3>
          <p className="text-muted-foreground mt-1">
            {selectedWeek !== "all" || selectedStatus !== "all" || selectedOwner !== "all"
              ? "No issues match the selected filters"
              : "Start by creating your first issue"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map((issue) => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              onUpdate={() => {
                fetchIssues();
                onUpdate?.();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
} 