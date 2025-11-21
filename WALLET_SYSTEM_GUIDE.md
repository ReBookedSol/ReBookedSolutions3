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

#### Route A: Seller HAS Banking Details (Direct Payout) ✅
When a buyer confirms delivery (clicks "Yes, I received it"):

1. System checks if seller has **active banking details**
2. If YES → Seller receives direct bank transfer
   - Email sent: "Payment on the way" notification
   - **No wallet credit is created**
   - Money sent directly to registered bank account
   - Fast, automatic processing

**Timeline:**
- Buyer confirms delivery → "Payment on the way" email sent
- Platform processes → Direct bank transfer initiated
- Seller receives payment within 24-48 hours

#### Route B: Seller NO Banking Details (Wallet Fallback) ✅
When a buyer confirms delivery but seller has no banking details:

1. System checks banking_subaccounts table
2. If NO active banking details → Payment is **added to wallet as credit**
   - Credit added to `available_balance` in user_wallets
   - Type: `credit` in wallet_transactions
   - Status: `completed`
   - Visible in Profile → Settings → Banking Information (Wallet section)

**Next Steps for Seller:**
- **Option 1**: Set up banking details later → Request payout from wallet balance
- **Option 2**: Keep credit in wallet for future use
- **Option 3**: Use wallet balance towards future purchases

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

## Listing Requirements

**Banking is now optional!** Sellers only need:
- ✅ **Pickup Address** (required for book collection and delivery)
- ⚠️ Banking Details (optional - use wallet as fallback)

## Seller Experience Timeline

### Seller WITH Banking Setup (Recommended):
```
1. Add pickup address ✓
2. Set up banking details ✓
3. List books
4. Buyer purchases and confirms delivery
   → Payment sent directly to seller's bank account within 24-48 hours
5. Seller receives payment with no extra steps
```

### Seller WITHOUT Banking Setup (Use Wallet):
```
1. Add pickup address ✓
2. List books (no banking required!)
3. Buyer purchases and confirms delivery
   → Money added to seller's wallet immediately
4. Seller can either:
   a) Set up banking → Request payout from wallet
   b) Keep balance in wallet for future use
   c) Use wallet credit towards future purchases
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

**Issue**: Seller cannot create a listing
- Check: Does seller have a pickup address? (Required)
- Solution: Go to Profile → Addresses tab → Add pickup address
- Note: Banking details are optional

**Issue**: Seller not receiving payment after buyer confirmed delivery
- Check 1: Does seller have active banking details? (`banking_subaccounts.status='active'`)
  - If YES: Email "Payment on the way" should be sent. Payment goes directly to bank account.
  - If NO: Money should appear in wallet. Check Profile → Settings → Banking Information (Wallet section).
- Check 2: Verify order was actually marked as received by buyer (check delivery_status = 'delivered' or 'collected')
- Check 3: Check `wallet_transactions` table for credit entries with matching `reference_order_id`

**Issue**: Seller wants to switch from wallet to direct bank transfer
- Solution: Set up banking details in Profile → Settings → Banking Information
- Once banking status is 'active', next orders will trigger direct bank transfers
- Previous wallet credits can be withdrawn via payout request in wallet

**Issue**: Seller has wallet credit but no banking setup
- This is normal! The wallet is the fallback payment system.
- Seller can:
  - Keep the balance in wallet indefinitely
  - Set up banking to request payout
  - Use wallet for future transactions

**Issue**: Banking setup failed or stuck on 'pending'
- Check: Is Paystack integration working?
- Check: Did seller complete all required banking fields?
- Solution: Delete banking details and try setup again
- Fallback: Use wallet system in the meantime
