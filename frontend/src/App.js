import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { AgentProvider } from './contexts/AgentContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { LLMProvider } from './contexts/LLMProvider';
import Layout from './components/Layout';
import AgentColumns from './components/AgentColumns';
import UserColumn from './components/UserColumn';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/index.css';

function App() {
  return (
    <ConfigProvider>
      <LLMProvider>
        <AgentProvider>
          <Layout>
            <Container fluid>
              <Row className='BigRow'>
                  <UserColumn />
                  <AgentColumns />
              </Row>
            </Container>
          </Layout>
        </AgentProvider>
      </LLMProvider>
    </ConfigProvider>
  );
}

export default App;