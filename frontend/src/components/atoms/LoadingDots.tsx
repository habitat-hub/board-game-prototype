import { FC } from 'react';

interface LoadingDotsProps {
  count?: number;
}

const LoadingDots: FC<LoadingDotsProps> = ({ count = 3 }) => (
  <div className="flex items-center justify-center gap-2" role="status" aria-label="Loading">
    {Array.from({ length: count }).map((_, index) => (
      <span key={index} className="animate-pulse text-lg" aria-hidden="true">
        ・
      </span>
    ))}
  </div>
);

export default LoadingDots;
