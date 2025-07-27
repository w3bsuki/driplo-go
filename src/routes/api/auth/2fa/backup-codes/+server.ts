import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerClient } from '$lib/server/supabase-admin';
import { generateBackupCodes, verifyTOTPCode, get2FAStatus } from '$lib/server/two-factor';
import { z } from 'zod';

const regenerateSchema = z.object({
  code: z.string().min(1)
});

// GET backup codes count
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const supabase = createServerClient(cookies);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get backup codes count
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('backup_codes, two_factor_enabled')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return json({ error: 'Failed to load profile' }, { status: 500 });
    }
    
    if (!profile.two_factor_enabled) {
      return json({ error: '2FA is not enabled' }, { status: 400 });
    }
    
    return json({
      success: true,
      count: profile.backup_codes?.length || 0
    });
  } catch (error) {
    console.error('Get backup codes error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST regenerate backup codes
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const supabase = createServerClient(cookies);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validation = regenerateSchema.safeParse(body);
    
    if (!validation.success) {
      return json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    const { code } = validation.data;
    
    // Get 2FA status
    const status = await get2FAStatus(supabase, user.id);
    
    if (!status.enabled || !status.secret) {
      return json({ error: '2FA is not enabled' }, { status: 400 });
    }
    
    // Verify the 2FA code
    const isValidCode = verifyTOTPCode(status.secret, code);
    
    if (!isValidCode) {
      return json({ error: 'Invalid 2FA code' }, { status: 400 });
    }
    
    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    
    // Update backup codes in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ backup_codes: backupCodes })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Error updating backup codes:', updateError);
      return json({ error: 'Failed to regenerate backup codes' }, { status: 500 });
    }
    
    // Log the backup codes regeneration
    try {
      await supabase.rpc('log_auth_event', {
        event_type: '2fa_backup_codes_regenerated',
        user_id: user.id,
        metadata: {}
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to log auth event:', error);
    }
    
    return json({
      success: true,
      backupCodes
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};