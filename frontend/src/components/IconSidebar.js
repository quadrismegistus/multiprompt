import React from 'react';
import { Settings, History, Trash2, Sun, Moon } from 'lucide-react';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import useStore from '../store/useStore';

function IconSidebar() {
  const clearAgentCache = useStore(state => state.clearAgentCache);
  const showModal = useStore(state => state.showModal);
  const toggleTheme = useStore(state => state.toggleTheme);
  const isDarkMode = useStore(state => state.config.isDarkMode);

  const handleClearAgentCache = () => {
    clearAgentCache();
  };

  const handleShowModal = (modalType) => {
    showModal(modalType);
  };

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const renderTooltip = (content) => (
    <Tooltip id={`tooltip-${content.replace(/\s+/g, '-').toLowerCase()}`}>
      {content}
    </Tooltip>
  );

  const iconSize = 24;
  const iconColor = 'currentColor';

  return (
    <div className="icon-sidebar">
      <OverlayTrigger placement="right" overlay={renderTooltip("Settings")}>
        <button 
          className="icon-btn" 
          onClick={() => handleShowModal('config')}
          aria-label="Open settings"
        >
          <Settings size={iconSize} color={iconColor} />
        </button>
      </OverlayTrigger>

      <OverlayTrigger placement="right" overlay={renderTooltip("Clear Agent Cache")}>
        <button 
          className="icon-btn" 
          onClick={handleClearAgentCache}
          aria-label="Clear agent cache"
        >
          <Trash2 size={iconSize} color={iconColor} />
        </button>
      </OverlayTrigger>

      <OverlayTrigger placement="right" overlay={renderTooltip(isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode")}>
        <button 
          className="icon-btn" 
          onClick={handleToggleTheme}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun size={iconSize} color={iconColor} /> : <Moon size={iconSize} color={iconColor} />}
        </button>
      </OverlayTrigger>

      <OverlayTrigger placement="right" overlay={renderTooltip("Show History")}>
        <button 
          className="icon-btn" 
          onClick={() => handleShowModal('history')}
          aria-label="Show conversation history"
        >
          <History size={iconSize} color={iconColor} />
        </button>
      </OverlayTrigger>
    </div>
  );
}

export default IconSidebar;