-- Add profile setup tracking fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_started_at timestamptz,
ADD COLUMN IF NOT EXISTS setup_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS avatar_style text DEFAULT 'avataaars',
ADD COLUMN IF NOT EXISTS avatar_seed text,
ADD COLUMN IF NOT EXISTS custom_avatar_url text;

-- Create profile setup progress tracking
CREATE TABLE IF NOT EXISTS profile_setup_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    step_name text NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamptz,
    data jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, step_name)
);

-- Create brand verification requests table
CREATE TABLE IF NOT EXISTS brand_verification_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    brand_name text NOT NULL,
    brand_category text NOT NULL,
    business_registration_number text,
    tax_id text,
    documents jsonb DEFAULT '[]',
    social_media_accounts jsonb DEFAULT '{}',
    verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
    admin_notes text,
    reviewed_by uuid REFERENCES auth.users(id),
    reviewed_at timestamptz,
    submitted_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create social media accounts table
CREATE TABLE IF NOT EXISTS social_media_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'twitter', 'youtube', 'pinterest', 'website')),
    username text NOT NULL,
    url text,
    is_verified boolean DEFAULT false,
    verification_data jsonb,
    followers_count integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, platform)
);

-- Create admin approvals tracking table
CREATE TABLE IF NOT EXISTS admin_approvals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type text NOT NULL CHECK (request_type IN ('brand_verification', 'product_approval', 'user_ban')),
    request_id uuid NOT NULL,
    admin_id uuid REFERENCES auth.users(id) NOT NULL,
    action text NOT NULL CHECK (action IN ('approve', 'reject', 'request_info')),
    notes text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_setup_progress_user_id ON profile_setup_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_verification_status ON brand_verification_requests(verification_status);
CREATE INDEX IF NOT EXISTS idx_social_media_user_id ON social_media_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_request ON admin_approvals(request_type, request_id);

-- Update profiles table to add brand categories
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS brand_size text CHECK (brand_size IN ('individual', 'small', 'medium', 'large', 'enterprise'));

-- Create RLS policies for profile_setup_progress
ALTER TABLE profile_setup_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own setup progress" ON profile_setup_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own setup progress" ON profile_setup_progress
    FOR INSERT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own setup progress" ON profile_setup_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for brand_verification_requests
ALTER TABLE brand_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand requests" ON brand_verification_requests
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can create brand requests" ON brand_verification_requests
    FOR INSERT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending requests" ON brand_verification_requests
    FOR UPDATE USING (auth.uid() = user_id AND verification_status = 'pending');

CREATE POLICY "Admins can update any brand request" ON brand_verification_requests
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create RLS policies for social_media_accounts
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view social media accounts" ON social_media_accounts
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own social accounts" ON social_media_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for admin_approvals
ALTER TABLE admin_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view approvals" ON admin_approvals
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Only admins can create approvals" ON admin_approvals
    FOR INSERT USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create function to check if profile setup is complete
CREATE OR REPLACE FUNCTION is_profile_setup_complete(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND setup_completed = true
        AND username IS NOT NULL
        AND (account_type = 'personal' OR 
             (account_type = 'brand' AND EXISTS (
                SELECT 1 FROM brand_verification_requests 
                WHERE brand_verification_requests.user_id = user_id 
                AND verification_status = 'approved'
             )))
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get top brands
CREATE OR REPLACE FUNCTION get_top_brands(limit_count integer DEFAULT 10)
RETURNS TABLE (
    user_id uuid,
    username text,
    avatar_url text,
    brand_name text,
    brand_description text,
    brand_logo_url text,
    total_sales integer,
    seller_rating numeric,
    seller_rating_count integer,
    is_verified boolean,
    badges text[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.username,
        COALESCE(p.avatar_url, p.custom_avatar_url) as avatar_url,
        p.brand_name,
        p.brand_description,
        p.brand_logo_url,
        p.total_sales,
        p.seller_rating,
        p.seller_rating_count,
        p.is_verified,
        p.badges
    FROM profiles p
    WHERE p.account_type = 'brand'
    AND p.is_verified = true
    AND EXISTS (
        SELECT 1 FROM brand_verification_requests bvr
        WHERE bvr.user_id = p.id
        AND bvr.verification_status = 'approved'
    )
    ORDER BY 
        p.total_sales DESC,
        p.seller_rating DESC,
        p.seller_rating_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update setup completion
CREATE OR REPLACE FUNCTION update_setup_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if all required steps are completed
    IF NEW.step_name IN ('avatar_selected', 'profile_info_completed', 'account_type_selected') THEN
        -- Check if all basic steps are done
        IF EXISTS (
            SELECT 1 FROM profile_setup_progress
            WHERE user_id = NEW.user_id
            AND step_name = 'avatar_selected'
            AND completed = true
        ) AND EXISTS (
            SELECT 1 FROM profile_setup_progress
            WHERE user_id = NEW.user_id
            AND step_name = 'profile_info_completed'
            AND completed = true
        ) THEN
            -- Update profile setup_completed
            UPDATE profiles 
            SET setup_completed = true,
                setup_completed_at = now()
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_setup_completion
AFTER INSERT OR UPDATE ON profile_setup_progress
FOR EACH ROW
EXECUTE FUNCTION update_setup_completion();

-- Add updated_at triggers
CREATE TRIGGER update_profile_setup_progress_updated_at BEFORE UPDATE ON profile_setup_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_verification_requests_updated_at BEFORE UPDATE ON brand_verification_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_media_accounts_updated_at BEFORE UPDATE ON social_media_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();