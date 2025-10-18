import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import useAgentPerformance from '../../hooks/useAgentPerformance';
import { useDashboardContext } from '../../context/DashboardContext';
import { formatCurrency } from '../../lib/formatters';

const SankeyDiagram = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!svgRef.current || !data || data.nodes.length === 0) return;

    const width = 1000;
    const height = 400;
    const margin = { top: 20, right: 200, bottom: 20, left: 20 };

    // Create sankey generator
    const sankeyGenerator = sankey()
      .nodeWidth(26)
      .nodePadding(40)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ])
      .nodeId((d) => d.name);

    // Generate layout
    const { nodes, links } = sankeyGenerator({
      nodes: data.nodes.map((d) => ({ ...d })),
      links: data.links.map((d) => ({ ...d })),
    });

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Draw links
    const linkGenerator = sankeyLinkHorizontal();
    svg
      .append('g')
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', linkGenerator)
      .attr('stroke', (d) => d.source.color)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', (d) => Math.max(d.width, 1))
      .attr('fill', 'none');

    // Draw nodes
    svg
      .append('g')
      .selectAll('rect')
      .data(nodes)
      .enter()
      .append('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('fill', (d) => d.color)
      .attr('rx', 4);

    // Draw node labels
    svg
      .append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('x', (d) => (d.x0 + d.x1) / 2)
      .attr('y', (d) => (d.y0 + d.y1) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d) => d.name);
  }, [data]);

  return (
    <div className="w-full bg-gray-50 rounded p-4 overflow-x-auto">
      <svg ref={svgRef} style={{ minWidth: '100%', height: 'auto' }} />
    </div>
  );
};

const CommissionSplitFlow = ({ period }) => {
  const { agents } = useAgentPerformance(period);
  const { agentPlans } = useDashboardContext();

  const flowData = useMemo(() => {
    // Calculate totals from filtered commissions
    let totalGci = 0;
    let totalReferralFees = 0;
    let totalFranchiseFees = 0;
    let totalBrokerageShare = 0;
    let totalAgentShare = 0;
    let totalStandardFees = 0;

    if (!agents || agents.length === 0) {
      return {
        nodes: [],
        links: [],
        totals: {
          totalGci: 0,
          totalReferralFees: 0,
          totalFranchiseFees: 0,
          totalBrokerageShare: 0,
          totalAgentShare: 0,
          totalStandardFees: 0,
          agentNet: 0,
        },
      };
    }

    agents.forEach((agent) => {
      if (!agent.deals) return;
      agent.deals.forEach((deal) => {
        const gci = (deal.salePrice ?? 0) * ((deal.grossCommissionRate ?? 0) / 100);
        const referralFee = gci * ((deal.referralFeePct ?? 0) / 100);
        const franchiseFee = gci * 0.06; // Assuming 6% franchise fee
        const adjustedGci = gci - referralFee - franchiseFee;

        const plan = agentPlans && agentPlans[agent.name];
        const splitDefault = plan ? (plan.primarySplit.agent / 100) : 0.5;
        const agentSplit = (deal.finalAgentSplitPercent != null ? deal.finalAgentSplitPercent / 100 : null) || splitDefault;

        const agentShareAmount = adjustedGci * agentSplit;
        const brokerageShareAmount = adjustedGci - agentShareAmount;
        const standardFees = 600; // Assuming $600 in standard fees (EO + transaction)

        totalGci += gci;
        totalReferralFees += referralFee;
        totalFranchiseFees += franchiseFee;
        totalBrokerageShare += brokerageShareAmount;
        totalAgentShare += agentShareAmount;
        totalStandardFees += standardFees;
      });
    });

    const agentNet = totalAgentShare - totalStandardFees;

    // Sankey data structure
    const nodes = [
      { name: 'Deals', color: '#10b981' },
      { name: 'GCI', color: '#6ee7b7' },
      { name: 'Adjusted GCI', color: '#a7f3d0' },
      { name: 'Referral Fee', color: '#ef4444' },
      { name: 'Franchise Fee', color: '#f87171' },
      { name: 'Brokerage Share', color: '#a78bfa' },
      { name: 'Agent Share', color: '#60a5fa' },
      { name: 'Standard Fees', color: '#fbbf24' },
      { name: 'Agent Net', color: '#3b82f6' },
    ];

    const links = [
      { source: 0, target: 1, value: totalGci },
      { source: 1, target: 2, value: totalGci - totalReferralFees - totalFranchiseFees },
      { source: 1, target: 3, value: totalReferralFees },
      { source: 1, target: 4, value: totalFranchiseFees },
      { source: 2, target: 5, value: totalBrokerageShare },
      { source: 2, target: 6, value: totalAgentShare },
      { source: 6, target: 7, value: totalStandardFees },
      { source: 6, target: 8, value: agentNet },
    ];

    return {
      nodes,
      links,
      totals: {
        totalGci,
        totalReferralFees,
        totalFranchiseFees,
        totalBrokerageShare,
        totalAgentShare,
        totalStandardFees,
        agentNet,
      },
    };
  }, [agents, agentPlans]);

  if (!flowData || !flowData.totals) {
    return (
      <div className="p-6 bg-white rounded-lg shadow mb-6">
        <h2 className="text-2xl font-black mb-4">Commission Split Flow</h2>
        <p className="text-sm text-charney-gray">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow mb-6">
      <h2 className="text-2xl font-black mb-4">Commission Split Flow</h2>
      <p className="text-sm text-charney-gray mb-4">
        Visualization of how commission flows from deals through deductions to final agent payout
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-green-50 rounded">
          <p className="text-xs text-charney-gray uppercase">Total GCI</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(flowData.totals.totalGci)}</p>
        </div>
        <div className="p-3 bg-red-50 rounded">
          <p className="text-xs text-charney-gray uppercase">Referral Fees</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(flowData.totals.totalReferralFees)}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded">
          <p className="text-xs text-charney-gray uppercase">Brokerage Share</p>
          <p className="text-lg font-bold text-purple-600">{formatCurrency(flowData.totals.totalBrokerageShare)}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded">
          <p className="text-xs text-charney-gray uppercase">Agent Net</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(flowData.totals.agentNet)}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded p-4 text-center text-sm text-charney-gray">
        <p>Sankey diagram visualization coming soon</p>
        <p className="text-xs mt-2">This will show the flow of commissions through the system</p>
      </div>
    </div>
  );
};

export default CommissionSplitFlow;

