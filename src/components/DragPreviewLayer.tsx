import React from 'react';
import { useDragLayer } from 'react-dnd';
import { Deck } from '../types';

type DragItem = {
  deck: Deck;
};

const layerStyles: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
};

const DragPreviewLayer: React.FC = () => {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as DragItem | null,
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !item?.deck || !currentOffset) {
    return null;
  }

  return (
    <div style={layerStyles} aria-hidden="true">
      <div
        style={{
          transform: `translate(${currentOffset.x - 80}px, ${currentOffset.y - 45}px)`,
        }}
      >
        <div className="relative overflow-hidden rounded-sm border border-blue-400/80 shadow-2xl">
          <img src={item.deck.image} alt="" className="h-[90px] w-[160px] object-cover opacity-90" />
          <span className="absolute bottom-0 left-0 block w-full bg-[#000000cc] p-1 text-center text-sm font-bold text-white">
            {item.deck.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DragPreviewLayer;
