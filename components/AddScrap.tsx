import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Link as LinkIcon, Save, Image as ImageIcon, Trash2, Tag, Palette } from 'lucide-react';
import { COLORS } from '../types';

interface AddScrapProps {
  onAdd: (content: string, url: string, image?: string, tags?: string[], color?: string) => void;
}

export const AddScrap: React.FC<AddScrapProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]); // Default to first color
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    // Process tags: split by space or comma, trim, filter empty
    const tags = tagInput
      .split(/[,\s]+/)
      .map(t => t.trim().replace(/^#/, '')) // remove # if user added it
      .filter(t => t.length > 0);

    onAdd(content, url, image, tags, selectedColor);
    
    // Reset form
    setContent('');
    setUrl('');
    setTagInput('');
    setImage(undefined);
    setSelectedColor(COLORS[0]);
    setIsOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Security/Performance Check: Limit file size to 800KB to preserve LocalStorage
      // LocalStorage has a limit of ~5MB. Large images will crash the app.
      if (file.size > 800 * 1024) {
        alert("画像サイズが大きすぎます。800KB以下の画像を選択してください。\n(LocalStorageの容量制限のため)");
        return;
      }
      
      // Validation: Ensure it's an image
      if (!file.type.startsWith('image/')) {
        alert("画像ファイルのみアップロード可能です。");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 bg-gray-900 text-white w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
      >
        <Plus size={32} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:bg-black/40 pointer-events-none">
            <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`w-full max-w-lg p-6 rounded-t-3xl sm:rounded-2xl shadow-2xl pointer-events-auto relative mb-0 sm:mb-8 mx-4 transition-colors duration-300 ${selectedColor}`}
              style={{
                // Simulating a fresh piece of paper with the selected color
                boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
              }}
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
              >
                <X size={24} />
              </button>

              <h3 className="text-2xl font-['Zen_Maru_Gothic'] font-bold mb-4 text-gray-800">新しいスクラップ</h3>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                
                {/* Color Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1 font-['Zen_Maru_Gothic']">
                    <Palette size={12} /> 紙の色
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${color} ${selectedColor === color ? 'border-gray-800 scale-110' : 'border-transparent hover:border-gray-300'} shadow-sm transition-all`}
                        aria-label="Select color"
                      />
                    ))}
                  </div>
                </div>

                {/* Image Preview / Upload Area */}
                <div className="flex flex-col gap-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 font-['Zen_Maru_Gothic'] flex justify-between">
                        <span>画像・スクショ</span>
                        {image && (
                            <button 
                                type="button" 
                                onClick={() => setImage(undefined)} 
                                className="text-red-500 text-xs flex items-center hover:underline"
                            >
                                <Trash2 size={12} className="mr-1"/> 削除
                            </button>
                        )}
                    </label>
                    
                    {!image ? (
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-16 border-2 border-dashed border-gray-400/50 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-600 hover:text-gray-700 transition-colors bg-white/30"
                        >
                            <ImageIcon size={20} />
                            <span className="text-xs font-['Zen_Maru_Gothic'] mt-1">画像を貼り付ける (Max 800KB)</span>
                        </button>
                    ) : (
                        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img src={image} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 font-['Zen_Maru_Gothic']">メモ（任意）</label>
                    <textarea
                    autoFocus={!image}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="気になるポイントなど..."
                    className="w-full h-24 bg-transparent border-b-2 border-gray-400/30 focus:border-gray-800 outline-none resize-none text-xl font-['Zen_Kurenaido'] font-bold leading-relaxed placeholder:text-gray-400"
                    />
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1 font-['Zen_Maru_Gothic']">
                        <Tag size={12} /> タグ (スペース区切り)
                    </label>
                    <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="アイデア 仕事..."
                    className="w-full bg-white/40 p-2 rounded text-sm font-mono text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-400 border border-gray-200/50"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1 font-['Zen_Maru_Gothic']">
                        <LinkIcon size={12} /> 元記事URL (任意)
                    </label>
                    <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/40 p-2 rounded text-sm font-mono text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 border border-gray-200/50"
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={!content.trim() && !image}
                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-['Zen_Maru_Gothic']"
                    >
                        <Save size={18} />
                        ちぎって保存
                    </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};