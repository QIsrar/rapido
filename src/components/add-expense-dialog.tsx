'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Plus, Loader2, X, ImageIcon } from 'lucide-react';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type Project } from '@/types/database';
import { createExpense, updateExpenseReceipt } from '@/lib/actions';
import { uploadReceipt } from '@/lib/storage';

interface AddExpenseDialogProps {
  projects?: Project[];
  defaultProjectId?: string;
}

export function AddExpenseDialog({
  projects = [],
  defaultProjectId = '',
}: AddExpenseDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [category, setCategory] = useState<ExpenseCategory>('Materials');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const activeProjects = projects.filter((p) => p.status === 'active');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Only image files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File too large. Maximum size is 5MB.');
      return;
    }

    setReceiptFile(file);
    setErrorMsg('');

    // Generate preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReceiptPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const amountNum = Number(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please enter a valid expense amount.');
      return;
    }

    if (!projectId) {
      setErrorMsg('Please select a project.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the expense record
      const res = await createExpense({
        project_id: projectId,
        amount: amountNum,
        category,
        description: description.trim() || undefined,
      });

      if (!res.success || !res.data) {
        setErrorMsg(res.error || 'Failed to record expense.');
        setIsSubmitting(false);
        return;
      }

      // 2. Upload receipt if provided
      if (receiptFile && res.data.id) {
        const uploadResult = await uploadReceipt(receiptFile, res.data.id);
        if (uploadResult.url) {
          await updateExpenseReceipt(res.data.id, uploadResult.url);
        } else if (uploadResult.error) {
          // Non-blocking: expense was created, but receipt failed
          console.warn('Receipt upload failed:', uploadResult.error);
        }
      }

      // Success — reset form
      setAmount('');
      setDescription('');
      clearReceipt();
      if (!defaultProjectId) setProjectId('');
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error recording expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* FAB — Standalone floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex h-14 items-center gap-2 rounded-2xl bg-orange-500 px-5 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/40 active:scale-95 transition-all duration-200"
      >
        <Plus className="h-5 w-5" strokeWidth={3} />
        Log Expense
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[88dvh] rounded-t-3xl border-t border-slate-200 bg-white px-5 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="pb-3 text-left">
            <SheetTitle className="text-lg font-bold text-slate-900">
              Log New Expense
            </SheetTitle>
            <p className="text-xs text-slate-500">
              Records today&apos;s date and updates the project cost instantly.
            </p>
          </SheetHeader>

          {errorMsg && (
            <div className="p-3 mb-2 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-semibold text-slate-700">
                Amount (PKR) *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  Rs.
                </span>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="h-14 pl-14 text-2xl font-bold rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-300 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            {/* Project Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Project *
              </Label>
              <Select
                value={projectId}
                onValueChange={(val) => setProjectId(val || '')}
                required
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
                  <SelectValue placeholder="Select an active project..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {activeProjects.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">
                      No active projects found. Create a project first!
                    </div>
                  ) : (
                    activeProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-sm cursor-pointer">
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Category — visual chips */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Category *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`h-11 rounded-xl border text-xs font-medium transition-all tap-scale ${
                      category === cat
                        ? 'border-orange-500 bg-orange-50 text-orange-600 font-semibold shadow-xs ring-1 ring-orange-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-xs font-semibold text-slate-700"
              >
                Description (optional)
              </Label>
              <Input
                id="description"
                placeholder="e.g. 50 bags Fauji cement from supplier"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Receipt Photo Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Receipt / Bill Photo (optional)
              </Label>

              {receiptPreview ? (
                <div className="relative inline-block">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="w-24 h-24 object-cover rounded-xl border-2 border-orange-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={clearReceipt}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    title="Remove photo"
                  >
                    <X className="h-3 w-3" strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-500 transition-colors hover:border-orange-400 hover:text-orange-500 tap-scale"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-xs font-medium">Take Photo or Upload Bill</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {receiptFile && (
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 rounded-xl bg-orange-500 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {receiptFile ? 'Uploading & Saving...' : 'Recording Expense...'}
                </>
              ) : (
                'Save Expense'
              )}
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
