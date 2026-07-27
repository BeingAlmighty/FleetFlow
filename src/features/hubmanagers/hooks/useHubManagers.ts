import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

export function useHubManagers() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['hubManagers'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*, vehicles(id)').in('role', ['hubmanager', 'GUARD']);
      return data || [];
    }
  });
}
