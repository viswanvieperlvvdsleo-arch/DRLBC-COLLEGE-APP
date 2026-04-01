"use client";

import { type ReactNode, useEffect, useRef, useState, createContext, useContext } from "react";
import { UserNav } from "@/components/app/user-nav";
import { GraduationCap, Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/app/main-nav";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { currentUserData, teacherUserData } from "@/lib/mock-data";
import type { Chat, AppNotification, User, Reel } from "@/lib/mock-data";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollNav } from "@/components/app/scroll-nav";
import { useToast } from "@/hooks/use-toast";
import { formatAcademicSummary } from "@/lib/academic";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface MainLayoutContextType {
  useContainer: boolean;
  setUseContainer: (use: boolean) => void;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  reels: Reel[];
  setReels: React.Dispatch<React.SetStateAction<Reel[]>>;
}

const MainLayoutContext = createContext<MainLayoutContextType | undefined>(undefined);

export const useMainLayout = () => {
  const context = useContext(MainLayoutContext);
  if (!context) throw new Error("useMainLayout must be used within a MainLayout");
  return context;
};

export default function MainLayout({ children }: { children: ReactNode }) {
  const { role, isLoading, setRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [hydrated, setHydrated] = useState(false);
  const [bootstrappedUser, setBootstrappedUser] = useState(false);
  const [hasStoredUser, setHasStoredUser] = useState(false);
  const [useContainer, setUseContainer] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(currentUserData);
  const [reels, setReels] = useState<Reel[]>([]);
  const [isAcceptingAcademicUpdate, setIsAcceptingAcademicUpdate] = useState(false);
  const { toast } = useToast();
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const notificationsReady = useRef(false);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const normalizedRole = currentUser?.role?.toLowerCase?.() ?? "";
  const hasPendingAcademicUpdate = normalizedRole === "student" && Boolean(
    currentUser.pendingCourse &&
    currentUser.pendingBranch &&
    currentUser.pendingSection &&
    currentUser.pendingYear
  );
  const currentAcademicSummary = formatAcademicSummary(currentUser) || "Academic profile pending";
  const pendingAcademicSummary = formatAcademicSummary({
    course: currentUser.pendingCourse,
    branch: currentUser.pendingBranch,
    section: currentUser.pendingSection,
    year: currentUser.pendingYear,
  }) || "Pending academic update";

  const academicDepartment = (userLike: {
    role?: string;
    course?: string | null;
    branch?: string | null;
    section?: string | null;
    year?: string | null;
  }) => {
    if (userLike.role?.toUpperCase?.() !== "STUDENT") return undefined;
    return formatAcademicSummary(userLike) || "Academic profile pending";
  };

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Redirect to login **only if role is null and loading finished**
  useEffect(() => {
    if (isLoading) return;

    try {
      const stored = localStorage.getItem("currentUser");
      const parsed = stored ? JSON.parse(stored) : null;

      if (parsed?.id) {
        setHasStoredUser(true);
          setCurrentUser((prev) => ({
            ...prev,
            id: parsed.id ?? prev.id,
            name: parsed.username ?? prev.name,
            email: parsed.email ?? prev.email,
            avatar: parsed.avatar ?? prev.avatar,
            role: parsed.role ? mapRoleToLabel(parsed.role) : prev.role,
            department: academicDepartment(parsed) || prev.department,
            course: parsed.course ?? prev.course,
            branch: parsed.branch ?? prev.branch,
            section: parsed.section ?? prev.section,
            year: parsed.year ?? prev.year,
            pendingCourse: parsed.pendingCourse ?? prev.pendingCourse,
            pendingBranch: parsed.pendingBranch ?? prev.pendingBranch,
            pendingSection: parsed.pendingSection ?? prev.pendingSection,
            pendingYear: parsed.pendingYear ?? prev.pendingYear,
            notifyNss: parsed.notifyNss ?? prev.notifyNss ?? false,
            notifyNcc: parsed.notifyNcc ?? prev.notifyNcc ?? false,
          }));
          if (parsed.role) {
            setRole(parsed.role.toLowerCase());
          }
          setBootstrappedUser(true);
        // If user is on /login, push them to home
        if (pathname === "/login") {
          router.replace("/home");
        }
        return;
      }

      setHasStoredUser(false);
    } catch (err) {
      console.error("Could not hydrate user from localStorage", err);
    }

    if (!role) {
      router.replace("/login");
    }
  }, [isLoading, role, pathname, router, setCurrentUser]);

  const mapRoleToLabel = (dbRole?: string) => {
    if (!dbRole) return "Student" as const;
    switch (dbRole) {
      case "STUDENT":
        return "Student" as const;
      case "TEACHER":
      case "ADMIN":
        return "Professor" as const;
      default:
        return "Student" as const;
    }
  };

  // Set current user from DB if available (falls back to mock data)
  useEffect(() => {
    if (!role) return;

    let baseUser = role === "teacher" ? teacherUserData : currentUserData;

    try {
      const stored = localStorage.getItem("currentUser");
      const parsed = stored ? JSON.parse(stored) : null;

      if (parsed?.id) {
        baseUser = {
          ...baseUser,
          id: parsed.id,
          name: parsed.username || baseUser.name,
          email: parsed.email || baseUser.email,
          role: mapRoleToLabel(parsed.role),
          department: academicDepartment(parsed) || baseUser.department,
          course: parsed.course || baseUser.course,
          branch: parsed.branch || baseUser.branch,
          section: parsed.section || baseUser.section,
          year: parsed.year || baseUser.year,
          pendingCourse: parsed.pendingCourse ?? baseUser.pendingCourse,
          pendingBranch: parsed.pendingBranch ?? baseUser.pendingBranch,
          pendingSection: parsed.pendingSection ?? baseUser.pendingSection,
          pendingYear: parsed.pendingYear ?? baseUser.pendingYear,
        };
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    }

    setCurrentUser(baseUser);

    // Hydrate with the latest user settings from the DB
    const hydrateFromDb = async () => {
      try {
        const res = await fetch(`/api/users/settings?userId=${encodeURIComponent(baseUser.id)}`);
        const text = await res.text();
        const data = JSON.parse(text);

        if (!res.ok || !data?.user) return;

        setCurrentUser((prev) => ({
          ...prev,
          id: data.user.id || prev.id,
          name: data.user.username || prev.name,
          email: data.user.email || prev.email,
          avatar: data.user.avatarUrl || prev.avatar,
          bio: data.user.bio ?? prev.bio,
          role: mapRoleToLabel(data.user.role),
          department: academicDepartment(data.user) || prev.department,
          course: data.user.course ?? prev.course,
          branch: data.user.branch ?? prev.branch,
          section: data.user.section ?? prev.section,
          year: data.user.year ?? prev.year,
          pendingCourse: data.user.pendingCourse ?? prev.pendingCourse,
          pendingBranch: data.user.pendingBranch ?? prev.pendingBranch,
          pendingSection: data.user.pendingSection ?? prev.pendingSection,
          pendingYear: data.user.pendingYear ?? prev.pendingYear,
          notifyNss: data.user.notifyNss ?? false,
          notifyNcc: data.user.notifyNcc ?? false,
        }));
      } catch (err) {
        console.error("Could not hydrate user from DB", err);
      }
    };

    const hydrateReelsFromDb = async () => {
      try {
        const res = await fetch(`/api/reels?userId=${encodeURIComponent(baseUser.id)}`);
        if (!res.ok) {
          setReels([]);
          return;
        }
        const data = (await res.json()) as unknown;
        if (Array.isArray(data) && data.length > 0) {
          setReels(data as any);
        } else {
          setReels([]);
        }
      } catch (err) {
        console.error("Could not hydrate reels from DB", err);
        setReels([]);
      }
    };

    const hydrateChatsFromDb = async () => {
      try {
        const res = await fetch(`/api/chats?userId=${encodeURIComponent(baseUser.id)}`);
        const data = (await res.json()) as { chats?: Chat[] } | undefined;
        if (!res.ok || !data?.chats) return;
        setChats(data.chats);
      } catch (err) {
        console.error("Could not hydrate chats from DB", err);
      }
    };

    const hydrateNotificationsFromDb = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${encodeURIComponent(baseUser.id)}`);
        const data = (await res.json()) as { notifications?: AppNotification[] } | undefined;
        if (!res.ok || !data?.notifications) return;
        setNotifications(data.notifications);
      } catch (err) {
        console.error("Could not hydrate notifications from DB", err);
      }
    };

    if (baseUser.id) {
      void hydrateFromDb();
      void hydrateReelsFromDb();
      void hydrateChatsFromDb();
      void hydrateNotificationsFromDb();
    }
  }, [role]);

  useEffect(() => {
    if (!currentUser?.id) return;
    let isMounted = true;

    const pingPresence = async () => {
      if (!isMounted || typeof document === "undefined") return;
      if (document.visibilityState !== "visible") return;
      try {
        await fetch("/api/users/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id }),
        });
      } catch (err) {
        if (err instanceof TypeError) return;
        console.error("Presence ping failed", err);
      }
    };

    void pingPresence();
    const interval = window.setInterval(pingPresence, 15000);
    const handleVisibility = () => void pingPresence();

    window.addEventListener("visibilitychange", handleVisibility);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [currentUser.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    let isMounted = true;

    const fetchAndToast = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`);
        if (!res.ok) return;

        let data: { notifications?: AppNotification[] } | undefined;
        try {
          data = (await res.json()) as { notifications?: AppNotification[] } | undefined;
        } catch (parseErr) {
          console.error("Could not parse notifications response", parseErr);
          return;
        }
        if (!data?.notifications) return;
        if (!isMounted) return;

        setNotifications(data.notifications);

        if (!notificationsReady.current) {
          data.notifications.forEach((n) => seenNotificationIds.current.add(n.id));
          notificationsReady.current = true;
          return;
        }

        const unseen = data.notifications.filter((n) => !seenNotificationIds.current.has(n.id));
        unseen.forEach((n) => {
          seenNotificationIds.current.add(n.id);
          toast({
            title: n.title,
            description: n.description,
            duration: 3000,
          });
        });
      } catch (err) {
        console.error("Could not refresh notifications", err);
      }
    };

    void fetchAndToast();
    const interval = window.setInterval(fetchAndToast, 10000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [currentUser.id, setNotifications, toast]);

  // Adjust container for specific pages
  useEffect(() => {
    if (["/chat", "/settings", "/notifications", "/reels"].includes(pathname)) {
      setUseContainer(false);
    } else {
      setUseContainer(true);
    }
  }, [pathname]);

  // If already authenticated, avoid staying on the login page
  useEffect(() => {
    if (role && pathname.startsWith("/login")) {
      router.replace("/home");
    }
  }, [role, pathname, router]);

  if (!hydrated || isLoading || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const isChatOrReelsPage = ["/chat", "/reels"].includes(pathname);

  const handleAcceptAcademicUpdate = async () => {
    if (!currentUser?.id) return;

    try {
      setIsAcceptingAcademicUpdate(true);
      const res = await fetch("/api/users/academic-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok || !data?.user) {
        throw new Error(data?.error || "Could not apply the academic update.");
      }

      const mergedUser = {
        ...(JSON.parse(localStorage.getItem("currentUser") || "{}")),
        ...data.user,
      };

      localStorage.setItem("currentUser", JSON.stringify(mergedUser));

      setCurrentUser((prev) => ({
        ...prev,
        course: data.user.course ?? prev.course,
        branch: data.user.branch ?? prev.branch,
        section: data.user.section ?? prev.section,
        year: data.user.year ?? prev.year,
        pendingCourse: undefined,
        pendingBranch: undefined,
        pendingSection: undefined,
        pendingYear: undefined,
        department: academicDepartment(data.user) || prev.department,
      }));

      toast({
        title: "Academic profile updated",
        description: "Your new course details are now active. Use them the next time you log in.",
      });
    } catch (err: any) {
      console.error("Could not accept academic update", err);
      toast({
        title: "Could not apply update",
        description: String(err?.message || err),
        variant: "destructive",
      });
    } finally {
      setIsAcceptingAcademicUpdate(false);
    }
  };

  return (
    <MainLayoutContext.Provider value={{ useContainer, setUseContainer, chats, setChats, notifications, setNotifications, currentUser, setCurrentUser, reels, setReels }}>
      <TooltipProvider>
        <div className="h-screen w-screen flex flex-col">

          {/* Desktop Header */}
          <header className="hidden md:flex flex-shrink-0 h-16 items-center gap-4 border-b bg-card px-4 lg:px-6 z-10">
            <MainNav />
            <div className="ml-auto flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/directory">
                    <Button variant={pathname.startsWith("/directory") ? "secondary" : "ghost"} size="icon" className={cn(pathname.startsWith("/directory") && "text-primary")}>
                      <Users className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>Directory</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/notifications">
                    <Button variant={pathname.startsWith("/notifications") ? "secondary" : "ghost"} size="icon" className={cn("relative", pathname.startsWith("/notifications") && "text-primary")}>
                      <Bell className="h-5 w-5" />
                      {unreadNotificationCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/90"></span>
                        </span>
                      )}
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>Notifications</p></TooltipContent>
              </Tooltip>

              <UserNav />
            </div>
          </header>

          {/* Mobile Header */}
          <header className="md:hidden flex-shrink-0 flex items-center justify-between border-b bg-card px-4 z-10 h-16">
            <Link href="/home" className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className={cn("text-md font-semibold")}>DR.LB college</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/directory">
                <Button variant={pathname.startsWith("/directory") ? "secondary" : "ghost"} size="icon" className={cn(pathname.startsWith("/directory") && "text-primary")}>
                  <Users className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/notifications">
                <Button variant={pathname.startsWith("/notifications") ? "secondary" : "ghost"} size="icon" className={cn("relative", pathname.startsWith("/notifications") && "text-primary")}>
                  <Bell className="h-5 w-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/90"></span>
                    </span>
                  )}
                </Button>
              </Link>
              <UserNav />
            </div>
          </header>

          {/* Main Content */}
          <div className={cn("flex-1 overflow-auto", isChatOrReelsPage && "overflow-hidden")}>
            <main className={cn("flex-1 bg-secondary/30 flex flex-col", isChatOrReelsPage && "h-full", "pb-20 md:pb-0")}>
              {isChatOrReelsPage ? children : (
                <div className={cn(useContainer && "container mx-auto p-4 lg:p-6", "flex-1 flex flex-col")}>
                  {children}
                </div>
              )}
            </main>
          </div>

          {/* Mobile Bottom Nav */}
          <footer className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card z-10">
            <ScrollNav />
          </footer>

        </div>

        <AlertDialog open={hasPendingAcademicUpdate}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Academic Profile Update</AlertDialogTitle>
              <AlertDialogDescription>
                Your teacher has updated your academic batch. Review the change below, then tap update to continue using the app.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border bg-secondary/30 p-4">
                <p className="font-medium">Current login batch</p>
                <p className="text-muted-foreground pt-1">{currentAcademicSummary}</p>
              </div>
              <div className="rounded-lg border bg-secondary/30 p-4">
                <p className="font-medium">New batch after update</p>
                <p className="text-muted-foreground pt-1">{pendingAcademicSummary}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Your old batch details will keep working until you accept this update. After that, only the new academic batch will work for future logins.
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleAcceptAcademicUpdate} disabled={isAcceptingAcademicUpdate}>
                {isAcceptingAcademicUpdate ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update and Continue"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </MainLayoutContext.Provider>
  );
}
