import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, ArrowLeft, ArrowRight, Shuffle, Loader2, Maximize2, FileText, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card } from './components/Card';
import { Controls } from './components/Controls';
import { FlashcardData, GameState } from './types';
import { parseCSV } from './utils/csvParser';
import { generateFlashcardsFromTopic } from './services/geminiService';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.UPLOAD);
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  // --- Actions ---

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingMessage('Parsing CSV...');
    setGameState(GameState.LOADING);

    try {
      const parsedCards = await parseCSV(file);
      if (parsedCards.length === 0) {
        alert("No valid cards found in CSV. Ensure format is: Question,Answer");
        setGameState(GameState.UPLOAD);
        return;
      }
      setCards(parsedCards);
      setGameState(GameState.STUDY);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error(error);
      alert("Error parsing CSV");
      setGameState(GameState.UPLOAD);
    }
  };

  const handleGeminiGenerate = async () => {
    if (!topicInput.trim()) return;
    
    setLoadingMessage(`Asking Gemini to create cards about "${topicInput}"...`);
    setGameState(GameState.LOADING);

    try {
      const generatedCards = await generateFlashcardsFromTopic(topicInput);
      setCards(generatedCards);
      setGameState(GameState.STUDY);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error(error);
      alert("Failed to generate cards. Please check your API key or try again.");
      setGameState(GameState.UPLOAD);
    }
  };

  const nextCard = useCallback(() => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150); // Small delay for better visual flow if flipped
  }, [cards.length]);

  const prevCard = useCallback(() => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
    }, 150);
  }, [cards.length]);

  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const shuffleCards = useCallback(() => {
    setCards((prev) => {
      const newCards = [...prev];
      for (let i = newCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
      }
      return newCards;
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  // --- Keyboard Listeners ---

  useEffect(() => {
    if (gameState !== GameState.STUDY) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          nextCard();
          break;
        case 'ArrowLeft':
          prevCard();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault(); // Prevent scrolling
          flipCard();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, nextCard, prevCard, flipCard]);

  // --- Render ---

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-hidden text-gray-800">
      
      {/* Background Ambience - Matches the screenshot's soft glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto p-6 flex justify-between items-start z-10 relative">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vocabulary Flashcards</h1>
          <p className="text-sm text-gray-500 mt-1">
            {gameState === GameState.STUDY ? `Based on ${cards.length} sources` : 'Create your deck'}
          </p>
        </div>
        <div className="flex gap-2">
           {gameState === GameState.STUDY && (
             <button onClick={shuffleCards} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Shuffle">
               <Shuffle className="w-5 h-5 text-gray-600" />
             </button>
           )}
           <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Full Screen">
             <Maximize2 className="w-5 h-5 text-gray-600" />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-4 z-10 relative">
        
        {/* Loading State */}
        {gameState === GameState.LOADING && (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-600">{loadingMessage}</p>
          </div>
        )}

        {/* Upload State */}
        {gameState === GameState.UPLOAD && (
          <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload your deck</h2>
            <p className="text-gray-500 mb-8">Upload a CSV file with "Question" and "Answer" columns to get started.</p>
            
            <label className="block w-full cursor-pointer">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <div className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200">
                Select CSV File
              </div>
            </label>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or generate with AI</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Topic (e.g., 'Spanish Basics')" 
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button 
                onClick={handleGeminiGenerate}
                disabled={!topicInput.trim()}
                className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate</span>
              </button>
            </div>
          </div>
        )}

        {/* Study State */}
        {gameState === GameState.STUDY && cards.length > 0 && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-700">
            
            <div className="flex items-center w-full justify-center gap-8 md:gap-16">
              {/* Prev Button */}
              <button 
                onClick={prevCard}
                className="w-12 h-12 rounded-full border border-blue-500/30 bg-white/50 backdrop-blur-sm flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all shadow-sm hidden md:flex"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* The Card */}
              <Card 
                data={cards[currentIndex]} 
                isFlipped={isFlipped} 
                onFlip={flipCard} 
              />

              {/* Next Button */}
              <button 
                onClick={nextCard}
                className="w-12 h-12 rounded-full border border-blue-500/30 bg-white/50 backdrop-blur-sm flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all shadow-sm hidden md:flex"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation (Only visible on small screens) */}
            <div className="flex md:hidden gap-4 mt-8">
              <button 
                onClick={prevCard}
                className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextCard}
                className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 shadow-sm"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Progress & Controls */}
            <Controls 
              currentIndex={currentIndex} 
              total={cards.length} 
              onRestart={() => { setCurrentIndex(0); setIsFlipped(false); }}
              onDownload={() => alert("Download feature coming soon!")}
            />

            {/* Keyboard Hint */}
            <div className="mt-8 text-xs text-gray-400 font-medium tracking-wide">
              SPACE to flip • ARROWS to navigate
            </div>

          </div>
        )}
      </main>

      {/* Footer Feedback (Aesthetic only) */}
      <footer className="w-full max-w-5xl mx-auto p-6 flex gap-4 z-10 relative">
         <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <ThumbsUp className="w-4 h-4" />
            Good content
         </button>
         <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <ThumbsDown className="w-4 h-4" />
            Bad content
         </button>
      </footer>

    </div>
  );
}