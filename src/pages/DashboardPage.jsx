import { useEffect } from 'react';
import Chart from 'chart.js/auto';
import { initLegacyDashboard } from './initLegacyDashboard';
import './dashboard.css';
import DashboardHeader from '../components/DashboardHeader.jsx';
import BrokerView from '../components/BrokerView.jsx';
import CoordinatorView from '../components/CoordinatorView.jsx';
import CommissionModal from '../components/CommissionModal.jsx';
import NotificationToast from '../components/NotificationToast.jsx';
import { useDashboardContext } from '../context/DashboardContext.jsx';

export default function DashboardPage() {
  const { activeView, activeCommissionId, setActiveCommissionId, commissions, setNotification } = useDashboardContext();
  const activeCommission = commissions.find((item) => item.id === activeCommissionId);
  useEffect(() => {
    const previousChart = window.Chart;
    window.Chart = Chart;
    const cleanup = initLegacyDashboard();

    return () => {
      cleanup?.();
      if (previousChart) {
        window.Chart = previousChart;
      } else {
        delete window.Chart;
      }
    };
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <BrokerView hidden={activeView !== 'broker'} />
        <CoordinatorView hidden={activeView !== 'coordinator'} />
      </main>
      <CommissionModal
        isOpen={Boolean(activeCommission)}
        commissionRecord={activeCommission}
        onClose={() => setActiveCommissionId(null)}
        onAction={(type) => {
          if (activeCommission) {
            setNotification({ type, commissionId: activeCommission.id });
          }
          setActiveCommissionId(null);
        }}
      />
      <NotificationToast />

      <div id="panel-overlay" className="panel-overlay fixed inset-0 z-30 hidden bg-black bg-opacity-50" />
      <div id="broker-panel" className="panel fixed top-0 right-0 z-40 h-full w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 id="panel-agent-name" className="text-2xl font-black uppercase tracking-tighter">
            Agent Details
          </h3>
          <button id="close-panel-btn" className="text-3xl opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>
        <div className="panel-nav mb-6 flex border-b-2 border-charney-light-gray">
          <button className="panel-nav-btn active border-b-4 border-transparent py-2 px-4 text-sm font-bold uppercase" data-panel="history">
            Transaction History
          </button>
          <button className="panel-nav-btn border-b-4 border-transparent py-2 px-4 text-sm font-bold uppercase" data-panel="plan">
            Commission Plan
          </button>
        </div>
        <div id="panel-history-content" className="panel-content">
          <p>
            <strong>Contact:</strong>{' '}
            <a id="panel-agent-email" href="#" className="text-charney-red hover:underline" />
          </p>
          <p>
            <strong>Performance Score:</strong>{' '}
            <span id="panel-agent-score" className="font-bold text-charney-red" />
          </p>
          <h4 className="mt-4 border-t border-charney-light-gray pt-4 font-bold uppercase">Transactions</h4>
          <div id="panel-history" className="mt-2 space-y-4" />
        </div>
        <div id="panel-plan-content" className="panel-content hidden space-y-8">
          <div className="card p-6">
            <h4 className="mb-4 text-xl font-black tracking-tighter">
              Primary <span className="text-charney-red">Split &amp; Cap</span>
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="form-label" htmlFor="agent-split">
                  Agent Split (%)
                </label>
                <input id="agent-split" type="number" className="form-input" defaultValue={70} />
              </div>
              <div>
                <label className="form-label" htmlFor="brokerage-split">
                  Brokerage Split (%)
                </label>
                <input id="brokerage-split" type="number" className="form-input" defaultValue={30} disabled />
              </div>
            </div>
            <div className="mt-6">
              <label className="form-label" htmlFor="commission-cap">
                Annual Commission Cap ($)
              </label>
              <input id="commission-cap" type="number" className="form-input" defaultValue={20000} />
            </div>
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-bold uppercase text-charney-gray tracking-wider">Progress to Cap</h4>
              <div className="mb-1 h-3 w-full rounded-full bg-charney-light-gray">
                <div id="cap-progress-bar" className="h-3 rounded-full bg-charney-red" />
              </div>
              <p id="cap-progress-text" className="text-right text-sm font-bold" />
            </div>
            <div className="mt-6 border-t border-charney-light-gray pt-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-charney-gray">Standard Deductions (Fixed)</h4>
              <div className="space-y-1 text-sm text-charney-gray">
                <p>
                  <strong>Franchise Fee:</strong> <span id="display-franchise-fee" />%
                </p>
                <p>
                  <strong>E&amp;O Insurance:</strong> $<span id="display-eo-fee" />
                </p>
                <p>
                  <strong>Transaction Fee:</strong> $<span id="display-transaction-fee" />
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <button id="save-plan-btn" className="btn btn-primary">
              Save Plan
            </button>
          </div>
        </div>
      </div>

      <div
        id="commission-modal"
        className="no-print fixed inset-0 z-50 hidden items-center justify-center bg-black bg-opacity-75 p-4"
      >
        <div className="modal-content w-full max-w-6xl rounded-lg shadow-xl">
          <div className="flex items-center justify-between border-b border-charney-light-gray p-5">
            <h3 className="text-xl font-black uppercase">Commission Detail</h3>
            <button className="close-modal text-2xl opacity-70 hover:opacity-100">&times;</button>
          </div>
          <div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto p-6 md:grid-cols-3">
            <div id="source-document-view" className="space-y-4 md:col-span-1" />
            <div id="calculation-view" className="space-y-4 md:col-span-2" />
          </div>
          <div className="flex items-center justify-between border-t border-charney-light-gray p-5">
            <button id="generate-trid-btn" className="btn btn-outline hidden">
              Generate Disclosure
            </button>
            <div id="modal-actions" className="ml-auto flex items-center space-x-3" />
          </div>
        </div>
      </div>
      <div id="trid-modal" className="fixed inset-0 z-[60] hidden overflow-y-auto p-8" />
      <div
        id="success-notification"
        className="fixed right-5 top-5 z-50 hidden rounded-md bg-yellow-400 px-6 py-3 text-sm font-bold uppercase text-red-700 shadow-lg"
      />
    </div>
  );
}
