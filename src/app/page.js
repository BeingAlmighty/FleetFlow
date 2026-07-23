"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Lock, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/utils/supabase/client";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClient();
  const handleAdminLogin = async (e) => {
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
    if (authData.user.app_metadata?.role !== 'ADMIN') {
      await supabase.auth.signOut();
      setError("Access Denied: Please use the Hub Manager login portal.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };
  return (
    <div className="min-h-screen w-full flex bg-background">
      {}
      <div className="hidden lg:flex flex-col flex-1 bg-secondary relative overflow-hidden border-r border-border">
        {}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>
        {}
        <div className="relative z-10 flex flex-col justify-center h-full p-20 max-w-2xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Car className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-4xl font-bold tracking-tight text-foreground">FleetFlow</span>
          </div>
          <h1 className="text-5xl font-semibold tracking-tight leading-tight text-white mb-6">
            Intelligent Fleet Operations Platform
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Manage your E-Rickshaw fleet with real-time tracking, automated dispatch, maintenance scheduling, and comprehensive analytics all in one place.
          </p>
          <div className="mt-16 grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm font-medium text-muted-foreground">Active Vehicles</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm font-medium text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-0">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>
          <Card className="border-border shadow-md bg-card">
            <CardContent className="pt-8">
              <form onSubmit={handleAdminLogin} className="space-y-6">
                {error && (
                  <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        id="email" 
                        placeholder="name@company.com" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-11 bg-background border-border focus-visible:ring-1 focus-visible:ring-primary" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="password">Password</Label>
                      </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 h-11 bg-background border-border focus-visible:ring-1 focus-visible:ring-primary" 
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="border-border" />
                  <label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground">
                    Remember me for 30 days
                  </label>
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <Link href="/hubmanager/login" className="font-medium text-primary hover:underline underline-offset-4">
                    Hub Manager Login
                  </Link>
                  <Link href="#" className="font-medium text-muted-foreground hover:text-primary hover:underline underline-offset-4">
                    Forgot password?
                  </Link>
                </div>
                <div className="space-y-3 pt-2">
                  <Button type="submit" disabled={loading} className="w-full h-11 font-medium text-base shadow-sm">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</Link>{" "}
            and{" "}
            <Link href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
