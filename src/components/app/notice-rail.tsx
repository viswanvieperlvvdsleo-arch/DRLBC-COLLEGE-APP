

"use client";

import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PlusCircle, Type, ImagePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notice, User } from "@/lib/mock-data";


interface NoticeRailProps {
  groupedNotices: Notice[][];
  onNoticeClick: (id: number) => void;
  onAddNotice?: (file: File) => void;
  onAddTypo?: () => void;
  currentUser: User;
}

export default function NoticeRail({ groupedNotices, onNoticeClick, onAddNotice, onAddTypo, currentUser }: NoticeRailProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasMultipleCreateActions = Boolean(onAddNotice && onAddTypo);

  const handleAddClick = () => {
    // Reset value so selecting the same file twice still triggers onChange (common UX on Windows).
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onAddNotice) {
      onAddNotice(file);
    }
    // Always clear so the same file can be picked again without needing a page refresh.
    event.target.value = "";
  };

  return (
    <Card className="overflow-hidden w-full">
      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
        <div className="flex gap-4 p-4 min-w-full">
          {(onAddNotice || onAddTypo) && (
            <div className="flex flex-col items-center gap-2 text-center w-20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative" onClick={!hasMultipleCreateActions && onAddNotice ? handleAddClick : undefined}>
                    <Avatar className="h-16 w-16 border-2 border-transparent">
                      <AvatarImage src={currentUser.avatar} data-ai-hint="profile picture" />
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 bg-background rounded-full">
                      <PlusCircle className="h-6 w-6 text-primary" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                {hasMultipleCreateActions && (
                  <DropdownMenuContent align="start" className="w-44">
                    {onAddNotice && (
                      <DropdownMenuItem onClick={handleAddClick}>
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Photo or video
                      </DropdownMenuItem>
                    )}
                    {onAddTypo && (
                      <DropdownMenuItem onClick={onAddTypo}>
                        <Type className="mr-2 h-4 w-4" />
                        Typo
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
              <span className="text-xs font-medium w-full truncate">Create</span>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,video/*"
              />
            </div>
          )}

          {groupedNotices.map((group) => {
            const firstNotice = group[0];
            const hasUnseen = group.some(n => !n.seen);
            const isOwnNotice = firstNotice.authorId === currentUser.id;
            return (
                <button
                key={firstNotice.authorId}
                className="flex flex-col items-center gap-2 text-center w-20"
                onClick={() => onNoticeClick(firstNotice.id)}
                >
                <div
                    className={cn(
                    "rounded-full p-0.5 relative overflow-hidden",
                    hasUnseen
                        ? "animated-border-card"
                        : "ring-2 ring-muted"
                    )}
                >
                    <div className="bg-background rounded-full p-0.5">
                    <Avatar className="h-16 w-16 border-2 border-transparent">
                        <AvatarImage src={isOwnNotice ? currentUser.avatar : firstNotice.avatar} data-ai-hint="person face" />
                        <AvatarFallback>{firstNotice.author.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    </div>
                </div>
                <span className="text-xs font-medium w-full truncate">{firstNotice.author}</span>
                </button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-2" />
      </ScrollArea>
    </Card>
  );
}
