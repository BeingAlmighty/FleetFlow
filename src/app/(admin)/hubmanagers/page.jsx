"use client";
import { useState } from "react";
import { useHubManagers } from "@/features/hubmanagers/hooks/useHubManagers";
import { useQueryClient } from "@tanstack/react-query";
import { Search, FileDown, ShieldCheck, MoreHorizontal, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
export default function HubManagersPage() {
  const { data: HubManagers = [], isLoading: loading } = useHubManagers();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("All");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualForm, setManualForm] = useState({ name: "", email: "", password: "", phone: "", area: "" });
  
  // Keep the local client for non-fetching ops (we will migrate this next phase)
  const { createClient } = require('@/utils/supabase/client');
  const supabase = createClient();
  const handleManualAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/hubmanagers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Hub Manager');
      }
      setIsAddOpen(false);
      setManualForm({ name: "", email: "", password: "", phone: "", area: "" });
      queryClient.invalidateQueries({ queryKey: ['hubManagers'] });
    } catch (error) {
      alert("Error adding Hub Manager: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const filteredHubManagers = HubManagers.filter(g => 
    (String(g.full_name || "").toLowerCase().includes(search.toLowerCase()) || String(g.phone || "").includes(search)) &&
    (areaFilter === "All" || g.area === areaFilter)
  );
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hub Managers</h1>
          <p className="text-muted-foreground mt-1">Manage parking area Hub Managers and their details.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="shrink-0" />}>
            Add Hub Manager
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Hub Manager</DialogTitle>
              <DialogDescription>
                Create a new Hub Manager account. They will use the email and password to log in to the Guard Portal.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleManualAdd} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="hm_name">Full Name</Label>
                <Input id="hm_name" required value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hm_email">Email</Label>
                <Input id="hm_email" type="email" required value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} placeholder="e.g. rahul@fleet.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hm_pass">Password</Label>
                <Input id="hm_pass" type="password" required value={manualForm.password} onChange={e => setManualForm({...manualForm, password: e.target.value})} placeholder="Enter secure password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hm_phone">Phone Number</Label>
                <Input id="hm_phone" type="tel" required value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value})} placeholder="e.g. 9876543210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hm_area">Parking Area Name</Label>
                <Input id="hm_area" required value={manualForm.area} onChange={e => setManualForm({...manualForm, area: e.target.value})} placeholder="e.g. Okhla Phase 1" />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Hub Manager"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-[180px] bg-background border-border">
                <SelectValue placeholder="Filter by Area" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="All">All Areas</SelectItem>
                <SelectItem value="Okhla Phase 1">Okhla Phase 1</SelectItem>
                <SelectItem value="Okhla Phase 2">Okhla Phase 2</SelectItem>
                <SelectItem value="Nehru Place">Nehru Place</SelectItem>
                <SelectItem value="Lajpat Nagar">Lajpat Nagar</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                    <th className="px-4 py-3 font-medium">Hub Manager Name</th>
                    <th className="px-4 py-3 font-medium">Area</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium text-center">Assigned Vehicles</th>
                    <th className="px-4 py-3 font-medium">Shift Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHubManagers.map((hubmanager) => (
                    <tr key={hubmanager.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {hubmanager.full_name ? hubmanager.full_name.split(' ').map(n => n?.[0]).join('') : 'H'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{hubmanager.full_name}</span>
                            <span className="text-xs text-muted-foreground">{hubmanager.id.substring(0,8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium">{hubmanager.area || 'Unassigned'}</td>
                      <td className="px-4 py-4 text-muted-foreground">{hubmanager.phone || 'N/A'}</td>
                      <td className="px-4 py-4 text-center font-bold text-primary">
                        {hubmanager.vehicles ? hubmanager.vehicles.length : 0}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="border-success/50 text-success bg-success/10">
                          Active
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>View Performance</DropdownMenuItem>
                              <DropdownMenuItem>Assign New Area</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">End Shift</DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredHubManagers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                        No Hub Managers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
