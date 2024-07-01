import React from 'react';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { Settings, Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

function Header({ onConfigClick }) {
  const dispatch = useDispatch();
  const isDarkMode = useSelector(state => state.config.isDarkMode);

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
    document.documentElement.classList.toggle('dark');
  };

  return (
  <Navbar expand="lg">
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Brand>Multiprompt</Navbar.Brand>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Button 
              variant="link" 
              onClick={toggleTheme} 
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </Button>
            <Button 
              variant="link" 
              onClick={onConfigClick} 
              title="Configuration"
            >
              <Settings size={24} />
            </Button>
          </Nav>
        </Navbar.Collapse>
    </Navbar>
  );
}

export default Header;