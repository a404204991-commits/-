import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, Home, BookOpen, ImageIcon, Palette, Upload, Plus, X, Moon, Sun, 
  Maximize2, Share2, Sparkles, Loader2, Wand2, Trash2, Copy, CheckSquare,
  Type, MousePointer2, ImageOff, ZoomIn, ZoomOut, RotateCcw, Hand, CheckCircle2, AlertCircle, Edit3,
  Undo2, Redo2, ClipboardPaste, ImagePlus
} from 'lucide-react';

const apiKey = ""; 
const GEN_MODEL = "gemini-2.5-flash-preview-09-2025";

const INITIAL_VOCABULARY = [
  {
    id: 'v1',
    type: 'vocabulary',
    title: '先锋主义',
    category: '设计风格',
    description: '突破传统、追求创新与实验性。常见设计手法包括非对称布局、非常规材料运用、抽象化造型及大胆色彩碰撞。',
    atmosphere: ['戏剧张力', '力量感', '理性'],
    morphology: ['咬合穿插', '几何构成'],
    mainImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedBoardItem, setSelectedBoardItem] = useState(null);
  const [vocabularyCards] = useState(INITIAL_VOCABULARY);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState({ message: null, type: 'success' }); 
  
  const [boardItems, setBoardItems] = useState([]); 
  const [boardView, setBoardView] = useState({ x: 0, y: 0, scale: 1 });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const saveSnapshot = useCallback((items) => {
    setHistory(prev => [JSON.parse(JSON.stringify(items)), ...prev].slice(0, 31));
    setRedoStack([]); 
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const previous = history[0];
      setRedoStack(prev => [JSON.parse(JSON.stringify(boardItems)), ...prev].slice(0, 31));
      setBoardItems(previous);
      setHistory(prev => prev.slice(1));
      setFeedback({ message: "已撤销操作", type: "success" });
      setTimeout(() => setFeedback({ message: null }), 1000);
    }
  }, [history, boardItems]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[0];
      setHistory(prev => [JSON.parse(JSON.stringify(boardItems)), ...prev].slice(0, 31));
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
      x: (window.innerWidth / 2 - boardView.x - 100) / boardView.scale,
      y: (window.innerHeight / 2 - boardView.y - 150) / boardView.scale,
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

      <aside className={`fixed left-0 top-0 h-full border-r ${darkMode ? 'border-zinc-800 bg-black' : 'border-zinc-100 bg-white'} py-8 z-40 hidden md:flex flex-col transition-all duration-300 ease-in-out group/sidebar overflow-hidden w-16 hover:w-60 shadow-2xl`}>
        <div onClick={() => setActiveTab('discovery')} className="flex items-center w-full mb-12 whitespace-nowrap cursor-pointer hover:opacity-80 active:scale-95 transition-all">
          <div className="w-16 flex-none flex items-center justify-center"><div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center font-black text-white dark:text-black shadow-lg">ID</div></div>
          <h1 className="font-bold text-lg tracking-tighter transition-all duration-300 opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible">语汇数据库</h1>
        </div>
        <nav className="space-y-2 w-full">
          <NavItem icon={<Home size={20}/>} label="发现" active={activeTab === 'discovery'} onClick={() => setActiveTab('discovery')} />
          <NavItem icon={<BookOpen size={20}/>} label="设计语汇" active={activeTab === 'vocabulary'} onClick={() => setActiveTab('vocabulary')} />
          <NavItem icon={<Palette size={20}/>} label="情绪白板" active={activeTab === 'moodboard'} onClick={() => setActiveTab('moodboard')} />
        </nav>
        <button onClick={() => setDarkMode(!darkMode)} className={`absolute bottom-10 left-0 w-full h-12 flex items-center transition-all duration-300 ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>
          <div className="w-16 flex-none flex items-center justify-center">{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</div>
          <span className="whitespace-nowrap text-sm font-black transition-all duration-300 opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible">深色模式</span>
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
               <h2 className="text-3xl font-black tracking-tighter uppercase italic text-indigo-500">{activeTab === 'discovery' ? '今日发现' : '语汇库检索'}</h2>
               <div className="max-w-xl relative w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /><input type="text" placeholder="搜索风格、材质或氛围..." className={`w-full py-4 pl-12 pr-6 rounded-3xl text-sm outline-none border-2 transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-transparent focus:bg-white focus:border-black'}`} /></div>
            </header>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {vocabularyCards.map(card => (
                <div key={card.id} onClick={() => setSelectedCard(card)} className={`break-inside-avoid group cursor-pointer overflow-hidden rounded-[32px] border-2 transition-all duration-500 ${darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500 shadow-2xl shadow-black' : 'bg-white border-zinc-100 hover:border-black shadow-sm'}`}>
                  <div className="aspect-[4/5] overflow-hidden relative bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center"><img src={card.mainImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" /><div className="absolute top-5 left-5 px-3 py-1 bg-black/60 backdrop-blur-md text-[9px] font-bold text-white rounded-full uppercase tracking-widest">{card.category}</div></div>
                  <div className="p-6 flex justify-between items-center"><h3 className="font-black text-xl tracking-tight truncate">{card.title}</h3><button onClick={(e) => { e.stopPropagation(); addToBoard(card); }} className="p-3 hover:bg-indigo-500 hover:text-white dark:bg-zinc-800 rounded-2xl transition-all"><Copy size={18} /></button></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {selectedCard && <DetailModal card={selectedCard} onClose={() => setSelectedCard(null)} darkMode={darkMode} onAddToBoard={addToBoard} />}
      {selectedBoardItem && <WhiteboardDetailModal item={selectedBoardItem} onClose={() => { saveSnapshot(boardItems); setSelectedBoardItem(null); }} onUpdate={(updates) => setBoardItems(prev => prev.map(it => it.boardId === selectedBoardItem.boardId ? {...it, ...updates} : it))} darkMode={darkMode} />}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center transition-all duration-300 h-14 relative overflow-hidden group/item ${active ? 'text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
      <div className={`absolute inset-y-1 left-2 right-2 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-transparent'}`} />
      <div className="relative w-16 flex-none flex items-center justify-center">{icon}</div>
      <span className="relative whitespace-nowrap text-sm font-black transition-all duration-300 opacity-0 invisible group-hover/sidebar:opacity-100 group-hover/sidebar:visible">{label}</span>
    </button>
  );
}

function MoodBoard({ items, setItems, view, setView, darkMode, setIsAiAnalyzing, onOpenDetail, undo, redo, saveSnapshot, history, redoStack }) {
  const [selectionBox, setSelectionBox] = useState(null); 
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [internalClipboard, setInternalClipboard] = useState([]);
  const boardRef = useRef(null);
  const fileInputRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  const isUserTyping = () => {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  };

  // 快捷键系统
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
      if (ctrlKey && e.key === 'c') {
        const selected = items.filter(i => i.isSelected);
        if (selected.length > 0) setInternalClipboard(JSON.parse(JSON.stringify(selected)));
      }
    };
    const handlePaste = (e) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;
      for (let item of clipboardItems) {
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => addNewImage(event.target.result, mousePos.current.x, mousePos.current.y);
          reader.readAsDataURL(blob);
        } else if (item.type.indexOf("plain") !== -1) {
          item.getAsString((text) => {
            if (text.startsWith("http")) addNewImage(text, mousePos.current.x, mousePos.current.y);
            else addNewText(text, mousePos.current.x, mousePos.current.y);
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('paste', handlePaste); };
  }, [items, undo, redo, saveSnapshot, setItems]);

  const addNewImage = (src, rawX, rawY) => {
    const rect = boardRef.current.getBoundingClientRect();
    const x = (rawX - rect.left - view.x) / view.scale;
    const y = (rawY - rect.top - view.y) / view.scale;
    const maxZ = Math.max(0, ...items.map(i => i.zIndex || 0));
    const newItem = { boardId: `img-${Date.now()}`, type: 'vocabulary', title: '粘贴的图片', category: '自定义', mainImage: src, atmosphere: [], morphology: [], x, y, zIndex: maxZ + 1, isSelected: false, w: 208, h: 340 };
    saveSnapshot(items);
    setItems([...items, newItem]);
  };

  const addNewText = (content = "", rawX, rawY) => {
    const rect = boardRef.current.getBoundingClientRect();
    const x = rawX !== undefined ? (rawX - rect.left - view.x) / view.scale : (rect.width / 2 - view.x - 50) / view.scale;
    const y = rawY !== undefined ? (rawY - rect.top - view.y) / view.scale : (rect.height / 2 - view.y - 20) / view.scale;
    const maxZ = Math.max(0, ...items.map(i => i.zIndex || 0));
    const newItem = { boardId: `txt-${Date.now()}`, id: `custom-txt-${Date.now()}`, type: 'text', content, x, y, zIndex: maxZ + 1, isSelected: false, isFresh: true, w: 100, h: 40 };
    saveSnapshot(items);
    setItems([...items, newItem]);
  };

  useEffect(() => {
    const down = (e) => {
      if (isUserTyping()) return;
      if (e.code === 'Space') { e.preventDefault(); setIsSpacePressed(true); }
    };
    const up = (e) => { if (e.code === 'Space') setIsSpacePressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const onBoardMouseDown = (e) => {
    setContextMenu(null);
    if (e.button !== 0 && e.button !== 1) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const isPanning = isSpacePressed || e.button === 1;
    const startX = e.clientX;
    const startY = e.clientY;

    if (isPanning) {
      e.preventDefault();
      const initialViewX = view.x;
      const initialViewY = view.y;
      const onMouseMove = (mE) => setView(prev => ({ ...prev, x: Math.round(initialViewX + (mE.clientX - startX)), y: Math.round(initialViewY + (mE.clientY - startY)) }));
      const onMouseUp = () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else if (e.target === boardRef.current) {
      if (!e.shiftKey) setItems(prev => prev.map(it => ({ ...it, isSelected: false })));
      const rect = boardRef.current.getBoundingClientRect();
      const canvasStartX = (startX - rect.left - view.x) / view.scale;
      const canvasStartY = (startY - rect.top - view.y) / view.scale;
      setSelectionBox({ x: canvasStartX, y: canvasStartY, w: 0, h: 0 });
      const onMouseMove = (mE) => {
        const curX = (mE.clientX - rect.left - view.x) / view.scale;
        const curY = (mE.clientY - rect.top - view.y) / view.scale;
        const box = { x: Math.min(canvasStartX, curX), y: Math.min(canvasStartY, curY), w: Math.abs(curX - canvasStartX), h: Math.abs(curY - canvasStartY) };
        setSelectionBox(box);
        setItems(prev => {
          const maxZ = Math.max(0, ...prev.map(i => i.zIndex || 0));
          let nextMaxZ = maxZ;
          return prev.map(item => {
            const itemW = item.w || 100;
            const itemH = item.h || 40;
            const isOverlapping = !(item.x + itemW < box.x || item.x > box.x + box.w || item.y + itemH < box.y || item.y > box.y + box.h);
            // 关键优化：框选中的那一刻也更新 zIndex，让选中的跑上面
            if (isOverlapping && !item.isSelected) {
              nextMaxZ++;
              return { ...item, isSelected: true, zIndex: nextMaxZ };
            }
            return { ...item, isSelected: isOverlapping };
          });
        });
      };
      const onMouseUp = () => { setSelectionBox(null); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  };

  return (
    <div className="flex h-full relative" onMouseMove={(e) => mousePos.current = { x: e.clientX, y: e.clientY }} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}>
      <div 
        ref={boardRef} onMouseDown={onBoardMouseDown} 
        onDoubleClick={(e) => { if (e.target === boardRef.current) addNewText("", e.clientX, e.clientY); }}
        onWheel={(e) => {
          e.preventDefault();
          const factor = 1 + (e.deltaY > 0 ? -1 : 1) * 0.15;
          const newScale = Math.min(Math.max(view.scale * factor, 0.15), 5);
          const rect = boardRef.current.getBoundingClientRect();
          const canvasX = (e.clientX - rect.left - view.x) / view.scale;
          const canvasY = (e.clientY - rect.top - view.y) / view.scale;
          setView({ x: Math.round((e.clientX - rect.left) - canvasX * newScale), y: Math.round((e.clientY - rect.top) - canvasY * newScale), scale: newScale });
        }} 
        className={`flex-1 relative overflow-hidden transition-colors ${darkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`} 
        style={{ backgroundImage: darkMode ? 'radial-gradient(#333 1px, transparent 1px)' : 'radial-gradient(#ddd 1px, transparent 1px)', backgroundSize: `${40 * view.scale}px ${40 * view.scale}px`, backgroundPosition: `${view.x}px ${view.y}px`, cursor: isSpacePressed ? 'grab' : 'auto' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`, transformOrigin: '0 0', backfaceVisibility: 'hidden' }}>
          {items.map((item) => (
            <BoardItem 
              key={item.boardId} item={item} darkMode={darkMode} 
              onMove={(id, dx, dy) => setItems(prev => prev.map(i => (i.boardId === id || i.isSelected) ? { ...i, x: Math.round(i.x + dx / view.scale), y: Math.round(i.y + dy / view.scale) } : i))}
              onMoveEnd={() => saveSnapshot(items)}
              onSelect={(id, multi) => {
                setItems(prev => {
                  const maxZ = Math.max(0, ...prev.map(i => i.zIndex || 0));
                  return prev.map(it => {
                    if (it.boardId === id) {
                      const isNowSelected = multi ? !it.isSelected : true;
                      // 关键修复：点击选中的那一刻，更新 zIndex 至最高
                      return { ...it, isSelected: isNowSelected, zIndex: isNowSelected ? maxZ + 1 : it.zIndex };
                    }
                    return multi ? it : { ...it, isSelected: false };
                  });
                });
              }}
              onDoubleClick={(id) => { 
                const it = items.find(x => x.boardId === id); 
                if (it.type !== 'text') onOpenDetail(it); 
              }}
              onTitleChange={(id, val) => setItems(prev => prev.map(it => it.boardId === id ? { ...it, title: val } : it))}
              onTextChange={(id, val) => {
                if (items.find(x => x.boardId === id)?.type === 'text' && !val.trim()) {
                  saveSnapshot(items); setItems(prev => prev.filter(it => it.boardId !== id));
                } else {
                  setItems(prev => prev.map(it => it.boardId === id ? { ...it, content: val, isFresh: false } : it));
                }
              }}
              onSizeUpdate={(id, w, h) => setItems(prev => prev.map(it => it.boardId === id ? { ...it, w, h } : it))}
            />
          ))}
          {selectionBox && <div className="absolute border-2 border-indigo-500 bg-indigo-500/10 z-[1000]" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />}
        </div>
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3 pointer-events-none"><div className={`px-4 py-2 rounded-full border text-[10px] font-black tracking-widest ${darkMode ? 'bg-black border-zinc-800 text-indigo-400' : 'bg-white border-zinc-100 shadow-md text-indigo-600'}`}>{Math.round(view.scale * 100)}%</div></div>
        <div className="absolute bottom-10 left-10 flex flex-col gap-2 z-30 transition-transform duration-300">
          <ControlButton icon={<Plus size={18}/>} onClick={() => addNewText()} darkMode={darkMode} title="添加文本框" />
          <ControlButton icon={<ZoomIn size={18}/>} onClick={() => setView(v => ({ ...v, scale: Math.min(v.scale * 1.2, 5) }))} darkMode={darkMode} />
          <ControlButton icon={<ZoomOut size={18}/>} onClick={() => setView(v => ({ ...v, scale: Math.max(v.scale / 1.2, 0.15) }))} darkMode={darkMode} />
          <ControlButton icon={<RotateCcw size={18}/>} onClick={() => setView({ x: 0, y: 0, scale: 1 })} darkMode={darkMode} />
        </div>
      </div>

      {contextMenu && (
        <div className={`fixed z-[200] w-52 py-2 rounded-2xl shadow-2xl border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`} style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
          <MenuOption icon={<ImagePlus size={16}/>} label="添加图片" onClick={() => { fileInputRef.current.click(); setContextMenu(null); }} darkMode={darkMode} />
          <MenuOption icon={<Type size={16}/>} label="添加文本框" onClick={() => { addNewText("", contextMenu.x, contextMenu.y); setContextMenu(null); }} darkMode={darkMode} />
          <div className="my-1 border-t dark:border-zinc-800 opacity-50" />
          <MenuOption icon={<Undo2 size={16}/>} label="撤销操作 (Ctrl+Z)" onClick={() => { undo(); setContextMenu(null); }} darkMode={darkMode} disabled={history.length === 0} />
          <MenuOption icon={<Redo2 size={16}/>} label="还原操作 (Ctrl+Y)" onClick={() => { redo(); setContextMenu(null); }} darkMode={darkMode} disabled={redoStack.length === 0} />
          <div className="my-1 border-t dark:border-zinc-800 opacity-50" />
          <MenuOption icon={<Copy size={16}/>} label="复制项" onClick={() => { const sel = items.filter(i => i.isSelected); if(sel.length > 0) setInternalClipboard(JSON.parse(JSON.stringify(sel))); setContextMenu(null); }} darkMode={darkMode} />
          <MenuOption icon={<ClipboardPaste size={16}/>} label="在此粘贴" onClick={() => { 
            if(internalClipboard.length > 0) {
              const rect = boardRef.current.getBoundingClientRect();
              const maxZ = Math.max(0, ...items.map(i => i.zIndex || 0));
              const pasted = internalClipboard.map((it, idx) => ({ ...it, boardId: `pst-${Date.now()}-${idx}`, x: (contextMenu.x - rect.left - view.x)/view.scale + idx*20, y: (contextMenu.y - rect.top - view.y)/view.scale + idx*20, isSelected: true, zIndex: maxZ + idx + 1 }));
              saveSnapshot(items); setItems(items.map(i => ({...i, isSelected: false})).concat(pasted));
            }
            setContextMenu(null);
          }} darkMode={darkMode} disabled={internalClipboard.length === 0} />
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = (ev) => addNewImage(ev.target.result, mousePos.current.x, mousePos.current.y); r.readAsDataURL(f); } }} />

      <div className={`w-80 border-l p-8 flex flex-col ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} select-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8"><div className="flex items-center gap-2"><Sparkles size={20} className="text-indigo-500" /><h3 className="font-black text-xs uppercase tracking-widest">AI 语汇编排</h3></div><button onClick={() => setItems(items.map(i => ({...i, isSelected: true})))} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><CheckSquare size={18} /></button></div>
        <div className="flex-1 overflow-y-auto">
          <section className="mb-10"><h4 className="text-[10px] font-black text-zinc-400 mb-4 uppercase tracking-widest">聚合语汇</h4><div className="flex flex-wrap gap-2">{[...new Set(items.filter(i => i.isSelected).flatMap(i => [...(i.atmosphere || []), ...(i.morphology || [])]))].length > 0 ? [...new Set(items.filter(i => i.isSelected).flatMap(i => [...(i.atmosphere || []), ...(i.morphology || [])]))].map(tag => <span key={tag} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${darkMode ? 'border-zinc-800 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50'}`}>{tag}</span>) : <p className="text-[10px] opacity-30 italic text-center w-full px-4">框选卡片以生成语汇...</p>}</div></section>
          <section><h4 className="text-[10px] font-black text-zinc-400 mb-4 uppercase tracking-widest">AI 提示词</h4><div className={`p-5 rounded-[24px] border-2 border-dashed min-h-[140px] text-[11px] leading-relaxed italic ${darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>{items.some(i => i.isSelected) ? `室内写实摄影, ${[...new Set(items.filter(i => i.isSelected).flatMap(i => [...(i.atmosphere || []), ...(i.morphology || [])]))].join(', ')}...` : "指令预览..."}</div>{items.some(i => i.isSelected) && <button className="w-full mt-6 py-4 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"><Wand2 size={16}/> 生成空间草图</button>}</section>
        </div>
      </div>
    </div>
  );
}

function BoardItem({ item, darkMode, onMove, onMoveEnd, onSelect, onDoubleClick, onTitleChange, onTextChange, onSizeUpdate }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const editableRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) onSizeUpdate(item.boardId, containerRef.current.offsetWidth, containerRef.current.offsetHeight);
  }, [item.content, item.title, item.type, item.isSelected]);

  useEffect(() => {
    if (item.type === 'text' && item.isFresh && editableRef.current) editableRef.current.focus();
  }, [item.type, item.isFresh]);

  const handleMouseDown = (e) => { 
    if (e.button !== 0) return; 
    onSelect(item.boardId, e.shiftKey || e.ctrlKey || e.metaKey); 
    setIsDragging(true); 
    dragRef.current = { x: e.clientX, y: e.clientY }; 
    e.stopPropagation(); 
  };

  useEffect(() => {
    const handleMouseMove = (e) => { if (!isDragging) return; onMove(item.boardId, e.clientX - dragRef.current.x, e.clientY - dragRef.current.y); dragRef.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseUp = () => { if(isDragging) onMoveEnd(); setIsDragging(false); };
    if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, onMove, onMoveEnd, item.boardId]);
  
  const outerStyle = { 
    transform: `translate(${item.x}px, ${item.y}px)`, 
    zIndex: item.zIndex + (isDragging ? 1000 : 0), 
    position: 'absolute', 
    cursor: isDragging ? 'grabbing' : 'grab', 
    pointerEvents: 'auto', 
    willChange: isDragging ? 'transform' : 'auto' 
  };
  
  return (
    <div ref={containerRef} style={outerStyle} onMouseDown={handleMouseDown} onDoubleClick={() => onDoubleClick(item.boardId)}>
      <div 
        className={`transition-all duration-300 transform-gpu ${item.type === 'text' ? 'w-fit' : 'w-52'} rounded-[32px] p-2 border-4 ${
          item.isSelected 
            ? 'border-indigo-500 ring-8 ring-indigo-500/10 scale-105 shadow-2xl' 
            : 'border-transparent shadow-xl'
        } ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}
      >
        <div className="relative group flex flex-col items-center">
          {item.type !== 'text' && (
            <>
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-md text-[8px] font-bold text-white rounded uppercase tracking-tighter z-10">{item.category || '自定义'}</div>
              <div className="aspect-[4/5] w-full bg-zinc-100 dark:bg-zinc-800 rounded-[24px] overflow-hidden relative flex items-center justify-center">
                {item.mainImage ? <img src={item.mainImage} className="w-full h-full object-cover pointer-events-none" alt="" /> : <ImageOff className="opacity-10" />}
              </div>
            </>
          )}
          <div className={`flex flex-col justify-center items-center w-full ${item.type === 'text' ? 'p-1' : 'p-4'}`}>
            {item.type === 'text' ? (
              <div 
                ref={editableRef} contentEditable onBlur={(e) => onTextChange(item.boardId, e.target.innerText)}
                onMouseDown={(e) => e.stopPropagation()}
                className="bg-transparent text-xl font-black italic leading-tight outline-none border-none select-text p-1 min-w-[5em] text-center whitespace-pre-wrap break-all cursor-text"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            ) : (
              <div className="flex flex-col gap-1 w-full text-center">
                <input value={item.title} onChange={(e) => onTitleChange(item.boardId, e.target.value)} onMouseDown={e => e.stopPropagation()} className="w-full bg-transparent font-black text-xl outline-none border-b border-transparent focus:border-indigo-500/30 truncate select-text text-center" placeholder="名称" />
                {!item.isAiAnalyzed && <div className="text-[8px] text-indigo-500 font-bold tracking-widest uppercase animate-pulse">待分析</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ card, onClose, darkMode, onAddToBoard }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
      <div onClick={(e) => e.stopPropagation()} className={`relative w-full max-w-5xl h-[80vh] overflow-hidden rounded-[48px] flex flex-col md:flex-row shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}>
        <button className="absolute right-8 top-8 p-3 hover:bg-black/10 rounded-full z-20" onClick={onClose}><X size={24}/></button>
        <div className="md:w-[60%] bg-black flex items-center justify-center overflow-hidden"><img src={card.mainImage} className="max-w-full max-h-full object-contain" alt="" /></div>
        <div className="md:w-[40%] p-12 overflow-y-auto">
          <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black rounded-lg uppercase mb-4 inline-block">{card.category}</span>
          <h2 className="text-4xl font-black tracking-tighter mb-8 leading-[0.9]">{card.title}</h2>
          <p className="text-sm opacity-60 leading-relaxed mb-10 text-justify whitespace-pre-wrap">{card.description}</p>
          <button onClick={() => onAddToBoard(card)} className="w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity">加入情绪板</button>
        </div>
      </div>
    </div>
  );
}

function WhiteboardDetailModal({ item, onClose, onUpdate, darkMode }) {
  const [newTag, setNewTag] = useState('');
  const addTag = (type) => { if (!newTag.trim()) return; const currentTags = item[type] || []; if (!currentTags.includes(newTag)) onUpdate({ [type]: [...currentTags, newTag] }); setNewTag(''); };
  return (
    <div onClick={onClose} className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
      <div onClick={(e) => e.stopPropagation()} className={`relative w-full max-w-6xl h-[85vh] overflow-hidden rounded-[48px] flex flex-col md:flex-row shadow-2xl ${darkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`}>
        <button className="absolute right-8 top-8 p-3 hover:bg-black/10 rounded-full z-20" onClick={onClose}><X size={24}/></button>
        <div className="md:w-[55%] bg-black flex items-center justify-center overflow-hidden">{item.type === 'text' ? <div className="p-20 text-white italic text-3xl font-black leading-relaxed text-center whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: item.content }} /> : <img src={item.mainImage} className="max-w-full max-h-full object-contain" alt="" />}</div>
        <div className="md:w-[45%] p-12 overflow-y-auto border-l dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-6 text-indigo-500 font-black text-[10px] uppercase tracking-widest"><Edit3 size={14}/> {item.isLibraryItem ? '查看详情' : '编辑卡片'}</div>
          <div className="space-y-10">
            <div><label className="text-[10px] font-black text-zinc-400 mb-2 block uppercase">名称</label><input disabled={item.isLibraryItem} value={item.title} onChange={(e) => onUpdate({ title: e.target.value })} className="w-full bg-transparent text-4xl font-black tracking-tighter outline-none border-b border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 pb-2 disabled:border-transparent" /></div>
            <div><label className="text-[10px] font-black text-zinc-400 mb-2 block uppercase">灵感说明</label><textarea disabled={item.isLibraryItem} value={item.description || item.content || ''} onChange={(e) => onUpdate(item.type === 'text' ? { content: e.target.value } : { description: e.target.value })} className="w-full bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl text-sm min-h-[100px] outline-none border-none resize-none disabled:opacity-60" /></div>
            <div>
              <label className="text-[10px] font-black text-zinc-400 mb-3 block uppercase">氛围</label>
              <div className="flex flex-wrap gap-2 mb-3">{item.atmosphere?.map(tag => ( <span key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-[10px] font-black">{tag} {!item.isLibraryItem && <X size={10} className="cursor-pointer" onClick={() => onUpdate({ atmosphere: item.atmosphere.filter(t => t !== tag) })} />}</span>))}</div>
              {!item.isLibraryItem && <div className="flex gap-2"><input placeholder="添加..." className="flex-1 bg-transparent border-b text-xs py-1 outline-none focus:border-indigo-500" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag('atmosphere')} /><button onClick={() => addTag('atmosphere')} className="p-1 hover:bg-zinc-100 rounded"><Plus size={16}/></button></div>}
            </div>
            <div>
              <label className="text-[10px] font-black text-zinc-400 mb-3 block uppercase">特征</label>
              <div className="flex flex-wrap gap-2 mb-3">{item.morphology?.map(tag => ( <span key={tag} className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] font-black">{tag} {!item.isLibraryItem && <X size={10} className="cursor-pointer" onClick={() => onUpdate({ morphology: item.morphology.filter(t => t !== tag) })} />}</span>))}</div>
              {!item.isLibraryItem && <div className="flex gap-2"><input placeholder="添加..." className="flex-1 bg-transparent border-b text-xs py-1 outline-none focus:border-indigo-500" onKeyDown={(e) => { if (e.key === 'Enter') { const v = e.target.value; if(v) { onUpdate({ morphology: [...(item.morphology || []), v] }); e.target.value = ''; } } }} /></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuOption({ icon, label, onClick, darkMode, disabled }) {
  return <button disabled={disabled} onClick={onClick} className={`w-full px-4 py-2.5 flex items-center gap-3 text-xs font-black transition-colors ${disabled ? 'opacity-30 cursor-not-allowed' : darkMode ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white' : 'hover:bg-zinc-50 text-zinc-600 hover:text-black'}`}>{icon} <span>{label}</span></button>;
}

function ControlButton({ icon, onClick, darkMode, title }) {
  return <button onClick={onClick} title={title} className={`p-3 rounded-2xl border transition-all hover:scale-110 shadow-lg ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-black'}`}>{icon}</button>;
}
