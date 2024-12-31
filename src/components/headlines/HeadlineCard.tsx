import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CheckCircle, Clock, User, ChevronDown, CalendarDays } from "lucide-react";
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
import { HeadlineService } from "@/services/headlines";
import { HeadlineStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface HeadlineCardProps {
  headline: {
    id: string;
    title: string;
    description: string;
    created_at: string;
    created_by: string;
    status: HeadlineStatus;
    profile: {
      email: string;
    };
  };
  onUpdate: () => void;
}

export function HeadlineCard({ headline, onUpdate }: HeadlineCardProps) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [title, setTitle] = useState(headline.title);
  const [description, setDescription] = useState(headline.description);
  const [status, setStatus] = useState<HeadlineStatus>(headline.status);
  const headlineService = new HeadlineService();
  const { toast } = useToast();

  const handleDialogChange = (open: boolean) => {
    setIsUpdateDialogOpen(open);
    if (!open) {
      setTitle(headline.title);
      setDescription(headline.description);
      setStatus(headline.status);
    }
  };

  const handleDelete = async () => {
    const { data: { user } } = await headlineService.getCurrentUser();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to delete headlines.",
        variant: "destructive",
      });
      return;
    }

    // Check if the user is the creator of the headline
    if (!headline.created_by || headline.created_by !== user.id) {
      toast({
        title: "Access Denied",
        description: "You can only delete headlines you created.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await headlineService.deleteHeadline(headline.id);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete headline. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Headline deleted successfully.",
      });
      onUpdate();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    try {
      const { data: { user } } = await headlineService.getCurrentUser();
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to update headlines.",
          variant: "destructive",
        });
        return;
      }

      // Check if the user is the creator of the headline
      if (!headline.created_by || headline.created_by !== user.id) {
        toast({
          title: "Access Denied",
          description: "You can only update headlines you created.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await headlineService.updateHeadline(
        headline.id,
        title,
        description,
        status
      );

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to update this headline.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update headline. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: "Headline updated successfully.",
      });

      setIsUpdateDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: HeadlineStatus) => {
    try {
      const { data: { user } } = await headlineService.getCurrentUser();
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to update headline status.",
          variant: "destructive",
        });
        return;
      }

      // Check if the user is the creator of the headline
      if (!headline.created_by || headline.created_by !== user.id) {
        toast({
          title: "Access Denied",
          description: "You can only update status of headlines you created.",
          variant: "destructive",
        });
        return;
      }

      setStatus(newStatus);
      const { error } = await headlineService.updateHeadlineStatus(headline.id, newStatus);
      
      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to update this headline's status.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update headline status. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: "Headline status updated successfully.",
      });

      onUpdate();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-900",
      label: "Pending"
    },
    completed: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-900",
      label: "Completed"
    }
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <TooltipProvider>
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
                onClick={() => handleStatusChange('completed')}
                className="text-xs"
              >
                <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
                Mark as Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader>
          <CardTitle className="line-clamp-2 text-xl">{headline.title}</CardTitle>
          <CardDescription className="line-clamp-3 mt-2.5">
            {headline.description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center space-x-4">
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10">
                      {headline.profile.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{headline.profile.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(headline.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80" align="start">
                <div className="flex space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{headline.profile.email.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Creator Details</h4>
                    <p className="text-sm text-muted-foreground">{headline.profile.email}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <CalendarDays className="mr-1 h-3 w-3" />
                      Joined {new Date(headline.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <div className="flex w-full items-center justify-end space-x-2">
            <Dialog open={isUpdateDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={async (e) => {
                    e.preventDefault(); // Prevent the dialog from opening immediately
                    try {
                      const { data: { user } } = await headlineService.getCurrentUser();
                      
                      if (!user) {
                        toast({
                          title: "Authentication Error",
                          description: "You must be logged in to edit headlines.",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Check if the user is the creator of the headline
                      if (!headline.created_by || headline.created_by !== user.id) {
                        toast({
                          title: "Access Denied",
                          description: "You can only edit headlines you created.",
                          variant: "destructive",
                        });
                        return;
                      }

                      // If we get here, the user is authorized to edit
                      setIsUpdateDialogOpen(true);
                    } catch (error) {
                      console.error("Unexpected error:", error);
                      toast({
                        title: "Error",
                        description: "An unexpected error occurred.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Headline</DialogTitle>
                  <DialogDescription>
                    Make changes to your headline here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn(
                            "w-full justify-start",
                            currentStatus.bgColor,
                            currentStatus.borderColor
                          )}
                        >
                          <StatusIcon className={cn("mr-2 h-4 w-4", currentStatus.color)} />
                          {currentStatus.label}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuItem onClick={() => setStatus('pending')}>
                          <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatus('completed')}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Completed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => handleDialogChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate}>Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-8 px-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
} 