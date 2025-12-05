import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { Upload, ArrowLeft, ArrowRight, Shuffle, Loader2, Maximize2, Sparkles, ThumbsUp, ThumbsDown, Layers, FileSpreadsheet, Star, Link } from 'lucide-react';
import { Card } from './components/Card';
import { Controls } from './components/Controls';
import { FlashcardData, GameState } from './types';
import { parseFile, parseSpecificSheet, fetchGoogleSheet } from './utils/csvParser';
import { generateFlashcardsFromTopic } from './services/geminiService';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.UPLOAD);
  
  // Master list of all cards
  const [allCards, setAllCards] = useState<FlashcardData[]>([]);
  
  // View state
  const [showToughOnly, setShowToughOnly] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  
  const [topicInput, setTopicInput] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Multi-sheet handling
  const [workbook, setWorkbook] = useState<any>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  
  // Refs
  const isDraggingRef = useRef(false);

  // --- Derived State ---

  const activeDeck = useMemo(() => {
    if (showToughOnly) {
      return allCards.filter(card => card.isTough);
    }
    return allCards;
  }, [allCards, showToughOnly]);

  const toughCount = useMemo(() => {
    return allCards.filter(c => c.isTough).length;
  }, [allCards]);

  const currentCardData = useMemo(() => {
    if (activeDeck.length === 0) return null;
    const baseCard = activeDeck[currentIndex];
    
    // If reversed, swap question and answer for display
    if (isReversed) {
      return {
        ...baseCard,
        question: baseCard.answer,
        answer: baseCard.question
      };
    }
    return baseCard;
  }, [activeDeck, currentIndex, isReversed]);

  // Ensure index is valid when deck changes
  useEffect(() => {
    if (currentIndex >= activeDeck.length && activeDeck.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeDeck.length, currentIndex]);

  // --- Actions ---

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingMessage('Reading file...');
    setGameState(GameState.LOADING);

    try {
      const result = await parseFile(file);
      
      if (result.type === 'workbook' && result.sheets && result.workbook) {
        setWorkbook(result.workbook);
        setAvailableSheets(result.sheets);
        setGameState(GameState.SHEET_SELECTION);
      } else if (result.type === 'cards' && result.data) {
        if (result.data.length === 0) {
          alert("No valid cards found. Ensure columns are Question,Answer.");
          setGameState(GameState.UPLOAD);
          return;
        }
        setAllCards(result.data);
        setGameState(GameState.STUDY);
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (error) {
      console.error(error);
      alert("Error parsing file. Please check format.");
      setGameState(GameState.UPLOAD);
    }
  };

  const handleUrlUpload = async () => {
    if (!sheetUrl.trim()) return;
    setLoadingMessage('Fetching Google Sheet...');
    setGameState(GameState.LOADING);

    try {
        const result = await fetchGoogleSheet(sheetUrl);
        
        if (result.type === 'workbook' && result.sheets && result.workbook) {
            setWorkbook(result.workbook);
            setAvailableSheets(result.sheets);
            setGameState(GameState.SHEET_SELECTION);
        } else if (result.type === 'cards' && result.data) {
             if (result.data.length === 0) {
                 alert("No valid cards found.");
                 setGameState(GameState.UPLOAD);
                 return;
             }
             setAllCards(result.data);
             setGameState(GameState.STUDY);
             setCurrentIndex(0);
             setIsFlipped(false);
        }
    } catch (error: any) {
        console.error(error);
        alert(error.message || "Error loading Google Sheet.");
        setGameState(GameState.UPLOAD);
    }
  };

  const handleSheetSelect = (sheetName: string) => {
    if (!workbook) return;
    setLoadingMessage(`Loading deck: ${sheetName}...`);
    setGameState(GameState.LOADING);
    
    setTimeout(() => {
      try {
        const parsedCards = parseSpecificSheet(workbook, sheetName);
        if (parsedCards.length === 0) {
          alert("This sheet appears to be empty.");
          setGameState(GameState.SHEET_SELECTION);
          return;
        }
        setAllCards(parsedCards);
        setGameState(GameState.STUDY);
        setCurrentIndex(0);
        setIsFlipped(false);
      } catch (err) {
        console.error(err);
        alert("Error loading sheet.");
        setGameState(GameState.SHEET_SELECTION);
      }
    }, 500);
  };

  const handleGeminiGenerate = async () => {
    if (!topicInput.trim()) return;
    setLoadingMessage(`Asking Gemini to create cards about "${topicInput}"...`);
    setGameState(GameState.LOADING);

    try {
      const generatedCards = await generateFlashcardsFromTopic(topicInput);
      setAllCards(generatedCards);
      setGameState(GameState.STUDY);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error(error);
      alert("Failed to generate cards. Please check your API key or try again.");
      setGameState(GameState.UPLOAD);
    }
  };

  const handleDownload = () => {
    if (allCards.length === 0) return;
    
    // Map data to CSV structure, including Tough status
    const csvData = allCards.map(c => ({
        Question: c.question,
        Answer: c.answer,
        Status: c.isTough ? 'Tough' : 'Normal'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Create download link
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'flashcards_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nextCard = useCallback(() => {
    if (activeDeck.length === 0) return;
    setDirection(1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % activeDeck.length);
  }, [activeDeck.length]);

  const prevCard = useCallback(() => {
    if (activeDeck.length === 0) return;
    setDirection(-1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev === 0 ? activeDeck.length - 1 : prev - 1));
  }, [activeDeck.length]);

  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const toggleTough = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent card flip if clicked on star
    
    if (activeDeck.length === 0) return;
    const currentCard = activeDeck[currentIndex];
    
    setAllCards(prev => prev.map(card => {
      if (card.id === currentCard.id) {
        return { ...card, isTough: !card.isTough };
      }
      return card;
    }));
  }, [activeDeck, currentIndex]);

  const shuffleCards = useCallback(() => {
    setAllCards((prev) => {
      const newCards = [...prev];
      for (let i = newCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
      }
      return newCards;
    });
    setDirection(1);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  const toggleStudyMode = () => {
    if (!showToughOnly && toughCount === 0) {
      alert("No cards marked as tough yet! Press 'A' or 'T', or click the star on a card to mark it.");
      return;
    }
    setShowToughOnly(prev => !prev);
    setCurrentIndex(0);
    setDirection(1);
    setIsFlipped(false);
  };

  const toggleReverseMode = () => {
    setIsReversed(prev => !prev);
    setIsFlipped(false); // Reset flip state to avoid confusion
  };

  // --- Animation Variants ---
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      zIndex: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9
    })
  };

  // --- Keyboard Listeners ---

  useEffect(() => {
    if (gameState !== GameState.STUDY) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Check for Shift + S to shuffle
      if (e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        shuffleCards();
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          nextCard();
          break;
        case 'ArrowLeft':
          prevCard();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          flipCard();
          break;
        case 'a':
        case 'A':
        case 't':
        case 'T':
          toggleTough();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, nextCard, prevCard, flipCard, toggleTough, shuffleCards]);

  // --- Render ---

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-hidden text-gray-800">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto p-6 flex justify-between items-start z-10 relative">
        <div 
          className="cursor-pointer group"
          onClick={() => setGameState(GameState.UPLOAD)}
        >
          <h1 className="text-2xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Vocabulary Flashcards</h1>
          <p className="text-sm text-gray-500 mt-1">
            {gameState === GameState.STUDY 
              ? showToughOnly 
                ? `Studying ${activeDeck.length} tough cards`
                : `Studying ${activeDeck.length} cards` 
              : gameState === GameState.SHEET_SELECTION 
                ? 'Select a deck' 
                : 'Create your deck'}
          </p>
        </div>
        <div className="flex gap-2">
           {gameState === GameState.STUDY && (
             <button onClick={shuffleCards} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Shuffle (Shift + S)">
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
          <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload your deck</h2>
            <p className="text-gray-500 mb-8">Upload a CSV or Excel file. If your Excel file has multiple sheets, you can select which one to study.</p>
            
            <label className="block w-full cursor-pointer">
              <input 
                type="file" 
                accept=".csv, .xlsx, .xls" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <div className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200">
                Select File
              </div>
            </label>

            {/* URL Input */}
            <div className="mt-4 w-full">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Link className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Or paste Google Sheet Link" 
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        />
                    </div>
                    <button 
                        onClick={handleUrlUpload}
                        disabled={!sheetUrl.trim()}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Load from URL"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

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

        {/* Sheet Selection State */}
        {gameState === GameState.SHEET_SELECTION && (
          <div className="w-full max-w-4xl text-center animate-in fade-in duration-500">
            <div className="mb-8">
               <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-green-600" />
               </div>
               <h2 className="text-3xl font-bold text-gray-900">Select a Deck</h2>
               <p className="text-gray-500 mt-2">Your file contains multiple sheets. Choose one to start studying.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {availableSheets.map((sheetName, index) => (
                <motion.button
                  key={sheetName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSheetSelect(sheetName)}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
                >
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-50 transition-colors">
                    <FileSpreadsheet className="w-6 h-6 text-gray-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900">{sheetName}</span>
                </motion.button>
              ))}
            </div>
            
            <button 
              onClick={() => setGameState(GameState.UPLOAD)}
              className="mt-12 text-gray-400 hover:text-gray-600 underline text-sm"
            >
              Cancel and upload different file
            </button>
          </div>
        )}

        {/* Study State */}
        {gameState === GameState.STUDY && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-700">
            
            {activeDeck.length > 0 && currentCardData ? (
              <>
                <div className="flex items-center w-full justify-center gap-8 md:gap-16">
                  <button 
                    onClick={prevCard}
                    className="w-12 h-12 rounded-full border border-blue-500/30 bg-white/50 backdrop-blur-sm flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all shadow-sm hidden md:flex"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative w-full max-w-md h-96">
                    <AnimatePresence initial={false} custom={direction}>
                      <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          x: { type: "spring", stiffness: 300, damping: 30 },
                          opacity: { duration: 0.2 }
                        }}
                        className="absolute inset-0 touch-pan-y"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragStart={() => { isDraggingRef.current = true; }}
                        onDragEnd={(e, { offset }) => {
                          const swipeThreshold = 50;
                          if (offset.x > swipeThreshold) {
                            prevCard();
                          } else if (offset.x < -swipeThreshold) {
                            nextCard();
                          }
                          setTimeout(() => { isDraggingRef.current = false; }, 100);
                        }}
                      >
                        <Card 
                          data={currentCardData} 
                          isFlipped={isFlipped} 
                          onFlip={() => {
                            if (!isDraggingRef.current) flipCard();
                          }}
                          onToggleTough={toggleTough}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <button 
                    onClick={nextCard}
                    className="w-12 h-12 rounded-full border border-blue-500/30 bg-white/50 backdrop-blur-sm flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all shadow-sm hidden md:flex"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

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
              </>
            ) : (
              <div className="w-full max-w-md h-96 flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">No tough cards yet!</h3>
                <p className="text-gray-500 mt-2 mb-6">Mark cards as tough by clicking the star or pressing 'A' or 'T' during your study session.</p>
                <button 
                  onClick={toggleStudyMode}
                  className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Show all cards
                </button>
              </div>
            )}

            <Controls 
              currentIndex={currentIndex} 
              total={activeDeck.length} 
              onRestart={() => { setCurrentIndex(0); setIsFlipped(false); }}
              onDownload={handleDownload}
              showToughOnly={showToughOnly}
              onToggleMode={toggleStudyMode}
              toughCount={toughCount}
              isReversed={isReversed}
              onToggleReverse={toggleReverseMode}
            />

            <div className="mt-8 text-xs text-gray-400 font-medium tracking-wide">
              SPACE to flip • ARROWS to navigate • A / T for tough cards • Shift + S to shuffle
            </div>

          </div>
        )}
      </main>

      {/* Footer Feedback */}
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