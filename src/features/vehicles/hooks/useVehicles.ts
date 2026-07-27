import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

export function useVehicles() {
  const supabase = createClient();
  
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const [
        { data: vehicles },
        { data: drivers },
        { data: profiles }
      ] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('drivers').select('*'),
        supabase.from('profiles').select('id, full_name, area').in('role', ['hubmanager', 'GUARD'])
      ]);

      const drvMap = {};
      if (drivers) {
        drivers.forEach(d => drvMap[d.id] = d.name);
      }

      if (vehicles) {
        return vehicles.map(v => ({
          ...v,
          last_driver_name: v.last_driver_id ? (drvMap[v.last_driver_id] || v.last_driver_id) : null
        }));
      }
      return [];
    }
  });
}
