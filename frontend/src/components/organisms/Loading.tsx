import { GiWoodenCrate } from 'react-icons/gi';

export default function Loading() {
  return (
    <div className="flex items-center gap-3 mb-6 animate-pulse">
      <GiWoodenCrate className="text-6xl drop-shadow-lg transform -rotate-6 text-kibako-accent" />
      <h1 className="text-5xl font-bold tracking-wider text-kibako-primary">
        KIBAKO
      </h1>
    </div>
  );
}
