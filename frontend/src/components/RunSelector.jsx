import { useState, useRef, useEffect } from 'react';

const ITEM_HEIGHT = 40;
const MAX_VISIBLE = 5;

export default function RunSelector({ runs, onSelect }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedRun = runs.find((r) => r.id === selectedId);

  const handlePick = (run) => {
    setSelectedId(run.id);
    setOpen(false);
    onSelect(run.id);
  };

  return (
    <div ref={containerRef} className="relative font-mono text-xs uppercase tracking-widest">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 px-3 py-2 bg-panel border border-line text-muted hover:text-text rounded-sm transition-colors min-w-[220px] justify-between"
      >
        <span className={selectedRun ? 'text-teal' : ''}>
          {selectedRun
            ? `#${selectedRun.id} · ${selectedRun.episodes}ep · best ${selectedRun.best_score}`
            : 'Load past run'}
        </span>
        <span className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-full bg-panel border border-line rounded-sm overflow-hidden z-10 p-1"
        >
          <div
            className="runs-scroll overflow-y-auto pr-2"
            style={{ maxHeight: ITEM_HEIGHT * MAX_VISIBLE }}
          >
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => handlePick(run)}
                style={{ height: ITEM_HEIGHT }}
                className={`w-full flex items-center px-3 text-left border-b border-line last:border-b-0 transition-colors rounded-xs text-[10px] ${
                  run.id === selectedId
                    ? 'bg-teal text-ink'
                    : 'text-muted hover:bg-line hover:text-text'
                }`}
              >
                #{run.id} · {run.episodes}ep · best {run.best_score}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
