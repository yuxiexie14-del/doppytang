import { Button, message, Popconfirm, Space, Tag } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import BatchDrawer from './BatchDrawer';
import DataTable from '../../components/DataTable';
import type { Batch, BatchInput, Contract } from '../../types';
import { normalizeListResponse, request } from '../../utils/request';

const DEFAULT_PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  planned: 'default',
  in_progress: 'processing',
  completed: 'success',
  canceled: 'error'
};

const BatchesPage = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<Batch | undefined>();

  const fetchContracts = useCallback(async () => {
    try {
      const response = await request<Contract[] | { data: Contract[] }>({ url: '/api/v1/contracts' });
      const { items } = normalizeListResponse<Contract>(response);
      setContracts(items);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await request<Batch[] | { data: Batch[] }>({
        url: '/api/v1/batches',
        params: keyword ? { q: keyword } : undefined
      });
      const { items } = normalizeListResponse<Batch>(response);
      setBatches(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const filtered = useMemo(() => {
    if (!keyword) {
      return batches;
    }
    const lower = keyword.toLowerCase();
    return batches.filter((batch) =>
      [batch.name, batch.status].some((field) => field?.toLowerCase().includes(lower))
    );
  }, [batches, keyword]);

  const total = filtered.length;

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleSubmit = async (values: BatchInput) => {
    setSubmitLoading(true);
    try {
      if (currentBatch) {
        await request<Batch>({ url: `/api/v1/batches/${currentBatch.id}`, method: 'PUT', data: values });
        message.success('批次更新成功');
      } else {
        await request<Batch>({ url: '/api/v1/batches', method: 'POST', data: values });
        message.success('批次创建成功');
      }
      setDrawerOpen(false);
      setCurrentBatch(undefined);
      fetchBatches();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (batch: Batch) => {
    await request<void>({ url: `/api/v1/batches/${batch.id}`, method: 'DELETE' });
    message.success('已删除批次');
    fetchBatches();
  };

  const columns = [
    {
      title: '批次名称',
      dataIndex: 'name'
    },
    {
      title: '所属合同',
      dataIndex: 'contract_id',
      render: (contractId: number) => contracts.find((item) => item.id === contractId)?.contract_code || '—'
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD')
    },
    {
      title: '结束日期',
      dataIndex: 'end_date',
      render: (value: string | null) => (value ? dayjs(value).format('YYYY-MM-DD') : '—')
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: string) => <Tag color={statusColors[value] || 'default'}>{value}</Tag>
    },
    {
      title: '备注',
      dataIndex: 'notes',
      render: (value: string | null) => value || '—'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Batch) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setCurrentBatch(record);
              setDrawerOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确认删除该批次？" onConfirm={() => handleDelete(record)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <DataTable<Batch>
        columns={columns}
        dataSource={paginated}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(current, size) => {
          setPage(current);
          setPageSize(size);
        }}
        onSearch={setKeyword}
        searchPlaceholder="输入批次名称或状态搜索"
        extra={
          <Button
            type="primary"
            onClick={() => {
              setCurrentBatch(undefined);
              setDrawerOpen(true);
            }}
          >
            新增批次
          </Button>
        }
      />

      <BatchDrawer
        open={drawerOpen}
        loading={submitLoading}
        batch={currentBatch}
        contracts={contracts}
        onClose={() => {
          setDrawerOpen(false);
          setCurrentBatch(undefined);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default BatchesPage;
