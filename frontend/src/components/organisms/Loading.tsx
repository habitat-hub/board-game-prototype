import { GiWoodenCrate } from 'react-icons/gi';

import { useClientPathInfo } from '@/hooks/useClientPathInfo';

export default function Loading() {
  const { isGameBoardPath } = useClientPathInfo();

  return (
    <div
      className={`flex items-center justify-center ${isGameBoardPath ? 'min-h-screen' : 'min-h-[calc(100vh-80px)]'}`}
    >
      <div className="flex items-center gap-3 animate-pulse">
        <GiWoodenCrate className="text-6xl drop-shadow-lg transform -rotate-6 text-kibako-accent" />
        <h1 className="text-5xl font-bold tracking-wider text-kibako-primary">
          KIBAKO
        </h1>
      </div>
    </div>
  );
}
