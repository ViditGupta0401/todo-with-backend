import React from 'react';
import { motion } from 'framer-motion';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

const Popup: React.FC<PopupProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
        className={`relative bg-[#232228] rounded-2xl shadow-2xl p-5 w-full ${maxWidth} mx-auto`}
      >
        {title && (
          <div className="mb-4 pb-2 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">{title}</h3>
          </div>
        )}
        
        {showCloseButton && (
          <button
            className="absolute top-3 right-3 z-60 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700/50 transition-colors shadow-[0_2px_8px_0_rgba(255,255,255,0.25)]"
            style={{ zIndex: 60 }}
            onClick={onClose}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        <div className="text-white">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default Popup;