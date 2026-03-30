
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Heart, Share2, MoreVertical, Play, Pause, Volume2, VolumeX, Download, Send, X, MessageCircle, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Reel, User, Chat, Comment } from '@/lib/mock-data';
import { useMainLayout } from '../layout';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import ShareDialog from '@/components/app/share-dialog';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ReelCard({
    reel,
    isVisible,
    onLike,
    onShare,
    onComment,
    onDelete,
    currentUserId,
    isMobile,
}: {
    reel: Reel;
    isVisible: boolean;
    onLike: (reelId: number) => void;
    onShare: (reelId: number) => void;
    onComment: (reelId: number) => void;
    onDelete: (reelId: number) => void;
    currentUserId: string;
    isMobile: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showLikeAnimation, setShowLikeAnimation] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isVisible) {
            if (video.paused) {
                 video.play().catch(error => {
                    if (error.name !== 'AbortError') {
                      console.error("Autoplay prevented:", error);
                    }
                    setIsPlaying(false);
                });
                setIsPlaying(true);
            }
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, [isVisible]);

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                if (videoRef.current.paused) {
                    videoRef.current.play().catch(e => console.error(e));
                }
                setIsPlaying(true);
            }
        }
    }

    const handleVideoClick = () => {
        if (!isMobile) {
            togglePlayPause();
        }
    };
    
    const handleMuteToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    }
    
    const handleDoubleClick = () => {
      if (!reel.isLiked) {
        onLike(reel.id);
      }
      setShowLikeAnimation(true);
      setTimeout(() => {
        setShowLikeAnimation(false);
      }, 1000);
    };

    const handleTouchStart = () => {
        if (!isMobile) return;
        longPressTimer.current = setTimeout(() => {
            if(videoRef.current) {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }, 500); // 500ms for long press
    };

    const handleTouchEnd = () => {
        if (!isMobile) return;
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
        // If the video was paused by the long press, play it on release
        if (videoRef.current && videoRef.current.paused && isVisible) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleTouchMove = () => {
        // If user starts dragging, cancel the long press
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!reel.videoUrl) return;

        try {
            const response = await fetch(reel.videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${reel.author}-${reel.id}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading video:', error);
            // Optionally, show a toast notification for the error
        }
    };

    return (
        <div 
            className="h-full w-full relative" 
            onClick={handleVideoClick} 
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
        >
            <video
                ref={videoRef}
                src={reel.videoUrl}
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
            />
            
            {showLikeAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart className="w-24 h-24 text-white/90 drop-shadow-lg animate-like-heart" fill="currentColor" />
                </div>
            )}


            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                    <Play className="h-20 w-20 text-white/70 drop-shadow-lg" fill="currentColor" />
                </div>
            )}
            
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                    <Link href={`/profile/${reel.authorId}`} onClick={(e) => e.stopPropagation()}>
                        <Avatar className="h-10 w-10 border-2 border-white">
                            <AvatarImage src={reel.avatar} />
                            <AvatarFallback>{reel.author.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <Link href={`/profile/${reel.authorId}`} onClick={(e) => e.stopPropagation()}>
                        <p className="font-semibold text-white drop-shadow-md">{reel.author}</p>
                    </Link>
                </div>
                <div className="pointer-events-auto flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white bg-black/30 hover:bg-black/50" onClick={handleMuteToggle}>
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white bg-black/30 hover:bg-black/50" onClick={handleDownload}>
                        <Download className="h-5 w-5" />
                    </Button>
                    {reel.authorId === currentUserId && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white bg-black/30 hover:bg-black/50">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => onDelete(reel.id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Reel
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 md:pb-4 bg-gradient-to-t from-black/60 to-transparent text-white pointer-events-none">
                <div className="flex items-end">
                    <div className="flex-1">
                        <p className="text-sm line-clamp-2">{reel.caption}</p>
                    </div>
                    
                    <div className="flex flex-col items-center gap-4 pointer-events-auto">
                        <Button variant="ghost" size="icon" className="text-white h-12 w-12 flex-col gap-1" onClick={(e) => { e.stopPropagation(); onLike(reel.id); }}>
                            <Heart className={cn("h-7 w-7", reel.isLiked && "fill-red-500 text-red-500")} />
                            <span className="text-xs">{reel.likes}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white h-12 w-12 flex-col gap-1"
                            onClick={(e) => { e.stopPropagation(); onComment(reel.id); }}
                        >
                            <MessageCircle className="h-6 w-6" />
                            <span className="text-xs">{reel.comments?.length ?? 0}</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white h-12 w-12" onClick={(e) => { e.stopPropagation(); onShare(reel.id); }}>
                            <Share2 className="h-7 w-7" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReelItem({
    reel,
    onLike,
    onShare,
    onComment,
    onDelete,
    currentUserId,
    isMobile,
}: {
    reel: Reel;
    onLike: (reelId: number) => void;
    onShare: (reelId: number) => void;
    onComment: (reelId: number) => void;
    onDelete: (reelId: number) => void;
    currentUserId: string;
    isMobile: boolean;
}) {
  const { ref, inView } = useInView({
    threshold: 0.7,
  });

  return (
    <div ref={ref} id={`reel-${reel.id}`} className="h-full w-full snap-start flex-shrink-0">
      <ReelCard
        reel={reel}
        isVisible={inView}
        onLike={onLike}
        onShare={onShare}
        onComment={onComment}
        onDelete={onDelete}
        currentUserId={currentUserId}
        isMobile={isMobile}
      />
    </div>
  );
}


export default function ReelsPage() {
    const { setUseContainer, currentUser, chats, setChats, reels, setReels } = useMainLayout();
    const isMobile = useIsMobile();
    const [sharingReel, setSharingReel] = useState<Reel | null>(null);
    const [commentingReelId, setCommentingReelId] = useState<number | null>(null);
    const [commentText, setCommentText] = useState("");
    const { toast } = useToast();

    const reelsForRender = useMemo(() => {
        const unique = new Map<number, Reel>();
        reels.forEach((reel) => {
            if (!unique.has(reel.id)) unique.set(reel.id, reel);
        });
        return Array.from(unique.values());
    }, [reels]);


    // Disable the main container for a full-screen experience
    useEffect(() => {
        setUseContainer(false);

        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash) {
                const element = document.getElementById(hash.substring(1));
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        // Handle initial load
        handleHashChange();

        // Handle subsequent hash changes
        window.addEventListener('hashchange', handleHashChange, false);
        
        return () => {
            setUseContainer(true);
            window.removeEventListener('hashchange', handleHashChange, false);
        };
    }, [setUseContainer]);
    
    const handleLike = async (reelId: number) => {
        try {
            const res = await fetch("/api/reels/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reelId, userId: currentUser.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Internal server error");

            setReels((prev) =>
                prev.map((r) =>
                    r.id === reelId ? { ...r, isLiked: data.isLiked, likes: data.likeCount } : r
                )
            );
        } catch (err: any) {
            console.error("Like reel error:", err);
            toast({
                title: "Could not like reel",
                description: String(err?.message || err),
                variant: "destructive",
            });
        }
    }

    const handleShareClick = (reelId: number) => {
        const reelToShare = reelsForRender.find(r => r.id === reelId);
        if (reelToShare) {
            setSharingReel(reelToShare);
        }
    };

    const openComments = (reelId: number) => {
        setCommentingReelId(reelId);
        setCommentText("");
    };

    const closeComments = () => {
        setCommentingReelId(null);
        setCommentText("");
    };

    const handleAddReelComment = async (reelId: number, text: string) => {
        if (!text.trim()) return;
        try {
            const res = await fetch("/api/reels/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reelId, authorId: currentUser.id, text: text.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Internal server error");

            setReels((prev) =>
                prev.map((r) =>
                    r.id === reelId ? { ...r, comments: [...(r.comments || []), data] } : r
                )
            );
        } catch (err: any) {
            console.error("Create reel comment error:", err);
            toast({
                title: "Could not add comment",
                description: String(err?.message || err),
                variant: "destructive",
            });
        }
    };

    const handleLikeReelComment = async (reelId: number, commentId: number) => {
        try {
            const res = await fetch("/api/reels/comments/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId, userId: currentUser.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Internal server error");

            setReels((prev) =>
                prev.map((r) => {
                    if (r.id !== reelId) return r;
                    return {
                        ...r,
                        comments: (r.comments || []).map((c) =>
                            c.id === commentId ? { ...c, likes: data.likeCount, isLiked: data.isLiked } : c
                        ),
                    };
                })
            );
        } catch (err: any) {
            console.error("Like reel comment error:", err);
            toast({
                title: "Could not like comment",
                description: String(err?.message || err),
                variant: "destructive",
            });
        }
    };

    const handleDeleteReelComment = async (reelId: number, commentId: number) => {
        try {
            const res = await fetch(`/api/reels/comments?id=${encodeURIComponent(String(commentId))}&userId=${encodeURIComponent(currentUser.id)}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Internal server error");

            setReels((prev) =>
                prev.map((r) =>
                    r.id === reelId ? { ...r, comments: (r.comments || []).filter((c) => c.id !== commentId) } : r
                )
            );
        } catch (err: any) {
            console.error("Delete reel comment error:", err);
            toast({
                title: "Could not delete comment",
                description: String(err?.message || err),
                variant: "destructive",
            });
        }
    };

    const handleDeleteReel = async (reelId: number) => {
        try {
            const res = await fetch(`/api/reels?id=${encodeURIComponent(String(reelId))}&userId=${encodeURIComponent(currentUser.id)}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Internal server error");

            setReels((prev) => prev.filter((r) => r.id !== reelId));
            toast({ title: "Deleted", description: "Your reel was deleted." });
        } catch (err: any) {
            console.error("Delete reel error:", err);
            toast({
                title: "Could not delete",
                description: String(err?.message || err),
                variant: "destructive",
            });
        }
    };

    const handleSendReel = async (reel: Reel, selectedChatIds: string[]) => {
        try {
            const results = await Promise.allSettled(
                selectedChatIds.map(async (chatId) => {
                    const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: currentUser.id, sharedReel: reel }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data?.message) {
                        throw new Error(data?.error || "Failed to share reel");
                    }
                    return { chatId, message: data.message };
                })
            );

            const successes = results
                .filter((r): r is PromiseFulfilledResult<{ chatId: string; message: any }> => r.status === "fulfilled")
                .map((r) => r.value);

            if (successes.length === 0) {
                throw new Error("Could not share the reel.");
            }

            setChats((prevChats: Chat[]) =>
                prevChats.map((chat) => {
                    const match = successes.find((r) => r.chatId === chat.id);
                    return match ? { ...chat, messages: [...chat.messages, match.message] } : chat;
                })
            );

            const failedCount = results.length - successes.length;
            setSharingReel(null);
            toast({
                title: "Reel Shared!",
                description:
                    failedCount > 0
                        ? `Shared to ${successes.length} chats. ${failedCount} failed.`
                        : "The reel has been shared with your selected contacts.",
                duration: 3000,
            });
        } catch (err: any) {
            console.error("Share reel error:", err);
            toast({
                title: "Could not share",
                description: String(err?.message || err),
                variant: "destructive",
            });
        }
     }

    return (
        <div className="h-full w-full bg-black snap-y snap-mandatory overflow-y-scroll overscroll-contain scrollbar-hide">
            {reelsForRender.map(reel => (
                <ReelItem
                    key={reel.id}
                    reel={reel}
                    onLike={handleLike}
                    onShare={handleShareClick}
                    onComment={openComments}
                    onDelete={handleDeleteReel}
                    currentUserId={currentUser.id}
                    isMobile={isMobile}
                />
            ))}

            {sharingReel && (
                <ShareDialog
                    content={sharingReel}
                    chats={chats}
                    currentUser={currentUser}
                    onClose={() => setSharingReel(null)}
                    onSend={(reel, chatIds) => handleSendReel(reel as Reel, chatIds)}
                    dialogTitle="Share Reel"
                    dialogDescription="Select contacts to share this reel with."
                />
            )}

            <Sheet open={commentingReelId !== null} onOpenChange={(open) => (!open ? closeComments() : undefined)}>
                <SheetContent side="bottom" className="max-h-[70vh]">
                    <SheetHeader>
                        <SheetTitle>Comments</SheetTitle>
                    </SheetHeader>
                    {(() => {
                        const activeReel = commentingReelId !== null ? reelsForRender.find((r) => r.id === commentingReelId) : null;
                        if (!activeReel) {
                            return <p className="text-sm text-muted-foreground">Reel not found.</p>;
                        }

                        const canModerate = activeReel.authorId === currentUser.id;

                        return (
                            <div className="mt-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={activeReel.avatar} />
                                        <AvatarFallback>{activeReel.author.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm">
                                            <span className="font-semibold">{activeReel.author}</span>{" "}
                                            <span className="text-muted-foreground">{activeReel.caption}</span>
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <ScrollArea className="h-56 pr-3">
                                    <div className="space-y-4">
                                        {(activeReel.comments || []).length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
                                        ) : (
                                            (activeReel.comments || []).map((c, idx) => (
                                                <div key={`${c.id}-${idx}`} className="flex items-start gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={c.avatar} />
                                                        <AvatarFallback>{c.author.substring(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-sm">
                                                            <span className="font-semibold">{c.author}</span>{" "}
                                                            <span className="text-muted-foreground">{c.text}</span>
                                                        </p>
                                                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                                            <button
                                                                type="button"
                                                                className={cn("inline-flex items-center gap-1 hover:text-foreground", c.isLiked && "text-red-600")}
                                                                onClick={() => handleLikeReelComment(activeReel.id, c.id)}
                                                            >
                                                                <Heart className={cn("h-4 w-4", c.isLiked && "fill-red-600")} />
                                                                <span>{c.likes}</span>
                                                            </button>
                                                            {(canModerate || c.authorId === currentUser.id) && (
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex items-center gap-1 hover:text-foreground"
                                                                    onClick={() => handleDeleteReelComment(activeReel.id, c.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    <span>Delete</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>

                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Write a comment..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddReelComment(activeReel.id, commentText);
                                                setCommentText("");
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            handleAddReelComment(activeReel.id, commentText);
                                            setCommentText("");
                                        }}
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </SheetContent>
            </Sheet>
        </div>
    );
}
