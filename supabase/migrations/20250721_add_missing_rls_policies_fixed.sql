-- Add missing RLS policies for tables identified by security advisor

-- 1. auth_login_history policies
CREATE POLICY "Users can view own login history" ON auth_login_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert login history" ON auth_login_history
    FOR INSERT WITH CHECK (true);

-- 2. auth_sessions policies
CREATE POLICY "Users can view own sessions" ON auth_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON auth_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- 3. coupon_usage policies
CREATE POLICY "Users can view own coupon usage" ON coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage coupon usage" ON coupon_usage
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- 4. dispute_messages policies
CREATE POLICY "Users can view messages for their disputes" ON dispute_messages
    FOR SELECT USING (
        auth.uid() IN (
            SELECT initiated_by FROM disputes WHERE id = dispute_messages.dispute_id
            UNION
            SELECT respondent_id FROM disputes WHERE id = dispute_messages.dispute_id
        )
    );

CREATE POLICY "Users can send messages to their disputes" ON dispute_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        auth.uid() IN (
            SELECT initiated_by FROM disputes WHERE id = dispute_id
            UNION
            SELECT respondent_id FROM disputes WHERE id = dispute_id
        )
    );

-- 5. disputes policies
CREATE POLICY "Users can view own disputes" ON disputes
    FOR SELECT USING (
        auth.uid() = initiated_by OR auth.uid() = respondent_id
    );

CREATE POLICY "Users can create disputes" ON disputes
    FOR INSERT WITH CHECK (
        auth.uid() = initiated_by
    );

CREATE POLICY "Users can update own disputes" ON disputes
    FOR UPDATE USING (
        auth.uid() = initiated_by OR auth.uid() = respondent_id
    );

-- 6. order_status_history policies
CREATE POLICY "Users can view order status history" ON order_status_history
    FOR SELECT USING (
        auth.uid() IN (
            SELECT buyer_id FROM orders WHERE id = order_status_history.order_id
            UNION
            SELECT seller_id FROM orders WHERE id = order_status_history.order_id
        )
    );

CREATE POLICY "System can insert order status history" ON order_status_history
    FOR INSERT WITH CHECK (true);

-- 7. order_tracking policies
CREATE POLICY "Users can view order tracking" ON order_tracking
    FOR SELECT USING (
        auth.uid() IN (
            SELECT buyer_id FROM orders WHERE id = order_tracking.order_id
            UNION
            SELECT seller_id FROM orders WHERE id = order_tracking.order_id
        )
    );

CREATE POLICY "Sellers can update order tracking" ON order_tracking
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT seller_id FROM orders WHERE id = order_tracking.order_id
        )
    );

-- 8. payment_transactions policies
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT buyer_id FROM orders WHERE id = payment_transactions.order_id
            UNION
            SELECT seller_id FROM orders WHERE id = payment_transactions.order_id
        )
    );

-- 9. refund_requests policies
CREATE POLICY "Users can view refund requests" ON refund_requests
    FOR SELECT USING (
        auth.uid() IN (
            SELECT buyer_id FROM orders WHERE id = refund_requests.order_id
            UNION
            SELECT seller_id FROM orders WHERE id = refund_requests.order_id
        )
    );

CREATE POLICY "Buyers can create refund requests" ON refund_requests
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT buyer_id FROM orders WHERE id = order_id
        )
    );

-- 10. returns policies
CREATE POLICY "Users can view returns" ON returns
    FOR SELECT USING (
        auth.uid() IN (
            SELECT buyer_id FROM orders WHERE id = returns.order_id
            UNION
            SELECT seller_id FROM orders WHERE id = returns.order_id
        )
    );

CREATE POLICY "Buyers can create returns" ON returns
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT buyer_id FROM orders WHERE id = order_id
        )
    );

-- 11. seller_payouts policies
CREATE POLICY "Sellers can view own payouts" ON seller_payouts
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage payouts" ON seller_payouts
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- 12. shipping_events policies
CREATE POLICY "Users can view shipping events" ON shipping_events
    FOR SELECT USING (
        auth.uid() IN (
            SELECT o.buyer_id FROM orders o
            JOIN shipping_labels sl ON sl.order_id = o.id
            WHERE sl.id = shipping_events.shipping_label_id
            UNION
            SELECT o.seller_id FROM orders o
            JOIN shipping_labels sl ON sl.order_id = o.id
            WHERE sl.id = shipping_events.shipping_label_id
        )
    );

-- 13. shipping_labels policies
CREATE POLICY "Users can view shipping labels" ON shipping_labels
    FOR SELECT USING (
        auth.uid() IN (
            SELECT buyer_id FROM orders WHERE id = shipping_labels.order_id
            UNION
            SELECT seller_id FROM orders WHERE id = shipping_labels.order_id
        )
    );

CREATE POLICY "Sellers can create shipping labels" ON shipping_labels
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT seller_id FROM orders WHERE id = order_id
        )
    );

-- 14. store_credits policies
CREATE POLICY "Users can view own store credits" ON store_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage store credits" ON store_credits
    FOR INSERT WITH CHECK (true);

-- 15. transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT seller_id FROM orders WHERE id = transactions.order_id
        )
    );

-- 16. user_stats_summary policies
CREATE POLICY "Users can view own stats" ON user_stats_summary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view basic stats" ON user_stats_summary
    FOR SELECT USING (true);

-- Also fix the function search_path issues for brand-related functions
ALTER FUNCTION get_brand_sales_stats SET search_path = public, pg_catalog;
ALTER FUNCTION get_brand_statistics SET search_path = public, pg_catalog;