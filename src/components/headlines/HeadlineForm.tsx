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
import { HeadlineService } from "@/services/headlines";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface HeadlineFormProps {
  onHeadlineCreated: () => void;
}

interface HeadlineFormData {
  title: string;
  description: string;
}

export function HeadlineForm({ onHeadlineCreated }: HeadlineFormProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const headlineService = new HeadlineService();

  const form = useForm<HeadlineFormData>({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const handleSubmit = async (data: HeadlineFormData) => {
    try {
      const response = await headlineService.createHeadline(
        data.title,
        data.description
      );

      if (response.error) {
        if (response.error.code === 'PGRST116') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to create headlines.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create headline.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: "Headline created successfully.",
      });

      setOpen(false);
      form.reset();
      onHeadlineCreated();
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
          New Headline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Headline</DialogTitle>
          <DialogDescription>
            Add a new headline to track important updates or announcements
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
                        <Input placeholder="Enter headline title" {...field} />
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
                          placeholder="Describe the headline in detail..."
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
                    Create Headline
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