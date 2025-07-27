import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerClient } from '$lib/server/supabase-admin';
import { disable2FA, verifyTOTPCode, get2FAStatus, is2FARequired } from '$lib/server/two-factor';
import { z } from 'zod';

const disableSchema = z.object({
  code: z.string().min(1),
  password: z.string().min(1)
});

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const supabase = createServerClient(cookies);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validation = disableSchema.safeParse(body);
    
    if (!validation.success) {
      return json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    const { code, password } = validation.data;
    
    // Check if 2FA is required for this user
    const isRequired = await is2FARequired(supabase, user.id);
    if (isRequired) {
      return json({ error: '2FA is mandatory for your account type' }, { status: 403 });
    }
    
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
    
    // Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password
    });
    
    if (signInError) {
      return json({ error: 'Invalid password' }, { status: 400 });
    }
    
    // Disable 2FA
    const { success, error } = await disable2FA(supabase, user.id);
    
    if (!success) {
      return json({ error: error || 'Failed to disable 2FA' }, { status: 500 });
    }
    
    // Clear 2FA verification cookie
    cookies.delete('2fa_verified', { path: '/' });
    
    // Log the 2FA disable event
    try {
      await supabase.rpc('log_auth_event', {
        event_type: '2fa_disabled',
        user_id: user.id,
        metadata: {}
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to log auth event:', error);
    }
    
    return json({
      success: true,
      message: '2FA has been disabled'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};