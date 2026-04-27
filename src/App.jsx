import React, { useState, useEffect } from 'react';
import { 
  Search, Home, BookOpen, ImageIcon, Palette, Upload, Plus, X, Moon, Sun, 
  Maximize2, Share2, Sparkles, Loader2, Wand2, Trash2, Copy, CheckSquare,
  Type, MousePointer2, ImageOff, ZoomIn, ZoomOut, RotateCcw, Hand, CheckCircle2, AlertCircle, Edit3,
  Undo2, Redo2, ClipboardPaste, ImagePlus
} from 'lucide-react';

// --- 健壮的本地 CSV 解析器 ---
const parseCSV = (str) => {
  const arr = [];
  let quote = false;
  let row = 0;
  let col = 0;
  for (let c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c+1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';
    if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
    if (cc === '"') { quote = !quote; continue; }
    if (cc === ',' && !quote) { ++col; continue; }
    if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
    if (cc === '\n' && !quote) { ++row; col = 0; continue; }
    if (cc === '\r' && !quote) { ++row; col = 0; continue; }
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

// --- 卡片详情弹窗组件 ---
const DetailModal = ({ card, onClose, darkMode }) => {
  if (!card) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl transition-all ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`} 
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white z-10 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col md:flex-row min-h-[60vh]">
          {/* 左侧：主图展示区 */}
          <div className="w-full md:w-[45%] lg:w-1/2 aspect-square md:aspect-auto bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center relative border-r border-zinc-200 dark:border-zinc-800">
            {card.mainImage ? (
              <img src={card.mainImage} alt={card.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-zinc-400 dark:text-zinc-600">
                <ImageOff size={64} className="mb-4 opacity-50" />
                <span className="text-sm font-medium tracking-widest uppercase">暂无图片</span>
              </div>
            )}
          </div>
          
          {/* 右侧：信息与图谱区 */}
          <div className="w-full md:w-[55%] lg:w-1/2 p-8 lg:p-12 flex flex-col">
            {/* 顶部分类面包屑 */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-full text-xs font-bold tracking-wider uppercase border border-zinc-200 dark:border-zinc-700">
                {card.category1}
              </span>
              {card.category2 && (
                <span className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-medium tracking-wider uppercase border border-zinc-200 dark:border-zinc-700/50">
                  {card.category2}
                </span>
              )}
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">{card.title}</h2>
            
            <div className="prose prose-zinc dark:prose-invert max-w-none mb-10">
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-base md:text-lg">
                {card.description}
              </p>
            </div>

            {/* 关联图谱区 */}
            <div className="mt-auto space-y-8">
              {/* 关联语汇（正向） */}
              {card.relatedTerms && card.relatedTerms.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4 flex items-center">
                    <BookOpen size={16} className="mr-2 opacity-50" />
                    关联语汇
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {card.relatedTerms.map((term, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer transition-colors"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 关联语汇（反向） */}
              {card.relatedTermsReverse && card.relatedTermsReverse.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4 flex items-center">
                    <BookOpen size={16} className="mr-2 opacity-50" />
                    反向关联语汇（被关联）
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {card.relatedTermsReverse.map((term, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-500 cursor-pointer transition-colors"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 主程序入口 ---
export default function App() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  
  const [vocabularyCards, setVocabularyCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 白板的简易状态替代（保证逻辑不崩溃）
  const [boardItems, setBoardItems] = useState([]);

  // 从 public/vocabulary.csv 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 使用相对根目录的地址，避免在 Blob 预览环境下的 "Failed to parse URL" 错误
        let fetchUrl = '/vocabulary.csv';
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) {
          fetchUrl = import.meta.env.BASE_URL + 'vocabulary.csv';
          fetchUrl = fetchUrl.replace('//', '/');
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`HTTP 状态异常: ${response.status}`);
        }
        const csvText = await response.text();
        
        // 解析与清洗数据
        const parsedData = parseCSV(csvText);
        const formattedCards = parsedData.map((item, idx) => {
          // 处理正向关联
          const rawRelated = item['关联语汇'] || '';
          const relatedTermsArray = rawRelated.split(',').map(s => s.trim()).filter(Boolean);

          // 处理反向关联
          const rawRelatedReverse = item['关联语汇（反向）'] || '';
          const relatedTermsReverseArray = rawRelatedReverse.split(',').map(s => s.trim()).filter(Boolean);

          return {
            id: `voc_${idx}`,
            title: item['语汇'] || '未命名',
            category1: item['一级分类'] || '未分类',
            category2: item['二级分类'] || '',
            description: item['描述'] || '暂无描述信息...',
            relatedTerms: relatedTermsArray,
            relatedTermsReverse: relatedTermsReverseArray,
            mainImage: item['主图'] || ''
          };
        });
        
        setVocabularyCards(formattedCards);
      } catch (error) {
        // 将 error 作为警告打印，不阻断程序，同时提供备用的演示数据以供预览环境测试
        console.warn("未检测到本地 CSV 文件或处于预览环境，已加载默认演示数据。", error.message);
        
        setVocabularyCards([
          {
            id: 'demo_1',
            title: '海派风格',
            category1: '设计风格',
            category2: '基础风格',
            description: '海派风格是融合上海本地文化与中西元素的室内设计风格。常见设计手法包括采用Art Deco几何线条、石库门建筑元素，搭配红木、大理石等材质，融合传统屏风与现代家具；空间氛围感受为典雅精致，兼具怀旧韵味与时尚气息。',
            relatedTerms: ['石库门', '老虎窗', '马赛克拼花', '红木家具', '几何线条'],
            relatedTermsReverse: [],
            mainImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'demo_2',
            title: '天然肌理',
            category1: '材质',
            category2: '',
            description: '天然肌理材质能营造出自然、质朴、富有亲和力的空间氛围，让人在室内感受到与自然的连接和返璞归真的宁静。',
            relatedTerms: ['微水泥', '原木', '棉麻'],
            relatedTermsReverse: ['侘寂风格', '自然主义'],
            mainImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'demo_3',
            title: '金属构件',
            category1: '材质',
            category2: '表现形式',
            description: '金属构件在室内设计中通常能营造出工业风的硬朗与理性，或是现代简约的利落与精致，同时也可通过不同的表面处理和搭配，带来复古或科技感的空间氛围。',
            relatedTerms: ['黄铜', '不锈钢', '拉丝工艺'],
            relatedTermsReverse: ['先锋主义', '工业风'],
            mainImage: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'demo_4',
            title: '浅原木色',
            category1: '材质',
            category2: '色彩',
            description: '浅原木色材质在室内设计中通常能营造出自然、温馨、质朴且带有一丝清新感的空间氛围，给人舒适放松、贴近自然的心理感受。',
            relatedTerms: ['日式风格', '北欧风', '木饰面'],
            relatedTermsReverse: [],
            mainImage: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addToBoard = (card) => {
    // 简单的添加到白板逻辑
    setBoardItems([...boardItems, { ...card, uid: Date.now(), x: 100 + (boardItems.length * 20), y: 100 + (boardItems.length * 20) }]);
    setActiveTab('whiteboard');
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${darkMode ? 'dark bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* 侧边导航栏 */}
      <aside className={`w-20 md:w-64 flex flex-col justify-between border-r shrink-0 transition-colors z-40 ${darkMode ? 'border-zinc-900 bg-zinc-950' : 'border-zinc-200 bg-white'}`}>
        <div>
          <div className="h-20 flex items-center justify-center md:justify-start md:px-8 border-b border-zinc-100 dark:border-zinc-900">
            <div className="w-10 h-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl flex items-center justify-center font-black text-xl tracking-tighter">
              V
            </div>
            <span className="ml-4 font-bold text-lg hidden md:block tracking-wide">语汇图谱</span>
          </div>
          
          <nav className="p-4 space-y-2 mt-4">
            <button 
              onClick={() => setActiveTab('discovery')}
              className={`w-full flex items-center justify-center md:justify-start px-4 py-4 md:py-3 rounded-2xl transition-all font-medium ${activeTab === 'discovery' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
            >
              <Search size={20} className={activeTab === 'discovery' ? 'opacity-100' : 'opacity-70'} />
              <span className="ml-3 hidden md:block">发现语汇</span>
            </button>
            <button 
              onClick={() => setActiveTab('whiteboard')}
              className={`w-full flex items-center justify-center md:justify-start px-4 py-4 md:py-3 rounded-2xl transition-all font-medium ${activeTab === 'whiteboard' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
            >
              <Palette size={20} className={activeTab === 'whiteboard' ? 'opacity-100' : 'opacity-70'} />
              <span className="ml-3 hidden md:block">设计白板</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-900">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-center md:justify-start px-4 py-4 md:py-3 rounded-2xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all font-medium"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="ml-3 hidden md:block">{darkMode ? '浅色模式' : '深色模式'}</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 h-screen overflow-y-auto relative">
        {activeTab === 'discovery' && (
          <div className="p-6 md:p-10 max-w-[1600px] mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">空间语汇库</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg">探索、重组并构建您的室内设计视觉语言系统。</p>
              </div>
              <div className="flex gap-4">
                <div className={`flex items-center px-4 py-3 rounded-2xl border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-sm min-w-[250px]`}>
                  <Search size={18} className="text-zinc-400 mr-3" />
                  <input 
                    type="text" 
                    placeholder="搜索语汇、分类或描述..." 
                    className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder-zinc-400"
                  />
                </div>
              </div>
            </header>

            {isLoading ? (
              <div className="h-[50vh] flex flex-col items-center justify-center text-zinc-400">
                <Loader2 size={40} className="animate-spin mb-4 text-zinc-300 dark:text-zinc-700" />
                <p className="font-medium animate-pulse">正在加载数据库...</p>
              </div>
            ) : (
              /* 瀑布流布局引擎 */
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {vocabularyCards.map(card => (
                  <div 
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`break-inside-avoid group cursor-pointer overflow-hidden rounded-[32px] border-2 transition-all duration-500 flex flex-col ${darkMode ? 'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-900 shadow-2xl shadow-black/50' : 'bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-xl shadow-sm'}`}
                  >
                    {/* 封面图区域 */}
                    <div className="aspect-[4/3] sm:aspect-[4/5] overflow-hidden relative bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center shrink-0">
                      {card.mainImage ? (
                        <img src={card.mainImage} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      ) : (
                        <ImageOff className="text-zinc-300 dark:text-zinc-700" size={32} />
                      )}
                      
                      {/* 多重分类标签 */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 items-start z-10">
                        <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold rounded-full border border-white/20 shadow-sm uppercase tracking-wider">
                          {card.category1}
                        </span>
                        {card.category2 && (
                          <span className="px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md text-zinc-900 dark:text-zinc-100 text-[10px] font-semibold rounded-full border border-white/40 dark:border-zinc-700/50 shadow-sm uppercase">
                            {card.category2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 卡片文本内容区 */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <h3 className="font-black text-xl tracking-tight leading-tight text-zinc-900 dark:text-zinc-100">{card.title}</h3>
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToBoard(card); }} 
                            className="p-2 -mr-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all shrink-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                            title="添加到白板"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                          {card.description}
                        </p>
                      </div>
                      
                      {/* 底部关联信息条：真实数据标签 */}
                      <div className="mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-wrap gap-1.5">
                        {card.relatedTerms.length > 0 ? (
                          <>
                            {card.relatedTerms.slice(0, 2).map((term, i) => (
                              <span 
                                key={i} 
                                className="truncate px-2.5 py-1 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 rounded-lg max-w-[85px]" 
                                title={term}
                              >
                                {term}
                              </span>
                            ))}
                            {card.relatedTerms.length > 2 && (
                              <span className="px-2.5 py-1 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 rounded-lg shrink-0">
                                +{card.relatedTerms.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">暂无关联节点</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 白板占位视图 */}
        {activeTab === 'whiteboard' && (
          <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden flex flex-col items-center justify-center">
             {boardItems.length === 0 ? (
               <div className="text-center">
                 <Palette size={64} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-6" />
                 <h2 className="text-2xl font-bold text-zinc-400 dark:text-zinc-500 mb-2">设计白板为空</h2>
                 <p className="text-zinc-500 dark:text-zinc-600">请前往「发现语汇」添加卡片到白板中进行推敲。</p>
                 <button onClick={() => setActiveTab('discovery')} className="mt-8 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                   去添加卡片
                 </button>
               </div>
             ) : (
               <div className="w-full h-full relative" style={{ backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                 {/* 渲染白板上的卡片 */}
                 {boardItems.map(item => (
                   <div 
                     key={item.uid} 
                     className="absolute p-5 bg-white dark:bg-zinc-950 shadow-xl rounded-2xl w-64 border border-zinc-200 dark:border-zinc-800 cursor-move" 
                     style={{ top: item.y, left: item.x }}
                   >
                     <div className="flex justify-between items-start mb-3">
                       <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase rounded-md">{item.category1}</span>
                       <button className="text-zinc-400 hover:text-red-500"><X size={14}/></button>
                     </div>
                     <h4 className="font-bold text-lg mb-2 leading-tight">{item.title}</h4>
                     <p className="text-xs text-zinc-500 line-clamp-4">{item.description}</p>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </main>

      {/* 详情弹窗 */}
      <DetailModal card={selectedCard} onClose={() => setSelectedCard(null)} darkMode={darkMode} />

    </div>
  );
}
