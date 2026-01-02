import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Folder, Trash2, GripHorizontal, ChevronDown, ChevronUp, Edit2, Check, ArrowDownRight } from 'lucide-react';
import { Group, Scrap } from '../types';
import { ScrapNote } from './ScrapNote';

interface GroupNodeProps {
  group: Group;
  scraps: Scrap[];
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateSize: (id: string, width: number, height: number) => void;
  onToggleCollapse: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUngroupScrap: (scrapId: string) => void;
  onDeleteGroup: (id: string) => void;
  onFocus: (id: string) => void;
}

export const GroupNode: React.FC<GroupNodeProps> = ({
  group,
  scraps,
  onUpdatePosition,
  onUpdateSize,
  onToggleCollapse,
  onUpdateTitle,
  onUngroupScrap,
  onDeleteGroup,
  onFocus
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(group.title);

  const handleSaveTitle = () => {
    onUpdateTitle(group.id, titleInput);
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle();
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: group.position.x, y: group.position.y, opacity: 0, scale: 0.8 }}
      animate={{ 
        x: group.position.x, 
        y: group.position.y, 
        opacity: 1, 
        scale: 1,
        zIndex: group.zIndex,
        width: group.isCollapsed ? 250 : group.width,
        height: group.isCollapsed ? 'auto' : group.height
      }}
      whileDrag={{ scale: 1.02, zIndex: 9999 }}
      onDragEnd={(e, info) => {
        onUpdatePosition(group.id, group.position.x + info.offset.x, group.position.y + info.offset.y);
      }}
      onPointerDown={() => onFocus(group.id)}
      className={`absolute flex flex-col bg-stone-100/90 backdrop-blur-sm border-2 border-dashed border-stone-300 rounded-xl shadow-xl overflow-hidden transition-colors ${group.isCollapsed ? 'hover:bg-stone-50' : ''}`}
      style={{
        minWidth: 250,
        minHeight: group.isCollapsed ? 60 : 200,
        boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-stone-200 border-b border-stone-300 cursor-move">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {group.isCollapsed ? <Folder size={20} className="text-stone-600" /> : <FolderOpen size={20} className="text-stone-600" />}
          
          {isEditingTitle ? (
            <div className="flex items-center gap-1 flex-1">
                <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveTitle}
                    autoFocus
                    className="w-full bg-white px-1 py-0.5 rounded text-sm font-bold text-gray-800"
                />
                <button onClick={handleSaveTitle} className="text-green-600 hover:text-green-800"><Check size={16}/></button>
            </div>
          ) : (
            <span 
                className="font-['Zen_Maru_Gothic'] font-bold text-stone-700 truncate cursor-text hover:underline decoration-stone-400"
                onClick={() => setIsEditingTitle(true)}
                title="クリックして名前を変更"
            >
              {group.title} <span className="text-xs text-stone-500 font-mono ml-1">({scraps.length})</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2 pointer-events-auto">
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleCollapse(group.id); }}
                className="p-1 hover:bg-stone-300 rounded text-stone-600"
            >
                {group.isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); if(confirm('グループを削除してスクラップをバラしますか？')) onDeleteGroup(group.id); }}
                className="p-1 hover:bg-red-200 text-red-500 hover:text-red-700 rounded"
                title="グループ解除"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      {/* Body */}
      {!group.isCollapsed && (
        <div className="flex-1 p-4 bg-stone-50/50 overflow-y-auto overflow-x-hidden relative">
             <div className="grid grid-cols-1 gap-4">
                {scraps.map(scrap => (
                    <ScrapNote 
                        key={scrap.id} 
                        scrap={scrap} 
                        displayMode="GROUPED"
                        onUngroup={onUngroupScrap}
                        onUpdateSize={onUpdateSize} // Pass through if we want to allow resize inside group (optional)
                    />
                ))}
                {scraps.length === 0 && (
                    <div className="text-center text-stone-400 py-8 font-['Zen_Maru_Gothic'] text-sm">
                        空っぽです
                    </div>
                )}
             </div>
             
             {/* Resize Handle for Group Container */}
             <div 
                className="absolute bottom-0 right-0 p-2 cursor-nwse-resize text-stone-400 hover:text-stone-600"
                onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startWidth = group.width;
                    const startHeight = group.height;

                    const onPointerMove = (moveEvent: PointerEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaY = moveEvent.clientY - startY;
                        onUpdateSize(group.id, Math.max(250, startWidth + deltaX), Math.max(200, startHeight + deltaY));
                    };
                    const onPointerUp = () => {
                        document.removeEventListener('pointermove', onPointerMove);
                        document.removeEventListener('pointerup', onPointerUp);
                    };
                    document.addEventListener('pointermove', onPointerMove);
                    document.addEventListener('pointerup', onPointerUp);
                }}
            >
                <ArrowDownRight size={20} />
             </div>
        </div>
      )}
    </motion.div>
  );
};