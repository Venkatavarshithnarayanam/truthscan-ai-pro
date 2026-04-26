import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImageUploadProps {
  onFileSelected: (file: File) => void;
  isAnalyzing: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelected, isAnalyzing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) onFileSelected(e.dataTransfer.files[0]);
  }, [onFileSelected]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onFileSelected(e.target.files[0]);
  }, [onFileSelected]);

  return (
    <label
      htmlFor="file-upload-detector"
      className={`upload-zone block w-full cursor-pointer ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none">
        <motion.div
          animate={{ y: isDragging ? -10 : 0, scale: isDragging ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all"
          style={{
            background: isDragging
              ? 'var(--grad-primary)'
              : 'rgba(59,130,246,0.08)',
            border: '1px solid ' + (isDragging ? 'transparent' : 'rgba(59,130,246,0.2)'),
            boxShadow: isDragging ? 'var(--shadow-glow-blue)' : 'none',
          }}
        >
          <UploadCloud
            size={36}
            strokeWidth={1.5}
            style={{ color: isDragging ? 'white' : 'var(--accent-blue)' }}
          />
        </motion.div>

        <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {isDragging ? 'Release to analyze' : 'Drop your image here'}
        </p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          or{' '}
          <span style={{ color: 'var(--accent-blue-hi)', fontWeight: 600 }}>
            browse files
          </span>
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          PNG, JPG, WEBP, GIF — up to 50MB
        </p>

        <input
          id="file-upload-detector"
          name="file-upload-detector"
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp,image/bmp,image/gif"
          onChange={handleChange}
          disabled={isAnalyzing}
        />
      </div>
    </label>
  );
};

export default ImageUpload;
