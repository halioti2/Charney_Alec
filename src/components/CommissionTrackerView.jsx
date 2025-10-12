export default function CommissionTrackerView({ hidden }) {
  return (
    <section
      id="commission-tracker-view"
      className={hidden ? 'hidden' : 'space-y-6'}
      aria-labelledby="commission-tracker-title"
    >
      <header>
        <h2 id="commission-tracker-title" className="text-2xl font-black uppercase tracking-tight">
          Commission Tracker
        </h2>
        <p className="text-sm text-charney-gray">
          This tab will contain the Commission visualization dashboards (agent performance, drill-downs, stalled
          deals). Build work inside `src/features/commissionViz/`.
        </p>
      </header>
      <div className="rounded-xl border border-charney-light-gray bg-white p-6 shadow-sm dark:border-charney-gray/70 dark:bg-charney-charcoal/50">
        <p className="text-sm text-charney-gray">
          Placeholder: Replace with Track C components (AgentPerformanceTable, AgentDetailsView, pipeline visuals).
        </p>
      </div>
    </section>
  );
}
