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
import { Card, Button, Space, Layout, Input, Form, Radio, Dropdown, Menu, Divider, Select, Tabs, Table } from 'antd';
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

// 修改分析类型常量格式以适配 Select 组件
const ANALYSIS_TYPE_OPTIONS = [
  { label: '表达式分析', value: 'expression' },
  { label: '原始分析', value: 'raw' },
  { label: '定制分析', value: 'custom' }
];

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
  const [prerequisiteData, setPrerequisiteData] = useState([]);
  const [bottomHeight, setBottomHeight] = useState(400);
  const [isDragging, setIsDragging] = useState(false);

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
            console.log('删除前表格数据:', prerequisiteData);
            
            setPrerequisiteData(prevData => {
              // 过滤掉要删除的节点对应的表格行
              const newData = prevData.filter(item => item.key !== nodeId);
              console.log('删除后表格数据:', newData);
              return newData;
            });
          }
        }
      });
    }
    
    // 应用节点变化
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [nodes, prerequisiteData]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const isValidConnection = useCallback((connection) => {
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // 如果目标节点是分析结果节点
    if (targetNode.type === 'analysisResult') {
      // 只允许来自执行前检查节点或分析原子节点的连接
      if (sourceNode.type !== 'preCheck' && sourceNode.type !== 'atomicAnalysis') {
        return false;
      }
    }

    // 数据模型指向分析原子的连接样式
    if (sourceNode.type === 'dataModel' && targetNode.type === 'atomicAnalysis') {
      return {
        valid: true,
        style: { stroke: '#FFEB3B' }
      };
    }

    // 数据模型的其他连接规则
    if (sourceNode.type === 'dataModel') {
      return targetNode.type === 'atomicAnalysis' || targetNode.type === 'dataModel';
    }

    return true;
  }, [nodes]);

  const onConnectStart = useCallback((event, { nodeId, handleType }) => {
    if (!nodeId) return;

    const sourceNode = nodes.find(node => node.id === nodeId);
    
    setNodes((nds) =>
      nds.map((node) => {
        if (sourceNode) {
          // 如果开始连接的是执行前检查节点或分析原子节点
          if (sourceNode.type === 'preCheck' || sourceNode.type === 'atomicAnalysis') {
            // 只高亮分析结果节点
            if (node.type === 'analysisResult') {
              node.style = { ...node.style, opacity: 1 };
            } else {
              node.style = { ...node.style, opacity: 0.2 };
            }
          } else {
            // 其他节点的原有高亮逻辑
            if (sourceNode.type === 'dataModel') {
              if (node.type === 'atomicAnalysis' || node.type === 'dataModel') {
                node.style = { ...node.style, opacity: 1 };
              } else {
                node.style = { ...node.style, opacity: 0.2 };
              }
            }
          }
        }
        return node;
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

    // 为数据模型指向分析原子的连接添加样式
    if (sourceNode?.type === 'dataModel' && targetNode?.type === 'atomicAnalysis') {
      params.style = { stroke: '#FFEB3B' };  // 设置为黄色
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
            branchCondition: ''  // 添加分支条件字段初始化
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
    [nodes, reactFlowInstance, addEmptyPrerequisiteRow]
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

  // 添加表格单元格编辑处理函数
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

  // 定义标签页内容
  const tabItems = [
    {
      key: 'prerequisite',
      label: '前置条件',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          <Table
            columns={prerequisiteColumns}
            dataSource={prerequisiteData}
            scroll={{ y: 'calc(100% - 39px)' }}
            size="small"
            pagination={false}
            locale={{ emptyText: '暂无数据' }}
          />
        </div>
      ),
    },
    {
      key: 'preCheck',
      label: '执行前检查',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          <div style={{ textAlign: 'center', color: '#999' }}>执行前检查列表</div>
        </div>
      ),
    },
    {
      key: 'atomicAnalysis',
      label: '分析原子',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          <div style={{ textAlign: 'center', color: '#999' }}>分析原子列表</div>
        </div>
      ),
    },
    {
      key: 'analysisResult',
      label: '分析结果',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          <div style={{ textAlign: 'center', color: '#999' }}>分析结果列表</div>
        </div>
      ),
    },
    {
      key: 'analysisResource',
      label: '分析资源',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          <div style={{ textAlign: 'center', color: '#999' }}>分析资源列表</div>
        </div>
      ),
    },
    {
      key: 'dataModel',
      label: '数据模型',
      children: (
        <div style={{ padding: '16px', height: 'calc(100% - 55px)' }}>
          <div style={{ textAlign: 'center', color: '#999' }}>数据模型列表</div>
        </div>
      ),
    },
  ];

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
              isValidConnection={isValidConnection}
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