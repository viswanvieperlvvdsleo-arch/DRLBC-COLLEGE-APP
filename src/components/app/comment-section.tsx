
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Heart, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { Post, Comment } from "@/lib/mock-data";

interface CommentSectionProps {
  post: Post;
  onClose: () => void;
  onAddComment: (postId: number, text: string) => void;
  onDeleteComment: (postId: number, commentId: number) => void;
}

export default function CommentSection({ post, onClose, onAddComment, onDeleteComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post.comments);

  const handleLikeComment = (commentId: number) => {
    setComments(prev => 
        prev.map(c => 
            c.id === commentId ? {...c, isLiked: !c.isLiked, likes: c.likes + (c.isLiked ? -1 : 1)} : c
        )
    )
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(post.id, newComment);
      setNewComment("");
    }
  };
  
  React.useEffect(() => {
    setComments(post.comments);
  }, [post.comments]);

  return (
    <Card className="flex flex-col h-full rounded-none md:rounded-lg border-0 md:border min-h-0">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b flex-shrink-0">
        <div className="flex flex-col">
          <CardTitle className="text-xl">Comments</CardTitle>
          <span className="text-sm text-muted-foreground">on a post by {post.author}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {comments.map((comment) => {
            const canDelete = comment.authorId === 'currentUser' || post.authorId === 'currentUser'; // Assuming current user is post author for demo
            return (
              <div key={comment.id}>
                  <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                      <AvatarImage src={comment.avatar} data-ai-hint="person face" />
                      <AvatarFallback>{comment.author.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                      <p className="font-semibold text-sm">{comment.author}</p>
                      <p className="text-sm">{comment.text}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <button className="flex items-center gap-1 group" onClick={() => handleLikeComment(comment.id)}>
                              <Heart className={cn("h-4 w-4 transition-transform group-active:scale-125", comment.isLiked && "fill-red-500 text-red-500")} />
                              <span>{comment.likes}</span>
                          </button>
                      </div>
                  </div>
                  {canDelete && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onDeleteComment(post.id, comment.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  </div>
                  <Separator className="mt-4" />
              </div>
            )
          })}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background flex-shrink-0 sticky bottom-0">
        <form onSubmit={handleAddComment} className="flex items-center gap-2">
          <div className="animated-border-input flex-1">
            <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="glow"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
