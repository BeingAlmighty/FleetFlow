"use client";
import { useState, useEffect } from "react";
import { 
  Car, 
  Activity, 
  Wrench, 
  IndianRupee, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  BatteryWarning,
  Clock,
  CheckCircle2,
  CalendarClock,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { createClient } from "@/utils/supabase/client";
export default function Dashboard() {
  const [stats, setStats] = useState({ available: 0, onRoad: 0, maintenance: 0, revenue: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  useEffect(() => {
    fetchDashboardData();
  }, []);
  async function fetchDashboardData() {
    setLoading(true);
    const today = new Date();
    today.setHours(0,0,0,0);
    const [
      { data: allVehicles },
      { data: payments },
      { data: activity }
    ] = await Promise.all([
      supabase.from('vehicles').select('status'),
      supabase.from('payments').select('amount').gte('created_at', today.toISOString()),
      supabase.from('payments')
        .select('id, amount, payment_mode, created_at, drivers(name), profiles(full_name, area)')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);
    const totalRev = payments?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    const availableCount = allVehicles?.filter(v => v.status === 'Available').length || 0;
    const allotedCount = allVehicles?.filter(v => v.status === 'Alloted').length || 0;
    const maintCount = allVehicles?.filter(v => v.status === 'Maintenance').length || 0;
    setStats({
      available: availableCount,
      alloted: allotedCount,
      maintenance: maintCount,
      revenue: totalRev
    });
    if (activity) {
      setRecentActivity(activity.map(a => ({
        id: a.id,
        driver: a.drivers?.name || 'Unknown',
        hubmanager: a.profiles?.full_name || 'Unknown',
        area: a.profiles?.area || 'Unassigned',
        amount: a.amount,
        mode: a.payment_mode,
        time: new Date(a.created_at).toLocaleTimeString()
      })));
    }
    setLoading(false);
  }
  const revenueData = [
    { day: "Mon", revenue: 45000 },
    { day: "Tue", revenue: 52000 },
    { day: "Wed", revenue: 48000 },
    { day: "Thu", revenue: 61000 },
    { day: "Fri", revenue: 59000 },
    { day: "Sat", revenue: 75000 },
    { day: "Sun", revenue: 82000 },
  ];
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here is your fleet's performance for today.</p>
        </div>
      </div>
      {}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Vehicles</CardTitle>
            <div className="p-2 bg-primary/10 rounded-md">
              <Car className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.available}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vehicles Alloted</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-md">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.alloted}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance</CardTitle>
            <div className="p-2 bg-warning/10 rounded-md">
              <Wrench className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.maintenance}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
            <div className="p-2 bg-success/10 rounded-md">
              <IndianRupee className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{stats.revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-7">
        {}
        <Card className="md:col-span-4 lg:col-span-5 bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Summary</CardTitle>
            <CardDescription>Daily revenue for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₹${value / 1000}k`}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--primary)' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--primary)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        {}
        <div className="md:col-span-3 lg:col-span-2 space-y-6">
          <Card className="bg-card border-border shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Live Fleet Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mt-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm font-medium">Available</span>
                  </div>
                  <span className="text-lg font-bold">{stats.available}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Alloted</span>
                  </div>
                  <span className="text-lg font-bold">{stats.alloted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-sm font-medium">Maintenance</span>
                  </div>
                  <span className="text-lg font-bold">{stats.maintenance}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle>Recent Fee Collections</CardTitle>
          <CardDescription>Latest checkout payments recorded in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted border-y border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Transaction ID</th>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium">Collected By (Hub Manager)</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((row) => (
                  <tr key={row.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{row.id.substring(0,8)}</td>
                    <td className="px-4 py-4 font-medium text-foreground">{row.driver}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{row.hubmanager}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4"><Badge variant="secondary">{row.area}</Badge></td>
                    <td className="px-4 py-4 text-muted-foreground">{row.time}</td>
                    <td className="px-4 py-4 capitalize">{row.mode}</td>
                    <td className="px-4 py-4 font-bold text-success">₹{row.amount}</td>
                  </tr>
                ))}
                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                      No recent collections found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
