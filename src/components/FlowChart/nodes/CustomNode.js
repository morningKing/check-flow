import React, { useState } from 'react';
import { Card } from 'antd';
import { Handle, Position } from 'reactflow';
import { DeleteOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { NODE_TYPES } from '../constants';

const CustomNode = ({ id, data, onDelete, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const nodeConfig = NODE_TYPES[data?.type] || {
    color: '#f0f0f0',
    borderColor: '#d9d9d9',
    label: '未知节点'
  };

  const handleStyle = {
    background: nodeConfig.borderColor,
    width: '8px',
    height: '8px'
  };

  return (
    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <Card
        size="small"
        title={data?.title || '未命名节点'}
        style={{
          width: ['prerequisite', 'atomicAnalysis', 'preCheck', 'dataModel', 'analysisResult'].includes(data?.type) ? 300 : 200,
          backgroundColor: nodeConfig.color,
          borderColor: nodeConfig.borderColor,
        }}
        extra={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isExpanded ? (
              <UpOutlined
                style={{ color: '#999', cursor: 'pointer' }}
                onClick={() => setIsExpanded(false)}
              />
            ) : (
              <DownOutlined
                style={{ color: '#999', cursor: 'pointer' }}
                onClick={() => setIsExpanded(true)}
              />
            )}
            <DeleteOutlined
              style={{ color: '#999', cursor: 'pointer' }}
              onClick={() => onDelete(id)}
            />
          </div>
        }
      >
        {React.cloneElement(data.form, { isExpanded, onChange: (newData) => onChange(id, newData) })}
      </Card>
      <Handle type="target" position={Position.Top} id={`${id}-top`} style={handleStyle} />
      <Handle type="target" position={Position.Left} id={`${id}-left`} style={handleStyle} />
      <Handle type="source" position={Position.Right} id={`${id}-right`} style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id={`${id}-bottom`} style={handleStyle} />
    </div>
  );
};

export default CustomNode; 