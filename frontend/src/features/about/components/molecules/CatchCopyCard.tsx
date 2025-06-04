import { motion } from 'framer-motion';
import React, { useState } from 'react';

// CatchCopyCard コンポーネントの Props 定義
interface CatchCopyCardProps {
  text: string;
  frontColor: string; // 表面の色
  backColor: string; // 裏面の色
  delay: number;
  icon: React.ReactNode | null;
}

// ランディングページのためのシンプルなカードコンポーネント
const CatchCopyCard: React.FC<CatchCopyCardProps> = ({
  text,
  frontColor,
  backColor,
  delay,
  icon,
}) => {
  // useCardフックの代わりに独自のstate管理
  const [isFlipped, setIsFlipped] = useState(false);

  // カードの反転を処理する関数
  const handleFlip = (flipped: boolean) => {
    setIsFlipped(flipped);
  };

  return (
    <motion.div
      className="inline-block mx-4 w-[200px] h-[200px] md:w-[240px] md:h-[240px] lg:w-[260px] lg:h-[260px] xl:w-[280px] xl:h-[280px]"
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => handleFlip(true)}
      onHoverEnd={() => handleFlip(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.8 }}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* カードの表面 */}
        <motion.div
          className="absolute w-full h-full border-4 border-amber-300 rounded-xl p-4 shadow-xl flex flex-col items-center justify-center"
          style={{
            backgroundColor: frontColor,
            backfaceVisibility: 'hidden',
          }}
        >
          {icon && <div className="mb-2">{icon}</div>}
          <span className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-white">
            {text}
          </span>
        </motion.div>

        {/* カードの裏面 */}
        <motion.div
          className="absolute w-full h-full rounded-xl p-4 shadow-xl border-4 border-amber-300 flex flex-col items-center justify-center"
          style={{
            backgroundColor: backColor,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {icon && <div className="mb-2">{icon}</div>}
          <span className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-white">
            {text}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default CatchCopyCard;
