'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Hammer, Building2, Wrench, Loader2, X } from 'lucide-react';
import { PROJECT_TYPES, type ProjectType } from '@/types/database';
import { createProject } from '@/lib/actions';

interface AddProjectDialogProps {
  buttonVariant?: 'primary' | 'outline' | 'compact';
  className?: string;
}

export function AddProjectDialog({
  buttonVariant = 'outline',
  className = '',
}: AddProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('New Build');
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const typeIcons: Record<ProjectType, React.ElementType> = {
    'New Build': Building2,
    Renovation: Hammer,
    Maintenance: Wrench,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a project name.');
      return;
    }

    const budgetNum = Number(budget);
    if (!budget || isNaN(budgetNum) || budgetNum <= 0) {
      setErrorMsg('Please enter a valid budget amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createProject({
        name: name.trim(),
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
      router.refresh();
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
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-semibold shadow-sm shadow-orange-500/20 transition-all ${className}`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Project
        </button>
      ) : buttonVariant === 'compact' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Add New Project"
          className={`inline-flex items-center justify-center h-8 w-8 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-sm transition-all ${className}`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-xs font-semibold text-slate-700 shadow-xs transition-all ${className}`}
        >
          <Plus className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.5} />
          New Project
        </button>
      )}

      {/* Bottom Sheet modal */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[80dvh] rounded-t-3xl border-t border-slate-200 bg-white px-5 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="pb-3 text-left">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold text-slate-900">
                Create New Project
              </SheetTitle>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close dialog"
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Start date and time are automatically recorded upon creation.
            </p>
          </SheetHeader>

          {errorMsg && (
            <div className="p-3 mb-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 overflow-y-auto">
            {/* Project Name */}
            <div className="space-y-1.5">
              <Label htmlFor="projectName" className="text-xs font-semibold text-slate-700">
                Project Name *
              </Label>
              <Input
                id="projectName"
                type="text"
                placeholder="e.g. Jinnahabad 10-Marla Build"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-500"
              />
            </div>

            {/* Project Type Chips */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
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
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-600 font-semibold shadow-xs ring-1 ring-orange-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
              <Label htmlFor="projectBudget" className="text-xs font-semibold text-slate-700">
                Total Budget (PKR) *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
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
                  className="h-13 pl-13 text-xl font-bold rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-300 focus-visible:ring-orange-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Required to track spending limits and progress bars.
              </p>
            </div>

            {/* Info note */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 text-[11px] text-slate-500">
              ⏱️ <span className="font-semibold text-slate-700">Auto-recorded:</span> Current date & time will be assigned as the project start timestamp.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 rounded-xl bg-orange-500 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Project...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
