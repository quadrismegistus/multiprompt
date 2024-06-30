import React from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';

function Header({ onConfigClick }) {
  return (
    <Navbar bg="light" expand="lg">
      <Navbar.Brand href="#home">Multiprompt</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
        <Nav>
          <Button variant="primary" onClick={onConfigClick}>Config</Button>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default Header;