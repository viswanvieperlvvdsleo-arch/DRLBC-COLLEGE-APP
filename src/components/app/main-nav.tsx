
"use client";

import {
  Home,
  MessagesSquare,
  ClipboardPenLine,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Briefcase,
  Users,
  Bell,
  Video
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export const allMenuItems = [
  { href: "/home", label: "Home", icon: Home, roles: ["student", "teacher"] },
  { href: "/reels", label: "Reels", icon: Video, roles: ["student", "teacher"] },
  { href: "/chat", label: "Chat", icon: MessagesSquare, roles: ["student", "teacher"] },
  { href: "/schedule", label: "Schedule", icon: CalendarDays, roles: ["student", "teacher"] },
  { href: "/notes", label: "Notes", icon: BookOpen, roles: ["student", "teacher"] },
  { href: "/internship", label: "Internship", icon: Briefcase, roles: ["student", "teacher"] },
  { href: "/registrations", label: "Registrations", icon: ClipboardPenLine, roles: ["student", "teacher"] },
  { href: "/directory", label: "Directory", icon: Users, roles: ["student", "teacher"]},
  { href: "/notifications", label: "Notifications", icon: Bell, roles: ["student", "teacher"]},
];

export function MainNav() {
  const pathname = usePathname();

  const mainNavItems = allMenuItems.filter(item => item.href !== '/directory' && item.href !== '/notifications');

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-4">
          <Link href="/home" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className={cn("text-lg font-semibold font-headline")}>
              DR.LB college
            </span>
          </Link>
        </div>
        <nav className="flex items-center space-x-1 lg:space-x-2">
          {mainNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            
            if (item.href === '/profile') return null;

            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="icon"
                      className={cn(
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.label}</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </TooltipProvider>
  );
}
