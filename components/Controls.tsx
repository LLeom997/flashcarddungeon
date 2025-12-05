
import React from 'react';
import { RefreshCw, Download, Star, ArrowRightLeft } from 'lucide-react';
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
  onToggleReverse
}) => {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <div className="w-full max-w-3xl mx-auto mt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-medium text-gray-600 px-4">
      
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
      <div className="flex items-center gap-3 order-3">
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
          <span>
            {showToughOnly ? "Tough Only" : `Tough (${toughCount})`}
          </span>
        </button>

        {/* Download Button (Mock) */}
        <button 
          onClick={onDownload}
          className="flex items-center gap-2 hover:text-gray-900 transition-colors ml-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download</span>
        </button>
      </div>

    </div>
  );
};
