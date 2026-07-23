"use client";
import { useState, useEffect } from "react";
import { Search, FileDown, IndianRupee, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();
  useEffect(() => {
    async function fetchPayments() {
      const [
        { data: payData },
        { data: drvData }
      ] = await Promise.all([
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('drivers').select('*')
      ]);
      const drvMap = {};
      if (drvData) {
        drvData.forEach(d => drvMap[d.id] = d.name);
      }
      if (payData) {
        const enhanced = payData.map(p => ({
          ...p,
          driver_name: drvMap[p.driver_id] || p.driver_id
        }));
        setPayments(enhanced);
      }
      setLoading(false);
    }
    fetchPayments();
  }, []);
  const filteredPayments = payments.filter(p => 
    p.driver_name.toLowerCase().includes(search.toLowerCase()) || 
    p.payment_mode.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">Track daily ₹800 fee collections from drivers.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <FileDown className="w-4 h-4" /> Export CSV
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Today's Collections</p>
                <p className="text-3xl font-bold">₹{(payments.length * 800).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by driver name or payment mode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
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
                    <th className="px-4 py-3 font-medium">Transaction ID</th>
                    <th className="px-4 py-3 font-medium">Driver</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Mode</th>
                    <th className="px-4 py-3 font-medium">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{payment.id.substring(0,8)}</td>
                      <td className="px-4 py-4 font-medium">{payment.driver_name}</td>
                      <td className="px-4 py-4 text-primary font-bold">₹{payment.amount}</td>
                      <td className="px-4 py-4 capitalize">{payment.payment_mode}</td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {new Date(payment.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                        No payments found.
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
