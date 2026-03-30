
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Camera, Edit, MessageSquare, Share2, X, Grid3x3, Video } from "lucide-react";
import Link from "next/link";
import type { User, Chat } from "@/lib/mock-data";
import PostCard from "@/components/app/post-card";
import ShareDialog from "@/components/app/share-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMainLayout } from "@/app/(main)/layout";
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSkeleton } from "@/components/app/skeletons";
import { formatAcademicSummary } from "@/lib/academic";

type DbProfileResponse = {
  user: {
    id: string;
    username: string;
    role: "STUDENT" | "TEACHER" | "ADMIN";
    bio: string | null;
    avatarUrl: string | null;
    course?: string | null;
    branch?: string | null;
    section?: string | null;
    year?: string | null;
    isOnline?: boolean;
    createdAt: string;
  };
};

const mapDbRoleToUiRole = (role: DbProfileResponse["user"]["role"]): User["role"] => {
  switch (role) {
    case "STUDENT":
      return "Student";
    case "TEACHER":
    case "ADMIN":
      return "Professor";
    default:
      return "Student";
  }
};

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { toast } = useToast();
  const { chats, setChats, currentUser, setCurrentUser, reels } = useMainLayout();

  const [isLoading, setIsLoading] = useState(true);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/users/profile?userId=${encodeURIComponent(id)}`);
        const text = await res.text();
        const data = JSON.parse(text) as DbProfileResponse;

        if (!res.ok || !data?.user) {
          if (!cancelled) setViewedUser(null);
          return;
        }

        const u = data.user;
        const mapped: User = {
          id: u.id,
          name: u.username,
          avatar: u.avatarUrl || "https://picsum.photos/seed/user-avatar/128/128",
          email: "",
          role: mapDbRoleToUiRole(u.role),
          department: u.role === "STUDENT" ? formatAcademicSummary(u) || "Academic profile pending" : "—",
          bio: u.bio || "",
          course: u.course ?? undefined,
          branch: u.branch ?? undefined,
          section: u.section ?? undefined,
          year: u.year ?? undefined,
        };

        if (!cancelled) setViewedUser(mapped);
      } catch (err) {
        console.error("Failed to load profile", err);
        if (!cancelled) setViewedUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);


  const [isFollowing, setIsFollowing] = useState(viewedUser?.isFollowing || false);
  const [sharingProfile, setSharingProfile] = useState<User | null>(null);

  const isOwnProfile = id === currentUser.id;
  const isViewedOnline = !isOwnProfile && viewedUser?.isOnline;
  const details = isOwnProfile ? currentUser : (viewedUser || null);
  
  const userPosts = profilePosts.filter(p => p.authorId === id);
  const userReels = reels.filter(r => r.authorId === id);

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;

    const loadPosts = async () => {
      setPostsLoading(true);
      try {
        const res = await fetch(`/api/posts?userId=${encodeURIComponent(currentUser.id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Internal server error");
        if (!cancelled) setProfilePosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load profile posts", err);
        if (!cancelled) setProfilePosts([]);
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    };

    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, [id, currentUser.id]);

  const handleFollow = () => {
    if (!details) return;
    setIsFollowing(!isFollowing);
    toast({
        title: isFollowing ? `Unfollowed ${details.name}` : `Followed ${details.name}`,
    });
  }

  const handleShareProfile = (user: User) => {
    setSharingProfile(user);
  };
  
  const handleSendProfile = (profile: User, selectedChatIds: string[]) => {
     setChats((prevChats: Chat[]) => {
      const updatedChats: Chat[] = [];
      const otherChats: Chat[] = [];

      prevChats.forEach(chat => {
        if (selectedChatIds.includes(chat.id)) {
           const profileLink = `${window.location.origin}/profile/${profile.id}`;
           const text = `Check out ${profile.name}'s profile: ${profileLink}`;
          const newMessage = {
            id: `msg-${Date.now()}-${chat.id}`,
            text: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderId: currentUser.id,
          };
          updatedChats.push({ ...chat, messages: [...chat.messages, newMessage] });
        } else {
          otherChats.push(chat);
        }
      });

      return [...updatedChats, ...otherChats];
    });

    setSharingProfile(null);
    toast({
      title: "Profile Sent!",
      description: `${profile.name}'s profile has been shared.`,
      duration: 3000,
    });
  }
  
  const handleMessage = () => {
    if (!viewedUser) return;

    // Check if a chat already exists
    const existingChat = chats.find(c => 
        !c.isGroup &&
        c.users.some(u => u.id === currentUser.id) &&
        c.users.some(u => u.id === viewedUser.id)
    );

    if (existingChat) {
        router.push(`/chat?id=${existingChat.id}`);
        return;
    }

    // Create a new chat
    const newChat: Chat = {
        id: `chat-${Date.now()}`,
        users: [currentUser, viewedUser],
        messages: [],
        unreadCount: 0,
    };

    setChats(prev => [newChat, ...prev]);
    router.push(`/chat?id=${newChat.id}`);
  }

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!details) {
    return (
        <div className="flex h-full items-center justify-center">
            <p>User not found.</p>
        </div>
    );
  }

  return (
      <div className="space-y-6">
          <Card className="animated-border-card">
              <CardHeader className="items-center text-center p-8">
                   <div className='relative'>
                       <Dialog>
                           <DialogTrigger asChild>
                               <Avatar className="h-32 w-32 border-4 border-background shadow-lg cursor-pointer">
                                   <AvatarImage src={details.avatar} alt={details.name} data-ai-hint="profile picture" />
                                   <AvatarFallback>{details.name.substring(0, 2)}</AvatarFallback>
                               </Avatar>
                           </DialogTrigger>
                           <DialogContent className="p-0 border-0 bg-transparent w-auto h-auto shadow-none">
                               <DialogTitle className="sr-only">{details.name}'s Profile Picture</DialogTitle>
                               <div className="relative w-[80vw] h-[80vh] max-w-2xl max-h-2xl">
                                  <Image src={details.avatar} alt={details.name} fill className="object-contain rounded-lg" />
                                   <DialogClose className="absolute -top-2 -right-2 rounded-full bg-background/50 text-foreground h-8 w-8">
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Close</span>
                                  </DialogClose>
                               </div>
                          </DialogContent>
                       </Dialog>
                       {isViewedOnline && (
                           <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-pink-500 ring-2 ring-background" />
                       )}
                       {isOwnProfile && (
                           <Button asChild variant="outline" size="icon" className="absolute bottom-1 right-1 rounded-full h-9 w-9 bg-card/80 backdrop-blur-sm">
                               <Link href="/settings">
                                   <Camera className="h-5 w-5" />
                               </Link>
                          </Button>
                      )}
                  </div>
                  <div className="pt-4">
                      <CardTitle className="text-3xl">{details.name}</CardTitle>
                      <CardDescription className="text-lg">{details.id}</CardDescription>
                  </div>
                   <div className="flex items-center gap-2 pt-4">
                        {isOwnProfile ? (
                             <Button asChild variant="glow">
                                <Link href="/settings">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Link>
                            </Button>
                        ) : (
                           <>
                                <Button variant={isFollowing ? 'secondary' : 'glow'} onClick={handleFollow}>
                                    {isFollowing ? 'Unfollowing' : 'Follow'}
                                </Button>
                                <Button variant="outline" onClick={handleMessage}>
                                    <MessageSquare className="mr-2 h-4 w-4"/>
                                    Message
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => handleShareProfile(details)}>
                                    <Share2 className="h-4 w-4" />
                                </Button>
                           </>
                        )}
                    </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-8">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-1">
                          <dt className="text-sm font-medium text-muted-foreground">Role</dt>
                          <dd className="text-lg font-semibold">{details.role}</dd>
                      </div>
                      <div className="space-y-1">
                          <dt className="text-sm font-medium text-muted-foreground">Department</dt>
                          <dd className="text-lg font-semibold">{details.department}</dd>
                      </div>
                      <div className="space-y-1 col-span-1 md:col-span-2">
                          <dt className="text-sm font-medium text-muted-foreground">Bio</dt>
                          <dd className="text-lg font-semibold whitespace-pre-line">
                              {details.bio}
                          </dd>
                      </div>
                  </dl>
              </CardContent>
          </Card>
          
          <Separator />
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
                    <TabsTrigger value="posts">
                        <Grid3x3 className="mr-2 h-4 w-4" />
                        Posts
                    </TabsTrigger>
                    <TabsTrigger value="reels">
                        <Video className="mr-2 h-4 w-4" />
                        Reels
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="posts">
                    <div className="space-y-6 mt-6">
                        {postsLoading ? (
                            <p className="text-muted-foreground text-center py-8">Loading posts...</p>
                        ) : userPosts.length > 0 ? (
                            userPosts.map(post => (
                                <PostCard 
                                    key={post.id}
                                    post={post}
                                    currentUser={currentUser}
                                    onLike={() => {}}
                                    onCommentClick={() => {}}
                                    onShare={() => {}}
                                    onDelete={() => {}}
                                />
                            ))
                        ) : (
                            <p className="text-muted-foreground text-center py-8">{details.name} hasn't posted anything yet.</p>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="reels">
                    <div className="mt-6">
                        {userReels.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {userReels.map(reel => (
                                    <Link href={`/reels#reel-${reel.id}`} key={reel.id}>
                                        <div className="relative aspect-[9/16] rounded-md overflow-hidden group">
                                            <video
                                                src={reel.videoUrl}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">{details.name} hasn't posted any reels yet.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
          
          {sharingProfile && (
            <ShareDialog
                content={sharingProfile}
                chats={chats}
                currentUser={currentUser}
                onClose={() => setSharingProfile(null)}
                onSend={(profile, chatIds) => handleSendProfile(profile as User, chatIds)}
                dialogTitle={`Share ${sharingProfile.name}'s Profile`}
                dialogDescription="Select contacts to share this profile with."
            />
        )}
      </div>
  );
}

    
