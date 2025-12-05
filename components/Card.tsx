
import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { FlashcardData } from '../types';
import clsx from 'clsx';

interface CardProps {
  data: FlashcardData;
  isFlipped: boolean;
  onFlip: () => void;
  onToggleTough: (e: React.MouseEvent) => void;
}

export const Card: React.FC<CardProps> = ({ data, isFlipped, onFlip, onToggleTough }) => {
  return (
    <div className="relative w-full max-w-md h-96 perspective-1000 cursor-pointer group" onClick={onFlip}>
      <motion.div
        className="relative w-full h-full text-center transition-all preserve-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.15, type: "tween", ease: "easeInOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of Card */}
        <div 
          className="absolute inset-0 w-full h-full bg-[#1F1F1F] rounded-[32px] shadow-2xl flex flex-col justify-center items-center p-8 backface-hidden border border-gray-800"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Tough Indicator (Front) */}
          <button 
            onClick={onToggleTough}
            className={clsx(
              "absolute top-6 right-6 p-2 rounded-full transition-all z-20 hover:scale-110",
              data.isTough ? "bg-yellow-400/20 text-yellow-400" : "text-gray-600 hover:bg-white/10"
            )}
            title="Mark as Tough (Press 'A' or 'T')"
          >
            <Star className={clsx("w-6 h-6", data.isTough && "fill-yellow-400")} />
          </button>

          <div className="flex-grow flex items-center justify-center">
            <h2 className="text-3xl md:text-4xl font-medium text-white leading-tight tracking-wide select-none">
              {data.question}
            </h2>
          </div>
          <p className="text-gray-500 text-sm font-medium mt-4">See answer</p>
        </div>

        {/* Back of Card */}
        <div 
          className="absolute inset-0 w-full h-full bg-white rounded-[32px] shadow-xl border border-gray-200 flex flex-col justify-center items-center p-8 backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)' 
          }}
        >
          {/* Tough Indicator (Back) */}
          <button 
            onClick={onToggleTough}
            className={clsx(
              "absolute top-6 right-6 p-2 rounded-full transition-all z-20 hover:scale-110",
              data.isTough ? "bg-yellow-100 text-yellow-500" : "text-gray-300 hover:bg-gray-100"
            )}
            title="Mark as Tough (Press 'A' or 'T')"
          >
            <Star className={clsx("w-6 h-6", data.isTough && "fill-yellow-500")} />
          </button>

          <div className="flex-grow flex items-center justify-center">
            <h2 className="text-2xl md:text-3xl font-medium text-gray-800 leading-relaxed select-none">
              {data.answer}
            </h2>
          </div>
          <p className="text-gray-400 text-sm font-medium mt-4">Question</p>
        </div>
      </motion.div>
    </div>
  );
};
