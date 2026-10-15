interface ShimmerSkeletonProps {
  className?: string;
}

export function ShimmerSkeleton({ className = '' }: ShimmerSkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-md bg-gradient-to-r from-slate-800 via-slate-700/80 to-slate-800 bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite] ${className}`}
    />
  );
}
