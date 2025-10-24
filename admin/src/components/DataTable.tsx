import { Input, Space, Table, Tag } from 'antd';
import type { TablePaginationConfig, TableProps } from 'antd';
import type { ReactNode } from 'react';

interface DataTableProps<T> {
  columns: TableProps<T>['columns'];
  dataSource: T[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange?: (page: number, pageSize: number) => void;
  onSearch?: (keyword: string) => void;
  searchPlaceholder?: string;
  extra?: ReactNode;
  rowKey?: string | ((record: T) => string);
}

const DataTable = <T extends object>({
  columns,
  dataSource,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onSearch,
  searchPlaceholder,
  extra,
  rowKey
}: DataTableProps<T>) => {
  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    showTotal: (count, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${count} 条`
  };

  const handleTableChange: TableProps<T>['onChange'] = (paginationConfig) => {
    if (onPageChange) {
      onPageChange(paginationConfig.current ?? 1, paginationConfig.pageSize ?? pageSize);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div className="table-toolbar">
        {onSearch ? (
          <Input.Search
            className="table-toolbar-search"
            allowClear
            placeholder={searchPlaceholder ?? '请输入关键字搜索'}
            onSearch={(value) => onSearch(value.trim())}
            onChange={(event) => onSearch(event.target.value)}
          />
        ) : (
          <div />
        )}
        {extra}
      </div>
      <Table<T>
        rowKey={rowKey ?? 'id'}
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />
    </Space>
  );
};

export const renderArrayTag = (values?: string[]) =>
  values && values.length > 0 ? values.map((item) => <Tag key={item}>{item}</Tag>) : '—';

export default DataTable;
