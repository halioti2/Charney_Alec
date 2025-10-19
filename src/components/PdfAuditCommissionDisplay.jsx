import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { calculateCommission } from '../lib/dashboardData.js';
import { formatCurrency } from '../lib/formatters.js';

/**
 * Commission breakdown and plan defaults component for PDF Audit view
 * Shows real-time commission calculations based on audit form values
 */
export default function PdfAuditCommissionDisplay({ formData }) {
  const { agentPlans } = useDashboardContext();

  // Get agent plan data based on selected agent
  const agentPlan = useMemo(() => {
    const agentName = formData.final_broker_agent_name?.trim();
    if (!agentName || !agentPlans[agentName]) {
      // Default plan if agent not found
      return {
        primarySplit: { agent: 70, brokerage: 30 },
        commissionCap: 20000,
        currentTowardsCap: 0,
        deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
      };
    }
    return agentPlans[agentName];
  }, [formData.final_broker_agent_name, agentPlans]);

  // Calculate commission based on form values
  const commission = useMemo(() => {
    const salePrice = parseFloat(formData.final_sale_price) || 0;
    const commissionPercent = parseFloat(formData.final_listing_commission_percent) || 0;
    const agentSplitPercent = parseFloat(formData.final_agent_split_percent) || agentPlan.primarySplit.agent;

    // Create deal object for calculation
    const deal = {
      salePrice,
      grossCommissionRate: commissionPercent,
      referralFeePct: 0, // PDF audit doesn't typically have referral fees
    };

    // Create plan object with audit-specific agent split
    const planForCalculation = {
      ...agentPlan,
      primarySplit: {
        agent: agentSplitPercent,
        brokerage: 100 - agentSplitPercent,
      },
    };

    return calculateCommission(deal, planForCalculation);
  }, [formData.final_sale_price, formData.final_listing_commission_percent, formData.final_agent_split_percent, agentPlan]);

  const sectionClasses = "rounded-2xl border border-charney-light-gray bg-charney-white p-6 shadow-charney dark:border-charney-gray/40 dark:bg-charney-slate/80";
  const sectionTitleClasses = "font-brand text-xs font-bold uppercase tracking-[0.25em]";

  return (
    <div className="space-y-6">
      {/* Deal Inputs Summary */}
      <section className={sectionClasses}>
        <h6 className={`${sectionTitleClasses} text-charney-red`}>Deal Inputs</h6>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-charney-black dark:text-charney-cream">
          <div className="flex justify-between">
            <span className="text-charney-gray">Sale Price</span>
            <span className="font-semibold">{formatCurrency(parseFloat(formData.final_sale_price) || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charney-gray">Gross Commission (%)</span>
            <span className="font-semibold">{parseFloat(formData.final_listing_commission_percent) || 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-charney-gray">Agent Split (%)</span>
            <span className="font-semibold">{parseFloat(formData.final_agent_split_percent) || agentPlan.primarySplit.agent}%</span>
          </div>
        </div>
      </section>

      {/* Commission Breakdown */}
      <section className={sectionClasses}>
        <h6 className={`${sectionTitleClasses} text-charney-red`}>Commission Breakdown</h6>
        <div className="mt-4">
          <ul className="space-y-1 text-sm text-charney-black dark:text-charney-cream">
            <li className="flex justify-between font-medium">
              <span>Gross Commission Income (GCI)</span>
              <strong>{formatCurrency(commission.gci)}</strong>
            </li>
            <li className="flex justify-between text-charney-gray">
              <span>Referral Fee</span>
              <span>-{formatCurrency(commission.referralFee)}</span>
            </li>
            <li className="flex justify-between text-charney-gray">
              <span>Franchise Fee ({agentPlan.deductions.franchiseFeePct}%)</span>
              <span>-{formatCurrency(commission.franchiseFee)}</span>
            </li>
            <li className="flex justify-between border-t border-charney-light-gray pt-2 font-bold dark:border-charney-gray">
              <span>Adjusted GCI for Split</span>
              <span>{formatCurrency(commission.adjustedGci)}</span>
            </li>
            <li className="flex justify-between pt-3 font-bold">
              <span>Agent Share ({commission.agentSplit}%)</span>
              <span>{formatCurrency(commission.agentShare)}</span>
            </li>
            <li className="flex justify-between text-charney-gray">
              <span>E&amp;O Insurance Fee</span>
              <span>-{formatCurrency(commission.eoFee)}</span>
            </li>
            <li className="flex justify-between text-charney-gray">
              <span>Transaction Fee</span>
              <span>-{formatCurrency(commission.transactionFee)}</span>
            </li>
            <li className="flex justify-between border-t-2 border-charney-black pt-3 text-lg font-black text-green-600 dark:border-charney-cream">
              <span>Agent Net Payout</span>
              <span>{formatCurrency(commission.agentNet)}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Plan Defaults */}
      <section className={sectionClasses}>
        <h6 className={`${sectionTitleClasses} text-charney-gray`}>Plan Defaults</h6>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-charney-black dark:text-charney-cream">
          <div>
            <dt className="font-semibold uppercase tracking-wide text-charney-gray">Agent Split</dt>
            <dd className="mt-1 text-base font-black text-charney-black dark:text-charney-cream">
              {agentPlan.primarySplit.agent}%
            </dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-charney-gray">Brokerage Split</dt>
            <dd className="mt-1 text-base font-black text-charney-black dark:text-charney-cream">
              {agentPlan.primarySplit.brokerage}%
            </dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-charney-gray">Cap Remaining</dt>
            <dd className="mt-1 text-base font-black text-charney-black dark:text-charney-cream">
              {formatCurrency(Math.max(agentPlan.commissionCap - agentPlan.currentTowardsCap, 0))}
            </dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-charney-gray">Standard Fees</dt>
            <dd className="mt-1 space-y-1 text-sm text-charney-gray">
              <p>Franchise {agentPlan.deductions.franchiseFeePct}%</p>
              <p>E&amp;O {formatCurrency(agentPlan.deductions.eoFee)}</p>
              <p>Transaction {formatCurrency(agentPlan.deductions.transactionFee)}</p>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}