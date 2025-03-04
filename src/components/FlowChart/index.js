import React, { useState, useCallback } from 'react';
import ReactFlow, { addEdge, useReactFlow } from 'reactflow';
import { useConnections } from './hooks/useConnections';
import CustomNode from './nodes/CustomNode';
import 'reactflow/dist/style.css';

const nodeTypes = {
  custom: CustomNode
};

const FlowChart = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const reactFlowInstance = useReactFlow();

  const { isValidConnection, onConnectStart, onConnectEnd } = useConnections(nodes, setNodes, setEdges);

  const onConnect = useCallback((connection) => {
    if (isValidConnection(connection)) {
      setEdges((eds) => addEdge(connection, eds));
    }
  }, [isValidConnection]);

  const onNodeChange = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, []);

  const onNodeDelete = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        fitView
      />
    </div>
  );
};

export default FlowChart; 