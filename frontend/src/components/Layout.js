import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import ConfigModal from './ConfigModal';

function Layout({ children }) {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const handleConfigClick = () => {
    setIsConfigModalOpen(true);
  };

  const handleCloseConfigModal = () => {
    setIsConfigModalOpen(false);
  };

  return (
    <Container className='Layout'>
      <div className='Content'>
        {children}
      </div>
      <ConfigModal show={isConfigModalOpen} onHide={handleCloseConfigModal} />
    </Container>
  );
}
export default Layout;