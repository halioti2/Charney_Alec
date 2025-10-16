# Payment Tab User Journey Documentation

## Overview
This document outlines the user journey and workflow for the Payment Tab in the Charney Commission Tracker system. The payment system is designed for real estate brokerages to manage commission payments to their sales agents.

## Primary Users
- **Brokers/Admins**: Full access to all payment functions
- **Coordinators**: Full access to all payment functions  
- **Agents**: Separate login system (future feature) - will have read-only access to their own payment status

## Main User Goals
1. **Schedule New Commission Payouts** - Process pending commission payments to agents
2. **Review Payment History** - Track completed payments and their status
3. **Handle Failed Payments** - Resolve payment issues and retry failed transactions

---

## User Journey Flows

### Flow 1: Processing New Payments (Primary Workflow)

**Scenario**: Broker needs to process weekly commission payments to agents

```
1. User opens Payment Tab
   ↓
2. Reviews "Payout Queue" Tab
   - Views list of pending commission payments
   - Sees agent names, commission amounts, deal details
   - Uses filters (agent, amount range, date range) if needed
   ↓
3. Selects Payments to Process
   - Individual checkbox selection OR bulk "Select All"
   - Running total updates dynamically
   - Reviews payment summary panel
   ↓
4. Clicks "Schedule Payout" Button
   ↓
5. Confirmation Modal Appears
   - Reviews selected payments and total amount
   - Confirms bank account information
   - Verifies ACH processing details
   ↓
6. Confirms Payment Processing
   - Success: Payments move to "Payment History" with "Processing" status
   - Failure: Payments move to "Requires Attention" queue
   ↓
7. Receives Confirmation
   - Success banner with payment batch ID
   - Email notification sent (future feature)
```

### Flow 2: Reviewing Payment Status

**Scenario**: Coordinator needs to check status of recent payments

```
1. User opens Payment Tab
   ↓
2. Clicks "Payment History" Tab
   - Views chronological list of all processed payments
   - Sees payment status (Processing, Paid, Failed)
   - Reviews ACH reference numbers and dates
   ↓
3. Uses Filters (Optional)
   - Filter by status (Paid, Processing, Failed)
   - Filter by date range
   - Filter by specific agent
   ↓
4. Reviews Payment Details
   - Click on payment row for detailed view
   - See transaction ID, bank details, timestamps
   - Export payment records (future feature)
   ↓
5. Takes Action if Needed
   - Contact agent about payment status
   - Investigate failed payments
   - Generate reports for accounting
```

### Flow 3: Handling Payment Issues

**Scenario**: Payment failures need immediate attention

```
1. User sees "Payout Failure Banner" (appears when failures exist)
   - Red alert banner at top of payment tab
   - Shows count of failed payments
   ↓
2. Clicks "View Details" or "Requires Attention" Tab
   ↓
3. Reviews Failed Payments Queue
   - Sees list of failed payments with severity indicators
   - Reviews failure reasons (insufficient funds, invalid account, etc.)
   - Identifies high/medium/low priority issues
   ↓
4. Investigates Individual Failures
   - Click on payment row for detailed error information
   - Review agent bank account details
   - Check transaction logs
   ↓
5. Takes Corrective Action
   - Update agent bank account information
   - Retry payment with corrected details
   - Contact agent for updated banking info
   - Escalate to bank or payment processor
   ↓
6. Re-processes or Escalates
   - Retry individual payments
   - Bulk retry all corrected payments
   - Document issues for future prevention
```

---

## Component Mapping

### Current Payment Tab Components:
- **PayoutQueue.jsx** - Handles Flow 1 (Processing New Payments)
- **PaymentHistory.jsx** - Handles Flow 2 (Reviewing Payment Status)  
- **RequiresAttentionQueue.jsx** - Handles Flow 3 (Payment Issues)
- **PayoutFailureBanner.jsx** - Alert system for Flow 3
- **SchedulePayoutModal.jsx** - Confirmation step in Flow 1

---

## Business Rules & Assumptions

### Current Assumptions:
- Commissions are calculated after real estate deal closing
- Payments are processed in batches (weekly/bi-weekly schedule)
- Failed payments require manual intervention and correction
- Audit trail is maintained for compliance and accounting
- ACH is the primary payment method

### Questions for Client Validation:
1. **Approval Process**: Do payments need manager approval before processing?
2. **Batch Timing**: What's the preferred payment schedule (daily/weekly/bi-weekly)?
3. **Payment Methods**: ACH only, or also checks/wire transfers?
4. **Minimum Thresholds**: Any minimum payout amounts?
5. **Tax Handling**: Any tax withholding or 1099 requirements?
6. **Failure Protocols**: Standard procedures for payment failures?

---

## Future Enhancements

### Agent Portal (Separate System):
- Individual agent login system
- Read-only view of personal payment history
- Commission calculation transparency
- Payment status notifications

### Advanced Features:
- Email notifications for payment status
- Automated retry logic for failed payments
- Integration with accounting systems
- Advanced reporting and analytics
- Mobile-responsive design for field access

---

## Technical Implementation Notes

### Service Layer:
- **PaymentsMockService.ts** - Simulates Supabase API calls
- **usePaymentsAPI.ts** - React hooks for payment operations

### Database Schema:
- Uses existing Supabase 14-table architecture
- Key tables: commission_payouts, payout_batches, payout_failures, agents

### Styling Standards:
- Follows broker/coordinator tab styling patterns
- Rectangular buttons, no emojis, consistent typography
- Professional table headers and responsive design

---

*Document created: October 2025*  
*Last updated: October 2025*  
*Created by: Erica (feature/erica branch)*
