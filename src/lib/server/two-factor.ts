import * as OTPAuth from 'otpauth';
import { randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

// Constants
const TOTP_ISSUER = 'Driplo Marketplace';
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30; // seconds
const TOTP_ALGORITHM = 'SHA1';
const BACKUP_CODES_COUNT = 8;
const BACKUP_CODE_LENGTH = 8;

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(username: string): {
  secret: string;
  uri: string;
} {
  // Generate a random secret
  const secret = new OTPAuth.Secret({ size: 20 });
  
  // Create TOTP instance
  const totp = new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    label: username,
    secret,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    algorithm: TOTP_ALGORITHM
  });
  
  return {
    secret: secret.base32,
    uri: totp.toString()
  };
}

/**
 * Verify a TOTP code
 */
export function verifyTOTPCode(secret: string, code: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      digits: TOTP_DIGITS,
      period: TOTP_PERIOD,
      algorithm: TOTP_ALGORITHM
    });
    
    // Validate with a window of 1 to account for time drift
    const delta = totp.validate({
      token: code,
      window: 1
    });
    
    return delta !== null;
  } catch (error) {
    console.error('Error verifying TOTP code:', error);
    return false;
  }
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    // Generate random alphanumeric code
    const code = randomBytes(BACKUP_CODE_LENGTH / 2)
      .toString('hex')
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join('-') || '';
    codes.push(code);
  }
  
  return codes;
}

/**
 * Hash backup codes for storage (simple comparison for now, could use bcrypt for better security)
 */
export function hashBackupCode(code: string): string {
  // In production, consider using bcrypt or argon2
  // For now, we'll store them as-is but this should be improved
  return code.replace(/-/g, '').toUpperCase();
}

/**
 * Verify a backup code
 */
export function verifyBackupCode(inputCode: string, storedCodes: string[]): {
  valid: boolean;
  usedCode?: string;
} {
  const normalizedInput = inputCode.replace(/-/g, '').toUpperCase();
  
  for (const storedCode of storedCodes) {
    if (normalizedInput === hashBackupCode(storedCode)) {
      return { valid: true, usedCode: storedCode };
    }
  }
  
  return { valid: false };
}

/**
 * Enable 2FA for a user
 */
export async function enable2FA(
  supabase: SupabaseClient<Database>,
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        two_factor_enabled: true,
        two_factor_secret: secret,
        backup_codes: backupCodes
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error enabling 2FA:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return { success: false, error: 'Failed to enable 2FA' };
  }
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        backup_codes: null
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return { success: false, error: 'Failed to disable 2FA' };
  }
}

/**
 * Get 2FA status for a user
 */
export async function get2FAStatus(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{
  enabled: boolean;
  secret?: string;
  backupCodesCount?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('two_factor_enabled, two_factor_secret, backup_codes')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting 2FA status:', error);
      return { enabled: false, error: error.message };
    }
    
    return {
      enabled: data?.two_factor_enabled || false,
      secret: data?.two_factor_secret || undefined,
      backupCodesCount: data?.backup_codes?.length || 0
    };
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    return { enabled: false, error: 'Failed to get 2FA status' };
  }
}

/**
 * Use a backup code (remove it from the list)
 */
export async function useBackupCode(
  supabase: SupabaseClient<Database>,
  userId: string,
  usedCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current backup codes
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('backup_codes')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      return { success: false, error: fetchError.message };
    }
    
    const currentCodes = data?.backup_codes || [];
    const newCodes = currentCodes.filter(code => code !== usedCode);
    
    // Update with removed code
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ backup_codes: newCodes })
      .eq('id', userId);
    
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error using backup code:', error);
    return { success: false, error: 'Failed to use backup code' };
  }
}

/**
 * Check if 2FA is required for user (brands and admins)
 */
export async function is2FARequired(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('account_type, role')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    // 2FA required for brands and admins
    return data.account_type === 'brand' || data.role === 'admin';
  } catch (error) {
    console.error('Error checking 2FA requirement:', error);
    return false;
  }
}