import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

export function usePayments() {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
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
        return payData.map(p => ({
          ...p,
          driver_name: drvMap[p.driver_id] || p.driver_id
        }));
      }
      return [];
    }
  });
}
