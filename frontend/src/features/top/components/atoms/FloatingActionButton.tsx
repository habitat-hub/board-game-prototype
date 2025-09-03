'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GiWoodenCrate } from 'react-icons/gi';

const FloatingActionButton = () => {
  const [showButton, setShowButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // スクロール方向に応じてフロートボタンの表示/非表示を制御
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // スクロール方向の検出 (上へ: show, 下へ: hide)
      // また、ページ最上部では常に表示
      if (currentScrollY <= 300 || currentScrollY < lastScrollY) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <AnimatePresence>
      {showButton && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="fixed bottom-10 right-10 z-sticky"
        >
          <Link href="/login">
            <motion.div
              className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full font-bold shadow-lg hover:shadow-amber-300/50"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              <GiWoodenCrate className="text-xl" />
              <span>今すぐ始める</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="ml-1"
              >
                →
              </motion.div>
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingActionButton;
