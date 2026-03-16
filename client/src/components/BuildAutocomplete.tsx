import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function BuildAutocomplete({ value, onChange, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const timeoutRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value || value.length < 1 || !focused) {
      setSuggestions([]);
      return;
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      api<{ builds: any[] }>(`/builds/search?q=${encodeURIComponent(value)}`)
        .then(d => {
          setSuggestions(d.builds.slice(0, 6));
          setOpen(true);
        })
        .catch(() => setSuggestions([]));
    }, 200);

    return () => clearTimeout(timeoutRef.current);
  }, [value, focused]);

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex items-center border-b border-t-dim/30 pb-1">
        <span className="text-t-dim mr-2">@</span>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => { setFocused(false); setOpen(false); }, 150)}
          placeholder={placeholder || 'type to search...'}
          className="bg-transparent border-none outline-none text-t-hi flex-1 uppercase tracking-wider"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 left-0 right-0 top-full mt-1 border border-t-dim/20 bg-black">
          {suggestions.map(b => (
            <button
              key={b.id}
              onMouseDown={() => { onChange(b.name); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-t-accent/10 transition-colors flex justify-between items-center"
            >
              <span>
                <span className="text-t-hi text-sm uppercase tracking-wider">@{b.name}</span>
                <span className="text-t-dim text-xs ml-2 uppercase tracking-widest">{b.archetype_name}</span>
              </span>
              <span className="text-t-accent text-sm">{(b.gg_score ?? 0).toFixed(1)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
