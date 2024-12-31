"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FeedbackCategory = "bug" | "feature" | "improvement" | "other";
type FeedbackPriority = "low" | "medium" | "high";

export default function FeedbackPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("improvement");
  const [priority, setPriority] = useState<FeedbackPriority>("medium");
  const [tags, setTags] = useState<string>("");
  
  const supabase = createClient();
  const { toast } = useToast();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("improvement");
    setPriority("medium");
    setTags("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to submit feedback"
        });
        return;
      }

      const { error } = await supabase
        .from("feedback")
        .insert({
          user_id: user.id,
          title,
          description,
          category,
          priority,
          tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
          status: "pending"
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Thank you for your feedback! We'll review it shortly."
      });
      resetForm();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit feedback. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>
            Help us improve by sharing your thoughts, reporting bugs, or suggesting new features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief summary of your feedback"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about your feedback"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="min-h-[150px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <RadioGroup
                value={category}
                onValueChange={(value) => setCategory(value as FeedbackCategory)}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bug" id="bug" />
                  <Label htmlFor="bug">Bug Report</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="feature" id="feature" />
                  <Label htmlFor="feature">Feature Request</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="improvement" id="improvement" />
                  <Label htmlFor="improvement">Improvement Suggestion</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as FeedbackPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="ui, performance, mobile..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 