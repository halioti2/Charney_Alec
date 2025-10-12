User Journey 2: Managing and Executing Payouts
Persona: Accountant 
Goal: I want to see a clear list of all approved commissions, so I can efficiently schedule and track payouts to agents and ensure everyone is paid accurately and on time.
"Happy Path" Steps:
The Accountant logs into Clarity and navigates to the "Payments Dashboard" via the main navigation.
The screen displays a clean table titled "Payout Queue," showing all broker-approved commissions. Each row has a checkbox.
The Accountant clicks the checkboxes next to several commissions they want to pay out in a batch. As they select items, a running total of the "Total Payout Amount" updates at the bottom of the table.
Once they have selected the desired batch, they click the primary "Schedule Payout" button.
A confirmation modal appears, summarizing the action: "You are about to schedule a payout for 5 transactions totaling $125,482.50. Do you want to proceed?"
The Accountant clicks the "Confirm & Schedule" button.
The modal closes, and a success notification appears in the corner: "Payout for 5 transactions has been successfully scheduled."
The paid transactions are instantly removed from the "Payout Queue" and are now visible under a separate "Payment History" tab on the same page.

Optional Automated ACH Flow (Phase 2):
- If the brokerage has connected an ACH provider (Square, Plaid, or similar), the confirmation modal includes a toggle labeled "Send immediately via ACH."
- When toggled on, the system validates that every selected transaction has verified banking details before allowing confirmation.
- After confirmation, the system calls the ACH provider and displays a follow-up toast: "ACH transfer initiated. You will be notified if any transaction fails."
- The Payment History tab marks those payouts with an "Auto-ACH" badge and records the external transaction reference so accountants can audit status later.
Key Data Fields on the "Payments" Screen:
Agent Name
Net Payout Amount ($)
Transaction ID / Property Address
Broker Approval Date
Payment Status (e.g., "Ready for Payout," "Scheduled," "Paid")
Payout Date
"Parking Lot" (Post-MVP Ideas):
A future integration that triggers an automatic commission payout immediately upon broker approval, minimizing manual intervention.
"Edge Cases"
Let's consider the potential failure points in the payment workflow. What could interrupt the smooth process we just defined?
Here are some key questions to consider:
Data Integrity Issues:
What if an agent's bank information is missing or invalid in the system?
What if a transaction is somehow approved by a broker but has a calculated net payout of $0 or a negative amount?
User Errors:
What happens if the accountant accidentally tries to schedule a payout for a batch that includes zero selected transactions?
System/Integration Failures (Future-proofing):
Thinking ahead to the "automatic payout" feature, what should the system do if a payment API fails to process a transaction? How is the accountant notified?
Edge Cases & System Responses:
Scenario: An agent's bank/payment information is missing for a selected transaction.
System Response: The system should prevent this transaction from being added to a payout batch. The item should be visually flagged in the queue with a clear error: "Missing Agent Payout Info."
Scenario: Accountant clicks "Schedule Payout" with zero transactions selected.
System Response: The button should ideally be disabled until at least one transaction is selected. If clicked, a simple, non-intrusive message appears: "Please select at least one transaction to schedule a payout."
Scenario: A transaction has a $0 or negative net payout amount.
System Response: Such transactions should not appear in the "Ready for Payout" queue. They should be automatically flagged for administrative review in a separate "Requires Attention" list.
Scenario (Future Integration): An automated payment to an agent fails.
System Response: The transaction's status should automatically revert from "Paid" back to "Ready for Payout." A high-priority notification should appear on the Accountant's dashboard: "Payment Failed for Transaction [ID]. Please review."
Key Data Fields & Document Requirements:
Data to be Displayed in the "Payout Queue":
Agent Name
Net Payout Amount ($)
Transaction ID
Property Address
Broker Approval Date
Payment Status (e.g., "Ready for Payout")
Data to be Displayed in the "Payment History":
All fields from the Payout Queue, plus:
Payout Date
Confirmation / Transaction # (from the future payment system)
UI/UX & Component Scope: The Payments Dashboard
1. Main Layout:
A full-page component named PaymentsDashboard.jsx.
It will feature two tabs at the top: "Payout Queue" (default view) and "Payment History."
2. The "Payout Queue" Tab:
Component: PayoutQueue.jsx
Functionality:
A table displaying all broker-approved, unpaid commissions.
Each row must have a checkbox for batch selection.
A summary section at the bottom of the table displays the "Total Payout Amount" for the selected items.
A primary "Schedule Payout" button, which is disabled until at least one transaction is checked.
3. The "Payment History" Tab:
Functionality: A simpler, read-only table showing all previously paid transactions, sorted by Payout Date. No checkboxes or action buttons are needed here.
4. The Confirmation Flow:
Confirmation Modal:
Component: ConfirmationModal.jsx (reusable).
Functionality: A simple modal that appears when "Schedule Payout" is clicked. It displays the total amount and number of transactions and requires a final "Confirm & Schedule" click.
Success Notification:
Component: SuccessNotification.jsx (reusable).
Functionality: A small, non-intrusive notification that appears in the corner of the screen for a few seconds to confirm the payout was scheduled successfully.
