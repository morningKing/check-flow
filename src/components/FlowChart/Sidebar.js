import React from 'react';
import { NODE_TYPES } from './constants';

const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('nodeType', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="sidebar">
      {Object.entries(NODE_TYPES).map(([type, config]) => {
        const Icon = config.icon;
        return (
          <div
            key={type}
            className="node-item"
            draggable
            onDragStart={(e) => onDragStart(e, type)}
          >
            <Icon style={{ marginRight: 8 }} />
            {config.label}
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar; 