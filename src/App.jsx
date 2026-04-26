import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Home, BookOpen, ImageIcon, Palette, Upload, Plus, X, Moon, Sun, 
  Maximize2, Share2, Sparkles, Loader2, Wand2, Trash2, Copy, CheckSquare,
  Type, MousePointer2, ImageOff, ZoomIn, ZoomOut, RotateCcw, Hand, CheckCircle2, AlertCircle, Edit3,
  Undo2, Redo2, ClipboardPaste, ImagePlus
} from 'lucide-react';

/**
 * --- 本地开发关键点 ---
 * 1. 确保运行过 npm run convert 产生了 src/data.json
 * 2. 在本地 VS Code 中取消下面这一行的注释：
 */
import vocabularyData from './data.json'; 

// 备用演示数据：用于预览环境或数据缺失时
const MOCK_DATA = [
  { 
    id: 'v1', 
    title: '示例：先锋主义', 
    category1: '风格', 
    category2: '先锋主义', 
    description: '强调实验性与反传统的空间表达，通过非常规材料和造型打破常规。', 
    related: ['几何构成', '不锈钢', '戏剧感'], 
    mainImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800' 
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedBoardItem, setSelectedBoardItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- 数据库驱动：加载逻辑 ---
  const [vocabularyCards] = useState(() => {
    try {
      // 检查导入的 JSON 数据是否存在
      if (typeof vocabularyData !== 'undefined' && Array.isArray(vocabularyData) && vocabularyData.length > 0) {
        return vocabularyData;
      }
    } catch (e) {}
    return MOCK_DATA;
  });

  // 辅助函数：根据 CSV 表头动态获取语汇名称，解决“不显示名字”问题
  const getVocabTitle = (card) => {
    return card.title || card.name || card['语汇'] || card['语汇名称'] || "未命名语汇";
  };

  const [feedback, setFeedback] = useState({ message: null, type: 'success' }); 
  const [boardItems, setBoardItems] = useState([]); 
  const [boardView, setBoardView] = useState({ x: 0, y: 0, scale: 1 });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // 搜索、过滤与自动排序（按ID或分类排序）
  const filteredCards = useMemo(() => {
    let result = vocabularyCards.filter(card => {
      const title = getVocabTitle(card).toLowerCase();
      const cat = (card.category1 || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      return title.includes(search) || cat.includes(search);
    });

    return result.sort((a, b) => {
      if (a.id && b.id) return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
      return (a.category1 || "").localeCompare(b.category1 || "");
    });
  }, [vocabularyCards, searchTerm]);

  const isUserTyping = () => {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  };

  // 撤销/重做快照系统
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
    }
  }, [history, boardItems]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[0];
      const current = JSON.parse(JSON.stringify(boardItems));
      setHistory(prev => [current, ...prev].slice(0, 31));
      setBoardItems(next);
      setRedoStack(prev => prev.slice(1));
    }
  }, [redoStack, boardItems]);

  const showFeedback = (msg) => {
    setFeedback({ message: msg });
    setTimeout(() => setFeedback({ message: null }), 2000);
  };

  const addToBoard = (card) => {
    const title = getVocabTitle(card);
    const newItem = {
      boardId: `board-${Date.now()}`,
      ...card,
      title: title,
      atmosphere: card.related || [],
      x: (window.innerWidth / 2 - boardView.x - 100) / boardView.scale,
      y: (window.innerHeight / 2 - boardView.y - 150) / boardView.scale,
      zIndex: boardItems.length > 0 ? Math.max(...boardItems.map(i => i.zIndex || 0)) + 1 : 1,
      isSelected: false,
      isLibraryItem: true,
      w: 208, h: 340
    };
    saveSnapshot(boardItems);
    setBoardItems([...boardItems, newItem]);
    showFeedback(`已添加 "${title}"`);
  };

  const isMoodboardMode = activeTab === 'moodboard';

  return (
    <div className={`min-h-screen transition-all ${darkMode ? 'bg-black text-zinc-100' : 'bg-white text-zinc-900'} overflow-hidden font-sans select-none`}>
      {feedback.message && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 bg-indigo-500 text-white animate-in slide-in-from-top-4">
          <CheckCircle2 size={18} />
          <span className="text-sm font-black tracking-tight">{feedback.message}</span>
        </div>
      )}

      {/* 侧边栏 */}
      <aside className={`fixed left-0 top-0 h-full border-r ${darkMode ? 'border-zinc-800 bg-black' : 'border-zinc-100 bg-white'} py-8 z-40 flex flex-col transition-all duration-300 w-16 hover:w-60 shadow-2xl group/sidebar overflow-hidden`}>
        <div onClick={() => setActiveTab('discovery')} className="flex items-center w-full mb-12 whitespace-nowrap cursor-pointer">
          <div className="w-16 flex-none flex items-center justify-center"><div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-black text-white">DB</div></div>
          <h1 className="font-bold text-lg tracking-tighter opacity-0 group-hover/sidebar:opacity-100 transition-opacity">DesignByte</h1>
        </div>
        <nav className="space-y-2 w-full">
          <NavItem icon={<Home size={20}/>} label="发现" active={activeTab === 'discovery'} onClick={() => setActiveTab('discovery')} />
          <NavItem icon={<BookOpen size={20}/>} label="设计语汇" active={activeTab === 'vocabulary'} onClick={() => setActiveTab('vocabulary')} />
          <NavItem icon={<Palette size={20}/>} label="情绪白板" active={activeTab === 'moodboard'} onClick={() => setActiveTab('moodboard')} />
        </nav>
        <button onClick={() => setDarkMode(!darkMode)} className="absolute bottom-10 left-0 w-full h-12 flex items-center text-zinc-500 hover:text-indigo-500">
          <div className="w-16 flex-none flex items-center justify-center">{darkMode ? <Sun size={20}/> : <Moon size={20}/>}</div>
          <span className="whitespace-nowrap text-sm font-black opacity-0 group-hover/sidebar:opacity-100">主题切换</span>
        </button>
      </aside>

      <main className={`transition-all duration-300 pl-16 ${isMoodboardMode ? 'h-screen' : 'pt-16 min-h-screen'}`}>
        {isMoodboardMode ? (
          <MoodBoard 
            items={boardItems} setItems={setBoardItems} 
            view={boardView} setView={setBoardView} 
            darkMode={darkMode} onOpenDetail={setSelectedBoardItem}
            saveSnapshot={saveSnapshot} isUserTyping={isUserTyping}
            undo={handleUndo} redo={handleRedo}
            history={history} redoStack={redoStack}
          />
        ) : (
          <div className="p-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
             <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <h2 className="text-3xl font-black tracking-tighter uppercase italic text-indigo-500">{activeTab === 'discovery' ? 'Discovery' : 'Vocabulary'}</h2>
               <div className="max-w-xl relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input type="text" placeholder="搜索语汇或分类..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full py-4 pl-12 pr-6 rounded-3xl text-sm outline-none border-2 transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-transparent focus:bg-white focus:border-indigo-500'}`} />
               </div>
            </header>
            
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {filteredCards.map((card, idx) => (
                <div key={card.id || idx} onClick={() => setSelectedCard(card)} className={`break-inside-avoid group cursor-pointer overflow-hidden rounded-[32px] border-2 transition-all duration-500 ${darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500 shadow-2xl shadow-black' : 'bg-white border-zinc-100 hover:border-indigo-500 shadow-sm'}`}>
                  <div className="aspect-[4/5] overflow-hidden relative bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {card.mainImage ? (
                      <img src={card.mainImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={getVocabTitle(card)} />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-20 text-center px-4">
                        <ImageOff size={40} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Image Source</span>
                      </div>
                    )}
                    <div className="absolute top-5 left-5 px-3 py-1 bg-black/60 backdrop-blur-md text-[9px] font-bold text-white rounded-full uppercase tracking-widest">{card.category1 || "语汇"}</div>
                  </div>
                  <div className="p-6 flex justify-between items-center">
                    <div className="truncate pr-4">
                      <h3 className={`font-black text-xl tracking-tight truncate ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{getVocabTitle(card)}</h3>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">{card.category1 || "未分类"}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); addToBoard(card); }} className={`p-3 rounded-2xl transition-all active:scale-90 ${darkMode ? 'bg-zinc-800 hover:bg-indigo-500 text-white' : 'bg-zinc-50 hover:bg-indigo-500 hover:text-white text-zinc-400'}`}><Copy size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 详情弹窗：包含对比度修复 */}
      {selectedCard && (
        <DetailModal 
          card={selectedCard} 
          title={getVocabTitle(selectedCard)} 
          onClose={() => setSelectedCard(null)} 
          darkMode={darkMode} 
          onAddToBoard={addToBoard} 
        />
      )}
      
      {/* 白板编辑弹窗 */}
      {selectedBoardItem && (
        <WhiteboardDetailModal 
          item={selectedBoardItem} 
          onClose={() => setSelectedBoardItem(null)} 
          onUpdate={(updates) => setBoardItems(prev => prev.map(it => it.boardId === selectedBoardItem.boardId ? {...it, ...updates} : it))} 
          darkMode={darkMode} 
        />
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center transition-all duration-300 h-14 relative group/item ${active ? 'text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
      <div className={`absolute inset-y-1 left-2 right-2 rounded-2xl ${active ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-transparent'}`} />
      <div className="relative w-16 flex-none flex items-center justify-center">{icon}</div>
      <span className="relative whitespace-nowrap text-sm font-black transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100">{label}</span>
    </button>
  );
}

// --- 完整的白板组件（包含右键菜单、撤销/重做、双击生成文字、删除功能） ---
function MoodBoard({ items, setItems, view, setView, darkMode, onOpenDetail, saveSnapshot, isUserTyping, undo, redo, history, redoStack }) {
  const boardRef = useRef(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [internalClipboard, setInternalClipboard] = useState([]);
  const mousePos = useRef({ x: 0, y: 0 });

  const addNewText = (content = "", rawX, rawY) => {
    const rect = boardRef.current.getBoundingClientRect();
    const x = rawX !== undefined ? (rawX - rect.left - view.x) / view.scale : (rect.width / 2 - view.x - 50) / view.scale;
    const y = rawY !== undefined ? (rawY - rect.top - view.y) / view.scale : (rect.height / 2 - view.y - 20) / view.scale;
    const newItem = { boardId: `txt-${Date.now()}`, type: 'text', content: content || "输入文字...", x, y, zIndex: items.length + 1, isSelected: false, w: 150, h: 60 };
    saveSnapshot(items);
    setItems([...items, newItem]);
  };

  const onBoardMouseDown = (e) => {
    setContextMenu(null);
    if (e.button !== 0 && e.button !== 1) return;
    const isPanning = isSpacePressed || e.button === 1;
    if (isPanning) {
      const startX = e.clientX, startY = e.clientY, initialX = view.x, initialY = view.y;
      const move = (mE) => setView(v => ({ ...v, x: initialX + (mE.clientX - startX), y: initialY + (mE.clientY - startY) }));
      const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
      window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    } else if (e.target === boardRef.current) {
      setItems(prev => prev.map(it => ({ ...it, isSelected: false })));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isUserTyping()) return;
      // 删除功能
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        const selected = items.filter(i => i.isSelected);
        if (selected.length > 0) {
          saveSnapshot(items);
          setItems(items.filter(item => !item.isSelected));
        }
      }
      // 撤销/重做支持
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, undo, redo, saveSnapshot, isUserTyping]);

  return (
    <div className="flex h-full relative" onContextMenu={e => e.preventDefault()}>
      <div 
        ref={boardRef} onMouseDown={onBoardMouseDown} 
        onDoubleClick={(e) => { if (e.target === boardRef.current) addNewText("", e.clientX, e.clientY); }}
        onWheel={(e) => {
          e.preventDefault();
          const factor = 1 + (e.deltaY > 0 ? -1 : 1) * 0.15;
          const newScale = Math.min(Math.max(view.scale * factor, 0.15), 5);
          const rect = boardRef.current.getBoundingClientRect();
          const canvasX = (e.clientX - rect.left - view.x) / view.scale, canvasY = (e.clientY - rect.top - view.y) / view.scale;
          setView({ x: Math.round((e.clientX - rect.left) - canvasX * newScale), y: Math.round((e.clientY - rect.top) - canvasY * newScale), scale: newScale });
        }} 
        className={`flex-1 relative overflow-hidden transition-colors ${darkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`} 
        style={{ backgroundImage: darkMode ? 'radial-gradient(#333 1px, transparent 1px)' : 'radial-gradient(#ddd 1px, transparent 1px)', backgroundSize: `${40 * view.scale}px ${40 * view.scale}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`, transformOrigin: '0 0' }}>
          {items.map((item) => (
            <BoardItem 
              key={item.boardId} item={item} darkMode={darkMode} 
              onMove={(id, dx, dy) => setItems(prev => prev.map(i => (i.boardId === id || i.isSelected) ? { ...i, x: i.x + dx / view.scale, y: i.y + dy / view.scale } : i))}
              onSelect={(id, multi) => setItems(prev => {
                const maxZ = Math.max(...prev.map(i => i.zIndex || 0)) + 1;
                return prev.map(it => it.boardId === id ? { ...it, isSelected: multi ? !it.isSelected : true, zIndex: maxZ } : (multi ? it : { ...it, isSelected: false }));
              })}
              onDoubleClick={(id) => { const it = items.find(x => x.boardId === id); if (it.type !== 'text') onOpenDetail(it); }}
              onUpdate={(id, updates) => setItems(prev => prev.map(it => it.boardId === id ? { ...it, ...updates } : it))}
              onContextMenu={(id, x, y) => setContextMenu({ id, x, y })}
            />
          ))}
        </div>
        
        {/* 白板工具栏 */}
        <div className="absolute bottom-10 left-10 flex flex-col gap-2">
          <ControlButton icon={<Undo2 size={18}/>} onClick={undo} darkMode={darkMode} title="撤销 (Ctrl+Z)" disabled={history.length === 0} />
          <ControlButton icon={<Redo2 size={18}/>} onClick={redo} darkMode={darkMode} title="重做 (Ctrl+Y)" disabled={redoStack.length === 0} />
          <div className="h-2" />
          <ControlButton icon={<Plus size={18}/>} onClick={() => addNewText()} darkMode={darkMode} title="添加文本框" />
        </div>
      </div>
      
      {/* 浮动右键菜单 */}
      {contextMenu && (
        <div className={`fixed z-[200] w-48 py-2 rounded-2xl shadow-2xl border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`} style={{ left: contextMenu.x, top: contextMenu.y }}>
          <MenuOption icon={<Type size={16}/>} label="在此添加文本" onClick={() => { addNewText("", contextMenu.x, contextMenu.y); setContextMenu(null); }} darkMode={darkMode} />
          <div className="my-1 border-t dark:border-zinc-800 opacity-50" />
          <MenuOption icon={<Maximize2 size={16}/>} label="置于顶层" onClick={() => { setItems(prev => prev.map(it => it.boardId === contextMenu.id ? {...it, zIndex: Math.max(...prev.map(i=>i.zIndex||0))+1} : it)); setContextMenu(null); }} darkMode={darkMode} />
          <MenuOption icon={<Trash2 size={16}/>} label="删除卡片" onClick={() => { saveSnapshot(items); setItems(prev => prev.filter(it => it.boardId !== contextMenu.id)); setContextMenu(null); }} darkMode={darkMode} danger />
        </div>
      )}

      {/* AI Panel */}
      <div className={`w-80 border-l p-8 flex flex-col ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
        <div className="flex items-center gap-2 mb-8"><Sparkles size={20} className="text-indigo-500" /><h3 className="font-black text-xs uppercase tracking-widest">AI Panel</h3></div>
        <p className="text-xs opacity-40 leading-relaxed italic mb-8">双击空白处生成文字卡片，右键卡片进行置顶或删除操作。</p>
        
        {items.filter(i => i.isSelected).length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">选中卡片分析</h4>
             <div className="flex flex-wrap gap-2">
                {Array.from(new Set(items.filter(i => i.isSelected).flatMap(i => i.related || i.atmosphere || []))).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded text-[10px] font-bold"># {tag}</span>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardItem({ item, darkMode, onMove, onSelect, onDoubleClick, onUpdate, onContextMenu }) {
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
    const handleMouseMove = (e) => { if (isDragging) { onMove(item.boardId, e.clientX - dragRef.current.x, e.clientY - dragRef.current.y); dragRef.current = { x: e.clientX, y: e.clientY }; } };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, item.boardId, onMove]);
  
  return (
    <div 
      style={{ transform: `translate3d(${item.x}px, ${item.y}px, 0)`, zIndex: item.zIndex || 1, position: 'absolute', cursor: isDragging ? 'grabbing' : 'auto', pointerEvents: 'auto' }} 
      onMouseDown={handleMouseDown} onDoubleClick={() => onDoubleClick(item.boardId)} 
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(item.boardId, e.clientX, e.clientY); }}
      className={`transition-[box-shadow,border-color] duration-300 ${item.type === 'text' ? 'w-fit min-w-[120px]' : 'w-52'} rounded-[32px] p-2 border-4 ${item.isSelected ? 'border-indigo-500 ring-8 ring-indigo-500/10' : 'border-transparent'} ${darkMode ? 'bg-zinc-900 shadow-2xl' : 'bg-white shadow-xl'}`}
    >
      <div className="relative flex flex-col items-center">
        {item.type !== 'text' ? (
          <>
            <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-md text-[8px] font-bold text-white rounded uppercase z-10">{item.category1 || "语汇"}</div>
            <div className="aspect-[4/5] w-full bg-zinc-100 dark:bg-zinc-800 rounded-[24px] overflow-hidden flex items-center justify-center">
              {item.mainImage ? <img src={item.mainImage} className="w-full h-full object-cover pointer-events-none" alt="" /> : <ImageOff className="opacity-10" />}
            </div>
            <div className="p-4 w-full"><input value={item.title || ""} onChange={(e) => onUpdate(item.boardId, { title: e.target.value })} onMouseDown={e => e.stopPropagation()} className={`w-full bg-transparent font-black text-lg outline-none text-center truncate ${darkMode ? 'text-white' : 'text-zinc-900'}`} /></div>
          </>
        ) : (
          <div 
            contentEditable 
            suppressContentEditableWarning={true}
            onBlur={(e) => onUpdate(item.boardId, { content: e.target.innerText })} 
            onMouseDown={e => e.stopPropagation()} 
            className={`px-6 py-4 text-xl font-black outline-none text-center min-h-[1.5em] whitespace-pre-wrap break-all ${darkMode ? 'text-white' : 'text-zinc-900'}`}
          >
            {item.content}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailModal({ card, title, onClose, darkMode, onAddToBoard }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
      <div onClick={(e) => e.stopPropagation()} className={`relative w-full max-w-5xl h-[80vh] overflow-hidden rounded-[48px] flex flex-col md:flex-row shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white text-zinc-900'}`}>
        <button className="absolute right-8 top-8 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full z-20" onClick={onClose}><X size={24}/></button>
        <div className="md:w-[60%] bg-zinc-950 flex items-center justify-center overflow-hidden">{card.mainImage ? <img src={card.mainImage} className="max-w-full max-h-full object-contain" alt="" /> : <div className="text-zinc-700 flex flex-col items-center gap-4"><ImageOff size={64} /><span className="font-black uppercase tracking-tighter">No Image Source</span></div>}</div>
        <div className="md:w-[40%] p-12 overflow-y-auto border-l dark:border-zinc-800">
          <span className={`px-4 py-1.5 text-[10px] font-black rounded-lg uppercase mb-6 inline-block tracking-widest ${darkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600'}`}>{card.category1 || "未分类"} · {card.category2 || "默认"}</span>
          <h2 className={`text-4xl font-black tracking-tighter mb-8 leading-[0.9] ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{title}</h2>
          <div className="space-y-6 mb-10">
             <div><h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">语汇描述</h4><p className={`text-sm leading-relaxed text-justify opacity-70 ${darkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{card.description || "暂无描述内容。"}</p></div>
             {card.related && card.related.length > 0 && (<div><h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">关联语汇</h4><div className="flex flex-wrap gap-2">{card.related.map(tag => (<span key={tag} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}># {tag}</span>))}</div></div>)}
          </div>
          <button onClick={() => onAddToBoard(card)} className="w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-xl active:scale-95">加入情绪板</button>
        </div>
      </div>
    </div>
  );
}

function WhiteboardDetailModal({ item, onClose, onUpdate, darkMode }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
      <div onClick={(e) => e.stopPropagation()} className={`relative w-full max-w-6xl h-[85vh] overflow-hidden rounded-[48px] flex flex-col md:flex-row shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white'}`}>
        <button className="absolute right-8 top-8 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full z-20" onClick={onClose}><X size={24}/></button>
        <div className="md:w-[55%] bg-black flex items-center justify-center overflow-hidden">{item.mainImage ? <img src={item.mainImage} className="max-w-full max-h-full object-contain" alt="" /> : <div className="p-20 text-white italic text-3xl font-black leading-relaxed text-center whitespace-pre-wrap">{item.content}</div>}</div>
        <div className="md:w-[45%] p-12 overflow-y-auto border-l dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-6 text-indigo-500 font-black text-[10px] uppercase tracking-widest"><Edit3 size={14}/> 查看详情</div>
          <div className="space-y-10">
            <div><label className="text-[10px] font-black text-zinc-400 mb-2 block uppercase tracking-widest">名称</label><input value={item.title || (item.type === 'text' ? '文本卡片' : '语汇卡片')} onChange={(e) => onUpdate({ title: e.target.value })} className="w-full bg-transparent text-4xl font-black tracking-tighter outline-none border-b border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 pb-2" /></div>
            <div><label className="text-[10px] font-black text-zinc-400 mb-2 block uppercase tracking-widest">描述</label><p className={`text-sm opacity-60 leading-relaxed ${darkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{item.description || item.content || "暂无详情"}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuOption({ icon, label, onClick, darkMode, danger }) {
  return (
    <button onClick={onClick} className={`w-full px-4 py-2.5 flex items-center gap-3 text-xs font-black transition-colors ${danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : darkMode ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white' : 'hover:bg-zinc-50 text-zinc-600 hover:text-black'}`}>
      {icon} <span>{label}</span>
    </button>
  );
}

function ControlButton({ icon, onClick, darkMode, title, disabled }) {
  return (
    <button 
      onClick={onClick} 
      title={title} 
      disabled={disabled}
      className={`p-3 rounded-2xl border transition-all hover:scale-110 shadow-lg disabled:opacity-20 disabled:hover:scale-100 ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-black'}`}
    >
      {icon}
    </button>
  );
}
