'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Upload, ChevronLeft, ChevronRight, BookOpen, Info, X, Eye, EyeOff } from 'lucide-react';

// Sample texts for demo
const SAMPLE_TEXTS = {
  'The Great Gatsby (Opening)': `In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since. Whenever you feel like criticizing anyone, he told me, just remember that all the people in this world haven't had the advantages that you've had. He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that.`,
  
  'Speed Reading Introduction': `Speed reading is the process of rapidly recognizing and absorbing phrases or sentences on a page all at once, rather than identifying individual words. The key to speed reading is to focus your eyes on a fixed point while using your peripheral vision to capture the surrounding words. With practice, you can train your brain to process information faster without sacrificing comprehension. The technique you are using now, called RSVP or Rapid Serial Visual Presentation, eliminates the need for eye movement entirely by presenting words one at a time at a fixed location.`,
  
  '1984 (Opening)': `It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him. The hallway smelt of boiled cabbage and old rag mats.`,
};

// Speed tier definitions
const SPEED_TIERS = [
  { min: 100, max: 200, label: 'Relaxed', color: '#4ade80', description: 'Easy pace, maximum comprehension' },
  { min: 200, max: 300, label: 'Average', color: '#a3e635', description: 'Typical reading speed' },
  { min: 300, max: 450, label: 'Above Average', color: '#facc15', description: 'Comfortable speed reading' },
  { min: 450, max: 600, label: 'Fast', color: '#fb923c', description: 'Practiced speed readers' },
  { min: 600, max: 800, label: 'Advanced', color: '#f87171', description: 'Requires solid technique' },
  { min: 800, max: 1200, label: 'Elite', color: '#ef4444', description: 'Pro-level, scanning territory' },
];

// Get current speed tier
function getSpeedTier(wpm: number) {
  return SPEED_TIERS.find(tier => wpm >= tier.min && wpm < tier.max) || SPEED_TIERS[SPEED_TIERS.length - 1];
}

// Calculate reading stats
function getReadingStats(wpm: number) {
  const wordsPerPage = 250;
  const pagesPerMin = wpm / wordsPerPage;
  const pagesPerHour = pagesPerMin * 60;
  const timeFor300Pages = 300 / pagesPerHour;
  
  return {
    pagesPerMin: pagesPerMin.toFixed(1),
    pagesPerHour: Math.round(pagesPerHour),
    bookTime: timeFor300Pages.toFixed(1),
  };
}

// Calculate ORP (Optimal Recognition Point)
function getORPIndex(word: string): number {
  const len = word.length;
  if (len <= 1) return 0;
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

// Get font size limits based on screen width
function getFontSizeLimits(screenWidth: number) {
  if (screenWidth < 640) {
    return { min: 24, max: 64, default: 40 };
  } else if (screenWidth < 1024) {
    return { min: 32, max: 120, default: 64 };
  } else if (screenWidth < 1920) {
    return { min: 48, max: 200, default: 80 };
  } else {
    return { min: 64, max: 400, default: 120 };
  }
}

// Calculate max safe font size for a word to fit on screen
function getMaxFontSizeForWord(word: string, screenWidth: number, padding: number = 40) {
  const charWidthRatio = 0.55;
  const availableWidth = screenWidth - (padding * 2);
  const maxFontSize = availableWidth / (word.length * charWidthRatio);
  return Math.floor(maxFontSize);
}

// Render word with ORP highlighting - BRIGHTER text
function WordDisplay({ word, maxWidth }: { word: string; maxWidth: number }) {
  if (!word) return null;
  
  const orpIndex = getORPIndex(word);
  const before = word.slice(0, orpIndex);
  const orp = word[orpIndex];
  const after = word.slice(orpIndex + 1);
  
  return (
    <div 
      className="flex items-center justify-center font-bold tracking-wide"
      style={{ width: maxWidth, maxWidth: '100%' }}
    >
      <span 
        className="inline-block text-right"
        style={{ 
          width: '50%', 
          paddingRight: '0.05em',
          color: '#ffffff',
          textShadow: '0 0 20px rgba(255,255,255,0.3)'
        }}
      >
        {before}
      </span>
      <span 
        className="inline-block text-center font-black"
        style={{ 
          width: 'auto',
          color: '#ff4444',
          textShadow: '0 0 30px rgba(255,68,68,0.6), 0 0 60px rgba(255,68,68,0.3)'
        }}
      >
        {orp}
      </span>
      <span 
        className="inline-block text-left"
        style={{ 
          width: '50%', 
          paddingLeft: '0.05em',
          color: '#ffffff',
          textShadow: '0 0 20px rgba(255,255,255,0.3)'
        }}
      >
        {after}
      </span>
    </div>
  );
}

// Speed info modal
function SpeedInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-800" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Speed Guide</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-3">
          {SPEED_TIERS.map((tier) => (
            <div key={tier.label} className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: tier.color }}
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-white">{tier.label}</span>
                  <span className="text-gray-400 text-sm">{tier.min}-{tier.max}</span>
                </div>
                <p className="text-gray-500 text-sm">{tier.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            💡 <strong className="text-white">Tip:</strong> Start at 250-350 WPM and gradually increase. Focus on comprehension over speed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaceReader() {
  const [text, setText] = useState<string>('');
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [showLibrary, setShowLibrary] = useState(true);
  const [showSpeedInfo, setShowSpeedInfo] = useState(false);
  const [zenDisabled, setZenDisabled] = useState(false); // When true, zen mode won't activate
  const [fontSize, setFontSize] = useState(48);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const speedTier = getSpeedTier(wpm);
  const readingStats = getReadingStats(wpm);
  const fontLimits = getFontSizeLimits(screenWidth);
  
  // Calculate longest word for safe font sizing
  const longestWord = useMemo(() => {
    if (words.length === 0) return '';
    return words.reduce((longest, word) => word.length > longest.length ? word : longest, '');
  }, [words]);

  // Calculate max safe font size based on longest word
  const maxSafeFontSize = useMemo(() => {
    if (!longestWord) return fontLimits.max;
    const safeSize = getMaxFontSizeForWord(longestWord, screenWidth, 32);
    return Math.min(safeSize, fontLimits.max);
  }, [longestWord, screenWidth, fontLimits.max]);

  // Zen mode is active when playing AND not disabled
  const isZenActive = isPlaying && !zenDisabled;

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update font size when screen changes
  useEffect(() => {
    const limits = getFontSizeLimits(screenWidth);
    setFontSize(prev => Math.max(limits.min, Math.min(prev, limits.max)));
  }, [screenWidth]);

  // Parse text into words
  useEffect(() => {
    if (text) {
      const parsed = text
        .replace(/\n/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0);
      setWords(parsed);
      setCurrentIndex(0);
      setShowLibrary(false);
    }
  }, [text]);

  // Handle playback
  useEffect(() => {
    if (isPlaying && words.length > 0) {
      const interval = 60000 / wpm;
      
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= words.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isPlaying, wpm, words.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.code === 'ArrowRight') {
        setWpm(w => Math.min(1200, w + 50));
      } else if (e.code === 'ArrowLeft') {
        setWpm(w => Math.max(100, w - 50));
      } else if (e.code === 'ArrowUp') {
        skipForward();
      } else if (e.code === 'ArrowDown') {
        skipBackward();
      } else if (e.code === 'KeyZ') {
        setZenDisabled(p => !p);
      } else if (e.code === 'Escape') {
        setIsPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [words]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const restart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const skipForward = useCallback(() => {
    setCurrentIndex(prev => Math.min(words.length - 1, prev + 10));
  }, [words.length]);

  const skipBackward = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 10));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setText(content);
      };
      reader.readAsText(file);
    }
  };

  const selectSampleText = (key: string) => {
    setText(SAMPLE_TEXTS[key as keyof typeof SAMPLE_TEXTS]);
  };

  const progress = words.length > 0 ? (currentIndex / (words.length - 1)) * 100 : 0;
  const currentWord = words[currentIndex] || '';
  const estimatedTimeLeft = words.length > 0 
    ? Math.ceil((words.length - currentIndex) / wpm) 
    : 0;

  // Library/selection view
  if (showLibrary) {
    return (
      <div className="min-h-screen bg-black p-6 safe-area-padding">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2 text-white">Pace Reader</h1>
          <p className="text-gray-400 text-center mb-8">Speed read with RSVP technique</p>
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <BookOpen size={20} />
              Sample Texts
            </h2>
            
            {Object.keys(SAMPLE_TEXTS).map((title) => (
              <button
                key={title}
                onClick={() => selectSampleText(title)}
                className="w-full p-4 bg-gray-900/50 rounded-lg text-left hover:bg-gray-800 transition-colors border border-gray-800"
              >
                <span className="font-medium text-white">{title}</span>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {SAMPLE_TEXTS[title as keyof typeof SAMPLE_TEXTS].slice(0, 100)}...
                </p>
              </button>
            ))}
            
            <div className="border-t border-gray-800 pt-4 mt-6">
              <h2 className="text-lg font-semibold text-blue-400 flex items-center gap-2 mb-4">
                <Upload size={20} />
                Your Text
              </h2>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-700 hover:border-blue-500 transition-colors"
              >
                <span className="text-gray-400">Upload .txt file</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <textarea
                placeholder="Or paste your text here..."
                className="w-full mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800 focus:border-blue-500 outline-none resize-none h-32 text-white placeholder-gray-600"
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reader view
  return (
    <div className="min-h-screen bg-black flex flex-col safe-area-padding overflow-hidden">
      <SpeedInfoModal isOpen={showSpeedInfo} onClose={() => setShowSpeedInfo(false)} />
      
      {/* Progress bar - minimal, fades in zen mode */}
      <div 
        className={`w-full h-[2px] bg-gray-900 transition-all duration-500 ${
          isZenActive ? 'opacity-0' : 'opacity-40'
        }`}
      >
        <div 
          className="h-full bg-gray-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header - blurs and fades in zen mode */}
      <div 
        className={`flex justify-between items-center p-4 transition-all duration-500 ${
          isZenActive 
            ? 'opacity-0 blur-sm pointer-events-none' 
            : 'opacity-100 blur-0'
        }`}
      >
        <button
          onClick={() => setShowLibrary(true)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Library
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSpeedInfo(true)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <Info size={18} />
          </button>
        </div>
        <div className="text-gray-400 text-sm">
          {estimatedTimeLeft}m left
        </div>
      </div>

      {/* Main reading area - always sharp and focused */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center px-4 no-select cursor-pointer"
        onClick={togglePlay}
        style={{ fontSize: `${Math.min(fontSize, maxSafeFontSize)}px` }}
      >
        <WordDisplay word={currentWord} maxWidth={screenWidth - 32} />
      </div>

      {/* Reading stats bar - hides in zen mode */}
      <div 
        className={`flex justify-center gap-6 py-3 border-t border-gray-800/30 transition-all duration-500 ${
          isZenActive 
            ? 'opacity-0 blur-md pointer-events-none h-0 py-0 overflow-hidden' 
            : 'opacity-100 blur-0'
        }`}
      >
        <div className="text-center">
          <span className="text-lg font-semibold text-white">{readingStats.pagesPerMin}</span>
          <p className="text-xs text-gray-500">pages/min</p>
        </div>
        <div className="text-center">
          <span className="text-lg font-semibold text-white">{readingStats.pagesPerHour}</span>
          <p className="text-xs text-gray-500">pages/hr</p>
        </div>
        <div className="text-center">
          <span className="text-lg font-semibold text-white">{readingStats.bookTime}h</span>
          <p className="text-xs text-gray-500">for 300pg book</p>
        </div>
      </div>

      {/* Controls - blur and fade in zen mode */}
      <div 
        className={`p-6 space-y-5 transition-all duration-500 ${
          isZenActive 
            ? 'opacity-0 blur-md pointer-events-none' 
            : 'opacity-100 blur-0'
        }`}
      >
        {/* WPM Slider with value above */}
        <div className="space-y-3">
          <div className="text-center">
            <span 
              className="text-4xl font-bold"
              style={{ color: speedTier.color }}
            >
              {wpm}
            </span>
            <span className="text-gray-500 text-lg ml-2">WPM</span>
            <div 
              className="text-sm font-medium mt-1"
              style={{ color: speedTier.color }}
            >
              {speedTier.label}
            </div>
          </div>
          <input
            type="range"
            min="100"
            max="1200"
            step="25"
            value={wpm}
            onChange={(e) => setWpm(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>100</span>
            <span>1200</span>
          </div>
        </div>

        {/* Font size slider with value above */}
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-2xl font-bold text-white">{Math.min(fontSize, maxSafeFontSize)}</span>
            <span className="text-gray-500 text-sm ml-2">px</span>
            <div className="text-xs text-gray-500 mt-1">Font Size</div>
          </div>
          <input
            type="range"
            min={fontLimits.min}
            max={Math.min(fontLimits.max, maxSafeFontSize)}
            step="4"
            value={Math.min(fontSize, maxSafeFontSize)}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{fontLimits.min}</span>
            <span>{Math.min(fontLimits.max, maxSafeFontSize)}</span>
          </div>
        </div>

        {/* Zen mode toggle */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setZenDisabled(!zenDisabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              zenDisabled 
                ? 'bg-gray-800/50 text-gray-400 border border-gray-700' 
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            {zenDisabled ? <Eye size={16} /> : <EyeOff size={16} />}
            {zenDisabled ? 'Zen Mode Off' : 'Zen Mode On'}
          </button>
        </div>

        {/* Playback controls - properly centered */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-4">
            <button
              onClick={skipBackward}
              className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            
            <button
              onClick={restart}
              className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw size={22} />
            </button>
            
            <button
              onClick={togglePlay}
              className="w-16 h-16 flex items-center justify-center bg-blue-500 rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
            >
              {isPlaying ? (
                <Pause size={28} className="text-white" />
              ) : (
                <Play size={28} className="text-white ml-1" />
              )}
            </button>
            
            <button
              onClick={skipForward}
              className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>

        {/* Word counter & keyboard hints */}
        <div className="text-center space-y-1">
          <div className="text-gray-400 text-sm">
            {currentIndex + 1} / {words.length} words
          </div>
          <div className="text-xs text-gray-600">
            Space: play/pause · Z: toggle zen · Arrows: speed/skip
          </div>
        </div>
      </div>
    </div>
  );
}
