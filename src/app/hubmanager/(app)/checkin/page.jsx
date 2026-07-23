"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
export default function GuardCheckinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  useEffect(() => {
    fetchActiveVehicles();
  }, []);
  async function fetchActiveVehicles() {
    setLoading(true);
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
  const handleCheckInClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setRemarks("");
  };
  const submitCheckIn = async () => {
    if (!selectedVehicle) return;
    setIsSubmitting(true);
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
    if (remarks.trim().length > 0) {
      updates.push(
        supabase.from('notifications').insert({
          message: `Vehicle ${selectedVehicle.number_plate} checked in with remarks: ${remarks}`,
          type: 'warning',
          read: false
        })
      );
    }
    await Promise.all(updates);
    setIsSubmitting(false);
    setSelectedVehicle(null);
    fetchActiveVehicles(); 
  };
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Check In Vehicles</h1>
          <p className="text-xs text-muted-foreground">Receive vehicles returning from trip</p>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading active vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-4 bg-muted/30 rounded-2xl border border-dashed border-border p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-muted-foreground/50" />
          <div>
            <p className="font-semibold text-foreground">All clear!</p>
            <p className="text-sm text-muted-foreground mt-1">No vehicles are currently dispatched.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map(v => {
            const driver = drivers[v.last_driver_id];
            return (
              <Card key={v.id} className="border-border shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CarFront className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{v.number_plate}</p>
                        <p className="text-xs text-muted-foreground">{v.model}</p>
                        {driver && (
                          <p className="text-xs font-medium text-foreground mt-1">
                            Driver: <span className="text-primary">{driver.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleCheckInClick(v)}
                      size="sm" 
                      className="rounded-lg h-9 font-semibold shadow-sm"
                    >
                      Check In
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {}
      <Dialog open={!!selectedVehicle} onOpenChange={(open) => !open && setSelectedVehicle(null)}>
        <DialogContent className="w-[90vw] max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Confirm Check-In</DialogTitle>
            <DialogDescription>
              Are you receiving vehicle <span className="font-bold text-foreground">{selectedVehicle?.number_plate}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Add Remarks (Optional)</Label>
            <Textarea 
              placeholder="E.g., Battery low, minor scratch, late return..." 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="min-h-[100px] resize-none rounded-xl text-base"
            />
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Remarks will notify the admin dashboard.</p>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-0 mt-2">
            <Button type="button" variant="outline" className="h-12 rounded-xl sm:h-10 w-full sm:w-auto" onClick={() => setSelectedVehicle(null)}>
              Cancel
            </Button>
            <Button type="button" className="h-12 rounded-xl sm:h-10 w-full sm:w-auto font-bold shadow-md" onClick={submitCheckIn} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Check-In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
