import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Target, ListTodo, Users, TrendingUp, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect("/login")
  }

  // Get statistics
  const { data: headlines } = await supabase
    .from("headlines")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)
  
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("id")

  const { data: users } = await supabase
    .from("profile")
    .select("id")

  return (
    <div className="w-full space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your IDS Management System
          </p>
        </div>
      </div>

      <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Headlines
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{headlines?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active headlines in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Deliverables
            </CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliverables?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pending deliverables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <Progress value={68} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Headlines</CardTitle>
            <CardDescription>
              Latest headlines created in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] pr-4">
              {headlines?.map((headline) => (
                <div key={headline.id} className="mb-4 last:mb-0">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {headline.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {headline.description}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-4">
                {headlines?.map((headline) => (
                  <div key={headline.id}>
                    <div className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          New headline created: "{headline.title}"
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(headline.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Separator className="my-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 