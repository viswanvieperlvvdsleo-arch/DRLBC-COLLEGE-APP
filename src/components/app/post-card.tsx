
"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from 'react';
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  MessageCircle,
  Share2,
  Heart,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/mock-data";
import { Post } from "@/lib/mock-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface PostCardProps {
  post: Post;
  currentUser: User;
  onLike: (postId: number) => void;
  onCommentClick: (postId: number) => void;
  onShare: (postId: number) => void;
  onDelete: (postId: number) => void;
  isMinimized?: boolean;
  className?: string;
}


const PostCard = React.forwardRef<HTMLDivElement, PostCardProps>(
  ({ post, currentUser, onLike, onCommentClick, onShare, onDelete, isMinimized = false, className }, ref) => {
    
    const isOwner = post.authorId === currentUser.id;
    const hasMedia = Boolean(post.image || post.videoUrl);
    const hasContent = Boolean(post.content?.trim());
    const isTypo = !hasMedia && hasContent;
    const [showLikeAnimation, setShowLikeAnimation] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showToggle, setShowToggle] = useState(false);
    const contentRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
      setIsExpanded(false);
    }, [post.id, post.content]);

    useEffect(() => {
      if (isMinimized) {
        setShowToggle(false);
        return;
      }
      if (isExpanded) return;
      const raf = window.requestAnimationFrame(() => {
        const el = contentRef.current;
        if (!el) return;
        const hasOverflow = el.scrollHeight > el.clientHeight + 1;
        setShowToggle(hasOverflow);
      });
      return () => window.cancelAnimationFrame(raf);
    }, [post.content, isExpanded, isMinimized]);

    const handleDoubleClick = () => {
      if (!post.isLiked) {
        onLike(post.id);
      }
      setShowLikeAnimation(true);
      setTimeout(() => {
        setShowLikeAnimation(false);
      }, 1000);
    };

    return (
      <Card ref={ref} id={`post-${post.id}`} className={cn("animated-border-card overflow-hidden", isMinimized && "shadow-none border-0", className)}>
        {!isMinimized && (
          <CardHeader>
            <div className="flex items-start gap-4">
              <Link href={`/profile/${post.authorId}`}>
                <Avatar>
                  <AvatarImage src={isOwner ? currentUser.avatar : post.avatar} data-ai-hint="person face" />
                  <AvatarFallback>{post.author.substring(0, 2)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <Link href={`/profile/${post.authorId}`}>
                  <p className="font-semibold hover:underline">{post.author}</p>
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {post.role} &middot; {post.time}
                  {isTypo && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      Typo
                    </span>
                  )}
                </div>
              </div>
              {isOwner && (
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDelete(post.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent className={cn("p-0", isMinimized && "p-0")}>
          {hasContent && (
            <div className={cn("mb-4 px-6", isMinimized && "mb-2 p-3 pb-0")}>
              <div
                className={cn(
                  isTypo && !isMinimized && "rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-5 shadow-sm min-h-[180px]"
                )}
              >
                <p
                  ref={contentRef}
                  className={cn(
                    "whitespace-pre-wrap",
                    !isExpanded && !isMinimized && (isTypo ? "line-clamp-6" : "line-clamp-3"),
                    isMinimized && "text-sm",
                    isTypo && !isMinimized && "text-base leading-7"
                  )}
                >
                  {post.content}
                </p>
                {showToggle && !isMinimized && (
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-primary hover:underline"
                    onClick={() => setIsExpanded((prev) => !prev)}
                  >
                    {isExpanded ? "Read less" : "Read more"}
                  </button>
                )}
              </div>
            </div>
          )}
          {hasMedia && (
            <div
              className={cn(
                "relative overflow-hidden border-y",
                isMinimized && "aspect-video !border-0 rounded-none"
              )}
              onDoubleClick={handleDoubleClick}
            >
              {post.videoUrl ? (
                <video
                  src={post.videoUrl}
                  className="w-full h-auto object-cover"
                  controls
                  playsInline
                  muted
                />
              ) : post.image ? (
                <Image
                  src={post.image}
                  alt="Post image"
                  width={isMinimized ? 160 : 600}
                  height={isMinimized ? 90 : 400}
                  className="object-cover w-full h-auto"
                  data-ai-hint={post.imageHint}
                />
              ) : null}
              {showLikeAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart className="w-24 h-24 text-white/90 drop-shadow-lg animate-like-heart" fill="currentColor" />
                </div>
              )}
            </div>
          )}
        </CardContent>
        {!isMinimized && (
          <CardFooter className="flex flex-col items-start gap-4 pt-4">
            <div className="flex justify-between w-full text-muted-foreground text-sm px-6">
              <span>{post.likes} Likes</span>
              <span>{post.comments.length} Comments</span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 w-full gap-2 px-6">
              <Button variant="glow" className="flex items-center gap-2" onClick={() => onLike(post.id)}>
                <Heart className={cn("h-4 w-4", post.isLiked && "fill-red-500 text-red-500")} /> Like
              </Button>
              <Button variant="glow" className="flex items-center gap-2" onClick={() => onCommentClick(post.id)}>
                <MessageCircle className="h-4 w-4" /> Comment
              </Button>
              <Button variant="glow" className="flex items-center gap-2" onClick={() => onShare(post.id)}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    );
  }
);

PostCard.displayName = 'PostCard';

export default PostCard;
