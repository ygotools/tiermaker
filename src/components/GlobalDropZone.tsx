import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Deck } from '../types';

type GlobalDropZoneProps = {
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number) => void;
  children: React.ReactNode;
}

const GlobalDropZone: React.FC<GlobalDropZoneProps> = ({ moveDeckToAvailableDecks, children }) => {
  const globalDropRef = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: 'deck',
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        const { deck, tierIndex } = item as { deck: Deck; tierIndex: number };
        if (tierIndex >= 0) {
          moveDeckToAvailableDecks(deck, tierIndex);
        }
      }
    },
  });

  drop(globalDropRef);

  return (
    <div ref={globalDropRef}>
      {children}
    </div>
  );
};

export default GlobalDropZone;
