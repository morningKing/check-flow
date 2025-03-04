export const NODE_TYPES = {
  prerequisite: {
    label: '前置条件',
    color: '#e6f7ff',
    borderColor: '#91d5ff',
  },
  preCheck: {
    label: '执行前检查',
    color: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  atomicAnalysis: {
    label: '分析原子',
    color: '#fff7e6',
    borderColor: '#ffd591',
  },
  dataModel: {
    label: '数据模型',
    color: '#f9f0ff',
    borderColor: '#d3adf7',
  },
  analysisResource: {
    label: '分析资源',
    color: '#fff2f0',
    borderColor: '#ffccc7',
  },
  analysisResult: {
    label: '分析结果',
    color: '#f0f5ff',
    borderColor: '#adc6ff',
  },
};

export const PARSE_TYPE_OPTIONS = [
  { label: 'dump_table_value', value: 'dump_table_value' },
  { label: 'custom_table_value', value: 'custom_table_value' },
  { label: 'chipreg_table_value', value: 'chipreg_table_value' },
  { label: 'multi_table_value', value: 'multi_table_value' }
];

export const JOIN_TYPE_OPTIONS = [
  { label: '左连接', value: 'left_join' },
  { label: '右连接', value: 'right_join' },
  { label: '内连接', value: 'inner_join' },
  { label: '外连接', value: 'outer_join' },
  { label: '垂直连接', value: 'vertical_join' }
];

export const SEVERITY_OPTIONS = [
  { label: '提示', value: 'hint' },
  { label: '不达标', value: 'unqualified' },
  { label: '严重不达标', value: 'severely_unqualified' }
]; 