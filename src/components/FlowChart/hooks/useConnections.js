import { useCallback } from 'react';
import { message } from 'antd';

export const useConnections = (nodes, setNodes, setEdges) => {
  const isValidConnection = useCallback((connection) => {
    const { source, target } = connection;
    const sourceNode = nodes.find(node => node.id === source);
    const targetNode = nodes.find(node => node.id === target);

    if (!sourceNode || !targetNode) return false;

    // 前置检查节点的连接规则
    if (sourceNode.data.type === 'prerequisite') {
      if (targetNode.data.type !== 'preCheck') {
        message.error('前置检查节点只能连接到执行前检查节点');
        return false;
      }
      return true;
    }

    // 执行前检查节点的连接规则
    if (sourceNode.data.type === 'preCheck') {
      if (targetNode.data.type !== 'atomicAnalysis' && targetNode.data.type !== 'analysisResult') {
        message.error('执行前检查节点只能连接到分析原子节点或分析结果节点');
        return false;
      }
      return true;
    }

    // 数据模型节点的连接规则
    if (sourceNode.data.type === 'dataModel') {
      if (targetNode.data.type !== 'atomicAnalysis' && targetNode.data.type !== 'dataModel') {
        message.error('数据模型节点只能连接到分析原子节点或其他数据模型节点');
        return false;
      }
      return true;
    }

    return true;
  }, [nodes]);

  const onConnectStart = useCallback((event, { nodeId }) => {
    const sourceNode = nodes.find(node => node.id === nodeId);
    if (!sourceNode) return;

    setNodes((nds) => nds.map((node) => ({
      ...node,
      style: {
        ...node.style,
        opacity: getNodeOpacity(sourceNode, node)
      }
    })));
  }, [nodes]);

  const onConnectEnd = useCallback(() => {
    setNodes((nds) => nds.map((node) => ({
      ...node,
      style: {
        ...node.style,
        opacity: 1
      }
    })));
  }, []);

  return {
    isValidConnection,
    onConnectStart,
    onConnectEnd
  };
};

function getNodeOpacity(sourceNode, targetNode) {
  switch (sourceNode.data.type) {
    case 'prerequisite':
      return targetNode.data.type === 'preCheck' ? 1 : 0.2;
    case 'preCheck':
      return (targetNode.data.type === 'atomicAnalysis' || targetNode.data.type === 'analysisResult') ? 1 : 0.2;
    case 'dataModel':
      return (targetNode.data.type === 'atomicAnalysis' || targetNode.data.type === 'dataModel') ? 1 : 0.2;
    default:
      return 1;
  }
} 