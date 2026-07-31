import { getPendingMutations, removeMutation } from './db';
import { createClient } from '@/utils/supabase/client';

let isSyncing = false;

export async function syncOfflineMutations() {
  if (isSyncing || typeof window === 'undefined' || !navigator.onLine) return;
  
  const supabase = createClient();
  const pending = await getPendingMutations();
  
  if (pending.length === 0) return;
  
  isSyncing = true;
  
  try {
    for (const mutation of pending) {
      const { id, type, payload } = mutation;
      const updates = [];
      
      if (type === 'CHECKIN') {
        updates.push(supabase.from('vehicles').update({ status: 'Available' }).eq('id', payload.vehicleId));
        if (payload.lastDriverId) {
          updates.push(supabase.from('drivers').update({ status: 'Off Duty', vehicle_id: null }).eq('id', payload.lastDriverId));
        }
        if (payload.remarks) {
          updates.push(
            supabase.from('notifications').insert({
              message: `Vehicle ${payload.vehicleId} checked in with remarks: ${payload.remarks}`,
              type: 'warning',
              read: false
            })
          );
        }
      } else if (type === 'CHECKOUT') {
        updates.push(supabase.from('payments').insert({
          driver_id: payload.driverId,
          guard_id: payload.guardId,
          amount: 800,
          payment_mode: payload.paymentMode,
          remarks: payload.remarks
        }));
        updates.push(supabase.from('vehicles').update({ status: 'Alloted', last_driver_id: payload.driverId }).eq('id', payload.vehicleId));
        updates.push(supabase.from('drivers').update({ status: 'Active', vehicle_id: payload.vehicleId }).eq('id', payload.driverId));
      }
      
      const results = await Promise.all(updates);
      const hasError = results.some(res => res.error);
      
      if (!hasError) {
        await removeMutation(id);
      } else {
        console.error('Failed to sync mutation to Supabase, keeping in queue:', results.map(r => r.error));
      }
    }
    
    console.log(`Finished processing ${pending.length} offline mutations!`);
  } catch (error) {
    console.error('Failed to sync offline mutations:', error);
  } finally {
    isSyncing = false;
  }
}
