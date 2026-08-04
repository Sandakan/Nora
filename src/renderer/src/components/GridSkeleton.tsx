const shimmer =
  'animate-[shimmer_2s_infinite] bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-white/10 motion-reduce:animate-none';

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className={`aspect-square w-full rounded-lg ${shimmer}`} />
      <div className={`h-3 w-3/4 rounded ${shimmer}`} />
      <div className={`h-2.5 w-1/2 rounded ${shimmer}`} />
    </div>
  );
}

export default function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
