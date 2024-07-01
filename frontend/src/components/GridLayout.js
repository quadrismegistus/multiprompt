import React from 'react';
import { Card } from 'react-bootstrap';

const GridLayout = ({ children }) => {
  // Group children by their columnPosition
  const groupedChildren = React.Children.toArray(children).reduce((acc, child) => {
    const position = child.props.columnPosition || 0;
    if (!acc[position]) acc[position] = [];
    acc[position].push(child);
    return acc;
  }, {});

  // Sort positions
  const sortedPositions = Object.keys(groupedChildren).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="grid-layout">
      {sortedPositions.map((position) => (
        <div key={position} className="grid-column">
          {groupedChildren[position].map((child, index) => (
            <div key={index} className="grid-item">
              {child}
            </div>
          ))}
        </div>
      ))}
      <style jsx>{`
        .grid-layout {
          display: grid;
          grid-template-columns: repeat(${sortedPositions.length}, 1fr);
          gap: 0;
          height: 100vh;
          width: 100%;
          overflow-x: auto;
        }
        .grid-column {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .grid-item {
          flex: 1;
          min-height: 0;
        }
      `}</style>
    </div>
  );
};

const GridCard = ({ columnPosition, children, ...props }) => (
  <Card {...props} style={{ height: '100%', overflow: 'auto' }}>
    {children}
  </Card>
);

export { GridLayout, GridCard };