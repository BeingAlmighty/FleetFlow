import { HubManagerBottomNav } from "@/components/layout/HubManagerBottomNav";
import { User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function GuardLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-16 relative">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">Guard Shift</span>
            <span className="text-[10px] text-muted-foreground">Okhla Phase 2</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="w-5 h-5" />
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        {children}
      </main>
      <HubManagerBottomNav />
    </div>
  );
}
