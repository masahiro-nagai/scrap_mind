import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { Brain, RotateCcw, Sparkles, AlertCircle, CheckSquare, FolderPlus, MousePointer2 } from 'lucide-react';
import { ScrapNote } from './components/ScrapNote';
import { GroupNode } from './components/GroupNode';
import { AddScrap } from './components/AddScrap';
import { ReviewDeck } from './components/ReviewDeck';
import { Scrap, Group, AppMode, IdeaSynthesis, COLORS } from './types';
import { getRandomColor, getRandomPosition, getRandomRotation, generateTornClipPath, needsReview } from './utils';
import { synthesizeScraps } from './services/geminiService';

const App: React.FC = () => {
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [mode, setMode] = useState<AppMode>(AppMode.BOARD);
  const [selectedScrapIds, setSelectedScrapIds] = useState<Set<string>>(new Set());
  const [synthesis, setSynthesis] = useState<IdeaSynthesis | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('scrapmind_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration logic for old data format which was just Scrap[]
        if (Array.isArray(parsed)) {
            setScraps(parsed);
        } else {
            setScraps(parsed.scraps || []);
            setGroups(parsed.groups || []);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (scraps.length > 0 || groups.length > 0) {
      localStorage.setItem('scrapmind_data', JSON.stringify({ scraps, groups }));
    }
  }, [scraps, groups]);

  // Check for notification logic
  useEffect(() => {
    if (scraps.length > 0) {
      const lastReviewed = Math.max(...scraps.map(s => s.lastReviewedAt || 0));
      const effectiveLastReview = lastReviewed === 0 ? Math.min(...scraps.map(s => s.createdAt)) : lastReviewed;
      
      if (needsReview(effectiveLastReview)) {
        // notification logic
      }
    }
  }, [scraps]);

  const addScrap = (content: string, url: string, image?: string, tags?: string[], color?: string) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const width = rect?.width || window.innerWidth;
    const height = rect?.height || window.innerHeight;

    const initialWidth = 250 + Math.random() * 50;
    const initialHeight = image 
        ? 200 + Math.random() * 50 
        : 80 + Math.random() * 20;

    const newScrap: Scrap = {
      id: nanoid(),
      content,
      image,
      url: url || undefined,
      tags: tags,
      createdAt: Date.now(),
      lastReviewedAt: Date.now(),
      position: getRandomPosition(width, height),
      rotation: getRandomRotation(),
      color: color || getRandomColor(),
      zIndex: getMaxZIndex() + 1,
      width: initialWidth,
      height: initialHeight,
      clipPath: generateTornClipPath()
    };

    setScraps(prev => [...prev, newScrap]);
  };

  const getMaxZIndex = () => {
    const scrapMax = scraps.length > 0 ? Math.max(...scraps.map(s => s.zIndex)) : 0;
    const groupMax = groups.length > 0 ? Math.max(...groups.map(g => g.zIndex)) : 0;
    return Math.max(scrapMax, groupMax);
  }

  // --- Scrap Updates ---

  const updateScrapPosition = (id: string, x: number, y: number) => {
    setScraps(prev => prev.map(s => 
      s.id === id ? { ...s, position: { x, y }, zIndex: getMaxZIndex() + 1 } : s
    ));
  };

  const updateScrapSize = (id: string, width: number, height: number) => {
    setScraps(prev => prev.map(s =>
      s.id === id ? { ...s, width, height } : s
    ));
  };

  const deleteScrap = (id: string) => {
    setScraps(prev => prev.filter(s => s.id !== id));
  };

  const focusScrap = (id: string) => {
    if (mode === AppMode.SELECT) return;
    setScraps(prev => prev.map(s => 
        s.id === id ? { ...s, zIndex: getMaxZIndex() + 1 } : s
    ));
  };

  const handleReviewKeep = (id: string) => {
    setScraps(prev => prev.map(s => 
      s.id === id ? { ...s, lastReviewedAt: Date.now() } : s
    ));
  };

  // --- Group Logic ---

  const createGroup = () => {
    if (selectedScrapIds.size === 0) return;

    // Calculate center position of selected scraps
    const selectedScraps = scraps.filter(s => selectedScrapIds.has(s.id));
    const avgX = selectedScraps.reduce((acc, s) => acc + s.position.x, 0) / selectedScraps.length;
    const avgY = selectedScraps.reduce((acc, s) => acc + s.position.y, 0) / selectedScraps.length;

    const newGroup: Group = {
      id: nanoid(),
      title: '新しいグループ',
      position: { x: avgX - 20, y: avgY - 20 },
      zIndex: getMaxZIndex() + 1,
      isCollapsed: false,
      color: 'bg-white',
      width: 350,
      height: 400
    };

    // Assign group ID to scraps
    setScraps(prev => prev.map(s => 
        selectedScrapIds.has(s.id) ? { ...s, groupId: newGroup.id } : s
    ));
    setGroups(prev => [...prev, newGroup]);
    
    // Reset selection and mode
    setSelectedScrapIds(new Set());
    setMode(AppMode.BOARD);
  };

  const deleteGroup = (id: string) => {
    // Ungroup all scraps in this group
    setScraps(prev => prev.map(s => 
        s.groupId === id ? { ...s, groupId: undefined } : s
    ));
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  const ungroupScrap = (scrapId: string) => {
    // Find the scrap to get its current group position?
    // For simplicity, just pop it out to the board. 
    // Ideally, we'd set its position near the group.
    
    setScraps(prev => {
        const scrap = prev.find(s => s.id === scrapId);
        const group = groups.find(g => g.id === scrap?.groupId);
        
        if (scrap && group) {
             return prev.map(s => s.id === scrapId ? {
                 ...s,
                 groupId: undefined,
                 position: { x: group.position.x + 20, y: group.position.y + 20 },
                 zIndex: getMaxZIndex() + 1
             } : s);
        }
        return prev;
    });
  };

  const updateGroupPosition = (id: string, x: number, y: number) => {
    setGroups(prev => prev.map(g => 
        g.id === id ? { ...g, position: { x, y }, zIndex: getMaxZIndex() + 1 } : g
    ));
  };

  const updateGroupSize = (id: string, width: number, height: number) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, width, height } : g));
  };

  const toggleGroupCollapse = (id: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, isCollapsed: !g.isCollapsed } : g));
  };

  const updateGroupTitle = (id: string, title: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, title } : g));
  };
  
  const focusGroup = (id: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, zIndex: getMaxZIndex() + 1 } : g));
  };

  // --- Selection Logic ---

  const toggleSelectionMode = () => {
    if (mode === AppMode.SELECT) {
        setMode(AppMode.BOARD);
        setSelectedScrapIds(new Set());
    } else {
        setMode(AppMode.SELECT);
    }
  };

  const toggleSelectScrap = (id: string) => {
    setSelectedScrapIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        return next;
    });
  };

  // --- AI ---

  const handleSynthesize = async () => {
    if (scraps.length < 2) {
      alert("アイデアをつなげるには、少なくとも2つのスクラップが必要です。");
      return;
    }
    setIsSynthesizing(true);
    setMode(AppMode.SYNTHESIS);
    const result = await synthesizeScraps(scraps);
    setSynthesis(result);
    setIsSynthesizing(false);
  };

  const lastReviewTime = scraps.length > 0 
    ? Math.max(...scraps.map(s => s.lastReviewedAt || 0)) 
    : Date.now();
  const isReviewOverdue = needsReview(lastReviewTime);

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-gray-900 selection:bg-yellow-200">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-40 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto">
          <h1 className="text-4xl font-['Zen_Maru_Gothic'] font-bold text-gray-800 drop-shadow-sm tracking-wide">
            ScrapMind
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            {scraps.length} スクラップ / {groups.length} グループ
          </p>
        </div>

        <div className="flex gap-4 pointer-events-auto items-center">
           {mode === AppMode.SELECT && selectedScrapIds.size > 0 && (
             <div className="flex gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <button
                    onClick={createGroup}
                    className="bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-black transition-transform active:scale-95 font-bold"
                >
                    <FolderPlus size={18} />
                    <span>{selectedScrapIds.size}個をまとめる</span>
                </button>
             </div>
           )}

           <button
             onClick={toggleSelectionMode}
             className={`p-3 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all border ${mode === AppMode.SELECT ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white/80 border-gray-200 text-gray-700'}`}
             title={mode === AppMode.SELECT ? "選択モード終了" : "選択モード"}
           >
             {mode === AppMode.SELECT ? <MousePointer2 size={20} /> : <CheckSquare size={20} />}
           </button>

           {isReviewOverdue && (
             <button
               onClick={() => setMode(AppMode.REVIEW)}
               className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse hover:bg-red-600 transition-colors"
             >
               <AlertCircle size={18} />
               <span className="font-bold text-sm font-['Zen_Maru_Gothic']">要整理</span>
             </button>
           )}

           <button
             onClick={() => setMode(AppMode.REVIEW)}
             className="bg-white/80 backdrop-blur border border-gray-200 p-3 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all text-gray-700"
             title="レビューモード"
           >
             <RotateCcw size={20} />
           </button>
           
           <button
             onClick={handleSynthesize}
             className="bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-black hover:scale-105 transition-all"
             title="アイデア結合 (AI)"
           >
             <Brain size={20} />
           </button>
        </div>
      </div>

      {/* Main Board Area */}
      <div ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing bg-transparent">
        
        {/* Render Loose Scraps (not in group) */}
        {scraps.filter(s => !s.groupId).map(scrap => (
          <ScrapNote
            key={scrap.id}
            scrap={scrap}
            displayMode={mode === AppMode.SELECT ? 'SELECT' : 'BOARD'}
            isSelected={selectedScrapIds.has(scrap.id)}
            onUpdatePosition={updateScrapPosition}
            onUpdateSize={updateScrapSize}
            onDelete={deleteScrap}
            onFocus={focusScrap}
            onToggleSelect={toggleSelectScrap}
          />
        ))}

        {/* Render Groups */}
        {groups.map(group => (
            <GroupNode
                key={group.id}
                group={group}
                scraps={scraps.filter(s => s.groupId === group.id)}
                onUpdatePosition={updateGroupPosition}
                onUpdateSize={updateGroupSize}
                onToggleCollapse={toggleGroupCollapse}
                onUpdateTitle={updateGroupTitle}
                onUngroupScrap={ungroupScrap}
                onDeleteGroup={deleteGroup}
                onFocus={focusGroup}
            />
        ))}

        {scraps.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <div className="text-center">
                <p className="font-['Zen_Kurenaido'] font-bold text-4xl text-gray-400 rotate-[-5deg]">何もないですね...</p>
                <p className="font-['Zen_Maru_Gothic'] text-2xl text-gray-400 mt-4 rotate-[2deg]">紙をちぎって、何か書いてみましょう。</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Button */}
      {mode === AppMode.BOARD && <AddScrap onAdd={addScrap} />}

      {/* Review Mode Overlay */}
      {mode === AppMode.REVIEW && (
        <ReviewDeck 
          scraps={[...scraps].sort((a,b) => (a.lastReviewedAt || 0) - (b.lastReviewedAt || 0))} 
          onKeep={handleReviewKeep}
          onToss={deleteScrap}
          onFinish={() => setMode(AppMode.BOARD)}
        />
      )}

      {/* Synthesis Mode Overlay */}
      {mode === AppMode.SYNTHESIS && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-y-auto">
          <button 
            onClick={() => setMode(AppMode.BOARD)}
            className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full"
          >
            <RotateCcw size={24} />
          </button>

          <div className="max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-6">
               <Sparkles className="text-purple-600" size={32} />
               <h2 className="text-3xl font-['Zen_Maru_Gothic'] font-bold">アイデアの結合</h2>
            </div>
            
            {isSynthesizing ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-32 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <p className="text-center text-gray-500 font-mono mt-8">思考を接続中...</p>
              </div>
            ) : synthesis ? (
              <div className="space-y-8">
                <div>
                    <h3 className="text-4xl font-['Zen_Maru_Gothic'] font-bold mb-4 text-gray-900">{synthesis.title}</h3>
                    <p className="text-xl leading-relaxed font-['Zen_Kurenaido'] font-bold text-gray-700 p-6 bg-yellow-50 border border-yellow-100 rounded-lg shadow-sm">
                        {synthesis.summary}
                    </p>
                </div>
                
                <div>
                    <h4 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-4 font-['Zen_Maru_Gothic']">見えてきたつながり</h4>
                    <ul className="space-y-4">
                        {synthesis.connections.map((conn, i) => (
                            <li key={i} className="flex gap-4 items-start">
                                <span className="bg-purple-100 text-purple-800 font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs mt-1">{i+1}</span>
                                <span className="font-['Zen_Kurenaido'] font-bold text-xl text-gray-800">{conn}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="pt-8 border-t">
                    <button 
                        onClick={() => {
                            // Convert synthesis to a new scrap?
                            addScrap(`[Idea] ${synthesis.title}\n\n${synthesis.summary}`, '');
                            setMode(AppMode.BOARD);
                        }}
                        className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors w-full sm:w-auto font-['Zen_Maru_Gothic']"
                    >
                        新しいスクラップとして保存
                    </button>
                </div>
              </div>
            ) : (
               <div className="text-center text-red-500 font-['Zen_Maru_Gothic']">
                   結合に失敗しました。もう少しスクラップを増やしてみてください。
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;