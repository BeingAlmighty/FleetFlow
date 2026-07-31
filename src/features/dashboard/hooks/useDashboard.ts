import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

export function useDashboard() {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const [
        vehiclesRes,
        paymentsRes,
        activityRes
      ] = await Promise.all([
        supabase.from('vehicles').select('status'),
        supabase.from('payments').select('amount').gte('created_at', today.toISOString()),
        supabase.from('payments')
          .select('id, amount, payment_mode, created_at, drivers(name), profiles(full_name, area)')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);
      
      if (vehiclesRes.error) console.error('Vehicles Error:', vehiclesRes.error);
      if (paymentsRes.error) console.error('Payments Error:', paymentsRes.error);
      if (activityRes.error) console.error('Activity Error:', activityRes.error);

      const allVehicles = vehiclesRes.data || [];
      const payments = paymentsRes.data || [];
      const activity = activityRes.data || [];
      
      const totalRev = payments.reduce((acc, curr) => acc + curr.amount, 0) || 0;
      const availableCount = allVehicles.filter(v => v.status === 'Available').length || 0;
      const allotedCount = allVehicles.filter(v => v.status === 'Alloted').length || 0;
      const maintCount = allVehicles.filter(v => v.status === 'Maintenance').length || 0;
      
      return {
        stats: {
          available: availableCount,
          alloted: allotedCount,
          maintenance: maintCount,
          revenue: totalRev
        },
        recentActivity: (activity || []).map((row: any) => ({
          id: row.id,
          driver: row.drivers?.name || 'Unknown',
          hubmanager: row.profiles?.full_name || 'Unknown',
          area: row.profiles?.area || 'N/A',
          time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: row.payment_mode || 'Cash',
          amount: row.amount
        }))
      };
    }
  });
}
