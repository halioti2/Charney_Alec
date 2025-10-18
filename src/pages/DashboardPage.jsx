import './dashboard.css';
import DashboardHeader from '../components/DashboardHeader.jsx';
import BrokerView from '../components/BrokerView.jsx';
import CoordinatorView from '../components/CoordinatorView.jsx';
import PaymentsView from '../components/PaymentsView.jsx';
import CommissionTrackerView from '../components/CommissionTrackerView.jsx';
import CommissionModal from '../components/CommissionModal.jsx';
import ToastContainer from '../components/ToastContainer.jsx';
import BrokerDetailPanel from '../components/BrokerDetailPanel.jsx';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import CommissionDashboard from './CommissionDashboard.jsx';

export default function DashboardPage() {
  const {
    activeView,
    activeCommissionId,
    setActiveCommissionId,
    modalFocus,
    setModalFocus,
    panelAgent,
    setPanelAgent,
    commissions,
  } = useDashboardContext();
  const { pushToast } = useToast();
  const activeCommission = commissions.find((item) => item.id === activeCommissionId);
  return (
    <div className="flex h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <BrokerView hidden={activeView !== 'broker'} />
        <CoordinatorView hidden={activeView !== 'coordinator'} />
        <PaymentsView hidden={activeView !== 'payments'} />
        <CommissionDashboard hidden={activeView !== 'commission'} />
      </main>
      <CommissionModal
        isOpen={Boolean(activeCommission) && modalFocus !== 'audit'}
        commissionRecord={activeCommission}
        focus="full"
        onClose={() => {
          setActiveCommissionId(null);
          setModalFocus('full');
        }}
        onAction={(type) => {
          if (activeCommission) {
            const agentName = activeCommission.broker ?? 'the agent';
            const message =
              type === 'approve'
                ? `Approved the commission for ${agentName}.`
                : type === 'request-info'
                ? `Requested additional information from ${agentName}.`
                : type === 'flag'
                ? `Flagged ${agentName}'s commission for review.`
                : 'Action completed.';
            pushToast({ message });
          }
          setActiveCommissionId(null);
          setModalFocus('full');
        }}
      />
      <ToastContainer />

      <BrokerDetailPanel
        commission={panelAgent ? commissions.find((item) => item.id === panelAgent) : null}
        onClose={() => setPanelAgent(null)}
      />
    </div>
  );
}
