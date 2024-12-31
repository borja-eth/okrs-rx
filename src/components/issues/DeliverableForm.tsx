"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DeliverableService } from "@/services/deliverables";
import { UserService } from "@/services/users";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Profile } from "@/types/database";

interface DeliverableFormProps {
  issueId: string;
  onDeliverableCreated: () => void;
}

interface DeliverableFormData {
  title: string;
  description: string;
  dueDate: Date;
  accountableId: string;
}

export function DeliverableForm({ issueId, onDeliverableCreated }: DeliverableFormProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const deliverableService = new DeliverableService();
  const userService = new UserService();

  const form = useForm<DeliverableFormData>({
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date(),
      accountableId: "",
    },
  });

  useEffect(() => {
    if (open && users.length === 0) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    const { data, error } = await userService.getUsers();
    if (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } else {
      setUsers(data || []);
    }
    setIsLoadingUsers(false);
  };

  const handleSubmit = async (data: DeliverableFormData) => {
    try {
      const response = await deliverableService.createDeliverable(
        issueId,
        data.title,
        data.description,
        data.dueDate.toISOString(),
        data.accountableId
      );

      if (response.error) {
        if (response.error.code === 'PGRST116') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to create deliverables.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create deliverable.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: "Deliverable created successfully.",
      });

      setOpen(false);
      form.reset();
      onDeliverableCreated();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Target className="h-4 w-4" />
          Solve Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Deliverable</DialogTitle>
          <DialogDescription>
            Add a new deliverable to track the solution for this issue
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] overflow-auto">
          <div className="p-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter deliverable title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what needs to be done..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountableId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accountable User</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select accountable user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <ScrollArea className="max-h-[200px]">
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.email}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Deliverable
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 