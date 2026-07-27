"use client";
import { useState } from "react";
import { useDrivers } from "@/features/drivers/hooks/useDrivers";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  FileDown,
  User,
  Phone,
  CreditCard,
  FileText,
  Clock,
  MoreHorizontal,
  Loader2,
  Upload
} from "lucide-react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { downloadCSV } from "@/utils/csv";
import { Label } from "@/components/ui/label";
export default function DriversPage() {
  const { data: drivers = [], isLoading: loading } = useDrivers();
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ name: "", phone: "", license: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Keep local client for non-query ops
  const { createClient } = require('@/utils/supabase/client');
  const supabase = createClient();
  const handleManualAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const driverId = `D-${Math.floor(1000 + Math.random() * 9000)}`;
    const payload = { ...manualForm, id: driverId };
    const { error } = await supabase.from('drivers').insert([payload]);
    setIsSubmitting(false);
    if (!error) {
      setIsAddOpen(false);
      setManualForm({ name: "", phone: "", license: "" });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    } else {
      alert("Error adding driver: " + error.message);
    }
  };
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSubmitting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data } = results;
        const validData = data.filter(d => d.name && d.phone && d.license).map(d => ({
          ...d,
          id: `D-${Math.floor(100000 + Math.random() * 900000)}`
        }));
        if (validData.length > 0) {
          const { error } = await supabase.from('drivers').insert(validData);
          if (error) {
            alert("Error importing CSV: " + error.message);
          } else {
            setIsAddOpen(false);
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
          }
        } else {
          alert("No valid rows found. Ensure columns match the template.");
        }
        setIsSubmitting(false);
      },
      error: (error) => {
        alert("Error parsing CSV: " + error.message);
        setIsSubmitting(false);
      }
    });
  };
  const filteredDrivers = drivers.filter(d => 
    String(d.name || "").toLowerCase().includes(search.toLowerCase()) || 
    String(d.phone || "").includes(search) || 
    String(d.license || "").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Drivers</h1>
          <p className="text-muted-foreground mt-1">Manage driver profiles, verification, and status.</p>
        </div>
      </div>
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button>Add Driver</Button>} />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Driver</DialogTitle>
                <DialogDescription>
                  Add a driver manually or import from a CSV file.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="manual" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="csv">Import CSV</TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="space-y-4 pt-4">
                  <form onSubmit={handleManualAdd} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" required value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} placeholder="e.g. Rajesh Kumar" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" required value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value})} placeholder="e.g. +91 9876543210" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">License Number</Label>
                      <Input id="license" required value={manualForm.license} onChange={e => setManualForm({...manualForm, license: e.target.value})} placeholder="e.g. DL-14201100123" />
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Driver"}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="csv" className="space-y-4 pt-4">
                  <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md mb-4 border border-border">
                    <div className="text-sm">
                      <span className="font-semibold">Format required:</span>
                      <br/>
                      name, phone, license
                    </div>
                    <Button variant="outline" size="sm" onClick={() => downloadCSV(['name', 'phone', 'license'], 'driver_template.csv')}>
                      <FileDown className="w-4 h-4 mr-2" /> Template
                    </Button>
                  </div>
                  <Label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-background hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isSubmitting ? (
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-2" />
                      ) : (
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      )}
                      <p className="text-sm text-muted-foreground font-semibold">Click to upload CSV</p>
                    </div>
                    <Input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} disabled={isSubmitting} />
                  </Label>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0 relative min-h-[200px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Driver Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">License</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {driver.name ? driver.name.split(' ').map(n => n?.[0]).join('') : 'D'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-foreground">{driver.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{driver.phone}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-foreground">{driver.license}</span>
                        <span className={`text-[10px] ${driver.verified ? 'text-success' : 'text-destructive'}`}>
                          {driver.verified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={
                        driver.status === 'Active' ? 'border-success/50 text-success bg-success/10' :
                        'border-muted-foreground/50 text-muted-foreground bg-muted/50'
                      }>
                        {driver.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-border text-xs h-8"
                            onClick={() => setSelectedDriver(driver)}
                          >
                            View Profile
                          </Button>
                    </td>
                  </tr>
                ))}
                {filteredDrivers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                      No drivers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>
      <Sheet open={!!selectedDriver} onOpenChange={(open) => !open && setSelectedDriver(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] border-border bg-card overflow-y-auto">
          {selectedDriver && (
            <>
              <SheetHeader className="pb-6 border-b border-border">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {selectedDriver.name ? selectedDriver.name.split(' ').map(n => n?.[0]).join('') : 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-2xl">{selectedDriver.name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      {selectedDriver.id} • Joined {selectedDriver.joined}
                    </SheetDescription>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {selectedDriver.status}
                      </Badge>
                      {selectedDriver.verified && (
                        <Badge variant="outline" className="border-success/50 text-success">Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-background border-border">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <span className="text-xs text-muted-foreground mb-1">Current Vehicle</span>
                      <span className="text-xl font-bold mt-1">{selectedDriver.vehicle_id || '--'}</span>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedDriver.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span>{selectedDriver.license}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
