import { useDashboardContext } from '../context/DashboardContext.jsx';

const moonIcon = (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

const sunIcon = (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.121-3.536a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM3.05 4.536a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zm1.414 10.434l.707-.707a1 1 0 10-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm14-4.95l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

export default function DashboardHeader() {
  const { user, theme, toggleTheme, activeView, switchView } = useDashboardContext();
  const isDark = theme === 'dark';

  return (
    <header className="header no-print z-20 flex flex-shrink-0 items-center justify-between px-4 py-4 md:px-6">
      <div className="flex items-center space-x-3">
        <svg width="28" height="28" viewBox="0 0 24 24" className="text-charney-black" fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z"
          />
          <path d="M12 6C11.4477 6 11 6.44772 11 7V11H7C6.44772 11 6 11.4477 6 12C6 12.5523 6.44772 13 7 13H11V17C11 17.5523 11.4477 18 12 18C12.5523 18 13 17.5523 13 17V7C13 6.44772 12.5523 6 12 6Z" />
        </svg>
        <h1 className="text-2xl font-black uppercase tracking-tighter">
          Clar<span className="text-charney-red">i</span>ty
        </h1>
      </div>
      <nav className="view-toggle flex items-center space-x-2">
        {[
          { id: 'broker', label: 'Broker' },
          { id: 'coordinator', label: 'Coordinator' },
          { id: 'payments', label: 'Payments' },
          { id: 'commission', label: 'Commission Tracker' },
        ].map((view, index, arr) => (
          <div key={view.id} className="flex items-center space-x-2">
            <button
              type="button"
              className={`text-sm font-bold uppercase transition ${
                activeView === view.id ? 'active text-charney-red' : ''
              }`}
              onClick={() => switchView(view.id)}
            >
              {view.label}
            </button>
            {index < arr.length - 1 ? <span className="text-charney-gray">/</span> : null}
          </div>
        ))}
      </nav>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-full p-2 hover:bg-black/10 focus:outline-none dark:hover:bg-white/10"
          aria-label="Toggle theme"
        >
          {isDark ? sunIcon : moonIcon}
        </button>
        <span className="text-sm font-bold uppercase">{user.name}</span>
        <img
          className="h-9 w-9 rounded-full border-2 border-charney-black object-cover dark:border-charney-cream"
          src={user.avatarUrl}
          alt={`${user.name} avatar`}
        />
      </div>
    </header>
  );
}
