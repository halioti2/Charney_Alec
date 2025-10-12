# Payout Failure Scenarios - Real Estate Commission Payments

## Payment Flow Context
**Brokerage → Agent**: The brokerage (Charney) pays commission to sales agents upon deal completion.

---

## Realistic Failure Categories

### 🏦 **Brokerage Account Issues**
These affect the brokerage's ability to send payments:

| Failure Reason | Description | Severity | Recovery Action |
|----------------|-------------|----------|-----------------|
| `Insufficient funds in brokerage account` | Charney's operating account lacks funds | High | Transfer funds to operating account |
| `Brokerage account frozen by bank` | Bank compliance hold on business account | High | Contact bank compliance department |
| `Daily transfer limit exceeded` | Hit ACH daily/monthly limits | Medium | Wait for limit reset or request increase |
| `Brokerage account closed` | Business account unexpectedly closed | High | Emergency: Set up new business account |

### 👤 **Agent Account Issues**
These affect the agent's ability to receive payments:

| Failure Reason | Description | Severity | Recovery Action |
|----------------|-------------|----------|-----------------|
| `Agent bank account closed or invalid` | Agent's receiving account no longer exists | Medium | Agent must provide new bank details |
| `Invalid routing number` | Agent provided incorrect bank routing | Medium | Agent must correct bank information |
| `Account does not accept ACH transfers` | Some accounts block electronic transfers | Low | Switch to manual check processing |
| `Agent account frozen` | Agent's personal account has issues | Medium | Agent must resolve with their bank |

### 🔧 **System/Provider Issues**
These are technical failures outside of account problems:

| Failure Reason | Description | Severity | Recovery Action |
|----------------|-------------|----------|-----------------|
| `ACH provider service outage` | Stripe/Plaid/etc. experiencing downtime | Medium | Retry when service restored |
| `Network connectivity timeout` | Connection lost during processing | Low | Automatic retry |
| `Processing timeout - retry required` | Transaction took too long | Low | Automatic retry |
| `Provider daily limit exceeded` | ACH processor hit volume limits | Medium | Wait for limit reset |

### 📮 **Manual Payment Issues**
For non-ACH payments (checks, wire transfers):

| Failure Reason | Description | Severity | Recovery Action |
|----------------|-------------|----------|-----------------|
| `Check processing error - invalid mailing address` | Agent's address incorrect/outdated | Medium | Agent must update mailing address |
| `Check returned - undeliverable` | Mail returned by postal service | Medium | Verify and update agent address |
| `Wire transfer rejected by receiving bank` | International or compliance issues | Medium | Use alternative payment method |
| `Check printing system offline` | Internal check processing down | Low | Wait for system restoration |

### 🔒 **Compliance/Regulatory Issues**
Legal or regulatory blocks:

| Failure Reason | Description | Severity | Recovery Action |
|----------------|-------------|----------|-----------------|
| `AML compliance hold` | Anti-money laundering review required | High | Provide compliance documentation |
| `Tax withholding required` | IRS requires tax withholding | Medium | Process with appropriate withholding |
| `Garnishment order active` | Court order to withhold payment | High | Legal review required |
| `Regulatory review pending` | State real estate board review | Medium | Wait for regulatory clearance |

---

## Implementation in Application

### **Error Message Guidelines**
- **User-Friendly**: Avoid technical jargon
- **Actionable**: Tell user what they can do
- **Specific**: Don't just say "error occurred"

### **Example Error Messages**
```
❌ Bad: "ACH transfer failed"
✅ Good: "Agent bank account closed or invalid - please contact agent to update bank information"

❌ Bad: "System error"
✅ Good: "Daily transfer limit exceeded - payouts will resume tomorrow or contact bank to increase limits"

❌ Bad: "Payment rejected"
✅ Good: "Check processing error - agent's mailing address is invalid, please update address in agent profile"
```

### **Retry Logic**
- **Automatic Retry**: Network timeouts, temporary service outages
- **Manual Retry**: After user fixes underlying issue (bank info, address, etc.)
- **No Retry**: Compliance holds, account closures (require manual intervention)

### **Notification Strategy**
- **Immediate**: Toast notification for user awareness
- **Persistent**: Failure banner until resolved
- **Email**: Notify relevant parties (agent, accountant, manager)
- **Dashboard**: Track failure metrics and trends

---

## Business Impact Considerations

### **High Priority Failures**
- Brokerage account issues (affects all payouts)
- Compliance/regulatory holds (legal implications)
- Large dollar amount failures (agent satisfaction)

### **Medium Priority Failures**
- Individual agent account issues
- System provider outages (temporary)
- Manual payment processing errors

### **Low Priority Failures**
- Network timeouts (auto-retry)
- Small amount check processing
- Non-critical system maintenance

---

## Future Enhancements

### **Proactive Monitoring**
- Bank account validation before scheduling
- Balance checks on brokerage accounts
- Agent contact information verification

### **Automated Recovery**
- Smart retry with exponential backoff
- Alternative payment method fallback
- Automatic notification workflows

### **Analytics & Reporting**
- Failure rate tracking by category
- Cost analysis of failed payments
- Agent satisfaction impact metrics
