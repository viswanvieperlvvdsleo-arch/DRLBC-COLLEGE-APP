
"use client";

import { Bell, MessageSquare, Newspaper, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppNotification } from '@/lib/mock-data';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { useMainLayout } from '@/app/(main)/layout';
import { Separator } from '../ui/separator';

export default function NotificationsPage() {
  const { notifications, setNotifications } = useMainLayout();

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-full flex flex-col">
       <div className="flex-shrink-0 bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
             <div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground">
                    {unreadCount > 0 ? `You have ${unreadCount} unread notifications.` : 'No new notifications.'}
                </p>
             </div>
             <Button onClick={handleMarkAllAsRead} variant="outline" disabled={unreadCount === 0}>
                Mark all as read
            </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 bg-background">
        <div className="container mx-auto py-6">
            <div className="max-w-3xl mx-auto">
                <Card className="animated-border-card">
                    <CardContent className="p-0">
                    <div className="divide-y">
                        {notifications.map((noti) => (
                        <Link key={noti.id} href={noti.link} passHref>
                            <div
                            className={cn(
                                "flex items-start gap-4 p-4 hover:bg-secondary cursor-pointer",
                                !noti.read && "bg-secondary/50"
                            )}
                            onClick={() => handleMarkAsRead(noti.id)}
                            >
                            <Avatar className="h-10 w-10 mt-1">
                                <AvatarImage src={noti.actor.avatar} alt={noti.actor.name} />
                                <AvatarFallback>{noti.actor.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                {noti.title}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                {noti.description}
                                </p>
                                <p className="text-xs text-muted-foreground">{noti.timestamp}</p>
                            </div>
                            {!noti.read && (
                                <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5" />
                            )}
                            </div>
                        </Link>
                        ))}
                    </div>
                    </CardContent>
                </Card>
                 {notifications.length === 0 && (
                    <div className="text-center py-20">
                        <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No notifications yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            We'll let you know when something new comes up.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </ScrollArea>
    </div>
  );
}
