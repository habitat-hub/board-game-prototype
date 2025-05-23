'use client';
import React from 'react';

interface FooterProps {
  height: number;
}

const Footer: React.FC<FooterProps> = ({ height }) => {
  return (
    <footer
      className="bg-gradient-to-r from-amber-600 to-amber-800 text-white p-2 text-center text-sm"
      style={{ height: `${height}px` }}
    >
      &copy; 2025 Habitat Hub. All rights reserved.
    </footer>
  );
};

export default Footer;
