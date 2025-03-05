import React from 'react';
import { Form, Input, Select } from 'antd';
import { PARSE_TYPE_OPTIONS, JOIN_TYPE_OPTIONS } from '../../constants';

const DataModelForm = ({ data, onChange, isExpanded }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

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
                options={JOIN_TYPE_OPTIONS}
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
              options={PARSE_TYPE_OPTIONS}
            />
          </Form.Item>
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
          {renderExtraFields()}
        </>
      )}
    </div>
  );
};

export default DataModelForm; 