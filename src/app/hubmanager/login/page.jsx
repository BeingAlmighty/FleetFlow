"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle, Lock, Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/utils/supabase/client";
export default function HubManagerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClient();
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (authData.user.app_metadata?.role !== 'hubmanager' && authData.user.app_metadata?.role !== 'GUARD') {
      await supabase.auth.signOut();
      setError("Access Denied: Please use the Admin Login portal.");
      setLoading(false);
      return;
    }
    router.push("/hubmanager/home");
    router.refresh();
  };
  return (
    <div className="min-h-screen w-full flex flex-col bg-background px-6 py-12 justify-center">
      <div className="w-full max-w-[400px] mx-auto space-y-10">
        {}
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mt-4">Guard Portal</h1>
            <p className="text-sm text-muted-foreground mt-2">Sign in to manage parking areas and dispatch vehicles.</p>
          </div>
        </div>
        {}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="relative">
              <UserCircle className="absolute left-3 top-3 h-6 w-6 text-muted-foreground" />
              <Input 
                id="email" 
                placeholder="Guard Email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 bg-card border-border text-base focus-visible:ring-1 focus-visible:ring-primary shadow-sm rounded-xl" 
                required 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-6 w-6 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 bg-card border-border text-base focus-visible:ring-1 focus-visible:ring-primary shadow-sm rounded-xl" 
                required 
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 px-1">
            <Checkbox id="remember" className="border-border w-5 h-5 rounded" />
            <label htmlFor="remember" className="text-sm font-medium leading-none text-muted-foreground">
              Remember my device
            </label>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-semibold rounded-xl shadow-sm mt-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
