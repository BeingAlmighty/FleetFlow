"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CarFront, QrCode, ScanLine, UserCircle, IndianRupee, Loader2 } from "lucide-react";
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
export default function HubManagerCheckoutPage() {
  const router = useRouter();
  const [paymentMode, setPaymentMode] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const supabase = createClient();
  useEffect(() => {
    async function fetchOptions() {
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
  }, []);
  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!vehicleId || !driverId) {
      setError("Please select both a vehicle and a driver.");
      setLoading(false);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    const { error: paymentError } = await supabase.from('payments').insert({
      driver_id: driverId,
      guard_id: userData.user.id,
      amount: 800,
      payment_mode: paymentMode,
      remarks: remarks
    });
    if (paymentError) {
      setError("Failed to process payment: " + paymentError.message);
      setLoading(false);
      return;
    }
    const updates = [];
    updates.push(supabase.from('vehicles').update({ status: 'Unavailable', last_driver_id: driverId }).eq('id', vehicleId));
    updates.push(supabase.from('drivers').update({ status: 'Active', vehicle_id: vehicleId }).eq('id', driverId));
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
    <form onSubmit={handleCheckout} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Check Out Vehicle</h1>
          <p className="text-xs text-muted-foreground">Assign vehicle to driver</p>
        </div>
      </div>
      {error && (
        <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}
      <Card className="border-border shadow-sm bg-card">
        <CardContent className="p-4 space-y-6">
          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Select Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId} required>
              <SelectTrigger className="h-14 text-base rounded-xl">
                <SelectValue placeholder="Tap to select vehicle...">
                  {vehicleId && availableVehicles.find(v => v.id === vehicleId) 
                    ? `${availableVehicles.find(v => v.id === vehicleId).number_plate} - ${availableVehicles.find(v => v.id === vehicleId).model}`
                    : "Tap to select vehicle..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableVehicles.length === 0 ? (
                  <SelectItem value="none" disabled>No vehicles available</SelectItem>
                ) : (
                  availableVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.number_plate} - {v.model}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Select Driver</Label>
            <Select value={driverId} onValueChange={setDriverId} required>
              <SelectTrigger className="h-14 text-base rounded-xl">
                <SelectValue placeholder="Tap to search/select driver...">
                  {driverId && availableDrivers.find(d => d.id === driverId)
                    ? `${availableDrivers.find(d => d.id === driverId).name} (${availableDrivers.find(d => d.id === driverId).phone})`
                    : "Tap to search/select driver..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.length === 0 ? (
                  <SelectItem value="none" disabled>No off-duty drivers</SelectItem>
                ) : (
                  availableDrivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.phone})</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Collection (Fixed Daily Fee)</Label>
            <div className="relative mb-4 flex items-center h-14 bg-muted/50 rounded-xl border border-border px-4">
              <IndianRupee className="h-6 w-6 text-primary mr-3" />
              <span className="text-2xl font-bold text-foreground">800.00</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button" 
                variant={paymentMode === 'cash' ? 'default' : 'outline'} 
                className={`h-14 text-lg rounded-xl ${paymentMode !== 'cash' ? 'border-border text-muted-foreground' : ''}`}
                onClick={() => setPaymentMode('cash')}
              >
                Cash
              </Button>
              <Button 
                type="button" 
                variant={paymentMode === 'upi' ? 'default' : 'outline'} 
                className={`h-14 text-lg rounded-xl ${paymentMode !== 'upi' ? 'border-border text-muted-foreground' : ''}`}
                onClick={() => setPaymentMode('upi')}
              >
                UPI
              </Button>
            </div>
          </div>
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Remarks (Optional)</Label>
            <Textarea 
              placeholder="Add any notes about vehicle condition or payments..." 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="min-h-[100px] resize-none rounded-xl text-base" 
            />
          </div>
        </CardContent>
      </Card>
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-40 pb-safe">
        <Button type="submit" disabled={loading || !vehicleId || !driverId} className="w-full h-14 text-lg font-bold rounded-xl shadow-md" size="lg">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Check Out & Collect"}
        </Button>
      </div>
    </form>
  );
}
