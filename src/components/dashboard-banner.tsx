'use client';

import { useState, useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

export function DashboardBanner() {
  const [deletedMsg, setDeletedMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const msg = sessionStorage.getItem('deletedProjectNotice');
      if (msg) {
        setDeletedMsg(msg);
        sessionStorage.removeItem('deletedProjectNotice');
        const timer = setTimeout(() => setDeletedMsg(null), 5000);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  if (!deletedMsg) return null;

  return (
    <div className="mb-4 animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-200 text-red-900 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-red-100 border border-red-300 text-red-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-red-800 truncate">
            {deletedMsg}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDeletedMsg(null)}
          className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
