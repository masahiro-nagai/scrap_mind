import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Trash2, GripHorizontal, ArrowDownRight, CheckCircle2, LogOut } from 'lucide-react';
import { Scrap } from '../types';
import { isValidUrl } from '../utils';

export type ScrapDisplayMode = 'BOARD' | 'REVIEW' | 'GROUPED' | 'SELECT';

interface ScrapNoteProps {
  scrap: Scrap;
  displayMode?: ScrapDisplayMode;
  isSelected?: boolean;
  scale?: number; // Zoom scale for coordinate correction
  onUpdatePosition?: (id: string, x: number, y: number) => void;
  onUpdateSize?: (id: string, width: number, height: number) => void;
  onDelete?: (id: string) => void; // Permanently delete
  onUngroup?: (id: string) => void; // Remove from group
  onFocus?: (id: string) => void;
  onToggleSelect?: (id: string) => void;
}

export const ScrapNote: React.FC<ScrapNoteProps> = ({ 
  scrap, 
  displayMode = 'BOARD',
  isSelected = false,
  scale = 1,
  onUpdatePosition, 
  onUpdateSize,
  onDelete, 
  onUngroup,
  onFocus,
  onToggleSelect
}) => {
  
  const isDraggable = displayMode === 'BOARD';
  const isGrouped = displayMode === 'GROUPED';
  const isSelectMode = displayMode === 'SELECT';

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onFocus?.(scrap.id);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = scrap.width;
    const startHeight = scrap.height;

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.stopPropagation();
      moveEvent.preventDefault();
      
      // Adjust delta by current zoom scale
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;
      
      const newWidth = Math.max(150, startWidth + deltaX);
      const newHeight = Math.max(60, startHeight + deltaY);

      if (onUpdateSize) {
        onUpdateSize(scrap.id, newWidth, newHeight);
      }
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(scrap.id);
    } else if (onFocus) {
      onFocus(scrap.id);
    }
  };

  // Removed transition-all to prevent drag lag
  const containerClasses = `
    flex flex-col p-3 shadow-lg text-gray-800 ${scrap.color} transition-shadow hover:shadow-2xl group
    ${isGrouped ? 'relative mb-4 mx-auto' : 'absolute'}
    ${isSelectMode ? 'cursor-pointer' : ''}
  `;
  
  // For visual selection feedback
  const borderStyle = isSelected ? '2px solid #3b82f6' : 'none'; // Blue border if selected

  return (
    <motion.div
      drag={isDraggable}
      dragMomentum={false} // Stops instantly when released
      dragElastic={0} // No rubber banding, follows cursor exactly
      initial={isGrouped ? { opacity: 0, scale: 0.9 } : { 
        x: scrap.position.x, 
        y: scrap.position.y, 
        rotate: scrap.rotation, 
        scale: 0.8, 
        opacity: 0 
      }}
      animate={isGrouped ? { opacity: 1, scale: 1, rotate: 0 } : { 
        x: displayMode === 'REVIEW' ? 0 : scrap.position.x, 
        y: displayMode === 'REVIEW' ? 0 : scrap.position.y, 
        rotate: displayMode === 'REVIEW' ? 0 : scrap.rotation, 
        scale: isSelected ? 1.05 : 1, 
        opacity: 1,
        zIndex: scrap.zIndex 
      }}
      // Use standard transition for non-drag properties, but instant for drag
      transition={{
         x: { type: "tween", duration: 0 }, // Instant X updates
         y: { type: "tween", duration: 0 }, // Instant Y updates
         default: { type: "spring", stiffness: 200, damping: 20 }
      }}
      whileDrag={{ scale: 1.05, rotate: 0, zIndex: 9999, transition: { duration: 0.1 } }}
      onDragEnd={(e, info) => {
        if (isDraggable && onUpdatePosition) {
            // Correct the drag offset by the current zoom scale
            const correctedX = info.offset.x / scale;
            const correctedY = info.offset.y / scale;
            onUpdatePosition(scrap.id, scrap.position.x + correctedX, scrap.position.y + correctedY);
        }
      }}
      onPointerDown={isSelectMode ? undefined : () => onFocus?.(scrap.id)}
      onClick={handleClick}
      className={containerClasses}
      style={{
        width: scrap.width,
        minHeight: scrap.height,
        height: 'auto',
        clipPath: scrap.clipPath,
        filter: isSelected ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))',
        border: borderStyle
      }}
    >
      {/* Selection Indicator */}
      {isSelectMode && (
        <div className={`absolute -top-3 -right-3 z-30 bg-white rounded-full p-1 shadow-md transition-transform ${isSelected ? 'scale-110' : 'scale-0 opacity-0 group-hover:opacity-100 group-hover:scale-100'}`}>
          <CheckCircle2 className={isSelected ? "text-blue-500 fill-blue-100" : "text-gray-300"} size={24} />
        </div>
      )}

      {isDraggable && (
         <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-20 hover:!opacity-100 cursor-move transition-opacity z-10 bg-white/50 rounded-full p-0.5">
            <GripHorizontal size={16} />
         </div>
      )}

      {/* Image Area */}
      {scrap.image && (
        <div className="mb-2 -mx-1 -mt-1 overflow-hidden relative" style={{ minHeight: '80px' }}>
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

      {/* Content Area */}
      {scrap.content && (
        <div className="flex-1 mt-1 font-['Zen_Kurenaido'] font-bold text-xl leading-snug break-words whitespace-pre-wrap">
            {scrap.content}
        </div>
      )}

      {/* Footer Area */}
      <div className="mt-2 pt-1 border-t border-black/10 flex flex-col gap-1">
        {/* Tags */}
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
            <span></span> 
            
            <div className="flex gap-1.5 z-10">
                {/* Security fix: Only render link if URL is valid http/https to prevent XSS */}
                {scrap.url && isValidUrl(scrap.url) && (
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
                
                {isGrouped && onUngroup && (
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onUngroup(scrap.id);
                    }}
                    className="p-1 hover:bg-yellow-200 text-yellow-700 rounded-full transition-colors"
                    title="グループから外す"
                  >
                    <LogOut size={12} />
                  </button>
                )}

                {onDelete && (
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
                )}
            </div>
        </div>
      </div>

      {/* Resize Handle */}
      {isDraggable && onUpdateSize && (
        <div 
            className="absolute bottom-0 right-0 p-1.5 cursor-nwse-resize opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity z-20 text-gray-500"
            onPointerDown={handleResizeStart}
        >
            <ArrowDownRight size={16} />
        </div>
      )}
    </motion.div>
  );
};