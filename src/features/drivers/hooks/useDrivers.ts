import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

export function useDrivers() {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('drivers')
        .select('*')
        .order('name');
      return (data || []).map(d => ({
        ...d,
        license: d.license_number
      }));
    }
  });
}
