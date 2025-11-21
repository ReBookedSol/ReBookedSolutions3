# Wallet System Guide

## Overview

The wallet system is a payment processing mechanism that automatically handles seller earnings when buyers confirm order delivery. **Banking details are now optional** — sellers can list books and receive payments through the wallet system even without setting up banking details.

## How It Works

### 1. Order Payment Breakdown
When a buyer purchases a book:
- **Order Amount**: Total price paid by buyer (in ZAR)
- **Platform Fee**: 10% (ReBooked Solutions commission)
- **Seller Earnings**: 90% (amount available to seller)

Example:
- Book price: R100
- Platform gets: R10
- Seller gets: R90

### 2. Seller Payment Path - Two Routes

#### Route A: Seller HAS Banking Details ✅
When a buyer confirms delivery (clicks "Yes, I received it"):

1. System checks if seller has **active banking details** set up
2. If YES:
   - Email sent: "Payment on the way" notification to seller
   - **No wallet credit is added**
   - Money will be sent directly to their registered bank account
   - No additional database entries needed

**Timeline:**
- Buyer confirms delivery → "Payment on the way" email sent
- Platform processes → Money sent directly to seller's bank account
- Seller receives payment directly (no wallet step needed)

#### Route B: Seller NO Banking Details ⚠️
When a buyer confirms delivery but seller has no banking details:

1. System checks banking_subaccounts table
2. If NO active banking details → Payment is **added to wallet as credit**
   - Credit is added to `available_balance` in user_wallets
   - Type: `credit` in wallet_transactions
   - Status: `completed`

**Next Steps for Seller:**
- Seller sees credit in their Wallet tab
- Seller can now either:
  - **Option 1**: Set up banking details → Request payout from wallet
  - **Option 2**: Keep credit in wallet for future use

### 3. Payment States in Database

#### Wallet Transactions Types:
- `credit` → Money added to wallet (only when seller has NO banking details)
- `debit` → Money withdrawn from wallet (payout)
- `hold` → Money temporarily held
- `release` → Held money released

#### Banking Subaccounts Status:
- `active` → Verified banking details, ready for direct bank transfers
- `pending` → Banking details submitted, waiting verification
- `inactive` → Disabled or not set up

**Note:** When seller has active banking details, NO transaction record is created. The email notification is sent, and payment is processed externally to the wallet system.

### 4. Key Transaction Points

**When Buyer Marks Order Received:**
```
Order Received
    ↓
Check: Does seller have ACTIVE banking details?
    ├─ YES → Send "Payment on the way" email
    │         NO wallet entry created
    │         Money goes directly to bank account
    │
    └─ NO → Add credit to wallet (fallback)
            Transaction: type='credit', status='completed'
            Available Balance increases
```

**When Seller Has Balance:**
```
Seller Wallet Balance
    ├─ Available Balance (can withdraw)
    ├─ Pending Balance (being processed)
    └─ Total Earned (all-time earnings)
```

### 5. Payout Flow (When Seller Requests Withdrawal)

1. Seller goes to Wallet tab
2. Clicks "Request Payout"
3. System checks available balance
4. Creates payout_request record
5. Platform approves/processes
6. Money transferred to seller's account via integrated payment provider

## Database Schema Overview

### user_wallets table
```
- user_id (seller ID)
- available_balance (can withdraw)
- pending_balance (processing)
- total_earned (all-time)
```

### wallet_transactions table
```
- id
- user_id (seller)
- type (credit/debit/hold/release/scheduled_bank_transfer)
- amount (in cents)
- reason (description)
- reference_order_id (which order)
- status (pending/completed)
- created_at
```

### banking_subaccounts table
```
- id
- user_id (seller)
- subaccount_code (payment provider ID)
- status (active/pending/inactive)
- business_name
- encrypted_bank_details
```

## Seller Experience Timeline

### Seller WITH Banking Setup:
```
1. Seller sets up banking details ✓
2. Buyer purchases book
3. Buyer confirms delivery
   → Platform schedules bank transfer
   → Money automatically sent to seller's bank account within 24-48 hours
4. Seller receives payment directly (no extra steps)
```

### Seller WITHOUT Banking Setup:
```
1. Seller lists book (no banking required yet)
2. Buyer purchases book
3. Buyer confirms delivery
   → Money added to seller's wallet
4. Seller can now either:
   a) Set up banking → Request payout from wallet
   b) Keep in wallet for future purchases or transfers
```

## For Platform Admin

### Monitor Payments:
- Check `wallet_transactions` table for transaction status
- Filter by type to see wallet credits: `type='credit'` - these are payments to sellers without banking
- Check `banking_subaccounts` for seller banking verification status
  - `status='active'` → Seller receiving direct bank transfers (no wallet entries created)
  - `status='pending'` → Seller banking being verified, payments going to wallet until verified
  - `status='inactive'` → Seller banking disabled, payments going to wallet

### Audit Trail:
- Sellers with banking details: Check email logs for "Payment on the way" notifications (no database entries for these transactions)
- Sellers without banking: Check wallet_transactions with `type='credit'` and `reference_order_id`

### Common Scenarios:

**Seller requests payout but has no banking setup:**
- System will prevent payout request
- Guide seller to set up banking details first

**Seller updates banking details after order received:**
- Next orders will use direct bank transfer
- Existing wallet credits remain (seller can request payout)

**Seller wants to switch from wallet to direct bank transfer:**
- Set up banking details
- Next order will use direct transfer
- Previous wallet credits: seller can request payout

## Security Notes

- Banking details are **encrypted** in transit and at rest
- Sensitive fields stored in `encrypted_*` columns
- Decryption only happens server-side via edge functions
- Wallet transactions create immutable audit trail
- All amounts stored in cents (multiply by 100 to avoid decimals)

## Troubleshooting

**Issue**: Seller not receiving payment after buyer confirmed delivery
- Check: Does seller have active banking details? (`banking_subaccounts.status='active'`)
- If YES: Email should have been sent with "Payment on the way" message. Check email logs and check if order was marked as received.
- If NO: Money should be in wallet. Check `wallet_transactions` table for credit entries with `reference_order_id`.

**Issue**: Payment added to wallet but seller has banking details
- This shouldn't happen. Verify that `banking_subaccounts.status` is actually 'active' (not 'pending' or 'inactive')
- Check if banking details were set up AFTER order was received (only applies to new orders)

**Issue**: Seller has wallet credit but wants direct bank transfer going forward
- Solution: Seller sets up banking details (or updates if pending)
- Verify status becomes 'active'
- Next orders will send email instead of adding wallet credit
- Previous credits can be withdrawn via payout request

**Issue**: Banking setup failed
- Check: Is banking_subaccounts table accessible?
- Check: Did payment provider (Paystack) subaccount validation pass?
- Check: Is seller profile verified?
- If banking status is 'pending', it hasn't been verified yet - payments will go to wallet
