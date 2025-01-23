import React from 'react';
import { X, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback } from '../utils/telegram';
import { useEffect } from 'react';
import { useWindowSize } from '../hooks/useWindowSize';

interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const windowSize = useWindowSize();

  // Lock body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('light');
    window.open(src, '_blank');
  };

  const handleClose = () => {
    hapticFeedback('light');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg overscroll-none touch-none"
      onClick={handleClose}
      style={{ 
        transform: 'translate3d(0,0,0)', 
        willChange: 'transform',
        touchAction: 'none'
      }}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-[101]"
        >
          <Download className="w-6 h-6" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClose}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-[101]"
        >
          <X className="w-6 h-6" />
        </motion.button>
      </div>

      <motion.img
        key={src}
        src={src}
        alt={alt}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="max-w-[95vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg select-none touch-none"
        onClick={(e) => e.stopPropagation()}
        style={{
          touchAction: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          pointerEvents: 'none'
        }}
        draggable={false}
      />
    </motion.div>
  );
}