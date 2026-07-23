"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LogOut, FileClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
export function HubManagerBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const handleLogout = async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/hubmanager/login");
    router.refresh();
  };
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-card border-t border-border flex items-center justify-around px-2 pb-safe">
      <Link href="/hubmanager/home" className="flex-1">
        <div className="flex flex-col items-center justify-center space-y-1 h-full py-2">
          <Home className={cn("w-6 h-6", pathname === "/hubmanager/home" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-medium", pathname === "/hubmanager/home" ? "text-primary" : "text-muted-foreground")}>
            Home
          </span>
        </div>
      </Link>
      <Link href="/hubmanager/history" className="flex-1">
        <div className="flex flex-col items-center justify-center space-y-1 h-full py-2">
          <FileClock className={cn("w-6 h-6", pathname === "/hubmanager/history" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-medium", pathname === "/hubmanager/history" ? "text-primary" : "text-muted-foreground")}>
            History
          </span>
        </div>
      </Link>
      <button onClick={handleLogout} className="flex-1 outline-none">
        <div className="flex flex-col items-center justify-center space-y-1 h-full py-2 hover:bg-muted/50 rounded-md transition-colors">
          <LogOut className="w-6 h-6 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">
            Logout
          </span>
        </div>
      </button>
    </div>
  );
}
