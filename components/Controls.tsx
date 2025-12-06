import React from 'react';
import { RefreshCw, Download, Star, ArrowRightLeft, Timer, Play, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface ControlsProps {
  currentIndex: number;
  total: number;
  onRestart: () => void;
  onDownload?: () => void;
  showToughOnly: boolean;
  onToggleMode: () => void;
  toughCount: number;
  isReversed: boolean;
  onToggleReverse: () => void;
  isAutoFlip: boolean;
  onToggleAutoFlip: () => void;
  isAutoSwipe: boolean;
  onToggleAutoSwipe: () => void;
  autoSwipeDuration: number;
  onAutoSwipeDurationChange: (seconds: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  currentIndex, 
  total, 
  onRestart, 
  onDownload,
  showToughOnly,
  onToggleMode,
  toughCount,
  isReversed,
  onToggleReverse,
  isAutoFlip,
  onToggleAutoFlip,
  isAutoSwipe,
  onToggleAutoSwipe,
  autoSwipeDuration,
  onAutoSwipeDurationChange
}) => {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-medium text-gray-600 px-4">
      
      {/* Restart Button */}
      <button 
        onClick={onRestart}
        className="flex items-center gap-2 hover:text-gray-900 transition-colors order-2 md:order-1"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Restart</span>
      </button>

      {/* Progress Bar Container */}
      <div className="w-full md:flex-1 flex items-center gap-4 order-1 md:order-2">
        <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="whitespace-nowrap tabular-nums min-w-[80px] text-right">
          {total === 0 ? '0' : currentIndex + 1} / {total} cards
        </span>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 order-3 flex-wrap justify-center">
        {/* Auto Flip Button */}
        <button
          onClick={onToggleAutoFlip}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border",
            isAutoFlip
              ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              : "bg-transparent border-transparent hover:bg-gray-100 text-gray-500"
          )}
          title="Auto Flip (F) - 2 flips/sec"
        >
          <Timer className="w-4 h-4" />
          <span className="hidden sm:inline">Auto Flip</span>
        </button>

        {/* Auto Swipe Group */}
        <div className={clsx(
            "flex items-center rounded-lg border transition-all overflow-hidden",
            isAutoSwipe 
              ? "bg-green-50 border-green-200 text-green-700" 
              : "bg-transparent border-transparent hover:bg-gray-100 text-gray-500"
          )}>
          <button
            onClick={onToggleAutoSwipe}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 transition-colors"
            title="Auto Next (P)"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Auto Next</span>
          </button>
          <div className={clsx("h-4 w-px", isAutoSwipe ? "bg-green-200" : "bg-gray-300")}></div>
          <div className="relative px-2">
            <select
              value={autoSwipeDuration}
              onChange={(e) => onAutoSwipeDurationChange(Number(e.target.value))}
              className="appearance-none bg-transparent text-xs font-bold outline-none cursor-pointer pr-3 py-1"
              title="Duration per card"
            >
              <option value={2}>2s</option>
              <option value={3}>3s</option>
              <option value={4}>4s</option>
              <option value={5}>5s</option>
              <option value={7}>7s</option>
              <option value={10}>10s</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
          </div>
        </div>

        {/* Reverse Toggle Button */}
        <button
          onClick={onToggleReverse}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border",
            isReversed 
              ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" 
              : "bg-transparent border-transparent hover:bg-gray-100 text-gray-500"
          )}
          title="Swap Question and Answer"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Swap Sides</span>
        </button>

        {/* Toggle Tough Mode Button */}
        <button
          onClick={onToggleMode}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border",
            showToughOnly 
              ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100" 
              : "bg-transparent border-transparent hover:bg-gray-100 text-gray-500"
          )}
          title={showToughOnly ? "Show All Cards" : "Show Tough Cards Only"}
        >
          <Star className={clsx("w-4 h-4", showToughOnly && "fill-yellow-500")} />
          <span className="hidden sm:inline">
            {showToughOnly ? "Tough Only" : `Tough (${toughCount})`}
          </span>
        </button>

        {/* Download Button */}
        <button 
          onClick={onDownload}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ml-1"
          title="Download Deck"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};