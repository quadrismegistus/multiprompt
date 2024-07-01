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
  <Navbar expand="lg" className="bg-white dark:bg-gray-800 shadow-md">
      <Container fluid className="flex justify-between items-center">
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Brand className="text-xl font-bold text-center text-black dark:text-white">Multiprompt</Navbar.Brand>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Button 
              variant="link" 
              onClick={toggleTheme} 
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white" 
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </Button>
            <Button 
              variant="link" 
              onClick={onConfigClick} 
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white" 
              title="Configuration"
            >
              <Settings size={24} />
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;