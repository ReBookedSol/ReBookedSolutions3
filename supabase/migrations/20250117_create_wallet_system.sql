-- ============================================
-- WALLET SYSTEM MIGRATION
-- ============================================

-- ============================================
-- 1. USER WALLETS TABLE (balance tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    available_balance BIGINT DEFAULT 0,
    pending_balance BIGINT DEFAULT 0,
    total_earned BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
    ON public.user_wallets
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own wallet"
    ON public.user_wallets
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all wallets"
    ON public.user_wallets
    FOR ALL
    USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER user_wallets_updated_at
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_wallets_updated_at();


-- ============================================
-- 2. WALLET TRANSACTIONS TABLE (ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount BIGINT NOT NULL,
    reason VARCHAR(255),
    reference_order_id UUID,
    reference_payout_id UUID,
    status VARCHAR(50) DEFAULT 'completed',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order_id ON wallet_transactions(reference_order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet transactions"
    ON public.wallet_transactions
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all transactions"
    ON public.wallet_transactions
    FOR ALL
    USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_wallet_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_transactions_updated_at ON public.wallet_transactions;
CREATE TRIGGER wallet_transactions_updated_at
    BEFORE UPDATE ON public.wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_transactions_updated_at();


-- ============================================
-- 3. PAYOUT REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallet_payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_payout_requests_user_id ON wallet_payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_payout_requests_status ON wallet_payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_payout_requests_requested_at ON wallet_payout_requests(requested_at);

ALTER TABLE public.wallet_payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payouts"
    ON public.wallet_payout_requests
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create payout requests"
    ON public.wallet_payout_requests
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all payouts"
    ON public.wallet_payout_requests
    FOR ALL
    USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_wallet_payout_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_payout_requests_updated_at ON public.wallet_payout_requests;
CREATE TRIGGER wallet_payout_requests_updated_at
    BEFORE UPDATE ON public.wallet_payout_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_payout_requests_updated_at();


-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to credit wallet when book is received (90% of book price)
CREATE OR REPLACE FUNCTION credit_wallet_on_collection(
    p_seller_id UUID,
    p_order_id UUID,
    p_book_price BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_amount_to_credit BIGINT;
BEGIN
    -- Calculate 90% of book price (already in cents)
    v_amount_to_credit := (p_book_price * 90) / 100;

    -- Ensure wallet exists or create it
    INSERT INTO user_wallets (user_id, available_balance, total_earned)
    VALUES (p_seller_id, v_amount_to_credit, v_amount_to_credit)
    ON CONFLICT (user_id) DO UPDATE
    SET available_balance = user_wallets.available_balance + v_amount_to_credit,
        total_earned = user_wallets.total_earned + v_amount_to_credit;

    -- Log transaction
    INSERT INTO wallet_transactions (
        user_id, type, amount, reason, reference_order_id, status
    ) VALUES (
        p_seller_id, 'credit', v_amount_to_credit, 'Book received', p_order_id, 'completed'
    );

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;


-- Function to create payout request
CREATE OR REPLACE FUNCTION create_wallet_payout_request(
    p_user_id UUID,
    p_amount BIGINT
)
RETURNS UUID AS $$
DECLARE
    v_payout_id UUID;
    v_available_balance BIGINT;
BEGIN
    -- Check available balance
    SELECT available_balance INTO v_available_balance
    FROM user_wallets
    WHERE user_id = p_user_id;

    IF v_available_balance IS NULL OR v_available_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Create payout request
    INSERT INTO wallet_payout_requests (user_id, amount, status)
    VALUES (p_user_id, p_amount, 'pending')
    RETURNING id INTO v_payout_id;

    -- Deduct from available balance (move to pending)
    UPDATE user_wallets
    SET available_balance = available_balance - p_amount,
        pending_balance = pending_balance + p_amount
    WHERE user_id = p_user_id;

    -- Log transaction
    INSERT INTO wallet_transactions (
        user_id, type, amount, reason, reference_payout_id, status
    ) VALUES (
        p_user_id, 'debit', p_amount, 'Payout request created', v_payout_id, 'pending'
    );

    RETURN v_payout_id;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- Function to get wallet summary
CREATE OR REPLACE FUNCTION get_wallet_summary(p_user_id UUID)
RETURNS TABLE (
    available_balance BIGINT,
    pending_balance BIGINT,
    total_earned BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(uw.available_balance, 0)::BIGINT,
        COALESCE(uw.pending_balance, 0)::BIGINT,
        COALESCE(uw.total_earned, 0)::BIGINT
    FROM user_wallets uw
    WHERE uw.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;


-- Function to cancel payout request and refund balance
CREATE OR REPLACE FUNCTION cancel_wallet_payout_request(
    p_payout_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_amount BIGINT;
BEGIN
    -- Get payout details
    SELECT user_id, amount INTO v_user_id, v_amount
    FROM wallet_payout_requests
    WHERE id = p_payout_id;

    -- Refund to available balance
    UPDATE user_wallets
    SET available_balance = available_balance + v_amount,
        pending_balance = pending_balance - v_amount
    WHERE user_id = v_user_id;

    -- Update payout status
    UPDATE wallet_payout_requests
    SET status = 'cancelled'
    WHERE id = p_payout_id;

    -- Log transaction
    INSERT INTO wallet_transactions (
        user_id, type, amount, reason, reference_payout_id, status
    ) VALUES (
        v_user_id, 'credit', v_amount, 'Payout request cancelled', p_payout_id, 'completed'
    );

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
