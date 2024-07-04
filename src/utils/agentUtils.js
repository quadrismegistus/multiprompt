
export function normalizePositions(agents) {
  // Extract the positions from the agents and sort them
  let positions = agents.map(agent => agent.position);
  positions.sort((a, b) => a - b);

  // Create a mapping from position to dense rank
  let rankMap = new Map();
  let rank = 1;
  
  for (let i = 0; i < positions.length; i++) {
      if (!rankMap.has(positions[i])) {
          rankMap.set(positions[i], rank);
          rank++;
      }
  }

  // Update the agents with their dense ranks
  agents.forEach(agent => {
      agent.position = rankMap.get(agent.position);
  });

  return agents;
}