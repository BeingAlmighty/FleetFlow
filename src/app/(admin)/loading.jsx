import { Loader2 } from "lucide-react";
export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[50vh] animate-in fade-in duration-500">
      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-foreground tracking-tight">Loading...</h2>
      <p className="text-muted-foreground mt-2">Please wait while we prepare this page.</p>
    </div>
  );
}
