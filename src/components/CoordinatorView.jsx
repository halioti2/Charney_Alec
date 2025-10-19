import CoordinatorFocusSummary from './CoordinatorFocusSummary.jsx';
import CoordinatorQueueTable from './CoordinatorQueueTable.jsx';
import CoordinatorJourneyProgress from './CoordinatorJourneyProgress.jsx';
import CoordinatorWeeklyVolume from './CoordinatorWeeklyVolume.jsx';

export default function CoordinatorView({ hidden }) {
  return (
    <div id="coordinator-view" className={hidden ? 'hidden' : ''}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <CoordinatorFocusSummary />
          <CoordinatorQueueTable />
        </div>
        <div className="space-y-8 lg:col-span-2">
          <CoordinatorJourneyProgress />
          <CoordinatorWeeklyVolume />
        </div>
      </div>
    </div>
  );
}
