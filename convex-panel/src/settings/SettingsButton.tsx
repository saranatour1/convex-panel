

import React, { useState, useCallback } from 'react';
import SettingsModal, { ConvexPanelSettings } from './SettingsModal';

interface SettingsButtonProps {
  onSettingsChange: (settings: ConvexPanelSettings) => void;
  theme?: Record<string, any>;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ 
  onSettingsChange,
  theme = {}
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);
  
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  
  return (
    <>
      <button
        onClick={openModal}
        className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Settings"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
      
      {isModalOpen && (
        <div 
          className="fixed z-50" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            className="absolute inset-0 bg-black/80 bg-opacity-30" 
            onClick={closeModal}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          ></div>
          <div className="z-10 w-[600px] max-w-[90%]">
            <SettingsModal
              isOpen={isModalOpen}
              onClose={closeModal}
              onSettingsChange={onSettingsChange}
              theme={theme}
              containerized={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsButton; 