
'use client';

import React, { useState, useRef, useEffect, useMemo, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MoreVertical,
  Search,
  Plus,
  Send,
  GraduationCap,
  ArrowLeft,
  Eye,
  Smile,
  X,
  Image as ImageIcon,
  FileText,
  User as UserIcon,
  Bell,
  Lock,
  Star,
  ChevronRight,
  Link2,
  Reply,
  Edit,
  Trash2,
  Square,
  Play,
  Users,
  Check,
  Dot,
  Download,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { User, Message, Chat, Post, MediaAttachment, Note, Reaction, Reel } from '@/lib/mock-data';
import PostCard from '@/components/app/post-card';
import { useMainLayout } from '../layout';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ChatListSkeleton } from '@/components/app/skeletons';

const isStudent = (role?: string) => role?.toLowerCase() === "student";


// Components
function ChatListPanel({
  chats,
  activeChatId,
  onChatSelect,
  currentUser,
  onCreateGroup,
  isLoading,
}: {
  chats: Chat[];
  activeChatId: string | null;
  onChatSelect: (chatId: string) => void;
  currentUser: User;
  onCreateGroup?: () => void;
  isLoading: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChats = chats.filter((chat) => {
    if (chat.isGroup) {
      return chat.name?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    const otherUser = chat.users.find((u) => u.id !== currentUser.id);
    return otherUser && otherUser.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <aside className="w-full md:w-96 flex flex-col border-r bg-card h-full">
      <header className="flex-shrink-0 flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2 w-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
           <div className="relative w-full animated-border-input">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
            <Input
              placeholder="Search or start a new chat"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {!isStudent(currentUser.role) && onCreateGroup && (
          <Button variant="glow" size="sm" className="ml-2 whitespace-nowrap" onClick={() => onCreateGroup()}>
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        )}
      </header>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
            <ChatListSkeleton />
        ) : (
            <div className="flex flex-col">
            {filteredChats.map((chat) => {
                const isGroup = chat.isGroup;
                const otherUser = chat.users.find((u) => u.id !== currentUser.id);
                const chatName = isGroup ? chat.name : otherUser?.name;
                const chatAvatar = isGroup ? chat.groupAvatar : otherUser?.avatar;
                const isOnline = Boolean(!isGroup && otherUser?.isOnline);

                const lastMessage = chat.messages[chat.messages.length - 1];
                const unreadCount = chat.unreadCount;
                
                let lastMessageText = lastMessage?.text || '';
                if (lastMessage?.sharedPost) {
                    lastMessageText = 'Shared a post';
                }
                if (lastMessage?.sharedNote) {
                    lastMessageText = 'Shared a note';
                }
                if (lastMessage?.sharedReel) {
                    lastMessageText = 'Shared a reel';
                }
                if (lastMessage?.media?.length) {
                const firstMedia = lastMessage.media[0];
                if (firstMedia.type.startsWith('image')) {
                    lastMessageText = `Photo${lastMessage.media.length > 1 ? 's' : ''}`;
                } else if (firstMedia.type.startsWith('video')) {
                    lastMessageText = `Video${lastMessage.media.length > 1 ? 's' : ''}`;
                } else {
                    lastMessageText = 'Document';
                }
                }
                if (lastMessage?.audioUrl) {
                lastMessageText = 'Voice message';
                }

                return (
                <button
                    key={chat.id}
                    onClick={() => onChatSelect(chat.id)}
                    className={cn(
                    'flex items-center gap-4 p-3 text-left hover:bg-secondary transition-colors border-b',
                    chat.id === activeChatId ? 'bg-secondary' : ''
                    )}
                >
                    <div className="relative">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={chatAvatar} alt={chatName} />
                            <AvatarFallback>{chatName?.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-pink-500 ring-2 ring-card" />
                        )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold truncate">{chatName}</h3>
                    <p className="text-sm text-muted-foreground truncate">{lastMessageText}</p>
                    </div>
                    <div className="flex flex-col items-end text-xs text-muted-foreground self-start">
                    <span className={cn(unreadCount > 0 ? "text-primary font-semibold" : "")}>
                      {lastMessage?.timestamp}
                    </span>
                    {chat.unreadCount > 0 && (
                        <div className="mt-1 bg-primary/90 text-primary-foreground rounded-full min-h-5 min-w-5 px-2 flex items-center justify-center shadow-sm">
                            <span className="text-[11px] font-bold leading-none">{chat.unreadCount}</span>
                        </div>
                    )}
                    </div>
                </button>
                );
            })}
            </div>
        )}
      </ScrollArea>
    </aside>
  );
}

const emojis = [
  '😂', '❤️', '👍', '😭', '🙏', '😍', '😊', '🔥', '🤔', '🙌',
  '😎', '🎉', '💯', '✅', '🤣', '🥰', '😁', '🤗', '😉', '😜',
  '😋', '🤫', '😑', '😴', '🥺', '😢', '😠', '🤯', '😱', '🥳',
  '😇', '🤪', '🤩', '🤝', '👋', '👌', '✌️', '💪', '👀', '✨',
  '💔', '🙂', '🙃', '🙄', '😮', '😥', '🤐', '🥴', '🤢', '🤮'
];

const avatarPalette = ['#ec4899', '#6366f1', '#10b981', '#f97316', '#06b6d4', '#f59e0b'];

const buildEmojiAvatar = (emoji: string, bg: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="28" fill="${bg}" />
    <text x="50%" y="58%" font-size="64" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};


function SharedContentPanel({
  chat,
  onBack,
  defaultTab,
}: {
  chat: Chat;
  onBack: () => void;
  defaultTab: 'media' | 'files' | 'links' | 'starred';
}) {
  const allMediaWithTimestamp = chat.messages.flatMap(m => 
      (m.media || []).map(media => ({...media, timestamp: m.timestamp}))
  );
  
  const photos = allMediaWithTimestamp.filter(m => m.type.startsWith('image/'));
  const videos = allMediaWithTimestamp.filter(m => m.type.startsWith('video/'));
  const files = allMediaWithTimestamp.filter(m => !m.type.startsWith('image/') && !m.type.startsWith('video/'));

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = chat.messages
    .map(m => ({
        ...m,
        foundLinks: m.text?.match(urlRegex)
    }))
    .filter(m => m.foundLinks && m.foundLinks.length > 0)
    .flatMap(m => m.foundLinks!.map(link => ({
        id: m.id,
        link,
        text: m.text,
        timestamp: m.timestamp,
    })));

  const starredMessages = chat.messages.filter(m => m.isStarred && !m.isDeleted);

  return (
    <div className="flex flex-col h-full w-full bg-card">
       <header className="flex-shrink-0 flex items-center gap-4 p-3 border-b">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Media, Files, and Links</h2>
        </header>
        <Tabs key={defaultTab} defaultValue={defaultTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
                <TabsTrigger value="media">Media ({photos.length + videos.length})</TabsTrigger>
                <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
                <TabsTrigger value="links">Links ({links.length})</TabsTrigger>
                <TabsTrigger value="starred">Starred ({starredMessages.length})</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1 min-h-0">
                <TabsContent value="media">
                     <Tabs defaultValue="photos" className="w-full">
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
                            <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="photos" className="p-2">
                             {photos.length > 0 ? (
                                <div className="grid grid-cols-3 gap-1">
                                    {photos.map((media, index) => (
                                        <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                                            <Image src={media.url} alt={media.type} fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                <p className="p-4 text-center text-muted-foreground">No photos shared yet.</p>
                             )}
                        </TabsContent>
                         <TabsContent value="videos" className="p-2">
                            {videos.length > 0 ? (
                                <div className="grid grid-cols-3 gap-1">
                                    {videos.map((media, index) => (
                                        <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-black">
                                            <Image src={media.url} alt={media.type} fill className="object-cover opacity-60" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Play className="h-8 w-8 text-white" fill="white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             ) : (
                                <p className="p-4 text-center text-muted-foreground">No videos shared yet.</p>
                             )}
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="files" className="p-2 space-y-2">
                     {files.length > 0 ? (
                         files.map((file, index) => (
                            <a href={file.url} download={file.fileName} key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                                <div className="p-2 bg-background rounded-md">
                                    <FileText className="h-6 w-6 flex-shrink-0 text-primary" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{file.timestamp}</p>
                                </div>
                                <Download className="h-5 w-5 text-muted-foreground" />
                            </a>
                        ))
                     ) : (
                        <p className="p-4 text-center text-muted-foreground">No files shared yet.</p>
                     )}
                </TabsContent>
                <TabsContent value="links" className="p-2 space-y-2">
                    {links.length > 0 ? (
                        links.map((linkItem) => (
                            <a href={linkItem.link} target="_blank" rel="noopener noreferrer" key={linkItem.id + linkItem.link} className="block p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                                <p className="text-sm font-medium text-primary truncate">{linkItem.link}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{linkItem.text}</p>
                                <p className="text-xs text-muted-foreground mt-1">{linkItem.timestamp}</p>
                            </a>
                        ))
                    ) : (
                        <p className="p-4 text-center text-muted-foreground">No links shared yet.</p>
                    )}
                </TabsContent>
                <TabsContent value="starred" className="p-2 space-y-2">
                    {starredMessages.length > 0 ? (
                        starredMessages.map((msg) => (
                            <div key={msg.id} className="p-3 rounded-lg bg-secondary/60 space-y-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{chat.users.find(u => u.id === msg.senderId)?.name || "User"}</span>
                                    <span>{msg.timestamp}</span>
                                </div>
                                <p className="text-sm">{msg.text || "Attachment"}</p>
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-center text-muted-foreground">No starred messages yet.</p>
                    )}
                </TabsContent>
            </ScrollArea>
        </Tabs>
    </div>
  );
}


function ContactInfoPanel({
  user,
  chat,
  onBack,
  onShowSharedContent,
  isMuted,
  onToggleMute,
}: {
  user: User;
  chat: Chat;
  onBack: () => void;
  onShowSharedContent: (contentType: 'media' | 'files' | 'links' | 'starred') => void;
  isMuted: boolean;
  onToggleMute: (nextMuted: boolean) => void;
}) {
  const mediaCount = chat.messages.reduce((count, msg) => count + (msg.media?.length || 0), 0);
  const filesCount = chat.messages.flatMap(m => m.media || []).filter(m => m && !m.type.startsWith('image/') && !m.type.startsWith('video/')).length;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const linksCount = chat.messages.reduce((count, msg) => count + (msg.text?.match(urlRegex)?.length || 0), 0);
  
  return (
    <div className="flex flex-col h-full w-full bg-card">
       <header className="flex-shrink-0 flex items-center gap-4 p-3 border-b">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Profile info</h2>
        </header>
        <div className="flex flex-col items-center justify-center p-6 gap-2">
            <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{user.name}</h2>
        </div>
        <Separator/>
         <div className="p-4 bg-secondary/50 flex-1 space-y-4 overflow-auto">
            <div className="p-3 bg-card rounded-lg space-y-2">
                <h3 className="text-sm font-medium">About</h3>
                <p className="text-sm text-muted-foreground">{user.bio || 'No bio added yet.'}</p>
            </div>
            <div className="p-3 bg-card rounded-lg divide-y">
                <button className="w-full flex items-center justify-between py-3 text-sm" onClick={() => onShowSharedContent('media')}>
                    <div className="flex items-center gap-3">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span>Media</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{mediaCount}</span>
                        <ChevronRight className="h-4 w-4" />
                    </div>
                </button>
                <button className="w-full flex items-center justify-between py-3 text-sm" onClick={() => onShowSharedContent('files')}>
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span>Files</span>
                    </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{filesCount}</span>
                        <ChevronRight className="h-4 w-4" />
                    </div>
                </button>
                <button className="w-full flex items-center justify-between py-3 text-sm" onClick={() => onShowSharedContent('links')}>
                    <div className="flex items-center gap-3">
                        <Link2 className="h-5 w-5 text-muted-foreground" />
                        <span>Links</span>
                    </div>
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{linksCount}</span>
                        <ChevronRight className="h-4 w-4" />
                    </div>
                </button>
            </div>
             <div className="p-3 bg-card rounded-lg divide-y">
                 <div className="flex items-center justify-between py-3">
                     <div className="flex items-center gap-3">
                       <Bell className="h-5 w-5 text-muted-foreground" />
                       <span className="text-sm">Mute notifications</span>
                     </div>
                     <Switch checked={isMuted} onCheckedChange={onToggleMute} />
                 </div>
                 <button className="w-full flex items-center justify-between py-3 text-sm" onClick={() => onShowSharedContent('starred')}>
                     <span>Starred messages</span>
                     <Star className="h-5 w-5 text-muted-foreground" />
                 </button>
             </div>
             <div className="p-3 bg-card rounded-lg">
                 <div className="flex items-center gap-4 text-primary">
                    <Lock className="h-5 w-5" />
                    <div>
                        <p className="text-sm font-medium">Encryption</p>
                        <p className="text-xs text-muted-foreground">Messages are end-to-end encrypted</p>
                    </div>
                 </div>
            </div>
         </div>
    </div>
  );
}

function GroupInfoPanel({
    chat,
    currentUser,
    onBack,
    onMakeAdmin,
    onDismissAdmin,
    onRemoveUser,
    onAddMembers,
    onDeleteGroup,
    onExitGroup,
}: {
    chat: Chat;
    currentUser: User;
    onBack: () => void;
    onMakeAdmin: (userId: string) => void;
    onDismissAdmin: (userId: string) => void;
    onRemoveUser: (userId: string) => void;
    onAddMembers: () => void;
    onDeleteGroup: () => void;
    onExitGroup: () => void;
}) {
  const isAdmin = chat.admins?.includes(currentUser.id);
  const isCreatorOrAdmin = isAdmin; // creator unknown; treat admins as authorized

  return (
    <div className="flex flex-col h-full w-full bg-card">
       <header className="flex-shrink-0 flex items-center gap-4 p-3 border-b">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">Group info</h2>
        </header>
        <div className="flex flex-col items-center justify-center p-6 gap-2">
            <Avatar className="h-24 w-24">
                <AvatarImage src={chat.groupAvatar} alt={chat.name} />
                <AvatarFallback>{chat.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{chat.name}</h2>
            <p className="text-sm text-muted-foreground">Group · {chat.users.length} members</p>
        </div>
        <Separator/>
         <div className="p-4 bg-secondary/50 flex-1 space-y-4 overflow-auto">
            {isAdmin && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onAddMembers}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add members
                </Button>
                <Button variant="destructive" size="sm" onClick={onDeleteGroup}>
                  Delete group
                </Button>
              </div>
            )}
            <div className="p-3 bg-card rounded-lg">
                <h3 className="font-semibold mb-3">Members</h3>
                <div className="space-y-3">
                    {chat.users.map(user => {
                        const userIsAdmin = chat.admins?.includes(user.id);
                        return (
                            <div key={user.id} className="flex items-center justify-between">
                                <Link href={`/profile/${user.id}`} className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.department}</p>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-2">
                                    {userIsAdmin && (
                                        <span className="text-xs font-semibold text-primary border border-primary/50 rounded-full px-2 py-0.5">Admin</span>
                                    )}
                                    {isAdmin && user.id !== currentUser.id && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {userIsAdmin ? (
                                                     <DropdownMenuItem onClick={() => onDismissAdmin(user.id)}>
                                                        Dismiss as admin
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => onMakeAdmin(user.id)}>
                                                        Make admin
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-500" onClick={() => onRemoveUser(user.id)}>
                                                    Remove from group
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
             <div className="p-3 bg-card rounded-lg text-red-500">
                 <Button variant="ghost" className="w-full justify-start p-0 h-auto text-red-500 hover:text-red-600" onClick={onExitGroup}>
                    Exit group
                 </Button>
            </div>
         </div>
    </div>
  );
}


function MediaPreview({
  files,
  caption,
  onCaptionChange,
  onSend,
  onClose,
}: {
  files: File[];
  caption: string;
  onCaptionChange: (caption: string) => void;
  onSend: () => void;
  onClose: () => void;
}) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach(URL.revokeObjectURL);
    };
  }, [files]);

  return (
    <div className="flex flex-col h-full w-full bg-black">
      <header className="flex-shrink-0 flex items-center justify-between p-3 bg-background/10">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:text-white">
          <X className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold text-white">Send Media</h2>
        <div></div>
      </header>

      <div className="flex-1 overflow-hidden p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 h-full overflow-y-auto">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <Image src={preview} alt={`preview ${index}`} fill className="object-cover" />
              </div>
            ))}
          </div>
      </div>

      <footer className="flex-shrink-0 p-3 bg-background/10 flex items-center gap-2">
        <div className="flex-1 animated-border-input">
            <Input
            value={caption}
            onChange={e => onCaptionChange(e.target.value)}
            placeholder="Add a caption..."
            className="bg-background/20 border-none text-white placeholder:text-gray-300"
            />
        </div>
        <Button size="icon" onClick={onSend} className="rounded-full bg-primary h-11 w-11">
          <Send className="h-5 w-5" />
        </Button>
      </footer>
    </div>
  );
}

const ReelPreviewCard = ({ reel, isSender }: { reel: Reel, isSender: boolean }) => {
    return (
        <Card className="rounded-lg overflow-hidden w-64">
            <div className="relative aspect-[9/16] bg-black">
                <video src={reel.videoUrl} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex flex-col justify-between p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 border-2 border-white">
                            <AvatarImage src={reel.avatar} />
                            <AvatarFallback>{reel.author.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <p className="text-white text-xs font-semibold">{reel.author}</p>
                    </div>
                    <p className="text-white text-xs line-clamp-2">{reel.caption}</p>
                </div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-10 w-10 text-white" fill="white" />
                </div>
            </div>
             <Link href={`/reels#reel-${reel.id}`} passHref>
                <Button variant={isSender ? 'secondary': 'default'} size="sm" className="h-8 w-full rounded-none">
                    <Eye className="mr-2 h-4 w-4" />
                    View Reel
                </Button>
            </Link>
        </Card>
    );
};

interface MediaViewerProps {
    media: MediaAttachment[];
    startIndex: number;
    onClose: () => void;
}

function MediaViewer({ media, startIndex, onClose }: MediaViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const currentItem = media[currentIndex];

    const handleNext = () => {
        setCurrentIndex(prev => (prev + 1) % media.length);
    };

    const handlePrev = () => {
        setCurrentIndex(prev => (prev - 1 + media.length) % media.length);
    };

    const handleDownload = async () => {
        if (!currentItem.url) return;
        try {
            const response = await fetch(currentItem.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = currentItem.fileName || `download-${Date.now()}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading media:', error);
        }
    };


    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="p-0 m-0 w-screen h-screen max-w-full max-h-full rounded-none border-0 bg-black/80 backdrop-blur-sm" showCloseButton={false}>
                <DialogTitle className="sr-only">Media Viewer</DialogTitle>
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                        <div></div>
                        <div className="flex items-center gap-2">
                             <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/20" onClick={handleDownload}>
                                <Download className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/20" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative w-[90vw] h-[80vh]">
                        {currentItem.type.startsWith('image/') && (
                             <Image src={currentItem.url} alt={currentItem.fileName || 'Image'} fill className="object-contain" />
                        )}
                        {currentItem.type.startsWith('video/') && (
                            <video src={currentItem.url} controls autoPlay className="w-full h-full object-contain" />
                        )}
                    </div>
                    
                    {/* Navigation */}
                    {media.length > 1 && (
                        <>
                            <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 h-10 w-10" onClick={handlePrev}>
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 h-10 w-10" onClick={handleNext}>
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}



function ChatWindowPanel({
  chat: initialChat,
  onMessageUpdate,
  onChatInfoUpdate,
  onAddMembers,
  onDeleteGroup,
  onExitGroup,
  currentUser,
  onBack,
  isMobile
}: {
  chat: Chat;
  onMessageUpdate: (chatId: string, messages: Message[]) => void;
  onChatInfoUpdate: (chatId: string, updatedInfo: Partial<Chat>) => void;
  onAddMembers: (chatId: string) => void;
  onDeleteGroup: (chatId: string) => void;
  onExitGroup: (chatId: string) => void;
  currentUser: User;
  onBack: () => void;
  isMobile: boolean;
}) {
  const [chat, setChat] = useState(initialChat);
  useEffect(() => setChat(initialChat), [initialChat]);
  const { toast } = useToast();

  const [message, setMessage] = useState('');
  const [isAttachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'contactInfo' | 'groupInfo' | 'sharedContent'>('chat');
  const [sharedContentType, setSharedContentType] = useState<'media' | 'files' | 'links' | 'starred'>('media');

  const scrollAreaViewport = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  
  const [viewingMedia, setViewingMedia] = useState<{media: MediaAttachment[], startIndex: number} | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Interaction states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [reactingTo, setReactingTo] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const isMediaPreview = selectedFiles.length > 0;
  
  // Long press state
  const longPressTimer = useRef<NodeJS.Timeout>();
  const [longPressMessageId, setLongPressMessageId] = useState<string | null>(null);

  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const [swipingMessageId, setSwipingMessageId] = useState<string | null>(null);
  const touchStartX = useRef(0);
  const SWIPE_THRESHOLD = 50;

  const isStudentOnly1to1 =
    !chat.isGroup && chat.users.length === 2 && chat.users.every((u) => isStudent(u.role));
  const canSend = chat.isGroup || !isStudentOnly1to1;
  const canDeleteForEveryone = (message?: Message | null) =>
    Boolean(message && message.senderId === currentUser.id && !message.isDeleted);
  const selectedMessages = useMemo(
    () => chat.messages.filter((msg) => selectedMessageIds.includes(msg.id) && !msg.isSystem),
    [chat.messages, selectedMessageIds]
  );
  const canDeleteSelectionForEveryone =
    selectedMessages.length > 0 &&
    selectedMessages.every((msg) => canDeleteForEveryone(msg));


  const updateMessages = (newMessages: Message[], systemMessage?: Message) => {
    const messagesToUpdate = systemMessage ? [...newMessages, systemMessage] : newMessages;
    setChat(prev => ({...prev, messages: messagesToUpdate}));
    onMessageUpdate(chat.id, messagesToUpdate);
  }

  const replaceMessage = (updated: Message) => {
    updateMessages(chat.messages.map((msg) => (msg.id === updated.id ? { ...msg, ...updated } : msg)));
  };

  const clearSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMessageIds([]);
    setBulkDeleteOpen(false);
    setLongPressMessageId(null);
  };

  const enterSelectionMode = (messageId?: string) => {
    setSelectionMode(true);
    setDeletingMessage(null);
    setLongPressMessageId(null);
    setReplyingTo(null);
    setEditingMessageId(null);
    setReactingTo(null);
    if (messageId) {
      setSelectedMessageIds((prev) => (prev.includes(messageId) ? prev : [...prev, messageId]));
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds((prev) => {
      if (prev.includes(messageId)) {
        const next = prev.filter((id) => id !== messageId);
        if (next.length === 0) {
          setSelectionMode(false);
          setBulkDeleteOpen(false);
        }
        return next;
      }
      return [...prev, messageId];
    });
  };

  useEffect(() => {
    const loadMessages = async () => {
      if (!chat?.id || !currentUser?.id) return;
      try {
        const res = await fetch(`/api/chats/${encodeURIComponent(chat.id)}/messages?userId=${encodeURIComponent(currentUser.id)}&limit=50`);
        const data = (await res.json()) as { messages?: Message[]; hasMore?: boolean; error?: string };
        if (!res.ok || !data?.messages) {
          throw new Error(data?.error || "Failed to load messages");
        }
        updateMessages(data.messages);
        setHasMoreMessages(Boolean(data.hasMore));
      } catch (err) {
        console.error("Failed to load chat messages", err);
      }
    };

    void loadMessages();
  }, [chat.id, currentUser.id]);

  useEffect(() => {
    clearSelectionMode();
  }, [chat.id]);

  const loadOlderMessages = async () => {
    if (!hasMoreMessages || isLoadingMore) return;
    const oldest = chat.messages[0];
    if (!oldest?.createdAt) return;

    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/chats/${encodeURIComponent(chat.id)}/messages?userId=${encodeURIComponent(currentUser.id)}&limit=50&before=${encodeURIComponent(oldest.createdAt)}`
      );
      const data = (await res.json()) as { messages?: Message[]; hasMore?: boolean; error?: string };
      if (!res.ok || !data?.messages) {
        throw new Error(data?.error || "Failed to load older messages");
      }

      const merged = [...data.messages, ...chat.messages];
      updateMessages(merged);
      setHasMoreMessages(Boolean(data.hasMore));
    } catch (err) {
      console.error("Failed to load older messages", err);
      toast({
        variant: "destructive",
        title: "Load failed",
        description: "Could not load older messages.",
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (scrollAreaViewport.current && !isMediaPreview) {
      scrollAreaViewport.current.scrollTo({
        top: scrollAreaViewport.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chat.messages, isMediaPreview]);

  const handleAddEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const sendAttachments = async (files: File[], captionText: string) => {
    if (!files.length) return;
    const replyToId = replyingTo?.id;
    const previousMessages = chat.messages;
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      text: captionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      senderId: currentUser.id,
      replyToId,
      media: files.map((file) => ({
        type: file.type || "application/octet-stream",
        url: URL.createObjectURL(file),
        fileName: file.name,
      })),
    };
    const optimisticMessages = [...previousMessages, optimisticMessage];
    updateMessages(optimisticMessages);
    setReplyingTo(null);

    try {
      const fd = new FormData();
      fd.append("userId", currentUser.id);
      if (captionText) fd.append("text", captionText);
      if (replyToId) fd.append("replyToId", replyToId);
      files.forEach((file) => fd.append("files", file));

      const res = await fetch(`/api/chats/${encodeURIComponent(chat.id)}/messages`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { message?: Message; error?: string };
      if (!res.ok || !data?.message) {
        throw new Error(data?.error || "Failed to send attachments");
      }

      const finalMessages = optimisticMessages.map((msg) =>
        msg.id === optimisticId ? data.message! : msg
      );
      updateMessages(finalMessages);
    } catch (err) {
      console.error("Failed to send attachments", err);
      updateMessages(previousMessages);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not send attachments.",
      });
    }
  };

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    const previousMessages = chat.messages;
    const replyToId = replyingTo?.id;
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      senderId: currentUser.id,
      replyToId,
    };

    const optimisticMessages = [...previousMessages, optimisticMessage];
    updateMessages(optimisticMessages);
    setMessage('');
    setReplyingTo(null);

    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(chat.id)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, text: trimmed, replyToId }),
      });
      const data = (await res.json()) as { message?: Message; error?: string };
      if (!res.ok || !data?.message) {
        throw new Error(data?.error || "Failed to send message");
      }

      const finalMessages = optimisticMessages.map((msg) =>
        msg.id === optimisticId ? data.message! : msg
      );
      updateMessages(finalMessages);
    } catch (err) {
      console.error("Failed to send message", err);
      updateMessages(previousMessages);
      setMessage(trimmed);
      toast({
        variant: "destructive",
        title: "Send failed",
        description: "Message was not delivered.",
      });
    }
  };
  
  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!newText.trim()) {
      await handleDeleteMessage(messageId, 'everyone');
      return;
    }

    const previousMessages = chat.messages;
    const optimistic = chat.messages.map((m) => (m.id === messageId ? { ...m, text: newText } : m));
    updateMessages(optimistic);
    setEditingMessageId(null);
    setEditingText('');

    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(chat.id)}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          messageId,
          action: "edit",
          text: newText,
        }),
      });
      const data = (await res.json()) as { message?: Message; error?: string };
      if (!res.ok || !data?.message) {
        throw new Error(data?.error || "Failed to edit message");
      }
      replaceMessage(data.message);
    } catch (err) {
      console.error("Failed to edit message", err);
      updateMessages(previousMessages);
      toast({
        variant: "destructive",
        title: "Edit failed",
        description: "Could not update the message.",
      });
    }
  }

  const handleSendMedia = () => {
    if (selectedFiles.length === 0) return;
    const filesToSend = [...selectedFiles];
    const captionText = caption;
    setSelectedFiles([]);
    setCaption('');
    void sendAttachments(filesToSend, captionText);
  };

  const handleDeleteMessage = async (messageId: string, type: 'me' | 'everyone') => {
    if (type === 'me') {
      const previousMessages = chat.messages;
      const newMessages = chat.messages.filter(m => m.id !== messageId);
      updateMessages(newMessages);
      setDeletingMessage(null);

      try {
        const res = await fetch(
          `/api/chats/${encodeURIComponent(chat.id)}/messages?messageId=${encodeURIComponent(messageId)}&userId=${encodeURIComponent(currentUser.id)}&scope=me`,
          { method: "DELETE" }
        );
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Failed to delete message for me");
        }
      } catch (err) {
        console.error("Failed to delete message for me", err);
        updateMessages(previousMessages);
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: "Could not delete the message.",
        });
      }
      return;
    }

    const previousMessages = chat.messages;
    const optimistic = chat.messages.map(m =>
      m.id === messageId
        ? { ...m, text: '', media: undefined, sharedPost: undefined, sharedNote: undefined, audioUrl: undefined, isDeleted: true }
        : m
    );
    updateMessages(optimistic);
    setDeletingMessage(null);

    try {
      const res = await fetch(
        `/api/chats/${encodeURIComponent(chat.id)}/messages?messageId=${encodeURIComponent(messageId)}&userId=${encodeURIComponent(currentUser.id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as { message?: Message; error?: string };
      if (!res.ok || !data?.message) {
        throw new Error(data?.error || "Failed to delete message");
      }
      replaceMessage(data.message);
    } catch (err) {
      console.error("Failed to delete message", err);
      updateMessages(previousMessages);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Could not delete the message.",
      });
    }
  };

  const handleBulkDeleteForMe = async () => {
    if (selectedMessages.length === 0) return;

    const idsToDelete = [...selectedMessageIds];
    const previousMessages = chat.messages;
    updateMessages(chat.messages.filter((msg) => !idsToDelete.includes(msg.id)));
    setBulkDeleteLoading(true);

    try {
      await Promise.all(
        idsToDelete.map(async (messageId) => {
          const res = await fetch(
            `/api/chats/${encodeURIComponent(chat.id)}/messages?messageId=${encodeURIComponent(messageId)}&userId=${encodeURIComponent(currentUser.id)}&scope=me`,
            { method: "DELETE" }
          );
          const data = (await res.json()) as { ok?: boolean; error?: string };
          if (!res.ok || !data?.ok) {
            throw new Error(data?.error || "Failed to delete selected messages");
          }
        })
      );

      toast({
        title: "Messages deleted",
        description: `${idsToDelete.length} message${idsToDelete.length === 1 ? "" : "s"} removed from your chat view.`,
      });
      clearSelectionMode();
    } catch (err) {
      console.error("Failed to bulk delete messages", err);
      updateMessages(previousMessages);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Could not delete the selected messages.",
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleToggleStar = async (msg: Message) => {
    try {
      const action = msg.isStarred ? "unstar" : "star";
      const res = await fetch(`/api/chats/${encodeURIComponent(chat.id)}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          messageId: msg.id,
          action,
        }),
      });
      const data = (await res.json()) as { message?: Message; error?: string };
      if (!res.ok || !data?.message) {
        throw new Error(data?.error || "Failed to update star");
      }
      replaceMessage(data.message);
    } catch (err) {
      console.error("Failed to toggle star", err);
      toast({
        variant: "destructive",
        title: "Star failed",
        description: "Could not update starred message.",
      });
    }
  };
  
  const handleReact = (messageId: string, emoji: string) => {
    const newMessages = chat.messages.map(m => {
        if (m.id === messageId) {
            const existingReactionIndex = m.reactions?.findIndex(r => r.userId === currentUser.id) ?? -1;
            let newReactions = [...(m.reactions || [])];

            if (existingReactionIndex > -1) {
                if(newReactions[existingReactionIndex].emoji === emoji) {
                    // Un-react if same emoji is clicked again
                    newReactions.splice(existingReactionIndex, 1);
                } else {
                    // Change reaction
                    newReactions[existingReactionIndex].emoji = emoji;
                }
            } else {
                // Add new reaction
                newReactions.push({emoji, userId: currentUser.id, username: currentUser.name });
            }
            return {...m, reactions: newReactions};
        }
        return m;
    });
    updateMessages(newMessages);
    setReactingTo(null);
    setLongPressMessageId(null);
  };

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
    setLongPressMessageId(null);
  };

  const startReplying = (message: Message) => {
    setReplyingTo(message);
    setLongPressMessageId(null);
    inputRef.current?.focus();
  };

  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
      setAttachmentMenuOpen(false); // Close popover
    }
  };
  
  const handleDocFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const files = Array.from(event.target.files);
    event.target.value = "";
    void sendAttachments(files, "");
    setAttachmentMenuOpen(false);
  };


  const handleAttachmentClick = (type: 'media' | 'doc') => {
    if (type === 'media') {
      fileInputRef.current?.click();
    } else if (type === 'doc') {
      docFileInputRef.current?.click();
    }
  };
  
  const handleShowSharedContent = (contentType: 'media' | 'files' | 'links' | 'starred') => {
    setSharedContentType(contentType);
    setView('sharedContent');
  };

  const handleToggleMute = async (nextMuted: boolean) => {
    if (!chat?.id || !currentUser?.id) return;
    const previousMuted = chat.isMuted ?? false;
    setChat((prev) => ({ ...prev, isMuted: nextMuted }));
    onChatInfoUpdate(chat.id, { isMuted: nextMuted });

    try {
      const res = await fetch(`/api/chats/${encodeURIComponent(chat.id)}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, muted: nextMuted }),
      });
      const data = (await res.json()) as { muted?: boolean; error?: string };
      if (!res.ok || typeof data.muted !== "boolean") {
        throw new Error(data?.error || "Failed to update mute settings");
      }
      setChat((prev) => ({ ...prev, isMuted: data.muted }));
      onChatInfoUpdate(chat.id, { isMuted: data.muted });
    } catch (err) {
      console.error("Failed to update mute settings", err);
      setChat((prev) => ({ ...prev, isMuted: previousMuted }));
      onChatInfoUpdate(chat.id, { isMuted: previousMuted });
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update mute notifications.",
      });
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, messageId: string) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    setSwipingMessageId(messageId);
    
    longPressTimer.current = setTimeout(() => {
      setLongPressMessageId(messageId);
    }, 500); // 500ms for a long press
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || swipingMessageId === null) return;
    const touchCurrentX = e.touches[0].clientX;
    const deltaX = touchCurrentX - touchStartX.current;
    
    // Clear long press on any move to prevent both actions
    if (longPressTimer.current) clearTimeout(longPressTimer.current); 
    setSwipeX(deltaX);
  };

  const handleTouchEnd = (msg: Message) => {
    if (!isMobile) return;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    // Left to right swipe for reply
    if (swipeX > SWIPE_THRESHOLD) {
      startReplying(msg);
    } 
    // Right to left swipe for delete
    else if (swipeX < -SWIPE_THRESHOLD) {
      enterSelectionMode(msg.id);
    }

    // Reset swipe state
    setSwipeX(0);
    setSwipingMessageId(null);
    touchStartX.current = 0;
  };
  
  const createSystemMessage = (text: string): Message => ({
    id: `sys-${Date.now()}`,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    senderId: currentUser.id,
    isSystem: true,
  });

  const handleMakeAdmin = (userId: string) => {
    const user = chat.users.find(u => u.id === userId);
    if (!user) return;
    
    const newAdmins = [...(chat.admins || []), userId];
    const systemMessage = createSystemMessage(`You made ${user.name} an admin`);
    
    setChat(prev => ({...prev, admins: newAdmins, messages: [...prev.messages, systemMessage] }));
    onChatInfoUpdate(chat.id, { admins: newAdmins, messages: [...chat.messages, systemMessage] });
  };

  const handleDismissAdmin = (userId: string) => {
    const user = chat.users.find(u => u.id === userId);
    if (!user) return;

    const newAdmins = (chat.admins || []).filter(id => id !== userId);
    const systemMessage = createSystemMessage(`You dismissed ${user.name} as an admin`);

    setChat(prev => ({...prev, admins: newAdmins, messages: [...prev.messages, systemMessage] }));
    onChatInfoUpdate(chat.id, { admins: newAdmins, messages: [...chat.messages, systemMessage] });
  };

  const handleRemoveUser = (userId: string) => {
    const user = chat.users.find(u => u.id === userId);
    if (!user) return;
    
    const newUsers = chat.users.filter(u => u.id !== userId);
    const newAdmins = (chat.admins || []).filter(id => id !== userId);
    const systemMessage = createSystemMessage(`You removed ${user.name}`);
    const nextMessages = [...chat.messages, systemMessage];

    setChat(prev => ({...prev, users: newUsers, admins: newAdmins, messages: [...prev.messages, systemMessage] }));
    onChatInfoUpdate(chat.id, { users: newUsers, admins: newAdmins, messages: nextMessages });
  };

  const handleExitGroupLocal = () => {
    if (!chat.isGroup) return;
    const isAdmin = chat.admins?.includes(currentUser.id);
    const otherUsers = chat.users.filter(u => u.id !== currentUser.id);
    if (isAdmin && (chat.admins?.length ?? 0) <= 1 && otherUsers.length > 0) {
      // Promote first available member before leaving
      const promoteId = otherUsers[0].id;
      const newAdmins = [promoteId];
      setChat(prev => ({ ...prev, admins: newAdmins }));
      onChatInfoUpdate(chat.id, { admins: newAdmins });
    }
    onExitGroup(chat.id);
  };


  const attachmentOptions = [
    { icon: ImageIcon, label: 'Photos & videos', onClick: () => handleAttachmentClick('media') },
    { icon: FileText, label: 'Document', onClick: () => handleAttachmentClick('doc') },
  ];
  

  const isGroup = chat.isGroup;
  const otherUser = !isGroup ? chat.users.find((u) => u.id !== currentUser.id)! : null;
  const chatName = isGroup ? chat.name : otherUser?.name;
  const chatAvatar = isGroup ? chat.groupAvatar : otherUser?.avatar;
  const chatSubtext = isGroup
    ? `${chat.users.length} members`
    : otherUser?.isOnline
      ? "Online"
      : "Offline";


  const isSendable = message.trim().length > 0;
  
  if (view === 'contactInfo' && otherUser) {
      return (
          <ContactInfoPanel
          user={otherUser}
          chat={chat}
          onBack={() => setView('chat')}
          onShowSharedContent={handleShowSharedContent}
          isMuted={chat.isMuted ?? false}
          onToggleMute={handleToggleMute}
        />
      );
  }
  
  if (view === 'groupInfo') {
      return <GroupInfoPanel
                chat={chat}
                currentUser={currentUser}
                onBack={() => setView('chat')}
                onMakeAdmin={handleMakeAdmin}
                onDismissAdmin={handleDismissAdmin}
                onRemoveUser={handleRemoveUser}
                onAddMembers={() => onAddMembers(chat.id)}
                onDeleteGroup={() => onDeleteGroup(chat.id)}
                onExitGroup={handleExitGroupLocal}
            />;
  }
  
  if (view === 'sharedContent') {
    return <SharedContentPanel chat={chat} defaultTab={sharedContentType} onBack={() => setView(isGroup ? 'groupInfo' : 'contactInfo')} />;
  }
  
  if (isMediaPreview) {
    return (
      <MediaPreview
        files={selectedFiles}
        caption={caption}
        onCaptionChange={setCaption}
        onSend={handleSendMedia}
        onClose={() => setSelectedFiles([])}
      />
    );
  }


  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex-shrink-0 flex items-center justify-between p-3 border-b bg-card">
        {selectionMode ? (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={clearSelectionMode}>
                <X className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="font-semibold">{selectedMessageIds.length} selected</h2>
                <div className="text-xs text-muted-foreground">
                  Select normal or deleted-placeholder messages, then remove them together.
                </div>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={selectedMessageIds.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete selected
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <button onClick={() => setView(isGroup ? 'groupInfo' : 'contactInfo')} className="flex items-center gap-3 text-left">
                <div className="relative">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={chatAvatar} alt={chatName} />
                        <AvatarFallback>{chatName?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    {!isGroup && otherUser?.isOnline && (
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-pink-500 ring-2 ring-card" />
                    )}
                </div>
                <div>
                  <h2 className="font-semibold">{chatName}</h2>
                  <div className="text-xs text-muted-foreground">{chatSubtext}</div>
                </div>
              </button>
            </div>
            <div></div>
          </>
        )}
      </header>
      
      <div className="flex-1 overflow-hidden bg-secondary/50">
        <ScrollArea className="h-full" viewportRef={scrollAreaViewport}>
          <div className="p-4 md:p-6 space-y-2">
            {hasMoreMessages && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadOlderMessages}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading..." : "Load older messages"}
                </Button>
              </div>
            )}
            {chat.messages.map((msg) => {
               if (msg.isSystem) {
                 return (
                    <div key={msg.id} className="text-center text-xs text-muted-foreground py-2">
                        <span className="bg-secondary/80 px-2 py-1 rounded-full">{msg.text}</span>
                    </div>
                 );
               }

               const isSender = msg.senderId === currentUser.id;
               const isLongPressMenuOpen = longPressMessageId === msg.id;
               const senderUser = chat.users.find(u => u.id === msg.senderId);
               const isEditing = editingMessageId === msg.id;
               const isSelected = selectedMessageIds.includes(msg.id);
               
               const repliedToMessage = msg.replyToId ? chat.messages.find(m => m.id === msg.replyToId) : null;
               const repliedToUser = repliedToMessage ? chat.users.find(u => u.id === repliedToMessage.senderId) : null;

               const isBeingSwiped = isMobile && swipingMessageId === msg.id;
               
               // Calculate swipe offset for both directions
               const replySwipeOffset = isBeingSwiped && swipeX > 0 ? Math.min(swipeX, SWIPE_THRESHOLD * 1.5) : 0;
               const deleteSwipeOffset = isBeingSwiped && swipeX < 0 ? Math.max(swipeX, -SWIPE_THRESHOLD * 1.5) : 0;
               const totalSwipeOffset = replySwipeOffset + deleteSwipeOffset;

               const replyIconOpacity = isBeingSwiped ? Math.max(0, (swipeX - SWIPE_THRESHOLD / 2) / SWIPE_THRESHOLD) : 0;
               const deleteIconOpacity = isBeingSwiped ? Math.max(0, (-swipeX - SWIPE_THRESHOLD / 2) / SWIPE_THRESHOLD) : 0;
               
               const messageContent = (
                    <div
                        className={cn(
                        'relative p-3 rounded-lg shadow-sm w-fit max-w-md',
                        isSender
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-card text-card-foreground rounded-bl-none',
                        (msg.media || msg.sharedPost || msg.sharedNote || msg.sharedReel || msg.isDeleted || msg.audioUrl) && 'p-2',
                        selectionMode && 'pointer-events-none',
                        selectionMode && isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        )}
                    >
                       {isGroup && !isSender && senderUser && (
                            <p className="text-xs font-semibold mb-1" style={{ color: senderUser.id === 'user2' ? '#3498db' : '#e74c3c' }}>
                                {senderUser.name}
                            </p>
                        )}
                        {repliedToMessage && (
                            <div className="p-2 mb-1.5 rounded-md bg-black/10 text-sm">
                                <p className="font-semibold text-xs">{repliedToUser?.name}</p>
                                <p className="line-clamp-1">{repliedToMessage.text}</p>
                            </div>
                        )}
                        {msg.isDeleted ? (
                            <p className="text-sm italic">This message was deleted</p>
                        ) : isEditing ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleEditMessage(msg.id, editingText); }} className="flex items-center gap-2">
                            <Input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="h-8 bg-white text-foreground border border-white/70"
                              autoFocus
                            />
                                <Button size="sm" type="submit">Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                            </form>
                        ) : msg.sharedPost ? (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold px-1">{isSender ? "You shared a post" : `${senderUser?.name} shared a post`}</p>
                            <PostCard 
                                post={msg.sharedPost}
                                currentUser={currentUser}
                                onLike={() => {}}
                                onCommentClick={() => {}}
                                onShare={() => {}}
                                onDelete={() => {}}
                                isMinimized={true}
                            />
                            <Link href={`/home#post-${msg.sharedPost.id}`} passHref>
                                <Button variant={isSender ? 'secondary': 'default'} size="sm" className="h-8 w-full">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Post
                                </Button>
                            </Link>
                        </div>
                        ) : msg.sharedNote ? (
                        <div className="space-y-3">
                            <p className="text-sm font-semibold px-1">{isSender ? "You shared a note" : `${senderUser?.name} shared a note`}</p>
                            <Card className="rounded-lg">
                            <CardHeader>
                                <CardTitle className="text-base">{msg.sharedNote.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">{msg.sharedNote.description}</p>
                            </CardContent>
                            </Card>
                            <Link href={`/notes#note-${msg.sharedNote.id}`} passHref>
                                <Button variant={isSender ? 'secondary': 'default'} size="sm" className="h-8 w-full rounded-lg">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Note
                                </Button>
                            </Link>
                        </div>
                        ) : msg.sharedReel ? (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold px-1">{isSender ? "You shared a reel" : `${senderUser?.name} shared a reel`}</p>
                                <ReelPreviewCard reel={msg.sharedReel} isSender={isSender} />
                            </div>
                        ) : msg.media ? (
                        <div className="space-y-2 min-w-[12rem]">
                            {(() => {
                                const images = msg.media.filter(m => m.type.startsWith('image/'));
                                const docs = msg.media.filter(m => !m.type.startsWith('image/'));
                                const allMedia = [...images, ...docs];

                                return (
                                <>
                                    {images.length > 0 && (
                                        <div className="grid grid-cols-2 gap-1">
                                            {images.map((mediaItem, index) => (
                                            <button key={index} className="relative aspect-square rounded-md overflow-hidden" onClick={() => setViewingMedia({ media: allMedia, startIndex: index })}>
                                                <Image src={mediaItem.url} alt={mediaItem.type} fill className="object-cover"/>
                                            </button>
                                            ))}
                                        </div>
                                    )}
                                    {docs.length > 0 && (
                                        <div className="space-y-2">
                                            {docs.map((mediaItem, index) => (
                                                <a href={mediaItem.url} download={mediaItem.fileName} key={index} className="flex items-center gap-3 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors">
                                                    <FileText className="h-6 w-6 flex-shrink-0" />
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-sm font-medium truncate">{mediaItem.fileName}</p>
                                                        <p className="text-xs opacity-70">{mediaItem.type}</p>
                                                    </div>
                                                    <Download className="h-5 w-5 opacity-70" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    {msg.text && <p className="text-sm px-1 pt-1">{msg.text}</p>}
                                </>
                                );
                            })()}
                        </div>
                        ) : msg.audioUrl ? (
                          <AudioPlayer src={msg.audioUrl} isSender={isSender} />
                        ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        )}
                        {msg.isStarred && !msg.isDeleted && (
                            <div className="absolute -top-2 -right-2 bg-secondary text-amber-500 p-0.5 rounded-full shadow">
                                <Star className="h-3 w-3 fill-amber-400" />
                            </div>
                        )}
                        {msg.reactions && msg.reactions.length > 0 && !msg.isDeleted && (
                            <div className="absolute -bottom-3 -right-2 flex gap-1">
                                {msg.reactions.map((r, i) => (
                                    <div key={i} className="bg-secondary p-0.5 rounded-full shadow-md text-xs">{r.emoji}</div>
                                ))}
                            </div>
                        )}
                        {selectionMode && isSelected && (
                            <div className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                <Check className="h-3.5 w-3.5" />
                            </div>
                        )}
                    </div>
               );
               
               const dropdownMenu = (
                <DropdownMenuContent align={isSender ? "end" : "start"} onMouseLeave={() => setLongPressMessageId(null)}>
                    <DropdownMenuItem onClick={() => startReplying(msg)}>
                        <Reply className="mr-2 h-4 w-4" />
                        <span>Reply</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStar(msg)}>
                        <Star className="mr-2 h-4 w-4" />
                        <span>{msg.isStarred ? "Unstar" : "Star"}</span>
                    </DropdownMenuItem>
                    <Popover open={reactingTo?.id === msg.id} onOpenChange={(isOpen) => !isOpen && setReactingTo(null)}>
                        <PopoverTrigger asChild>
                            <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                onSelect={(e) => e.preventDefault()}
                                onClick={() => setReactingTo(msg)}
                            >
                                <Smile className="mr-2 h-4 w-4" />
                                <span>React</span>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-1 grid grid-cols-5 gap-1">
                           {emojis.slice(0, 10).map(emoji => (
                               <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-xl p-1 rounded-md hover:bg-secondary">{emoji}</button>
                           ))}
                        </PopoverContent>
                    </Popover>
                    {isSender && msg.text && (
                        <DropdownMenuItem onClick={() => startEditing(msg)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => enterSelectionMode(msg.id)}>
                        <Check className="mr-2 h-4 w-4" />
                        <span>Select messages</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500" onClick={() => setDeletingMessage(msg)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete...</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
               );

               return (
                <div key={msg.id} className="space-y-1 relative">
                    {isMobile && (
                        <>
                         <div
                            className="absolute left-0 h-full flex items-center transition-opacity duration-200"
                            style={{ opacity: replyIconOpacity, transform: `translateX(${Math.min(replySwipeOffset - 40, -10)}px)` }}
                            >
                            <Reply className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div
                            className="absolute right-0 h-full flex items-center transition-opacity duration-200"
                            style={{ opacity: deleteIconOpacity, transform: `translateX(${Math.max(deleteSwipeOffset + 40, 10)}px)` }}
                            >
                            <Trash2 className="h-5 w-5 text-red-500" />
                        </div>
                        </>
                    )}
                    <div
                        className={cn(
                            'group flex items-end max-w-lg gap-2',
                            isSender ? 'ml-auto flex-row-reverse' : 'mr-auto',
                             isBeingSwiped ? 'transition-transform' : 'transition-transform duration-300 ease-out'
                        )}
                        style={{ transform: `translateX(${totalSwipeOffset}px)` }}
                        onTouchStart={(e) => {
                            if (selectionMode) return;
                            handleTouchStart(e, msg.id);
                        }}
                        onTouchMove={(e) => {
                            if (selectionMode) return;
                            handleTouchMove(e);
                        }}
                        onTouchEnd={() => {
                            if (selectionMode) return;
                            handleTouchEnd(msg);
                        }}
                        onContextMenu={(e) => {
                            if (selectionMode) {
                                e.preventDefault();
                                return;
                            }
                            if (isMobile) {
                                e.preventDefault();
                                setLongPressMessageId(msg.id);
                            }
                        }}
                        onClick={() => {
                            if (selectionMode) {
                                toggleMessageSelection(msg.id);
                            }
                        }}
                    >
                        {isMobile && !selectionMode ? (
                            <DropdownMenu open={isLongPressMenuOpen} onOpenChange={(isOpen) => !isOpen && setLongPressMessageId(null)}>
                                <DropdownMenuTrigger asChild>
                                    {messageContent}
                                </DropdownMenuTrigger>
                                {dropdownMenu}
                            </DropdownMenu>
                        ) : isMobile ? (
                            messageContent
                        ) : (
                            <>
                            {!selectionMode && (
                            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <Smile className="h-4 w-4" />
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-1 grid grid-cols-5 gap-1">
                                    {emojis.slice(0, 10).map(emoji => (
                                        <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-xl p-1 rounded-md hover:bg-secondary">{emoji}</button>
                                    ))}
                                    </PopoverContent>
                                </Popover>
                            </div>
                            )}
                            {messageContent}
                            {!selectionMode && (
                            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    {dropdownMenu}
                                </DropdownMenu>
                            </div>
                            )}
                            </>
                        )}
                    
                    <p className={cn("text-xs text-muted-foreground self-end", selectionMode ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity")}>
                        {msg.timestamp}
                    </p>
                    </div>
                </div>
              )})}
          </div>
        </ScrollArea>
      </div>

      <footer className="flex-shrink-0 p-3 border-t bg-card space-y-2">
        {isStudentOnly1to1 && (
          <div className="p-3 bg-secondary rounded-lg text-sm text-muted-foreground">
            Student-to-student messaging is disabled. Please contact a teacher.
          </div>
        )}
         {canSend && replyingTo && (
             <div className="p-2 bg-secondary rounded-lg text-sm flex justify-between items-center">
                 <div>
                    <p className="font-semibold text-primary">Replying to {chat.users.find(u => u.id === replyingTo.senderId)?.name}</p>
                    <p className="text-muted-foreground line-clamp-1">{replyingTo.text}</p>
                 </div>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReplyingTo(null)}><X className="h-4 w-4"/></Button>
             </div>
         )}
        {canSend && (
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
        />
            <input
            type="file"
            ref={docFileInputRef}
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            className="hidden"
            onChange={handleDocFileSelect}
        />
        <Popover open={isAttachmentMenuOpen} onOpenChange={setAttachmentMenuOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="transition-transform duration-300 data-[state=open]:-rotate-45">
                {isAttachmentMenuOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 mb-2" side="top" align="start">
                <div className="flex flex-col gap-1">
                {attachmentOptions.map(option => (
                    <Button key={option.label} variant="ghost" className="justify-start" onClick={option.onClick}>
                    <option.icon className="mr-2 h-5 w-5" />
                    {option.label}
                    </Button>
                ))}
                </div>
            </PopoverContent>
        </Popover>

        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon">
                    <Smile className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid grid-cols-8 gap-2">
                    {emojis.map(emoji => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => handleAddEmoji(emoji)}
                            className="text-2xl hover:bg-secondary rounded-md p-1 transition-colors"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
        <div className="flex-1 animated-border-input">
            <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
            />
        </div>
        <Button type="submit" variant="glow" size="icon" className="p-2.5 text-base" disabled={!isSendable}>
            <Send className="h-5 w-5" />
        </Button>
        </form>
        )}
      </footer>
      
      {viewingMedia && (
            <MediaViewer 
                media={viewingMedia.media} 
                startIndex={viewingMedia.startIndex} 
                onClose={() => setViewingMedia(null)} 
            />
        )}


        {deletingMessage && (
            <AlertDialog open={!!deletingMessage} onOpenChange={(isOpen) => !isOpen && setDeletingMessage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDeleteMessage(deletingMessage.id, 'me')}
                            className="border border-input bg-background text-foreground hover:bg-secondary hover:text-foreground"
                        >
                            Delete for me
                        </AlertDialogAction>
                        {canDeleteForEveryone(deletingMessage) && (
                            <AlertDialogAction
                                onClick={() => handleDeleteMessage(deletingMessage.id, 'everyone')}
                                className={cn(buttonVariants({ variant: "glow" }))}
                            >
                                Delete for everyone
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}

        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete selected messages?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {selectedMessageIds.length === 1
                            ? "This will remove the selected message from your chat view."
                            : `This will remove ${selectedMessageIds.length} selected messages from your chat view in one step.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={bulkDeleteLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleBulkDeleteForMe}
                        disabled={bulkDeleteLoading || selectedMessageIds.length === 0}
                        className="border border-input bg-background text-foreground hover:bg-secondary hover:text-foreground"
                    >
                        {bulkDeleteLoading ? "Deleting..." : "Delete for me"}
                    </AlertDialogAction>
                    {canDeleteSelectionForEveryone && (
                        <AlertDialogAction
                            onClick={async () => {
                                if (selectedMessages.length === 0) return;

                                const previousMessages = chat.messages;
                                const optimistic = chat.messages.map((msg) =>
                                  selectedMessageIds.includes(msg.id)
                                    ? {
                                        ...msg,
                                        text: '',
                                        media: undefined,
                                        sharedPost: undefined,
                                        sharedNote: undefined,
                                        sharedReel: undefined,
                                        audioUrl: undefined,
                                        isDeleted: true,
                                      }
                                    : msg
                                );

                                updateMessages(optimistic);
                                setBulkDeleteLoading(true);

                                try {
                                  await Promise.all(
                                    selectedMessages.map(async (message) => {
                                      const res = await fetch(
                                        `/api/chats/${encodeURIComponent(chat.id)}/messages?messageId=${encodeURIComponent(message.id)}&userId=${encodeURIComponent(currentUser.id)}`,
                                        { method: "DELETE" }
                                      );
                                      const data = (await res.json()) as { message?: Message; error?: string };
                                      if (!res.ok || !data?.message) {
                                        throw new Error(data?.error || "Failed to delete selected messages for everyone");
                                      }
                                    })
                                  );

                                  toast({
                                    title: "Messages deleted for everyone",
                                    description: `${selectedMessages.length} message${selectedMessages.length === 1 ? "" : "s"} deleted for everyone in this chat.`,
                                  });
                                  clearSelectionMode();
                                } catch (err) {
                                  console.error("Failed to delete selected messages for everyone", err);
                                  updateMessages(previousMessages);
                                  toast({
                                    variant: "destructive",
                                    title: "Delete failed",
                                    description: "Could not delete the selected messages for everyone.",
                                  });
                                } finally {
                                  setBulkDeleteLoading(false);
                                }
                            }}
                            disabled={bulkDeleteLoading}
                            className={cn(buttonVariants({ variant: "glow" }))}
                        >
                            Delete for everyone
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

function AudioPlayer({ src, isSender, isPreview = false }: { src: string; isSender: boolean; isPreview?: boolean; }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const setAudioTime = () => {
        if (audio.duration > 0) {
            setProgress((audio.currentTime / audio.duration) * 100);
            setCurrentTime(audio.currentTime);
        }
    };
    const setAudioEnd = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', setAudioEnd);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', setAudioEnd);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = (Number(event.target.value) / 100) * duration;
    }
  };


  return (
    <div className="flex items-center gap-3 w-full p-2 min-w-64">
      <audio ref={audioRef} src={src} className="hidden" preload="metadata" />
      <Button onClick={togglePlay} size="icon" variant="ghost" className={cn("rounded-full h-10 w-10 flex-shrink-0", isSender ? "text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" : "text-primary", isPreview && "text-primary hover:bg-primary/10")}>
        {isPlaying ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>
      <div className="flex-1 flex flex-col gap-1">
        <Slider
            value={[progress]}
            onValueChange={(value) => {
                 const audio = audioRef.current;
                 if (audio) {
                    audio.currentTime = (value[0] / 100) * duration;
                 }
            }}
            className={cn(
                "h-1.5 [&>span]:bg-transparent [&_[role=slider]]:h-3 [&_[role=slider]]:w-3",
                isSender ? "[&>div]:bg-white/30 [&_[role=slider]]:bg-white" : "[&>div]:bg-primary/30 [&_[role=slider]]:bg-primary",
                 isPreview && "[&>div]:bg-primary/30 [&_[role=slider]]:bg-primary"
            )}
        />
        <div className={cn("flex justify-between text-xs", isPreview && "text-muted-foreground")}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}


function WelcomePanel() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8">
      <div className="p-8 border-4 border-dashed border-muted rounded-2xl">
        <GraduationCap className="h-20 w-20 text-muted-foreground mx-auto" />
        <h1 className="mt-6 text-3xl font-semibold text-muted-foreground">CampusConnect Chat</h1>
        <p className="mt-2 text-md text-muted-foreground">
          Select a conversation from the list to start messaging.
        </p>
      </div>
    </div>
  );
}

type ChatView = 'list' | 'chat' | 'create-group-select' | 'create-group-finalize';

function CreateGroupSelectMembers({
  availableUsers,
  onNext,
  onBack,
}: {
  availableUsers: User[];
  onNext: (selected: User[]) => void;
  onBack: () => void;
}) {
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const toggleUser = (user: User) => {
        setSelectedUsers(prev => 
            prev.find(u => u.id === user.id) 
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        );
    };

    const filteredUsers = availableUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return (
        <div className="flex flex-col h-full w-full bg-card">
            <header className="flex-shrink-0 flex items-center gap-4 p-3 border-b">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h2 className="text-lg font-semibold">New Group</h2>
                    <p className="text-sm text-muted-foreground">Select members</p>
                </div>
            </header>
            <div className="p-3 border-b">
                 <div className="relative w-full animated-border-input">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">No users available to add.</div>
                ) : (
                  filteredUsers.map(user => (
                      <div key={user.id} onClick={() => toggleUser(user)} className="flex items-center gap-4 p-3 hover:bg-secondary cursor-pointer border-b">
                          <Checkbox checked={selectedUsers.some(u => u.id === user.id)} />
                          <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.name.substring(0,2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.role}</p>
                          </div>
                      </div>
                  ))
                )}
            </ScrollArea>
             <footer className="p-3 border-t">
                <Button className="w-full" variant="glow" disabled={selectedUsers.length === 0} onClick={() => onNext(selectedUsers)}>
                   <ArrowLeft className="h-5 w-5 mr-2 transform rotate-180" />
                   Continue ({selectedUsers.length})
                </Button>
            </footer>
        </div>
    );
}

function CreateGroupFinalize({ members, onBack, onCreate }: { members: User[], onBack: () => void, onCreate: (name: string, avatar: string) => void }) {
    const [groupName, setGroupName] = useState('');
    
    // For now, we'll use a random picsum photo for the group avatar
    const groupAvatar = `https://picsum.photos/seed/group-${Date.now()}/128/128`;

    return (
        <div className="flex flex-col h-full w-full bg-card">
             <header className="flex-shrink-0 flex items-center gap-4 p-3 border-b">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h2 className="text-lg font-semibold">New Group</h2>
                    <p className="text-sm text-muted-foreground">Final step</p>
                </div>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                 <Avatar className="h-24 w-24">
                    <AvatarImage src={groupAvatar} alt="Group Avatar" />
                    <AvatarFallback>{groupName.substring(0, 2) || 'G'}</AvatarFallback>
                </Avatar>
                <div className="w-full max-w-sm animated-border-input">
                    <Input 
                        placeholder="Group Name" 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                </div>
                <p className="text-sm text-muted-foreground">Members: {members.length + 1}</p>
            </div>
             <footer className="p-3 border-t">
                <Button className="w-full" variant="glow" disabled={!groupName.trim()} onClick={() => onCreate(groupName, groupAvatar)}>
                   <Check className="h-5 w-5 mr-2" />
                   Create Group
                </Button>
            </footer>
        </div>
    );
}


function ChatPageContent() {
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get('id');
  const userIdFromUrl = searchParams.get('userId');
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const { chats, setChats, currentUser } = useMainLayout();
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupStep, setGroupStep] = useState<'select' | 'details'>('select');
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<User[]>([]);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupIconEmoji, setGroupIconEmoji] = useState('👥');
  const [groupIconColor, setGroupIconColor] = useState(avatarPalette[0]);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [disappearingSetting, setDisappearingSetting] = useState<'off' | '24h' | '7d' | '90d'>('off');
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  
  const [view, setView] = useState<ChatView>('list');
  const [newGroupMembers, setNewGroupMembers] = useState<User[]>([]);
  const [addingMembersForChatId, setAddingMembersForChatId] = useState<string | null>(null);
  const creatingChatRef = useRef<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  const mapDirectoryUser = (user: {
    id: string;
    username: string;
    email: string;
    role: string;
    bio: string;
    avatarUrl: string;
  }): User => ({
    id: user.id,
    name: user.username,
    avatar: user.avatarUrl || "https://picsum.photos/seed/user-avatar/128/128",
    email: user.email ?? "",
    role: user.role,
    department: "-",
    bio: user.bio ?? "",
  });

  const isStudent = (role?: string) => role?.toLowerCase() === "student";
  const groupAvatarPreview = useMemo(
    () => buildEmojiAvatar(groupIconEmoji, groupIconColor),
    [groupIconEmoji, groupIconColor]
  );

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const resetGroupBuilder = () => {
    setGroupStep('select');
    setGroupSearch('');
    setSelectedGroupUsers([]);
    setGroupNameInput('');
    setGroupIconEmoji('👥');
    setGroupIconColor(avatarPalette[0]);
    setDisappearingSetting('off');
    setIsSavingGroup(false);
  };

  const toggleGroupUser = (user: User) => {
    setSelectedGroupUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const shuffleIconColor = () => {
    const next = avatarPalette[(avatarPalette.indexOf(groupIconColor) + 1) % avatarPalette.length];
    setGroupIconColor(next);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 1500); // Simulate network delay
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const loadUsers = async () => {
      try {
        const res = await fetch(`/api/users?excludeId=${encodeURIComponent(currentUser.id)}`);
        const data = (await res.json()) as { users?: Array<{ id: string; username: string; email: string; role: string; bio: string; avatarUrl: string }> };
        if (!res.ok || !data?.users) return;
        const mapped = data.users.map(mapDirectoryUser);
    const allowed = isStudent(currentUser.role)
          ? mapped.filter((u) => !isStudent(u.role))
          : mapped;
        setDirectoryUsers(allowed);
      } catch (err) {
        console.error("Failed to load directory users", err);
      }
    };

    void loadUsers();
  }, [currentUser?.id]);

  useEffect(() => {
    // If chatId is provided, just open that chat.
    if (chatIdFromUrl) {
      const chatMatch = chats.find(c => c.id === chatIdFromUrl);

      if (chatMatch) {
        if (activeChatId !== chatIdFromUrl) {
          setActiveChatId(chatIdFromUrl);
        }
        if (view !== 'chat') {
          setView('chat'); // Go to chat view when a chat is selected via URL
        }
      }
      return;
    }

    // If a userId is provided, open or create a 1:1 chat for that user.
    if (userIdFromUrl) {
      const existingChat = chats.find(c =>
        !c.isGroup &&
        c.users.some(u => u.id === currentUser.id) &&
        c.users.some(u => u.id === userIdFromUrl)
      );

      if (existingChat) {
        if (activeChatId !== existingChat.id) {
          setActiveChatId(existingChat.id);
        }
        if (view !== 'chat') {
          setView('chat');
        }
        if (typeof window !== 'undefined' && window.location.search !== `?id=${existingChat.id}`) {
          window.history.replaceState({ chatId: existingChat.id }, '', `/chat?id=${existingChat.id}`);
        }
        return;
      }

      if (creatingChatRef.current === userIdFromUrl) return;
      creatingChatRef.current = userIdFromUrl;

      const createChat = async () => {
        try {
          const res = await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUser.id,
              otherUserId: userIdFromUrl,
            }),
          });
      const data = (await res.json()) as { chat?: Chat; error?: string };
      if (!res.ok || !data?.chat) {
        toast({
          variant: "destructive",
          title: "Cannot start chat",
          description: data?.error || "Chat not allowed.",
        });
        return;
      }

          setChats((prev) => {
            const existingIndex = prev.findIndex((c) => c.id === data.chat!.id);
            if (existingIndex === -1) return [data.chat!, ...prev];
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...data.chat! };
            return updated;
          });

          setActiveChatId(data.chat.id);
          setView("chat");
          if (typeof window !== "undefined") {
            window.history.replaceState({ chatId: data.chat.id }, "", `/chat?id=${data.chat.id}`);
          }
        } catch (err) {
          console.error("Failed to create chat from userId", err);
          toast({
            variant: "destructive",
            title: "Chat unavailable",
            description: "Could not open that conversation.",
          });
        } finally {
          creatingChatRef.current = null;
        }
      };

      void createChat();
      return;
    }

    // If no chat ID in URL, clear the active chat
    if (activeChatId !== null) {
      setActiveChatId(null);
    }
    if (view !== 'list') {
      setView('list'); // Go to list view
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatIdFromUrl, userIdFromUrl, chats, currentUser.id, activeChatId, view]);

  useEffect(() => {
    if (!activeChatId) return;
    setChats((prev) => {
      const chat = prev.find((c) => c.id === activeChatId);
      if (!chat || chat.unreadCount === 0) return prev;
      return prev.map((c) =>
        c.id === activeChatId ? { ...c, unreadCount: 0 } : c
      );
    });
  }, [activeChatId, setChats]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const source = new EventSource(`/api/realtime/stream?userId=${encodeURIComponent(currentUser.id)}`);

    const safeParse = (event: MessageEvent<string>) => {
      try {
        return JSON.parse(event.data);
      } catch (err) {
        console.error("Failed to parse realtime payload", err);
        return null;
      }
    };

    const upsertChat = (incomingChat: Chat, incomingMessage?: Message) => {
      setChats((prev) => {
        const existingIndex = prev.findIndex((chat) => chat.id === incomingChat.id);
        const isActive = activeChatIdRef.current === incomingChat.id;

        if (existingIndex === -1) {
          const createdChat: Chat = {
            ...incomingChat,
            messages: incomingMessage ? [incomingMessage] : incomingChat.messages ?? [],
            unreadCount: isActive ? 0 : incomingMessage ? 1 : 0,
          };
          return [createdChat, ...prev];
        }

        const existing = prev[existingIndex];
        const alreadyHasMessage = incomingMessage
          ? existing.messages.some((message) => message.id === incomingMessage.id)
          : false;

        const mergedMessages = incomingMessage
          ? isActive
            ? alreadyHasMessage
              ? existing.messages.map((message) =>
                  message.id === incomingMessage.id ? { ...message, ...incomingMessage } : message
                )
              : [...existing.messages, incomingMessage]
            : alreadyHasMessage
              ? existing.messages.map((message) =>
                  message.id === incomingMessage.id ? { ...message, ...incomingMessage } : message
                )
              : [incomingMessage]
          : existing.messages;

        const updatedChat: Chat = {
          ...existing,
          ...incomingChat,
          users: incomingChat.users?.length ? incomingChat.users : existing.users,
          admins: incomingChat.admins ?? existing.admins,
          name: incomingChat.name ?? existing.name,
          groupAvatar: incomingChat.groupAvatar ?? existing.groupAvatar,
          messages: mergedMessages,
          unreadCount: isActive
            ? 0
            : existing.unreadCount + (incomingMessage && !alreadyHasMessage ? 1 : 0),
        };

        const next = prev.filter((chat) => chat.id !== incomingChat.id);
        return [updatedChat, ...next];
      });
    };

    const handleChatMessage = (rawEvent: Event) => {
      const event = rawEvent as MessageEvent<string>;
      const payload = safeParse(event) as { chat?: Chat; message?: Message } | null;
      if (!payload?.chat) return;
      upsertChat(payload.chat, payload.message);
    };

    const handleChatUpsert = (rawEvent: Event) => {
      const event = rawEvent as MessageEvent<string>;
      const payload = safeParse(event) as { chat?: Chat } | null;
      if (!payload?.chat) return;
      upsertChat(payload.chat);
    };

    const handleMessageUpdated = (rawEvent: Event) => {
      const event = rawEvent as MessageEvent<string>;
      const payload = safeParse(event) as { chatId?: string; message?: Message } | null;
      if (!payload?.chatId || !payload?.message) return;

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== payload.chatId) return chat;
          const hasMessage = chat.messages.some((message) => message.id === payload.message!.id);
          if (!hasMessage) return chat;
          return {
            ...chat,
            messages: chat.messages.map((message) =>
              message.id === payload.message!.id ? { ...message, ...payload.message } : message
            ),
          };
        })
      );
    };

    const handlePresence = (rawEvent: Event) => {
      const event = rawEvent as MessageEvent<string>;
      const payload = safeParse(event) as { userId?: string; isOnline?: boolean } | null;
      if (!payload?.userId || typeof payload.isOnline !== "boolean") return;

      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          users: chat.users.map((user) =>
            user.id === payload.userId ? { ...user, isOnline: payload.isOnline } : user
          ),
        }))
      );

      setDirectoryUsers((prev) =>
        prev.map((user) =>
          user.id === payload.userId ? { ...user, isOnline: payload.isOnline } : user
        )
      );
    };

    source.addEventListener('chat-message', handleChatMessage);
    source.addEventListener('chat-upsert', handleChatUpsert);
    source.addEventListener('chat-message-updated', handleMessageUpdated);
    source.addEventListener('presence', handlePresence);

    source.onerror = () => {
      // EventSource auto-reconnects; keep this silent unless debugging is needed.
    };

    return () => {
      source.removeEventListener('chat-message', handleChatMessage);
      source.removeEventListener('chat-upsert', handleChatUpsert);
      source.removeEventListener('chat-message-updated', handleMessageUpdated);
      source.removeEventListener('presence', handlePresence);
      source.close();
    };
  }, [currentUser?.id, setChats]);



  useEffect(() => {
    if (typeof window !== 'undefined') {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const handlePopState = (e: PopStateEvent) => {
             const newChatId = e.state?.chatId || null;
             const chatExists = chats.some(c => c.id === newChatId);
             if (chatExists) {
                 setActiveChatId(newChatId);
                 setView('chat');
             } else {
                 setActiveChatId(null);
                 setView('list');
             }
        };

        window.addEventListener('popstate', handlePopState);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('popstate', handlePopState);
        };
    }
  }, [activeChatId, chats]);

  const handleSelectChat = (chatId: string) => {
    const chatExists = chats.some(c => c.id === chatId);
    if (!chatExists) return;

    setActiveChatId(chatId);
    setView('chat');
    setChats(prev =>
      prev.map(c => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
    
    const url = `/chat?id=${chatId}`;
    if (window.location.pathname !== '/chat' || window.location.search !== `?id=${chatId}`) {
        window.history.pushState({ chatId }, '', url);
    }
  };

  const handleMessageUpdate = (chatId: string, messages: Message[]) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, messages } : chat
      )
    );
  };
  
  const handleChatInfoUpdate = (chatId: string, updatedInfo: Partial<Chat>) => {
     setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, ...updatedInfo } : chat
      )
    );
  };
  
  const handleBack = () => {
    window.history.back();
  };

  const handleCreateGroup = () => {
    resetGroupBuilder();
    setIsCreateGroupOpen(true);
    setView('list');
    setActiveChatId(null); // Deselect active chat when creating a group
    if (typeof window !== 'undefined') {
      window.history.pushState({ chatId: null }, '', '/chat');
    }
  };

  const handleMembersSelected = (members: User[]) => {
      setNewGroupMembers(members);
      setView('create-group-finalize');
  };
  
  const handleFinalizeGroup = async (name: string, avatar: string, membersOverride?: User[]): Promise<boolean> => {
    const membersToUse = membersOverride ?? newGroupMembers;
    if (!membersToUse.length) {
      toast({
        variant: "destructive",
        title: "Pick members first",
        description: "Add at least one member to create a group.",
      });
      return false;
    }

    try {
      if (addingMembersForChatId) {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== addingMembersForChatId) return c;
            const existingIds = new Set(c.users.map((u) => u.id));
            const toAdd = membersToUse.filter((m) => !existingIds.has(m.id));
            return { ...c, users: [...c.users, ...toAdd] };
          })
        );
        setActiveChatId(addingMembersForChatId);
        setView('chat');
        setAddingMembersForChatId(null);
        toast({ title: "Members added", description: "New members can now chat in the group." });
        return true;
      }

      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          memberIds: membersToUse.map((member) => member.id),
          name,
          groupAvatar: avatar,
        }),
      });
      const data = (await res.json()) as { chat?: Chat; error?: string };
      if (!res.ok || !data?.chat) {
        throw new Error(data?.error || "Failed to create group");
      }

      setChats((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === data.chat!.id);
        if (existingIndex === -1) return [data.chat!, ...prev];
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...data.chat! };
        return updated;
      });
      handleSelectChat(data.chat.id);
      return true;
    } catch (err) {
      console.error("Failed to create group chat", err);
      toast({
        variant: "destructive",
        title: "Group creation failed",
        description: "Please try again.",
      });
      return false;
    }
  };

  const handleDeleteGroup = async (chatId: string) => {
    setIsDeletingGroup(true);
    try {
      const res = await fetch(`/api/chats?id=${encodeURIComponent(chatId)}&userId=${encodeURIComponent(currentUser.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete group");
      }
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setView('list');
        if (typeof window !== 'undefined') {
          window.history.pushState({ chatId: null }, '', '/chat');
        }
      }
      toast({ title: "Group deleted" });
    } catch (err) {
      console.error("Delete group failed", err);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const existingMemberIds = useMemo(() => {
    const chat = chats.find((c) => c.id === addingMembersForChatId);
    return new Set(chat ? chat.users.map((u) => u.id) : []);
  }, [addingMembersForChatId, chats]);

  const filteredSelectableUsers = useMemo(() => {
    const term = groupSearch.trim().toLowerCase();
    return directoryUsers
      .filter((u) => !existingMemberIds.has(u.id))
      .filter((u) =>
        !term ? true : u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
      );
  }, [directoryUsers, groupSearch, existingMemberIds]);

  const closeGroupDialog = () => {
    resetGroupBuilder();
    setIsCreateGroupOpen(false);
  };

  const goToGroupDetails = () => {
    if (!selectedGroupUsers.length) return;
    setNewGroupMembers(selectedGroupUsers);
    setGroupStep('details');
  };

  const handleCreateGroupFromDialog = async () => {
    if (!groupNameInput.trim()) return;
    setIsSavingGroup(true);
    setNewGroupMembers(selectedGroupUsers);
    const ok = await handleFinalizeGroup(groupNameInput.trim(), groupAvatarPreview, selectedGroupUsers);
    setIsSavingGroup(false);
    if (ok) {
      closeGroupDialog();
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId);
  
  const showChatList = !isMobile || (view === 'list' && !activeChat);
  const showChatWindow = (isMobile && activeChat && view === 'chat') || (!isMobile && activeChat);
  const showWelcome = !isMobile && !activeChat && view === 'list';
  const showCreateGroupSelect = view === 'create-group-select';
  const showCreateGroupFinalize = view === 'create-group-finalize';
  const canCreateGroup = !isStudent(currentUser.role);

  return (
    <div className="flex h-full w-full bg-secondary/30">
      {showChatList && (
        <div className="h-full w-full md:w-auto flex-shrink-0">
          <ChatListPanel
            chats={chats}
            activeChatId={activeChatId}
            onChatSelect={handleSelectChat}
            currentUser={currentUser}
            onCreateGroup={canCreateGroup ? handleCreateGroup : undefined}
            isLoading={isLoading}
          />
        </div>
      )}
      <main className={cn("flex-1 h-full", !showChatList && "w-full", isMobile ? ((view === 'chat' && activeChat) || view !== 'list' ? 'flex' : 'hidden') : 'flex')}>
        {showChatWindow && activeChat ? (
          <ChatWindowPanel
            chat={activeChat}
            onMessageUpdate={handleMessageUpdate}
            onChatInfoUpdate={handleChatInfoUpdate}
            onAddMembers={(chatId) => {
              setAddingMembersForChatId(chatId);
              resetGroupBuilder();
              setIsCreateGroupOpen(true);
              setGroupStep('select');
            }}
            onDeleteGroup={handleDeleteGroup}
            onExitGroup={(chatId) => {
              setChats((prev) => {
                const updated: Chat[] = [];
                for (const c of prev) {
                  if (c.id !== chatId) {
                    updated.push(c);
                    continue;
                  }
                  const remainingUsers = c.users.filter((u) => u.id !== currentUser.id);
                  if (remainingUsers.length === 0) {
                    // drop chat entirely
                    continue;
                  }
                  let newAdmins = (c.admins || []).filter((id) => id !== currentUser.id);
                  if (newAdmins.length === 0 && remainingUsers.length > 0) {
                    newAdmins = [remainingUsers[0].id];
                  }
                  updated.push({ ...c, users: remainingUsers, admins: newAdmins });
                }
                return updated;
              });
              if (activeChatId === chatId) {
                setActiveChatId(null);
                setView('list');
                if (typeof window !== 'undefined') {
                  window.history.pushState({ chatId: null }, '', '/chat');
                }
              }
            }}
            currentUser={currentUser}
            onBack={handleBack}
            isMobile={isMobile}
          />
        ) : showCreateGroupSelect ? (
          <CreateGroupSelectMembers
              availableUsers={directoryUsers}
              onNext={handleMembersSelected}
              onBack={() => setView('list')}
          />
        ) : showCreateGroupFinalize ? (
          <CreateGroupFinalize 
              members={newGroupMembers}
              onBack={() => setView('create-group-select')}
              onCreate={handleFinalizeGroup}
          />
      ) : showWelcome ? (
        <WelcomePanel />
      ) : null}
    </main>

      <Dialog open={isCreateGroupOpen} onOpenChange={(open) => (open ? setIsCreateGroupOpen(true) : closeGroupDialog())}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>New Group</DialogTitle>
            <DialogDescription>
              Pick accounts (no phone numbers) and set up the group just like WhatsApp.
            </DialogDescription>
          </DialogHeader>

          {groupStep === 'select' ? (
            <div className="space-y-3">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Search accounts by name or email"
                  className="pl-8"
                />
              </div>

              {selectedGroupUsers.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {selectedGroupUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => toggleGroupUser(user)}
                      className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm hover:bg-secondary/70 transition"
                    >
                      <span className="font-semibold">{user.name}</span>
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-lg border">
                <ScrollArea className="max-h-[360px]">
                  {filteredSelectableUsers.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">No accounts found.</p>
                  ) : (
                    filteredSelectableUsers.map((user) => {
                      const isChecked = selectedGroupUsers.some((u) => u.id === user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => toggleGroupUser(user)}
                          className="flex items-center gap-3 p-3 hover:bg-secondary cursor-pointer transition-colors border-b last:border-b-0"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleGroupUser(user)}
                            className="pointer-events-none"
                          />
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold leading-tight truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-[200px,1fr] items-start">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-24 w-24 border-2 border-primary/30 shadow-lg">
                  <AvatarImage src={groupAvatarPreview} alt="Group avatar" />
                  <AvatarFallback>{groupNameInput.substring(0, 2) || 'G'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap justify-center gap-2">
                  {['👥', '🎓', '📚', '✨', '💬'].map((emojiChoice) => (
                    <Button
                      key={emojiChoice}
                      size="sm"
                      variant={groupIconEmoji === emojiChoice ? "glow" : "outline"}
                      onClick={() => setGroupIconEmoji(emojiChoice)}
                    >
                      {emojiChoice}
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" onClick={shuffleIconColor}>
                    Shuffle color
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="group-name">Group subject</Label>
                  <Input
                    id="group-name"
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value.slice(0, 25))}
                    placeholder="e.g., NSS Volunteers"
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {groupNameInput.length}/25
                  </div>
                </div>

                <div>
                  <Label>Disappearing messages</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(['off', '24h', '7d', '90d'] as const).map((opt) => (
                      <Button
                        key={opt}
                        size="sm"
                        type="button"
                        variant={disappearingSetting === opt ? "glow" : "outline"}
                        onClick={() => setDisappearingSetting(opt)}
                      >
                        {opt === 'off' ? 'Off' : opt.replace('h', ' hrs').replace('d', ' days')}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Timer is stored client-side for now; backend retention can be wired later.
                  </p>
                </div>

                <div>
                  <Label>Members ({selectedGroupUsers.length + 1})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                      <span className="font-semibold">{currentUser.name}</span>
                      <span className="text-xs text-muted-foreground">(you)</span>
                    </span>
                    {selectedGroupUsers.map((user) => (
                      <span key={user.id} className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{user.name}</span>
                        <button className="text-muted-foreground hover:text-foreground" onClick={() => toggleGroupUser(user)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            {groupStep === 'details' ? (
              <>
                <Button variant="ghost" type="button" onClick={() => setGroupStep('select')}>
                  Back
                </Button>
                <Button
                  variant="glow"
                  disabled={isSavingGroup || !groupNameInput.trim()}
                  onClick={handleCreateGroupFromDialog}
                >
                  {isSavingGroup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Group
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" type="button" onClick={closeGroupDialog}>
                  Cancel
                </Button>
                <Button variant="glow" disabled={selectedGroupUsers.length === 0} onClick={goToGroupDetails}>
                  Next ({selectedGroupUsers.length})
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main Page Component
export default function ChatPage() {
    return (
        <React.Suspense fallback={<div className="flex h-full w-full items-center justify-center"><div>Loading Chat...</div></div>}>
            <ChatPageContent />
        </React.Suspense>
    );
}

    

    

    

    
