import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Search, Home, BookOpen, ImageIcon, Palette, Upload, Plus, X, Moon, Sun, Maximize2, Share2, Sparkles, Loader2,
  Wand2, Trash2, Copy, CheckSquare, Type, MousePointer2, ImageOff, ZoomIn, ZoomOut, RotateCcw, Hand, CheckCircle2,
  AlertCircle, Edit3, Undo2, Redo2, ClipboardPaste, ImagePlus
} from 'lucide-react';

const apiKey = "";
const GEN_MODEL = "gemini-2.5-flash-preview-09-2025";

// --- 健壮的本地 CSV 解析器 ---
const parseCSV = (str) => {
  const arr = [];
  let quote = false;
  let row = 0;
  let col = 0;
  for (let c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c + 1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';
    if (cc === '"' && quote && nc === '"') {
      arr[row][col] += cc;
      ++c;
      continue;
    }
    if (cc === '"') {
      quote = !quote;
      continue;
    }
    if (cc === ',' && !quote) {
      ++col;
      continue;
    }
    if (cc === '\r' && nc === '\n' && !quote) {
      ++row;
      col = 0;
      ++c;
      continue;
    }
    if (cc === '\n' && !quote) {
      ++row;
      col = 0;
      continue;
    }
    if (cc === '\r' && !quote) {
      ++row;
      col = 0;
      continue;
    }
    arr[row][col] += cc;
  }
  if (arr.length === 0) return [];
  const headers = arr[0].map(h => h.trim());
  return arr.slice(1)
    .filter(row => row.length > 0 && row.some(cell => cell && cell.trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ? row[i].trim() : '';
      });
      return obj;
    });
};

// --- 工具函数：深拷贝（优化版，仅针对此场景） ---
// 原生 structuredClone 或 JSON.parse(JSON.stringify()) 都有性能损耗，这里保持原样但减少调用次数
const createSnapshot = (items) => JSON.parse(JSON.stringify(items));

// --- Memoized NavItem ---
const NavItem = memo(({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center transition-all duration-300 h-14 relative overflow-hidden group/item ${
        active ? 'text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'
      }`}
    >
      <div
        className={`absolute inset-y-1 left-2 right-2 rounded-2xl transition-all duration-300 ${
          active ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-transparent'
        }`}
      />
      <div className="relative w-16 flex-none flex items-center justify-center">
        {icon}
      </div>
      <span className="relative whitespace-nowrap text-sm font-black transition-all duration-300 opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible">
        {label}
      </span>
    </button>
  );
});

// --- Memoized BoardItem (关键性能优化点) ---
const MemoizedBoardItem = memo(BoardItem);

function App() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedBoardItem, setSelectedBoardItem] = useState(null);
  // --- 动态数据源状态 ---
  const [vocabularyCards, setVocabularyCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState({ message: null, type: 'success' });
  const [boardItems, setBoardItems] = useState([]);
  const [boardView, setBoardView] = useState({ x: 0, y: 0, scale: 1 });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // --- 加载并解析 CSV 数据 (优化：避免重复函数定义) ---
  useEffect(() => {
    const loadData = async () => {
      try {
        let fetchUrl = '/vocabulary.csv';
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) {
          fetchUrl = import.meta.env.BASE_URL + 'vocabulary.csv';
          fetchUrl = fetchUrl.replace('//', '/');
        }
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`HTTP 状态异常: ${response.status}`);
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);

        // --- 优化：使用 Map 函数一次性构建数据 ---
        const formattedCards = useMemo(() => parsedData.map((item, idx) => {
          const relTerms = (item['关联语汇'] || '').split(',').map(s => s.trim()).filter(Boolean);
          const relTermsRev = (item['关联语汇（反向）'] || '').split(',').map(s => s.trim()).filter(Boolean);
          return {
            id: `voc_${idx}`,
            type: 'vocabulary',
            title: item['语汇'] || '未命名',
            category: item['一级分类'] || '未分类',
            category2: item['二级分类'] || '',
            description: item['描述'] || '暂无描述信息...',
            relatedTerms: relTerms,
            relatedTermsReverse: relTermsRev,
            atmosphere: relTerms,
            morphology: relTermsRev,
            mainImage: item['主图'] || ''
          };
        }), [parsedData]); // 依赖 parsedData

        setVocabularyCards(formattedCards);
      } catch (error) {
        console.warn("加载数据失败，启用演示数据", error);
        setFeedback({ message: "未检测到真实数据库，已启用演示数据", type: 'error' });
        setTimeout(() => setFeedback({ message: null }), 3000);
        setVocabularyCards([{
          id: 'v1',
          type: 'vocabulary',
          title: '先锋主义',
          category: '设计风格',
          category2: '进阶流派',
          description: '突破传统、追求创新与实验性。常见设计手法包括非对称布局、非常规材料运用、抽象化造型及大胆色彩碰撞。',
          relatedTerms: ['戏剧张力', '力量感', '理性'],
          relatedTermsReverse: ['咬合穿插', '几何构成'],
          atmosphere: ['戏剧张力', '力量感', '理性'],
          morphology: ['咬合穿插', '几何构成'],
          mainImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800'
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []); // 依赖为空，只在挂载时运行

  // --- 样式注入：改回系统默认原生光标 ---
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

  // --- 优化：使用 useCallback 缓存函数，避免子组件频繁重渲染 ---
  const saveSnapshot = useCallback((items) => {
    setHistory(prev => [createSnapshot(items), ...prev].slice(0, 31));
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const previous = history[0];
      setRedoStack(prev => [createSnapshot(boardItems), ...prev]);
      setBoardItems(previous);
      setHistory(prev => prev.slice(1));
      setFeedback({ message: "已撤销操作", type: "success" });
      setTimeout(() => setFeedback({ message: null }), 1000);
    }
  }, [history, boardItems]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[0];
      setHistory(prev => [createSnapshot(boardItems), ...prev]);
      setBoardItems(next);
      setRedoStack(prev => prev.slice(1));
      setFeedback({ message: "已还原操作", type: "success" });
      setTimeout(() => setFeedback({ message: null }), 1000);
    }
  }, [redoStack, boardItems]);

  const addToBoard = useCallback((card) => {
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
      w: 208,
      h: 340
    };
    saveSnapshot(boardItems);
    setBoardItems([...boardItems, newItem]);
    setFeedback({ message: `已添加 "${card.title}"`, type: 'success' });
    setTimeout(() => setFeedback({ message: null, type: 'success' }), 2000);
  }, [boardItems, boardView, saveSnapshot]);

  const isMoodboardMode = activeTab === 'moodboard';

  // --- 优化：Memoize NavItems data if possible, or ensure stable references ---
  // For now, we rely on the useCallback and memo of NavItem

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
          <div className="w-16 flex-none flex items-center justify-center">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">ID</div>
          </div>
          <h1 className="font-bold text-lg tracking-tighter transition-all duration-300 opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible text-indigo-500 uppercase">Design Database</h1>
        </div>
        <nav className="space-y-2 w-full">
          <NavItem icon={<Home size={20}/>} label="发现" active={activeTab === 'discovery'} onClick={() => setActiveTab('discovery')} />
          <NavItem icon={<BookOpen size={20}/>} label="设计语汇" active={activeTab === 'vocabulary'} onClick={() => setActiveTab('vocabulary')} />
          <NavItem icon={<Palette size={20}/>} label="情绪白板" active={activeTab === 'moodboard'} onClick={() => setActiveTab('moodboard')} />
        </nav>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`absolute bottom-10 left-0 w-full h-12 flex items-center transition-all duration-300 ${
            darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
          }`}
        >
          <div className="w-16 flex-none flex items-center justify-center">
            {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
          </div>
          <span className="whitespace-nowrap text-sm font-black transition-all duration-300 opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible">切换外观</span>
        </button>
      </aside>

      <main className={`transition-all duration-300 md:pl-16 ${isMoodboardMode ? 'h-screen' : 'pt-16 min-h-screen'}`}>
        {isMoodboardMode ? (
          <MoodBoard
            items={boardItems}
            setItems={setBoardItems}
            view={boardView}
            setView={setBoardView}
            darkMode={darkMode}
            setIsAiAnalyzing={setIsAiAnalyzing}
            onOpenDetail={setSelectedBoardItem}
            undo={handleUndo}
            redo={handleRedo}
            saveSnapshot={saveSnapshot}
            history={history}
            redoStack={redoStack}
          />
        ) : (
          <div className="p-10 max-w-[1600px] mx-auto text-center md:text-left">
            <header className="mb-12 header-title flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic text-indigo-600">
                {activeTab === 'discovery' ? '今日发现' : '语汇库检索'}
              </h2>
              <div className="max-w-xl relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  placeholder="检索设计灵感..."
                  className={`w-full py-4 pl-12 pr-6 rounded-3xl text-sm outline-none border-2 transition-all ${
                    darkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-transparent focus:bg-white focus:border-black'
                  }`}
                />
              </div>
            </header>
            {isLoading ? (
              <div className="h-[50vh] flex flex-col items-center justify-center text-zinc-400">
                <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                <p className="font-bold tracking-widest uppercase animate-pulse">解析数据库中...</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {vocabularyCards.map(card => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`break-inside-avoid group cursor-pointer overflow-hidden rounded-[32px] border-2 transition-all duration-500 ${
                      darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500 shadow-2xl shadow-black' : 'bg-white border-zinc-100 hover:border-black shadow-sm'
                    } flex flex-col`}
                  >
                    <div className="aspect-[4/5] overflow-hidden relative bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center shrink-0">
                      {card.mainImage ? (
                        <img src={card.mainImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      ) : (
                        <ImageOff className="text-zinc-300 dark:text-zinc-700" size={32} />
                      )}
                      {/* 多重分类胶囊 */}
                      <div className="absolute top-5 left-5 flex flex-col gap-2 items-start z-10">
                        <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white rounded-full uppercase tracking-widest shadow-sm">
                          {card.category}
                        </span>
                        {card.category2 && (
                          <span className="px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md text-zinc-900 dark:text-zinc-100 text-[9px] font-bold rounded-full border border-white/40 dark:border-zinc-700/50 shadow-sm uppercase tracking-widest">
                            {card.category2}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-black text-xl tracking-tight truncate pr-2">{card.title}</h3>
                        <button
                          onClick={(e) => { e.stopPropagation(); addToBoard(card); }}
                          className="p-3 shrink-0 hover:bg-indigo-500 hover:text-white bg-zinc-50 dark:bg-zinc-800 rounded-2xl transition-all"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                      {/* 真实数据标签 */}
                      <div className="mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-wrap gap-1.5">
                        {card.relatedTerms && card.relatedTerms.length > 0 ? (
                          <>
                            {card.relatedTerms.slice(0, 2).map((term, i) => (
                              <span
                                key={i}
                                className="truncate px-2.5 py-1 text-[10px] font-bold tracking-wider bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg max-w-[85px]"
                              >
                                {term}
                              </span>
                            ))}
                            {card.relatedTerms.length > 2 && (
                              <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-lg shrink-0">
                                +{card.relatedTerms.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-zinc-400 italic">暂无关联节点</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      {selectedCard && <DetailModal card={selectedCard} onClose={() => setSelectedCard(null)} darkMode={darkMode} onAddToBoard={addToBoard} />}
      {selectedBoardItem && (
        <WhiteboardDetailModal
          item={selectedBoardItem}
          onClose={() => { saveSnapshot(boardItems); setSelectedBoardItem(null); }}
          onUpdate={(updates) => setBoardItems(prev => prev.map(it => it.boardId === selectedBoardItem.boardId ? { ...it, ...updates } : it))}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// --- MoodBoard Component (Optimized) ---
// We keep the logic but ensure internal functions are stable
const MoodBoard = memo(({ items, setItems, view, setView, darkMode, setIsAiAnalyzing, onOpenDetail, undo, redo, saveSnapshot, history, redoStack }) => {
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSpacePressed,
