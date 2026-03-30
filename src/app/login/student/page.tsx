"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { GraduationCap, User, KeyRound, Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CourseOption } from "@/lib/academic";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function StudentLoginPage() {
  const router = useRouter();
  const { setRole } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [userid, setUserid] = useState(""); // NEW
  const [course, setCourse] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [year, setYear] = useState("");
  const [options, setOptions] = useState<CourseOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Fix flickering by removing theme from deps
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

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        const res = await fetch("/api/academic-options");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Could not load academic options");
        if (!cancelled) {
          setOptions((data?.courses || []) as CourseOption[]);
        }
      } catch (err) {
        console.error("Failed to load academic options", err);
        if (!cancelled) {
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      }
    };

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCourse = options.find((item) => item.value === course);
  const selectedBranch = selectedCourse?.branches.find((item) => item.value === branch);
  const availableBranches = selectedCourse?.branches ?? [];
  const availableSections = selectedBranch?.sections ?? [];
  const availableYears = selectedCourse?.years ?? [];

const handleLogin = async () => {
  if (!course || !branch || !section || !year) {
    alert("Please choose your course, branch, section, and year before logging in.");
    return;
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, course, branch, section, year }),
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
  if (!course || !branch || !section || !year) {
    alert("Please choose your course, branch, section, and year before creating the account.");
    return;
  }
  if (!options.length) {
    alert("Academic options are still loading. Please wait a moment and try again.");
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
        role: "STUDENT",
        course,
        branch,
        section,
        year,
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
          <CardTitle className={cn("text-3xl font-headline")}>Student Login</CardTitle>
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
                  placeholder="student@example.com"
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
                  placeholder="viswan"
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
                placeholder="student123"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
              />
            </div>

            <div className="space-y-4 rounded-xl border bg-secondary/30 p-4">
              <div>
                <h3 className="font-medium">Academic Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Use your current academic batch while logging in. If a teacher updates it later, you will be asked to confirm the new batch once inside the app.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <div className="animated-border-input">
                    <Select
                      value={course}
                      onValueChange={(value) => {
                        setCourse(value);
                        setBranch("");
                        setSection("");
                        setYear("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={optionsLoading ? "Loading..." : "Select course"} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((item) => (
                          <SelectItem key={item.id} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Branch</Label>
                  <div className="animated-border-input">
                    <Select
                      value={branch}
                      onValueChange={(value) => {
                        setBranch(value);
                        setSection("");
                        setYear("");
                      }}
                      disabled={!course}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranches.map((item) => (
                          <SelectItem key={item.id} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Section</Label>
                  <div className="animated-border-input">
                    <Select value={section} onValueChange={setSection} disabled={!branch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSections.map((item) => (
                          <SelectItem key={item.id} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Year / Semester</Label>
                  <div className="animated-border-input">
                    <Select value={year} onValueChange={setYear} disabled={!course || !branch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((item) => (
                          <SelectItem key={item.id} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
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
              Create student account
            </Button>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>

            <Button variant="outline" className="w-full text-base py-6 animated-border-card">
              <GoogleIcon />
              <span className="ml-2">Sign in with Google</span>
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Not a student? <Link href="/login" className="text-primary hover:underline">Go back</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
