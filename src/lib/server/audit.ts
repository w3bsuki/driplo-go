import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

interface AuditLogEntry {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
}

export async function logAdminAction(
  supabase: SupabaseClient<Database>,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_admin_action', {
      p_action: entry.action,
      p_resource_type: entry.resourceType,
      p_resource_id: entry.resourceId || null,
      p_details: entry.details || null
    });

    if (error) {
      console.error('Failed to log admin action:', error);
      // Don't throw - we don't want audit logging failures to break the main operation
    }
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

// Predefined action types for consistency
export const AdminActions = {
  // Payout actions
  PAYOUT_APPROVE: 'payout.approve',
  PAYOUT_REJECT: 'payout.reject',
  PAYOUT_BATCH_APPROVE: 'payout.batch_approve',
  PAYOUT_BATCH_REJECT: 'payout.batch_reject',
  PAYOUT_EXPORT: 'payout.export',
  
  // User management
  USER_BAN: 'user.ban',
  USER_UNBAN: 'user.unban',
  USER_ROLE_CHANGE: 'user.role_change',
  
  // Listing management
  LISTING_REMOVE: 'listing.remove',
  LISTING_FLAG: 'listing.flag',
  LISTING_UNFLAG: 'listing.unflag',
  
  // System actions
  SETTINGS_UPDATE: 'settings.update',
  MAINTENANCE_TOGGLE: 'maintenance.toggle'
};

// Resource types
export const ResourceTypes = {
  PAYOUT: 'payout',
  USER: 'user',
  LISTING: 'listing',
  TRANSACTION: 'transaction',
  SETTINGS: 'settings'
};