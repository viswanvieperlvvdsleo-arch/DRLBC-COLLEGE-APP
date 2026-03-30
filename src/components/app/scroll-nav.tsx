
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { allMenuItems } from './main-nav';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Button } from '../ui/button';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

export function ScrollNav() {
  const pathname = usePathname();
  const { role } = useAuth();
  const menuItems = allMenuItems.filter((item) =>
    item.roles.includes(role || 'student') && item.href !== '/profile' && item.href !== '/directory' && item.href !== '/notifications'
  );

  return (
    <TooltipProvider>
      <ScrollArea className="whitespace-nowrap">
        <nav className="flex w-max gap-1 p-2">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link href={item.href} className="w-20">
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="icon"
                      className={cn(
                        'w-full h-14 flex flex-col gap-1',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-xs">{item.label}</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <ScrollBar orientation="horizontal" className="h-0" />
      </ScrollArea>
    </TooltipProvider>
  );
}
