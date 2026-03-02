'use client';

interface PillTabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function PillTabs({ tabs, activeTab, onChange }: PillTabsProps) {
  return (
    <div className="bg-zinc-100 rounded-full p-1 inline-flex gap-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={
              isActive
                ? 'bg-white text-zinc-900 text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm transition-all'
                : 'text-zinc-500 text-sm font-medium px-4 py-1.5 rounded-full cursor-pointer hover:text-zinc-700 transition-colors'
            }
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="inline ml-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
