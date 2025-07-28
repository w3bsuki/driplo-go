import { json } from '@sveltejs/kit';
import { emailService } from '$lib/server/email';
import { createAdminClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { email } = await request.json();
        
        if (!email) {
            return json({ error: 'Email is required' }, { status: 400 });
        }

        // Create admin client for generating confirmation link
        const supabaseAdmin = createAdminClient();
        
        // Generate confirmation link
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email,
            options: {
                redirectTo: `${process.env['PUBLIC_APP_URL'] || 'https://driplo.com'}/auth/confirm`
            }
        });
        
        if (error || !data?.properties?.action_link) {
            console.error('Error generating confirmation link:', error);
            return json({ error: 'Failed to generate confirmation link' }, { status: 500 });
        }

        // Send confirmation email using Resend
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { padding: 30px; background-color: #f9f9f9; }
                        .button-container { text-align: center; margin: 30px 0; }
                        .button { 
                            display: inline-block; 
                            padding: 14px 30px; 
                            background-color: #000; 
                            color: white; 
                            text-decoration: none; 
                            border-radius: 50px; 
                            font-weight: bold;
                            font-size: 16px;
                        }
                        .footer { 
                            text-align: center; 
                            padding: 20px; 
                            color: #666; 
                            font-size: 14px; 
                            border-top: 1px solid #eee;
                        }
                        .logo { 
                            font-size: 32px; 
                            font-weight: bold; 
                            letter-spacing: -1px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">DRIPLO</div>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Sustainable Fashion Marketplace</p>
                        </div>
                        <div class="content">
                            <h2 style="margin-top: 0;">Welcome to Driplo! 🎉</h2>
                            <p>Thanks for joining our sustainable fashion community. We're excited to have you!</p>
                            <p>Please confirm your email address by clicking the button below:</p>
                            
                            <div class="button-container">
                                <a href="${data.properties.action_link}" class="button">Confirm Email Address</a>
                            </div>
                            
                            <p style="color: #666; font-size: 14px;">
                                Or copy and paste this link into your browser:<br>
                                <span style="word-break: break-all; color: #3B82F6;">
                                    ${data.properties.action_link}
                                </span>
                            </p>
                            
                            <p style="margin-top: 30px;">
                                <strong>What's next?</strong><br>
                                Once confirmed, you can:
                            </p>
                            <ul style="color: #555;">
                                <li>Browse thousands of unique fashion items</li>
                                <li>List your own items for sale</li>
                                <li>Connect with fashion-conscious sellers and buyers</li>
                                <li>Build your sustainable wardrobe</li>
                            </ul>
                        </div>
                        <div class="footer">
                            <p>If you didn't create an account on Driplo, you can safely ignore this email.</p>
                            <p>Need help? Contact us at support@driplo.com</p>
                            <p style="margin-top: 20px; color: #999;">
                                © ${new Date().getFullYear()} Driplo. All rights reserved.
                            </p>
                        </div>
                    </div>
                </body>
            </html>
        `;

        const emailSent = await emailService.send({
            to: email,
            subject: 'Confirm your Driplo account',
            html
        });

        if (!emailSent) {
            return json({ error: 'Failed to send confirmation email' }, { status: 500 });
        }

        return json({ success: true });
    } catch (err) {
        console.error('Error in send-confirmation endpoint:', err);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};