import { useState } from 'react';

function groupEvents(events) {
  return events.reduce((acc, event) => {
    const category = event.category ?? event.event_type ?? 'Other';
    if (!acc.has(category)) {
      acc.set(category, []);
    }
    acc.get(category).push(event);
    return acc;
  }, new Map());
}

const baseItemClasses =
  'rounded-[18px] border-l-4 border-charney-red bg-[#fff1eb] p-4 dark:bg-charney-charcoal/50';

export default function AuditTrailList({
  events = [],
  defaultCollapsed = false,
  showToggle = true,
  variant = 'modal',
}) {
  const grouped = Array.from(groupEvents(events));
  const [collapsedCategories, setCollapsedCategories] = useState(() =>
    new Set(defaultCollapsed ? grouped.map(([category]) => category) : []),
  );

  if (!grouped.length) {
    return (
      <p className="rounded-xl border border-dashed border-charney-light-gray p-6 text-center font-brand text-xs uppercase tracking-[0.3em] text-charney-gray">
        No audit events recorded yet
      </p>
    );
  }

  const toggleCategory = (category) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const isPanel = variant === 'panel';

  return (
    <div className={isPanel ? 'space-y-3' : 'space-y-5'} data-testid="audit-trail-list">
      {grouped.map(([category, items]) => {
        const isCollapsed = collapsedCategories.has(category);
        const sectionClasses = isPanel
          ? 'rounded-[18px] bg-white dark:bg-charney-charcoal/60 border border-charney-light-gray/60'
          : 'rounded-[22px] border border-[#f3e5d9] bg-[#fffdf9] p-5 shadow-[0_16px_28px_-28px_rgba(41,37,33,0.35)] dark:border-charney-gray/40 dark:bg-charney-charcoal/40';

        return (
          <section key={category} className={sectionClasses}>
            <header
              className={
                isPanel
                  ? 'flex items-center gap-2 border-b border-charney-light-gray px-4 py-3'
                  : 'flex items-center justify-between'
              }
            >
              {isPanel ? (
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-3 text-left font-brand text-[0.72rem] font-black uppercase tracking-[0.32em] text-charney-red focus:outline-none"
                  aria-expanded={!isCollapsed}
                  aria-controls={`audit-group-${category}`}
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M6 4l8 6-8 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{category}</span>
                </button>
              ) : showToggle ? (
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-3 rounded-full border border-charney-light-gray px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-charney-gray hover:bg-charney-light-gray/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-charney-red"
                  aria-expanded={!isCollapsed}
                  aria-controls={`audit-group-${category}`}
                >
                  <span className="font-brand text-[0.72rem] font-black uppercase tracking-[0.32em] text-charney-red">
                    {category}
                  </span>
                  {isCollapsed ? 'Expand' : 'Collapse'}
                </button>
              ) : (
                <span className="font-brand text-[0.72rem] font-black uppercase tracking-[0.32em] text-charney-red">
                  {category}
                </span>
              )}
            </header>
            <ul
              id={`audit-group-${category}`}
              className={`transition-[max-height,opacity] ${
                isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-[40rem] opacity-100'
              } ${isPanel ? 'px-4 pb-3 space-y-3' : 'mt-4 space-y-3'}`}
            >
              {items.map((event) => {
                const actor = event.actor_name ?? event.actor ?? 'Unknown Actor';
                const timestamp = event.created_at ?? event.time ?? null;
                const actionText =
                  event.action ??
                  event.description ??
                  (event.metadata?.message
                    ? String(event.metadata.message)
                    : event.metadata
                    ? JSON.stringify(event.metadata)
                    : event.event_type ?? 'Updated record.');

                return (
                  <li key={event.id ?? `${category}-${actor}-${actionText}`} className={isPanel ? 'border-l-4 border-charney-red bg-white px-4 py-3 dark:bg-charney-charcoal/50' : baseItemClasses}>
                    <p className="font-brand text-[0.68rem] font-black uppercase tracking-[0.32em] text-charney-black dark:text-charney-cream">
                      {actor}
                      {timestamp ? (
                        <span className="ml-2 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-charney-gray">
                          {new Date(timestamp).toLocaleString()}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-charney-gray dark:text-charney-cream">{actionText}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
