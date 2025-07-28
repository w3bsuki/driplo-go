import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateTOTPSecret, generateBackupCodes, verifyTOTPCode, enable2FA, is2FARequired } from '$lib/server/two-factor';
import { generateQRCodeDataURL } from '$lib/server/qr-code';
import { z } from 'zod';

const enableSchema = z.object({
  action: z.enum(['start', 'verify']),
  code: z.string().optional()
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
    const validation = enableSchema.safeParse(body);
    
    if (!validation.success) {
      return json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    const { action, code } = validation.data;
    
    if (action === 'start') {
      // Check if 2FA is already enabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('two_factor_enabled, username')
        .eq('id', user.id)
        .single();
      
      if (profile?.two_factor_enabled) {
        return json({ error: '2FA is already enabled' }, { status: 400 });
      }
      
      // Generate TOTP secret
      const { secret, uri } = generateTOTPSecret(profile?.username || user.email || 'user');
      
      // Generate QR code
      const qrCode = await generateQRCodeDataURL(uri);
      
      // Store temporary secret in session (not in database yet)
      // In production, you might want to use a more secure temporary storage
      cookies.set('2fa_setup_secret', secret, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 10, // 10 minutes
        path: '/'
      });
      
      return json({
        success: true,
        qrCode,
        secret,
        manualEntryKey: secret,
        required: await is2FARequired(supabase, user.id)
      });
    } else if (action === 'verify') {
      // Get the temporary secret from session
      const tempSecret = cookies.get('2fa_setup_secret');
      
      if (!tempSecret) {
        return json({ error: 'No 2FA setup in progress' }, { status: 400 });
      }
      
      if (!code) {
        return json({ error: 'Verification code is required' }, { status: 400 });
      }
      
      // Verify the code
      const isValid = verifyTOTPCode(tempSecret, code);
      
      if (!isValid) {
        return json({ error: 'Invalid verification code' }, { status: 400 });
      }
      
      // Generate backup codes
      const backupCodes = generateBackupCodes();
      
      // Enable 2FA in database
      const { success, error } = await enable2FA(supabase, user.id, tempSecret, backupCodes);
      
      if (!success) {
        return json({ error: error || 'Failed to enable 2FA' }, { status: 500 });
      }
      
      // Clear the temporary secret
      cookies.delete('2fa_setup_secret', { path: '/' });
      
      return json({
        success: true,
        backupCodes
      });
    }
    
    return json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('2FA enable error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};