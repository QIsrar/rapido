'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
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
} from '@/components/ui/select';
import {
  Camera,
  Plus,
  Loader2,
  X,
  ImageIcon,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  MapPin,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  PROJECT_TYPES,
  type ExpenseCategory,
  type Project,
  type ProjectType,
} from '@/types/database';
import {
  createExpense,
  createProject,
  updateExpenseReceipt,
  uploadReceiptAction,
} from '@/lib/actions';
import { uploadReceipt } from '@/lib/storage';
import { formatPKR } from '@/lib/utils';


interface AddExpenseDialogProps {
  projects?: Project[];
  defaultProjectId?: string;
}

export function AddExpenseDialog({
  projects: initialProjects = [],
  defaultProjectId = '',
}: AddExpenseDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [localProjects, setLocalProjects] = useState<Project[]>(initialProjects);
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Materials');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Quick project creation state
  const [showQuickProject, setShowQuickProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('New Build');
  const [newProjectBudget, setNewProjectBudget] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [quickProjectSuccess, setQuickProjectSuccess] = useState('');

  // Sync projects prop
  useEffect(() => {
    setLocalProjects(initialProjects);
  }, [initialProjects]);

  // Sync defaultProjectId when opened
  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    } else if (!projectId && localProjects.length > 0) {
      const firstActive = localProjects.find((p) => p.status === 'active');
      if (firstActive) setProjectId(firstActive.id);
    }
  }, [defaultProjectId, open, localProjects]);

  // Only active projects can accept new expenses
  const availableProjects = localProjects.filter((p) => p.status === 'active');

  const selectedProject = localProjects.find((p) => p.id === projectId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Receipt image must be under 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Only image files are supported.');
      return;
    }

    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptPreview(reader.result as string);
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

  const handleQuickCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setQuickProjectSuccess('');

    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      setErrorMsg('Please enter a project name.');
      return;
    }
    const budgetNum = Number(newProjectBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setErrorMsg('Please enter a valid budget amount in PKR.');
      return;
    }

    setIsCreatingProject(true);
    try {
      const res = await createProject({
        name: trimmedName,
        type: newProjectType,
        total_budget: budgetNum,
        location: newProjectLocation.trim() || undefined,
      });

      if (res.success && res.data) {
        setLocalProjects((prev) => [res.data!, ...prev]);
        setProjectId(res.data.id);
        setShowQuickProject(false);
        setNewProjectName('');
        setNewProjectBudget('');
        setNewProjectLocation('');
        setQuickProjectSuccess(`Project "${res.data.name}" created and selected!`);
        startTransition(() => {
          router.refresh();
        });
      } else {
        setErrorMsg(res.error || 'Failed to create project.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creating project.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setQuickProjectSuccess('');

    const amountNum = Number(amount);
    if (!amount || isNaN(amountNum) || amountNum < 10) {
      setErrorMsg('Please enter an expense amount of at least Rs. 10.');
      return;
    }

    if (!projectId) {
      setErrorMsg('Please select a project or create one first.');
      return;
    }

    if (selectedProject?.status === 'completed') {
      setErrorMsg('This project is marked as completed and locked. You cannot log expenses to completed projects.');
      return;
    }

    if (category === 'Misc' && !description.trim()) {
      setErrorMsg('Item name / description is required for Misc expenses.');
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
        let uploadedUrl: string | null = null;

        try {
          const fd = new FormData();
          fd.append('file', receiptFile);
          fd.append('expenseId', res.data.id);
          const srvRes = await uploadReceiptAction(fd);
          if (srvRes.url) {
            uploadedUrl = srvRes.url;
          }
        } catch {
          // Fallback to client upload
        }

        if (!uploadedUrl) {
          const clientRes = await uploadReceipt(receiptFile, res.data.id);
          if (clientRes.url) {
            uploadedUrl = clientRes.url;
          }
        }

        if (uploadedUrl) {
          await updateExpenseReceipt(res.data.id, uploadedUrl);
        }
      }

      // Success — reset form
      setAmount('');
      setDescription('');
      clearReceipt();
      if (!defaultProjectId) setProjectId('');
      setOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error recording expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Standalone floating action button */}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setErrorMsg('');
          setQuickProjectSuccess('');
        }}
        className="fixed bottom-20 right-4 z-40 inline-flex h-14 items-center gap-2 rounded-2xl bg-orange-600 px-5 text-base font-black text-white shadow-xl shadow-orange-600/30 hover:bg-orange-700 active:scale-95 transition-all duration-200 tap-scale"
      >
        <Plus className="h-6 w-6 stroke-[3]" />
        Log Expense
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[90dvh] rounded-t-3xl border-t-2 border-slate-300 bg-white px-5 pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="pb-3 text-left">
            <SheetTitle className="text-xl font-black text-slate-900">
              Log New Expense
            </SheetTitle>
            <p className="text-xs font-semibold text-slate-500">
              Records timestamp and updates project spend instantly.
            </p>
          </SheetHeader>

          {errorMsg && (
            <div className="p-3 mb-3 rounded-xl bg-red-50 border-2 border-red-200 text-xs font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {quickProjectSuccess && (
            <div className="p-3 mb-3 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{quickProjectSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4 overflow-y-auto max-h-[calc(90dvh-120px)] pr-1">
            {/* Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount" className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Amount (PKR) *
                </Label>
                <span className="text-[10px] font-bold text-slate-500">
                  Min: Rs. 10
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-500">
                  Rs.
                </span>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min="10"
                  step="any"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="h-14 pl-14 text-2xl font-black rounded-xl border-2 border-slate-300 bg-white text-slate-900 placeholder:text-slate-300 focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-200 shadow-xs"
                />
              </div>
            </div>

            {/* Project Selection with Inline Create Project Option */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Project *
                </Label>
                <button
                  type="button"
                  onClick={() => setShowQuickProject(!showQuickProject)}
                  className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 tap-scale"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  {showQuickProject ? 'Cancel' : '+ New Project'}
                </button>
              </div>

              {/* Quick Inline Project Creator */}
              {showQuickProject && (
                <div className="p-3.5 rounded-2xl bg-orange-50/80 border-2 border-orange-300 space-y-3 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-orange-950">Quick Create Project</p>
                    <span className="text-[10px] text-orange-700 font-bold bg-orange-200/60 px-2 py-0.5 rounded-full">
                      Step 1 of 2
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Project Name (e.g. Jinnahabad Build)"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="h-11 rounded-xl border-2 border-orange-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newProjectType}
                        onChange={(e) => setNewProjectType(e.target.value as ProjectType)}
                        className="h-11 rounded-xl border-2 border-orange-200 bg-white px-3 text-xs font-bold text-slate-800"
                      >
                        {PROJECT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      <Input
                        type="number"
                        placeholder="Budget in PKR"
                        value={newProjectBudget}
                        onChange={(e) => setNewProjectBudget(e.target.value)}
                        className="h-11 rounded-xl border-2 border-orange-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400"
                      />
                    </div>

                    <Input
                      placeholder="Location / Google Maps link (optional)"
                      value={newProjectLocation}
                      onChange={(e) => setNewProjectLocation(e.target.value)}
                      className="h-11 rounded-xl border-2 border-orange-200 bg-white text-xs font-bold text-slate-900 placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={handleQuickCreateProject}
                      disabled={isCreatingProject}
                      className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all tap-scale disabled:opacity-50"
                    >
                      {isCreatingProject ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Creating Project...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Create &amp; Select Project
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Select Project Dropdown */}
              <Select
                value={projectId}
                onValueChange={(val) => setProjectId(val || '')}
                required
              >
                <SelectTrigger className="h-12 rounded-xl border-2 border-slate-300 bg-white text-sm font-black text-slate-900 focus:border-orange-500 shadow-xs">
                  <span className="truncate">
                    {selectedProject
                      ? selectedProject.name
                      : availableProjects.length === 0
                      ? 'No active projects — click + New Project above'
                      : 'Select a project...'}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-slate-300 max-h-64 shadow-xl">
                  {availableProjects.length === 0 ? (
                    <div className="p-4 text-center space-y-2">
                      <p className="text-xs font-black text-slate-700">
                        No active projects found!
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowQuickProject(true)}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-black shadow-sm"
                      >
                        + Create Project Now
                      </button>
                    </div>
                  ) : (
                    availableProjects.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="text-sm font-bold text-slate-800 cursor-pointer py-2.5"
                      >
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Live Project Overview Snapshot Card */}
              {selectedProject && (
                <div className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2 animate-fade-in mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-slate-800 flex items-center gap-1.5 truncate">
                      <Briefcase className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      {selectedProject.name}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 shrink-0">
                      {selectedProject.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-200 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Total Budget</span>
                      <span className="font-extrabold text-slate-800">
                        {formatPKR(selectedProject.total_budget)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Total Spent</span>
                      <span className="font-extrabold text-orange-600">
                        {formatPKR((selectedProject as any).total_spent || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Remaining</span>
                      <span className="font-extrabold text-emerald-600">
                        {formatPKR(
                          Math.max(
                            selectedProject.total_budget -
                              ((selectedProject as any).total_spent || 0),
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category — visual chips */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Category *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`h-11 rounded-xl border-2 text-xs font-bold transition-all tap-scale ${
                      category === cat
                        ? 'border-orange-500 bg-orange-50 text-orange-600 font-black shadow-xs ring-1 ring-orange-500/30'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description / Item Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between"
              >
                <span>
                  {category === 'Misc' ? 'Item Name / Description *' : 'Description (optional)'}
                </span>
                {category === 'Misc' && (
                  <span className="text-[10px] text-orange-700 font-black uppercase tracking-wider bg-orange-100 border border-orange-300 px-2 py-0.5 rounded-md">
                    Required for Misc
                  </span>
                )}
              </Label>
              <Input
                id="description"
                placeholder={
                  category === 'Misc'
                    ? 'e.g. Tea & snacks for laborers, site rope, nails'
                    : 'e.g. 50 bags Fauji cement from supplier'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required={category === 'Misc'}
                className={`h-12 rounded-xl border-2 bg-white text-sm font-bold text-slate-900 placeholder:text-slate-400 ${
                  category === 'Misc' && !description.trim()
                    ? 'border-orange-500 ring-2 ring-orange-200 bg-orange-50/20'
                    : 'border-slate-300'
                }`}
              />
            </div>

            {/* Receipt Photo Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Receipt / Bill Photo (optional)
              </Label>

              {receiptPreview ? (
                <div className="relative inline-block">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="w-24 h-24 object-cover rounded-xl border-2 border-orange-400 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={clearReceipt}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors"
                    title="Remove photo"
                  >
                    <X className="h-3.5 w-3.5 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-slate-400 bg-slate-50 text-slate-600 transition-colors hover:border-orange-500 hover:text-orange-600 tap-scale font-bold"
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-xs font-bold">Take Photo or Upload Bill</span>
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
                <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-orange-600" />
                  {receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 pb-4">
              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-base font-black text-white shadow-xl shadow-orange-600/30 transition-all tap-scale flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting || isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Recording Expense...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 stroke-[3]" />
                    Record Expense
                  </>
                )}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
