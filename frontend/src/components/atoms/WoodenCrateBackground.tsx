import { GiWoodenCrate } from 'react-icons/gi';

export function WoodenCrateBackground() {
  return (
    <>
      {/* 背景の木箱アイコン群 */}
      <div className="fixed top-[-50px] right-[-50px] pointer-events-none">
        <GiWoodenCrate
          className="text-[420px] transform -rotate-12"
          style={{ color: '#A98363', opacity: 0.1 }}
        />
      </div>
      <div className="fixed bottom-[-100px] left-[-50px] pointer-events-none">
        <GiWoodenCrate
          className="text-[420px] transform rotate-12"
          style={{ color: '#A98363', opacity: 0.1 }}
        />
      </div>
    </>
  );
}
