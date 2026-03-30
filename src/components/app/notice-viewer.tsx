

"use client";

import { useEffect, useState, useRef, CSSProperties } from "react";
import { Dialog, DialogContent, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, MoreVertical, Trash2 } from "lucide-react";
import { Notice } from "@/lib/mock-data";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoticeViewerProps {
  groupedNotices: Notice[][];
  activeId: number | null;
  currentUserId?: string;
  onDeleteNotice?: (noticeId: number) => void;
  onClose: () => void;
  onNextAuthor: (currentId: number) => void;
  onPrevAuthor: (currentId: number) => void;
}

export default function NoticeViewer({ groupedNotices, activeId, currentUserId, onDeleteNotice, onClose, onNextAuthor, onPrevAuthor }: NoticeViewerProps) {
  const [localNoticeIndex, setLocalNoticeIndex] = useState(0);
  const [cardStyles, setCardStyles] = useState<CSSProperties[]>([]);

  const activeGroupIndex = activeId !== null ? groupedNotices.findIndex(g => g.some(n => n.id === activeId)) : -1;
  const activeGroup = activeGroupIndex !== -1 ? groupedNotices[activeGroupIndex] : null;

  // When the group changes externally, find the notice that was clicked and set it as the starting point.
  useEffect(() => {
    if (activeGroup && activeId) {
      const initialIndex = activeGroup.findIndex(n => n.id === activeId);
      setLocalNoticeIndex(initialIndex >= 0 ? initialIndex : 0);
    }
  }, [activeGroup, activeId]);

  const activeNotice = activeGroup ? activeGroup[localNoticeIndex] : null;
  
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeGroup && localNoticeIndex < activeGroup.length - 1) {
      // Navigate within the same author's notices (instant swap)
      setLocalNoticeIndex(prev => prev + 1);
    } else if (activeNotice) {
      // Transition to the next author (animated)
      onNextAuthor(activeNotice.id);
    }
  };
  
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localNoticeIndex > 0) {
      // Navigate within the same author's notices (instant swap)
      setLocalNoticeIndex(prev => prev - 1);
    } else if (activeNotice) {
      // Transition to the previous author (animated)
      onPrevAuthor(activeNotice.id);
    }
  };

  useEffect(() => {
    if (activeGroupIndex === -1) return;

    const newStyles = groupedNotices.map((_, i) => {
      const offset = i - activeGroupIndex;
      const opacity = Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.3;
      const zIndex = 10 - Math.abs(offset);
      const transform = `translateX(${offset * 120}px) scale(${1 - Math.abs(offset) * 0.2})`;

      return {
        transform: `${transform} translateZ(0)`, // Force hardware acceleration
        backfaceVisibility: 'hidden', // Prevent flickering on 3D transforms
        opacity,
        zIndex,
        transition: 'transform 0.6s ease, opacity 0.6s ease',
        willChange: 'transform, opacity',
      };
    });
    setCardStyles(newStyles);

  }, [activeGroupIndex, groupedNotices]);


  if (!activeNotice || !activeGroup) {
    return null;
  }

  const isOwner = !!currentUserId && currentUserId === activeNotice.authorId;

  const isFirstNoticeInGroup = localNoticeIndex === 0;
  const isFirstAuthor = activeGroupIndex === 0;
  const canGoPrev = !isFirstAuthor || !isFirstNoticeInGroup;

  const isLastAuthor = activeGroupIndex === groupedNotices.length - 1;
  const isLastNoticeInGroup = localNoticeIndex === activeGroup.length - 1;
  const canGoNext = !isLastAuthor || !isLastNoticeInGroup;


  return (
    <Dialog open={!!activeNotice} onOpenChange={(isOpen) => !isOpen && onClose()}>
       <DialogPortal>
        <DialogOverlay className="bg-black" />
        <DialogContent
            className="p-0 border-0 bg-transparent w-screen h-screen max-w-full flex flex-col gap-0 perspective-1000"
            showCloseButton={false}
        >
            <DialogTitle className="sr-only">Notice Carousel</DialogTitle>
            
            {/* Header Info & Close Button */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-60 md:w-80 z-20 flex flex-col gap-2">
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={activeNotice.avatar} data-ai-hint="person face" />
                            <AvatarFallback>{activeNotice.author.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-white text-sm">{activeNotice.author}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isOwner && onDeleteNotice && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-white hover:text-white hover:bg-white/10"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => onDeleteNotice(activeNotice.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Notice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:text-white hover:bg-white/10" onClick={onClose}>
                          <X className="h-5 w-5" />
                      </Button>
                    </div>
                </div>
                {activeGroup.length > 1 && (
                    <div className="flex items-center gap-2">
                        {activeGroup.map((notice, index) => (
                            <div key={notice.id} className="flex-1 h-1 rounded-full bg-white/30">
                            <div className={cn("h-1 rounded-full bg-white", index === localNoticeIndex ? 'w-full' : (index < localNoticeIndex ? 'w-full' : 'w-0'))} style={{ transition: 'width 300ms ease-in-out'}} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Carousel Container */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center transform-style-3d">
                {/* Intra-Story Navigation */}
                <div className="absolute inset-0 z-40 flex justify-between">
                    <button className="w-1/2 h-full" onClick={handlePrev} aria-label="Previous Notice"></button>
                    <button className="w-1/2 h-full" onClick={handleNext} aria-label="Next Notice"></button>
                </div>
                
                {groupedNotices.map((group, groupIndex) => {
                    const isCenteredGroup = activeGroupIndex === groupIndex;
                    // Display the current local notice for the active group, otherwise show the first notice for other groups.
                    const noticeToDisplay = isCenteredGroup ? activeNotice : group[0];
                    const isVideo =
                      noticeToDisplay.contentType === "VIDEO" ||
                      /\.(mp4|webm|ogg|mov)$/i.test(noticeToDisplay.contentUrl);
                    return (
                        <div
                            key={group[0].authorId}
                            className="absolute w-60 h-full max-h-[80vh] md:w-80 rounded-lg overflow-hidden"
                            style={cardStyles[groupIndex] || { opacity: 0 }}
                        >
                            {isVideo ? (
                              <video
                                src={noticeToDisplay.contentUrl}
                                className="absolute inset-0 w-full h-full object-cover"
                                playsInline
                                autoPlay={isCenteredGroup}
                                muted
                                controls={false}
                                loop
                              />
                            ) : (
                              <Image
                                src={noticeToDisplay.contentUrl}
                                alt={`Notice from ${noticeToDisplay.author}`}
                                fill
                                className="object-cover"
                                data-ai-hint={noticeToDisplay.contentHint}
                                priority={isCenteredGroup}
                              />
                            )}

                            {!!noticeToDisplay.caption && (
                              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                                <p className="text-white text-sm line-clamp-2">{noticeToDisplay.caption}</p>
                              </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Inter-Author Navigation Buttons */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-between px-4">
                <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/40 hover:text-white"
                onClick={handlePrev}
                disabled={!canGoPrev}
                >
                <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/40 hover:text-white"
                onClick={handleNext}
                disabled={!canGoNext}
                >
                <ChevronRight className="h-6 w-6" />
                </Button>
            </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
