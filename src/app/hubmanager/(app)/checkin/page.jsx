"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront, Loader2, CheckCircle2, AlertCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkinSchema } from "@/features/checkin/schema";
import { saveMutation } from "@/lib/offline/db";

export default function GuardCheckinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isOffline, setIsOffline] = useState(() => typeof window !== 'undefined' ? !navigator.onLine : false);
  const supabase = createClient();
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(checkinSchema),
    defaultValues: {
      vehicleId: "",
      remarks: ""
    }
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    async function fetchActiveVehicles() {
      if (!navigator.onLine) {
        setLoading(false);
        return; // Skip fetch if offline
      }
      const { data: guardData } = await supabase.auth.getUser();
      if (!guardData?.user) return;
      const { data: vData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('guard_id', guardData.user.id)
        .eq('status', 'Unavailable');
      const { data: dData } = await supabase.from('drivers').select('*');
      const dMap = {};
      if (dData) {
        dData.forEach(d => {
          dMap[d.id] = d;
        });
      }
      setDrivers(dMap);
      setVehicles(vData || []);
      setLoading(false);
    }
    fetchActiveVehicles();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCheckInClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    reset({ vehicleId: vehicle.id, remarks: "" });
  };

  const onSubmit = async (data) => {
    if (!selectedVehicle) return;
    
    if (isOffline) {
      await saveMutation({
        type: 'CHECKIN',
        payload: { ...data, lastDriverId: selectedVehicle.last_driver_id }
      });
      alert("You are offline. Checkin saved locally and will sync later!");
      setSelectedVehicle(null);
      return;
    }

    const updates = [];
    updates.push(
      supabase.from('vehicles').update({ 
        status: 'Available'
      }).eq('id', selectedVehicle.id)
    );
    
    if (selectedVehicle.last_driver_id) {
      updates.push(
        supabase.from('drivers').update({ 
          status: 'Off Duty', 
          vehicle_id: null 
        }).eq('id', selectedVehicle.last_driver_id)
      );
    }
    
    if (data.remarks && data.remarks.trim().length > 0) {
      updates.push(
        supabase.from('notifications').insert({
          message: `Vehicle ${selectedVehicle.id} checked in with remarks: ${data.remarks}`,
          type: 'warning',
          read: false
        })
      );
    }
    
    await Promise.all(updates);
    setSelectedVehicle(null);
    router.push('/hubmanager/home');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Check In Vehicles</h1>
            <p className="text-xs text-muted-foreground">Receive vehicles returning from trip</p>
          </div>
        </div>
        {isOffline && (
          <div className="flex items-center text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">
            <WifiOff className="w-3 h-3 mr-1" /> Offline
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading active vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-4 text-center px-4 bg-card rounded-2xl border border-border shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-success/50" />
          <div>
            <p className="font-semibold text-lg text-foreground">All clear!</p>
            <p className="text-sm text-muted-foreground">No vehicles currently on active duty.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((v) => (
            <Card key={v.id} className="border-border shadow-sm bg-card overflow-hidden transition-all hover:border-primary/50">
              <CardContent className="p-0">
                <div className="flex justify-between items-center p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CarFront className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{v.number_plate}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Driver: <span className="font-medium text-foreground">{drivers[v.last_driver_id]?.name || v.last_driver_id || 'Unknown'}</span>
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => handleCheckInClick(v)} variant="secondary" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
                    Check In
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedVehicle} onOpenChange={(open) => !open && setSelectedVehicle(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-border bg-card">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl">Confirm Check-In</DialogTitle>
                <DialogDescription>
                  You are checking in vehicle <strong className="text-foreground">{selectedVehicle?.number_plate}</strong>.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remarks / Damage (Optional)</Label>
                <Textarea 
                  {...register("remarks")}
                  placeholder="Record any new damage or issues with the vehicle..."
                  className="min-h-[100px] border-border bg-background resize-none focus-visible:ring-primary"
                />
              </div>
            </div>
            
            <DialogFooter className="p-6 pt-0 bg-muted/30 border-t border-border flex flex-row gap-3 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setSelectedVehicle(null)} className="w-full sm:w-auto h-12">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-12">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Confirm Check-In
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
