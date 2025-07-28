-- Create order status enum
CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed', 
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
    'disputed'
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    status order_status DEFAULT 'pending',
    
    -- Shipping information
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(50),
    shipping_carrier VARCHAR(50),
    tracking_number VARCHAR(100),
    shipping_label_url TEXT,
    
    -- Pricing
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
    shipping_cost INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
    tax_amount INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    
    -- Timestamps
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price INTEGER NOT NULL CHECK (price >= 0),
    total INTEGER NOT NULL CHECK (total >= 0),
    
    -- Item snapshot at time of order
    item_snapshot JSONB NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order status history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status order_status,
    to_status order_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shipping events table
CREATE TABLE IF NOT EXISTS public.shipping_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    location TEXT,
    carrier_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    initiated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution TEXT,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_listing_id ON public.order_items(listing_id);
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX idx_shipping_events_order_id ON public.shipping_events(order_id);
CREATE INDEX idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT
    USING (auth.uid() IN (buyer_id, seller_id));

CREATE POLICY "Users can create orders as buyers" ON public.orders
    FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update their orders" ON public.orders
    FOR UPDATE
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

-- RLS policies for order items
CREATE POLICY "Users can view order items for their orders" ON public.order_items
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE auth.uid() IN (buyer_id, seller_id)
        )
    );

CREATE POLICY "Users can create order items for their orders" ON public.order_items
    FOR INSERT
    WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE auth.uid() = buyer_id
        )
    );

-- RLS policies for order status history
CREATE POLICY "Users can view status history for their orders" ON public.order_status_history
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE auth.uid() IN (buyer_id, seller_id)
        )
    );

CREATE POLICY "Users can add status history for their orders" ON public.order_status_history
    FOR INSERT
    WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE auth.uid() IN (buyer_id, seller_id)
        )
    );

-- RLS policies for shipping events
CREATE POLICY "Users can view shipping events for their orders" ON public.shipping_events
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE auth.uid() IN (buyer_id, seller_id)
        )
    );

CREATE POLICY "Sellers can add shipping events" ON public.shipping_events
    FOR INSERT
    WITH CHECK (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE auth.uid() = seller_id
        )
    );

-- RLS policies for disputes
CREATE POLICY "Users can view disputes for their orders" ON public.disputes
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE auth.uid() IN (buyer_id, seller_id)
        )
    );

CREATE POLICY "Users can create disputes for their orders" ON public.disputes
    FOR INSERT
    WITH CHECK (
        auth.uid() = initiated_by AND
        order_id IN (
            SELECT id FROM public.orders 
            WHERE auth.uid() IN (buyer_id, seller_id)
        )
    );

CREATE POLICY "Users can update their own disputes" ON public.disputes
    FOR UPDATE
    USING (auth.uid() = initiated_by)
    WITH CHECK (auth.uid() = initiated_by);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate order number: DRP-YYYYMMDD-XXXX
        order_num := 'DRP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Check if already exists
        SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = order_num) INTO exists;
        
        -- Exit loop if unique
        EXIT WHEN NOT exists;
    END LOOP;
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update order status
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID,
    p_new_status order_status,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_current_status order_status;
    v_order RECORD;
BEGIN
    -- Get current order status
    SELECT status, buyer_id, seller_id INTO v_order
    FROM public.orders
    WHERE id = p_order_id;
    
    -- Check permissions
    IF p_user_id NOT IN (v_order.buyer_id, v_order.seller_id) THEN
        RAISE EXCEPTION 'Unauthorized to update this order';
    END IF;
    
    -- Insert status history
    INSERT INTO public.order_status_history (
        order_id, from_status, to_status, changed_by, reason, metadata
    ) VALUES (
        p_order_id, v_order.status, p_new_status, p_user_id, p_reason, p_metadata
    );
    
    -- Update order status and timestamps
    UPDATE public.orders
    SET 
        status = p_new_status,
        confirmed_at = CASE WHEN p_new_status = 'confirmed' THEN NOW() ELSE confirmed_at END,
        shipped_at = CASE WHEN p_new_status = 'shipped' THEN NOW() ELSE shipped_at END,
        delivered_at = CASE WHEN p_new_status = 'delivered' THEN NOW() ELSE delivered_at END,
        cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN NOW() ELSE cancelled_at END,
        refunded_at = CASE WHEN p_new_status = 'refunded' THEN NOW() ELSE refunded_at END,
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_order_status TO authenticated;
GRANT EXECUTE ON FUNCTION generate_order_number TO authenticated;

-- Create updated_at triggers
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();