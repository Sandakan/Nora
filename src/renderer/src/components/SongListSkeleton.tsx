const shimmer =
  'animate-[shimmer_2s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-white/10';

function SongSkeletonRow({ index }: { index: number }) {
  return (
    <div
      className={`flex h-14 items-center gap-3 px-2 ${
        index % 2 === 0
          ? 'bg-background-color-1/50 dark:bg-dark-background-color-1/50'
          : 'bg-background-color-2/30 dark:bg-dark-background-color-2/30'
      }`}
    >
      <div className={`h-10 w-10 shrink-0 rounded-sm ${shimmer}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className={`h-3 w-3/5 rounded ${shimmer}`} />
        <div className={`h-2.5 w-2/5 rounded ${shimmer}`} />
      </div>
      <div className={`h-3 w-8 shrink-0 rounded ${shimmer}`} />
    </div>
  );
}

export default function SongListSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="flex w-full flex-col">
      {Array.from({ length: count }, (_, i) => (
        <SongSkeletonRow key={i} index={i} />
      ))}
    </div>
  );
}
