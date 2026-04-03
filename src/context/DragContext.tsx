import React, { useState } from 'react';
import { DragContext } from './useDragContext';

export const DragProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragging, setDragging] = useState(false);

  return (
    <DragContext.Provider value={{ isDragging, setDragging }}>
      {children}
    </DragContext.Provider>
  );
};
