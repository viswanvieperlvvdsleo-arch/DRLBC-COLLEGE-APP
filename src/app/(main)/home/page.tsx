"use client";

import { useMemo, useState, useEffect, createRef, RefObject } from "react";
import { useMainLayout } from "@/app/(main)/layout";
import PostCard from "@/components/app/post-card";
import NoticeRail from "@/components/app/notice-rail";
import NoticeViewer from "@/components/app/notice-viewer";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { PostCardSkeleton } from "@/components/app/skeletons";

import type { Chat, Post, Notice, Comment, Reel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ShareDialog from "@/components/app/share-dialog";
import { Heart, Trash2 } from "lucide-react";

export default function HomePage() {
  const { currentUser, setReels, chats, setChats } = useMainLayout();
  const { toast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activeNoticeId, setActiveNoticeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [creationFile, setCreationFile] = useState<File | null>(null);
  const [creationPreview, setCreationPreview] = useState<string | null>(null);
  const [postCaption, setPostCaption] = useState("");
  const [creationTarget, setCreationTarget] = useState<"post" | "notice" | "reel" | "typo">("notice");
  const [isCreationOpen, setIsCreationOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [commentingPostId, setCommentingPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

  const [sharingPost, setSharingPost] = useState<Post | null>(null);

  const postRefs = useState<Record<number, RefObject<HTMLDivElement>>>({})[0];

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  const safeUser = {
    id: currentUser.id,
    name: currentUser.name,
    role: currentUser.role,
    avatar: currentUser.avatar || "/avatar-placeholder.png",
  };
  const canCreateHomeContent = safeUser.role?.toLowerCase?.() !== "student";

  useEffect(() => {
    posts.forEach((post) => {
      if (!postRefs[post.id]) {
        postRefs[post.id] = createRef<HTMLDivElement>();
      }
    });
  }, [posts, postRefs]);

  const groupedNotices = useMemo<Notice[][]>(() => {
    if (!notices.length) return [];
    const groups: Record<string, Notice[]> = {};
    notices.forEach((n) => {
      if (!groups[n.authorId]) groups[n.authorId] = [];
      groups[n.authorId].push(n);
    });
    return Object.values(groups);
  }, [notices]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [postsRes, noticesRes] = await Promise.all([
          fetch(`/api/posts?userId=${encodeURIComponent(safeUser.id)}`),
          fetch("/api/notices"),
        ]);
        if (postsRes.ok) setPosts((await postsRes.json()) as Post[]);
        if (noticesRes.ok) setNotices((await noticesRes.json()) as Notice[]);
      } catch (err) {
        console.error("Fetch error:", err);
        toast({
          title: "Could not load feed",
          description: "Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLike = async (postId: number) => {
    try {
      const res = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId: safeUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Internal server error");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isLiked: data.isLiked, likes: data.likeCount } : p
        )
      );
    } catch (err: any) {
      console.error("Like post error:", err);
      toast({
        title: "Could not like post",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (postId: number, text: string) => {
    if (!text.trim()) return;
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, authorId: safeUser.id, text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Internal server error");

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, data as Comment] } : p))
      );
    } catch (err: any) {
      console.error("Create comment error:", err);
      toast({
        title: "Could not add comment",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };

  const handleLikeComment = async (postId: number, commentId: number) => {
    try {
      const res = await fetch("/api/comments/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, userId: safeUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Internal server error");

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            comments: p.comments.map((c) =>
              c.id === commentId ? { ...c, likes: data.likeCount, isLiked: data.isLiked } : c
            ),
          };
        })
      );
    } catch (err: any) {
      console.error("Like comment error:", err);
      toast({
        title: "Could not like comment",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      const res = await fetch(
        `/api/comments?id=${encodeURIComponent(String(commentId))}&userId=${encodeURIComponent(safeUser.id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Internal server error");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p
        )
      );
    } catch (err: any) {
      console.error("Delete comment error:", err);
      toast({
        title: "Could not delete comment",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (file: File) => {
    if (creationPreview) URL.revokeObjectURL(creationPreview);

    setCreationFile(file);
    setCreationPreview(URL.createObjectURL(file));

    if (file.type.startsWith("video/")) {
      setCreationTarget("reel");
    } else {
      setCreationTarget("notice");
    }
    setPostCaption("");
    setIsCreationOpen(true);
  };

  const openTypoComposer = () => {
    if (creationPreview) URL.revokeObjectURL(creationPreview);
    setCreationFile(null);
    setCreationPreview(null);
    setPostCaption("");
    setCreationTarget("typo");
    setIsCreationOpen(true);
  };

  const resetCreation = () => {
    if (creationPreview) URL.revokeObjectURL(creationPreview);
    setCreationFile(null);
    setCreationPreview(null);
    setPostCaption("");
    setCreationTarget("notice");
    setIsCreationOpen(false);
  };

  const publish = async () => {
    const isTypo = creationTarget === "typo";

    if (isTypo && !postCaption.trim()) {
      toast({
        title: "Typo needs text",
        description: "Write the update before publishing it to the home feed.",
        variant: "destructive",
      });
      return;
    }

    if (!isTypo && !creationFile) {
      toast({
        title: "Choose a file",
        description: "Please select an image or video first.",
        variant: "destructive",
      });
      return;
    }

    if (creationTarget === "reel" && !creationFile.type.startsWith("video/")) {
      toast({
        title: "Reels must be a video",
        description: "Please choose a video file or switch to Post/Notice.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const endpoint =
        creationTarget === "post" || creationTarget === "typo"
          ? "/api/posts"
          : creationTarget === "notice"
            ? "/api/notices"
            : "/api/reels";

      const res = isTypo
        ? await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ authorId: safeUser.id, caption: postCaption.trim() }),
          })
        : await fetch(endpoint, {
            method: "POST",
            body: (() => {
              const fd = new FormData();
              fd.set("authorId", safeUser.id);
              fd.set("caption", postCaption);
              if (creationFile) fd.set("file", creationFile);
              return fd;
            })(),
          });
      const text = await res.text();

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200));
      }

      if (!res.ok) {
        throw new Error(data?.error || "Internal server error");
      }

      if (creationTarget === "post" || creationTarget === "typo") {
        setPosts((prev) => [data as Post, ...prev]);
      } else if (creationTarget === "notice") {
        setNotices((prev) => [data as Notice, ...prev]);
      } else {
        setReels((prev) => [data as Reel, ...prev]);
      }

      toast({
        title: creationTarget === "typo" ? "Typo posted!" : "Posted!",
        description:
          creationTarget === "typo"
            ? "Your text update is now live on the home feed."
            : "Your content was published.",
      });
      resetCreation();
    } catch (err: any) {
      console.error("Publish error:", err);
      toast({
        title: "Could not publish",
        description: String(err?.message || err),
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const openComments = (postId: number) => {
    setCommentingPostId(postId);
    setCommentText("");
  };

  const closeComments = () => {
    setCommentingPostId(null);
    setCommentText("");
  };

  const handleShareClick = (postId: number) => {
    const postToShare = posts.find((p) => p.id === postId) || null;
    if (postToShare) setSharingPost(postToShare);
  };

  const handleSendPost = async (post: Post, selectedChatIds: string[]) => {
    try {
      const results = await Promise.allSettled(
        selectedChatIds.map(async (chatId) => {
          const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: safeUser.id, sharedPost: post }),
          });
          const data = (await res.json()) as { message?: any; error?: string };
          if (!res.ok || !data?.message) {
            throw new Error(data?.error || "Failed to share post");
          }
          return { chatId, message: data.message };
        })
      );

      const successes = results
        .filter((r): r is PromiseFulfilledResult<{ chatId: string; message: any }> => r.status === "fulfilled")
        .map((r) => r.value);

      if (successes.length === 0) {
        throw new Error("Could not share the post.");
      }

      setChats((prevChats: Chat[]) =>
        prevChats.map((chat) => {
          const match = successes.find((r) => r.chatId === chat.id);
          return match ? { ...chat, messages: [...chat.messages, match.message] } : chat;
        })
      );

      const failedCount = results.length - successes.length;
      setSharingPost(null);
      toast({
        title: "Post Shared!",
        description:
          failedCount > 0
            ? `Shared to ${successes.length} chats. ${failedCount} failed.`
            : "The post has been shared with your selected contacts.",
        duration: 3000,
      });
    } catch (err: any) {
      console.error("Share post error:", err);
      toast({
        title: "Could not share",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      const res = await fetch(`/api/posts?id=${encodeURIComponent(String(postId))}&userId=${encodeURIComponent(safeUser.id)}`, {
        method: "DELETE",
      });
      const text = await res.text();

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200));
      }

      if (!res.ok) {
        throw new Error(data?.error || "Internal server error");
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({ title: "Deleted", description: "Your post was deleted." });
    } catch (err: any) {
      console.error("Delete post error:", err);
      toast({
        title: "Could not delete",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotice = async (noticeId: number) => {
    try {
      const res = await fetch(
        `/api/notices?id=${encodeURIComponent(String(noticeId))}&userId=${encodeURIComponent(safeUser.id)}`,
        { method: "DELETE" }
      );
      const text = await res.text();

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200));
      }

      if (!res.ok) {
        throw new Error(data?.error || "Internal server error");
      }

      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
      setActiveNoticeId((prev) => (prev === noticeId ? null : prev));
      toast({ title: "Deleted", description: "Your notice was deleted." });
    } catch (err: any) {
      console.error("Delete notice error:", err);
      toast({
        title: "Could not delete",
        description: String(err?.message || err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <NoticeRail
        groupedNotices={groupedNotices}
        onNoticeClick={(id) => setActiveNoticeId(id)}
        onAddNotice={canCreateHomeContent ? handleFileSelect : undefined}
        onAddTypo={canCreateHomeContent ? openTypoComposer : undefined}
        currentUser={safeUser as any}
      />

      {isLoading
        ? Array.from({ length: 2 }).map((_, i) => <PostCardSkeleton key={i} />)
        : posts.map((post) => (
            <PostCard
              key={post.id}
              ref={postRefs[post.id]}
              post={post}
              currentUser={safeUser as any}
              onLike={() => handleLike(post.id)}
              onCommentClick={(postId: number) => openComments(postId)}
              onShare={(postId: number) => handleShareClick(postId)}
              onDelete={(postId: number) => handleDeletePost(postId)}
              onAddComment={(commentText: string) => handleAddComment(post.id, commentText)}
            />
          ))}

      <NoticeViewer
        groupedNotices={groupedNotices}
        activeId={activeNoticeId}
        currentUserId={safeUser.id}
        onDeleteNotice={handleDeleteNotice}
        onClose={() => setActiveNoticeId(null)}
        onNextAuthor={() => {}} 
        onPrevAuthor={() => {}}
      />

      <Dialog
        open={isCreationOpen}
        onOpenChange={(open) => {
          if (!open) resetCreation();
          else setIsCreationOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{creationTarget === "typo" ? "Create Typo" : "Create"}</DialogTitle>
            <DialogDescription>
              {creationTarget === "typo"
                ? "Share a teacher text update on the home feed."
                : "Choose where to publish this file."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {creationPreview && (
              <div className="relative overflow-hidden rounded-lg border bg-muted">
                {creationFile?.type.startsWith("video/") ? (
                  <video
                    src={creationPreview}
                    className="w-full h-auto max-h-[45vh] object-contain"
                    controls
                    playsInline
                  />
                ) : (
                  <Image
                    src={creationPreview}
                    alt="Preview"
                    width={800}
                    height={600}
                    className="w-full h-auto max-h-[45vh] object-contain"
                  />
                )}
              </div>
            )}

            {creationTarget === "typo" ? (
              <div className="rounded-xl border bg-primary/5 p-4">
                <p className="text-sm font-semibold text-foreground">Typo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  A text-first faculty update that appears directly in the home feed.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={creationTarget === "post" ? "default" : "secondary"}
                  onClick={() => setCreationTarget("post")}
                >
                  Post
                </Button>
                <Button
                  type="button"
                  variant={creationTarget === "notice" ? "default" : "secondary"}
                  onClick={() => setCreationTarget("notice")}
                >
                  Notice
                </Button>
                <Button
                  type="button"
                  variant={creationTarget === "reel" ? "default" : "secondary"}
                  onClick={() => setCreationTarget("reel")}
                  disabled={!!creationFile && !creationFile.type.startsWith("video/")}
                  className={cn(!creationFile?.type.startsWith("video/") && "opacity-60")}
                >
                  Reel
                </Button>
              </div>
            )}

            <Textarea
              placeholder={
                creationTarget === "typo"
                  ? "Write the message you want students to read on the home page..."
                  : "Write a description (optional)..."
              }
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              rows={creationTarget === "typo" ? 8 : 4}
              className={cn(creationTarget === "typo" && "text-base leading-7")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={resetCreation} disabled={isPublishing}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={publish}
              disabled={isPublishing || (creationTarget === "typo" ? !postCaption.trim() : !creationFile)}
            >
              {isPublishing ? "Posting..." : creationTarget === "typo" ? "Publish Typo" : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments */}
      <Dialog open={commentingPostId !== null} onOpenChange={(open) => (!open ? closeComments() : undefined)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>Reply to the post.</DialogDescription>
          </DialogHeader>

          {(() => {
            const activePost = commentingPostId !== null ? posts.find((p) => p.id === commentingPostId) : null;
            if (!activePost) {
              return <p className="text-sm text-muted-foreground">Post not found.</p>;
            }

            const canModerateComments = activePost.authorId === safeUser.id;

            return (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={activePost.avatar} />
                    <AvatarFallback>{activePost.author.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{activePost.author}</span>{" "}
                      <span className="text-muted-foreground">{activePost.content}</span>
                    </p>
                  </div>
                </div>

                <Separator />

                <ScrollArea className="h-56 pr-3">
                  <div className="space-y-4">
                    {activePost.comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
                    ) : (
                      activePost.comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-3">
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
                                onClick={() => handleLikeComment(activePost.id, c.id)}
                              >
                                <Heart className={cn("h-4 w-4", c.isLiked && "fill-red-600")} />
                                <span>{c.likes}</span>
                              </button>
                                                            {(canModerateComments || c.authorId === safeUser.id) && (
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex items-center gap-1 hover:text-foreground"
                                                                    onClick={() => handleDeleteComment(activePost.id, c.id)}
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
                        handleAddComment(activePost.id, commentText);
                        setCommentText("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      handleAddComment(activePost.id, commentText);
                      setCommentText("");
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Share */}
      {sharingPost && (
        <ShareDialog
          content={sharingPost}
          chats={chats}
          currentUser={currentUser as any}
          onClose={() => setSharingPost(null)}
          onSend={(post, chatIds) => handleSendPost(post as Post, chatIds)}
          dialogTitle="Share Post"
          dialogDescription="Select contacts to share this post with."
        />
      )}
    </div>
  );
}
