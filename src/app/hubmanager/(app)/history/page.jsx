"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, IndianRupee, MapPin, ReceiptText, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
export default function GuardHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [drivers, setDrivers] = useState({});
  const supabase = createClient();
  useEffect(() => {
    async function fetchHistory() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const guardId = userData.user.id;
      const { data: dData } = await supabase.from('drivers').select('*');
      const dMap = {};
      if (dData) {
        dData.forEach(d => {
          dMap[d.id] = d;
        });
      }
      setDrivers(dMap);
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('guard_id', guardId)
        .order('created_at', { ascending: false })
        .limit(20);
      setHistory(payments || []);
      setLoading(false);
    }
    fetchHistory();
  }, []);
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(d);
  };
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Activity History</h1>
          <p className="text-xs text-muted-foreground">Recent checkouts & collections</p>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-4 bg-muted/30 rounded-2xl border border-dashed border-border p-6 text-center">
          <ReceiptText className="w-12 h-12 text-muted-foreground/50" />
          <div>
            <p className="font-semibold text-foreground">No history yet</p>
            <p className="text-sm text-muted-foreground mt-1">Check out vehicles to see activity.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record) => {
            const driverName = drivers[record.driver_id]?.name || record.driver_id;
            return (
              <Card key={record.id} className="border-border shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                        <ReceiptText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground flex items-center gap-2">
                          <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                          {record.amount}.00
                        </p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(record.created_at)}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-foreground">
                            Driver: <span className="text-primary">{driverName}</span>
                          </p>
                          {record.remarks && (
                            <p className="text-[11px] text-muted-foreground bg-muted p-1.5 rounded-md mt-1 italic">
                              "{record.remarks}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                        record.payment_mode === 'cash' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500' : 
                        record.payment_mode === 'upi' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-500' : 
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500'
                      }`}>
                        {record.payment_mode}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
