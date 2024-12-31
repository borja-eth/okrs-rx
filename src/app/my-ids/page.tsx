"use client";

import { useState, useEffect } from "react";
import { MyIDSService } from "@/services/my-ids";
import { IssueCard } from "@/components/issues/IssueCard";
import { HeadlineCard } from "@/components/headlines/HeadlineCard";
import { TodoCard } from "@/components/todos/TodoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Newspaper, CheckSquare } from "lucide-react";

export default function MyIDSPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [headlines, setHeadlines] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState({
    issues: true,
    headlines: true,
    todos: true,
  });
  
  const myIDSService = new MyIDSService();

  const fetchIssues = async () => {
    setIsLoading(prev => ({ ...prev, issues: true }));
    const { data, error } = await myIDSService.getMyIssues();
    if (!error) {
      setIssues(data || []);
    }
    setIsLoading(prev => ({ ...prev, issues: false }));
  };

  const fetchHeadlines = async () => {
    setIsLoading(prev => ({ ...prev, headlines: true }));
    const { data, error } = await myIDSService.getMyHeadlines();
    if (!error) {
      setHeadlines(data || []);
    }
    setIsLoading(prev => ({ ...prev, headlines: false }));
  };

  const fetchTodos = async () => {
    setIsLoading(prev => ({ ...prev, todos: true }));
    const { data, error } = await myIDSService.getMyTodos();
    if (!error) {
      setTodos(data || []);
    }
    setIsLoading(prev => ({ ...prev, todos: false }));
  };

  useEffect(() => {
    fetchIssues();
    fetchHeadlines();
    fetchTodos();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My IDS</h1>
        <p className="text-muted-foreground mt-1">
          Track your issues, deliverables, and status
        </p>
      </div>

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues" className="gap-2">
            <FileText className="h-4 w-4" />
            Issues
            <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-sm">
              {issues.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="headlines" className="gap-2">
            <Newspaper className="h-4 w-4" />
            Headlines
            <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-sm">
              {headlines.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="todos" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            To Do's
            <span className="ml-1 rounded-md bg-muted px-2 py-0.5 text-sm">
              {todos.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <TabsContent value="issues" className="mt-6">
            {isLoading.issues ? (
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
                  You haven't created any issues yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {issues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onUpdate={fetchIssues}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="headlines" className="mt-6">
            {isLoading.headlines ? (
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
                  You haven't created any headlines yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {headlines.map((headline) => (
                  <HeadlineCard
                    key={headline.id}
                    headline={headline}
                    onUpdate={fetchHeadlines}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="todos" className="mt-6">
            {isLoading.todos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[300px] rounded-lg border bg-card text-card-foreground shadow-sm animate-pulse"
                  />
                ))}
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold">No todos found</h3>
                <p className="text-muted-foreground mt-1">
                  You don't have any todos assigned to you
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onUpdate={fetchTodos}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
} 