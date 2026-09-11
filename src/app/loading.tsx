export default function Loading() {
  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28 animate-pulse space-y-4">
      {/* Header Skeleton */}
      <div className="pt-4 pb-2 space-y-2">
        <div className="h-3 w-28 bg-slate-200 rounded-full" />
        <div className="h-7 w-48 bg-slate-300 rounded-xl" />
        <div className="h-3 w-36 bg-slate-200 rounded-full" />
      </div>

      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="h-20 rounded-2xl bg-slate-200" />
        <div className="h-20 rounded-2xl bg-slate-200" />
        <div className="h-20 rounded-2xl bg-slate-200" />
      </div>

      {/* Content Cards Skeleton */}
      <div className="space-y-3 pt-2">
        <div className="h-4 w-32 bg-slate-200 rounded-full" />
        <div className="h-36 rounded-2xl bg-slate-200/80" />
        <div className="h-36 rounded-2xl bg-slate-200/80" />
      </div>
    </div>
  );
}
