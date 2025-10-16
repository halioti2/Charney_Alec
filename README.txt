<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clarity - Commission Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            transition: background-color 0.3s ease;
        }
        .panel { transform: translateX(100%); transition: transform 0.3s ease-in-out; }
        .panel.is-open { transform: translateX(0); }
        .panel-overlay { transition: opacity 0.3s ease-in-out; }
        .email-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-in-out; }
        .email-thread.expanded .email-body { max-height: 500px; }
        .email-header .arrow { transition: transform 0.3s ease-in-out; }
        .email-thread.expanded .arrow { transform: rotate(90deg); }
        .log-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-in-out; }
        .log-item.expanded .log-body { max-height: 500px; }
        .log-header .arrow { transition: transform 0.3s ease-in-out; }
        .log-item.expanded .arrow { transform: rotate(90deg); }
        body.theme-coordinator { background-color: #111827; color: #D1D5DB; }
        .theme-coordinator .header, .theme-coordinator .card, .theme-coordinator .modal-content, .theme-coordinator .panel { background-color: #1F2937; border-color: #374151; }
        .theme-coordinator .view-toggle { background-color: #374151; }
        .theme-coordinator .view-toggle button.active { background-color: #3B82F6; color: #FFFFFF; }
        .theme-coordinator .accent-color, .theme-coordinator a { color: #3B82F6; }
        .theme-coordinator .bg-accent { background-color: #3B82F6; }
        .theme-coordinator .hover\:bg-accent-dark:hover { background-color: #2563EB; }
        .theme-coordinator .modal-bg-subtle { background-color: #111827; }
        body.theme-broker { background-color: #1A1A2E; color: #DCD7FE; }
        .theme-broker .header, .theme-broker .card, .theme-broker .modal-content, .theme-broker .panel { background-color: #242442; border-color: #3C3C62; }
        .theme-broker .view-toggle { background-color: #3C3C62; }
        .theme-broker .view-toggle button.active { background-color: #8B5CF6; color: #FFFFFF; }
        .theme-broker .accent-color, .theme-broker a { color: #8B5CF6; }
        .theme-broker .bg-accent { background-color: #8B5CF6; }
        .theme-broker .hover\:bg-accent-dark:hover { background-color: #7C3AED; }
        .theme-broker .modal-bg-subtle { background-color: #1A1A2E; }
        @media print {
            body * { visibility: hidden; }
            #trid-form-printable, #trid-form-printable * { visibility: visible; }
            #trid-form-printable { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none; }
            input { border: none !important; -webkit-appearance: none; background: transparent !important; color: black !important; font-size: 1rem; }
        }
    </style>
</head>
<body class="theme-coordinator">
    <div class="flex flex-col h-screen">
        <header class="header px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0 z-20 no-print">
            <div class="flex items-center space-x-3"><svg width="28" height="28" viewBox="0 0 24 24" class="accent-color" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z"/><path d="M12 6C11.4477 6 11 6.44772 11 7V11H7C6.44772 11 6 11.4477 6 12C6 12.5523 6.44772 13 7 13H11V17C11 17.5523 11.4477 18 12 18C12.5523 18 13 17.5523 13 17V7C13 6.44772 12.5523 6 12 6Z"/></svg><h1 class="text-lg font-semibold">Clarity</h1></div>
            <div class="view-toggle flex items-center p-1 rounded-lg"><button id="toggle-coordinator" class="px-3 py-1 text-sm font-medium rounded-md active">Coordinator</button><button id="toggle-broker" class="px-3 py-1 text-sm font-medium rounded-md">Broker</button></div>
            <div class="flex items-center space-x-4"><span id="user-name" class="text-sm">Leasing Coordinator</span><img id="user-avatar" class="h-8 w-8 rounded-full object-cover" src="https://placehold.co/100x100/3B82F6/FFFFFF?text=LC" alt="User Avatar"></div>
        </header>
        <main class="flex-1 p-4 md:p-6 overflow-y-auto">
            <div id="broker-view" class="hidden grid gap-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6"><div class="card p-5 rounded-lg"><h3 class="text-sm font-medium opacity-70">Total Commissions Paid (YTD)</h3><p class="text-3xl font-bold mt-2">$2,845,120</p></div><div class="card p-5 rounded-lg"><h3 class="text-sm font-medium opacity-70">Total Leases Signed (YTD)</h3><p class="text-3xl font-bold mt-2">840</p></div><div class="card p-5 rounded-lg"><h3 class="text-sm font-medium opacity-70">Average Commission %</h3><p class="text-3xl font-bold mt-2">14.8%</p></div><div class="card p-5 rounded-lg"><h3 class="text-sm font-medium opacity-70">Active Agent Network</h3><p class="text-3xl font-bold mt-2">45</p></div></div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div class="card p-5 rounded-lg"><h3 class="text-lg font-semibold mb-4">Agent Performance Score</h3><div id="top-performers-table-container"><table id="top-performers-table" class="w-full text-sm text-left"><thead class="text-xs opacity-70 uppercase"><tr><th class="py-2">Agent</th><th class="py-2 text-center">GCI (YTD)</th><th class="py-2 text-center">Avg. Deal Time</th><th class="py-2 text-center">Score</th><th class="py-2 text-center">Disclosure Status</th></tr></thead><tbody></tbody></table></div></div><div class="card p-5 rounded-lg"><h3 class="text-lg font-semibold mb-4">Commission Forecast (90 Days)</h3><canvas id="commissionForecasterChart"></canvas></div></div>
            </div>
            <div id="coordinator-view" class="grid gap-6">
                 <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div class="lg:col-span-3 space-y-6">
                        <div class="card p-5 rounded-lg"><h3 class="text-lg font-semibold mb-4">Today's Focus</h3><div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center"><div><p id="focus-new" class="text-3xl font-bold accent-color">7</p><p class="text-sm opacity-70 mt-1">New Since Last Login</p></div><div><p class="text-3xl font-bold text-yellow-400">8</p><p class="text-sm opacity-70 mt-1">Awaiting Information</p></div><div><p class="text-3xl font-bold text-red-400">3</p><p class="text-sm opacity-70 mt-1">Requires Attention (48hr+)</p></div></div></div>
                        <div class="card p-5 rounded-lg"><h3 class="text-lg font-semibold mb-4">Commission Queue</h3><div class="overflow-y-auto" style="max-height: 60vh;"><table class="w-full text-sm text-left"><thead class="text-xs opacity-70 uppercase sticky top-0 bg-[#1F2937] theme-coordinator:bg-[#1F2937] theme-broker:bg-[#242442]"><tr><th class="px-6 py-3">Agent</th><th class="px-6 py-3">Property</th><th class="px-6 py-3">Total Commission</th><th class="px-6 py-3">Status</th></tr></thead><tbody id="commission-table-body"></tbody></table></div></div>
                    </div>
                    <div class="lg:col-span-2 space-y-6">
                        <div class="card p-5 rounded-lg"><div class="flex justify-between items-center mb-4"><h3 class="text-lg font-semibold">Your Journey</h3><div class="flex items-center text-xs p-1 rounded-md bg-black/20"><button id="toggle-annual" class="px-2 py-0.5 rounded bg-accent text-white">Annual</button><button id="toggle-tier" class="px-2 py-0.5 text-gray-400">Next Tier</button></div></div><div id="annual-view"><div class="flex items-baseline justify-between mb-2"><span class="text-2xl font-bold">$1.6M / $3M</span><span class="text-sm font-medium text-green-400">53% to Elite</span></div><div class="w-full bg-black/20 rounded-full h-3"><div class="bg-accent h-3 rounded-full" style="width: 53%"></div></div></div><div id="tier-view" class="hidden"><h4 class="text-sm opacity-80 mb-2">Progress to 70/30 Split</h4><div class="flex items-baseline justify-between mb-2"><span class="text-2xl font-bold">$42,500</span><span class="text-sm font-medium text-green-400">Remaining</span></div><div class="w-full bg-black/20 rounded-full h-3"><div class="bg-accent h-3 rounded-full" style="width: 78.75%"></div></div></div><div class="border-t border-gray-700 mt-4 pt-4 flex justify-around items-start"><div class="text-center"><h4 class="text-sm font-semibold mb-2">Latest Achievement</h4><div title="Accuracy Pro"><svg class="w-10 h-10 mx-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><p class="text-xs mt-1">Accuracy Pro</p></div></div><div class="text-center"><h4 class="text-sm font-semibold mb-2">Next Goal</h4><div class="opacity-40" title="On Fire: 20+ approvals in one week"><svg class="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1014.12 11.88A3 3 0 009.879 16.121z"></path></svg><p class="text-xs mt-1">(Locked)</p></div></div></div></div>
                        <div class="card p-5 rounded-lg">
                            <h3 class="text-lg font-semibold mb-4">My Performance Trends</h3>
                            <div>
                                <canvas id="myPerformanceChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
    <div id="panel-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 z-30 panel-overlay"></div>
    <div id="broker-panel" class="panel fixed top-0 right-0 h-full w-full max-w-md p-6 overflow-y-auto z-40"><div class="flex justify-between items-center mb-6"><h3 id="panel-agent-name" class="text-xl font-semibold">Agent Details</h3><button id="close-panel-btn" class="opacity-70 hover:opacity-100 text-2xl">&times;</button></div><div class="space-y-4 text-sm"><p><strong>Contact:</strong> <a id="panel-agent-email" href="#" class="accent-color hover:underline"></a></p><p><strong>Performance Score:</strong> <span id="panel-agent-score" class="font-semibold accent-color"></span></p><h4 class="font-semibold pt-4 border-t border-gray-700">Transactions</h4><div id="panel-history" class="space-y-4 mt-2"></div></div></div>
    <div id="commission-modal" class="hidden fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 no-print"><div class="modal-content rounded-lg shadow-xl w-full max-w-5xl"><div class="p-5 border-b flex justify-between items-center"><h3 class="text-xl font-semibold">Commission Detail & Verification</h3><button class="close-modal opacity-70 hover:opacity-100 text-2xl">&times;</button></div><div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"><div id="source-document-view" class="space-y-4"></div><div id="parsed-data-view" class="space-y-4"></div></div><div class="p-5 border-t flex justify-between items-center"><button id="generate-trid-btn" class="hidden px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">Generate Closing Disclosure</button><div id="modal-actions" class="flex items-center space-x-3 ml-auto"></div></div></div></div>
    <div id="trid-modal" class="hidden fixed inset-0 bg-white p-8 overflow-y-auto z-[60] text-black"><div id="trid-form-printable" class="max-w-4xl mx-auto"><div class="flex justify-between items-start mb-6 no-print"><h2 class="text-3xl font-bold">Closing Disclosure</h2><div><button id="print-trid-btn" class="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-md mr-2">Print</button><button id="close-trid-modal" class="text-2xl">&times;</button></div></div><div class="border-2 border-black p-4 space-y-4"><div class="grid grid-cols-3 gap-4 border-b-2 border-black pb-4"><div><label class="block text-xs text-gray-500">Date Issued</label><p class="font-semibold">09/30/2025</p></div><div><label class="block text-xs text-gray-500">Closing Date</label><p class="font-semibold">10/30/2025</p></div><div><label class="block text-xs text-gray-500">Disbursement Date</label><p class="font-semibold">10/31/2025</p></div></div><div class="grid grid-cols-2 gap-8 border-b-2 border-black pb-4"><div><h3 class="font-bold mb-2">Borrower</h3><input type="text" id="trid-buyer-name" class="w-full bg-gray-100 px-1 py-0.5 border-b border-gray-300"></div><div><h3 class="font-bold mb-2">Seller</h3><input type="text" id="trid-seller-name" class="w-full bg-gray-100 px-1 py-0.5 border-b border-gray-300"></div><div><h3 class="font-bold mb-2">Property</h3><input type="text" id="trid-property-address" class="w-full bg-gray-100 px-1 py-0.5 border-b border-gray-300"></div><div><h3 class="font-bold mb-2">Sale Price</h3><input type="text" id="trid-sale-price" class="w-full bg-gray-100 px-1 py-0.5 border-b border-gray-300"></div></div><h2 class="text-2xl font-bold text-center">Summaries of Transactions</h2><div class="grid grid-cols-2 gap-8"><div class="border-r pr-4"><h3 class="font-bold text-lg border-b-2 border-black pb-1">Borrower's Transaction</h3><table class="w-full text-sm mt-2"><tbody><tr class="font-bold"><td class="py-1">K. Due from Borrower at Closing</td><td class="text-right py-1"><input type="text" id="trid-due-from-buyer" class="w-32 text-right bg-gray-100 px-1 font-bold"></td></tr><tr><td class="py-1 pl-4">01 Sale Price of Property</td><td class="text-right py-1"><input type="text" id="trid-summary-sale-price-buyer" class="w-32 text-right bg-gray-100 px-1"></td></tr><tr class="font-bold"><td class="py-1">L. Paid Already by or on Behalf of Borrower</td><td class="text-right py-1"><input type="text" id="trid-paid-by-buyer" class="w-32 text-right bg-gray-100 px-1 font-bold"></td></tr><tr><td class="py-1 pl-4">01 Loan Amount</td><td class="text-right py-1"><input type="text" id="trid-loan-amount" class="w-32 text-right bg-gray-100 px-1"></td></tr></tbody><tfoot><tr class="border-t-2 border-black font-bold"><td class="py-2">CALCULATION: Cash to Close From Borrower</td><td class="text-right py-2"><input type="text" id="trid-cash-to-close" class="w-32 text-right bg-gray-100 px-1 font-bold"></td></tr></tfoot></table></div><div><h3 class="font-bold text-lg border-b-2 border-black pb-1">Seller's Transaction</h3><table class="w-full text-sm mt-2"><tbody><tr class="font-bold"><td class="py-1">M. Due to Seller at Closing</td><td class="text-right py-1"><input type="text" id="trid-due-to-seller" class="w-32 text-right bg-gray-100 px-1 font-bold"></td></tr><tr><td class="py-1 pl-4">01 Sale Price of Property</td><td class="text-right py-1"><input type="text" id="trid-summary-sale-price-seller" class="w-32 text-right bg-gray-100 px-1"></td></tr><tr class="font-bold"><td class="py-1">N. Due from Seller at Closing</td><td class="text-right py-1"><input type="text" id="trid-due-from-seller" class="w-32 text-right bg-gray-100 px-1 font-bold"></td></tr><tr><td class="py-1 pl-4">04 Commission to Listing Broker</td><td class="text-right py-1"><input type="text" id="trid-listing-comm" class="w-full text-right bg-gray-100 px-1"></td></tr><tr><td class="py-1 pl-4">05 Seller Concession (to Buyer Agent)</td><td class="text-right py-1"><input type="text" id="trid-seller-concession" class="w-full text-right bg-gray-100 px-1"></td></tr></tbody><tfoot><tr class="border-t-2 border-black font-bold"><td class="py-2">CALCULATION: Cash to Seller</td><td class="text-right py-2"><input type="text" id="trid-cash-to-seller" class="w-32 text-right bg-gray-100 px-1 font-bold"></td></tr></tfoot></table></div></div><h3 class="font-bold text-lg border-b pb-2 mt-4">Wire & Bank Information</h3><div class="grid grid-cols-2 gap-8"><div><h4 class="font-semibold">Paying Agent</h4><p class="text-sm">Charney Companies Trust Account</p><p class="text-xs text-gray-500">Chase Bank, Account: ...Ending 4321</p></div><div><h4 class="font-semibold">Receiving Brokerage</h4><input type="text" id="trid-receiving-brokerage" class="w-full bg-gray-100 px-1 py-0.5 border-b border-gray-300"><input type="text" id="trid-receiving-bank-info" class="w-full bg-gray-100 px-1 py-0.5 border-b border-gray-300 text-xs"></div></div></div></div></div>
    <div id="success-notification" class="hidden fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"></div>
    
    <script>
    document.addEventListener('DOMContentLoaded', function () {
        const body = document.body;
        const toggleCoordinator = document.getElementById('toggle-coordinator');
        const toggleBroker = document.getElementById('toggle-broker');
        const coordinatorView = document.getElementById('coordinator-view');
        const managerView = document.getElementById('broker-view');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        const brokerAvatar = 'https://placehold.co/100x100/8B5CF6/FFFFFF?text=AE';
        const coordinatorAvatar = 'https://placehold.co/100x100/3B82F6/FFFFFF?text=LC';
        let topPerformersChart, myPerformanceChart, myEfficiencyChart;

        function setView(view) {
            if (view === 'coordinator') {
                body.className = 'theme-coordinator';
                managerView.classList.add('hidden');
                coordinatorView.classList.remove('hidden');
                toggleCoordinator.classList.add('active');
                toggleBroker.classList.remove('active');
                userName.textContent = "Leasing Coordinator";
                userAvatar.src = coordinatorAvatar;
                if (!myPerformanceChart) initCoordinatorCharts();
            } else {
                body.className = 'theme-broker';
                coordinatorView.classList.add('hidden');
                managerView.classList.remove('hidden');
                toggleBroker.classList.add('active');
                toggleCoordinator.classList.remove('active');
                userName.textContent = "Andrew Epstein";
                userAvatar.src = brokerAvatar;
                if (!topPerformersChart) initManagerCharts();
            }
        }
        toggleCoordinator.addEventListener('click', () => setView('coordinator'));
        toggleBroker.addEventListener('click', () => setView('broker'));

        function initManagerCharts() {
            const topPerformersTable = document.getElementById('top-performers-table')?.querySelector('tbody');
            if (topPerformersTable) {
                topPerformersTable.innerHTML = ''; 
                mockData.slice(0, 5).sort((a,b) => b.score - a.score).forEach(d => {
                    const row = document.createElement('tr');
                    row.className = 'border-b border-gray-700 hover:bg-black/20';
                    row.innerHTML = `<td class="py-3 font-medium cursor-pointer" data-agent-name="${d.broker}">${d.broker}</td><td class="py-3 text-center">${(d.totalCommission/1000).toFixed(1)}k</td><td class="py-3 text-center">${d.dealTime}d</td><td class="py-3 text-center font-bold text-green-400">${d.score}</td><td class="py-3 text-center"><button data-commission-id="${d.id}" class="view-disclosure-btn text-xs font-semibold px-2 py-1 rounded-full ${d.disclosureViewed ? 'bg-gray-600 text-gray-300' : 'bg-accent text-white'}">${d.disclosureViewed ? 'Viewed' : 'Needs Viewing'}</button></td>`;
                    topPerformersTable.appendChild(row);
                });
                topPerformersTable.addEventListener('click', (e) => {
                    const target = e.target;
                    if (target.classList.contains('view-disclosure-btn')) {
                        const commissionId = target.dataset.commissionId;
                        const agentData = mockData.find(d => d.id === commissionId);
                        openTridModal(agentData, () => {
                            target.textContent = 'Viewed';
                            target.classList.remove('bg-accent', 'text-white');
                            target.classList.add('bg-gray-600', 'text-gray-300');
                            agentData.disclosureViewed = true;
                        });
                    } else {
                        const row = e.target.closest('tr');
                        if (row) {
                            const agentName = row.dataset.agentName;
                            const agentData = mockData.find(d => d.broker === agentName);
                            openBrokerPanel(agentData);
                        }
                    }
                });
            }
            const forecasterCtx = document.getElementById('commissionForecasterChart')?.getContext('2d');
            if (forecasterCtx && !Chart.getChart(forecasterCtx)) { new Chart(forecasterCtx, { type: 'line', data: { labels: ['-90d', '-60d', '-30d', 'Today', '+30d', '+60d', '+90d'], datasets: [{ label: 'Commissions', data: [210, 250, 230, 280, 260, 300, 280], borderColor: '#8B5CF6', tension: 0.4 }, { label: 'Forecast', data: [null, null, null, 280, 260, 300, 280], borderColor: '#8B5CF6', borderDash: [5, 5], tension: 0.4 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#DCD7FE', callback: (v) => `$${v}k` } }, x: { ticks: { color: '#DCD7FE' } } } } }); }
        }

        function initCoordinatorCharts() {
            const myPerformanceCtx = document.getElementById('myPerformanceChart')?.getContext('2d');
            if (myPerformanceCtx) {
                if(myPerformanceChart) myPerformanceChart.destroy();
                myPerformanceChart = new Chart(myPerformanceCtx, { type: 'bar', data: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], datasets: [{ label: 'Commissions Processed', data: [8, 12, 9, 15], backgroundColor: '#3B82F6', borderRadius: 4, }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)'}, ticks: {color: '#D1D5DB'}, title: { display: true, text: 'Commissions Processed', color: '#9CA3AF'} }, x: { grid: { display: false }, ticks: {color: '#D1D5DB'} } } } });
            }
            const myEfficiencyCtx = document.getElementById('myEfficiencyChart')?.getContext('2d');
            if (myEfficiencyCtx) {
                if(myEfficiencyChart) myEfficiencyChart.destroy();
                myEfficiencyChart = new Chart(myEfficiencyCtx, { type: 'line', data: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], datasets: [{ label: 'Avg. Approval Time (Hours)', data: [22, 18, 25, 16], borderColor: '#3B82F6', tension: 0.4, fill: true, backgroundColor: 'rgba(59, 130, 246, 0.1)' }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)'}, ticks: {color: '#D1D5DB'}, title: { display: true, text: 'Avg. Approval Time (Hours)', color: '#9CA3AF'} }, x: { grid: { display: false }, ticks: {color: '#D1D5DB'} } } } });
            }
        }
        
        const toggleVolume = document.getElementById('toggle-volume'), toggleEfficiency = document.getElementById('toggle-efficiency'), perfChartCanvas = document.getElementById('myPerformanceChart'), effChartCanvas = document.getElementById('myEfficiencyChart'), performanceChartTitle = document.getElementById('performance-chart-title');
        if(toggleVolume) toggleVolume.addEventListener('click', () => { perfChartCanvas.classList.remove('hidden'); effChartCanvas.classList.add('hidden'); toggleVolume.classList.add('bg-accent', 'text-white'); toggleEfficiency.classList.remove('bg-accent', 'text-white'); toggleEfficiency.classList.add('text-gray-400'); performanceChartTitle.textContent = 'Weekly Volume'; });
        if(toggleEfficiency) toggleEfficiency.addEventListener('click', () => { perfChartCanvas.classList.add('hidden'); effChartCanvas.classList.remove('hidden'); toggleEfficiency.classList.add('bg-accent', 'text-white'); toggleVolume.classList.remove('bg-accent', 'text-white'); toggleVolume.classList.add('text-gray-400'); performanceChartTitle.textContent = 'Avg. Approval Time'; });
        const toggleAnnual = document.getElementById('toggle-annual'), toggleTier = document.getElementById('toggle-tier'), annualView = document.getElementById('annual-view'), tierView = document.getElementById('tier-view');
        if(toggleAnnual) toggleAnnual.addEventListener('click', () => { annualView.classList.remove('hidden'); tierView.classList.add('hidden'); toggleAnnual.classList.add('bg-accent', 'text-white'); toggleTier.classList.remove('bg-accent', 'text-white'); toggleTier.classList.add('text-gray-400'); });
        if(toggleTier) toggleTier.addEventListener('click', () => { tierView.classList.remove('hidden'); annualView.classList.add('hidden'); toggleTier.classList.add('bg-accent', 'text-white'); toggleAnnual.classList.remove('bg-accent', 'text-white'); toggleAnnual.classList.add('text-gray-400'); });

        const modal = document.getElementById('commission-modal');
        const sourceDocView = document.getElementById('source-document-view');
        const parsedDataView = document.getElementById('parsed-data-view');
        const closeModalBtn = modal.querySelector('.close-modal');
        const approveBtnContainer = document.getElementById('modal-actions');
        const successNotification = document.getElementById('success-notification');
        const generateTridBtn = document.getElementById('generate-trid-btn');
        const tridModal = document.getElementById('trid-modal');

        const mockData = Array.from({ length: 50 }, (_, i) => { const brokers = ["Jessica Wong", "Sarah Klein", "Michael B.", "David Chen", "Emily White", "James Riley", "Maria Garcia"]; const properties = ["123 Main St", "The Dime", "53 Broadway", "420 Kent Ave", "111 Varick"]; const salePrice = 1000000 + Math.random() * 2000000; const buyer = ["Jane Doe", "John Smith", "Peter Jones", "Mary Williams", "Susan Brown"][i%5]; const seller = ["Emily Davis", "Michael Miller", "David Wilson", "Sarah Moore", "James Taylor"][i%5]; const attachments = [["Purchase_Offer.pdf", "Property_Photos.zip", "Floor_Plan.pdf"], ["Signed_Comm_Agreement.docx", "Wire_Instructions.pdf", "Client_ID.jpeg"], ["Inspection_Report.pdf", "ID_Scan.jpeg", "Loan_Approval.pdf", "Bank_Statement.pdf", "Title_Report.pdf"]]; const bankInfo = ["Bank of America, Acct: ...1122", "CitiBank, Acct: ...3344", "Wells Fargo, Acct: ...5566"]; const email = `${brokers[i % brokers.length].toLowerCase().replace(/\s/g, '.')}@example.com`; const dealTime = 5 + Math.floor(Math.random() * 10); const accuracy = 90 + Math.floor(Math.random() * 10); const conflict = i < 3; const finalSalePrice = conflict ? salePrice * 1.05 : salePrice; let status = ['Needs Review', 'Approved', 'Paid', 'Awaiting Info'][i % 4]; if (conflict) status = 'Needs Review'; return { id: `C10${i+1}`, broker: brokers[i % brokers.length], email: email, property: `${properties[i % properties.length]}, Unit ${10 + i}A`, totalCommission: finalSalePrice * 0.05, dealTime: dealTime, accuracy: accuracy, score: Math.round((finalSalePrice/3000000)*40 + (1 - dealTime/15)*30 + (accuracy/100)*30), conflict: conflict, status: status, disclosureViewed: i > 10, parsedData: { propertyAddress: `${properties[i % properties.length]}, Brooklyn, NY`, buyerName: buyer, sellerName: seller, salePrice: finalSalePrice, loanAmount: finalSalePrice * 0.8, listingSideCommission: finalSalePrice * 0.025, sellerConcession: finalSalePrice * 0.02, receivingBrokerage: `${brokers[i % brokers.length]}'s Brokerage`, receivingBankInfo: bankInfo[i % bankInfo.length] }, source: { attachments: attachments[i % attachments.length], content: [{from: brokers[i%brokers.length], to:"Alex", body: `Hey Alex, starting a new deal for ${properties[i % properties.length]}. Attached is the initial <a href="#" class="hover:underline accent-color">${attachments[i % attachments.length][0]}</a>. The offer is for <span class='${conflict ? 'bg-yellow-500/30' : ''}'>${salePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>.`}, {from: "Alex", to: brokers[i % brokers.length], body: `Got it. Looks a bit low. Can they come up?`}, {from: brokers[i%brokers.length], to:"Alex", body: `Okay, they've agreed to <span class='bg-accent/20'>${finalSalePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>. Final offer. Also, here is the <a href="#" class="hover:underline accent-color">${attachments[i % attachments.length][1]}</a>.`}, {from: "Alex", to: brokers[i % brokers.length], body: `Perfect, that works. Who is the seller?`}, {from: brokers[i%brokers.length], to:"Alex", body: `Seller is <span class='bg-accent/20'>${seller}</span>. And buyer is <span class='bg-accent/20'>${buyer}</span>.`}, {from: "Alex", to: brokers[i % brokers.length], body: `Great. Last thing - can you confirm the concession?`}, {from: brokers[i%brokers.length], to:"Alex", body: `Yes, confirmed. <span class='bg-accent/20'>2% concession</span>. Also sending over the <a href="#" class="hover:underline accent-color">${attachments[i % attachments.length][2]}</a>.`}] }, auditTrail: [{category: "Ingestion", actor: "Clarity AI", action: "Commission created from email.", time: "3 days ago"}, {category: "Verification", actor:"Coordinator", action: `Corrected 'Sale Price'.`, time: "2 days ago"}, {category: "Communication", actor:"Coordinator", action: `Requested 'Wire_Instructions.pdf'.`, time: "2 days ago"},{category: "Communication", actor: brokers[i % brokers.length], action: `Uploaded 'Wire_Instructions.pdf'.`, time: "1 day ago"},{category: "Approval", actor:"Coordinator", action: `Approved by Coordinator.`, time: "4 hours ago"}, {category: "Approval", actor:"Andrew Epstein", action: `Final approval by Broker.`, time: "1 hour ago"}, {category: "Payment", actor:"System", action: `Payment scheduled.`, time: "30 minutes ago"}] }; });
        const tableBody = document.getElementById('commission-table-body');
        mockData.forEach(data => { const row = document.createElement('tr'); row.className = 'review-item border-b border-gray-700 hover:bg-black/20 cursor-pointer'; row.dataset.commissionId = data.id; row.innerHTML = `<td class="px-6 py-4 font-medium flex items-center"><a href="#" class="broker-name-clickable hover:underline">${data.broker}</a> ${data.conflict ? '<svg class="w-4 h-4 ml-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>' : ''}</td><td class="px-6 py-4 opacity-80">${data.property}</td><td class="px-6 py-4 opacity-80">${data.totalCommission.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td><td class="px-6 py-4 status-cell">${getStatusBadge(data.status)}</td>`; tableBody.appendChild(row); });
        
        tableBody.addEventListener('click', (e) => {
             if (!e.target.closest('.broker-name-clickable')) {
                const row = e.target.closest('.review-item');
                if (row) {
                    const commissionId = row.dataset.commissionId;
                    const data = mockData.find(d => d.id === commissionId);
                    
                    let chainHTML = data.source.content.map((msg, index) => `<div class="email-thread ${index === 0 ? 'expanded' : ''}"><div class="email-header flex items-center cursor-pointer"><div class="arrow mr-2">&gt;</div><div><strong>${msg.from} &gt; ${msg.to}</strong></div></div><div class="email-body pl-6 pt-2">${msg.body}</div></div>`).join('');
                    sourceDocView.innerHTML = `<h4 class="font-semibold">Original Email Chain</h4><div class="modal-bg-subtle rounded-md p-4 text-sm opacity-90 h-full font-mono space-y-2 overflow-y-auto">${chainHTML}</div>`;
                    
                    let identifiedDocsHTML = data.source.attachments.map(file => `<a href="#" class="flex items-center hover:underline"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>${file}</a>`).join('');
                    
                    let conflictAlert = data.conflict ? `<div class="bg-yellow-500/20 text-yellow-300 text-xs p-3 rounded-md mb-4"><strong>Conflict Detected:</strong> A different Sale Price was mentioned earlier in this thread. Please verify the final amount.</div>` : '';

                    parsedDataView.innerHTML = `<h4 class="font-semibold">Parsed Transaction Data</h4>${conflictAlert}<div class="modal-bg-subtle rounded-md p-4 space-y-3 text-sm">
                        <div><label class="text-xs opacity-70">Sale Price</label><input type="text" value="${data.parsedData.salePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}" class="w-full bg-transparent focus:outline-none focus:border-accent border-b border-gray-600"></div>
                        <div><label class="text-xs opacity-70">Buyer</label><input type="text" value="${data.parsedData.buyerName}" class="w-full bg-transparent focus:outline-none focus:border-accent border-b border-gray-600"></div>
                        <div><label class="text-xs opacity-70">Seller</label><input type="text" value="${data.parsedData.sellerName}" class="w-full bg-transparent focus:outline-none focus:border-accent border-b border-gray-600"></div>
                        <div><label class="text-xs opacity-70">Bank Info</label><input type="text" value="${data.parsedData.receivingBankInfo}" class="w-full bg-transparent focus:outline-none focus:border-accent border-b border-gray-600"></div>
                    </div><h4 class="font-semibold pt-4 border-t border-gray-700">Identified Documents</h4><div class="modal-bg-subtle rounded-md p-4 space-y-2 text-sm">${identifiedDocsHTML}</div>`;
                    
                    sourceDocView.querySelectorAll('.email-header').forEach(header => { header.addEventListener('click', () => header.parentElement.classList.toggle('expanded')); });

                    generateTridBtn.classList.remove('hidden');
                    generateTridBtn.dataset.commissionId = commissionId;
                    
                    const approveButtonHTML = `<span id="approved-text" class="hidden text-green-400 font-semibold text-sm mr-4">✓ Approved</span><button id="approve-btn" class="px-6 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-md">Approve</button>`;
                    approveBtnContainer.innerHTML = approveButtonHTML;
                    
                    modal.classList.remove('hidden');
                }
            }
        });

        function openTridModal(data, callback) {
            const formatCurrency = (num) => num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            document.getElementById('trid-buyer-name').value = data.parsedData.buyerName; document.getElementById('trid-seller-name').value = data.parsedData.sellerName; document.getElementById('trid-property-address').value = data.parsedData.propertyAddress; document.getElementById('trid-sale-price').value = formatCurrency(data.parsedData.salePrice);
            const dueFromBuyer = data.parsedData.salePrice; const paidByBuyer = data.parsedData.loanAmount;
            document.getElementById('trid-due-from-buyer').value = formatCurrency(dueFromBuyer); document.getElementById('trid-summary-sale-price-buyer').value = formatCurrency(data.parsedData.salePrice); document.getElementById('trid-paid-by-buyer').value = formatCurrency(paidByBuyer); document.getElementById('trid-loan-amount').value = formatCurrency(paidByBuyer); document.getElementById('trid-cash-to-close').value = formatCurrency(dueFromBuyer - paidByBuyer);
            const dueToSeller = data.parsedData.salePrice; const dueFromSeller = data.parsedData.listingSideCommission + data.parsedData.sellerConcession;
            document.getElementById('trid-due-to-seller').value = formatCurrency(dueToSeller); document.getElementById('trid-summary-sale-price-seller').value = formatCurrency(data.parsedData.salePrice); document.getElementById('trid-due-from-seller').value = formatCurrency(dueFromSeller); document.getElementById('trid-listing-comm').value = formatCurrency(data.parsedData.listingSideCommission); document.getElementById('trid-seller-concession').value = formatCurrency(data.parsedData.sellerConcession); document.getElementById('trid-cash-to-seller').value = formatCurrency(dueToSeller - dueFromSeller);
            document.getElementById('trid-receiving-brokerage').value = data.parsedData.receivingBrokerage; document.getElementById('trid-receiving-bank-info').value = data.parsedData.receivingBankInfo;
            tridModal.classList.remove('hidden');
            if(callback) {
                document.getElementById('close-trid-modal').addEventListener('click', callback, {once: true});
            }
        }

        generateTridBtn.addEventListener('click', (e) => { const commissionId = e.target.dataset.commissionId; const data = mockData.find(d => d.id === commissionId); modal.classList.add('hidden'); openTridModal(data); });

        closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
        document.getElementById('print-trid-btn').addEventListener('click', () => window.print());
        document.getElementById('close-trid-modal').addEventListener('click', () => tridModal.classList.add('hidden'));
        
        approveBtnContainer.addEventListener('click', (e) => {
            if (e.target.id === 'approve-btn') {
                const commissionId = generateTridBtn.dataset.commissionId;
                const row = tableBody.querySelector(`[data-commission-id="${commissionId}"]`);
                if (row) { row.querySelector('.status-cell').innerHTML = getStatusBadge('Approved'); }

                const approveButton = document.getElementById('approve-btn');
                approveButton.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg> Notify Agent`;
                approveButton.id = 'notify-btn';
                
                document.getElementById('approved-text').classList.remove('hidden');

            } else if (e.target.id === 'notify-btn') {
                modal.classList.add('hidden'); 
                showNotification('Notification sent to agent!');
            }
        });
        
        const panel = document.getElementById('broker-panel'), overlay = document.getElementById('panel-overlay'), closePanelBtn = document.getElementById('close-panel-btn');
        function openBrokerPanel(agentData) {
            document.getElementById('panel-agent-name').textContent = agentData.broker;
            const emailLink = document.getElementById('panel-agent-email');
            emailLink.textContent = agentData.email;
            emailLink.href = `mailto:${agentData.email}`;
            document.getElementById('panel-agent-score').textContent = agentData.score; 
            
            const groupedLog = agentData.auditTrail.reduce((acc, item) => {
                acc[item.category] = acc[item.category] || [];
                acc[item.category].push(item);
                return acc;
            }, {});

            let historyHTML = Object.keys(groupedLog).map(category => {
                let itemsHTML = groupedLog[category].map(item => `<div class="flex items-start text-xs ml-5 mt-2"><div class="mr-2 mt-1">${getIcon(item.action)}</div><div><p>${item.action} by <strong>${item.actor}</strong></p><p class="opacity-60">${item.time}</p></div></div>`).join('');
                return `<div class="log-item expanded"><div class="log-header flex items-center cursor-pointer font-semibold"><div class="arrow mr-2">&gt;</div>${category}</div><div class="log-body pl-4 border-l border-gray-600 ml-2">${itemsHTML}</div></div>`;
            }).join('');

            document.getElementById('panel-history').innerHTML = `<div class="log-item expanded"><div class="log-header flex items-center cursor-pointer font-semibold"><div class="arrow mr-2">&gt;</div>${agentData.property}</div><div class="log-body pl-4 border-l border-gray-600 ml-2">${historyHTML}</div></div>`;
            document.querySelectorAll('.log-header').forEach(header => { header.addEventListener('click', () => header.parentElement.classList.toggle('expanded')); });
            
            panel.classList.add('is-open');
            overlay.classList.remove('hidden');
            overlay.style.opacity = '1';
        }
        document.getElementById('coordinator-view').addEventListener('click', function(e) { if (e.target.classList.contains('broker-name-clickable')) { e.preventDefault(); const commissionId = e.target.closest('.review-item').dataset.commissionId; const agentData = mockData.find(d => d.id === commissionId); openBrokerPanel(agentData); } });
        
        panel.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-disclosure-link')) {
                const commissionId = e.target.dataset.commissionId;
                const agentData = mockData.find(d => d.id === commissionId);
                closePanel();
                openTridModal(agentData);
            }
        });
        
        function getIcon(action) {
             if(action.includes('created')) return `<svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
             if(action.includes('Corrected')) return `<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg>`;
             if(action.includes('Approved')) return `<svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zM9 12a1 1 0 112 0 1 1 0 01-2 0z" clip-rule="evenodd"></path></svg>`;
             if(action.includes('Requested') || action.includes('Uploaded')) return `<svg class="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.739 0 3.5 3.5 0 01-.369 6.98zM5 13a3.5 3.5 0 01-.738-6.938 4 4 0 117.938 0A3.5 3.5 0 015 13z"></path></svg>`;
             return `<svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm2 8a1 1 0 001-1v-3a1 1 0 10-2 0v3a1 1 0 001 1z" clip-rule="evenodd"></path></svg>`;
        }
        function getStatusBadge(status) { const colors = { "Needs Review": "bg-yellow-500/20 text-yellow-300", "Approved": "bg-blue-500/20 text-blue-300", "Paid": "bg-green-500/20 text-green-300", "Awaiting Info": "bg-orange-500/20 text-orange-300" }; const dotColors = { "Needs Review": "bg-yellow-400", "Approved": "bg-blue-400", "Paid": "bg-green-400", "Awaiting Info": "bg-orange-400" }; return `<span class="inline-flex items-center ${colors[status]} text-xs font-medium px-2.5 py-0.5 rounded-full"><span class="w-2 h-2 mr-1 ${dotColors[status]} rounded-full"></span>${status}</span>`; }
        function closePanel() { panel.classList.remove('is-open'); overlay.style.opacity = '0'; setTimeout(() => overlay.classList.add('hidden'), 300); }
        closePanelBtn.addEventListener('click', closePanel);
        overlay.addEventListener('click', closePanel);

        document.getElementById('invite-portal-btn')?.addEventListener('click', () => showNotification('Invite sent to agent!'));
        function showNotification(message) {
            const notification = document.getElementById('success-notification');
            notification.textContent = message;
            notification.classList.remove('hidden');
            setTimeout(() => notification.classList.add('hidden'), 3000);
        }
        
        setView('coordinator');
    });
    </script>
</body>
</html>

