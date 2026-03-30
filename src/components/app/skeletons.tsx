
"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Building, MapPin } from "lucide-react";
import { Separator } from "../ui/separator";

export function PostCardSkeleton() {
  return (
    <Card className="animated-border-card">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0 px-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="aspect-video w-full rounded-lg" />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 pt-4">
        <div className="flex justify-between w-full text-muted-foreground text-sm px-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="w-full border-t border-border my-2"></div>
        <div className="grid grid-cols-3 w-full gap-2 px-6">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function NoteCardSkeleton() {
    return (
        <Card className="animated-border-card flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-secondary rounded-lg">
                            <FileText className="h-6 w-6 text-secondary-foreground" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </CardContent>
            <CardFooter className="flex items-center gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
            </CardFooter>
        </Card>
    );
}

export function ClubCardSkeleton() {
    return (
        <Card className="animated-border-card flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    );
}

export function InternshipCardSkeleton() {
    return (
        <Card className="animated-border-card flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                        <Skeleton className="h-6 w-40" />
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground pt-1">
                            <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1.5" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1.5" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    );
}

export function UserCardSkeleton() {
    return (
        <Card className="animated-border-card flex flex-col">
            <CardHeader className="items-center text-center space-y-3">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="w-full space-y-2">
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
            </CardHeader>
            <CardFooter className="mt-auto grid grid-cols-4 gap-2 p-2 pt-0">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
            </CardFooter>
        </Card>
    );
}

export function ChatListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-3 border-b">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationCardSkeleton() {
    return (
        <Card className="animated-border-card">
            <div className="p-4">
                <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full mt-1" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                </div>
            </div>
        </Card>
    );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="animated-border-card">
        <CardHeader className="items-center text-center p-8 space-y-4">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Separator />
      <div className="space-y-6 mt-6">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}
