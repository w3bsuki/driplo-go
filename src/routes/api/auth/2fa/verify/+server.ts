import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyTOTPCode, verifyBackupCode, useBackupCode, get2FAStatus } from '$lib/server/two-factor';
import { z } from 'zod';

const verifySchema = z.object({
  code: z.string().min(1),
  type: z.enum(['totp', 'backup']).default('totp')
});

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validation = verifySchema.safeParse(body);
    
    if (!validation.success) {
      return json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    const { code, type } = validation.data;
    
    // Get 2FA status
    const status = await get2FAStatus(supabase, user.id);
    
    if (!status.enabled || !status.secret) {
      return json({ error: '2FA is not enabled' }, { status: 400 });
    }
    
    let isValid = false;
    
    if (type === 'totp') {
      // Verify TOTP code
      isValid = verifyTOTPCode(status.secret, code);
    } else if (type === 'backup') {
      // Get backup codes
      const { data: profile } = await supabase
        .from('profiles')
        .select('backup_codes')
        .eq('id', user.id)
        .single();
      
      if (!profile?.backup_codes || profile.backup_codes.length === 0) {
        return json({ error: 'No backup codes available' }, { status: 400 });
      }
      
      // Verify backup code
      const result = verifyBackupCode(code, profile.backup_codes);
      
      if (result.valid && result.usedCode) {
        // Remove used backup code
        await useBackupCode(supabase, user.id, result.usedCode);
        isValid = true;
      }
    }
    
    if (!isValid) {
      return json({ error: 'Invalid verification code' }, { status: 400 });
    }
    
    // Set 2FA verification in session
    cookies.set('2fa_verified', 'true', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });
    
    // Log the successful 2FA verification
    try {
      await supabase.rpc('log_auth_event', {
        event_type: '2fa_verify_success',
        user_id: user.id,
        metadata: { type }
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to log auth event:', error);
    }
    
    return json({
      success: true,
      message: '2FA verification successful'
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};