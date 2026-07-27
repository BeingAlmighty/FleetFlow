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
      
      return {
        stats: {
          available: availableCount,
          onRoad: allotedCount,
          maintenance: maintCount,
          revenue: totalRev
        },
        recentActivity: activity || []
      };
    }
  });
}
