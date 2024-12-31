import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, MessageCircle, CalendarDays, Clock, CheckCircle2, CircleDashed, PlayCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IssueService } from "@/services/issues";
import { IssueStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { DeliverableForm } from "./DeliverableForm";
import { DeliverableService } from "@/services/deliverables";
import { DeliverableWithProfile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface IssueCardProps {
  issue: {
    id: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
    status: IssueStatus;
    created_by: string;
    profile: {
      email: string;
    };
  };
  onUpdate: () => void;
}

export function IssueCard({ issue, onUpdate }: IssueCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliverables, setDeliverables] = useState<DeliverableWithProfile[]>([]);
  const [isLoadingDeliverables, setIsLoadingDeliverables] = useState(true);
  const { toast } = useToast();
  
  const issueService = new IssueService();
  const deliverableService = new DeliverableService();

  useEffect(() => {
    fetchDeliverables();
  }, [issue.id]);

  const fetchDeliverables = async () => {
    setIsLoadingDeliverables(true);
    try {
      const response = await deliverableService.getDeliverables(issue.id);
      if (!response.error) {
        setDeliverables(response.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load deliverables.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Unexpected error loading deliverables:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading deliverables.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDeliverables(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setTitle(issue.title);
      setDescription(issue.description);
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await issueService.editIssue(
        issue.id,
        title.trim(),
        description.trim()
      );

      if (!response.error) {
        toast({
          title: "Success",
          description: "Issue updated successfully.",
        });
        setIsEditDialogOpen(false);
        onUpdate();
      } else {
        if (response.error.code === 'PGRST116') {
          toast({
            title: "Access Denied",
            description: "You can only edit issues you created.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update issue.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: IssueStatus) => {
    console.log("🚀 Starting status update...");
    
    try {
      // 1. Get current user synchronously from props or context if possible
      const { data: { user } } = await issueService.getCurrentUser();
      
      // 2. Client-side validations
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update issues.",
          variant: "destructive",
        });
        return;
      }

      if (!issue.created_by || issue.created_by !== user.id) {
        toast({
          title: "Access Denied",
          description: "You can only update issues you created.",
          variant: "destructive",
        });
        return;
      }

      // 3. Check if trying to mark as solved
      if (newStatus === "solved") {
        // Check if there are any deliverables
        if (deliverables.length === 0) {
          toast({
            title: "Error",
            description: "Cannot mark as solved: Issue has no deliverables.",
            variant: "destructive",
          });
          return;
        }

        // Check if all deliverables are completed
        const allCompleted = deliverables.every(d => d.status === "completed");
        if (!allCompleted) {
          toast({
            title: "Error",
            description: "Cannot mark as solved: Not all deliverables are completed.",
            variant: "destructive",
          });
          return;
        }
      }

      // 4. Only proceed with server call if all validations pass
      console.log("📝 Updating issue status:", { id: issue.id, newStatus });
      const response = await issueService.updateIssueStatus(issue.id, newStatus);

      if (response.error) {
        console.error("❌ Error updating issue:", response.error);
        toast({
          title: "Error",
          description: "Failed to update issue status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // 5. Success case
      console.log("✅ Issue updated successfully:", response.data);
      toast({
        title: "Success",
        description: "Issue status updated successfully.",
      });
      
      onUpdate();
      
    } catch (error) {
      // 6. Handle unexpected errors
      console.error("❌ Unexpected error during status update:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const statusConfig = {
    pending: {
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-900",
      label: "Pending",
      icon: Clock,
    },
    discussed: {
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-900",
      label: "Discussed",
      icon: MessageCircle,
    },
    solved: {
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-900",
      label: "Solved",
      icon: CheckCircle2,
    },
  };

  const currentStatus = statusConfig[issue.status];
  const StatusIcon = currentStatus.icon;

  const isUpdated = issue.updated_at !== issue.created_at;

  const getStatusIcon = (status: 'pending' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <CircleDashed className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      {/* Status Badge - Top Right */}
      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(
                "h-7 border px-2 text-xs font-medium",
                currentStatus.bgColor,
                currentStatus.borderColor
              )}
            >
              <StatusIcon className={cn("mr-1 h-3 w-3", currentStatus.color)} />
              {currentStatus.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => handleStatusChange('pending')}
              className="text-xs"
            >
              <Clock className="mr-2 h-3 w-3 text-yellow-500" />
              Mark as Pending
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange('discussed')}
              className="text-xs"
            >
              <MessageCircle className="mr-2 h-3 w-3 text-blue-500" />
              Mark as Discussed
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange('solved')}
              className="text-xs"
            >
              <CheckCircle2 className="mr-2 h-3 w-3 text-green-500" />
              Mark as Solved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-2 pr-24 text-xl">{issue.title}</CardTitle>
        <CardDescription className="line-clamp-3 mt-2.5">
          {issue.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center space-x-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10">
                    {issue.profile.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{issue.profile.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" align="start">
              <div className="flex space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{issue.profile.email.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Creator Details</h4>
                  <p className="text-sm text-muted-foreground">{issue.profile.email}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarDays className="mr-1 h-3 w-3" />
                    Created {new Date(issue.created_at).toLocaleDateString()}
                    {isUpdated && (
                      <span className="ml-2">
                        • Updated {new Date(issue.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        {/* Deliverables Section */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Deliverables</h4>
            <DeliverableForm 
              issueId={issue.id}
              onDeliverableCreated={fetchDeliverables}
            />
          </div>

          {isLoadingDeliverables ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg border bg-card text-card-foreground animate-pulse"
                />
              ))}
            </div>
          ) : deliverables.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No deliverables yet. Click "Solve Issue" to add some.
            </div>
          ) : (
            <div className="space-y-2">
              {deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deliverable.status)}
                      <span className="font-medium">{deliverable.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Due {new Date(deliverable.due_date).toLocaleDateString()}
                      {" • "}
                      Assigned to {deliverable.profile.email}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {deliverable.status}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          deliverableService.updateDeliverableStatus(deliverable.id, 'pending')
                            .then(() => fetchDeliverables());
                        }}
                      >
                        <CircleDashed className="mr-2 h-4 w-4 text-yellow-500" />
                        Mark as Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          deliverableService.updateDeliverableStatus(deliverable.id, 'in_progress')
                            .then(() => fetchDeliverables());
                        }}
                      >
                        <PlayCircle className="mr-2 h-4 w-4 text-blue-500" />
                        Mark as In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          deliverableService.updateDeliverableStatus(deliverable.id, 'completed')
                            .then(() => fetchDeliverables());
                        }}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                        Mark as Completed
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-6">
        <div className="flex w-full items-center justify-end space-x-2">
          <DeliverableForm 
            issueId={issue.id}
            onDeliverableCreated={onUpdate}
          />
          <Dialog open={isEditDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-3">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Issue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Issue</DialogTitle>
                <DialogDescription>
                  Make changes to the issue content here.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Issue Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Describe the issue in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[150px]"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEdit}
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
} 