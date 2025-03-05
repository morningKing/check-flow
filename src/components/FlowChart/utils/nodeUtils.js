export const getInitialNodeData = (nodeType) => {
  const baseData = {
    title: NODE_TYPES[nodeType].label,
    type: nodeType,
  };

  switch (nodeType) {
    case 'dataModel':
      return {
        ...baseData,
        modelId: '',
        parseType: 'dump_table_value',
        command: '',           // 添加命令字段
        parameters: '',        // 添加参数字段
        startMark: '',
        endMark: '',
        lineRegex: '',
        tableHeader: '',
        extraOperation: '',
        joinType: 'left_join',
        joinFields: ''
      };
    // ... 其他节点类型的初始化数据
    default:
      return baseData;
  }
}; 