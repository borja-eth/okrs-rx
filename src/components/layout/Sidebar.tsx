import { LayoutDashboard, User, FileText, Newspaper } from "lucide-react";

const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My IDS",
    href: "/dashboard/my-ids",
    icon: User,
  },
  {
    title: "Issues",
    href: "/dashboard/issues",
    icon: FileText,
  },
  {
    title: "Headlines",
    href: "/dashboard/headlines",
    icon: Newspaper,
  },
  // ... other links ...
]; 