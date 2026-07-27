"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront, UserCircle, IndianRupee, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema } from "@/features/checkout/schema";
import { saveMutation } from "@/lib/offline/db";

export default function HubManagerCheckoutPage() {
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const supabase = createClient();
  
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      vehicleId: "",
      driverId: "",
      paymentMode: "upi",
      remarks: ""
    }
  });

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    async function fetchOptions() {
      if (!navigator.onLine) {
        setFetching(false);
        return; // Skip fetching if offline
      }
      const { data: guardData } = await supabase.auth.getUser();
      if (!guardData?.user) return;
      const [vRes, dRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('guard_id', guardData.user.id).eq('status', 'Available'),
        supabase.from('drivers').select('*').eq('status', 'Off Duty')
      ]);
      if (vRes.data) setAvailableVehicles(vRes.data);
      if (dRes.data) setAvailableDrivers(dRes.data);
      setFetching(false);
    }
    fetchOptions();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const onSubmit = async (data) => {
    const { data: userData } = await supabase.auth.getUser();
    const guardId = userData?.user?.id || 'offline-guard';
    
    if (isOffline) {
      await saveMutation({
        type: 'CHECKOUT',
        payload: { ...data, guardId }
      });
      alert("You are offline. Checkout saved locally and will sync later!");
      router.push("/hubmanager/home");
      return;
    }

    // Online execution
    const { error: paymentError } = await supabase.from('payments').insert({
      driver_id: data.driverId,
      guardId: guardId,
      amount: 800,
      payment_mode: data.paymentMode,
      remarks: data.remarks
    });
    
    if (paymentError) {
      alert("Failed to process payment: " + paymentError.message);
      return;
    }
    
    const updates = [];
    updates.push(supabase.from('vehicles').update({ status: 'Unavailable', last_driver_id: data.driverId }).eq('id', data.vehicleId));
    updates.push(supabase.from('drivers').update({ status: 'Active', vehicle_id: data.vehicleId }).eq('id', data.driverId));
    await Promise.all(updates);
    
    router.push("/hubmanager/home");
  };

  if (fetching) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Check Out Vehicle</h1>
            <p className="text-xs text-muted-foreground">Assign vehicle to driver</p>
          </div>
        </div>
        {isOffline && (
          <div className="flex items-center text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">
            <WifiOff className="w-3 h-3 mr-1" /> Offline Mode
          </div>
        )}
      </div>

      <Card className="border-border shadow-sm bg-card">
        <CardContent className="p-4 space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Vehicle</Label>
            <Controller
              name="vehicleId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-14 border-border bg-background">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <CarFront className="w-4 h-4 text-primary" />
                      </div>
                      <SelectValue placeholder="Tap to select vehicle" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.id} • {v.battery_percentage}%</SelectItem>
                    ))}
                    {isOffline && <SelectItem value="OFFLINE-V1">Offline Vehicle (Demo)</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.vehicleId && <p className="text-xs text-destructive">{errors.vehicleId.message}</p>}
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Driver</Label>
            <Controller
              name="driverId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-14 border-border bg-background">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="w-4 h-4 text-primary" />
                      </div>
                      <SelectValue placeholder="Tap to select driver" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name} • {d.phone}</SelectItem>
                    ))}
                    {isOffline && <SelectItem value="OFFLINE-D1">Offline Driver (Demo)</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.driverId && <p className="text-xs text-destructive">{errors.driverId.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm bg-card">
        <CardContent className="p-4 space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daily Rental Fee</Label>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-success" />
                </div>
                <div className="font-semibold text-lg">₹800</div>
              </div>
              <div className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">Fixed</div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Mode</Label>
            <Controller
              name="paymentMode"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2">
                  {['upi', 'cash', 'wallet'].map((mode) => (
                    <div
                      key={mode}
                      onClick={() => field.onChange(mode)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        field.value === mode 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <span className="text-sm font-semibold capitalize">{mode}</span>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remarks (Optional)</Label>
            <Controller
              name="remarks"
              control={control}
              render={({ field }) => (
                <Textarea 
                  {...field}
                  placeholder="Any damage or notes..." 
                  className="min-h-[80px] border-border bg-background resize-none"
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-10 pb-6">
        <Button type="submit" size="lg" className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Check Out"}
        </Button>
      </div>
    </form>
  );
}
