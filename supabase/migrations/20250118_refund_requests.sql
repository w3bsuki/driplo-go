-- Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    reason TEXT NOT NULL,
    refund_type VARCHAR(20) NOT NULL DEFAULT 'full' CHECK (refund_type IN ('full', 'partial')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'failed')),
    seller_response TEXT,
    seller_response_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    admin_processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    admin_processed_at TIMESTAMP WITH TIME ZONE,
    stripe_refund_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_refund_requests_order_id ON refund_requests(order_id);
CREATE INDEX idx_refund_requests_buyer_id ON refund_requests(buyer_id);
CREATE INDEX idx_refund_requests_seller_id ON refund_requests(seller_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);
CREATE INDEX idx_refund_requests_created_at ON refund_requests(created_at);

-- Enable RLS
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own refund requests"
    ON refund_requests FOR SELECT
    USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyers can create refund requests"
    ON refund_requests FOR INSERT
    WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Sellers can update their refund requests"
    ON refund_requests FOR UPDATE
    USING (seller_id = auth.uid())
    WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins can view all refund requests"
    ON refund_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all refund requests"
    ON refund_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_refund_requests_updated_at
    BEFORE UPDATE ON refund_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_refund_requests_updated_at();

-- Add refund_requested status to orders if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'orders_status_check'
        AND check_clause LIKE '%refund_requested%'
    ) THEN
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
        ALTER TABLE orders ADD CONSTRAINT orders_status_check 
            CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'refund_requested'));
    END IF;
END $$;