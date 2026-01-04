import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, X } from 'lucide-react';
import { Scrap } from '../types';
import { isValidUrl } from '../utils';

interface ReviewDeckProps {
  scraps: Scrap[];
  onKeep: (id: string) => void;
  onToss: (id: string) => void;
  onFinish: () => void;
}

export const ReviewDeck: React.FC<ReviewDeckProps> = ({ scraps, onKeep, onToss, onFinish }) => {
  const [index, setIndex] = useState(0);
  const currentScrap = scraps[index];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      onToss(currentScrap.id);
    } else {
      onKeep(currentScrap.id);
    }

    if (index < scraps.length - 1) {
      setIndex(index + 1);
    } else {
      onFinish();
    }
  };

  if (!currentScrap) return null;

  // Safe hostname extraction
  const getHostname = (url: string) => {
    try {
      if (!isValidUrl(url)) return null;
      return new URL(url).hostname;
    } catch {
      return null;
    }
  };

  const hostname = currentScrap.url ? getHostname(currentScrap.url) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
      <div className="text-white mb-8 text-center max-w-md px-4">
        <h2 className="text-3xl font-['Zen_Maru_Gothic'] font-bold mb-2">振り返りタイム</h2>
        <p className="opacity-80 font-['Zen_Maru_Gothic']">
          心に響くものは残し、ノイズは捨てる。<br/>
          (レビュー中: {index + 1} / {scraps.length})
        </p>
      </div>

      <div className="relative w-80 h-96">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentScrap.id}
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotate: currentScrap.rotation }}
            exit={{ scale: 0.5, opacity: 0, x: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`absolute inset-0 p-6 shadow-2xl flex flex-col ${currentScrap.color}`}
            style={{
              clipPath: currentScrap.clipPath,
              filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))'
            }}
          >
             <div className="flex-1 overflow-y-auto font-['Zen_Kurenaido'] font-bold text-2xl leading-relaxed">
                {currentScrap.content}
             </div>
             {hostname && (
                 <div className="mt-4 pt-2 border-t border-black/10 text-xs font-mono truncate text-gray-500">
                    Source: {hostname}
                 </div>
             )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-12 flex gap-8">
        <button
          onClick={() => handleSwipe('left')}
          className="group flex flex-col items-center gap-2"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-lg group-hover:scale-110 transition-transform">
            <Trash2 size={32} />
          </div>
          <span className="text-white font-['Zen_Maru_Gothic'] text-lg font-bold">捨てる</span>
        </button>

        <button
          onClick={() => handleSwipe('right')}
          className="group flex flex-col items-center gap-2"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
            <Check size={32} />
          </div>
          <span className="text-white font-['Zen_Maru_Gothic'] text-lg font-bold">残す</span>
        </button>
      </div>
      
      <button 
        onClick={onFinish}
        className="absolute top-8 right-8 text-white/50 hover:text-white"
      >
        <X size={32} />
      </button>
    </div>
  );
};