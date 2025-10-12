export type PdfAuditSample = {
  id: string;
  filename: string;
  storagePath: string;
  expected: {
    propertyAddress: string;
    purchasePrice: number;
    grossCommissionIncome: number;
    commissionSplitType: 'listing' | 'client' | 'referral';
    referralNotes?: string;
    agentName: string;
    deductions: {
      franchiseFee: number;
      eoFee: number;
      transactionFee: number;
    };
    agentNetPayout: number;
  };
};

export const pdfAuditSamples: PdfAuditSample[] = [
  {
    id: 'sample-disclosure-001',
    filename: 'disclosure-agreement-sample.pdf',
    storagePath: 'pdf-samples/disclosure-agreement-sample.pdf',
    expected: {
      propertyAddress: '123 Main St, Brooklyn, NY',
      purchasePrice: 1_250_000,
      grossCommissionIncome: 75_000,
      commissionSplitType: 'listing',
      agentName: 'Jessica Wong',
      deductions: {
        franchiseFee: 4_500,
        eoFee: 150,
        transactionFee: 450,
      },
      agentNetPayout: 52_350,
    },
  },
];
