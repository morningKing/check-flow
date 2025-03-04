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
import { Card, Button, Space, Layout, Input, Form, Radio, Dropdown, Menu, Divider, Select, message } from 'antd';
import { DeleteOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
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

// 前置条件表单组件
const PrerequisiteForm = ({ data, onChange, isExpanded }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div>
      <Form.Item label="用例ID" style={{ marginBottom: 8 }}>
        <Input
          placeholder="请输入用例ID"
          value={data.caseId || ''}
          onChange={(e) => handleChange('caseId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </Form.Item>
      <Form.Item label="是否生效" style={{ marginBottom: 8 }}>
        <Radio.Group
          value={data.isActive}
          onChange={(e) => handleChange('isActive', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          <Radio value={true}>是</Radio>
          <Radio value={false}>否</Radio>
        </Radio.Group>
      </Form.Item>
      {isExpanded && (
        <>
          <Form.Item label="设备前置条件" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入设备前置条件"
              value={data.conditions?.device || ''}
              onChange={(e) => handleChange('conditions', { ...data.conditions, device: e.target.value })}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="子架前置条件" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入子架前置条件"
              value={data.conditions?.subRack || ''}
              onChange={(e) => handleChange('conditions', { ...data.conditions, subRack: e.target.value })}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="单板前置条件" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入单板前置条件"
              value={data.conditions?.board || ''}
              onChange={(e) => handleChange('conditions', { ...data.conditions, board: e.target.value })}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
        </>
      )}
    </div>
  );
};

// 添加分析原子表单组件
const AtomicAnalysisForm = ({ data, onChange, isExpanded }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
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

// 添加执行前检查表单组件
const PreCheckForm = ({ data, onChange, isExpanded }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
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

// 修改数据模型表单组件
const DataModelForm = ({ data, onChange, isExpanded }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  // 更新解析类型选项，添加 multi_table_value
  const parseTypeOptions = [
    { label: 'dump_table_value', value: 'dump_table_value' },
    { label: 'custom_table_value', value: 'custom_table_value' },
    { label: 'chipreg_table_value', value: 'chipreg_table_value' },
    { label: 'multi_table_value', value: 'multi_table_value' }
  ];

  // 连表方式选项
  const joinTypeOptions = [
    { label: '左连接', value: 'left_join' },
    { label: '右连接', value: 'right_join' },
    { label: '内连接', value: 'inner_join' },
    { label: '外连接', value: 'outer_join' },
    { label: '垂直连接', value: 'vertical_join' }
  ];

  // 根据解析类型渲染额外的输入框
  const renderExtraFields = () => {
    switch (data.parseType) {
      case 'dump_table_value':
        return (
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
        );
      case 'custom_table_value':
      case 'chipreg_table_value':
        return (
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
        );
      case 'multi_table_value':
        return (
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
        );
      default:
        return null;
    }
  };

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
          {renderExtraFields()}
        </>
      )}
    </div>
  );
};

// 添加分析结果表单组件
const AnalysisResultForm = ({ data, onChange, isExpanded }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
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
              style={{ width: '100%' }}
            >
              {severityOptions.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
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
        </>
      )}
    </div>
  );
};

// 添加 AnalysisResourceForm 组件
const AnalysisResourceForm = ({ data, onChange, isExpanded }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div>
      <Form.Item label="分析资源ID" style={{ marginBottom: 8 }}>
        <Input
          placeholder="请输入分析资源ID"
          value={data.resourceId || ''}
          onChange={(e) => handleChange('resourceId', e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </Form.Item>
      {isExpanded && (
        <>
          <Form.Item label="中文当前值" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入中文当前值"
              value={data.chCurrentValue || ''}
              onChange={(e) => handleChange('chCurrentValue', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="中文处理建议" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入中文处理建议"
              value={data.chSuggestion || ''}
              onChange={(e) => handleChange('chSuggestion', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="英文当前值" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入英文当前值"
              value={data.enCurrentValue || ''}
              onChange={(e) => handleChange('enCurrentValue', e.target.value)}
              autoSize={{ minRows: 1, maxRows: 3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item label="英文处理建议" style={{ marginBottom: 8 }}>
            <Input.TextArea
              placeholder="请输入英文处理建议"
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

// 自定义节点组件
const CustomNode = ({ id, data, onDelete, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
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
    width: '8px',
    height: '8px'
  };

  // 根据节点类型渲染不同的内容
  const renderNodeContent = () => {
    if (!data?.type) return <div>无效节点类型</div>;

    const commonProps = {
      data,
      onChange: (newData) => handleDataChange(id, newData),
      isExpanded
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

  return (
    <div 
      style={{ position: 'relative' }}
      onClick={e => e.stopPropagation()}
    >
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

// 主组件
const FlowChart = () => {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [clipboard, setClipboard] = useState(null);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // 将 isValidConnection 包装在 useCallback 中
  const isValidConnection = useCallback((connection) => {
    const { source, target } = connection;
    
    // 获取源节点和目标节点
    const sourceNode = nodes.find(node => node.id === source);
    const targetNode = nodes.find(node => node.id === target);

    if (!sourceNode || !targetNode) {
      return false;
    }

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

    // 其他类型节点的连接规则
    return true;
  }, [nodes]);

  const onConnectStart = useCallback((event, { nodeId, handleType }) => {
    const sourceNode = nodes.find(node => node.id === nodeId);
    
    if (!sourceNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (sourceNode.data.type === 'prerequisite') {
          // 如果是前置检查节点，只高亮显示执行前检查节点
          return {
            ...node,
            style: {
              ...node.style,
              opacity: node.data.type === 'preCheck' ? 1 : 0.2,
            },
          };
        } else if (sourceNode.data.type === 'preCheck') {
          // 如果是执行前检查节点，只高亮显示分析原子和分析结果节点
          return {
            ...node,
            style: {
              ...node.style,
              opacity: (node.data.type === 'atomicAnalysis' || node.data.type === 'analysisResult') ? 1 : 0.2,
            },
          };
        } else if (sourceNode.data.type === 'dataModel') {
          // 数据模型节点的逻辑保持不变
          return {
            ...node,
            style: {
              ...node.style,
              opacity: (node.data.type === 'atomicAnalysis' || node.data.type === 'dataModel') ? 1 : 0.2,
            },
          };
        }
        // 其他节点类型的连接逻辑保持不变
        return {
          ...node,
          style: {
            ...node.style,
            opacity: 1,
          },
        };
      })
    );
  }, [nodes]);

  const onConnectEnd = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: {
          ...node.style,
          opacity: 1,
        },
      }))
    );
  }, []);

  const onConnect = useCallback((connection) => {
    if (isValidConnection(connection)) {
      setEdges((eds) => addEdge(connection, eds));
    }
  }, [isValidConnection]);

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
            isActive: true
          };
          break;
        case 'atomicAnalysis':
          initialData = {
            ...initialData,
            atomicId: '',
            analysisRule: '',
            parameterRefresh: ''
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
            severityLevel: 'hint',  // 改为 severityLevel，默认选择"提示"
            weightValue: '',
            resultOutput: ''
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

      const newNode = {
        id: `node${nodes.length + 1}`,
        type: 'custom',
        position,
        data: initialData
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, reactFlowInstance]
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node: node
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const onDeleteNode = useCallback((nodeId) => {
    setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
    setEdges((edges) => edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
    setContextMenu(null);
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

  const nodeTypes = useMemo(
    () => ({
      custom: (props) => (
        <CustomNode
          {...props}
          onDelete={onDeleteNode}
          onChange={updateNodeData}
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
        event.preventDefault();
      }

      if (isCtrlPressed && event.key === 'v' && clipboard) {
        // 粘贴操作
        const now = Date.now();
        const newNodes = clipboard.map((node, index) => ({
          ...node,
          id: `node-${now}-${index}`,
          position: {
            x: node.position.x + 50, // 偏移位置，避免完全重叠
            y: node.position.y + 50
          },
          selected: false
        }));

        setNodes((nds) => [...nds, ...newNodes]);
        event.preventDefault();
      }
    },
    [nodes, clipboard]
  );

  // 添加键盘事件监听
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  return (
    <Layout style={{ height: '100vh', width: '100%' }}>
      <Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          </Space>
        </div>

        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ flex: 1 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onNodeContextMenu={onNodeContextMenu}
              onPaneClick={onPaneClick}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              fitView
              style={{ background: '#f0f2f5' }}
              defaultEdgeOptions={{
                type: 'smoothstep',
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
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>

          <div style={{ 
            width: 300, 
            backgroundColor: '#fff', 
            borderLeft: '1px solid #ddd',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
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

        {contextMenu && (
          <Dropdown
            open={true}
            trigger={[]}
            overlay={
              <Menu>
                <Menu.Item
                  key="delete"
                  onClick={() => onDeleteNode(contextMenu.node.id)}
                >
                  删除节点
                </Menu.Item>
              </Menu>
            }
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          />
        )}
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