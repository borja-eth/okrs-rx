"use client"

import { useState } from "react";
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
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { IssueService } from "@/services/issues";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface IssueFormProps {
  onIssueCreated: () => void;
}

interface IssueFormData {
  title: string;
  description: string;
}

export function IssueForm({ onIssueCreated }: IssueFormProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const issueService = new IssueService();

  const form = useForm<IssueFormData>({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const handleSubmit = async (data: IssueFormData) => {
    try {
      const response = await issueService.createIssue(
        data.title,
        data.description
      );

      if (response.error) {
        if (response.error.code === 'PGRST116') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to create issues.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create issue.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: "Issue created successfully.",
      });

      setOpen(false);
      form.reset();
      onIssueCreated();
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>
            Add a new issue to track and solve problems or improvements
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
                        <Input placeholder="Enter issue title" {...field} />
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
                          placeholder="Describe the issue in detail..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
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
                    Create Issue
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