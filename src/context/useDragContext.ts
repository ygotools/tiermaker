import { createContext, useContext } from 'react';

export type DragContextProps = {
  isDragging: boolean;
  setDragging: (dragging: boolean) => void;
}

export const DragContext = createContext<DragContextProps | undefined>(undefined);

export const useDragContext = () => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext must be used within a DragProvider');
  }
  return context;
};
