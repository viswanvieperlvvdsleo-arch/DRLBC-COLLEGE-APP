
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
import { GraduationCap, BookUser, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
      // Restore original theme when leaving the page
      setTheme(originalTheme as string);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTheme]);
  
  if (!mounted) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            {/* Render a static loader or nothing to prevent flash */}
        </div>
    );
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
          <CardTitle className={cn("text-3xl font-headline")}>DR.LB college</CardTitle>
          <CardDescription>Select your role to sign in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="mb-4">
                <Link href="/login/student" passHref>
                <Button
                    variant="glow"
                    className="w-full justify-start text-base py-6"
                >
                    <User className="mr-4 h-5 w-5" />
                    Sign in as Student
                </Button>
                </Link>
            </div>
            <div>
                <Link href="/login/teacher" passHref>
                <Button
                    variant="glow"
                    className="w-full justify-start text-base py-6"
                >
                    <BookUser className="mr-4 h-5 w-5" />
                    Sign in as Teacher
                </Button>
                </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
