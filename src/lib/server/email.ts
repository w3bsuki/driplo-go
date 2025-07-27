import type { Database } from '$lib/types/database.types';
import { truncateText } from '$lib/utils/format';
import { logger } from '$lib/services/logger';

// Environment variable import with fallback
let RESEND_API_KEY = '';
if (typeof process !== 'undefined' && process.env['RESEND_API_KEY']) {
  RESEND_API_KEY = process.env['RESEND_API_KEY'];
}

type Profile = Database['public']['Tables']['profiles']['Row'];
type Listing = Database['public']['Tables']['listings']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Email service using Resend API
class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = RESEND_API_KEY || '';
    this.fromEmail = 'Driplo <noreply@driplo.com>';
    this.baseUrl = 'https://api.resend.com';
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      logger.error('Email service not configured: Missing RESEND_API_KEY');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: options.from || this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html
        })
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Failed to send email:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Email send error:', error);
      return false;
    }
  }

  // Buyer email notifications
  async sendPaymentConfirmation(
    buyer: Profile,
    listing: Listing,
    transaction: Transaction
  ): Promise<boolean> {
    const subject = 'Payment Confirmed - Your Order on Driplo';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${buyer.username || 'there'},</p>
              <p>Your payment has been successfully processed for:</p>
              
              <div class="order-details">
                <h3>${listing.title}</h3>
                <p><strong>Order ID:</strong> ${transaction.id}</p>
                <p><strong>Amount:</strong> $${(transaction.amount / 100).toFixed(2)}</p>
                <p><strong>Status:</strong> Paid</p>
              </div>
              
              <p>The seller has been notified and will ship your item soon. You'll receive another email with tracking information once it's shipped.</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://driplo.com/orders" class="button">View Order</a>
              </p>
            </div>
            <div class="footer">
              <p>Thank you for shopping on Driplo!</p>
              <p>If you have any questions, please contact support@driplo.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: buyer.email!,
      subject,
      html
    });
  }

  async sendShippingUpdate(
    buyer: Profile,
    listing: Listing,
    trackingNumber?: string
  ): Promise<boolean> {
    const subject = 'Your Order Has Been Shipped - Driplo';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .tracking-info { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #10B981; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Order Has Been Shipped!</h1>
            </div>
            <div class="content">
              <p>Hi ${buyer.username || 'there'},</p>
              <p>Great news! Your order has been shipped:</p>
              
              <div class="tracking-info">
                <h3>${listing.title}</h3>
                ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
                <p>You should receive your item within 3-7 business days.</p>
              </div>
              
              <p>You can track your package using the tracking number above.</p>
            </div>
            <div class="footer">
              <p>Thank you for shopping on Driplo!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: buyer.email!,
      subject,
      html
    });
  }

  async sendRefundNotification(
    buyer: Profile,
    listing: Listing,
    refundAmount: number,
    isFullRefund: boolean
  ): Promise<boolean> {
    const subject = `Refund ${isFullRefund ? 'Processed' : 'Partially Processed'} - Driplo`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .refund-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Refund Processed</h1>
            </div>
            <div class="content">
              <p>Hi ${buyer.username || 'there'},</p>
              <p>Your refund has been processed:</p>
              
              <div class="refund-details">
                <h3>${listing.title}</h3>
                <p><strong>Refund Amount:</strong> $${(refundAmount / 100).toFixed(2)}</p>
                <p><strong>Type:</strong> ${isFullRefund ? 'Full Refund' : 'Partial Refund'}</p>
              </div>
              
              <p>The refund should appear in your account within 5-10 business days, depending on your bank.</p>
            </div>
            <div class="footer">
              <p>If you have any questions, please contact support@driplo.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: buyer.email!,
      subject,
      html
    });
  }

  // Seller email notifications
  async sendSaleConfirmation(
    seller: Profile,
    buyer: Profile,
    listing: Listing,
    transaction: Transaction
  ): Promise<boolean> {
    const sellerAmount = transaction.amount * 0.9; // 90% after 10% platform fee
    const subject = 'You Made a Sale! - Driplo';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .sale-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .action-required { background-color: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Congratulations! You Made a Sale!</h1>
            </div>
            <div class="content">
              <p>Hi ${seller.username || 'there'},</p>
              <p>Great news! Your item has been sold:</p>
              
              <div class="sale-details">
                <h3>${listing.title}</h3>
                <p><strong>Buyer:</strong> ${buyer.username}</p>
                <p><strong>Sale Price:</strong> $${(transaction.amount / 100).toFixed(2)}</p>
                <p><strong>Your Earnings:</strong> $${(sellerAmount / 100).toFixed(2)} (after 10% platform fee)</p>
              </div>
              
              <div class="action-required">
                <h3>⚠️ Action Required</h3>
                <p>Please ship the item within 3 business days. Don't forget to add tracking information!</p>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://driplo.com/orders" class="button">View Order Details</a>
              </p>
            </div>
            <div class="footer">
              <p>Thank you for selling on Driplo!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: seller.email!,
      subject,
      html
    });
  }

  async sendPayoutNotification(
    seller: Profile,
    payoutAmount: number,
    status: 'processing' | 'completed'
  ): Promise<boolean> {
    const subject = status === 'completed' 
      ? 'Payout Completed - Driplo' 
      : 'Payout Processing - Driplo';
    
    const statusMessage = status === 'completed'
      ? 'Your payout has been completed and should be in your account within 1-2 business days.'
      : 'Your payout is being processed and will be in your account soon.';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .payout-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payout ${status === 'completed' ? 'Completed' : 'Processing'}</h1>
            </div>
            <div class="content">
              <p>Hi ${seller.username || 'there'},</p>
              <p>${statusMessage}</p>
              
              <div class="payout-details">
                <h3>Payout Details</h3>
                <p><strong>Amount:</strong> $${(payoutAmount / 100).toFixed(2)}</p>
                <p><strong>Status:</strong> ${status === 'completed' ? 'Completed ✓' : 'Processing...'}</p>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for selling on Driplo!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: seller.email!,
      subject,
      html
    });
  }

  async sendDisputeAlert(
    seller: Profile,
    listing: Listing,
    transaction: Transaction
  ): Promise<boolean> {
    const subject = 'Urgent: Payment Dispute - Action Required';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .dispute-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #EF4444; }
            .action-required { background-color: #FEE2E2; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Dispute Alert</h1>
            </div>
            <div class="content">
              <p>Hi ${seller.username || 'there'},</p>
              <p>A buyer has disputed a payment for one of your sales:</p>
              
              <div class="dispute-details">
                <h3>${listing.title}</h3>
                <p><strong>Order ID:</strong> ${transaction.id}</p>
                <p><strong>Amount:</strong> $${(transaction.amount / 100).toFixed(2)}</p>
              </div>
              
              <div class="action-required">
                <h3>⚠️ Action Required</h3>
                <p>Your payout for this transaction has been put on hold. Please provide any relevant information to help resolve this dispute:</p>
                <ul>
                  <li>Proof of shipment / tracking information</li>
                  <li>Photos of the item before shipping</li>
                  <li>Any communication with the buyer</li>
                </ul>
              </div>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://driplo.com/orders/${transaction.id}" class="button">View Dispute Details</a>
              </p>
            </div>
            <div class="footer">
              <p>Please respond within 48 hours to avoid automatic refund.</p>
              <p>Contact support@driplo.com if you need assistance.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to: seller.email!,
      subject,
      html
    });
  }

  async sendMessageNotification(
    recipient: Profile,
    sender: Profile,
    listing: Listing,
    messageText: string,
    conversationId: string
  ): Promise<boolean> {
    const subject = `New Message from ${sender.username} about ${listing.title}`;
    const truncatedMessage = truncateText(messageText, 103);
    
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px; }
            .content { line-height: 1.6; color: #333; }
            .message-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0; }
            .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 New Message</h1>
            </div>
            <div class="content">
              <p>Hello ${recipient.full_name || recipient.username},</p>
              <p>You have a new message from <strong>${sender.username}</strong> about your listing <strong>${listing.title}</strong>:</p>
              
              <div class="message-box">
                <p><strong>Message:</strong></p>
                <p>"${truncatedMessage}"</p>
              </div>
              
              <p>Click the button below to view the full conversation and reply:</p>
              <a href="https://driplo.com/messages/${conversationId}" class="button">View Message</a>
              
              <p>Don't want to receive these notifications? You can adjust your email preferences in your account settings.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Driplo Team</p>
              <p>Need help? Contact us at support@driplo.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.send({
      to: recipient.email,
      subject,
      html
    });
  }

  async sendRefundRequestNotification(
    seller: Profile,
    buyer: Profile,
    order: any,
    refundRequest: any
  ): Promise<boolean> {
    const subject = `Refund Request - Order #${order.id}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .refund-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Refund Request Received</h1>
            </div>
            <div class="content">
              <p>Hi ${seller.username || 'there'},</p>
              <p>You have received a refund request from ${buyer.username || 'a buyer'} for order #${order.id}.</p>
              
              <div class="refund-details">
                <h3>Refund Details</h3>
                <p><strong>Refund Amount:</strong> $${(refundRequest.amount / 100).toFixed(2)}</p>
                <p><strong>Refund Type:</strong> ${refundRequest.refund_type}</p>
                <p><strong>Reason:</strong> ${refundRequest.reason}</p>
                <p><strong>Requested On:</strong> ${new Date(refundRequest.created_at).toLocaleDateString()}</p>
              </div>
              
              <p>Please review the request and respond within 3 business days.</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://driplo.com/orders/${order.id}" class="button">View Order Details</a>
              </p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Driplo Team</p>
              <p>Need help? Contact us at support@driplo.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.send({
      to: seller.email!,
      subject,
      html
    });
  }

  async sendRefundApprovalNotification(
    buyer: Profile,
    order: any,
    refundRequest: any
  ): Promise<boolean> {
    const subject = `Refund Approved - Order #${order.id}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .refund-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Refund Approved!</h1>
            </div>
            <div class="content">
              <p>Hi ${buyer.username || 'there'},</p>
              <p>Great news! Your refund request for order #${order.id} has been approved.</p>
              
              <div class="refund-details">
                <h3>Refund Details</h3>
                <p><strong>Refund Amount:</strong> $${(refundRequest.amount / 100).toFixed(2)}</p>
                <p><strong>Refund Type:</strong> ${refundRequest.refund_type}</p>
                <p><strong>Processing Time:</strong> 5-10 business days</p>
              </div>
              
              <p>The refund is being processed and will appear in your account within 5-10 business days.</p>
              <p>Thank you for your patience.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Driplo Team</p>
              <p>Need help? Contact us at support@driplo.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.send({
      to: buyer.email!,
      subject,
      html
    });
  }

  async sendRefundRejectionNotification(
    buyer: Profile,
    order: any,
    refundRequest: any
  ): Promise<boolean> {
    const subject = `Refund Request Update - Order #${order.id}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .response-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Refund Request Update</h1>
            </div>
            <div class="content">
              <p>Hi ${buyer.username || 'there'},</p>
              <p>Unfortunately, your refund request for order #${order.id} has been declined.</p>
              
              <div class="response-details">
                <h3>Seller Response</h3>
                <p>${refundRequest.seller_response || 'No additional details provided'}</p>
              </div>
              
              <p>If you believe this decision is incorrect, please contact our support team for further assistance.</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://driplo.com/support" class="button">Contact Support</a>
              </p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The Driplo Team</p>
              <p>Need help? Contact us at support@driplo.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.send({
      to: buyer.email!,
      subject,
      html
    });
  }
}

export const emailService = new EmailService();