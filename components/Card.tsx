import React from 'react';
import { motion } from 'framer-motion';
import { FlashcardData } from '../types';

interface CardProps {
  data: FlashcardData;
  isFlipped: boolean;
  onFlip: () => void;
}

export const Card: React.FC<CardProps> = ({ data, isFlipped, onFlip }) => {
  return (
    <div className="relative w-full max-w-md h-96 perspective-1000 cursor-pointer" onClick={onFlip}>
      <motion.div
        className="relative w-full h-full text-center transition-all duration-500 preserve-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.25, type: "tween", ease: "easeInOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of Card */}
        <div 
          className="absolute inset-0 w-full h-full bg-[#1F1F1F] rounded-[32px] shadow-2xl flex flex-col justify-center items-center p-8 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex-grow flex items-center justify-center">
            <h2 className="text-3xl md:text-4xl font-medium text-white leading-tight tracking-wide">
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
          <div className="flex-grow flex items-center justify-center">
            <h2 className="text-2xl md:text-3xl font-medium text-gray-800 leading-relaxed">
              {data.answer}
            </h2>
          </div>
          <p className="text-gray-400 text-sm font-medium mt-4">Question</p>
        </div>
      </motion.div>
    </div>
  );
};