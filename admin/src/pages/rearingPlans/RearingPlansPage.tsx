import { Button, message, Popconfirm, Space } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import DataTable from '../../components/DataTable';
import RearingPlanDrawer from './RearingPlanDrawer';
import type { Batch, RearingPlan, RearingPlanInput } from '../../types';
import { normalizeListResponse, request } from '../../utils/request';

const DEFAULT_PAGE_SIZE = 10;

const RearingPlansPage = () => {
  const [plans, setPlans] = useState<RearingPlan[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<RearingPlan | undefined>();

  const fetchBatches = useCallback(async () => {
    try {
      const response = await request<Batch[] | { data: Batch[] }>({ url: '/api/v1/batches' });
      const { items } = normalizeListResponse<Batch>(response);
      setBatches(items);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await request<RearingPlan[] | { data: RearingPlan[] }>({
        url: '/api/v1/rearing-plans',
        params: keyword ? { q: keyword } : undefined
      });
      const { items } = normalizeListResponse<RearingPlan>(response);
      setPlans(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const filtered = useMemo(() => {
    if (!keyword) {
      return plans;
    }
    const lower = keyword.toLowerCase();
    return plans.filter((plan) =>
      [plan.activity, plan.notes].some((field) => field?.toLowerCase().includes(lower))
    );
  }, [plans, keyword]);

  const total = filtered.length;

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleSubmit = async (values: RearingPlanInput) => {
    setSubmitLoading(true);
    try {
      if (currentPlan) {
        await request<RearingPlan>({
          url: `/api/v1/rearing-plans/${currentPlan.id}`,
          method: 'PUT',
          data: values
        });
        message.success('养殖计划更新成功');
      } else {
        await request<RearingPlan>({ url: '/api/v1/rearing-plans', method: 'POST', data: values });
        message.success('养殖计划创建成功');
      }
      setDrawerOpen(false);
      setCurrentPlan(undefined);
      fetchPlans();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (plan: RearingPlan) => {
    await request<void>({ url: `/api/v1/rearing-plans/${plan.id}`, method: 'DELETE' });
    message.success('已删除养殖计划');
    fetchPlans();
  };

  const columns = [
    {
      title: '计划日期',
      dataIndex: 'scheduled_date',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD')
    },
    {
      title: '所属批次',
      dataIndex: 'batch_id',
      render: (batchId: number) => batches.find((item) => item.id === batchId)?.name || '—'
    },
    {
      title: '计划内容',
      dataIndex: 'activity'
    },
    {
      title: '饲料用量(kg)',
      dataIndex: 'feed_amount',
      render: (value: number | null) => (value !== null && value !== undefined ? value : '—')
    },
    {
      title: '备注',
      dataIndex: 'notes',
      render: (value: string | null) => value || '—'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: RearingPlan) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setCurrentPlan(record);
              setDrawerOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确认删除该计划？" onConfirm={() => handleDelete(record)}>
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
      <DataTable<RearingPlan>
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
        searchPlaceholder="输入计划内容或备注搜索"
        extra={
          <Button
            type="primary"
            onClick={() => {
              setCurrentPlan(undefined);
              setDrawerOpen(true);
            }}
          >
            新增计划
          </Button>
        }
      />

      <RearingPlanDrawer
        open={drawerOpen}
        loading={submitLoading}
        plan={currentPlan}
        batches={batches}
        onClose={() => {
          setDrawerOpen(false);
          setCurrentPlan(undefined);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default RearingPlansPage;
