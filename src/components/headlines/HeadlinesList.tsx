"use client";

import { useState, useEffect } from "react";
import { HeadlineService } from "@/services/headlines";
import { HeadlineCard } from "@/components/headlines/HeadlineCard";
import { HeadlineStatus } from "@/types/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, getWeek, startOfWeek, endOfWeek } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface HeadlineWithProfile {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  status: HeadlineStatus;
  profile: {
    email: string;
  };
}

interface HeadlinesListProps {
  onUpdate?: () => void;
}

export function HeadlinesList({ onUpdate }: HeadlinesListProps) {
  const [headlines, setHeadlines] = useState<HeadlineWithProfile[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | HeadlineStatus>("all");
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [owners, setOwners] = useState<{ id: string; email: string }[]>([]);
  const headlineService = new HeadlineService();

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

  // Generate weeks for the current year
  const getWeekOptions = () => {
    // Start from Dec 30, 2024 (first day of Week 1)
    const startDate = new Date(2024, 11, 30); // Month is 0-based, so 11 is December
    const weeks = [];
    let weekNumber = 1;

    // Generate next 52 weeks
    for (let i = 0; i < 52; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Determine the year to use in the week value
      const year = weekEnd.getFullYear();

      weeks.push({
        value: `${year}-W${weekNumber.toString().padStart(2, '0')}`,
        label: `Week ${weekNumber} (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')})`,
      });

      weekNumber++;
    }

    return weeks;
  };

  const fetchHeadlines = async () => {
    console.log('fetchHeadlines - selectedWeek:', selectedWeek);
    setIsLoading(true);
    const { data, error } = await headlineService.getHeadlines(
      selectedWeek === "all" ? undefined : selectedWeek
    );

    if (error) {
      console.error("Error fetching headlines:", error);
      setIsLoading(false);
      return;
    }

    // Apply additional filters
    let filteredData = data || [];

    // Filter by status
    if (selectedStatus !== "all") {
      filteredData = filteredData.filter(h => h.status === selectedStatus);
    }

    // Filter by owner
    if (selectedOwner !== "all") {
      filteredData = filteredData.filter(h => h.created_by === selectedOwner);
    }

    setHeadlines(filteredData);
    
    // Update owners list
    const uniqueOwners = Array.from(new Set(data?.map(h => JSON.stringify({ 
      id: h.created_by, 
      email: h.profile.email 
    })) || [])).map(str => JSON.parse(str));
    setOwners(uniqueOwners);
    
    setIsLoading(false);
  };

  // Fetch headlines when filters change
  useEffect(() => {
    fetchHeadlines();
  }, [selectedWeek, selectedStatus, selectedOwner]);

  const statusCounts = {
    all: headlines.length,
    pending: headlines.filter(h => h.status === 'pending').length,
    completed: headlines.filter(h => h.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="p-2 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Week Filter */}
            <div className="lg:col-span-3">
              <label className="text-sm font-medium mb-2 block">Week</label>
              <Select
                defaultValue={getCurrentWeekValue()}
                onValueChange={setSelectedWeek}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by week" defaultValue={getWeekOptions().find(w => w.value === getCurrentWeekValue())?.label} />
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
                onValueChange={(value) => setSelectedStatus(value as "all" | HeadlineStatus)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
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
                  <TabsTrigger value="completed" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="hidden sm:inline">Completed</span>
                    <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                      {statusCounts.completed}
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
      ) : headlines.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold">No headlines found</h3>
          <p className="text-muted-foreground mt-1">
            {selectedWeek !== "all" || selectedStatus !== "all" || selectedOwner !== "all"
              ? "No headlines match the selected filters"
              : "Start by creating your first headline"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {headlines.map((headline) => (
            <HeadlineCard 
              key={headline.id} 
              headline={headline} 
              onUpdate={() => {
                fetchHeadlines();
                onUpdate?.();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
} 