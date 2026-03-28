import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploadProps {
  onFileSelected: (file: File) => void;
  isAnalyzing: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelected, isAnalyzing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelected(e.dataTransfer.files[0]);
      }
    },
    [onFileSelected]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        onFileSelected(e.target.files[0]);
      }
    },
    [onFileSelected]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`relative mt-2 flex justify-center rounded-3xl border-2 border-dashed px-6 py-20 transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-xl shadow-blue-500/10'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <motion.div 
            initial={false}
            animate={{ y: isDragging ? -10 : 0, scale: isDragging ? 1.1 : 1 }}
            className="flex justify-center"
          >
            <div className={`w-20 h-20 mb-6 rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-sm ${
              isDragging ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 ring-1 ring-slate-200'
            }`}>
              <UploadCloud size={40} strokeWidth={1.5} />
            </div>
          </motion.div>
          <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-transparent font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500 transition-colors"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/jpeg,image/png,image/webp,image/bmp,image/gif"
                onChange={handleChange}
                disabled={isAnalyzing}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500 font-medium">
            PNG, JPG, WEBP or GIF up to 50MB
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ImageUpload;
