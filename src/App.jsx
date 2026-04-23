import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Home, BookOpen, ImageIcon, Palette, Upload, Plus, X, Moon, Sun, 
  Maximize2, Share2, Sparkles, Loader2, Wand2, Trash2, Copy, CheckSquare,
  Type, MousePointer2, ImageOff, ZoomIn, ZoomOut, RotateCcw, Hand, CheckCircle2, AlertCircle, Edit3,
  Undo2, Redo2, ClipboardPaste, ImagePlus
} from 'lucide-react';

/**
 * --- 本地开发说明 ---
 * 在您的本地 GitHub 环境中，请确保运行过 node convert.js 生成了 src/data.json。
 * 然后取消下面这一行的注释来引入真实数据：
 */
// import vocabularyDataFromLocal from './data.json'; 

// 为了让当前的在线预览能正常运行而不报错，我们预设一组演示数据
const MOCK_DATA = [
  {
    id: 'v1',
    title: '先锋主义 (演示)',
    category1: '风格',
    category2: '先锋主义',
    description: '这是演示数据。如果您在本地运行并生成了 data.json，请按代码上方的注释取消 import 的注释。',
    related: ['几何构成', '不锈钢', '前卫'],
    mainImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'v2',
    title: '现代简约 (演示)',
    category1: '风格',
    category2: '极简',
    description: '少即是多，通过精炼的线条和色彩表达空间的纯粹感。',
    related: ['极简', '留白'],
    mainImage: 'https://images.unsplash.com/photo-1615873968403-89e068629275?auto=format&fit=crop&q=80&w=800'
  }
];

const apiKey = ""; 
const GEN_MODEL = "gemini-2.5-flash-preview-09-2025";

export default function App() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedBoardItem, setSelectedBoardItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- 核心修复：防止变量未定义导致的白屏 ---
  const [vocabularyCards, setVocabularyCards] = useState(() => {
    // 检查 vocabularyDataFromLocal 是否被正确导入（即在本地环境下）
    if (typeof vocabularyDataFromLocal !== 'undefined' && Array.isArray(vocabularyDataFromLocal)) {
      return vocabularyDataFromLocal;
    }
    return MOCK_DATA; // 否则使用演示数据
  });
  
  const [feedback, setFeedback] = useState({ message: null, type: 'success' }); 
  const [boardItems, setBoardItems] = useState([]); 
  const [boardView, setBoardView] = useState({ x: 0, y: 0, scale: 1 });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // 搜索过滤逻辑
  const filteredCards = useMemo(() => {
    return vocabularyCards.filter(card => 
      card.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.category1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vocabularyCards, searchTerm]);

  const isUserTyping = () => {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  };

  const saveSnapshot = useCallback((items) => {
    setHistory(prev => [JSON.parse(JSON.stringify(items)), ...prev].slice(0, 31));
    setRedoStack([]); 
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const previous = history[0];
      const current = JSON.parse(JSON.stringify(boardItems));
      setRedoStack(prev => [current, ...prev].slice(0, 31));
      setBoardItems(previous);
      setHistory(prev => prev.slice(1));
      showFeedback("已撤销操作");
    }
  }, [history, boardItems]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[0];
      const current = JSON.parse(JSON.stringify(boardItems));
      setHistory(prev => [current, ...prev].slice(0, 31));
      setBoardItems(next);
      setRedoStack(prev => prev.slice(1));
      showFeedback("已还原操作");
    }
  }, [redoStack, boardItems]);

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ message: msg, type });
    setTimeout(() => setFeedback({ message: null }), 2000);
  };

  const addToBoard = (card) => {
    const newItem = {
      boardId: `board-${Date.now()}`,
      ...card,
      atmosphere: card.related || [],
      morphology: [],
      x: (window.innerWidth / 2 - boardView.x - 100) / boardView.scale,
      y: (window.innerHeight / 2 - boardView.y - 150) / boardView.scale,
      zIndex: boardItems.length > 0 ? Math.max(...boardItems.map(i => i.zIndex || 0)) + 1 : 1,
      isSelected: false,
      isAiAnalyzed: true,
      isLibraryItem: true,
      w: 208, h: 340
    };
    saveSnapshot(boardItems);
    setBoardItems([...boardItems, newItem]);
    showFeedback(`已添加 "${card.title}"`);
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

      {/* 极简侧边栏 */}
      <aside className={`fixed left-0 top-0 h-full border-r ${darkMode ? 'border-zinc-800 bg-black' : 'border-zinc-100 bg-white'} py-8 z-40 flex flex-col transition-all duration-300 ease-in-out group/sidebar overflow-hidden w-16 hover:w-60 shadow-2xl`}>
        <div onClick={() => setActiveTab('discovery')} className="flex items-center w-full mb-12 whitespace-nowrap cursor-pointer hover:opacity-80 active:scale-95 transition-all">
          <div className="w-16 flex-none flex items-center justify-center">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center font-black text-white dark:text-black shadow-lg">ID</div>
          </div>
          <h1 className="font-bold text-lg tracking-tighter transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100">DesignByte</h1>
        </div>
        
        <nav className="space-y-2 w-full">
          <NavItem icon={<Home size={20}/>} label="发现" active={activeTab === 'discovery'} onClick={() => setActiveTab('discovery')} />
          <NavItem icon={<BookOpen size={20}/>} label="设计语汇" active={activeTab === 'vocabulary'} onClick={() => setActiveTab('vocabulary')} />
          <NavItem icon={<Palette size={20}/>} label="情绪白板" active={activeTab === 'moodboard'} onClick={() => setActiveTab('moodboard')} />
        </nav>

        <button onClick={() => setDarkMode(!darkMode)} className={`absolute bottom-10 left-0 w-full h-12 flex items-center transition-all duration-300 ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>
          <div className="w-16 flex-none flex items-center justify-center">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</div>
          <span className="whitespace-nowrap text-sm font-black transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100">模式切换</span>
        </button>
      </aside>

      <main className={`transition-all duration-300 pl-16 ${isMoodboardMode ? 'h-screen' : 'pt-16 min-h-screen'}`}>
        {isMoodboardMode ? (
          <MoodBoard 
            items={boardItems} setItems={setBoardItems} 
            view={boardView} setView={setBoardView} 
            darkMode={darkMode} 
            onOpenDetail={setSelectedBoardItem}
            undo={handleUndo} redo={handleRedo} saveSnapshot={saveSnapshot}
            history={history} redoStack={redoStack}
            isUserTyping={isUserTyping}
          />
        ) : (
          <div className="p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
             <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <h2 className="text-3xl font-black tracking-tighter uppercase italic text-indigo-500">
                 {activeTab === 'discovery' ? '今日发现' : '语汇库检索'}
               </h2>
               <div className="max-w-xl relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="搜索语汇、分类或描述..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full py-4 pl-12 pr-6 rounded-3xl text-sm outline-none border-2 transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-transparent focus:bg-white focus:border-black'}`} 
                  />
               </div>
            </header>
            
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {filteredCards.map(card => (
                <div key={card.id || card.title} onClick={() => setSelectedCard(card)} className={`break-inside-avoid group cursor-pointer overflow-hidden rounded-[32px] border-2 transition-all duration-500 ${darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500 shadow-2xl shadow-black' : 'bg-white border-zinc-100 hover:border-black shadow-sm'}`}>
                  <div className="aspect-[4/5] overflow-hidden relative bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
                    <img src={card.mainImage || 'https://via.placeholder.com/400x500?text=DesignByte'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={card.title} />
                    <div className="absolute top-5 left-5 px-3 py-1 bg-black/60 backdrop-blur-md text-[9px] font-bold text-white rounded-full uppercase tracking-widest">
                      {card.category1} {card.category2 && `· ${card.category2}`}
                    </div>
                  </div>
                  <div className="p-6 flex justify-between items-center">
                    <div className="truncate pr-4">
                      <h3 className="font-black text-xl tracking-tight truncate">{card.title}</h3>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">{card.category1}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); addToBoard(card); }} className="p-3 hover:bg-indigo-500 hover:text-white dark:bg-zinc-800 rounded-2xl transition-all active:scale-90">
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredCards.length === 0 && (
              <div className="text-center py-20 opacity-20">
                <Search size={48} className="mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest">未找到相关语汇</p>
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
          onUpdate={(updates) => setBoardItems(prev => prev.map(it => it.boardId === selectedBoardItem.boardId ? {...it, ...updates} : it))} 
          darkMode={darkMode} 
        />
      )}
    </div>
  );
}

// 子组件定义
function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center transition-all duration-300 h-14 relative overflow-hidden group/item ${active ? 'text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
      <div className={`absolute inset-y-1 left-2 right-2 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-transparent'}`} />
      <div className="relative w-16 flex-none flex items-center justify-center">{icon}</div>
      <span className="relative whitespace-nowrap text-sm font-black transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100">{label}</span>
    </button>
  );
}

function MoodBoard({ items, setItems, view, setView, darkMode, onOpenDetail, undo, redo, saveSnapshot, history, redoStack, isUserTyping }) {
  const boardRef = useRef(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);

  const aggregatedTags = useMemo(() => {
    const selected = items.filter(i => i.isSelected);
    if (selected.length === 0) return [];
    return [...new Set(selected.flatMap(i => [...(i.atmosphere || []), ...(i.related || [])]))];
  }, [items]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isUserTyping()) return;
      const ctrlKey = e.metaKey || e.ctrlKey;
      if (ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        const selected = items.filter(i => i.isSelected);
        if (selected.length > 0) { saveSnapshot(items); setItems(items.filter(item => !item.isSelected)); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, undo, redo, saveSnapshot, setItems, isUserTyping]);

  const onBoardMouseDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    const isPanning = (isSpacePressed && !isUserTyping()) || e.button === 1;
    if (isPanning) {
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY, initialX = view.x, initialY = view.y;
      const move = (mE) => setView(v => ({ ...v, x: initialX + (mE.clientX - startX), y: initialY + (mE.clientY - startY) }));
      const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
      window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    } else if (e.target === boardRef.current) {
      setItems(prev => prev.map(it => ({ ...it, isSelected: false })));
      const rect = boardRef.current.getBoundingClientRect();
      const canvasStartX = (e.clientX - rect.left - view.x) / view.scale;
      const canvasStartY = (e.clientY - rect.top - view.y) / view.scale;
      setSelectionBox({ x: canvasStartX, y: canvasStartY, w: 0, h: 0 });
      const move = (mE) => {
        const curX = (mE.clientX - rect.left - view.x) / view.scale, curY = (mE.clientY - rect.top - view.y) / view.scale;
        const box = { x: Math.min(canvasStartX, curX), y: Math.min(canvasStartY, curY), w: Math.abs(curX - canvasStartX), h: Math.abs(curY - canvasStartY) };
        setSelectionBox(box);
        setItems(prev => prev.map(item => ({ ...item, isSelected: !(item.x + item.w < box.x || item.x > box.x + box.w || item.y + item.h < box.y || item.y > box.y + box.h) })));
      };
      const up = () => { setSelectionBox(null); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
      window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    }
  };

  return (
    <div className="flex h-full relative">
      <div 
        ref={boardRef} onMouseDown={onBoardMouseDown} 
        onWheel={(e) => {
          e.preventDefault();
          const factor = 1 + (e.deltaY > 0 ? -1 : 1) * 0.15;
          const newScale = Math.min(Math.max(view.scale * factor, 0.15), 5);
          const rect = boardRef.current.getBoundingClientRect();
          const canvasX = (e.clientX - rect.left - view.x) / view.scale, canvasY = (e.clientY - rect.top - view.y) / view.scale;
          setView({ x: Math.round((e.clientX - rect.left) - canvasX * newScale), y: Math.round((e.clientY - rect.top) - canvasY * newScale), scale: newScale });
        }} 
        className={`flex-1 relative overflow-hidden ${darkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50'}`} 
        style={{ backgroundImage: darkMode ? 'radial-gradient(#333 1px, transparent 1px)' : 'radial-gradient(#ddd 1px, transparent 1px)', backgroundSize: `${40 * view.scale}px ${40 * view.scale}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`, transformOrigin: '0 0' }}>
          {items.map((item) => (
            <BoardItem 
              key={item.boardId} item={item} darkMode={darkMode} 
              onMove={(id, dx, dy) => setItems(prev => prev.map(i => (i.boardId === id || i.isSelected) ? { ...i, x: i.x + dx / view.scale, y: i.y + dy / view.scale } : i))}
              onMoveEnd={() => saveSnapshot(items)}
              onSelect={(id, multi) => setItems(prev => prev.map(it => it.boardId === id ? { ...it, isSelected: multi ? !it.isSelected : true } : (multi ? it : { ...it, isSelected: false })))}
              onDoubleClick={(id) => { const it = items.find(x => x.boardId === id); onOpenDetail(it); }}
              onUpdate={(id, updates) => setItems(prev => prev.map(it => it.boardId === id ? { ...it, ...updates } : it))}
            />
          ))}
          {selectionBox && <div className="absolute border-2 border-indigo-500 bg-indigo-500/10 z-[1000]" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />}
        </div>
      </div>
      
      <div className={`w-80 border-l p-8 flex flex-col ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
        <div className="flex items-center gap-2 mb-8"><Sparkles size={20} className="text-indigo-500" /><h3 className="font-black text-xs uppercase tracking-widest">AI 语汇编排</h3></div>
        <div className="flex-1 overflow-y-auto">
          <section className="mb-10">
            <h4 className="text-[10px] font-black text-zinc-400 mb-4 uppercase tracking-widest">聚合语汇</h4>
            <div className="flex flex-wrap gap-2">
              {aggregatedTags.length > 0 ? aggregatedTags.map(tag => <span key={tag} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${darkMode ? 'border-zinc-800 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50'}`}>{tag}</span>) : <p className="text-[10px] opacity-30 italic text-center w-full">选中卡片以分析...</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function BoardItem({ item, darkMode, onMove, onMoveEnd, onSelect, onDoubleClick, onUpdate }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => { 
    if (e.button !== 0) return; 
    onSelect(item.boardId, e.shiftKey || e.ctrlKey || e.metaKey); 
    setIsDragging(true); 
    dragRef.current = { x: e.clientX, y: e.clientY }; 
    e.stopPropagation(); 
  };

  useEffect(() => {
    const move = (e) => { if (isDragging) { onMove(item.boardId, e.clientX - dragRef.current.x, e.clientY - dragRef.current.y); dragRef.current = { x: e.clientX, y: e.clientY }; } };
    const up = () => { if(isDragging) onMoveEnd(); setIsDragging(false); };
    if (isDragging) { window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); }
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [isDragging, item.boardId, onMove, onMoveEnd]);
  
  return (
    <div 
      style={{ transform: `translate3d(${item.x}px, ${item.y}px, 0)`, zIndex: item.zIndex || 1, position: 'absolute', cursor: isDragging ? 'grabbing' : 'auto', pointerEvents: 'auto' }} 
      onMouseDown={handleMouseDown} 
      onDoubleClick={() => onDoubleClick(item.boardId)} 
      className={`transition-[box-shadow,border-color] duration-300 w-52 rounded-[32px] p-2 border-4 ${item.isSelected ? 'border-indigo-500 ring-8 ring-indigo-500/10 scale-105' : 'border-transparent'} ${darkMode ? 'bg-zinc-900 shadow-2xl' : 'bg-white shadow-xl'}`}
    >
      <div className="relative flex flex-col items-center">
        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-md text-[8px] font-bold text-white rounded uppercase tracking-tighter z-10">{item.category1}</div>
        <div className="aspect-[4/5] w-full bg-zinc-100 dark:bg-zinc-800 rounded-[24px] overflow-hidden">
          <img src={item.mainImage} className="w-full h-full object-cover pointer-events-none" alt={item.title} />
        </div>
        <div className="p-4 w-full">
           <input value={item.title} onChange={(e) => onUpdate(item.boardId, { title: e.target.value })} onMouseDown={e => e.stopPropagation()} className="w-full bg-transparent font-black text-xl outline-none text-center truncate" />
        </div>
      </div>
    </div>
  );
}

function DetailModal({ card, onClose, darkMode, onAddToBoard }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
      <div onClick={(e) => e.stopPropagation()} className={`relative w-full max-w-5xl h-[80vh] overflow-hidden rounded-[48px] flex flex-col md:flex-row shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white'}`}>
        <button className="absolute right-8 top-8 p-3 hover:bg-black/10 rounded-full z-20" onClick={onClose}><X size={24}/></button>
        <div className="md:w-[60%] bg-black flex items-center justify-center overflow-hidden">
          <img src={card.mainImage} className="max-w-full max-h-full object-contain" alt={card.title} />
        </div>
        <div className="md:w-[40%] p-12 overflow-y-auto border-l dark:border-zinc-800">
          <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black rounded-lg uppercase mb-4 inline-block tracking-widest">{card.category1} · {card.category2}</span>
          <h2 className="text-4xl font-black tracking-tighter mb-8 leading-[0.9]">{card.title}</h2>
          <div className="space-y-6 mb-10">
             <div>
               <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">语汇描述</h4>
               <p className="text-sm opacity-60 leading-relaxed text-justify">{card.description}</p>
             </div>
             {card.related && card.related.length > 0 && (
               <div>
                 <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">关联语汇</h4>
                 <div className="flex flex-wrap gap-2">
                   {card.related.map(tag => (
                     <span key={tag} className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded text-[10px] font-bold"># {tag}</span>
                   ))}
                 </div>
               </div>
             )}
          </div>
          <button onClick={() => onAddToBoard(card)} className="w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity">加入情绪板</button>
        </div>
      </div>
    </div>
  );
}

function WhiteboardDetailModal({ item, onClose, onUpdate, darkMode }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
      <div onClick={(e) => e.stopPropagation()} className={`relative w-full max-w-6xl h-[85vh] overflow-hidden rounded-[48px] flex flex-col md:flex-row shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white text-black'}`}>
        <button className="absolute right-8 top-8 p-3 hover:bg-black/10 rounded-full z-20" onClick={onClose}><X size={24}/></button>
        <div className="md:w-[55%] bg-black flex items-center justify-center overflow-hidden">
          <img src={item.mainImage} className="max-w-full max-h-full object-contain" alt={item.title} />
        </div>
        <div className="md:w-[45%] p-12 overflow-y-auto border-l dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-6 text-indigo-500 font-black text-[10px] uppercase tracking-widest"><Edit3 size={14}/> 查看详情</div>
          <div className="space-y-10">
            <div><label className="text-[10px] font-black text-zinc-400 mb-2 block uppercase tracking-widest">名称</label><input value={item.title} onChange={(e) => onUpdate({ title: e.target.value })} className="w-full bg-transparent text-4xl font-black tracking-tighter outline-none border-b border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 pb-2" /></div>
            <div><label className="text-[10px] font-black text-zinc-400 mb-2 block uppercase tracking-widest">描述</label><p className="text-sm opacity-60 leading-relaxed">{item.description}</p></div>
            <div>
              <label className="text-[10px] font-black text-zinc-400 mb-3 block uppercase tracking-widest">关联标签</label>
              <div className="flex flex-wrap gap-2">
                {(item.atmosphere || item.related || []).map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-[10px] font-black">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({ icon, onClick, darkMode }) {
  return <button onClick={onClick} className={`p-3 rounded-2xl border transition-all hover:scale-110 shadow-lg ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-black'}`}>{icon}</button>;
}
