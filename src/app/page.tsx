"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, CircleDashed, Clock, FileText, ListTodo, MessageCircle, PlayCircle, Plus, Target, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { DeliverableStatus, HeadlineStatus, IssueStatus, Deliverable } from "@/types/database";

// Chart component for visualizing data
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface IssueWithDeliverables {
  id: string;
  title: string;
  status: IssueStatus;
  created_at: string;
  deliverables: Array<Deliverable & { profile: { email: string } }>;
}

interface TodoWithIssue extends Deliverable {
  issue: {
    title: string;
    description?: string;
  };
}

interface TodoWithProfile extends Deliverable {
  profile: {
    email: string;
  };
  issue: {
    title: string;
    created_by: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    headlines: { total: 0, pending: 0, completed: 0 },
    issues: { total: 0, pending: 0, discussed: 0, solved: 0 },
    todos: { total: 0, pending: 0, in_progress: 0, completed: 0 },
    users: { total: 0 },
  });
  const [recentHeadlines, setRecentHeadlines] = useState<any[]>([]);
  const [recentIssues, setRecentIssues] = useState<any[]>([]);
  const [recentTodos, setRecentTodos] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [myIssues, setMyIssues] = useState<IssueWithDeliverables[]>([]);
  const [myTodos, setMyTodos] = useState<TodoWithIssue[]>([]);
  const [todosOnMyIssues, setTodosOnMyIssues] = useState<TodoWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch headlines statistics
    const { data: headlines } = await supabase
      .from("headlines")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch issues statistics
    const { data: issues } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch todos statistics
    const { data: todos } = await supabase
      .from("deliverables")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch users count
    const { count: usersCount } = await supabase
      .from("profile")
      .select("*", { count: 'exact', head: true });

    // Fetch my issues
    const { data: myIssues } = await supabase
      .from("issues")
      .select(`
        *,
        deliverables (
          *,
          profile:accountable_id (
            email
          )
        )
      `)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    // Fetch my assigned todos
    const { data: myTodos } = await supabase
      .from("deliverables")
      .select(`
        *,
        issue:issue_id (
          title,
          description
        )
      `)
      .eq("accountable_id", user.id)
      .order("due_date", { ascending: true });

    // Fetch todos on my issues
    const { data: todosOnMyIssues } = await supabase
      .from("deliverables")
      .select(`
        *,
        profile:accountable_id (
          email
        ),
        issue:issue_id (
          title,
          created_by
        )
      `)
      .in(
        "issue_id", 
        (myIssues || []).map(issue => issue.id)
      )
      .order("due_date", { ascending: true });

    // Update statistics
    setStats({
      headlines: {
        total: headlines?.length || 0,
        pending: headlines?.filter(h => h.status === "pending").length || 0,
        completed: headlines?.filter(h => h.status === "completed").length || 0,
      },
      issues: {
        total: issues?.length || 0,
        pending: issues?.filter(i => i.status === "pending").length || 0,
        discussed: issues?.filter(i => i.status === "discussed").length || 0,
        solved: issues?.filter(i => i.status === "solved").length || 0,
      },
      todos: {
        total: todos?.length || 0,
        pending: todos?.filter(t => t.status === "pending").length || 0,
        in_progress: todos?.filter(t => t.status === "in_progress").length || 0,
        completed: todos?.filter(t => t.status === "completed").length || 0,
      },
      users: {
        total: usersCount || 0,
      },
    });

    // Set recent items
    setRecentHeadlines(headlines?.slice(0, 5) || []);
    setRecentIssues(issues?.slice(0, 5) || []);
    setRecentTodos(todos?.slice(0, 5) || []);
    setMyIssues(myIssues || []);
    setMyTodos(myTodos || []);
    setTodosOnMyIssues(todosOnMyIssues || []);

    // Generate activity data for the chart
    const now = new Date();
    const activityData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, "MMM dd");
      
      return {
        name: dateStr,
        headlines: headlines?.filter(h => 
          new Date(h.created_at).toDateString() === date.toDateString()
        ).length || 0,
        issues: issues?.filter(i => 
          new Date(i.created_at).toDateString() === date.toDateString()
        ).length || 0,
        todos: todos?.filter(t => 
          new Date(t.created_at).toDateString() === date.toDateString()
        ).length || 0,
      };
    }).reverse();

    setActivityData(activityData);
    setIsLoading(false);
  };

  const getStatusColor = (status: HeadlineStatus | IssueStatus | DeliverableStatus) => {
    switch (status) {
      case "pending": return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20";
      case "completed": return "text-green-500 bg-green-100 dark:bg-green-900/20";
      case "discussed": return "text-blue-500 bg-blue-100 dark:bg-blue-900/20";
      case "solved": return "text-green-500 bg-green-100 dark:bg-green-900/20";
      case "in_progress": return "text-blue-500 bg-blue-100 dark:bg-blue-900/20";
      default: return "text-gray-500 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status: HeadlineStatus | IssueStatus | DeliverableStatus) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "completed": return <CheckCircle2 className="h-4 w-4" />;
      case "discussed": return <MessageCircle className="h-4 w-4" />;
      case "solved": return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress": return <PlayCircle className="h-4 w-4" />;
      default: return <CircleDashed className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your IDS Management System
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/headlines/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Headline
            </Button>
          </Link>
        </div>
      </div>

      {/* My Work Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My Issues</CardTitle>
            <CardDescription>Issues you have created</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {myIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No issues created yet</p>
              ) : (
                myIssues.map((issue) => (
                  <div key={issue.id} className="mb-4 last:mb-0">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{issue.title}</p>
                        <Badge className={getStatusColor(issue.status)} variant="secondary">
                          <span className="flex items-center">
                            {getStatusIcon(issue.status)}
                            <span className="ml-1">{issue.status}</span>
                          </span>
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(issue.created_at), "MMM dd, yyyy")}</span>
                        <span>{issue.deliverables?.length || 0} todos</span>
                      </div>
                      <Progress 
                        value={
                          issue.deliverables?.length
                            ? (issue.deliverables.filter(d => d.status === "completed").length / issue.deliverables.length) * 100
                            : 0
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My To Do's</CardTitle>
            <CardDescription>Tasks assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {myTodos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No todos assigned to you</p>
              ) : (
                myTodos.map((todo) => (
                  <div key={todo.id} className="mb-4 last:mb-0">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{todo.title}</p>
                        <Badge className={getStatusColor(todo.status)} variant="secondary">
                          <span className="flex items-center">
                            {getStatusIcon(todo.status)}
                            <span className="ml-1">{todo.status}</span>
                          </span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        From: {todo.issue?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {format(new Date(todo.due_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>To Do's on My Issues</CardTitle>
            <CardDescription>Status of todos related to your issues</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {todosOnMyIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No todos on your issues yet</p>
              ) : (
                todosOnMyIssues.map((todo) => (
                  <div key={todo.id} className="mb-4 last:mb-0">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{todo.title}</p>
                        <Badge className={getStatusColor(todo.status)} variant="secondary">
                          <span className="flex items-center">
                            {getStatusIcon(todo.status)}
                            <span className="ml-1">{todo.status}</span>
                          </span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        From: {todo.issue?.title}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Assigned to: {todo.profile?.email}</span>
                        <span>Due: {format(new Date(todo.due_date), "MMM dd")}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Headlines</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.headlines.total}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3 text-yellow-500" />
                <span>{stats.headlines.pending} pending</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                <span>{stats.headlines.completed} completed</span>
              </div>
            </div>
            <Progress 
              value={(stats.headlines.completed / stats.headlines.total) * 100} 
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.issues.total}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3 text-yellow-500" />
                <span>{stats.issues.pending} pending</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                <span>{stats.issues.solved} solved</span>
              </div>
            </div>
            <Progress 
              value={(stats.issues.solved / stats.issues.total) * 100} 
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total To Do's</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todos.total}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3 text-yellow-500" />
                <span>{stats.todos.pending} pending</span>
              </div>
              <span>•</span>
              <div className="flex items-center">
                <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                <span>{stats.todos.completed} completed</span>
              </div>
            </div>
            <Progress 
              value={(stats.todos.completed / stats.todos.total) * 100} 
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active team members in the system
            </p>
            <Progress value={100} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>
              Your team's activity over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={activityData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="headlines" name="Headlines" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="issues" name="Issues" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="todos" name="To Do's" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates across your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="headlines" className="space-y-4">
              <TabsList>
                <TabsTrigger value="headlines">Headlines</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="todos">To Do's</TabsTrigger>
              </TabsList>
              <TabsContent value="headlines" className="space-y-4">
                <ScrollArea className="h-[350px]">
                  {recentHeadlines.map((headline) => (
                    <div key={headline.id} className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                      <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-sky-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{headline.title}</p>
                        <Badge className={getStatusColor(headline.status)} variant="secondary">
                          <span className="flex items-center">
                            {getStatusIcon(headline.status)}
                            <span className="ml-1">{headline.status}</span>
                          </span>
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(headline.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="issues" className="space-y-4">
                <ScrollArea className="h-[350px]">
                  {recentIssues.map((issue) => (
                    <div key={issue.id} className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                      <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-sky-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{issue.title}</p>
                        <Badge className={getStatusColor(issue.status)} variant="secondary">
                          <span className="flex items-center">
                            {getStatusIcon(issue.status)}
                            <span className="ml-1">{issue.status}</span>
                          </span>
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(issue.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="todos" className="space-y-4">
                <ScrollArea className="h-[350px]">
                  {recentTodos.map((todo) => (
                    <div key={todo.id} className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                      <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-sky-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{todo.title}</p>
                        <Badge className={getStatusColor(todo.status)} variant="secondary">
                          <span className="flex items-center">
                            {getStatusIcon(todo.status)}
                            <span className="ml-1">{todo.status}</span>
                          </span>
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Due: {format(new Date(todo.due_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Headlines Progress</CardTitle>
            <CardDescription>Status distribution of headlines</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { name: "Pending", value: stats.headlines.pending },
                { name: "Completed", value: stats.headlines.completed },
              ]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issues Progress</CardTitle>
            <CardDescription>Status distribution of issues</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { name: "Pending", value: stats.issues.pending },
                { name: "Discussed", value: stats.issues.discussed },
                { name: "Solved", value: stats.issues.solved },
              ]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>To Do's Progress</CardTitle>
            <CardDescription>Status distribution of to-do's</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={[
                { name: "Pending", value: stats.todos.pending },
                { name: "In Progress", value: stats.todos.in_progress },
                { name: "Completed", value: stats.todos.completed },
              ]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
