import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, Home, BookOpen, ImageIcon, Palette, Upload, Plus, X, Moon, Sun, 
  Maximize2, Share2, Sparkles, Loader2, Wand2, Trash2, Copy, CheckSquare,
  Type, MousePointer2, ImageOff, ZoomIn, ZoomOut, RotateCcw, Hand, CheckCircle2, AlertCircle, Edit3,
  Undo2, Redo2, ClipboardPaste, ImagePlus
} from 'lucide-react';

const apiKey = ""; 
const GEN_MODEL = "gemini-2.5-flash-preview-09-2025";

export default function App() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedBoardItem, setSelectedBoardItem] = useState(null);
  
  // --- 状态修改：初始化为空，增加加载状态 ---
  const [vocabularyCards, setVocabularyCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState({ message: null, type: 'success' }); 
  
  const [boardItems, setBoardItems] = useState([]); 
  const [boardView, setBoardView] = useState({ x: 0, y: 0, scale: 1 });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // --- 新增：CSV 自动读取与解析逻辑 ---
 useEffect(() => {
    const fetchAndParseCSV = async () => {
      try {
        // 1. 使用 Vite 的全局基础路径，确保线上环境能找到文件
        const baseUrl = import.meta.env.BASE_URL || '/';
        const fileUrl = `${baseUrl}vocabulary.csv`;
        console.log("🔍 [Debug] 尝试请求CSV文件路径:", fileUrl);

        // 2. 发起请求，增加对非 200 状态码的拦截
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`服务器返回错误状态码: ${response.status}`);
        }

        // 3. 使用 text() 直接读取，比之前使用 reader 的方式兼容性更好
        const csvText = await response.text();
        console.log("✅ [Debug] 成功读取CSV文件，文件长度:", csvText.length);

        // 4. 解析 CSV（兼容 Windows \r\n 和 Mac/Linux \n 换行符）
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        
        if (lines.length <= 1) {
          throw new Error("CSV文件内容为空或只有表头");
        }

        const parsedData = lines.slice(1).map((line, index) => {
          // 处理 CSV 字段，防止某些行格式异常导致整个页面崩溃
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
          const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());
          const tags = cleanValues[4] ? cleanValues[4].split(/[，,]/) : [];
          
          return {
            id: `v-${index}`,
            type: 'vocabulary',
            title: cleanValues[0] || '未知语汇',
            category: cleanValues[1] || '未分类',
            description: cleanValues[3] || '暂无描述',
            atmosphere: tags.slice(0, 3),
            morphology: tags.slice(3, 6),
            mainImage: cleanValues[6] || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
          };
        });

        console.log("✅ [Debug] 成功解析生成的卡片数量:", parsedData.length);
        setVocabularyCards(parsedData);
        setIsLoading(false);
      } catch (error) {
        console.error("❌ [Debug] 加载或解析 CSV 失败:", error);
        setFeedback({ message: `数据库加载失败: ${error.message}`, type: "error" });
        setIsLoading(false);
      }
    };

    fetchAndParseCSV();
  }, []);

  // --- 样式注入 ---
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-grab { cursor: grab !important; }
      .custom-grabbing { cursor: grabbing !important; }
      .editable-text { cursor: text !important; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const saveSnapshot = useCallback((items) => {
    setHistory(prev => [JSON.parse(JSON.stringify(items)), ...prev].slice(0, 31));
    setRedoStack([]); 
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const previous = history[0];
      setRedoStack(prev => [JSON.parse(JSON.stringify(boardItems)), ...prev]);
      setBoardItems(previous);
      setHistory(prev => prev.slice(1));
      setFeedback({ message: "已撤销操作", type: "success" });
      setTimeout(() => setFeedback({ message: null }), 1000);
    }
  }, [history, boardItems]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[0];
      setHistory(prev => [JSON.parse(JSON.stringify(boardItems)), ...prev]);
      setBoardItems(next);
      setRedoStack(prev => prev.slice(1));
      setFeedback({ message: "已还原操作", type: "success" });
      setTimeout(() => setFeedback({ message: null }), 1000);
    }
  }, [redoStack, boardItems]);

  const addToBoard = (card) => {
    if (boardItems.some(item => item.id === card.id)) {
      setFeedback({ message: `"${card.title}" 已在白板中`, type: 'error' });
      setTimeout(() => setFeedback({ message: null, type: 'success' }), 2000);
      return;
    }
    const maxZ = Math.max(0, ...boardItems.map(i => i.zIndex || 0));
    const newItem = {
      boardId: `board-${Date.now()}`,
      ...card,
      atmosphere: card.atmosphere || [],
      morphology: card.morphology || [],
      x: (window.innerWidth / 2 - boardView.x) / boardView.scale - 104, 
      y: (window.innerHeight / 2 - boardView.y) / boardView.scale - 170,
      zIndex: maxZ + 1,
      isSelected: false,
      isAiAnalyzed: true,
      isLibraryItem: true,
      w: 208, h: 340
    };
    saveSnapshot(boardItems);
    setBoardItems([...boardItems, newItem]);
    setFeedback({ message: `已添加 "${card.title}"`, type: 'success' });
    setTimeout(() => setFeedback({ message: null, type: 'success' }), 2000);
  };

  const isMoodboardMode = activeTab === 'moodboard';

  return (
    <div className={`min-h-screen transition-all ${darkMode ? 'bg-black text-zinc-100' : 'bg-white text-black'} overflow-hidden font-sans select-none`}>
      {feedback.message && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          feedback.type === 'success' ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-amber-400 border border-amber-400/30'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-black tracking-tight">{feedback.message}</span>
        </div>
      )}

      {/* 侧边导航 */}
      <aside className={`fixed left-0 top-0 h-full border-r ${darkMode ? 'border-zinc-800 bg-black' : 'border-zinc-100 bg-white'} py-8 z-40 hidden md:flex flex-col transition-all duration-300 ease-in-out group/sidebar overflow-hidden w-16 hover:w-64 shadow-2xl`}>
        <div onClick={() => setActiveTab('discovery')} className="flex items-center w-full mb-12 whitespace-nowrap cursor-pointer hover:opacity-80 active:scale-95 transition-all">
          <div className="w-16 flex-none flex items-center justify-center"><div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">ID</div></div>
          <h1 className="font-bold text-lg tracking-tighter transition-all duration-300 opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible text-indigo-500 uppercase">Design Database</h1>
        </div>
        <nav className="space-y-2 w-full">
          <NavItem icon={<Home size={20}/>} label="发现" active={activeTab === 'discovery'} onClick={() => setActiveTab('discovery')} />
          <NavItem icon={<BookOpen size={20}/>} label="设计语汇" active={activeTab === 'vocabulary'} onClick={() => setActiveTab('vocabulary')} />
          <NavItem icon={<Palette size={20}/>} label="情绪白板" active={activeTab === 'moodboard'} onClick={() => setActiveTab('moodboard')} />
        </nav>
        <button onClick={() => setDarkMode(!darkMode)} className={`absolute bottom-10 left-0 w-full h-12 flex items-center transition-all duration-300 ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>
          <div className="w-16 flex-none flex items-center justify-center">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</div>
          <span className="whitespace-nowrap text-sm font-black transition-all duration-300 opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible">切换外观</span>
        </button>
      </aside>

      <main className={`transition-all duration-300 md:pl-16 ${isMoodboardMode ? 'h-screen' : 'pt-16 min-h-screen'}`}>
        {isMoodboardMode ? (
          <MoodBoard 
            items={boardItems} setItems={setBoardItems} 
            view={boardView} setView={setBoardView} 
            darkMode={darkMode} setIsAiAnalyzing={setIsAiAnalyzing} 
            onOpenDetail={setSelectedBoardItem}
            undo={handleUndo} redo={handleRedo} saveSnapshot={saveSnapshot}
            history={history} redoStack={redoStack}
          />
        ) : (
          <div className="p-10 max-w-[1600px] mx-auto text-center md:text-left">
             <header className="mb-12 header-title flex flex-col md:flex-row md:items-center justify-between gap-6">
               <h2 className="text-3xl font-black tracking-tighter uppercase italic text-indigo-600">
                {activeTab === 'discovery' ? '今日发现' : '语汇库检索'}
               </h2>
               <div className="max-w-xl relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /><input type="text" placeholder="检索设计灵感..." className={`w-full py-4 pl-12 pr-6 rounded-3xl text-sm outline-none border-2 transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-transparent focus:bg-white focus:border-black'}`} /></div>
            </header>
            
            {/* 内容渲染区域：增加加载状态显示 */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">加载语汇数据库...</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {vocabularyCards.map(card => (
                  <div key={card.id} onClick={() => setSelectedCard(card)} className={`break-inside-avoid group cursor-pointer overflow-hidden rounded-[32px] border-2 transition-all duration-500 ${darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500 shadow-2xl shadow-black' : 'bg-white border-zinc-100 hover:border-black shadow-sm'}`}>
                    <div className="aspect-[4/5] overflow-hidden relative bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
                      <img src={card.mainImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      <div className="absolute top-5 left-5 px-3 py-1 bg-black/60 backdrop-blur-md text-[9px] font-bold text-white rounded-full uppercase tracking-widest">{card.category}</div>
                    </div>
                    <div className="p-6 flex justify-between items-center">
                      <h3 className="font-black text-xl tracking-tight truncate">{card.title}</h3>
                      <button onClick={(e) => { e.stopPropagation(); addToBoard(card); }} className="p-3 hover:bg-indigo-500 hover:text-white dark:bg-zinc-800 rounded-2xl transition-all">
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedCard && <DetailModal card={selectedCard} onClose={() => setSelectedCard(null)} darkMode={darkMode} onAddToBoard={addToBoard} />}
