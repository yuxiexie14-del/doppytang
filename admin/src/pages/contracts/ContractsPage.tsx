import { Button, message, Popconfirm, Space, Tag } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import ContractDrawer from './ContractDrawer';
import DataTable from '../../components/DataTable';
import SettlementTrialDrawer from './SettlementTrialDrawer';
import type { Contract, ContractInput, Customer, SettlementTrialResponse } from '../../types';
import { normalizeListResponse, request } from '../../utils/request';

const DEFAULT_PAGE_SIZE = 10;

const ContractsPage = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentContract, setCurrentContract] = useState<Contract | undefined>();
  const [trialDrawerOpen, setTrialDrawerOpen] = useState(false);
  const [trialContract, setTrialContract] = useState<Contract | undefined>();
  const [trialResult, setTrialResult] = useState<SettlementTrialResponse | undefined>();
  const [trialLoading, setTrialLoading] = useState(false);

  const fetchCustomers = useCallback(async (search?: string) => {
    setCustomerLoading(true);
    try {
      const response = await request<Customer[] | { data: Customer[] }>({
        url: '/api/v1/customers',
        params: search ? { q: search } : undefined
      });
      const { items } = normalizeListResponse<Customer>(response);
      setCustomers(items);
    } catch (error) {
      console.error(error);
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await request<Contract[] | { data: Contract[] }>({
        url: '/api/v1/contracts',
        params: keyword ? { q: keyword } : undefined
      });
      const { items } = normalizeListResponse<Contract>(response);
      setContracts(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const handleCustomerSearch = useCallback(
    (value: string) => {
      fetchCustomers(value.trim() || undefined);
    },
    [fetchCustomers]
  );

  const handleCustomerChange = useCallback(
    async (customerId: number | null) => {
      if (!customerId) {
        setSelectedCustomer(undefined);
        return;
      }
      const match = customers.find((customer) => customer.id === customerId);
      if (match) {
        setSelectedCustomer(match);
        return;
      }
      try {
        const customer = await request<Customer>({ url: `/api/v1/customers/${customerId}` });
        setSelectedCustomer(customer);
        setCustomers((prev) => {
          const exists = prev.some((item) => item.id === customer.id);
          return exists ? prev.map((item) => (item.id === customer.id ? customer : item)) : [...prev, customer];
        });
      } catch (error) {
        console.error(error);
      }
    },
    [customers]
  );

  useEffect(() => {
    if (selectedCustomer) {
      const updated = customers.find((customer) => customer.id === selectedCustomer.id);
      if (updated && updated !== selectedCustomer) {
        setSelectedCustomer(updated);
      }
    }
  }, [customers, selectedCustomer]);

  const handleTrialSubmit = useCallback(
    async (values: { eggs_delivered?: number; price_override?: number; notes?: string }) => {
      if (!trialContract) {
        return;
      }
      setTrialLoading(true);
      try {
        const response = await request<SettlementTrialResponse>({
          url: '/api/v1/settlements/trial',
          method: 'POST',
          data: {
            contract_id: trialContract.id,
            ...values
          }
        });
        setTrialResult(response);
        message.success('试算成功');
      } finally {
        setTrialLoading(false);
      }
    },
    [trialContract]
  );

  const handleOpenTrial = useCallback((contract: Contract) => {
    setTrialContract(contract);
    setTrialResult(undefined);
    setTrialDrawerOpen(true);
  }, []);

  const handleCloseTrial = useCallback(() => {
    setTrialDrawerOpen(false);
    setTrialContract(undefined);
    setTrialResult(undefined);
  }, []);

  const filteredContracts = useMemo(() => {
    if (!keyword) {
      return contracts;
    }
    const lower = keyword.toLowerCase();
    return contracts.filter((contract) =>
      [
        contract.contract_code,
        contract.package_name,
        contract.status,
        contract.customer?.name,
        contract.customer?.customer_code
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(lower))
    );
  }, [contracts, keyword]);

  const total = filteredContracts.length;

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, page, pageSize]);

  const handleSubmit = async (values: ContractInput) => {
    setSubmitLoading(true);
    try {
      if (currentContract) {
        await request<Contract>({
          url: `/api/v1/contracts/${currentContract.id}`,
          method: 'PUT',
          data: values
        });
        message.success('合同更新成功');
      } else {
        await request<Contract>({
          url: '/api/v1/contracts',
          method: 'POST',
          data: values
        });
        message.success('合同创建成功');
      }
      setDrawerOpen(false);
      setCurrentContract(undefined);
      setSelectedCustomer(undefined);
      await fetchContracts();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (contract: Contract) => {
    await request<void>({ url: `/api/v1/contracts/${contract.id}`, method: 'DELETE' });
    message.success('已删除合同');
    fetchContracts();
  };

  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contract_code'
    },
    {
      title: '客户',
      dataIndex: ['customer', 'name'],
      render: (_: unknown, record: Contract) => record.customer?.name || '—'
    },
    {
      title: '套餐名称',
      dataIndex: 'package_name'
    },
    {
      title: '总鸡蛋',
      dataIndex: 'total_eggs'
    },
    {
      title: '剩余鸡蛋',
      dataIndex: 'remaining_eggs'
    },
    {
      title: '价格',
      dataIndex: 'price',
      render: (price: number) => `¥${price?.toFixed ? price.toFixed(2) : price}`
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD')
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value: string) => <Tag color={value === 'active' ? 'green' : 'default'}>{value}</Tag>
    },
    {
      title: '母鸡交付',
      dataIndex: 'hen_delivered',
      render: (value: boolean) => (value ? <Tag color="blue">已交付</Tag> : <Tag>未交付</Tag>)
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Contract) => (
        <Space size="small">
          <Button type="link" onClick={() => handleOpenTrial(record)}>
            价格试算
          </Button>
          <Button
            type="link"
            onClick={() => {
              setCurrentContract(record);
              setSelectedCustomer(record.customer);
              if (!record.customer && record.customer_id) {
                void handleCustomerChange(record.customer_id);
              }
              setDrawerOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确认删除该合同？" onConfirm={() => handleDelete(record)}>
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
      <DataTable<Contract>
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
        searchPlaceholder="输入合同编号/客户名搜索"
        extra={
          <Button
            type="primary"
            onClick={() => {
              setSelectedCustomer(undefined);
              setCurrentContract(undefined);
              setDrawerOpen(true);
            }}
          >
            新增合同
          </Button>
        }
      />

      <ContractDrawer
        open={drawerOpen}
        loading={submitLoading}
        contract={currentContract}
        customers={customers}
        customerLoading={customerLoading}
        selectedCustomer={selectedCustomer}
        onCustomerSearch={handleCustomerSearch}
        onCustomerChange={handleCustomerChange}
        onClose={() => {
          setDrawerOpen(false);
          setCurrentContract(undefined);
          setSelectedCustomer(undefined);
        }}
        onSubmit={handleSubmit}
      />

      <SettlementTrialDrawer
        open={trialDrawerOpen}
        loading={trialLoading}
        contract={trialContract}
        result={trialResult}
        onSubmit={handleTrialSubmit}
        onClose={handleCloseTrial}
      />
    </>
  );
};

export default ContractsPage;
