
"use client";

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useMainLayout } from '../layout';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { NotificationCardSkeleton } from '@/components/app/skeletons';

export default function NotificationsPage() {
  const { notifications, setNotifications, currentUser } = useMainLayout();
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser?.id) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`);
        const data = (await res.json()) as { notifications?: typeof notifications; error?: string };
        if (!res.ok || !data?.notifications) {
          throw new Error(data?.error || "Failed to load notifications");
        }
        setNotifications(data.notifications);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchNotifications();
  }, [currentUser?.id, setNotifications]);


  const handleMarkAsRead = async (id: string) => {
    if (!currentUser?.id) return;
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.id) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}&all=true`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const handleClearAll = async () => {
    if (!currentUser?.id || notifications.length === 0 || isClearing) return;
    setIsClearing(true);
    setTimeout(() => {
      setNotifications([]);
    }, 300);

    try {
      await fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}&all=true`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (err) {
      console.error("Failed to clear notifications", err);
    } finally {
      setTimeout(() => setIsClearing(false), 320);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const hasNotifications = notifications.length > 0;

  return (
    <div className="h-full flex flex-col bg-secondary/30">
       <div className="flex-shrink-0 bg-card border-b p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between container mx-auto">
             <div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground">
                    {unreadCount > 0 ? `You have ${unreadCount} unread notifications.` : 'All caught up!'}
                </p>
             </div>
             <div className="flex items-center gap-2">
               <Button onClick={handleMarkAllAsRead} variant="glow" disabled={unreadCount === 0}>
                 Mark all as read
               </Button>
               <Button onClick={handleClearAll} variant="outline" disabled={!hasNotifications || isClearing}>
                 Clear all
               </Button>
             </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="container mx-auto py-6">
            <div className="max-w-3xl mx-auto space-y-4">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <NotificationCardSkeleton key={i} />)
                ) : notifications.length > 0 ? (
                    notifications.map((noti) => (
                    <Card
                      key={noti.id}
                      className={cn(
                        'animated-border-card transition-all duration-300',
                        !noti.read && 'bg-secondary/20',
                        isClearing && 'opacity-0 -translate-y-2 scale-[0.98]'
                      )}
                    >
                        <Link href={noti.link} passHref>
                            <div className="p-4 cursor-pointer" onClick={() => handleMarkAsRead(noti.id)}>
                                <div className="flex items-start gap-4">
                                     <Avatar className="h-10 w-10 mt-1">
                                        <AvatarImage src={noti.actor.avatar} alt={noti.actor.name} />
                                        <AvatarFallback>{noti.actor.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <p className="font-semibold leading-none">
                                            {noti.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {noti.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(new Date(noti.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!noti.read && (
                                        <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 animate-pulse" />
                                    )}
                                </div>
                            </div>
                        </Link>
                    </Card>
                    ))
                ) : (
                    <div className="text-center py-20">
                        <div className="p-6 border-4 border-dashed border-muted rounded-2xl inline-block">
                            <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No notifications yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                We'll let you know when something new comes up.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </ScrollArea>
    </div>
  );
}
