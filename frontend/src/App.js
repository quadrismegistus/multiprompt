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
              <Row>
                <Col md={3}>
                  <UserColumn />
                </Col>
                <Col md={9}>
                  <AgentColumns />
                </Col>
              </Row>
            </Container>
          </Layout>
        </AgentProvider>
      </LLMProvider>
    </ConfigProvider>
  );
}

export default App;