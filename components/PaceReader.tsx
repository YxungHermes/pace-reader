'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Upload, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

// Sample texts for demo
const SAMPLE_TEXTS = {
  'The Great Gatsby (Opening)': `In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since. Whenever you feel like criticizing anyone, he told me, just remember that all the people in this world haven't had the advantages that you've had. He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that.`,
  
  'Speed Reading Introduction': `Speed reading is the process of rapidly recognizing and absorbing phrases or sentences on a page all at once, rather than identifying individual words. The key to speed reading is to focus your eyes on a fixed point while using your peripheral vision to capture the surrounding words. With practice, you can train your brain to process information faster without sacrificing comprehension. The technique you are using now, called RSVP or Rapid Serial Visual Presentation, eliminates the need for eye movement entirely by presenting words one at a time at a fixed location.`,
  
  '1984 (Opening)': `It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him. The hallway smelt of boiled cabbage and old rag mats.`,
};

// Calculate ORP (Optimal Recognition Point) - typically around 30% into the word
function getORPIndex(word: string): number {
  const len = word.length;
  if (len <= 1) return 0;
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

// Render word with ORP highlighting
function WordDisplay({ word }: { word: string }) {
  if (!word) return null;
  
  const orpIndex = getORPIndex(word);
  const before = word.slice(0, orpIndex);
  const orp = word[orpIndex];
  const after = word.slice(orpIndex + 1);
  
  return (
    <div className="flex items-center justify-center">
      <span className="text-pace-text text-right" style={{ minWidth: '45%', textAlign: 'right' }}>
        {before}
      </span>
      <span className="text-pace-orp font-bold">{orp}</span>
      <span className="text-pace-text text-left" style={{ minWidth: '45%', textAlign: 'left' }}>
        {after}
      </span>
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
  const [fontSize, setFontSize] = useState(48);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      const interval = 60000 / wpm; // ms per word
      
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
    <div className="min-h-screen bg-pace-bg flex flex-col safe-area-padding">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-800">
        <div 
          className="h-full bg-pace-progress transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <button
          onClick={() => setShowLibrary(true)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Library
        </button>
        <div className="text-center">
          <span className="text-2xl font-bold text-pace-accent">{wpm}</span>
          <span className="text-gray-500 text-sm ml-1">WPM</span>
        </div>
        <div className="text-gray-500 text-sm">
          {estimatedTimeLeft}m left
        </div>
      </div>

      {/* Main reading area */}
      <div 
        className="flex-1 flex items-center justify-center px-4 no-select"
        onClick={togglePlay}
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="font-bold tracking-wide">
          <WordDisplay word={currentWord} />
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-6">
        {/* Speed slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>100</span>
            <span>Speed (WPM)</span>
            <span>1200</span>
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
        </div>

        {/* Font size slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>32</span>
            <span>Font Size</span>
            <span>72</span>
          </div>
          <input
            type="range"
            min="32"
            max="72"
            step="4"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
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

        {/* Word counter */}
        <div className="text-center text-gray-500 text-sm">
          {currentIndex + 1} / {words.length} words
        </div>
      </div>
    </div>
  );
}
