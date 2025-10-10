import { useMemo } from 'react';

const EMPTY_RECORD = {
  id: '',
  status: 'Needs Review',
  propertyAddress: '',
  buyerName: null,
  sellerName: null,
  salePrice: 0,
  grossCommissionPercent: 0,
  referralFeePct: 0,
  agentSplitPercent: 0,
  agent: null,
  brokerage: null,
  referrals: [],
  evidence: [],
  auditTrail: [],
};

/**
 * Temporary hook that wraps a CommissionRecord seed for tests.
 * Eventually this will fetch data from Supabase.
 */
export function useCommissionRecord(seed) {
  return useMemo(() => {
    if (!seed) return EMPTY_RECORD;

    const fromParsed = seed.parsedData ?? {};
    const evidence =
      seed.evidence ||
      (seed.source?.content || []).map((item, index) => ({
        id: `${seed.id}-evidence-${index}`,
        actor: item.from,
        value: item.body,
        created_at: item.created_at ?? new Date().toISOString(),
      }));

    const agent =
      seed.agent ||
      (seed.broker && {
        id: seed.agent_id ?? seed.broker,
        name: seed.broker,
        email: seed.email ?? seed.agentEmail ?? '',
      });

    return {
      ...EMPTY_RECORD,
      ...seed,
      propertyAddress: seed.property ?? fromParsed.propertyAddress ?? seed.propertyAddress ?? '',
      buyerName: seed.buyerName ?? fromParsed.buyerName ?? null,
      sellerName: seed.sellerName ?? fromParsed.sellerName ?? null,
      salePrice: seed.salePrice ?? fromParsed.salePrice ?? 0,
      grossCommissionPercent: seed.grossCommissionRate ?? fromParsed.listingSideCommission ?? 0,
      referralFeePct: seed.referralFeePct ?? 0,
      agentSplitPercent: seed.agentSplitPercent ?? fromParsed.agentSplit ?? 70,
      agent,
      evidence,
      auditTrail: seed.auditTrail ?? [],
    };
  }, [seed]);
}
