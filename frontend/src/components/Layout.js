import React from 'react';
import { Container } from 'react-bootstrap';
import Header from './Header';

function Layout({ children }) {
  return (
    <>
      <Header />
      <Container fluid className="mt-3">
        {children}
      </Container>
    </>
  );
}

export default Layout;