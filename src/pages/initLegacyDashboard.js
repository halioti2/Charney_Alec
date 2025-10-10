/* eslint-disable no-use-before-define */

import {
  createAgentPlans,
  createMockCommissions,
  createMockStockData,
  calculateCommission,
} from '../lib/dashboardData.js';

export function initLegacyDashboard() {
  let commissionForecasterChart;
  let myPerformanceChart;
  const intervals = [];

  // --- Data Model ---
  const agentPlans = createAgentPlans();
  const mockData = createMockCommissions();

  function renderTables() {
    const topPerformersTable = document.querySelector('#top-performers-table tbody');
    if (topPerformersTable) {
      topPerformersTable.innerHTML = '';
      mockData.slice(0, 8).forEach((d) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-charney-cream/50 dark:hover:bg-charney-cream/10';
        row.innerHTML = `<td class="p-4 font-bold cursor-pointer" data-agent-name="${d.broker}">${d.broker}</td><td class="p-4 text-center">${(d.salePrice * (d.grossCommissionRate / 100) / 1000).toFixed(1)}k</td><td class="p-4 text-center">${d.dealTime}d</td><td class="p-4 text-center font-bold text-green-600">${d.score}</td><td class="p-4 text-center"><button data-commission-id="${d.id}" class="view-disclosure-btn text-xs font-bold uppercase px-3 py-1 rounded-sm ${d.disclosureViewed ? 'bg-charney-light-gray text-charney-gray' : 'bg-charney-red text-white dark:text-black'}">${d.disclosureViewed ? 'Viewed' : 'Needs Viewing'}</button></td>`;
        topPerformersTable.appendChild(row);
      });
    }

    const commissionTableBody = document.getElementById('commission-table-body');
    if (commissionTableBody) {
      commissionTableBody.innerHTML = '';
      mockData.forEach((data) => {
        const row = document.createElement('tr');
        row.className = 'review-item hover:bg-charney-cream/50 dark:hover:bg-charney-cream/10 cursor-pointer';
        row.dataset.commissionId = data.id;
        row.innerHTML = `<td class="p-4 font-bold flex items-center cursor-pointer" data-agent-name="${data.broker}">${data.broker} ${data.conflict ? '<svg class="w-4 h-4 ml-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>' : ''}</td><td class="p-4 text-charney-gray">${data.property}</td><td class="p-4 text-charney-gray">${(data.salePrice * (data.grossCommissionRate / 100)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td><td class="p-4 status-cell">${getStatusBadge(data.status)}</td>`;
        commissionTableBody.appendChild(row);
      });
    }
  }

  function getStatusBadge(status) {
    const colors = {
      'Needs Review': 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-blue-100 text-blue-800',
      Paid: 'bg-green-100 text-green-800',
      'Awaiting Info': 'bg-orange-100 text-orange-800',
    };
    return `<span class="inline-flex items-center ${colors[status]} text-xs font-bold uppercase px-2.5 py-1 rounded-sm">${status}</span>`;
  }

  function getIcon(action) {
    if (action.includes('created'))
      return `<svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
    if (action.includes('Corrected'))
      return `<svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg>`;
    if (action.includes('Approved'))
      return `<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zM9 12a1 1 0 112 0 1 1 0 01-2 0z" clip-rule="evenodd"></path></svg>`;
    if (action.includes('Requested') || action.includes('Uploaded'))
      return `<svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.739 0 3.5 3.5 0 01-.369 6.98zM5 13a3.5 3.5 0 01-.738-6.938 4 4 0 117.938 0A3.5 3.5 0 015 13z"></path></svg>`;
    return `<svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm2 8a1 1 0 001-1v-3a1 1 0 10-2 0v3a1 1 0 001 1z" clip-rule="evenodd"></path></svg>`;
  }

  // --- Charts ---
  const commissionCanvas = document.getElementById('commissionForecasterChart');
  if (commissionCanvas && window.Chart) {
    commissionForecasterChart = new window.Chart(commissionCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Forecast',
            data: [120, 150, 180, 210, 240, 270, 330, 360, 390, 420, 470, 520],
            borderColor: '#FF5959',
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            ticks: {
              callback: (value) => `$${value}k`,
            },
          },
        },
      },
    });
  }

  const performanceCanvas = document.getElementById('myPerformanceChart');
  if (performanceCanvas && window.Chart) {
    myPerformanceChart = new window.Chart(performanceCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Volume',
            data: [12, 18, 16, 22],
            backgroundColor: '#FF5959',
          },
        ],
      },
      options: {
        scales: {
          y: {
            ticks: {
              callback: (value) => `$${value}k`,
            },
          },
        },
      },
    });
  }

  const modal = document.getElementById('commission-modal');
  const tridModal = document.getElementById('trid-modal');
  const sourceDocView = document.getElementById('source-document-view');
  const calculationView = document.getElementById('calculation-view');
  const closeModalBtn = modal?.querySelector('.close-modal');
  const modalActions = document.getElementById('modal-actions');
  const generateTridBtn = document.getElementById('generate-trid-btn');
  const panel = document.getElementById('broker-panel');
  const overlay = document.getElementById('panel-overlay');
  const closePanelBtn = document.getElementById('close-panel-btn');
  const panelAgentName = document.getElementById('panel-agent-name');
  const panelAgentEmail = document.getElementById('panel-agent-email');
  const panelAgentScore = document.getElementById('panel-agent-score');
  const panelHistory = document.getElementById('panel-history');
  const panelHistoryContent = document.getElementById('panel-history-content');
  const panelPlanContent = document.getElementById('panel-plan-content');
  const agentSplitInput = document.getElementById('agent-split');
  const brokerageSplitInput = document.getElementById('brokerage-split');
  const commissionCapInput = document.getElementById('commission-cap');
  const capProgressBar = document.getElementById('cap-progress-bar');
  const capProgressText = document.getElementById('cap-progress-text');
  const displayFranchiseFee = document.getElementById('display-franchise-fee');
  const displayEoFee = document.getElementById('display-eo-fee');
  const displayTransactionFee = document.getElementById('display-transaction-fee');
  const savePlanBtn = document.getElementById('save-plan-btn');
  const successNotification = document.getElementById('success-notification');

  function showSuccess(message) {
    if (!successNotification) return;
    successNotification.textContent = message;
    successNotification.classList.remove('hidden');
    setTimeout(() => successNotification.classList.add('hidden'), 2500);
  }

  function renderCalculation(deal, plan) {
    const result = calculateCommission(deal, plan);
    const formatCurrency = (val) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const activeElement = document.activeElement;
    const shouldRestore =
      activeElement instanceof HTMLInputElement && calculationView && calculationView.contains(activeElement);
    const activeId = shouldRestore ? activeElement.id : null;
    const selectionStart = shouldRestore ? activeElement.selectionStart : null;
    const selectionEnd = shouldRestore ? activeElement.selectionEnd : null;

    calculationView.innerHTML = `
                <div class="card p-4 space-y-4">
                     <h4 class="text-xl font-black tracking-tighter">Deal <span class="text-charney-red">Inputs</span></h4>
                     <div class="grid grid-cols-2 gap-4">
                        <div><label class="form-label">Sale Price</label><input type="number" id="calc-sale-price" class="form-input" value="${deal.salePrice}"></div>
                        <div><label class="form-label">Gross Commission (%)</label><input type="number" id="calc-gross-rate" class="form-input" value="${deal.grossCommissionRate}"></div>
                        <div><label class="form-label">Referral Fee (%)</label><input type="number" id="calc-referral-fee" class="form-input" value="${deal.referralFeePct}"></div>
                     </div>
                </div>
                <div class="card p-4 space-y-2">
                    <h4 class="text-xl font-black tracking-tighter">Commission <span class="text-charney-red">Breakdown</span></h4>
                    <table class="w-full text-sm">
                        <tr><td class="py-1">Gross Commission Income (GCI)</td><td class="text-right py-1 font-bold">${formatCurrency(result.gci)}</td></tr>
                        <tr class="text-charney-gray"><td class="py-1 pl-4">Referral Fee</td><td class="text-right py-1">(${formatCurrency(result.referralFee)})</td></tr>
                        <tr class="text-charney-gray"><td class="py-1 pl-4">Franchise Fee (${plan.deductions.franchiseFeePct}%)</td><td class="text-right py-1">(${formatCurrency(result.franchiseFee)})</td></tr>
                        <tr class="border-t border-charney-light-gray"><td class="py-1 font-bold">Adjusted GCI for Split</td><td class="text-right py-1 font-bold">${formatCurrency(result.adjustedGci)}</td></tr>
                        
                        <tr><td class="py-1 pt-4 font-bold">Agent Share (${result.agentSplit}%)</td><td class="text-right py-1 pt-4 font-bold">${formatCurrency(result.agentShare)}</td></tr>
                        <tr class="text-charney-gray"><td class="py-1 pl-4">E&O Insurance Fee</td><td class="text-right py-1">(${formatCurrency(result.eoFee)})</td></tr>
                        <tr class="text-charney-gray"><td class="py-1 pl-4">Transaction Fee</td><td class="text-right py-1">(${formatCurrency(result.transactionFee)})</td></tr>
                        
                        <tr class="border-t-2 border-charney-black"><td class="py-2 font-black text-lg">AGENT NET PAYOUT</td><td class="text-right py-2 font-black text-lg text-green-600">${formatCurrency(result.agentNet)}</td></tr>
                        
                        <tr class="border-t border-charney-light-gray"><td class="pt-4 pb-1 text-charney-gray">Brokerage Share (to Cap)</td><td class="text-right pt-4 pb-1 text-charney-gray">${formatCurrency(result.brokerageShareToCap)}</td></tr>
                    </table>
                </div>
            `;
    calculationView.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => {
        const updatedDeal = { ...deal };
        updatedDeal.salePrice = parseFloat(document.getElementById('calc-sale-price').value) || 0;
        updatedDeal.grossCommissionRate = parseFloat(document.getElementById('calc-gross-rate').value) || 0;
        updatedDeal.referralFeePct = parseFloat(document.getElementById('calc-referral-fee').value) || 0;
        renderCalculation(updatedDeal, plan);
      });
    });

    if (activeId) {
      const restored = document.getElementById(activeId);
      if (restored instanceof HTMLInputElement) {
        restored.focus({ preventScroll: true });
        const start = typeof selectionStart === 'number' ? selectionStart : restored.value.length;
        const end = typeof selectionEnd === 'number' ? selectionEnd : start;
        try {
          restored.setSelectionRange(start, end);
        } catch (err) {
          // Safari may throw if input type=number; fallback to selecting the end
          restored.selectionStart = restored.selectionEnd = restored.value.length;
        }
      }
    }
  }

  function openCommissionModal(data) {
    let chainHTML = data.source.content
      .map(
        (msg) =>
          `<div><p class="font-bold text-xs">${msg.from} &gt; ${msg.to}</p><div class="text-sm mt-1 p-2 bg-charney-cream rounded-md">${msg.body}</div></div>`,
      )
      .join('');
    sourceDocView.innerHTML = `<h4 class="font-bold uppercase">Original Email Chain</h4><div class="bg-white border border-charney-light-gray rounded-md p-3 text-sm space-y-3">${chainHTML}</div>`;
    const plan = agentPlans[data.broker] || agentPlans['Jessica Wong'];
    renderCalculation(data, plan);
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    modalActions.innerHTML = `
            <button class="btn btn-outline text-xs uppercase" data-action="request-info">Request Info</button>
            <button class="btn btn-outline text-xs uppercase" data-action="flag">Flag Conflict</button>
            <button class="btn btn-primary text-xs uppercase" data-action="approve">Approve Commission</button>`;

    modalActions.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'approve') {
          showSuccess('Commission approved & payment scheduled');
          modal.classList.add('hidden');
        } else if (action === 'request-info') {
          showSuccess('Information request sent to agent');
        } else if (action === 'flag') {
          showSuccess('Compliance has been notified');
        }
      });
    });

    generateTridBtn.classList.remove('hidden');
    generateTridBtn.onclick = () => populateAndShowTrid(data);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  closeModalBtn?.addEventListener('click', closeModal);

  function populateAndShowTrid(data) {
    const plan = agentPlans[data.broker] || agentPlans['Jessica Wong'];
    const result = calculateCommission(data, plan);
    tridModal.innerHTML = `
            <div class="modal-content w-full max-w-3xl mx-auto bg-white shadow-2xl rounded-2xl">
                <div class="flex justify-between items-center px-6 py-4 bg-charney-cream border-b border-charney-light-gray">
                    <h3 class="text-xl font-black uppercase tracking-tight">Estimated Closing Disclosure</h3>
                    <button class="close-trid text-2xl font-bold opacity-60 hover:opacity-100">&times;</button>
                </div>
                <div class="p-6 space-y-6" id="trid-form-printable">
                    <section>
                        <h4 class="text-lg font-black uppercase tracking-tight border-b border-charney-light-gray pb-2">Transaction Details</h4>
                        <div class="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <p><span class="font-bold uppercase text-charney-gray text-xs">Property</span><br>${data.property}</p>
                            <p><span class="font-bold uppercase text-charney-gray text-xs">Loan Amount</span><br>${(data.salePrice * 0.8).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                            <p><span class="font-bold uppercase text-charney-gray text-xs">Sale Price</span><br>${data.salePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                            <p><span class="font-bold uppercase text-charney-gray text-xs">Commission %</span><br>${data.grossCommissionRate}%</p>
                        </div>
                    </section>
                    <section>
                        <h4 class="text-lg font-black uppercase tracking-tight border-b border-charney-light-gray pb-2">Commission Breakdown</h4>
                        <table class="w-full text-sm mt-3">
                            <tr><td class="py-2">Gross Commission Income (GCI)</td><td class="text-right font-bold">${(data.salePrice * (data.grossCommissionRate / 100)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>
                            <tr class="text-charney-gray"><td class="py-2 pl-4">Referral Fee</td><td class="text-right">(${(result.referralFee).toLocaleString('en-US', { style: 'currency', currency: 'USD' })})</td></tr>
                            <tr class="text-charney-gray"><td class="py-2 pl-4">Franchise Fee (${plan.deductions.franchiseFeePct}%)</td><td class="text-right">(${(result.franchiseFee).toLocaleString('en-US', { style: 'currency', currency: 'USD' })})</td></tr>
                            <tr class="border-t border-charney-light-gray"><td class="py-2 font-bold">Adjusted GCI for Split</td><td class="text-right font-bold">${result.adjustedGci.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>
                            <tr><td class="py-2 text-charney-gray">Agent Share (${plan.primarySplit.agent}%)</td><td class="text-right text-charney-gray">${result.agentShare.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>
                            <tr><td class="py-2 text-charney-gray">Brokerage Share (${plan.primarySplit.brokerage}%)</td><td class="text-right text-charney-gray">${(result.adjustedGci - result.agentShare).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>
                            <tr class="border-t-2 border-charney-black"><td class="py-2 font-black text-lg">AGENT NET PAYOUT</td><td class="text-right font-black text-lg text-green-600">${result.agentNet.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td></tr>
                        </table>
                    </section>
                    <section>
                        <h4 class="text-lg font-black uppercase tracking-tight border-b border-charney-light-gray pb-2">Receiving Brokerage Details</h4>
                        <p class="mt-3 text-sm"><strong>${data.parsedData.receivingBrokerage}</strong><br>${data.parsedData.receivingBankInfo}</p>
                    </section>
                </div>
                <div class="px-6 py-4 bg-charney-cream border-t border-charney-light-gray flex justify-end space-x-3">
                    <button class="btn btn-outline text-xs uppercase" onclick="window.print()">Print</button>
                    <button class="btn btn-primary text-xs uppercase">Send to Agent</button>
                </div>
            </div>
        `;
    tridModal.classList.remove('hidden');
    tridModal.querySelector('.close-trid').addEventListener('click', () => tridModal.classList.add('hidden'));
  }

  function openBrokerPanel(agentName) {
    const data = mockData.find((d) => d.broker === agentName);
    if (!data) return;
    panel.classList.add('is-open');
    overlay.classList.remove('hidden');
    panelAgentName.textContent = agentName;
    panelAgentEmail.textContent = data.email;
    panelAgentEmail.href = `mailto:${data.email}`;
    panelAgentScore.textContent = data.score;
    panelHistory.innerHTML = '';
    data.auditTrail.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'log-item border-l-4 border-charney-light-gray pl-4';
      item.innerHTML = `<div class="log-header flex items-center justify-between cursor-pointer">
              <div class="flex items-center space-x-3">
                ${getIcon(entry.action)}
                <div>
                  <p class="font-bold">${entry.category}</p>
                  <p class="text-xs text-charney-gray">${entry.actor}</p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-xs uppercase text-charney-gray">${entry.time}</span>
                <svg class="arrow h-4 w-4 text-charney-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
            <div class="log-body border-t border-charney-light-gray mt-2 pt-2 text-sm text-charney-gray">
              ${entry.action}
            </div>`;
      panelHistory.appendChild(item);
    });

    // Attach expand/collapse handlers for audit trail entries
    panelHistory.querySelectorAll('.log-header').forEach((header) => {
      header.onclick = () => {
        const item = header.closest('.log-item');
        if (!item) return;
        item.classList.toggle('expanded');
      };
    });

    const plan = agentPlans[agentName] || agentPlans['Jessica Wong'];
    agentSplitInput.value = plan.primarySplit.agent;
    brokerageSplitInput.value = plan.primarySplit.brokerage;
    commissionCapInput.value = plan.commissionCap;
    displayFranchiseFee.textContent = plan.deductions.franchiseFeePct;
    displayEoFee.textContent = plan.deductions.eoFee;
    displayTransactionFee.textContent = plan.deductions.transactionFee;
    updateCapProgress(plan);
  }

  function updateCapProgress(plan) {
    const progress = (plan.currentTowardsCap / plan.commissionCap) * 100;
    capProgressBar.style.width = `${progress}%`;
    capProgressText.textContent = `${plan.currentTowardsCap.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })} / ${plan.commissionCap.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
  }

  function closePanel() {
    panel.classList.remove('is-open');
    overlay.classList.add('hidden');
  }

  document.querySelector('main')?.addEventListener('click', (e) => {
    const agentNameCell = e.target.closest('[data-agent-name]');
    const commissionRow = e.target.closest('.review-item');
    const disclosureBtn = e.target.closest('.view-disclosure-btn');

    if (agentNameCell) {
      const agentName = agentNameCell.dataset.agentName;
      openBrokerPanel(agentName);
    } else if (commissionRow) {
      const commissionId = commissionRow.dataset.commissionId;
      const data = mockData.find((d) => d.id === commissionId);
      if (data) openCommissionModal(data);
    }
  });

  closePanelBtn?.addEventListener('click', closePanel);
  overlay?.addEventListener('click', closePanel);
  panel.querySelector('.panel-nav')?.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    const targetPanel = e.target.dataset.panel;
    panel.querySelectorAll('.panel-nav-btn').forEach((btn) => btn.classList.remove('active'));
    e.target.classList.add('active');
    panel.querySelectorAll('.panel-content').forEach((content) => content.classList.add('hidden'));
    panel.querySelector(`#panel-${targetPanel}-content`).classList.remove('hidden');
  });

  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closePanel();
      tridModal?.classList.add('hidden');
    }
  });

  savePlanBtn?.addEventListener('click', () => {
    const agentName = panelAgentName?.textContent?.trim();
    if (!agentName || !agentPlans[agentName]) return;
    const plan = agentPlans[agentName];
    plan.primarySplit.agent = Number(agentSplitInput.value);
    plan.primarySplit.brokerage = 100 - plan.primarySplit.agent;
    brokerageSplitInput.value = plan.primarySplit.brokerage;
    plan.commissionCap = Number(commissionCapInput.value);
    updateCapProgress(plan);
    showSuccess('Commission plan saved');
  });

  const mockStockData = createMockStockData();

  function updateStockData() {
    mockStockData.forEach((stock) => {
      let change;
      if (stock.alertThreshold && Math.random() > 0.8) {
        change = Math.random() * stock.price * 0.03 - stock.price * 0.015;
      } else {
        change = Math.random() * stock.price * 0.01 - stock.price * 0.005;
      }
      stock.price += change;
      stock.change = change;
      stock.dir = change >= 0 ? 'up' : 'down';
    });
  }

  function renderStockTicker() {
    const track = document.getElementById('stock-ticker-track');
    if (!track) return;
    const content = [...mockStockData, ...mockStockData]
      .map((stock) => {
        const arrow = stock.dir === 'up' ? '▲' : '▼';
        const colorClass = stock.dir === 'up' ? 'ticker-up' : 'ticker-down';
        return `<div class="ticker-item ${colorClass}">
                            <span>${stock.symbol}</span>
                            <span class="ml-2">${stock.price.toFixed(2)}</span>
                            <span class="ml-2">${arrow} ${Math.abs(stock.change).toFixed(2)}</span>
                        </div>`;
      })
      .join('');
    track.innerHTML = content;
  }

  function checkMarketAlerts() {
    const alertsContainer = document.getElementById('market-alerts-container');
    if (!alertsContainer) return;

    alertsContainer.innerHTML = '';

    mockStockData.forEach((stock) => {
      if (!stock.alertThreshold) return;

      const dailyChangePct = ((stock.price - stock.openPrice) / stock.openPrice) * 100;

      if (Math.abs(dailyChangePct) > stock.alertThreshold) {
        const isDown = dailyChangePct < 0;
        const alertData = {
          title: 'High Market Volatility Detected',
          message: `The ${stock.symbol} is ${isDown ? 'down' : 'up'} ${Math.abs(dailyChangePct).toFixed(1)}% today.`,
          impact:
            'Sudden market shifts can impact buyer confidence and loan approvals. Consider checking in with clients on active deals.',
          colorClass: 'border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
        };

        const alertHTML = `
                        <div class="card market-alert p-4 ${alertData.colorClass}">
                            <div class="flex justify-between items-start">
                                 <div class="flex">
                                    <div class="mr-3 flex-shrink-0">
                                        <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                                    </div>
                                    <div>
                                        <h4 class="font-black uppercase">${alertData.title}</h4>
                                        <p class="text-sm font-bold mt-1">${alertData.message}</p>
                                        <p class="text-xs text-charney-gray mt-2">${alertData.impact}</p>
                                    </div>
                                </div>
                                <button class="close-alert-btn opacity-50 hover:opacity-100 text-2xl font-light leading-none -mt-2 -mr-1">&times;</button>
                            </div>
                        </div>
                    `;
        alertsContainer.innerHTML += alertHTML;
      }
    });

    alertsContainer.querySelectorAll('.close-alert-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const alertEl = e.target.closest('.market-alert');
        alertEl.style.opacity = '0';
        setTimeout(() => alertEl.remove(), 300);
      });
    });
  }

  function initStockTicker() {
    renderStockTicker();
    checkMarketAlerts();
    const tickerInterval = setInterval(() => {
      updateStockData();
      renderStockTicker();
      checkMarketAlerts();
    }, 4000);
    intervals.push(tickerInterval);
  }

  renderTables();
  initStockTicker();

  return () => {
    intervals.forEach(clearInterval);
    commissionForecasterChart?.destroy();
    myPerformanceChart?.destroy();
  };
}
