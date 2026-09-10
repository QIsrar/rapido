'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Home, Hammer, Wrench, X, AlertCircle } from 'lucide-react';
import { PROJECT_TYPES, type ProjectType } from '@/types/database';
import { createProject } from '@/lib/actions';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

    setIsSubmitting(true);
    try {
      const res = await createProject({
        name: trimmedName,
        type,
        total_budget: budgetNum,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create project.');
        setIsSubmitting(false);
        return;
      }

      // Success
      setName('');
      setType('New Build');
      setBudget('');
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

      {/* Bottom Sheet modal */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
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
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
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
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 text-center transition-all tap-scale ${
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
                  placeholder="5000000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  className="h-14 pl-14 text-xl font-black rounded-xl border-2 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-200"
                />
              </div>
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
