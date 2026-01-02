import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Trash2, GripHorizontal } from 'lucide-react';
import { Scrap } from '../types';

interface ScrapNoteProps {
  scrap: Scrap;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onFocus: (id: string) => void;
  isReviewMode?: boolean;
}

export const ScrapNote: React.FC<ScrapNoteProps> = ({ 
  scrap, 
  onUpdatePosition, 
  onDelete, 
  onFocus,
  isReviewMode = false
}) => {
  
  return (
    <motion.div
      drag={!isReviewMode}
      dragMomentum={false}
      initial={{ 
        x: scrap.position.x, 
        y: scrap.position.y, 
        rotate: scrap.rotation, 
        scale: 0.8, 
        opacity: 0 
      }}
      animate={{ 
        x: isReviewMode ? 0 : scrap.position.x, 
        y: isReviewMode ? 0 : scrap.position.y, 
        rotate: isReviewMode ? 0 : scrap.rotation, 
        scale: 1, 
        opacity: 1,
        zIndex: scrap.zIndex 
      }}
      whileDrag={{ scale: 1.05, rotate: 0, zIndex: 9999 }}
      onDragEnd={(e, info) => {
        if (!isReviewMode) {
            onUpdatePosition(scrap.id, scrap.position.x + info.offset.x, scrap.position.y + info.offset.y);
        }
      }}
      onPointerDown={() => onFocus(scrap.id)}
      // Reduced padding to p-3 (from p-4) to minimize whitespace while avoiding clip-path cut off
      className={`absolute flex flex-col p-3 shadow-lg text-gray-800 ${scrap.color} transition-shadow hover:shadow-2xl`}
      style={{
        width: scrap.width,
        minHeight: scrap.height,
        // If it's an image scrap, let the height be auto to fit content, but use min-height for paper feel
        height: 'auto',
        clipPath: scrap.clipPath, // The jagged edges make the image look torn
        // Fallback filter for shadow since clip-path cuts off box-shadow
        filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))'
      }}
    >
      {!isReviewMode && (
         <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-20 hover:opacity-100 cursor-move transition-opacity z-10 bg-white/50 rounded-full p-0.5">
            <GripHorizontal size={16} />
         </div>
      )}

      {/* Image Area - margins adjusted to align with tighter padding */}
      {scrap.image && (
        <div className="mb-2 -mx-1 -mt-1 overflow-hidden relative" style={{ minHeight: '80px' }}>
            {/* The image itself */}
            <img 
                src={scrap.image} 
                alt="scrap" 
                className="w-full h-auto object-cover opacity-90 mix-blend-multiply pointer-events-none"
                style={{ 
                    filter: 'contrast(1.1) sepia(0.2)'
                }} 
            />
        </div>
      )}

      {/* Content Area - Handwritten style */}
      {scrap.content && (
        <div className="flex-1 mt-1 font-['Zen_Kurenaido'] font-bold text-xl leading-snug break-words whitespace-pre-wrap">
            {scrap.content}
        </div>
      )}

      {/* Footer Area */}
      <div className="mt-2 pt-1 border-t border-black/10 flex flex-col gap-1">
        {/* Tags Row */}
        {scrap.tags && scrap.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
                {scrap.tags.map((tag, i) => (
                    <span key={i} className="text-gray-500 font-['Zen_Kurenaido'] text-xs">
                        #{tag}
                    </span>
                ))}
            </div>
        )}

        <div className="flex justify-between items-center text-xs font-[Courier] text-gray-500">
            {/* Date is hidden visually per user request, but data exists in scrap object */}
            <span></span> 
            
            <div className="flex gap-1.5 z-10">
                {scrap.url && (
                    <a 
                        href={scrap.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-black/10 rounded-full transition-colors"
                        title="ソースを開く"
                    >
                        <ExternalLink size={12} />
                    </a>
                )}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(scrap.id);
                    }}
                    className="p-1 hover:bg-red-200 text-red-700 rounded-full transition-colors"
                    title="捨てる"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
      </div>
    </motion.div>
  );
};