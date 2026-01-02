import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { Brain, RotateCcw, Sparkles, AlertCircle } from 'lucide-react';
import { ScrapNote } from './components/ScrapNote';
import { AddScrap } from './components/AddScrap';
import { ReviewDeck } from './components/ReviewDeck';
import { Scrap, AppMode, IdeaSynthesis, COLORS } from './types';
import { getRandomColor, getRandomPosition, getRandomRotation, generateTornClipPath, needsReview } from './utils';
import { synthesizeScraps } from './services/geminiService';

const App: React.FC = () => {
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [mode, setMode] = useState<AppMode>(AppMode.BOARD);
  const [synthesis, setSynthesis] = useState<IdeaSynthesis | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('scrapmind_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setScraps(parsed);
      } catch (e) {
        console.error("Failed to load scraps", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (scraps.length > 0) {
      localStorage.setItem('scrapmind_data', JSON.stringify(scraps));
    }
  }, [scraps]);

  // Check for notification logic
  useEffect(() => {
    if (scraps.length > 0) {
      // Find the last reviewed date (max of all scraps)
      const lastReviewed = Math.max(...scraps.map(s => s.lastReviewedAt || 0));
      // If never reviewed, use created date of oldest
      const effectiveLastReview = lastReviewed === 0 ? Math.min(...scraps.map(s => s.createdAt)) : lastReviewed;
      
      if (needsReview(effectiveLastReview)) {
        // We could auto-trigger mode, but a banner is less intrusive
        // setMode(AppMode.REVIEW);
      }
    }
  }, [scraps]);

  const addScrap = (content: string, url: string, image?: string, tags?: string[], color?: string) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const width = rect?.width || window.innerWidth;
    const height = rect?.height || window.innerHeight;

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
      color: color || getRandomColor(), // Use selected color or random if undefined
      zIndex: scraps.length + 1,
      width: 250 + Math.random() * 50, // 250-300px width
      height: 200 + Math.random() * 50,
      clipPath: generateTornClipPath()
    };

    setScraps(prev => [...prev, newScrap]);
  };

  const updateScrapPosition = (id: string, x: number, y: number) => {
    setScraps(prev => prev.map(s => 
      s.id === id ? { ...s, position: { x, y }, zIndex: Math.max(...prev.map(p => p.zIndex)) + 1 } : s
    ));
  };

  const deleteScrap = (id: string) => {
    setScraps(prev => prev.filter(s => s.id !== id));
  };

  const focusScrap = (id: string) => {
    setScraps(prev => prev.map(s => 
        s.id === id ? { ...s, zIndex: Math.max(...prev.map(p => p.zIndex)) + 1 } : s
    ));
  };

  const handleReviewKeep = (id: string) => {
    setScraps(prev => prev.map(s => 
      s.id === id ? { ...s, lastReviewedAt: Date.now() } : s
    ));
  };

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

  // Calculate if review is needed for UI indicator
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
            {scraps.length} 個のスクラップ
          </p>
        </div>

        <div className="flex gap-4 pointer-events-auto">
           {/* Notification Banner / Button */}
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
        {scraps.map(scrap => (
          <ScrapNote
            key={scrap.id}
            scrap={scrap}
            onUpdatePosition={updateScrapPosition}
            onDelete={deleteScrap}
            onFocus={focusScrap}
            isReviewMode={mode === AppMode.REVIEW}
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
          scraps={[...scraps].sort((a,b) => (a.lastReviewedAt || 0) - (b.lastReviewedAt || 0))} // Review oldest first
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