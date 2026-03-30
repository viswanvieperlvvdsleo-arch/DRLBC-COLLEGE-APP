"use client";

import { useEffect, useRef, useState } from "react";
import {
  User,
  Palette,
  Shield,
  Upload,
  Mail,
  Trash2,
  HelpCircle,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useMainLayout } from "../layout";
import { formatAcademicSummary, formatAcademicValue } from "@/lib/academic";


type SettingsSection = "profile" | "appearance" | "account" | "notifications";

type SettingsData = {
  id: string;
  email: string;
  username: string;
  bio: string;
  avatarUrl: string;
  course: string;
  branch: string;
  section: string;
  year: string;
  theme: string;
  notifyPushPosts: boolean;
  notifyPushLikes: boolean;
  notifyPushComments: boolean;
  notifyPushMessages: boolean;
  notifyPushReels: boolean;
  notifyPushNotices: boolean;
  notifyPushSchedule: boolean;
  notifyPushNotes: boolean;
  notifyPushInternships: boolean;
  notifyNss: boolean;
  notifyNcc: boolean;
  notifyEmailDigest: boolean;
  notifyEmailAnnouncements: boolean;
  role: string;
};

type PushPermissionState = NotificationPermission | "unsupported" | "loading";

const PUSH_PRODUCTION_MESSAGE = "Push notifications are only available from a production build. Run npm run build and npm run start first.";

const menuItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const mapRoleToLabel = (role?: string) => {
  if (!role) return "Student";
  switch (role) {
    case "STUDENT":
      return "Student";
    case "TEACHER":
    case "ADMIN":
      return "Professor";
    default:
      return role;
  }
};

const buildSettingsFromUser = (user: any): SettingsData => ({
  id: user?.id ?? "",
  email: user?.email ?? "",
  username: user?.username ?? "",
  bio: user?.bio ?? "",
  avatarUrl: user?.avatarUrl ?? "",
  course: user?.course ?? "",
  branch: user?.branch ?? "",
  section: user?.section ?? "",
  year: user?.year ?? "",
  theme: user?.theme ?? "light",
  notifyPushPosts: user?.notifyPushPosts ?? true,
  notifyPushLikes: user?.notifyPushLikes ?? true,
  notifyPushComments: user?.notifyPushComments ?? true,
  notifyPushMessages: user?.notifyPushMessages ?? false,
  notifyPushReels: user?.notifyPushReels ?? true,
  notifyPushNotices: user?.notifyPushNotices ?? true,
  notifyPushSchedule: user?.notifyPushSchedule ?? true,
  notifyPushNotes: user?.notifyPushNotes ?? true,
  notifyPushInternships: user?.notifyPushInternships ?? true,
  notifyNss: user?.notifyNss ?? false,
  notifyNcc: user?.notifyNcc ?? false,
  notifyEmailDigest: user?.notifyEmailDigest ?? true,
  notifyEmailAnnouncements: user?.notifyEmailAnnouncements ?? true,
  role: user?.role ?? "STUDENT",
});

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

const waitForServiceWorkerReady = async (timeoutMs = 8000) => {
  const readyPromise = navigator.serviceWorker.ready;
  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => {
      reject(new Error("Push service worker is taking too long to activate. Reload the app and try again."));
    }, timeoutMs);
  });

  return Promise.race([readyPromise, timeoutPromise]);
};

const ensurePushServiceWorkerRegistration = async () => {
  const existingRegistration =
    (await navigator.serviceWorker.getRegistration()) ||
    (await navigator.serviceWorker.getRegistration("/"));

  if (existingRegistration?.active || existingRegistration?.waiting || existingRegistration?.installing) {
    return waitForServiceWorkerReady();
  }

  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return waitForServiceWorkerReady();
};

function ProfileSection({
  settings,
  onChange,
  onSave,
  isSaving,
  fallbackAvatar,
}: {
  settings: SettingsData;
  onChange: (updates: Partial<SettingsData>) => void;
  onSave: () => void;
  isSaving: boolean;
  fallbackAvatar: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = settings.username || "User";
  const avatarSrc = settings.avatarUrl || fallbackAvatar || "/avatar-placeholder.png";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="shadow-none border-0 bg-transparent">
      <CardHeader>
        <CardTitle className="text-xl">Profile</CardTitle>
        <CardDescription>This information will be displayed publicly on your profile.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarSrc} data-ai-hint="profile picture" />
            <AvatarFallback>{displayName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <Button variant="outline" onClick={handleUploadClick}>
            <Upload className="mr-2 h-4 w-4" />
            Change picture
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="animated-border-input">
              <Input
                id="name"
                value={settings.username}
                onChange={(e) => onChange({ username: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="id">ID</Label>
            <div className="animated-border-input">
              <Input id="id" value={settings.id} disabled />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <div className="animated-border-input">
            <Textarea
              id="bio"
              value={settings.bio}
              onChange={(e) => onChange({ bio: e.target.value })}
              rows={3}
              placeholder="Tell us a little about yourself"
            />
          </div>
        </div>
        {settings.role === "STUDENT" && (
          <div className="space-y-4 rounded-xl border bg-secondary/30 p-4">
            <div>
              <h3 className="font-medium text-lg">Academic Profile</h3>
              <p className="text-sm text-muted-foreground">
                These details are locked after signup and are used to control what you can access.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course</Label>
                <Input value={formatAcademicValue("course", settings.course)} disabled />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input value={formatAcademicValue("branch", settings.branch)} disabled />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input value={formatAcademicValue("section", settings.section)} disabled />
              </div>
              <div className="space-y-2">
                <Label>Year / Semester</Label>
                <Input value={formatAcademicValue("year", settings.year)} disabled />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Summary: {formatAcademicSummary(settings) || "Academic profile pending"}
            </p>
          </div>
        )}
        <div>
          <Button variant="glow" disabled={isSaving} onClick={onSave}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountSection({
  settings,
  onLogout,
  onDelete,
  isSaving,
}: {
  settings: SettingsData;
  onLogout: () => void;
  onDelete: (payload: { currentPassword: string }) => Promise<boolean>;
  isSaving: boolean;
}) {
  const [deletePassword, setDeletePassword] = useState("");

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert("Enter your current password to delete your account");
      return;
    }
    const ok = await onDelete({ currentPassword: deletePassword });
    if (ok) {
      setDeletePassword("");
    }
  };

  return (
    <Card className="shadow-none border-0 bg-transparent">
      <CardHeader>
        <CardTitle className="text-xl">Account</CardTitle>
        <CardDescription>Manage your login session and account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Email Address</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Mail className="h-5 w-5" />
            <span>
              Current email:{" "}
              <span className="font-semibold text-primary">
                {settings.email || "Not set"}
              </span>
            </span>
          </div>
        </div>
        <Separator />
        <div className="space-y-3">
          <h3 className="font-medium text-lg">Session</h3>
          <p className="text-sm text-muted-foreground">
            Logout will take you back to the login page. Your data stays safely in the database.
          </p>
          <Button variant="outline" className="w-full" onClick={onLogout} disabled={isSaving}>
            Logout
          </Button>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
            <CardDescription className="text-destructive/80">
              These actions are permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="account-delete-password">Current Password</Label>
              <Input
                id="account-delete-password"
                type="password"
                placeholder="Enter current password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2 w-full" disabled={isSaving}>
                  <Trash2 className="h-4 w-4" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={(e) => {
                      e.preventDefault();
                      void handleDeleteAccount();
                    }}
                  >
                    {isSaving ? "Deleting..." : "Yes, delete my account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function NotificationsSection({
  settings,
  onChange,
  onSave,
  isSaving,
  role,
  pushPermission,
  pushEnabled,
  pushLoading,
  onEnablePush,
  onDisablePush,
}: {
  settings: SettingsData;
  onChange: (updates: Partial<SettingsData>) => void;
  onSave: () => void;
  isSaving: boolean;
  role: string;
  pushPermission: PushPermissionState;
  pushEnabled: boolean;
  pushLoading: boolean;
  onEnablePush: () => void;
  onDisablePush: () => void;
}) {
  const pushNeedsProductionBuild = process.env.NODE_ENV !== "production";

  const handleNotifyToggle = (key: "notifyNss" | "notifyNcc", checked: boolean) => {
    if (role === "STUDENT" && checked) {
      const value = window.prompt("Enter owner key to enable this setting");
      if (value !== "337") {
        alert("Invalid key");
        onChange({ [key]: false } as Partial<SettingsData>);
        return;
      }
    }
    onChange({ [key]: checked } as Partial<SettingsData>);
  };

  return (
    <Card className="shadow-none border-0 bg-transparent">
      <CardHeader>
        <CardTitle className="text-xl">Notifications</CardTitle>
        <CardDescription>Manage how you receive notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Device Push</h3>
          <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
            <div>
              <p className="font-medium">Hardware notifications on this device</p>
              <p className="text-sm text-muted-foreground">
                Status:{" "}
                {pushPermission === "unsupported"
                  ? pushNeedsProductionBuild
                    ? "Unavailable in development mode (use npm run build + npm run start)"
                    : "Unsupported here (needs HTTPS or localhost, plus browser support)"
                  : pushPermission === "loading"
                    ? "Checking support..."
                    : pushPermission === "denied"
                      ? "Blocked by browser permission"
                      : pushEnabled
                        ? "Enabled on this device"
                        : "Not enabled on this device"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={onEnablePush}
                disabled={pushLoading || pushPermission === "unsupported" || pushPermission === "denied" || pushEnabled}
              >
                {pushLoading ? "Working..." : "Enable on this device"}
              </Button>
              <Button
                variant="secondary"
                onClick={onDisablePush}
                disabled={pushLoading || !pushEnabled}
              >
                Disable on this device
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {pushNeedsProductionBuild
                ? `${PUSH_PRODUCTION_MESSAGE} After that, use localhost or HTTPS so the browser can register this device.`
                : "Browser permission + this device registration are required before the category toggles below can reach the notification bar."}
            </p>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Content Updates</h3>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="new-post-noti" className="flex-1">New posts on the feed</Label>
            <Switch
              id="new-post-noti"
              checked={settings.notifyPushPosts}
              onCheckedChange={(checked) => onChange({ notifyPushPosts: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="new-reel-noti" className="flex-1">New reels</Label>
            <Switch
              id="new-reel-noti"
              checked={settings.notifyPushReels}
              onCheckedChange={(checked) => onChange({ notifyPushReels: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="new-notice-noti" className="flex-1">New notices</Label>
            <Switch
              id="new-notice-noti"
              checked={settings.notifyPushNotices}
              onCheckedChange={(checked) => onChange({ notifyPushNotices: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="new-schedule-noti" className="flex-1">Schedule updates</Label>
            <Switch
              id="new-schedule-noti"
              checked={settings.notifyPushSchedule}
              onCheckedChange={(checked) => onChange({ notifyPushSchedule: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="new-notes-noti" className="flex-1">New notes</Label>
            <Switch
              id="new-notes-noti"
              checked={settings.notifyPushNotes}
              onCheckedChange={(checked) => onChange({ notifyPushNotes: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="new-internship-noti" className="flex-1">New internships</Label>
            <Switch
              id="new-internship-noti"
              checked={settings.notifyPushInternships}
              onCheckedChange={(checked) => onChange({ notifyPushInternships: checked })}
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Engagement</h3>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="new-like-noti" className="flex-1">Likes on your posts or reels</Label>
            <Switch
              id="new-like-noti"
              checked={settings.notifyPushLikes}
              onCheckedChange={(checked) => onChange({ notifyPushLikes: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="new-comment-noti" className="flex-1">Comments on your posts or reels</Label>
            <Switch
              id="new-comment-noti"
              checked={settings.notifyPushComments}
              onCheckedChange={(checked) => onChange({ notifyPushComments: checked })}
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Messages</h3>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="new-message-noti" className="flex-1">New chat messages</Label>
            <Switch
              id="new-message-noti"
              checked={settings.notifyPushMessages}
              onCheckedChange={(checked) => onChange({ notifyPushMessages: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="notify-nss" className="flex-1">Notify NSS</Label>
            <Switch
              id="notify-nss"
              checked={settings.notifyNss}
              onCheckedChange={(checked) => handleNotifyToggle("notifyNss", checked)}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="notify-ncc" className="flex-1">Notify NCC</Label>
            <Switch
              id="notify-ncc"
              checked={settings.notifyNcc}
              onCheckedChange={(checked) => handleNotifyToggle("notifyNcc", checked)}
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Email Notifications</h3>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="weekly-digest-email" className="flex-1">Weekly digest email</Label>
            <Switch
              id="weekly-digest-email"
              checked={settings.notifyEmailDigest}
              onCheckedChange={(checked) => onChange({ notifyEmailDigest: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <Label htmlFor="announcements-email" className="flex-1">Important announcements</Label>
            <Switch
              id="announcements-email"
              checked={settings.notifyEmailAnnouncements}
              onCheckedChange={(checked) => onChange({ notifyEmailAnnouncements: checked })}
            />
          </div>
        </div>
        <div>
          <Button variant="glow" disabled={isSaving} onClick={onSave}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceSection({
  selectedTheme,
  onThemeChange,
  onSave,
  isSaving,
}: {
  selectedTheme: string;
  onThemeChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    const html = document.documentElement;
    html.classList.remove("dark", "white", "black");

    if (newTheme === "dark" || newTheme === "white" || newTheme === "black") {
      html.classList.add(newTheme);
    }

    setTheme(newTheme);
    onThemeChange(newTheme);
  };

  const effectiveTheme = selectedTheme || theme || "light";

  const getButtonVariant = (buttonTheme: string) => {
    return effectiveTheme === buttonTheme ? "secondary" : "outline";
  };

  return (
    <Card className="shadow-none border-0 bg-transparent">
      <CardHeader>
        <CardTitle className="text-xl">Appearance</CardTitle>
        <CardDescription>Customize the look and feel of the app.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="font-medium text-lg">Theme</Label>
          <p className="text-sm text-muted-foreground">Select the theme for the app.</p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className={cn(effectiveTheme === "light" && "animated-border-continuous rounded-lg")}>
              <Button variant={getButtonVariant("light")} onClick={() => handleThemeChange("light")} className="w-full">
                <Sun className="mr-2 h-4 w-4" /> Light
              </Button>
            </div>
            <div className={cn(effectiveTheme === "dark" && "animated-border-continuous rounded-lg")}>
              <Button variant={getButtonVariant("dark")} onClick={() => handleThemeChange("dark")} className="w-full">
                <Moon className="mr-2 h-4 w-4" /> Dark
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-medium text-lg">Minimalist Themes</Label>
          <p className="text-sm text-muted-foreground">Clean themes with no extra animations or effects.</p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className={cn(effectiveTheme === "white" && "animated-border-continuous rounded-lg")}>
              <Button variant={getButtonVariant("white")} onClick={() => handleThemeChange("white")} className="w-full">
                White
              </Button>
            </div>
            <div className={cn(effectiveTheme === "black" && "animated-border-continuous rounded-lg")}>
              <Button variant={getButtonVariant("black")} onClick={() => handleThemeChange("black")} className="w-full">
                Black
              </Button>
            </div>
          </div>
        </div>
        <div>
          <Button variant="glow" disabled={isSaving} onClick={onSave}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsFooter() {
  return (
    <footer className="mt-12 border-t py-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between text-muted-foreground text-sm">
        <div className="flex flex-col md:flex-row items-center gap-x-4">
          <p>&copy; {new Date().getFullYear()} DR.LB college. All rights reserved.</p>
          <p className="font-semibold">publish by : WHO ME!</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <Link href="#" className="hover:text-primary flex items-center gap-1">
            <HelpCircle className="h-4 w-4" /> Help Center
          </Link>
          <Link href="#" className="hover:text-primary">Privacy Policy</Link>
          <Link href="#" className="hover:text-primary">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}


export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushPermission, setPushPermission] = useState<PushPermissionState>("loading");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const { currentUser, setCurrentUser } = useMainLayout();
  const { setRole } = useAuth();
  const router = useRouter();

  const safeParseJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON:", text);
      return { error: "Server did not return valid JSON" };
    }
  };

  const syncLocalUser = (userData: any) => {
    try {
      if (!userData?.id) return;
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: userData.id,
          email: userData.email,
            username: userData.username,
            role: userData.role,
            course: userData.course ?? "",
            branch: userData.branch ?? "",
            section: userData.section ?? "",
            year: userData.year ?? "",
            notifyNss: userData.notifyNss ?? false,
            notifyNcc: userData.notifyNcc ?? false,
        })
      );
    } catch (err) {
      console.error("Could not access localStorage", err);
    }
  };

  const syncContextUser = (userData: any) => {
    setCurrentUser((prev) => ({
      ...prev,
      id: userData.id || prev.id,
      name: userData.username || prev.name,
      avatar: userData.avatarUrl || prev.avatar,
      email: userData.email || prev.email,
      bio: userData.bio ?? prev.bio,
      role: userData.role ? mapRoleToLabel(userData.role) : prev.role,
      department: formatAcademicSummary(userData) || prev.department,
      course: userData.course ?? prev.course,
      branch: userData.branch ?? prev.branch,
      section: userData.section ?? prev.section,
      year: userData.year ?? prev.year,
      notifyNss: userData.notifyNss ?? prev.notifyNss ?? false,
      notifyNcc: userData.notifyNcc ?? prev.notifyNcc ?? false,
    }));
  };

  useEffect(() => {
    const loadSettings = async () => {
      let storedUser: any = null;
      try {
        const raw = localStorage.getItem("currentUser");
        storedUser = raw ? JSON.parse(raw) : null;
      } catch (err) {
        console.error("Could not access localStorage", err);
      }

      if (!storedUser?.id) {
        const fallback = buildSettingsFromUser({
          id: currentUser.id,
          email: currentUser.email,
          username: currentUser.name,
          bio: currentUser.bio,
          avatarUrl: currentUser.avatar,
          course: currentUser.course,
          branch: currentUser.branch,
          section: currentUser.section,
          year: currentUser.year,
        });
        setSettings(fallback);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/users/settings?userId=${encodeURIComponent(storedUser.id)}`);
        const data = await safeParseJson(res);

        if (res.ok && data.user) {
          const normalized = buildSettingsFromUser(data.user);
          setSettings(normalized);
          syncContextUser(data.user);
          syncLocalUser(data.user);
        } else {
          alert(data.error || "Failed to load settings");
          const fallback = buildSettingsFromUser({
            id: storedUser.id,
            email: storedUser.email,
            username: storedUser.username ?? currentUser.name,
            bio: currentUser.bio,
            avatarUrl: currentUser.avatar,
            course: storedUser.course,
            branch: storedUser.branch,
            section: storedUser.section,
            year: storedUser.year,
          });
          setSettings(fallback);
        }
      } catch (err) {
        console.error(err);
        const fallback = buildSettingsFromUser({
          id: storedUser.id,
          email: storedUser.email,
          username: storedUser.username ?? currentUser.name,
          bio: currentUser.bio,
          avatarUrl: currentUser.avatar,
          course: storedUser.course,
          branch: storedUser.branch,
          section: storedUser.section,
          year: storedUser.year,
        });
        setSettings(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [currentUser.id, currentUser.name, currentUser.email, currentUser.avatar, currentUser.bio]);

  const updateSettings = async (updates: Partial<SettingsData>) => {
    if (!settings?.id) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/users/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: settings.id,
          ...updates,
        }),
      });

      const data = await safeParseJson(res);

      if (res.ok && data.user) {
        const normalized = buildSettingsFromUser(data.user);
        setSettings(normalized);
        syncContextUser(data.user);
        syncLocalUser(data.user);
      } else {
        alert(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("prototype_username");
      localStorage.removeItem("prototype_userid");
    } catch (err) {
      console.error("Could not access localStorage", err);
    }

    setRole(null);
    router.replace("/login");
    router.refresh();
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  };

  const deleteAccount = async (payload: { currentPassword: string }) => {
    if (!settings?.id) return false;
    setIsSaving(true);

    try {
      const res = await fetch("/api/users/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: settings.id,
          currentPassword: payload.currentPassword,
        }),
      });

      if (res.ok) {
        logout();
        return true;
      }

      const data = await safeParseJson(res);
      alert(data.error || "Failed to delete account");
      return false;
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting account");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleLocalChange = (updates: Partial<SettingsData>) => {
    setSettings((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const refreshPushStatus = async () => {
    if (typeof window === "undefined") return;

    if (process.env.NODE_ENV !== "production") {
      setPushPermission("unsupported");
      setPushEnabled(false);
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !window.isSecureContext) {
      setPushPermission("unsupported");
      setPushEnabled(false);
      return;
    }

    setPushPermission(Notification.permission);
    try {
      const registration = await ensurePushServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      setPushEnabled(Boolean(subscription));
    } catch (err) {
      console.error("Could not inspect push subscription", err);
      setPushEnabled(false);
    }
  };

  useEffect(() => {
    void refreshPushStatus();
  }, []);

  const enablePushOnDevice = async () => {
    if (!settings?.id) return;

    if (process.env.NODE_ENV !== "production") {
      alert(PUSH_PRODUCTION_MESSAGE);
      setPushPermission("unsupported");
      setPushEnabled(false);
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !window.isSecureContext) {
      alert("Push notifications need HTTPS (or localhost) and browser support.");
      await refreshPushStatus();
      return;
    }

    try {
      setPushLoading(true);

      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      setPushPermission(permission);

      if (permission !== "granted") {
        alert("Notification permission was not granted on this device.");
        return;
      }

      const keyRes = await fetch("/api/push/public-key");
      const keyData = await safeParseJson(keyRes);
      if (!keyRes.ok || !keyData?.publicKey) {
        throw new Error(keyData?.error || "Push public key is not available");
      }

      const registration = await ensurePushServiceWorkerRegistration();
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
        });
      }

      const saveRes = await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: settings.id,
          subscription: subscription.toJSON(),
        }),
      });
      const saveData = await safeParseJson(saveRes);
      if (!saveRes.ok) {
        throw new Error(saveData?.error || "Could not save push subscription");
      }

      setPushEnabled(true);
      alert("Push notifications are enabled on this device.");
    } catch (err: any) {
      console.error("Enable push failed", err);
      alert(String(err?.message || err));
    } finally {
      setPushLoading(false);
      await refreshPushStatus();
    }
  };

  const disablePushOnDevice = async () => {
    if (!settings?.id) return;

    try {
      setPushLoading(true);

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushEnabled(false);
        return;
      }

      const registration = await ensurePushServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: settings.id,
            endpoint: subscription.endpoint,
          }),
        });
        await subscription.unsubscribe();
      }

      setPushEnabled(false);
      alert("Push notifications are disabled on this device.");
    } catch (err: any) {
      console.error("Disable push failed", err);
      alert(String(err?.message || err));
    } finally {
      setPushLoading(false);
      await refreshPushStatus();
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading settings...</p>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <ProfileSection
            settings={settings}
            onChange={handleLocalChange}
            onSave={() =>
              updateSettings({
                username: settings.username,
                bio: settings.bio,
                avatarUrl: settings.avatarUrl,
              })
            }
            isSaving={isSaving}
            fallbackAvatar={currentUser.avatar}
          />
        );
      case "account":
        return (
          <AccountSection
            settings={settings}
            onLogout={logout}
            onDelete={({ currentPassword }) => deleteAccount({ currentPassword })}
            isSaving={isSaving}
          />
        );
      case "notifications":
        return (
          <NotificationsSection
            settings={settings}
            onChange={handleLocalChange}
            onSave={() =>
              updateSettings({
                notifyPushPosts: settings.notifyPushPosts,
                notifyPushLikes: settings.notifyPushLikes,
                notifyPushComments: settings.notifyPushComments,
                notifyPushMessages: settings.notifyPushMessages,
                notifyPushReels: settings.notifyPushReels,
                notifyPushNotices: settings.notifyPushNotices,
                notifyPushSchedule: settings.notifyPushSchedule,
                notifyPushNotes: settings.notifyPushNotes,
                notifyPushInternships: settings.notifyPushInternships,
                notifyNss: settings.notifyNss,
                notifyNcc: settings.notifyNcc,
                notifyEmailDigest: settings.notifyEmailDigest,
                notifyEmailAnnouncements: settings.notifyEmailAnnouncements,
              })
            }
            isSaving={isSaving}
            role={settings.role}
            pushPermission={pushPermission}
            pushEnabled={pushEnabled}
            pushLoading={pushLoading}
            onEnablePush={enablePushOnDevice}
            onDisablePush={disablePushOnDevice}
          />
        );
      case "appearance":
        return (
          <AppearanceSection
            selectedTheme={settings.theme}
            onThemeChange={(value) => handleLocalChange({ theme: value })}
            onSave={() => updateSettings({ theme: settings.theme })}
            isSaving={isSaving}
          />
        );
      default:
        return (
          <ProfileSection
            settings={settings}
            onChange={handleLocalChange}
            onSave={() =>
              updateSettings({
                username: settings.username,
                bio: settings.bio,
                avatarUrl: settings.avatarUrl,
              })
            }
            isSaving={isSaving}
            fallbackAvatar={currentUser.avatar}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-0.5">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, profile, and preferences.
        </p>
      </div>
      <Separator />
      <div className="flex flex-col md:flex-row gap-8">
        <nav className="flex flex-row md:flex-col gap-2 md:w-48 flex-shrink-0 overflow-auto pb-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              className="justify-start w-full"
              onClick={() => setActiveSection(item.id as SettingsSection)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </nav>
        <div className="flex-1">
          <Card className="animated-border-card">
            {renderSection()}
          </Card>
        </div>
      </div>
      <SettingsFooter />
    </div>
  );
}
