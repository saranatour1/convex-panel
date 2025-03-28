import React, { useState, useCallback } from 'react';
import SettingsModal from './SettingsModal';
import { SettingsIcon } from '../components/icons';
import { ConvexPanelSettings } from '../types';

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
        className="convex-panel-settings-button"
        title="Settings"
      >
        <SettingsIcon />
      </button>
      
      {isModalOpen && (
        <div 
          className="convex-panel-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}
        >
          <div 
            className="convex-panel-modal-backdrop"
            onClick={closeModal}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          ></div>
          <div className="convex-panel-modal-container">
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