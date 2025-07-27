-- Add missing columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS refund_amount integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_charge_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_charge_id ON transactions(stripe_charge_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);

-- Add stripe_transfer_id and paid_at to seller_payouts if missing
ALTER TABLE seller_payouts
ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Add index for stripe_transfer_id
CREATE INDEX IF NOT EXISTS idx_seller_payouts_stripe_transfer_id ON seller_payouts(stripe_transfer_id);