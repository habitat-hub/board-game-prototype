import { GiWoodenCrate } from 'react-icons/gi';

export function WoodenCrateBackground() {
  return (
    <>
      {/* 背景の木箱アイコン群 */}
      <div className="fixed top-[-50px] right-[-50px] pointer-events-none">
        <GiWoodenCrate
          className="text-[600px] transform -rotate-12"
          style={{ color: '#946B4D', opacity: 0.1 }}
        />
      </div>
      <div className="fixed bottom-[-100px] left-[-50px] pointer-events-none">
        <GiWoodenCrate
          className="text-[500px] transform rotate-12"
          style={{ color: '#946B4D', opacity: 0.1 }}
        />
      </div>
      <div className="fixed top-[5%] left-[-100px] pointer-events-none">
        <GiWoodenCrate
          className="text-[400px] transform -rotate-6"
          style={{ color: '#946B4D', opacity: 0.1 }}
        />
      </div>
    </>
  );
}
