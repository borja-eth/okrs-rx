"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeliverableService } from "@/services/deliverables";
import { DeliverableStatus, DeliverableWithProfile } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Circle, Clock, AlertCircle, CalendarDays, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IssueService } from "@/services/issues";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TodoCardProps {
  todo: DeliverableWithProfile;
  onUpdate: () => void;
}

export function TodoCard({ todo, onUpdate }: TodoCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const deliverableService = new DeliverableService();
  const { toast } = useToast();

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-900",
      label: "Pending"
    },
    in_progress: {
      icon: Circle,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-900",
      label: "In Progress"
    },
    completed: {
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-900",
      label: "Completed"
    }
  };

  const currentStatus = statusConfig[todo.status];
  const StatusIcon = currentStatus.icon;

  const handleStatusChange = async (newStatus: DeliverableStatus) => {
    console.log("🚀 Starting status update...");
    setIsUpdating(true);

    try {
      // 1. Get current user synchronously from props or context if possible
      const { data: { user } } = await deliverableService.getCurrentUser();
      
      // 2. Client-side validations
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update todos.",
          variant: "destructive",
        });
        return;
      }

      if (todo.accountable_id !== user.id) {
        toast({
          title: "Error",
          description: "You can only update todos assigned to you.",
          variant: "destructive",
        });
        return;
      }

      // 3. Only proceed with server call if all validations pass
      const { error } = await deliverableService.updateDeliverableStatus(todo.id, newStatus);
      
      if (error) {
        switch (error.code) {
          case 'NOT_FOUND':
            toast({
              title: "Error",
              description: "This todo no longer exists.",
              variant: "destructive",
            });
            break;
          case 'UPDATE_ERROR':
            toast({
              title: "Error",
              description: "Failed to update todo status. Please try again.",
              variant: "destructive",
            });
            break;
          case 'HISTORY_ERROR':
            // We still show success but warn about history
            toast({
              title: "Warning",
              description: "Status updated but failed to record history.",
              variant: "default",
            });
            onUpdate();
            break;
          default:
            toast({
              title: "Error",
              description: "An unexpected error occurred. Please try again.",
              variant: "destructive",
            });
        }
        return;
      }

      // 4. Success case
      toast({
        title: "Success",
        description: "Todo status updated successfully.",
      });

      // 5. Check if all deliverables for this issue are completed
      if (newStatus === 'completed' && todo.issue_id) {
        const { data: deliverables } = await deliverableService.getDeliverables(todo.issue_id);
        
        if (deliverables && deliverables.length > 0) {
          const allCompleted = deliverables.every(d => d.status === 'completed');
          
          if (allCompleted) {
            const issueService = new IssueService();
            const { error: issueError } = await issueService.updateIssueStatus(todo.issue_id, 'solved');
            
            if (!issueError) {
              toast({
                title: "Success",
                description: "All todos completed! Issue status updated to Solved.",
              });
            }
          }
        }
      }

      onUpdate();

    } catch (error) {
      // 6. Handle unexpected errors
      console.error("Unexpected error during status update:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="space-y-2 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5 min-w-0">
            <h3 className="text-base font-semibold line-clamp-2 pr-4 md:text-lg">{todo.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Due {formatDistanceToNow(new Date(todo.due_date), { addSuffix: true })}</span>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1.5 h-7 px-2 text-xs font-medium whitespace-nowrap flex-shrink-0",
              currentStatus.bgColor,
              currentStatus.borderColor
            )}
          >
            <StatusIcon className={cn("h-3.5 w-3.5", currentStatus.color)} />
            {currentStatus.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 md:px-6">
        <p className="text-sm text-muted-foreground line-clamp-3">{todo.description}</p>
        
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10">
                    {todo.profile?.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-none truncate">{todo.profile?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Assignee</p>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" align="start">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback>{todo.profile?.email.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <h4 className="text-sm font-semibold">Assignee Details</h4>
                  <p className="text-sm text-muted-foreground truncate">{todo.profile?.email}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Assigned to this todo</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          {todo.issue?.title && (
            <Badge 
              variant="secondary" 
              className="justify-start md:justify-end truncate max-w-full md:max-w-[50%]"
            >
              <span className="truncate">Related to issue: {todo.issue.title}</span>
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-end md:gap-3 md:p-6">
        {todo.status !== "completed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("completed")}
            disabled={isUpdating}
            className="w-full md:w-auto"
          >
            <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Mark as Completed</span>
          </Button>
        )}
        {todo.status === "pending" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("in_progress")}
            disabled={isUpdating}
            className="w-full md:w-auto"
          >
            <Circle className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Start Progress</span>
          </Button>
        )}
        {todo.status === "in_progress" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("pending")}
            disabled={isUpdating}
            className="w-full md:w-auto"
          >
            <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Pause Progress</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 