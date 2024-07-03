import React from 'react';
import { Settings, History, Trash2, Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import { clearAgentCache, toggleTheme, showModal } from '../redux/actions';

function IconSidebar() {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.config.isDarkMode);

  const handleClearAgentCache = () => {
    dispatch(clearAgentCache());
  };

  const handleShowModal = (modalType) => {
    dispatch(showModal(modalType));
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
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
