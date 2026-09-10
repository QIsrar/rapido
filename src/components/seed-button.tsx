'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { seedDemoData } from '@/lib/actions';

export function SeedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await seedDemoData();
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to seed sample data.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error seeding data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSeed}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-xs font-semibold text-orange-700 shadow-2xs active:scale-95 transition-all disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-600" />
      ) : (
        <Sparkles className="h-3.5 w-3.5 text-orange-600" />
      )}
      {loading ? 'Populating...' : 'Load Sample Data'}
    </button>
  );
}
