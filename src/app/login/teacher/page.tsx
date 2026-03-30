"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, User, KeyRound, Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TeacherLoginPage() {
  const router = useRouter();
  const { setRole } = useAuth();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [userid, setUserid] = useState(""); // NEW
  const [ownerKey, setOwnerKey] = useState("");

  useEffect(() => {
    setMounted(true);
    const originalTheme = theme;
    const themes = ["light", "dark"];
    let currentIndex = themes.indexOf(originalTheme as string) !== -1 ? themes.indexOf(originalTheme as string) : 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % themes.length;
      setTheme(themes[currentIndex]);
    }, 3000);

    return () => {
      clearInterval(interval);
      setTheme(originalTheme as string);
    };
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const handleLogin = async () => {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    // Read response as text first
    const text = await res.text();

    // Try parsing JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON:", text);
      alert("Server did not return valid JSON");
      return;
    }

    if (res.ok) {
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      setRole(data.user.role.toLowerCase());
      router.push("/home");
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error(err);
    alert("An error occurred during login");
  }
};

  const handleSignup = async () => {
  if (!email || !password) {
    alert("Email and password are required to create an account");
    return;
  }
  if (!ownerKey.trim()) {
    alert("Owner key is required to create teacher/admin account");
    return;
  }

  const finalUsername =
    username && username.trim().length > 0 ? username.trim() : email.split("@")[0];

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        username: finalUsername,
        role: "TEACHER",
        ownerKey: ownerKey.trim(),
      }),
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON:", text);
      alert("Server did not return valid JSON");
      return;
    }

    if (res.ok) {
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      setRole(data.user.role.toLowerCase());
      router.push("/home");
    } else {
      alert(data.error || "Sign up failed");
    }
  } catch (err) {
    console.error(err);
    alert("An error occurred during sign up");
  }
};

  if (!mounted) {
    return <div className="flex min-h-screen items-center justify-center bg-background p-4"></div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl rounded-2xl animated-border-card">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-primary p-3 rounded-full">
              <GraduationCap className="text-primary-foreground h-8 w-8" />
            </div>
          </div>
          <CardTitle className={cn("text-3xl font-headline")}>Teacher Login</CardTitle>
          <CardDescription>Enter your credentials to access your portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative animated-border-input">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@example.com"
                  className="pl-8"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative animated-border-input">
                <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-8 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground z-10"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <Input
                  id="username"
                  placeholder="teacher name"
                  className="border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* UserID */}
            <div className="space-y-2">
              <Label htmlFor="userid">User ID</Label>
              <Input
                id="userid"
                placeholder="teacher123"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                required
              />
            </div>

            {/* Owner key */}
            <div className="space-y-2">
              <Label htmlFor="ownerKey">Owner key (required for teachers)</Label>
              <Input
                id="ownerKey"
                type="password"
                placeholder="Enter key"
                value={ownerKey}
                onChange={(e) => setOwnerKey(e.target.value)}
                required
              />
            </div>

            <Button variant="glow" className="w-full text-base py-6" type="submit">
              Login
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full text-base py-6 animated-border-card"
              onClick={handleSignup}
            >
              Create teacher account
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Not a teacher? <Link href="/login" className="text-primary hover:underline">Go back</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
