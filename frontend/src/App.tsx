import { useState, useCallback } from 'react';
import './index.css';
import ImageUpload from './components/ImageUpload';
import ResultsPanel from './components/ResultsPanel';
import type { AnalysisResult } from './api';
import { analyzeImage } from './api';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a2332] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">TruthScan AI Pro</span>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <span className="text-gray-300 hover:text-white cursor-pointer transition-colors">API</span>
              <span className="text-gray-300 hover:text-white cursor-pointer transition-colors">Docs</span>
              <span className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors cursor-pointer">
                Get Started
              </span>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-[#1a2332] pb-12 pt-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Detect AI-generated images
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload any image to analyze whether it was created by AI or is a real photograph.
            Powered by multi-model ensemble detection.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {!selectedFile ? (
            /* Upload State */
            <div className="p-8 sm:p-12">
              <ImageUpload onFileSelected={handleFileSelected} isAnalyzing={isAnalyzing} />
            </div>
          ) : (
            /* Results State */
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              {/* Left: Image Preview */}
              <div className="lg:col-span-4 p-6">
                <div className="sticky top-6">
                  <div className="relative rounded-xl overflow-hidden bg-gray-100 shadow-inner">
                    <img
                      src={imagePreview!}
                      alt="Uploaded"
                      className="w-full h-auto object-contain max-h-[500px]"
                    />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="spinner mb-3"></div>
                        <p className="text-white text-sm font-medium">Analyzing image...</p>
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Analyze another image
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Results */}
              <div className="lg:col-span-8 p-6 sm:p-8">
                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="spinner mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Analyzing your image</h3>
                    <p className="text-sm text-gray-400">Running multi-model ensemble detection...</p>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Analysis Failed</h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-md">{error}</p>
                    <button
                      onClick={() => selectedFile && handleFileSelected(selectedFile)}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Retry Analysis
                    </button>
                  </div>
                )}

                {result && <ResultsPanel result={result} />}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center">
        <p className="text-sm text-gray-400">
          TruthScan AI Pro • Powered by EfficientNet-B3, YOLOv8, OpenCV Forensics
        </p>
      </footer>
    </div>
  );
}

export default App;
