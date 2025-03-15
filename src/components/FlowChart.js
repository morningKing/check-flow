import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { 
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import { Card, Button, Space, Layout, Input, Form, Radio, Divider, Select, Tabs, Table } from 'antd';
import { DeleteOutlined, UpOutlined, DownOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import 'reactflow/dist/style.css';

const { Content } = Layout;

// 节点类型配置
const NODE_TYPES = {
  prerequisite: {
    label: '前置条件',
    color: '#e6f4ff',  // 浅蓝色背景
    borderColor: '#69b1ff',  // 深蓝色边框
    icon: '📋'
  },
  preCheck: {
    label: '执行前检查',
    color: '#fff7e6',  // 浅橙色背景
    borderColor: '#ffd591',  // 深橙色边框
    icon: '🔍'
  },
  atomicAnalysis: {
    label: '分析原子',
    color: '#f6ffed',  // 浅绿色背景
    borderColor: '#b7eb8f',  // 深绿色边框
    icon: '⚛️'
  },
  analysisResult: {
    label: '分析结果',
    color: '#f9f0ff',
    borderColor: '#d3adf7',
    icon: '📊'
  },
  analysisResource: {
    label: '分析资源',
    color: '#fff2f0',  // 浅红色背景
    borderColor: '#ffccc7',  // 深红色边框
    icon: '📊'
  },
  dataModel: {
    label: '数据模型',
    color: '#e6fffb',  // 浅青色背景
    borderColor: '#87e8de',  // 深青色边框
    icon: '💾'
  }
};

// 修改分析类型常量格式以适配 Select 组件
const ANALYSIS_TYPE_OPTIONS = [
  { label: '表达式分析', value: 'expression' },
  { label: '原始分析', value: 'raw' },
  { label: '定制分析', value: 'custom' }
];

// 自定义边
const CustomEdge = ({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data, markerEnd }) => {
  // 获取源节点和目标节点
  const reactFlowInstance = useReactFlow();
  const nodes = reactFlowInstance.getNodes();
  const sourceNode = nodes.find(node => node.id === source);
  const targetNode = nodes.find(node => node.id === target);
  
  // 默认样式
  let edgeStyle = {
    ...style,
    strokeWidth: 2,
    stroke: '#666'
  };
  
  let edgePath = '';
  
  // 根据节点类型设置不同的连线样式
  if (sourceNode && targetNode) {
    const sourceType = sourceNode.data?.type;
    const targetType = targetNode.data?.type;
    
    // 数据模型指向分析原子的连接
    if (sourceType === 'dataModel' && targetType === 'atomicAnalysis') {
      edgeStyle = {
        ...edgeStyle,
        stroke: '#FFEB3B',  // 黄色
        strokeWidth: 3,
        strokeDasharray: '5,5'  // 虚线效果
      };
    }
    // 前置条件和执行前检查的连接
    else if (sourceType === 'prerequisite' && targetType === 'preCheck') {
      edgeStyle = {
        ...edgeStyle,
        stroke: '#1890FF',  // 蓝色
        strokeWidth: 2
      };
    }
    // 执行前检查和分析原子的连接
    else if (sourceType === 'preCheck' && targetType === 'atomicAnalysis') {
      edgeStyle = {
        ...edgeStyle,
        stroke: '#52C41A',  // 绿色
        strokeWidth: 2
      };
    }
    // 分析原子和分析结果的连接
    else if (sourceType === 'atomicAnalysis' && targetType === 'analysisResult') {
      edgeStyle = {
        ...edgeStyle,
        stroke: '#722ED1',  // 紫色
        strokeWidth: 2
      };
    }
    // 分析结果和分析资源的连接
    else if (sourceType === 'analysisResult' && targetType === 'analysisResource') {
      edgeStyle = {
        ...edgeStyle,
        stroke: '#F5222D',  // 红色
        strokeWidth: 2
      };
    }
  }
  
  // 计算路径点
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;
  
  // 使用贝塞尔曲线创建更平滑的路径
  const controlPointX1 = sourceX + deltaX * 0.25;
  const controlPointY1 = sourceY + deltaY * 0.1;
  const controlPointX2 = sourceX + deltaX * 0.75;
  const controlPointY2 = targetY - deltaY * 0.1;
  
  edgePath = `M ${sourceX} ${sourceY} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${targetX} ${targetY}`;
  
  return (
    <g>
      <path 
        id={id} 
        style={edgeStyle} 
        className="react-flow__edge-path" 
        d={edgePath} 
        markerEnd={markerEnd}
      />
      {/* 添加过渡效果的路径 */}
      {edgeStyle.animated && (
        <path
          style={{
            ...edgeStyle,
            strokeWidth: 1,
            strokeDasharray: '5,10',
            strokeDashoffset: 0,
            animation: 'flow 0.5s linear infinite'
          }}
          className="react-flow__edge-path-animated"
          d={edgePath}
        />
      )}
    </g>
  );
};

// 主组件
const FlowChart = () => {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [clipboard, setClipboard] = useState(null);
  const [prerequisiteData, setPrerequisiteData] = useState([]);
  const [preCheckData, setPreCheckData] = useState([]);
  const [atomicAnalysisData, setAtomicAnalysisData] = useState([]);
  const [analysisResultData, setAnalysisResultData] = useState([]);
  const [analysisResourceData, setAnalysisResourceData] = useState([]);
  const [dataModelData, setDataModelData] = useState([]); // 添加数据模型表格数据状态
  const [bottomHeight, setBottomHeight] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('prerequisite'); // 添加活动标签页状态
  const [selectedNodeId, setSelectedNodeId] = useState(null); // 添加选中节点ID状态
  const [showRightPanel, setShowRightPanel] = useState(true); // 添加右侧面板显示状态
  const [nodesExpanded, setNodesExpanded] = useState(true); // 添加节点折叠状态


const handleNodeDataChange = useCallback((nodeId, field, value) => {
  console.log('节点表单数据变化:', nodeId, field, value);
  
  // 更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === nodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
  
  // 同步更新表格数据
  setPrerequisiteData(prev => prev.map(item => {
    if (item.key === nodeId) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
}, []);

// 在自定义节点组件中添加表单字段变化处理
const PrerequisiteForm = ({ data, onChange, isExpanded }) => {
  const handleFormChange = (field, value) => {
    // 更新本地数据
    const newData = {
      ...data,
      [field]: value
    };
    
    // 调用父组件传入的 onChange
    onChange(newData);
    
    // 同步更新到表格
    handleNodeDataChange(data.id, field, value);
  };
  
  return (
    <div>
      <Form.Item label="用例ID" style={{ marginBottom: 8 }}>
        <Input
          placeholder="请输入用例ID"
          value={data.caseId || ''}
          onChange={(e) => handleFormChange('caseId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </Form.Item>
      {isExpanded && (
        <>
          <Form.Item label="是否生效" style={{ marginBottom: 8 }}>
            <Select
              value={data.isEnabled === undefined ? true : data.isEnabled}
              onChange={(value) => handleFormChange('isEnabled', value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              options={[
                { label: '是', value: true },
                { label: '否', value: false }
              ]}
              defaultValue={true}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="设备前置条件" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入设备前置条件"
              value={data.devicePrerequisite || ''}
              onChange={(e) => handleFormChange('devicePrerequisite', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoSize={{ minRows: 1, maxRows: 3 }}
            />
          </Form.Item>
          <Form.Item label="子架前置条件" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入子架前置条件"
              value={data.subRackPrerequisite || ''}
              onChange={(e) => handleFormChange('subRackPrerequisite', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoSize={{ minRows: 1, maxRows: 3 }}
            />
          </Form.Item>
          <Form.Item label="单板前置条件" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入单板前置条件"
              value={data.boardPrerequisite || ''}
              onChange={(e) => handleFormChange('boardPrerequisite', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoSize={{ minRows: 1, maxRows: 3 }}
            />
          </Form.Item>
        </>
      )}
    </div>
  );
};

// 处理表格数据编辑
const handleTableCellEdit = useCallback((key, field, value) => {
  // 更新表格数据
  setPrerequisiteData(prev => prev.map(item => {
    if (item.key === key) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
  
  // 同步更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === key) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value
        }
      };
    }
    return node;
  }));
}, []);

// 添加分析原子节点数据变化处理函数
const handleAtomicAnalysisNodeDataChange = useCallback((nodeId, field, value) => {
  console.log('分析原子节点表单数据变化:', nodeId, field, value);
  
  // 更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === nodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
  
  // 同步更新表格数据
  setAtomicAnalysisData(prev => prev.map(item => {
    if (item.key === nodeId) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
}, []);

// 添加分析原子表单组件
const AtomicAnalysisForm = ({ data, onChange, isExpanded, nodeId }) => {
  const handleChange = (field, value) => {
    // 更新本地数据
    const newData = {
      ...data,
      [field]: value
    };
    
    // 调用父组件传入的 onChange
    onChange(newData);
    
    // 同步更新到表格
    handleAtomicAnalysisNodeDataChange(nodeId || data.id, field, value);
  };

  return (
    <div>
      <Form.Item label="原子ID" style={{ marginBottom: 8 }}>
        <Input
          placeholder="请输入原子ID"
          value={data.atomicId || ''}
          onChange={(e) => handleChange('atomicId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </Form.Item>
      {isExpanded && (
        <>
          <Form.Item label="分析类型" style={{ marginBottom: 8 }}>
            <Select
              value={data.analysisType}
              onChange={(value) => handleChange('analysisType', value)}
              onClick={(e) => e.stopPropagation()}
              options={ANALYSIS_TYPE_OPTIONS}
              style={{ width: '100%' }}
              placeholder="请选择分析类型"
            />
          </Form.Item>
          <Form.Item label="忽略结果" style={{ marginBottom: 8 }}>
            <Radio.Group
              value={data.ignoreResult}
              onChange={(e) => handleChange('ignoreResult', e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <Radio value={true}>是</Radio>
              <Radio value={false}>否</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="分析规则" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入分析规则"
              value={data.analysisRule || ''}
              onChange={(e) => handleChange('analysisRule', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="参数刷新" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入参数刷新"
              value={data.parameterRefresh || ''}
              onChange={(e) => handleChange('parameterRefresh', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
        </>
      )}
    </div>
  );
};

// 处理分析原子表格数据编辑
const handleAtomicAnalysisTableCellEdit = useCallback((key, field, value) => {
  // 更新表格数据
  setAtomicAnalysisData(prev => prev.map(item => {
    if (item.key === key) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
  
  // 同步更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === key) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
}, []);

// 添加执行前检查节点数据变化处理函数
const handlePreCheckNodeDataChange = useCallback((nodeId, field, value) => {
  console.log('执行前检查节点表单数据变化:', nodeId, field, value);
  
  // 更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === nodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
  
  // 同步更新表格数据
  setPreCheckData(prev => prev.map(item => {
    if (item.key === nodeId) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
}, []);

// 添加执行前检查表单组件
const PreCheckForm = ({ data, onChange, isExpanded, nodeId }) => {
  const handleChange = (field, value) => {
    // 更新本地数据
    const newData = {
      ...data,
      [field]: value
    };
    
    // 调用父组件传入的 onChange
    onChange(newData);
    
    // 同步更新到表格
    handlePreCheckNodeDataChange(nodeId || data.id, field, value);
  };

  return (
    <div>
      <Form.Item label="分析项ID" style={{ marginBottom: 8 }}>
        <Input
          placeholder="请输入分析项ID"
          value={data.analysisItemId || ''}
          onChange={(e) => handleChange('analysisItemId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </Form.Item>
      {isExpanded && (
        <Form.Item label="检查条件" style={{ marginBottom: 8 }}>
          <Input.TextArea
            placeholder="请输入检查条件"
            value={data.checkCondition || ''}
            onChange={(e) => handleChange('checkCondition', e.target.value)}
            autoSize={{ minRows: 1, maxRows: 3 }}
            onClick={(e) => e.stopPropagation()}
          />
        </Form.Item>
      )}
    </div>
  );
};

// 处理执行前检查表格数据编辑
const handlePreCheckTableCellEdit = useCallback((key, field, value) => {
  // 更新表格数据
  setPreCheckData(prev => prev.map(item => {
    if (item.key === key) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
  
  // 同步更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === key) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
}, []);

// 修改数据模型表单组件
const DataModelForm = ({ data, onChange, isExpanded, nodeId }) => {
  const handleChange = (field, value) => {
    // 更新本地数据
    const newData = {
      ...data,
      [field]: value
    };
    
    // 调用父组件传入的 onChange
    onChange(newData);
    
    // 同步更新到表格
    handleDataModelNodeDataChange(nodeId || data.id, field, value);
  };

  // 更新解析类型选项，添加 multi_table_value
  const parseTypeOptions = [
    { label: 'dump_table_value', value: 'dump_table_value' },
    { label: 'custom_table_value', value: 'custom_table_value' },
    { label: 'chipreg_table_value', value: 'chipreg_table_value' },
    { label: 'multi_table_value', value: 'multi_table_value' },
    { label: 'ctx_table_value', value: 'ctx_table_value' }
  ];

  // 连表方式选项
  const joinTypeOptions = [
    { label: '左连接', value: 'left_join' },
    { label: '右连接', value: 'right_join' },
    { label: '内连接', value: 'inner_join' },
    { label: '外连接', value: 'outer_join' },
    { label: '垂直连接', value: 'vertical_join' }
  ];

  return (
    <div>
      <Form.Item label="模型ID" style={{ marginBottom: 8 }}>
        <Input
          placeholder="请输入模型ID"
          value={data.modelId || ''}
          onChange={(e) => handleChange('modelId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </Form.Item>
      {isExpanded && (
        <>
          <Form.Item label="解析类型" style={{ marginBottom: 8 }}>
            <Select
              placeholder="请选择解析类型"
              value={data.parseType}
              onChange={(value) => handleChange('parseType', value)}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%' }}
              options={parseTypeOptions}
            />
          </Form.Item>
          {/* 命令和参数输入框在 multi_table_value 和 ctx_table_value 类型下都不显示 */}
          {data.parseType !== 'multi_table_value' && data.parseType !== 'ctx_table_value' && (
            <>
              <Form.Item label="命令" style={{ marginBottom: 8 }}>
            <Input.TextArea
                  placeholder="请输入命令"
                  value={data.command || ''}
                  onChange={(e) => handleChange('command', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
              <Form.Item label="参数" style={{ marginBottom: 8 }}>
            <Input.TextArea
                  placeholder="请输入参数"
                  value={data.parameters || ''}
                  onChange={(e) => handleChange('parameters', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
            </>
          )}
          {/* ctx_table_value 类型特有的系统参数输入框 */}
          {data.parseType === 'ctx_table_value' && (
            <>
              <Form.Item label="系统参数" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入系统参数"
                  value={data.systemParams || ''}
                  onChange={(e) => handleChange('systemParams', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
              <Form.Item label="表头" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入表头"
                  value={data.tableHeader || ''}
                  onChange={(e) => handleChange('tableHeader', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
              <Form.Item label="额外操作" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入额外操作"
                  value={data.extraOperation || ''}
                  onChange={(e) => handleChange('extraOperation', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
            </>
          )}
          {/* 其他类型的渲染逻辑保持不变 */}
          {data.parseType === 'dump_table_value' && (
            <>
              <Form.Item label="开始标记" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入开始标记"
                  value={data.startMark || ''}
                  onChange={(e) => handleChange('startMark', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
              <Form.Item label="结束标记" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入结束标记"
                  value={data.endMark || ''}
                  onChange={(e) => handleChange('endMark', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
              <Form.Item label="行正则匹配" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入行正则匹配"
                  value={data.lineRegex || ''}
                  onChange={(e) => handleChange('lineRegex', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
              <Form.Item label="表头" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入表头"
                  value={data.tableHeader || ''}
                  onChange={(e) => handleChange('tableHeader', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
              <Form.Item label="额外操作" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入额外操作"
                  value={data.extraOperation || ''}
                  onChange={(e) => handleChange('extraOperation', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
            </>
          )}
          {data.parseType === 'multi_table_value' && (
            <>
              <Form.Item label="连表方式" style={{ marginBottom: 8 }}>
                <Select
                  placeholder="请选择连表方式"
                  value={data.joinType}
                  onChange={(value) => handleChange('joinType', value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%' }}
                  options={joinTypeOptions}
                />
              </Form.Item>
              <Form.Item label="连表字段" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入连表字段"
                  value={data.joinFields || ''}
                  onChange={(e) => handleChange('joinFields', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
              <Form.Item label="额外操作" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入额外操作"
                  value={data.extraOperation || ''}
                  onChange={(e) => handleChange('extraOperation', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
            </>
          )}
          {(data.parseType === 'custom_table_value' || data.parseType === 'chipreg_table_value') && (
            <>
              <Form.Item label="表头" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入表头"
                  value={data.tableHeader || ''}
                  onChange={(e) => handleChange('tableHeader', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
              <Form.Item label="额外操作" style={{ marginBottom: 8 }}>
                <Input.TextArea
                  placeholder="请输入额外操作"
                  value={data.extraOperation || ''}
                  onChange={(e) => handleChange('extraOperation', e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Form.Item>
            </>
          )}
        </>
      )}
    </div>
  );
};

// 添加分析结果节点数据变化处理函数
const handleAnalysisResultNodeDataChange = useCallback((nodeId, field, value) => {
  console.log('分析结果节点表单数据变化:', nodeId, field, value);
  
  // 更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === nodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
  
  // 同步更新表格数据
  setAnalysisResultData(prev => prev.map(item => {
    if (item.key === nodeId) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
}, []);

// 添加分析结果表单组件
const AnalysisResultForm = ({ data, onChange, isExpanded, nodeId }) => {
  const handleChange = (field, value) => {
    // 更新本地数据
    const newData = {
      ...data,
      [field]: value
    };
    
    // 调用父组件传入的 onChange
    onChange(newData);
    
    // 同步更新到表格
    handleAnalysisResultNodeDataChange(nodeId || data.id, field, value);
  };

  // 严重级别选项
  const severityOptions = [
    { label: '提示', value: 'hint' },
    { label: '不达标', value: 'unqualified' },
    { label: '严重不达标', value: 'severely_unqualified' }
  ];

  return (
    <div>
      <Form.Item label="分析结果ID" style={{ marginBottom: 8 }}>
        <Input
          placeholder="请输入分析结果ID"
          value={data.resultId || ''}
          onChange={(e) => handleChange('resultId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </Form.Item>
      {isExpanded && (
        <>
          <Form.Item label="严重级别" style={{ marginBottom: 8 }}>
            <Select
              placeholder="请选择严重级别"
              value={data.severityLevel}
              onChange={(value) => handleChange('severityLevel', value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              style={{ width: '100%' }}
              options={severityOptions}
            />
          </Form.Item>
          <Form.Item label="权重值" style={{ marginBottom: 8 }}>
            <Input
              placeholder="请输入权重值"
              value={data.weightValue || ''}
              onChange={(e) => handleChange('weightValue', e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="结果输出" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入结果输出"
              value={data.resultOutput || ''}
              onChange={(e) => handleChange('resultOutput', e.target.value)}
              autoSize={{ minRows: 2, maxRows: 4 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="分支条件" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入分支条件"
              value={data.branchCondition || ''}
              onChange={(e) => handleChange('branchCondition', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
        </>
      )}
    </div>
  );
};

// 添加分析资源表单组件
const AnalysisResourceForm = ({ data, onChange, isExpanded, nodeId }) => {
  const handleChange = (field, value) => {
    // 更新本地数据
    const newData = {
      ...data,
      [field]: value
    };
    
    // 调用父组件传入的 onChange
    onChange(newData);
    
    // 同步更新到表格
    handleAnalysisResourceNodeDataChange(nodeId || data.id, field, value);
  };

  return (
    <div>
      <Form.Item label="资源ID" style={{ marginBottom: 8 }}>
        <Input
          placeholder="请输入资源ID"
          value={data.resourceId || ''}
          onChange={(e) => handleChange('resourceId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </Form.Item>
      {isExpanded && (
        <>
          <Form.Item label="当前值(中文)" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入当前值(中文)"
              value={data.chCurrentValue || ''}
              onChange={(e) => handleChange('chCurrentValue', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="处理建议(中文)" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入处理建议(中文)"
              value={data.chSuggestion || ''}
              onChange={(e) => handleChange('chSuggestion', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="当前值(英文)" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入当前值(英文)"
              value={data.enCurrentValue || ''}
              onChange={(e) => handleChange('enCurrentValue', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="处理建议(英文)" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入处理建议(英文)"
              value={data.enSuggestion || ''}
              onChange={(e) => handleChange('enSuggestion', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
        </>
      )}
    </div>
  );
};

// 添加分析资源节点数据变化处理函数
const handleAnalysisResourceNodeDataChange = useCallback((nodeId, field, value) => {
  console.log('分析资源节点表单数据变化:', nodeId, field, value);
  
  // 更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === nodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
  
  // 同步更新表格数据
  setAnalysisResourceData(prev => prev.map(item => {
    if (item.key === nodeId) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
}, []);

// 处理分析资源表格数据编辑
const handleAnalysisResourceTableCellEdit = useCallback((key, field, value) => {
  // 更新表格数据
  setAnalysisResourceData(prev => prev.map(item => {
    if (item.key === key) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
  
  // 同步更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === key) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
}, []);

// 处理分析结果表格数据编辑
const handleAnalysisResultTableCellEdit = useCallback((key, field, value) => {
  // 更新表格数据
  setAnalysisResultData(prev => prev.map(item => {
    if (item.key === key) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
  
  // 同步更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === key) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
}, []);

// 处理数据模型表格数据编辑
const handleDataModelTableCellEdit = useCallback((key, field, value) => {
  console.log('数据模型表格数据编辑:', key, field, value);
  
  // 更新表格数据
  setDataModelData(prev => prev.map(item => {
    if (item.key === key) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
  
  // 同步更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === key) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
}, []);

// 添加空白的分析资源行
const addEmptyAnalysisResourceRow = useCallback(() => {
  // 生成唯一ID
  const id = `analysisResource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // 创建空白数据行
  const newRow = {
    key: id,
    resourceId: '',
    chCurrentValue: '',
    chSuggestion: '',
    enCurrentValue: '',
    enSuggestion: ''
  };
  
  // 添加到表格数据中
  setAnalysisResourceData(prev => [...prev, newRow]);
  
  console.log('已添加空白分析资源行，ID:', id);
  
  return id; // 返回新行的ID，以便后续使用
}, []);

// 添加空白的分析结果行
const addEmptyAnalysisResultRow = useCallback(() => {
  // 生成唯一ID
  const id = `analysisResult-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // 创建空白数据行
  const newRow = {
    key: id,
    resultId: '',
    severityLevel: 'hint',
    weightValue: '',
    resultOutput: '',
    branchCondition: ''
  };
  
  // 添加到表格数据中
  setAnalysisResultData(prev => [...prev, newRow]);
  
  console.log('已添加空白分析结果行，ID:', id);
  
  return id; // 返回新行的ID，以便后续使用
}, []);

// 添加空白的数据模型行
const addEmptyDataModelRow = useCallback(() => {
  // 生成唯一ID
  const id = `dataModel-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // 创建空白数据行
  const newRow = {
    key: id,
    modelId: '',
    parseType: 'dump_table_value',
    command: '',
    parameters: '',
    tableHeader: '',
    startMark: '',
    endMark: '',
    lineRegex: '',
    systemParams: '',
    joinType: 'left_join',
    joinFields: '',
    extraOperation: ''
  };
  
  // 添加到表格数据中
  setDataModelData(prev => [...prev, newRow]);
  
  console.log('已添加空白数据模型行，ID:', id);
  
  return id; // 返回新行的ID，以便后续使用
}, []);

// 添加数据模型节点数据变化处理函数
const handleDataModelNodeDataChange = useCallback((nodeId, field, value) => {
  console.log('数据模型节点表单数据变化:', nodeId, field, value);
  
  // 更新节点数据
  setNodes(nds => nds.map(node => {
    if (node.id === nodeId) {
      return {
        ...node,
        data: {
          ...node.data,
          [field]: value,
          // 保留原有回调函数
          onChange: node.data.onChange,
          onDelete: node.data.onDelete
        }
      };
    }
    return node;
  }));
  
  // 同步更新表格数据
  setDataModelData(prev => prev.map(item => {
    if (item.key === nodeId) {
      return {
        ...item,
        [field]: value
      };
    }
    return item;
  }));
}, []);

// 自定义节点组件
const CustomNode = ({ id, data, onDelete, onChange, selected }) => {
  // 使用外部传入的isExpanded属性，如果未定义则默认为true
  const [isExpanded, setIsExpanded] = useState(data.isExpanded !== undefined ? data.isExpanded : true);
  
  // 当外部数据isExpanded属性改变时更新本地状态
  useEffect(() => {
    if (data.isExpanded !== undefined) {
      setIsExpanded(data.isExpanded);
    }
  }, [data.isExpanded]);
  
  const nodeConfig = NODE_TYPES[data?.type] || {
    color: '#f0f0f0',
    borderColor: '#d9d9d9',
    label: '未知节点'
  };
  
  const handleDataChange = useCallback((nodeId, newData) => {
    console.log('Node data changed:', nodeId, newData);
    onChange(nodeId, newData);
  }, [onChange]);

  const handleStyle = {
    background: nodeConfig.borderColor,
    width: '10px',
    height: '10px',
    border: '2px solid white',
    borderRadius: '50%',
    boxShadow: '0 0 4px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease'
  };

  // 根据节点类型渲染不同的内容
  const renderNodeContent = () => {
    if (!data?.type) return <div>无效节点类型</div>;

    const commonProps = {
      data,
      onChange: (newData) => handleDataChange(id, newData),
      isExpanded,
      nodeId: id // 传递节点ID
    };

    switch (data.type) {
      case 'prerequisite':
        return <PrerequisiteForm {...commonProps} />;
      case 'atomicAnalysis':
        return <AtomicAnalysisForm {...commonProps} />;
      case 'preCheck':
        return <PreCheckForm {...commonProps} />;
      case 'dataModel':
        return <DataModelForm {...commonProps} />;
      case 'analysisResult':
        return <AnalysisResultForm {...commonProps} />;
      case 'analysisResource':
        return <AnalysisResourceForm {...commonProps} />;
      default:
        return <div>{data.description || '无描述'}</div>;
    }
  };

  // 根据选中状态计算边框样式
  const borderStyle = selected 
    ? `3px solid ${nodeConfig.borderColor}` 
    : `1px solid ${nodeConfig.borderColor}`;
  const boxShadow = selected 
    ? `0 0 10px ${nodeConfig.borderColor}` 
    : 'none';

  return (
    <div 
      style={{ position: 'relative' }}
      onClick={e => {
        e.stopPropagation();
        // 点击节点时切换到对应的标签页
        if (data?.type) {
          setActiveTab(data.type);
          setSelectedNodeId(id); // 设置选中节点ID
        }
      }}
    >
      <Card
        size="small"
        title={data?.title || '未命名节点'}
        style={{
          width: ['prerequisite', 'atomicAnalysis', 'preCheck', 'dataModel', 'analysisResult'].includes(data?.type) ? 300 : 200,
          backgroundColor: nodeConfig.color,
          border: borderStyle, // 使用计算的边框样式
          boxShadow: boxShadow, // 添加阴影效果
          transition: 'all 0.2s ease', // 添加过渡效果
        }}
        extra={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isExpanded ? (
              <UpOutlined
                style={{
                  color: '#999',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
              />
            ) : (
              <DownOutlined
                style={{
                  color: '#999',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
              />
            )}
            <DeleteOutlined
              style={{
                color: '#999',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
            />
          </div>
        }
      >
        {renderNodeContent()}
      </Card>
      <Handle type="target" position={Position.Top} id={`${id}-top`} style={handleStyle} />
      <Handle type="target" position={Position.Left} id={`${id}-left`} style={handleStyle} />
      <Handle type="source" position={Position.Right} id={`${id}-right`} style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id={`${id}-bottom`} style={handleStyle} />
    </div>
  );
};

  const onNodesChange = useCallback((changes) => {
    // 先找出要删除的节点
    const nodesToRemove = changes
      .filter(change => change.type === 'remove')
      .map(change => change.id);
    
    // 如果有节点被删除
    if (nodesToRemove.length > 0) {
      console.log('删除的节点:', nodesToRemove);
      
      // 遍历所有将被删除的节点
      nodesToRemove.forEach(nodeId => {
        // 找到要删除的节点
        const nodeToDelete = nodes.find(node => node.id === nodeId);
        
        if (nodeToDelete) {
          console.log('正在删除节点:', nodeToDelete);
          
          // 判断是否是前置条件节点
          const isPrerequisite = 
            nodeToDelete.type === 'prerequisite' || 
            (nodeToDelete.type === 'custom' && nodeToDelete.data?.type === 'prerequisite');
          
          // 如果是前置条件节点，删除表格对应的数据行
          if (isPrerequisite) {
            console.log('删除前置条件表格行:', nodeId);
            
            setPrerequisiteData(prevData => {
              // 过滤掉要删除的节点对应的表格行
              const newData = prevData.filter(item => item.key !== nodeId);
              console.log('删除后前置条件表格数据:', newData);
              return newData;
            });
          }
          
          // 判断是否是执行前检查节点
          const isPreCheck = 
            nodeToDelete.type === 'preCheck' || 
            (nodeToDelete.type === 'custom' && nodeToDelete.data?.type === 'preCheck');
          
          // 如果是执行前检查节点，删除表格对应的数据行
          if (isPreCheck) {
            console.log('删除执行前检查表格行:', nodeId);
            
            setPreCheckData(prevData => {
              // 过滤掉要删除的节点对应的表格行
              const newData = prevData.filter(item => item.key !== nodeId);
              console.log('删除后执行前检查表格数据:', newData);
              return newData;
            });
          }
          
          // 判断是否是分析原子节点
          const isAtomicAnalysis = 
            nodeToDelete.type === 'atomicAnalysis' || 
            (nodeToDelete.type === 'custom' && nodeToDelete.data?.type === 'atomicAnalysis');
          
          // 如果是分析原子节点，删除表格对应的数据行
          if (isAtomicAnalysis) {
            console.log('删除分析原子表格行:', nodeId);
            
            setAtomicAnalysisData(prevData => {
              // 过滤掉要删除的节点对应的表格行
              const newData = prevData.filter(item => item.key !== nodeId);
              console.log('删除后分析原子表格数据:', newData);
              return newData;
            });
          }
          
          // 判断是否是分析结果节点
          const isAnalysisResult = 
            nodeToDelete.type === 'analysisResult' || 
            (nodeToDelete.type === 'custom' && nodeToDelete.data?.type === 'analysisResult');
          
          // 如果是分析结果节点，删除表格对应的数据行
          if (isAnalysisResult) {
            console.log('删除分析结果表格行:', nodeId);
            
            setAnalysisResultData(prevData => {
              // 过滤掉要删除的节点对应的表格行
              const newData = prevData.filter(item => item.key !== nodeId);
              console.log('删除后分析结果表格数据:', newData);
              return newData;
            });
          }
          
          // 判断是否是分析资源节点
          const isAnalysisResource = 
            nodeToDelete.type === 'analysisResource' || 
            (nodeToDelete.type === 'custom' && nodeToDelete.data?.type === 'analysisResource');
          
          // 如果是分析资源节点，删除表格对应的数据行
          if (isAnalysisResource) {
            console.log('删除分析资源表格行:', nodeId);
            
            setAnalysisResourceData(prevData => {
              // 过滤掉要删除的节点对应的表格行
              const newData = prevData.filter(item => item.key !== nodeId);
              console.log('删除后分析资源表格数据:', newData);
              return newData;
            });
          }

          // 判断是否是数据模型节点
          const isDataModel = 
            nodeToDelete.type === 'dataModel' || 
            (nodeToDelete.type === 'custom' && nodeToDelete.data?.type === 'dataModel');
          
          // 如果是数据模型节点，删除表格对应的数据行
          if (isDataModel) {
            console.log('删除数据模型表格行:', nodeId);
            
            setDataModelData(prevData => {
              // 过滤掉要删除的节点对应的表格行
              const newData = prevData.filter(item => item.key !== nodeId);
              console.log('删除后数据模型表格数据:', newData);
              return newData;
            });
          }
        }
      });
    }
    
    // 应用节点变化
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [nodes]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const isValidConnection = useCallback((connection) => {
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // 获取节点类型
    const sourceType = sourceNode.data?.type || sourceNode.type;
    const targetType = targetNode.data?.type || targetNode.type;

    // 如果目标节点是分析结果节点
    if (targetType === 'analysisResult') {
      // 只允许来自执行前检查节点或分析原子节点的连接
      if (sourceType !== 'preCheck' && sourceType !== 'atomicAnalysis') {
        return false;
      }
    }

    // 确保分析原子不能指向数据模型，只能由数据模型指向分析原子
    if (sourceType === 'atomicAnalysis' && targetType === 'dataModel') {
      return false;
    }

    // 数据模型指向分析原子的连接样式
    if (sourceType === 'dataModel' && targetType === 'atomicAnalysis') {
      return {
        valid: true,
        style: { stroke: '#FFEB3B' }
      };
    }

    // 数据模型的其他连接规则
    if (sourceType === 'dataModel') {
      return targetType === 'atomicAnalysis' || targetType === 'dataModel';
    }

    return true;
  }, [nodes]);

  const onConnectStart = useCallback((event, { nodeId, handleType }) => {
    if (!nodeId) return;

    const sourceNode = nodes.find(node => node.id === nodeId);
    if (!sourceNode) return;
    
    // 获取源节点类型
    const sourceType = sourceNode.data?.type || sourceNode.type;
    
    setNodes((nds) =>
      nds.map((node) => {
        // 获取目标节点类型
        const nodeType = node.data?.type || node.type;
        
        // 默认设置为半透明
        let opacity = 0.2;
        
        // 根据不同情况高亮可连接的节点
        if (sourceType === 'dataModel') {
          // 数据模型只能连接到分析原子或其他数据模型
          if (nodeType === 'atomicAnalysis' || nodeType === 'dataModel') {
            opacity = 1;
          }
        } else if (sourceType === 'atomicAnalysis') {
          // 分析原子可以连接到分析结果，但不能连接到数据模型
          if (nodeType === 'analysisResult' && nodeType !== 'dataModel') {
            opacity = 1;
          }
        } else if (sourceType === 'preCheck') {
          // 执行前检查可以连接到分析原子和分析结果
          if (nodeType === 'atomicAnalysis' || nodeType === 'analysisResult') {
            opacity = 1;
          }
        } else if (sourceType === 'prerequisite') {
          // 前置条件可以连接到执行前检查
          if (nodeType === 'preCheck') {
            opacity = 1;
          }
        } else if (sourceType === 'analysisResult') {
          // 分析结果可以连接到分析资源
          if (nodeType === 'analysisResource') {
            opacity = 1;
          }
        }
        
        // 设置不透明度
        return {
          ...node,
          style: { ...node.style, opacity }
        };
      })
    );
  }, [nodes]);

  const onConnectEnd = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        node.style = { ...node.style, opacity: 1 };
        return node;
      })
    );
  }, []);

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(node => node.id === params.source);
    const targetNode = nodes.find(node => node.id === params.target);

    // 根据不同节点类型设置不同的连线样式
    if (sourceNode && targetNode) {
      const sourceType = sourceNode.data?.type;
      const targetType = targetNode.data?.type;
      
      // 数据模型指向分析原子的连接
      if (sourceType === 'dataModel' && targetType === 'atomicAnalysis') {
        params.style = { 
          stroke: '#FFEB3B',  // 黄色
          strokeWidth: 3,
          strokeDasharray: '5,5'  // 虚线效果
        };
      }
      // 前置条件和执行前检查的连接
      else if (sourceType === 'prerequisite' && targetType === 'preCheck') {
        params.style = { 
          stroke: '#1890FF',  // 蓝色
          strokeWidth: 2
        };
      }
      // 执行前检查和分析原子的连接
      else if (sourceType === 'preCheck' && targetType === 'atomicAnalysis') {
        params.style = { 
          stroke: '#52C41A',  // 绿色
          strokeWidth: 2
        };
      }
      // 分析原子和分析结果的连接
      else if (sourceType === 'atomicAnalysis' && targetType === 'analysisResult') {
        params.style = { 
          stroke: '#722ED1',  // 紫色
          strokeWidth: 2
        };
      }
      // 分析结果和分析资源的连接
      else if (sourceType === 'analysisResult' && targetType === 'analysisResource') {
        params.style = { 
          stroke: '#F5222D',  // 红色
          strokeWidth: 2
        };
      }
    }

    setEdges((eds) => addEdge(params, eds));
  }, [nodes]);

  // 添加空白的前置条件行
  const addEmptyPrerequisiteRow = useCallback(() => {
    // 生成唯一ID
    const id = `prerequisite-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 创建空白数据行
    const newRow = {
      key: id,
      caseId: '',
      isEnabled: true,
      devicePrerequisite: '',
      subRackPrerequisite: '',
      boardPrerequisite: ''
    };
    
    // 添加到表格数据中
    setPrerequisiteData(prev => [...prev, newRow]);
    
    console.log('已添加空白前置条件行，ID:', id);
    
    return id; // 返回新行的ID，以便后续使用
  }, []);

  // 添加空白的执行前检查行
  const addEmptyPreCheckRow = useCallback(() => {
    // 生成唯一ID
    const id = `preCheck-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 创建空白数据行
    const newRow = {
      key: id,
      analysisItemId: '',
      checkCondition: ''
    };
    
    // 添加到表格数据中
    setPreCheckData(prev => [...prev, newRow]);
    
    console.log('已添加空白执行前检查行，ID:', id);
    
    return id; // 返回新行的ID，以便后续使用
  }, []);

  // 添加空白的分析原子行
  const addEmptyAtomicAnalysisRow = useCallback(() => {
    // 生成唯一ID
    const id = `atomicAnalysis-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 创建空白数据行
    const newRow = {
      key: id,
      atomicId: '',
      analysisType: 'expression', // 默认表达式分析
      ignoreResult: false,        // 默认不忽略结果
      analysisRule: '',
      parameterRefresh: ''
    };
    
    // 添加到表格数据中
    setAtomicAnalysisData(prev => [...prev, newRow]);
    
    console.log('已添加空白分析原子行，ID:', id);
    
    return id; // 返回新行的ID，以便后续使用
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('nodeType');
      if (!nodeType || !NODE_TYPES[nodeType]) {
        console.error('Invalid node type:', nodeType);
        return;
      }

      const reactFlowBounds = document.querySelector('.react-flow').getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      let initialData = {
        title: NODE_TYPES[nodeType].label,
        type: nodeType,
        description: '双击编辑描述'
      };

      switch (nodeType) {
        case 'prerequisite':
          initialData = {
            ...initialData,
            conditions: {
              device: '',
              subRack: '',
              board: ''
            },
            caseId: '',
            isEnabled: true
          };
          break;
        case 'atomicAnalysis':
          initialData = {
            ...initialData,
            atomicId: '',
            analysisType: 'expression',  // 默认选择表达式分析
            analysisRule: '',
            parameterRefresh: '',
            ignoreResult: false
          };
          break;
        case 'preCheck':
          initialData = {
            ...initialData,
            analysisItemId: '',
            checkCondition: ''
          };
          break;
        case 'dataModel':
          initialData = {
            ...initialData,
            modelId: '',
            parseType: 'dump_table_value',
            command: '',
            parameters: '',
            systemParams: '',  // 添加系统参数字段
            startMark: '',
            endMark: '',
            lineRegex: '',
            tableHeader: '',
            extraOperation: '',
            joinType: 'left_join',
            joinFields: ''
          };
          break;
        case 'analysisResult':
          initialData = {
            ...initialData,
            resultId: '',
            severityLevel: 'hint',       // 默认为提示级别
            weightValue: '',
            resultOutput: '',
            branchCondition: ''
          };
          break;
        case 'analysisResource':
          initialData = {
            ...initialData,
            resourceId: '',
            chCurrentValue: '',   // 中文当前值
            chSuggestion: '',     // 中文处理建议
            enCurrentValue: '',   // 英文当前值
            enSuggestion: ''      // 英文处理建议
          };
          break;
        default:
          console.warn(`未知的节点类型: ${nodeType}`);
          break;
      }

      if (nodeType === 'prerequisite') {
        const rowId = addEmptyPrerequisiteRow()
        initialData = {
          ...initialData,
          id: rowId
        }
        const newNode = {
          id: rowId,
          type: 'custom',
          position,
          data: initialData
        };
        setNodes((nds) => [...nds, newNode]);
      } else if (nodeType === 'preCheck') {
        const rowId = addEmptyPreCheckRow()
        initialData = {
          ...initialData,
          id: rowId
        }
        const newNode = {
          id: rowId,
          type: 'custom',
          position,
          data: initialData
        };
        setNodes((nds) => [...nds, newNode]);
      } else if (nodeType === 'atomicAnalysis') {
        const rowId = addEmptyAtomicAnalysisRow()
        initialData = {
          ...initialData,
          id: rowId
        }
        const newNode = {
          id: rowId,
          type: 'custom',
          position,
          data: initialData
        };
        setNodes((nds) => [...nds, newNode]);
      } else if (nodeType === 'analysisResult') {
        const rowId = addEmptyAnalysisResultRow()
        initialData = {
          ...initialData,
          id: rowId
        }
        const newNode = {
          id: rowId,
          type: 'custom',
          position,
          data: initialData
        };
        setNodes((nds) => [...nds, newNode]);
      } else if (nodeType === 'analysisResource') {
        const rowId = addEmptyAnalysisResourceRow()
        initialData = {
          ...initialData,
          id: rowId
        }
        const newNode = {
          id: rowId,
          type: 'custom',
          position,
          data: initialData
        };
        setNodes((nds) => [...nds, newNode]);
      } else if (nodeType === 'dataModel') {
        const rowId = addEmptyDataModelRow()
        initialData = {
          ...initialData,
          id: rowId
        }
        const newNode = {
          id: rowId,
          type: 'custom',
          position,
          data: initialData
        };
        setNodes((nds) => [...nds, newNode]);
      } else {
        const newNode = {
          id: `node${nodes.length + 1}`,
          type: 'custom',
          position,
          data: initialData
        };
        setNodes((nds) => [...nds, newNode]);
      }
      
    },
    [nodes, reactFlowInstance, addEmptyPrerequisiteRow, addEmptyPreCheckRow, 
     addEmptyAtomicAnalysisRow, addEmptyAnalysisResultRow, addEmptyAnalysisResourceRow,
     addEmptyDataModelRow]
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDeleteNode = useCallback((nodeId) => {
    setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
    setEdges((edges) => edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
  }, []);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData
            }
          };
        }
        return node;
      })
    );
  }, []);

  // 修改nodeTypes定义以传递selected属性
  const nodeTypes = useMemo(
    () => ({
      custom: (props) => (
        <CustomNode
          {...props}
          onDelete={onDeleteNode}
          onChange={updateNodeData}
          selected={props.selected} // 传递selected属性
        />
      ),
    }),
    [onDeleteNode, updateNodeData]
  );

  const filteredNodeTypes = Object.entries(NODE_TYPES).filter(([_, config]) =>
    config.label.toLowerCase().includes(searchText.toLowerCase())
  );

  // 处理键盘事件
  const onKeyDown = useCallback(
    (event) => {
      // 检查是否按下了 Ctrl 键 (Windows) 或 Command 键 (Mac)
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      // 获取选中的节点
      const selectedNodes = nodes.filter(node => node.selected);

      if (isCtrlPressed && event.key === 'c' && selectedNodes.length > 0) {
        // 复制操作
        const nodesToCopy = selectedNodes.map(node => ({
          ...node,
          id: `${node.id}-copy`, // 临时ID，实际粘贴时会更新
          position: { ...node.position },
          data: { ...node.data }
        }));
        setClipboard(nodesToCopy);
        console.log('已复制节点:', nodesToCopy);
        event.preventDefault();
      }

      if (isCtrlPressed && event.key === 'v' && clipboard) {
        // 粘贴操作
        const newNodes = [];
        
        clipboard.forEach((node) => {
          // 获取节点类型
          const nodeType = node.data?.type;
          let rowId;
          
          // 根据节点类型创建相应的表格数据行
          switch (nodeType) {
            case 'prerequisite':
              rowId = addEmptyPrerequisiteRow();
              break;
            case 'preCheck':
              rowId = addEmptyPreCheckRow();
              break;
            case 'atomicAnalysis':
              rowId = addEmptyAtomicAnalysisRow();
              break;
            case 'analysisResult':
              rowId = addEmptyAnalysisResultRow();
              break;
            case 'analysisResource':
              rowId = addEmptyAnalysisResourceRow();
              break;
            case 'dataModel':
              rowId = addEmptyDataModelRow();
              break;
            default:
              rowId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              break;
          }
          
          // 复制节点的数据到新节点
          const newNode = {
            ...node,
            id: rowId,
            position: {
              x: node.position.x + 50, // 偏移位置，避免完全重叠
              y: node.position.y + 50
            },
            selected: false,
            data: {
              ...node.data,
              id: rowId // 更新节点数据中的ID
            }
          };
          
          newNodes.push(newNode);
        });

        setNodes((nds) => [...nds, ...newNodes]);
        console.log('已粘贴节点:', newNodes);
        event.preventDefault();
      }
    },
    [nodes, clipboard, addEmptyPrerequisiteRow, addEmptyPreCheckRow, 
     addEmptyAtomicAnalysisRow, addEmptyAnalysisResultRow, 
     addEmptyAnalysisResourceRow, addEmptyDataModelRow]
  );

  // 添加键盘事件监听
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  // 处理拖动开始
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    e.preventDefault(); // 防止文本选择
  }, []);

  // 处理拖动过程
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    const newHeight = windowHeight - mouseY;
    
    // 限制最小和最大高度
    const limitedHeight = Math.min(Math.max(newHeight, 200), windowHeight * 0.8);
    setBottomHeight(limitedHeight);
  }, [isDragging]);

  // 处理拖动结束
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 前置条件表格列定义
  const prerequisiteColumns = [
    {
      title: '用例ID',
      dataIndex: 'caseId',
      key: 'caseId',
      width: 120,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleTableCellEdit(record.key, 'caseId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      title: '是否生效',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: 100,
      render: (value, record) => (
        <Select
          value={value}
          onChange={(value) => handleTableCellEdit(record.key, 'isEnabled', value)}
          onClick={(e) => e.stopPropagation()}
          options={[
            { label: '是', value: true },
            { label: '否', value: false }
          ]}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '设备前置条件',
      dataIndex: 'devicePrerequisite',
      key: 'devicePrerequisite',
      width: 300,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleTableCellEdit(record.key, 'devicePrerequisite', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '子架前置条件',
      dataIndex: 'subRackPrerequisite',
      key: 'subRackPrerequisite',
      width: 300,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleTableCellEdit(record.key, 'subRackPrerequisite', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '单板前置条件',
      dataIndex: 'boardPrerequisite',
      key: 'boardPrerequisite',
      width: 300,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleTableCellEdit(record.key, 'boardPrerequisite', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    }
  ];

  // 执行前检查表格列定义
  const preCheckColumns = [
    {
      title: '分析项ID',
      dataIndex: 'analysisItemId',
      key: 'analysisItemId',
      width: 150,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handlePreCheckTableCellEdit(record.key, 'analysisItemId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      title: '检查条件',
      dataIndex: 'checkCondition',
      key: 'checkCondition',
      width: 600,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handlePreCheckTableCellEdit(record.key, 'checkCondition', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    }
  ];

  // 分析原子表格列定义
  const atomicAnalysisColumns = [
    {
      title: '原子ID',
      dataIndex: 'atomicId',
      key: 'atomicId',
      width: 150,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleAtomicAnalysisTableCellEdit(record.key, 'atomicId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      title: '分析类型',
      dataIndex: 'analysisType',
      key: 'analysisType',
      width: 120,
      render: (value, record) => (
        <Select
          value={value}
          onChange={(value) => handleAtomicAnalysisTableCellEdit(record.key, 'analysisType', value)}
          onClick={(e) => e.stopPropagation()}
          options={ANALYSIS_TYPE_OPTIONS}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '忽略结果',
      dataIndex: 'ignoreResult',
      key: 'ignoreResult',
      width: 100,
      render: (value, record) => (
        <Select
          value={value}
          onChange={(value) => handleAtomicAnalysisTableCellEdit(record.key, 'ignoreResult', value)}
          onClick={(e) => e.stopPropagation()}
          options={[
            { label: '是', value: true },
            { label: '否', value: false }
          ]}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '分析规则',
      dataIndex: 'analysisRule',
      key: 'analysisRule',
      width: 300,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleAtomicAnalysisTableCellEdit(record.key, 'analysisRule', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '参数刷新',
      dataIndex: 'parameterRefresh',
      key: 'parameterRefresh',
      width: 300,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleAtomicAnalysisTableCellEdit(record.key, 'parameterRefresh', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    }
  ];

  // 分析结果表格列定义
  const analysisResultColumns = [
    {
      title: '结果ID',
      dataIndex: 'resultId',
      key: 'resultId',
      width: 150,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleAnalysisResultTableCellEdit(record.key, 'resultId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      title: '严重级别',
      dataIndex: 'severityLevel',
      key: 'severityLevel',
      width: 120,
      render: (value, record) => (
        <Select
          value={value}
          onChange={(value) => handleAnalysisResultTableCellEdit(record.key, 'severityLevel', value)}
          onClick={(e) => e.stopPropagation()}
          options={[
            { label: '提示', value: 'hint' },
            { label: '不达标', value: 'unqualified' },
            { label: '严重不达标', value: 'severely_unqualified' }
          ]}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '权重值',
      dataIndex: 'weightValue',
      key: 'weightValue',
      width: 100,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleAnalysisResultTableCellEdit(record.key, 'weightValue', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      title: '结果输出',
      dataIndex: 'resultOutput',
      key: 'resultOutput',
      width: 300,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleAnalysisResultTableCellEdit(record.key, 'resultOutput', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '分支条件',
      dataIndex: 'branchCondition',
      key: 'branchCondition',
      width: 300,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleAnalysisResultTableCellEdit(record.key, 'branchCondition', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    }
  ];

  // 分析资源表格列定义
  const analysisResourceColumns = [
    {
      title: '资源ID',
      dataIndex: 'resourceId',
      key: 'resourceId',
      width: 150,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleAnalysisResourceTableCellEdit(record.key, 'resourceId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      title: '当前值(中文)',
      dataIndex: 'chCurrentValue',
      key: 'chCurrentValue',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleAnalysisResourceTableCellEdit(record.key, 'chCurrentValue', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '处理建议(中文)',
      dataIndex: 'chSuggestion',
      key: 'chSuggestion',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleAnalysisResourceTableCellEdit(record.key, 'chSuggestion', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '当前值(英文)',
      dataIndex: 'enCurrentValue',
      key: 'enCurrentValue',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleAnalysisResourceTableCellEdit(record.key, 'enCurrentValue', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '处理建议(英文)',
      dataIndex: 'enSuggestion',
      key: 'enSuggestion',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleAnalysisResourceTableCellEdit(record.key, 'enSuggestion', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    }
  ];

  // 数据模型表格列定义
  const dataModelColumns = [
    {
      title: '模型ID',
      dataIndex: 'modelId',
      key: 'modelId',
      width: 120,
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleDataModelTableCellEdit(record.key, 'modelId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      title: '解析类型',
      dataIndex: 'parseType',
      key: 'parseType',
      width: 150,
      render: (value, record) => (
        <Select
          value={value}
          onChange={(value) => handleDataModelTableCellEdit(record.key, 'parseType', value)}
          onClick={(e) => e.stopPropagation()}
          options={[
            { label: 'dump_table_value', value: 'dump_table_value' },
            { label: 'custom_table_value', value: 'custom_table_value' },
            { label: 'chipreg_table_value', value: 'chipreg_table_value' },
            { label: 'multi_table_value', value: 'multi_table_value' },
            { label: 'ctx_table_value', value: 'ctx_table_value' }
          ]}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '命令',
      dataIndex: 'command',
      key: 'command',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleDataModelTableCellEdit(record.key, 'command', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '参数',
      dataIndex: 'parameters',
      key: 'parameters',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleDataModelTableCellEdit(record.key, 'parameters', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '表头',
      dataIndex: 'tableHeader',
      key: 'tableHeader',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleDataModelTableCellEdit(record.key, 'tableHeader', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '开始标记',
      dataIndex: 'startMark',
      key: 'startMark',
      width: 150,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleDataModelTableCellEdit(record.key, 'startMark', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '结束标记',
      dataIndex: 'endMark',
      key: 'endMark',
      width: 150,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleDataModelTableCellEdit(record.key, 'endMark', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '行正则匹配',
      dataIndex: 'lineRegex',
      key: 'lineRegex',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleDataModelTableCellEdit(record.key, 'lineRegex', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '系统参数',
      dataIndex: 'systemParams',
      key: 'systemParams',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleDataModelTableCellEdit(record.key, 'systemParams', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '连表方式',
      dataIndex: 'joinType',
      key: 'joinType',
      width: 120,
      render: (value, record) => (
        <Select
          value={value}
          onChange={(value) => handleDataModelTableCellEdit(record.key, 'joinType', value)}
          onClick={(e) => e.stopPropagation()}
          options={[
            { label: '左连接', value: 'left_join' },
            { label: '右连接', value: 'right_join' },
            { label: '内连接', value: 'inner_join' },
            { label: '外连接', value: 'outer_join' },
            { label: '垂直连接', value: 'vertical_join' }
          ]}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: '连表字段',
      dataIndex: 'joinFields',
      key: 'joinFields',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleDataModelTableCellEdit(record.key, 'joinFields', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    },
    {
      title: '额外操作',
      dataIndex: 'extraOperation',
      key: 'extraOperation',
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleDataModelTableCellEdit(record.key, 'extraOperation', e.target.value)}
          onClick={(e) => e.stopPropagation()}
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
      )
    }
  ];

  // 修改表格组件以支持行高亮
  const renderTable = (columns, dataSource, handleCellEdit) => {
    return (
      <Table
        columns={columns}
        dataSource={dataSource}
        scroll={{ y: 'calc(100% - 39px)' }}
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无数据' }}
        rowClassName={(record) => record.key === selectedNodeId ? 'highlighted-row' : ''}
        onRow={(record) => ({
          onClick: () => {
            // 点击表格行时选中对应的节点
            setSelectedNodeId(record.key);
            
            // 找到对应的节点，并更新节点选中状态
            setNodes(nodes.map(node => {
              if (node.id === record.key) {
                return {
                  ...node,
                  selected: true
                };
              } else {
                return {
                  ...node,
                  selected: node.selected ? false : node.selected
                };
              }
            }));
          },
          style: {
            backgroundColor: record.key === selectedNodeId ? `rgba(24, 144, 255, 0.1)` : undefined,
            cursor: 'pointer'
          }
        })}
      />
    );
  };

  // 定义标签页内容中修改表格渲染
  const tabItems = [
    {
      key: 'prerequisite',
      label: '前置条件',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          {renderTable(prerequisiteColumns, prerequisiteData, handleTableCellEdit)}
        </div>
      ),
    },
    {
      key: 'preCheck',
      label: '执行前检查',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          {renderTable(preCheckColumns, preCheckData, handlePreCheckTableCellEdit)}
        </div>
      ),
    },
    {
      key: 'atomicAnalysis',
      label: '分析原子',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          {renderTable(atomicAnalysisColumns, atomicAnalysisData, handleAtomicAnalysisTableCellEdit)}
        </div>
      ),
    },
    {
      key: 'analysisResult',
      label: '分析结果',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          {renderTable(analysisResultColumns, analysisResultData, handleAnalysisResultTableCellEdit)}
        </div>
      ),
    },
    {
      key: 'analysisResource',
      label: '分析资源',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          {renderTable(analysisResourceColumns, analysisResourceData, handleAnalysisResourceTableCellEdit)}
        </div>
      ),
    },
    {
      key: 'dataModel',
      label: '数据模型',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          {renderTable(dataModelColumns, dataModelData, handleDataModelTableCellEdit)}
        </div>
      ),
    },
  ];

  // 修改ReactFlow组件以传递选中状态和onNodeClick事件
  const onNodeClick = useCallback((event, node) => {
    // 点击节点时切换到对应的标签页
    if (node.data?.type) {
      setActiveTab(node.data.type);
    }
    
    // 设置选中节点ID
    setSelectedNodeId(node.id);
  }, []);

  // 添加动画样式
  const animationStyles = `
    @keyframes flow {
      0% {
        stroke-dashoffset: 15;
      }
      100% {
        stroke-dashoffset: 0;
      }
    }

    .react-flow__edge {
      transition: stroke 0.3s, stroke-width 0.3s;
    }

    .react-flow__edge:hover {
      stroke-width: 3px !important;
    }

    .react-flow__handle {
      transition: all 0.2s ease;
    }

    .react-flow__handle:hover {
      transform: scale(1.3);
    }
  `;

  // 折叠所有节点的处理函数
  const handleCollapseAllNodes = useCallback(() => {
    // 切换折叠状态
    setNodesExpanded(prev => !prev);
    
    // 更新所有节点的折叠状态
    setNodes(nds => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        isExpanded: !nodesExpanded // 使用相反的当前状态
      }
    })));
    
    console.log(`${!nodesExpanded ? '展开' : '折叠'}所有节点`);
  }, [nodesExpanded]);

  // 添加导出JSON功能
  const handleExportJSON = useCallback(() => {
    // 收集当前流程图数据
    const flowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        style: edge.style
      })),
      // 导出表格数据
      tables: {
        prerequisiteData,
        preCheckData,
        atomicAnalysisData,
        analysisResultData,
        analysisResourceData,
        dataModelData
      }
    };

    // 转换为JSON字符串
    const jsonString = JSON.stringify(flowData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // 设置文件名 (使用当前时间戳)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `flowchart-export-${timestamp}.json`;
    
    // 模拟点击下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('流程图数据已导出为JSON');
  }, [nodes, edges, prerequisiteData, preCheckData, atomicAnalysisData, analysisResultData, analysisResourceData, dataModelData]);

  // 添加导入JSON功能
  const handleImportJSON = useCallback(() => {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    // 处理文件选择
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          // 解析JSON数据
          const flowData = JSON.parse(event.target.result);
          
          // 验证数据结构
          if (!flowData.nodes || !flowData.edges) {
            throw new Error('无效的流程图数据');
          }
          
          // 还原节点和边缘数据
          setNodes(flowData.nodes);
          setEdges(flowData.edges);
          
          // 还原表格数据
          if (flowData.tables) {
            if (flowData.tables.prerequisiteData) setPrerequisiteData(flowData.tables.prerequisiteData);
            if (flowData.tables.preCheckData) setPreCheckData(flowData.tables.preCheckData);
            if (flowData.tables.atomicAnalysisData) setAtomicAnalysisData(flowData.tables.atomicAnalysisData);
            if (flowData.tables.analysisResultData) setAnalysisResultData(flowData.tables.analysisResultData);
            if (flowData.tables.analysisResourceData) setAnalysisResourceData(flowData.tables.analysisResourceData);
            if (flowData.tables.dataModelData) setDataModelData(flowData.tables.dataModelData);
          }
          
          console.log('流程图数据已成功导入');
        } catch (error) {
          console.error('导入失败:', error);
          alert('导入失败: ' + error.message);
        }
      };
      
      // 读取文件内容
      reader.readAsText(file);
    };
    
    // 触发文件选择对话框
    fileInput.click();
  }, []);

  return (
    <Layout style={{ height: '100vh', width: '100%' }}>
      <Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 添加全局样式 */}
        <style>
          {`
            .highlighted-row {
              background-color: rgba(24, 144, 255, 0.1) !important;
            }
            .highlighted-row:hover td {
              background-color: rgba(24, 144, 255, 0.2) !important;
            }
            ${animationStyles}
            .right-panel-toggle {
              position: absolute;
              right: ${showRightPanel ? '300px' : '0'};
              top: 50%;
              transform: translateY(-50%);
              background: #fff;
              border: 1px solid #ddd;
              border-right: ${showRightPanel ? '1px solid #ddd' : 'none'};
              border-radius: ${showRightPanel ? '4px 0 0 4px' : '0 4px 4px 0'};
              width: 20px;
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              z-index: 100;
              box-shadow: -2px 0 5px rgba(0,0,0,0.05);
              transition: right 0.3s ease;
            }
            .right-panel {
              width: 300px;
              background-color: #fff;
              border-left: 1px solid #ddd;
              padding: 20px;
              display: flex;
              flex-direction: column;
              gap: 16px;
              transition: all 0.3s ease;
              position: absolute;
              right: 0;
              top: 0;
              bottom: 0;
              z-index: 50;
            }
            .right-panel.hidden {
              transform: translateX(100%);
            }
            .main-canvas {
              flex: 1;
              transition: all 0.3s ease;
              margin-right: ${showRightPanel ? '300px' : '0'};
            }
          `}
        </style>
        <div style={{ 
          padding: '10px', 
          borderBottom: '1px solid #ddd',
          background: '#fff',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <Space>
            <Button type="primary">保存</Button>
            <Button>撤销</Button>
            <Button>重做</Button>
            <Button 
              icon={nodesExpanded ? <UpOutlined /> : <DownOutlined />} 
              onClick={handleCollapseAllNodes}
            >
              {nodesExpanded ? '折叠全部' : '展开全部'}
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleExportJSON}
            >
              导出JSON
            </Button>
            <Button 
              icon={<UploadOutlined />} 
              onClick={handleImportJSON}
            >
              导入JSON
            </Button>
          </Space>
        </div>

        <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
          <div className="main-canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              // 添加自定义边的定义
              edgeTypes={{
                custom: CustomEdge
              }}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              fitView
              style={{ background: '#f0f2f5' }}
              defaultEdgeOptions={{
                type: 'smoothstep', // 使用smoothstep类型
                animated: true,
                style: { stroke: '#555' },
                markerEnd: {
                  type: 'arrowclosed',
                  width: 20,
                  height: 20,
                  color: '#555',
                },
              }}
              selectionMode={1}
              selectNodesOnDrag={true}
              multiSelectionKeyCode={['Control', 'Meta']}
              deleteKeyCode={['Backspace', 'Delete']}
              isValidConnection={isValidConnection}
              onNodeClick={onNodeClick}
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>

          {/* 右侧面板切换按钮 */}
          <div 
            className="right-panel-toggle"
            onClick={() => {
              setShowRightPanel(!showRightPanel);
              // 在状态改变后，触发一个ReactFlow窗口调整事件
              setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
              }, 310); // 等待过渡动画完成
            }}
          >
            {showRightPanel ? '>' : '<'}
          </div>

          <div className={`right-panel ${showRightPanel ? '' : 'hidden'}`}>
            <Input.Search
              placeholder="搜索节点类型"
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
            
            <Divider>节点类型</Divider>
            
            <Space direction="vertical" style={{ width: '100%' }}>
              {filteredNodeTypes.map(([key, config]) => (
                <Card
                  key={key}
                  size="small"
                  style={{
                    backgroundColor: config.color,
                    borderColor: config.borderColor,
                    cursor: 'move',
                    marginBottom: '8px',
                  }}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('nodeType', key);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </div>
                </Card>
              ))}
            </Space>
          </div>
        </div>

        <div 
          style={{ 
            position: 'relative',
            height: `${bottomHeight}px`,
            borderTop: '1px solid #d9d9d9'
          }}
        >
          {/* 拖动条 */}
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: 0,
              right: 0,
              height: '20px',
              cursor: 'row-resize',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onMouseDown={handleMouseDown}
          >
            <div
              style={{
                width: '60px',
                height: '3px',
                backgroundColor: isDragging ? '#1890ff' : '#d9d9d9',
                borderRadius: '2px',
                transition: 'background-color 0.3s',
              }}
            />
            <UpOutlined 
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDragging ? '#1890ff' : '#999',
                transition: 'color 0.3s',
              }}
            />
          </div>
          <Tabs
            items={tabItems}
            type="card"
            style={{ 
              padding: '8px 16px',
              height: '100%',
            }}
            activeKey={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default function FlowChartWrapper() {
  return (
    <ReactFlowProvider>
      <FlowChart />
    </ReactFlowProvider>
  );
}