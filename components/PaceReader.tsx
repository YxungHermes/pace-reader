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
  { min: 100, max: 200, label: 'Relaxed', color: '#22c55e', description: 'Easy pace, maximum comprehension' },
  { min: 200, max: 300, label: 'Average', color: '#84cc16', description: 'Typical reading speed' },
  { min: 300, max: 450, label: 'Above Average', color: '#eab308', description: 'Comfortable speed reading' },
  { min: 450, max: 600, label: 'Fast', color: '#f97316', description: 'Practiced speed readers' },
  { min: 600, max: 800, label: 'Advanced', color: '#ef4444', description: 'Requires solid technique' },
  { min: 800, max: 1200, label: 'Elite', color: '#dc2626', description: 'Pro-level, scanning territory' },
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
    // Mobile
    return { min: 24, max: 64, default: 40 };
  } else if (screenWidth < 1024) {
    // Tablet
    return { min: 32, max: 120, default: 64 };
  } else if (screenWidth < 1920) {
    // Desktop
    return { min: 48, max: 200, default: 80 };
  } else {
    // 4K+
    return { min: 64, max: 400, default: 120 };
  }
}

// Calculate max safe font size for a word to fit on screen
function getMaxFontSizeForWord(word: string, screenWidth: number, padding: number = 40) {
  // Approximate character width ratio (varies by font, ~0.6 for Inter)
  const charWidthRatio = 0.55;
  const availableWidth = screenWidth - (padding * 2);
  const maxFontSize = availableWidth / (word.length * charWidthRatio);
  return Math.floor(maxFontSize);
}

// Render word with ORP highlighting - fixed positioning
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
        className="text-pace-text inline-block text-right"
        style={{ width: '50%', paddingRight: '0.05em' }}
      >
        {before}
      </span>
      <span className="text-pace-orp inline-block text-center" style={{ width: 'auto' }}>
        {orp}
      </span>
      <span 
        className="text-pace-text inline-block text-left"
        style={{ width: '50%', paddingLeft: '0.05em' }}
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Speed Guide</h3>
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
                  <span className="font-medium">{tier.label}</span>
                  <span className="text-gray-500 text-sm">{tier.min}-{tier.max}</span>
                </div>
                <p className="text-gray-500 text-sm">{tier.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            💡 <strong>Tip:</strong> Start at 250-350 WPM and gradually increase. Focus on comprehension over speed.
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
  const [zenMode, setZenMode] = useState(true); // Auto-zen when playing
  const [manualZenOverride, setManualZenOverride] = useState(false);
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

  // Determine if zen mode should be active
  const isZenActive = (isPlaying && zenMode) || manualZenOverride;

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
        setManualZenOverride(p => !p);
      } else if (e.code === 'Escape') {
        setManualZenOverride(false);
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
      <div className="min-h-screen bg-pace-bg p-6 safe-area-padding">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Pace Reader</h1>
          <p className="text-gray-400 text-center mb-8">Speed read with RSVP technique</p>
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-pace-accent flex items-center gap-2">
              <BookOpen size={20} />
              Sample Texts
            </h2>
            
            {Object.keys(SAMPLE_TEXTS).map((title) => (
              <button
                key={title}
                onClick={() => selectSampleText(title)}
                className="w-full p-4 bg-gray-900 rounded-lg text-left hover:bg-gray-800 transition-colors border border-gray-800"
              >
                <span className="font-medium">{title}</span>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {SAMPLE_TEXTS[title as keyof typeof SAMPLE_TEXTS].slice(0, 100)}...
                </p>
              </button>
            ))}
            
            <div className="border-t border-gray-800 pt-4 mt-6">
              <h2 className="text-lg font-semibold text-pace-accent flex items-center gap-2 mb-4">
                <Upload size={20} />
                Your Text
              </h2>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 bg-gray-900 rounded-lg border-2 border-dashed border-gray-700 hover:border-pace-accent transition-colors"
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
                className="w-full mt-4 p-4 bg-gray-900 rounded-lg border border-gray-800 focus:border-pace-accent outline-none resize-none h-32"
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
    <div className="min-h-screen bg-pace-bg flex flex-col safe-area-padding overflow-hidden">
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
            ? 'opacity-10 blur-sm grayscale pointer-events-none' 
            : 'opacity-100 blur-0'
        }`}
      >
        <button
          onClick={() => setShowLibrary(true)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Library
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold" style={{ color: speedTier.color }}>{wpm}</span>
            <span className="text-gray-500 text-sm">WPM</span>
            <button 
              onClick={() => setShowSpeedInfo(true)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <Info size={16} />
            </button>
          </div>
          <span 
            className="text-xs font-medium"
            style={{ color: speedTier.color }}
          >
            {speedTier.label}
          </span>
        </div>
        <div className="text-gray-500 text-sm">
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
        className={`flex justify-center gap-6 py-3 border-t border-gray-800/50 transition-all duration-500 ${
          isZenActive 
            ? 'opacity-0 blur-md grayscale pointer-events-none h-0 py-0 overflow-hidden' 
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
        className={`p-6 space-y-6 transition-all duration-500 ${
          isZenActive 
            ? 'opacity-20 blur-md grayscale pointer-events-none' 
            : 'opacity-100 blur-0'
        }`}
      >
        {/* Speed slider with tier markers */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>100</span>
            <span>Speed (WPM)</span>
            <span>1200</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="100"
              max="1200"
              step="25"
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-full"
            />
            {/* Recommended zone indicator */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-2 bg-green-500/20 rounded pointer-events-none"
              style={{ 
                left: `${((250 - 100) / (1200 - 100)) * 100}%`,
                width: `${((400 - 250) / (1200 - 100)) * 100}%`
              }}
            />
          </div>
          <div className="text-center text-xs text-gray-600">
            Recommended starting zone: 250-400 WPM
          </div>
        </div>

        {/* Font size slider - dynamic range based on screen */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{fontLimits.min}</span>
            <span>Font Size</span>
            <span>{Math.min(fontLimits.max, maxSafeFontSize)}</span>
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
        </div>

        {/* Zen mode toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setZenMode(!zenMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              zenMode 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-900 text-gray-400 border border-gray-800'
            }`}
          >
            {zenMode ? <EyeOff size={16} /> : <Eye size={16} />}
            Zen Mode {zenMode ? 'On' : 'Off'}
          </button>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={skipBackward}
            className="p-3 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          
          <button
            onClick={restart}
            className="p-3 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw size={24} />
          </button>
          
          <button
            onClick={togglePlay}
            className="p-5 bg-pace-accent rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>
          
          <button
            onClick={skipForward}
            className="p-3 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight size={28} />
          </button>
        </div>

        {/* Word counter & keyboard hints */}
        <div className="text-center text-gray-500 text-sm space-y-1">
          <div>{currentIndex + 1} / {words.length} words</div>
          <div className="text-xs text-gray-600">
            Space: play/pause · Z: toggle zen · Esc: exit zen
          </div>
        </div>
      </div>
    </div>
  );
}
