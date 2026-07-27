"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CarFront, IndianRupee, ScanLine, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
export default function HubManagerHomePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    cash: 0,
    upi: 0,
    dispatched: 0,
    returned: 0
  });
  const supabase = createClient();
  useEffect(() => {
    async function fetchGuardData() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const guardId = userData.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_mode')
        .eq('guard_id', guardId)
        .gte('created_at', todayISO);
      let cashSum = 0;
      let upiSum = 0;
      if (payments) {
        payments.forEach(p => {
          if (p.payment_mode === 'cash') cashSum += p.amount;
          if (p.payment_mode === 'upi') upiSum += p.amount;
        });
      }
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('status')
        .eq('guard_id', guardId);
      let dispatched = 0;
      let returned = 0;
      if (vehicles) {
        vehicles.forEach(v => {
          if (v.status === 'Unavailable') dispatched++;
          if (v.status === 'Available') returned++;
        });
      }
      setStats({
        cash: cashSum,
        upi: upiSum,
        dispatched,
        returned
      });
      setLoading(false);
    }
    fetchGuardData();
  }, []);
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-4">
      <div className="grid grid-cols-2 gap-4">
        {}
        <Card className="col-span-2 border-border shadow-sm bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-medium text-primary">Today&apos;s Collection</h2>
              <IndianRupee className="w-4 h-4 text-primary" />
            </div>
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">₹{stats.cash}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Cash</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">₹{stats.upi}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total UPI</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {}
        <Card className="col-span-2 border-border shadow-sm bg-card">
          <CardContent className="p-4 flex justify-between items-center">
            {loading ? (
              <div className="flex justify-center p-4 w-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.dispatched}</p>
                    <p className="text-xs text-muted-foreground mt-1">Dispatched</p>
                  </div>
                  <div className="w-px h-10 bg-border"></div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.returned}</p>
                    <p className="text-xs text-muted-foreground mt-1">Returned</p>
                  </div>
                </div>
                <Link href="/hubmanager/checkin">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-medium border-border">
                    View Active <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
        {}
        <Link href="/hubmanager/checkout" className="col-span-2">
          <div className="h-28 rounded-xl bg-primary flex items-center px-6 relative overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full translate-x-8 -translate-y-8"></div>
            <div className="z-10 flex gap-4 items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <ScanLine className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-foreground">Check Out Vehicle</h3>
                <p className="text-xs text-primary-foreground/80 mt-0.5">Assign to driver</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/hubmanager/checkin" className="col-span-2">
          <div className="h-28 rounded-xl bg-card border border-border flex items-center px-6 relative overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
            <div className="z-10 flex gap-4 items-center w-full">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                <CarFront className="w-6 h-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">Check In Vehicle</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Receive from driver</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
