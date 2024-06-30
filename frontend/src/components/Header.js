import React from 'react';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { Settings } from 'lucide-react';

function Header({ onConfigClick }) {
  return (
    <Navbar bg="light" expand="lg">
      <Container fluid className="d-flex justify-content-between align-items-center">
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Brand className="mx-auto">Multiprompt</Navbar.Brand>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Button 
              variant="link" 
              onClick={onConfigClick} 
              className="p-0" 
              title="Configuration"
            >
              <Settings size={24} color="royalblue" />
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;