// // import React from 'react';
// // import { Col, Container } from 'react-bootstrap';
// // import { useAgents } from '../contexts/AgentContext';
// // import AgentColumn from './AgentColumn';

// // function AgentColumns() {
// //   const { agents, addAgent, removeAgent, updateAgent } = useAgents();

// //   if (!agents) {
// //     return null;
// //   }

// //   const aiAgents = agents.filter(agent => agent.type === 'ai');

// //   return (
// //     <>
// //       {aiAgents.map((agent, index) => (
// //         <div key={agent.id} className="column">
// //           <AgentColumn
// //             agent={agent}
// //             onRemove={() => removeAgent(agent.id)}
// //             onAdd={addAgent}
// //             isOnlyColumn={aiAgents.length === 1}
// //             isLeftmostAgent={index === 0}
// //             isRightmostAgent={index === aiAgents.length - 1}
// //             onUpdateAgent={(updates) => updateAgent(agent.id, updates)}
// //           />
// //         </div>
// //       ))}
// //     </>
// //   );
// // }

// // export default AgentColumns;



// import React from 'react';
// import { Col, Row, Container } from 'react-bootstrap';
// import { useAgents } from '../contexts/AgentContext';
// import AgentColumn from './AgentColumn';

// function AgentColumns() {
//   const { agents, addAgent, removeAgent, updateAgent } = useAgents();

//   if (!agents) {
//     return null;
//   }

//   const aiAgents = agents.filter(agent => agent.type === 'ai');
//   const groupedAgents = aiAgents.reduce((acc, agent) => {
//     if (!acc[agent.position]) {
//       acc[agent.position] = [];
//     }
//     acc[agent.position].push(agent);
//     return acc;
//   }, {});

//   const sortedPositions = Object.keys(groupedAgents).sort((a, b) => Number(a) - Number(b));

//   return (
//     <Container className="h-100">
//       <Row className="h-100">
//         {sortedPositions.map((position) => {
//           const agentsInPosition = groupedAgents[position];
//           const rowHeight = Math.floor(12 / agentsInPosition.length);
//           console.log(position, rowHeight, agentsInPosition);
          
//           return (
//             // <Col key={position} className="agent-col useragent-col p-0"> h-${rowHeight}
//             <div key={position} className="column">
//               {agentsInPosition.map((agent, index) => (
//                 <Row key={agent.id} className={`agent-row`}>  
//                   <Col className="h-100 p-0 useragent-col agent-col">
//                     <AgentColumn
//                       agent={agent}
//                       onRemove={() => removeAgent(agent.id)}
//                       onAdd={addAgent}
//                       isOnlyColumn={aiAgents.length === 1}
//                       isLeftmostAgent={position === sortedPositions[0]}
//                       isRightmostAgent={position === sortedPositions[sortedPositions.length - 1]}
//                       onUpdateAgent={(updates) => updateAgent(agent.id, updates)}
//                     />
//                   </Col>
//                 </Row>
//               ))}
//             </div>
//           );
//         })}
//       </Row>
//     </Container>
//   );
// }

// export default AgentColumns;