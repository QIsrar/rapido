'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Home, Hammer, Wrench, X, AlertCircle, MapPin, Sparkles } from 'lucide-react';
import { PROJECT_TYPES, MIN_BUDGET_BY_TYPE, type ProjectType } from '@/types/database';
import { createProject } from '@/lib/actions';
import { saveDraftProject } from '@/lib/offline-store';

interface AddProjectDialogProps {
  buttonVariant?: 'primary' | 'outline' | 'compact';
  className?: string;
}

const typeIcons: Record<ProjectType, typeof Home> = {
  'New Build': Home,
  Renovation: Hammer,
  Maintenance: Wrench,
};

export function AddProjectDialog({
  buttonVariant = 'primary',
  className = '',
}: AddProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('New Build');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 5-second countdown celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationName, setCelebrationName] = useState('');

  const formatBudgetPreview = (numStr: string) => {
    const val = Number(numStr);
    if (!numStr || isNaN(val) || val <= 0) return null;
    if (val >= 10000000) {
      return `Rs. ${(val / 10000000).toFixed(2)} Crore (PKR ${val.toLocaleString('en-PK')})`;
    }
    if (val >= 100000) {
      return `Rs. ${(val / 100000).toFixed(2)} Lac (PKR ${val.toLocaleString('en-PK')})`;
    }
    return `PKR ${val.toLocaleString('en-PK')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Project name is required.');
      return;
    }

    const budgetNum = Number(budget);
    if (!budget || isNaN(budgetNum) || budgetNum <= 0) {
      setErrorMsg('Total budget must be a positive number in PKR.');
      return;
    }

    if (budget.includes('.') || !Number.isInteger(budgetNum)) {
      setErrorMsg('Total budget must be a whole number (no decimals or paisas).');
      return;
    }

    const minRequired = MIN_BUDGET_BY_TYPE[type] || 10000;
    if (budgetNum < minRequired) {
      setErrorMsg(
        `Minimum budget for ${type} is Rs. ${minRequired.toLocaleString('en-PK')} PKR (Maintenance: Rs. 10k, Renovation: Rs. 50k, New Build: Rs. 100k).`
      );
      return;
    }

    // Check if device is offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      saveDraftProject({
        name: trimmedName,
        type,
        total_budget: budgetNum,
        location: location.trim() || undefined,
      });

      setCelebrationName(trimmedName);
      setShowCelebration(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rapido-draft-updated'));
      }

      setTimeout(() => {
        setShowCelebration(false);
      }, 5000);

      setName('');
      setType('New Build');
      setBudget('');
      setLocation('');
      setOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createProject({
        name: trimmedName,
        type,
        total_budget: budgetNum,
        location: location.trim() || undefined,
      });

      if (!res.success || !res.data) {
        // If network failed, save as draft
        if (res.error?.includes('fetch failed') || res.error?.includes('Network')) {
          saveDraftProject({
            name: trimmedName,
            type,
            total_budget: budgetNum,
            location: location.trim() || undefined,
          });
          setCelebrationName(trimmedName);
          setShowCelebration(true);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('rapido-draft-updated'));
          }
          setTimeout(() => {
            setShowCelebration(false);
          }, 5000);
          setName('');
          setType('New Build');
          setBudget('');
          setLocation('');
          setOpen(false);
          return;
        }

        setErrorMsg(res.error || 'Failed to create project.');
        setIsSubmitting(false);
        return;
      }

      const createdId = res.data.id;
      const createdName = res.data.name;

      // Trigger 5s celebration animation
      setCelebrationName(createdName);
      setShowCelebration(true);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 5000);

      // Reset form & close sheet
      setName('');
      setType('New Build');
      setBudget('');
      setLocation('');
      setOpen(false);

      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      {buttonVariant === 'primary' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-black shadow-md shadow-orange-600/30 transition-all tap-scale ${className}`}
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          New Project
        </button>
      ) : buttonVariant === 'compact' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Add New Project"
          className={`inline-flex items-center justify-center h-9 w-9 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white shadow-md transition-all tap-scale ${className}`}
        >
          <Plus className="h-4 w-4 stroke-[3]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 active:scale-95 text-xs font-black text-slate-800 shadow-xs transition-all tap-scale ${className}`}
        >
          <Plus className="h-3.5 w-3.5 text-orange-600 stroke-[3]" />
          New Project
        </button>
      )}

      {/* 5-second Success Celebration Banner */}
      {showCelebration && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-[99999] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 border-2 border-orange-500 shadow-2xl shadow-orange-500/20 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-xl shrink-0">
                  🎉
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    Project Created Successfully!
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                aria-label="Close"
                className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* 5-second animated progress bar */}
            <div className="mt-3 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-amber-400 h-full w-full origin-left" 
                style={{ animation: 'shrink 5s linear forwards' }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bottom Sheet modal */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="h-[84dvh] rounded-t-3xl border-t-2 border-slate-300 bg-white px-5 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="pb-3 text-left">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-black text-slate-900">
                Create New Project
              </SheetTitle>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close dialog"
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Start date and time are automatically recorded upon creation.
            </p>
          </SheetHeader>

          {errorMsg && (
            <div className="p-3 mb-3 rounded-xl bg-red-50 border-2 border-red-200 text-xs font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 overflow-y-auto max-h-[calc(84dvh-120px)] pr-1">
            {/* Project Name */}
            <div className="space-y-1.5">
              <Label htmlFor="projectName" className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Project Name *
              </Label>
              <Input
                id="projectName"
                type="text"
                placeholder="e.g. Jinnahabad 10-Marla Build"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-200"
              />
            </div>

            {/* Site Location (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="projectLocation" className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-orange-500" />
                  Site Location / Google Maps Link
                </span>
                <span className="text-[10px] font-bold text-slate-400 normal-case">(Optional)</span>
              </Label>
              <Input
                id="projectLocation"
                type="text"
                placeholder="e.g. Sector F-7, Islamabad or https://maps.app.goo.gl/..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-12 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-200"
              />
            </div>

            {/* Project Type Chips */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Project Type *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {PROJECT_TYPES.map((t) => {
                  const Icon = typeIcons[t];
                  const isSelected = type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 text-center transition-all tap-scale cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-600 font-black shadow-xs ring-1 ring-orange-500/30'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span className="text-xs leading-tight">{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget (Required) */}
            <div className="space-y-1.5">
              <Label htmlFor="projectBudget" className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Total Budget (PKR) *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-500">
                  Rs.
                </span>
                <Input
                  id="projectBudget"
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min={MIN_BUDGET_BY_TYPE[type]}
                  placeholder={String(MIN_BUDGET_BY_TYPE[type])}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  className="h-14 pl-14 text-xl font-black rounded-xl border-2 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-200"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold px-0.5">
                <span className="text-slate-600">
                  Minimum: <span className="text-slate-900 font-extrabold">Rs. {MIN_BUDGET_BY_TYPE[type].toLocaleString('en-PK')} PKR</span>
                </span>
                <span className="text-slate-500 font-semibold">
                  Whole rupees only
                </span>
              </div>
              {/* Live Pakistani Lakh/Crore preview to prevent input typos */}
              {formatBudgetPreview(budget) && (
                <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200/80 text-xs font-black text-orange-700 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-orange-600" />
                  <span>{formatBudgetPreview(budget)}</span>
                </div>
              )}
              <p className="text-[11px] font-medium text-slate-500">
                Required to track spending limits and progress bars.
              </p>
            </div>

            {/* Info note */}
            <div className="rounded-xl bg-slate-100 border-2 border-slate-200 p-3 text-[11px] text-slate-600 font-medium">
              ⏱️ <span className="font-bold text-slate-800">Auto-recorded:</span> Current date &amp; time will be assigned as the project start timestamp.
            </div>

            {/* Submit */}
            <div className="pt-2 pb-4">
              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-base font-black text-white shadow-xl shadow-orange-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 tap-scale"
              >
                {isSubmitting || isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
