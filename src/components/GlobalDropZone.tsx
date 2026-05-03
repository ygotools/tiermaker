import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Deck } from '../types';

type GlobalDropZoneProps = {
  moveDeckToAvailableDecks: (deck: Deck, sourceTierIndex: number) => void;
  children: React.ReactNode;
}

type DeckDropItem = {
  deck: Deck;
  index: number;
  tierIndex: number;
}

const GlobalDropZone: React.FC<GlobalDropZoneProps> = ({ moveDeckToAvailableDecks, children }) => {
  const globalDropRef = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<DeckDropItem>({
    accept: 'deck',
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        const { deck, tierIndex } = item;
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
