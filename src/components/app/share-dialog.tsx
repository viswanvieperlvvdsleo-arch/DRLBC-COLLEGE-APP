
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Chat, User } from '@/lib/mock-data';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Make content type more generic
type ShareableContent = { [key: string]: any };

interface ShareDialogProps<T extends ShareableContent> {
  content: T;
  chats: Chat[];
  currentUser: User;
  onClose: () => void;
  onSend: (content: T, selectedChatIds: string[]) => void;
  dialogTitle: string;
  dialogDescription: string;
}

export default function ShareDialog<T extends ShareableContent>({
  content,
  chats,
  currentUser,
  onClose,
  onSend,
  dialogTitle,
  dialogDescription,
}: ShareDialogProps<T>) {
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectChat = (chatId: string) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleSend = () => {
    if (selectedChatIds.length > 0) {
      onSend(content, selectedChatIds);
    }
  };

  const filteredChats = chats.filter((chat) => {
    if (chat.isGroup) {
      return chat.name?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    const otherUser = chat.users.find((u) => u.id !== currentUser.id);
    return otherUser && otherUser.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
            <div className="relative animated-border-input">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                <Input
                    placeholder="Search contacts or groups..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ScrollArea className="h-64">
                <div className="space-y-4">
                {filteredChats.map((chat) => {
                    const isGroup = chat.isGroup;
                    const chatName = isGroup ? chat.name : chat.users.find(u => u.id !== currentUser.id)?.name;
                    const chatAvatar = isGroup ? chat.groupAvatar : chat.users.find(u => u.id !== currentUser.id)?.avatar;
                    const isSelected = selectedChatIds.includes(chat.id);
                    return (
                    <div
                        key={chat.id}
                        className={cn(
                            "flex items-center space-x-3 rounded-md p-2 transition-colors cursor-pointer",
                            isSelected ? "bg-secondary" : "hover:bg-secondary/50"
                        )}
                        onClick={() => handleSelectChat(chat.id)}
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                              id={`chat-${chat.id}`}
                              checked={isSelected}
                              onCheckedChange={() => handleSelectChat(chat.id)}
                          />
                        </div>
                        <Label
                            htmlFor={`chat-${chat.id}`}
                            className="flex items-center gap-3 cursor-pointer w-full"
                        >
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={chatAvatar} alt={chatName} />
                                <AvatarFallback>{chatName?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span>{chatName}</span>
                        </Label>
                    </div>
                    );
                })}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSend} disabled={selectedChatIds.length === 0} variant="glow">
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
