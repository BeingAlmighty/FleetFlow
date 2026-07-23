"use client";
import { useState, useEffect } from "react";
import { Bell, Search, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";
export function AdminTopBar() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();
  useEffect(() => {
    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    }
    fetchNotifications();
  }, []);
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', notifications.map(n => n.id));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4 w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search vehicles, drivers, or guards..."
            className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden text-sm text-muted-foreground md:block font-medium">
          {currentDate}
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center relative text-muted-foreground hover:text-foreground h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground outline-none">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-card border-border">
              <div className="flex items-center justify-between px-4 py-2">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs text-primary hover:text-primary/80">
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-4 cursor-default">
                      <div className="flex items-start gap-2 w-full">
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
                        <div className="flex-1 space-y-1">
                          <p className={`text-sm leading-snug ${n.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-3 pl-4 border-l border-border/50">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none mb-1 text-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground leading-none">Operations Manager</p>
            </div>
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src="https://i.pravatar.cc/150?u=admin" alt="Admin" />
              <AvatarFallback className="bg-primary/20 text-primary">AD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
