import React from 'react';
import { RefreshCw, Download } from 'lucide-react';

interface ControlsProps {
  currentIndex: number;
  total: number;
  onRestart: () => void;
  onDownload?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ currentIndex, total, onRestart, onDownload }) => {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 flex items-center justify-between gap-4 text-sm font-medium text-gray-600 px-4">
      
      {/* Restart Button */}
      <button 
        onClick={onRestart}
        className="flex items-center gap-2 hover:text-gray-900 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Restart</span>
      </button>

      {/* Progress Bar Container */}
      <div className="flex-1 flex items-center gap-4 mx-4">
        <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="whitespace-nowrap tabular-nums">
          {currentIndex + 1} / {total} cards
        </span>
      </div>

      {/* Download Button (Mock) */}
      <button 
        onClick={onDownload}
        className="flex items-center gap-2 hover:text-gray-900 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Download</span>
      </button>

    </div>
  );
};