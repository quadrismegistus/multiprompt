import React from 'react';
import { Card } from 'react-bootstrap';
import styled from 'styled-components';

const GridLayoutContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.columncount  }, 1fr);
  gap: 0;
  height: 100vh;
  width: 100%;
  overflow-x: auto;
`;

const GridColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const GridItem = styled.div`
  flex: 1;
  min-height: 0;
`;

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
    <GridLayoutContainer columncount={sortedPositions.length}>
      {sortedPositions.map((position) => (
        <GridColumn key={position}>
          {groupedChildren[position].map((child, index) => (
            <GridItem key={index}>
              {child}
            </GridItem>
          ))}
        </GridColumn>
      ))}
    </GridLayoutContainer>
  );
};

const GridCard = ({ columnPosition, children, ...props }) => (
  <Card {...props} style={{ height: '100%', overflow: 'auto' }}>
    {children}
  </Card>
);

export { GridLayout, GridCard };