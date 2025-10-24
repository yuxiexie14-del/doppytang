import { Button, message, Space, Tag } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import DataTable from '../../components/DataTable';
import DeliveryDrawer, { DeliveryFormValues } from './DeliveryDrawer';
import type { Contract, Delivery } from '../../types';
import { normalizeListResponse, request } from '../../utils/request';

const DEFAULT_PAGE_SIZE = 10;

const DeliveriesPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [historyKeyword, setHistoryKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentContract, setCurrentContract] = useState<Contract | undefined>();

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await request<Contract[] | { data: Contract[] }>({ url: '/api/v1/contracts' });
      const { items } = normalizeListResponse<Contract>(response);
      setContracts(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeliveries = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await request<Delivery[] | { data: Delivery[] }>({ url: '/api/v1/deliveries' });
      const { items } = normalizeListResponse<Delivery>(response);
      setDeliveries(items);
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
    fetchDeliveries();
  }, [fetchContracts, fetchDeliveries]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyKeyword]);

  const handleSubmit = async (values: DeliveryFormValues) => {
    if (!currentContract) {
      return;
    }
    setSubmitLoading(true);
    try {
      await request<Delivery>({
        url: '/api/v1/deliveries',
        method: 'POST',
        data: {
          contract_id: currentContract.id,
          delivered_at: (values.delivered_at ?? dayjs()).toISOString(),
          eggs_delivered: values.eggs_delivered,
          packaging: values.packaging,
          vegetables: values.vegetables,
          kitchen_gift: values.kitchen_gift,
          delivered_by: values.delivered_by,
          hen_delivered: values.hen_delivered,
          notes: values.notes
        }
      });
      message.success('配送登记成功');
      setDrawerOpen(false);
      setCurrentContract(undefined);
      await Promise.all([fetchContracts(), fetchDeliveries()]);
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredContracts = useMemo(() => {
    if (!keyword) {
      return contracts;
    }
    const lower = keyword.toLowerCase();
    return contracts.filter((contract) =>
      [
        contract.contract_code,
        contract.package_name,
        contract.customer?.name,
        contract.customer?.customer_code
      ]
        .filter(Boolean)
        .some((item) => item!.toLowerCase().includes(lower))
    );
  }, [contracts, keyword]);

  const pendingContracts = useMemo(
    () =>
      filteredContracts.filter(
        (contract) => (contract.remaining_eggs ?? 0) > 0 || !contract.hen_delivered
      ),
    [filteredContracts]
  );

  const pendingTotal = pendingContracts.length;
  const paginatedContracts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return pendingContracts.slice(start, start + pageSize);
  }, [pendingContracts, page, pageSize]);

  const filteredDeliveries = useMemo(() => {
    if (!historyKeyword) {
      return deliveries;
    }
    const lower = historyKeyword.toLowerCase();
    return deliveries.filter((delivery) => {
      const contract = contracts.find((item) => item.id === delivery.contract_id);
      const contractFields = contract
        ? [contract.contract_code, contract.package_name, contract.customer?.name]
        : [];
      return (
        [delivery.packaging, delivery.vegetables, delivery.kitchen_gift, delivery.delivered_by, delivery.notes]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(lower)) ||
        contractFields.filter(Boolean).some((value) => value!.toLowerCase().includes(lower))
      );
    });
  }, [deliveries, historyKeyword, contracts]);

  const historyTotal = filteredDeliveries.length;
  const paginatedDeliveries = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return filteredDeliveries.slice(start, start + historyPageSize);
  }, [filteredDeliveries, historyPage, historyPageSize]);

  const findContract = useCallback(
    (contractId: number) => contracts.find((item) => item.id === contractId),
    [contracts]
  );

  const taskColumns = [
    {
      title: '客户',
      dataIndex: ['customer', 'name'],
      render: (_: unknown, record: Contract) => record.customer?.name ?? '—'
    },
    {
      title: '合同编号',
      dataIndex: 'contract_code'
    },
    {
      title: '套餐',
      dataIndex: 'package_name'
    },
    {
      title: '剩余鸡蛋',
      dataIndex: 'remaining_eggs',
      render: (value: number | null | undefined) => (value ?? 0)
    },
    {
      title: '母鸡状态',
      dataIndex: 'hen_delivered',
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'orange'}>{value ? '已交付' : '待交付'}</Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Contract) => (
        <Button
          type="link"
          onClick={() => {
            setCurrentContract(record);
            setDrawerOpen(true);
          }}
        >
          登记配送
        </Button>
      )
    }
  ];

  const historyColumns = [
    {
      title: '配送日期',
      dataIndex: 'delivered_at',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD')
    },
    {
      title: '合同',
      dataIndex: 'contract_id',
      render: (value: number) => findContract(value)?.contract_code ?? value
    },
    {
      title: '客户',
      key: 'customer',
      render: (_: unknown, record: Delivery) => findContract(record.contract_id)?.customer?.name ?? '—'
    },
    {
      title: '鸡蛋数量',
      dataIndex: 'eggs_delivered'
    },
    {
      title: '包装',
      dataIndex: 'packaging'
    },
    {
      title: '蔬菜',
      dataIndex: 'vegetables',
      render: (value: string | null | undefined) => value || '—'
    },
    {
      title: '厨房小礼品',
      dataIndex: 'kitchen_gift',
      render: (value: string | null | undefined) => value || '—'
    },
    {
      title: '备注',
      dataIndex: 'notes',
      render: (value: string | null | undefined) => value || '—'
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <DataTable<Contract>
        columns={taskColumns}
        dataSource={paginatedContracts}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={pendingTotal}
        onPageChange={(current, size) => {
          setPage(current);
          setPageSize(size);
        }}
        onSearch={setKeyword}
        searchPlaceholder="输入客户/合同关键字搜索"
      />

      <DataTable<Delivery>
        columns={historyColumns}
        dataSource={paginatedDeliveries}
        loading={historyLoading}
        page={historyPage}
        pageSize={historyPageSize}
        total={historyTotal}
        onPageChange={(current, size) => {
          setHistoryPage(current);
          setHistoryPageSize(size);
        }}
        onSearch={setHistoryKeyword}
        searchPlaceholder="输入包装/备注/合同搜索历史"
        rowKey={(record) => `${record.id}`}
      />

      <DeliveryDrawer
        open={drawerOpen}
        loading={submitLoading}
        contract={currentContract}
        onSubmit={handleSubmit}
        onClose={() => {
          setDrawerOpen(false);
          setCurrentContract(undefined);
        }}
      />
    </Space>
  );
};

export default DeliveriesPage;
