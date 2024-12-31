"use client"

import { Calendar, Home, Inbox, LogOut, Search, Settings, MessageSquarePlus } from "lucide-react"
import { logout } from "@/app/login/actions"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Headlines",
    url: "headlines",
    icon: Search,
  },
  {
    title: "Issues",
    url: "issues",
    icon: Calendar,
  },
  {
    title: "To Do's",
    url: "todos",
    icon: Settings,
  },
  {
    title: "My IDS",
    url: "my-ids",
    icon: Inbox,
  },
  {
    title: "Feedback",
    url: "feedback",
    icon: MessageSquarePlus,
  },
]

export function AppSidebar() {
  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r"
      variant="sidebar"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <form action={logout}>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2" 
            type="submit"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </Button>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
