import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import UserCard from "./UserCard";
import AgentCard from "./AgentCard";
import { GridLayout, GridCard } from "./GridLayout";
import IconSidebar from "./IconSidebar";
import useStore from "../store/useStore";

function Layout() {
  const agents = useStore((state) => state.agents);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const totalCost = useStore((state) => state.totalCost);

  const sortedAgents = [...agents].sort((a, b) => a.position - b.position);
  const numCols = sortedAgents.length + 1;

  // Group agents by position
  const agentsByPosition = sortedAgents.reduce((acc, agent) => {
    if (!acc[agent.position]) {
      acc[agent.position] = [];
    }
    acc[agent.position].push(agent);
    return acc;
  }, {});

  return (
    <Container className={`Layout ${isDarkMode ? "dark" : ""}`}>
      <IconSidebar />
      <Col
        key={0}
        style={{ maxWidth: `calc(100vw / ${numCols})` }}
        className="last-in-position agentpos-0"
      >
        <UserCard />
      </Col>
      {Object.entries(agentsByPosition).map(([position, agentsInPosition]) =>
        agentsInPosition.map((agent, index) => (
          <Col
            key={agent.id}
            className={`agentpos-${agent.position} ${
              index === agentsInPosition.length - 1 ? "last-in-position" : ""
            }`}
            style={{ maxWidth: `calc(100vw / ${numCols})` }}
          >
            <AgentCard agent={agent} />
          </Col>
        ))
      )}

      <div style={{ position: "absolute", bottom: 0, right: 2, color: "darkred", fontSize:".8rem" }}>
        Total: ${totalCost.toFixed(4)}
      </div>
    </Container>
  );
}

export default Layout;
