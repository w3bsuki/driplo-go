import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL, PUBLIC_APP_URL } from '$env/static/public';
import { emailService } from '$lib/server/email';
import { apiError, apiSuccess, ApiErrorType, validateRequest, ApiError } from '$lib/server/api-utils';
import { z } from 'zod';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const resendVerificationSchema = z.object({
	email: z.string().email('Invalid email address')
});

export const POST: RequestHandler = async ({ request }) => {
	const requestId = crypto.randomUUID();
	
	try {
		// Validate request body
		const { email } = await validateRequest(request, resendVerificationSchema);

		// Check if user exists and is not verified
		const { data: user, error: userError } = await supabaseAdmin
			.from('users')
			.select('id, email, email_confirmed_at')
			.eq('email', email)
			.single();

		if (userError || !user) {
			// Don't reveal if email exists or not for security
			return apiSuccess({
				success: true,
				message: 'If an account exists with this email, a verification link has been sent.'
			}, 200, requestId);
		}

		// Check if already verified
		if (user.email_confirmed_at) {
			return apiError(
				'Email is already verified',
				400,
				ApiErrorType.VALIDATION,
				undefined,
				requestId
			);
		}

		// Generate new confirmation link
		const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
			type: 'signup',
			email: email,
			options: {
				redirectTo: `${PUBLIC_APP_URL}/auth/confirm`
			}
		});

		if (linkError || !linkData) {
			return apiError(
				'Failed to generate verification link',
				500,
				ApiErrorType.INTERNAL,
				undefined,
				requestId
			);
		}

		// Send confirmation email
		const emailSent = await emailService.send({
			to: email,
			subject: 'Verify your email for Driplo',
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Verify Your Email</title>
				</head>
				<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
					<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
						<div style="background-color: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
							<div style="text-align: center; margin-bottom: 30px;">
								<h1 style="color: #60A5FA; font-size: 32px; margin: 0;">Driplo</h1>
								<p style="color: #6B7280; margin-top: 5px;">Threadly Marketplace</p>
							</div>
							
							<h2 style="color: #111827; font-size: 24px; margin-bottom: 20px;">Verify Your Email</h2>
							
							<p style="color: #4B5563; line-height: 1.6; margin-bottom: 30px;">
								We received a request to resend your email verification. Click the button below to verify your email address and activate your account.
							</p>
							
							<div style="text-align: center; margin-bottom: 30px;">
								<a href="${linkData.properties.action_link}" 
								   style="display: inline-block; background-color: #60A5FA; color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
									Verify Email
								</a>
							</div>
							
							<p style="color: #6B7280; font-size: 14px; line-height: 1.5;">
								This link will expire in 24 hours. If you didn't request this verification, you can safely ignore this email.
							</p>
							
							<hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
							
							<p style="color: #9CA3AF; font-size: 12px; text-align: center;">
								© 2024 Driplo. All rights reserved.
							</p>
						</div>
					</div>
				</body>
				</html>
			`
		});

		if (!emailSent) {
			return apiError(
				'Failed to send verification email',
				500,
				ApiErrorType.EXTERNAL_SERVICE,
				undefined,
				requestId
			);
		}

		return apiSuccess({ 
			success: true, 
			message: 'Verification email sent successfully. Please check your inbox.' 
		}, 200, requestId);

	} catch (error) {
		if (error instanceof ApiError) {
			return apiError(error.message, error.status, error.type, error.details, requestId);
		}
		return apiError(
			'An unexpected error occurred',
			500,
			ApiErrorType.INTERNAL,
			undefined,
			requestId
		);
	}
};