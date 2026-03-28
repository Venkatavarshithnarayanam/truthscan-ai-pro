import { useState, useCallback } from 'react';
import './index.css';
import ImageUpload from './components/ImageUpload';
import ResultsPanel from './components/ResultsPanel';
import type { AnalysisResult } from './api';
import { analyzeImage } from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, AlertCircle, ScanLine } from 'lucide-react';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback(async (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Auto-analyze
    setIsAnalyzing(true);
    try {
      const analysisResult = await analyzeImage(file);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 z-0 h-[500px] w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-50 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-blue-500 blur-[120px]" />
          <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-purple-500 blur-[120px]" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ScanLine className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-extrabold text-xl tracking-tight">TruthScan AI Pro</span>
            </div>
            <nav className="hidden sm:flex items-center gap-8 text-sm font-medium">
              <span className="text-slate-300 hover:text-white cursor-pointer transition-colors">Technology</span>
              <span className="text-slate-300 hover:text-white cursor-pointer transition-colors">API docs</span>
              <span className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer backdrop-blur-sm border border-white/10">
                Contact Sales
              </span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow pt-12 sm:pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            /* Landing Page State */
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl mx-auto text-center mt-8"
            >
              <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
                Detect AI-Generated <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                  Images Instantly.
                </span>
              </h1>
              <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
                Advanced AI detection powered by machine learning and computer vision. Upload any image to reveal its digital truth.
              </p>
              
              <div className="bg-white p-8 sm:p-12 rounded-[2rem] shadow-2xl shadow-slate-900/5 border border-slate-100/50 backdrop-blur-xl">
                <ImageUpload onFileSelected={handleFileSelected} isAnalyzing={isAnalyzing} />
              </div>
            </motion.div>
          ) : (
            /* Analysis & Results State */
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto mt-4"
            >
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                  
                  {/* LEFT PANEL: Preview */}
                  <div className="lg:col-span-4 p-8 sm:p-10 bg-slate-50/50">
                    <div className="sticky top-10">
                      <div className="relative rounded-3xl overflow-hidden bg-slate-100 shadow-inner group">
                        <img
                          src={imagePreview!}
                          alt="Uploaded"
                          className="w-full h-auto object-contain max-h-[500px]"
                        />
                        {/* Overlay when analyzing */}
                        <AnimatePresence>
                          {isAnalyzing && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center backdrop-blur-md"
                            >
                              <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                              <p className="text-white font-medium tracking-wide">Scanning digital artifacts...</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-700 truncate">{selectedFile.name}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          onClick={handleReset}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Analyze Another
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT PANEL: Results */}
                  <div className="lg:col-span-8 p-8 sm:p-10 xl:p-12">
                    <AnimatePresence mode="wait">
                      {isAnalyzing && (
                        <motion.div 
                          key="analyzing"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full min-h-[400px] flex flex-col items-center justify-center text-center"
                        >
                          <div className="relative w-24 h-24 mb-8">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ScanLine className="w-8 h-8 text-blue-500 animate-pulse" />
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-slate-800 mb-2">Analyzing Image</h3>
                          <p className="text-slate-500 font-medium max-w-sm">Running multi-model ensemble detection across pixels, noise patterns, and frequencies...</p>
                        </motion.div>
                      )}

                      {error && !isAnalyzing && (
                        <motion.div 
                          key="error"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="h-full flex flex-col items-center justify-center text-center py-20"
                        >
                          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm ring-1 ring-rose-100">
                            <AlertCircle className="w-10 h-10" />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-800 mb-3">Analysis Failed</h3>
                          <p className="text-slate-600 mb-8 max-w-md bg-rose-50 px-4 py-3 rounded-xl text-sm border border-rose-100">
                            {error}
                          </p>
                          <button
                            onClick={() => handleFileSelected(selectedFile)}
                            className="px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-colors shadow-lg shadow-slate-900/20"
                          >
                            Retry Analysis
                          </button>
                        </motion.div>
                      )}

                      {result && !isAnalyzing && (
                        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <ResultsPanel result={result} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/50 bg-white/50 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-slate-400">
            Powered by EfficientNet-B3, YOLOv8, and OpenCV Forensics
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
