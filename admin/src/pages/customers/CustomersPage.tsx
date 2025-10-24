import { Button, Descriptions, Drawer, message, Popconfirm } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import DataTable, { renderArrayTag } from '../../components/DataTable';
import CustomerDrawer from './CustomerDrawer';
import type { Customer, CustomerInput } from '../../types';
import { normalizeListResponse, request } from '../../utils/request';

const DEFAULT_PAGE_SIZE = 10;

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [keyword, setKeyword] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | undefined>();
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await request<Customer[] | { data: Customer[]; total?: number }>({
        url: '/api/v1/customers',
        params: keyword ? { q: keyword } : undefined
      });
      const { items } = normalizeListResponse<Customer>(response);
      setCustomers(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!keyword) {
      return customers;
    }
    const lower = keyword.toLowerCase();
    return customers.filter((customer) =>
      [customer.customer_code, customer.name, customer.recipient_name, customer.address]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(lower)) ||
      customer.phones?.some((phone) => phone.includes(keyword))
    );
  }, [customers, keyword]);

  const total = filteredCustomers.length;

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const handleSubmit = async (values: CustomerInput) => {
    setSubmitLoading(true);
    try {
      if (currentCustomer) {
        await request<Customer>({
          url: `/api/v1/customers/${currentCustomer.id}`,
          method: 'PUT',
          data: values
        });
        message.success('客户更新成功');
      } else {
        await request<Customer>({
          url: '/api/v1/customers',
          method: 'POST',
          data: values
        });
        message.success('客户创建成功');
      }
      setFormOpen(false);
      setCurrentCustomer(undefined);
      fetchCustomers();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    await request<void>({
      url: `/api/v1/customers/${customer.id}`,
      method: 'DELETE'
    });
    message.success('已删除客户');
    fetchCustomers();
  };

  const columns = [
    {
      title: '客户编号',
      dataIndex: 'customer_code'
    },
    {
      title: '客户名称',
      dataIndex: 'name'
    },
    {
      title: '收货人',
      dataIndex: 'recipient_name'
    },
    {
      title: '联系电话',
      dataIndex: 'phones',
      render: (phones: string[]) => renderArrayTag(phones)
    },
    {
      title: '地址',
      dataIndex: 'address'
    },
    {
      title: '首购日期',
      dataIndex: 'first_purchase_date',
      render: (value: string | null) => (value ? dayjs(value).format('YYYY-MM-DD') : '—')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Customer) => (
        <Button.Group>
          <Button type="link" onClick={() => {
            setCurrentCustomer(record);
            setDetailOpen(true);
          }}>
            查看
          </Button>
          <Button
            type="link"
            onClick={() => {
              setCurrentCustomer(record);
              setFormOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确认删除该客户？" onConfirm={() => handleDelete(record)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Button.Group>
      )
    }
  ];

  return (
    <>
      <DataTable<Customer>
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
        searchPlaceholder="输入姓名/编号/电话搜索"
        extra={
          <Button type="primary" onClick={() => {
            setCurrentCustomer(undefined);
            setFormOpen(true);
          }}>
            新增客户
          </Button>
        }
      />

      <CustomerDrawer
        open={formOpen}
        customer={currentCustomer}
        loading={submitLoading}
        onClose={() => {
          setFormOpen(false);
          setCurrentCustomer(undefined);
        }}
        onSubmit={handleSubmit}
      />

      <Drawer
        title="客户详情"
        open={detailOpen}
        width={480}
        onClose={() => {
          setDetailOpen(false);
          setCurrentCustomer(undefined);
        }}
      >
        {currentCustomer && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="客户编号">{currentCustomer.customer_code}</Descriptions.Item>
            <Descriptions.Item label="客户名称">{currentCustomer.name}</Descriptions.Item>
            <Descriptions.Item label="收货人">{currentCustomer.recipient_name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{renderArrayTag(currentCustomer.phones)}</Descriptions.Item>
            <Descriptions.Item label="地址">{currentCustomer.address}</Descriptions.Item>
            <Descriptions.Item label="首购日期">
              {currentCustomer.first_purchase_date
                ? dayjs(currentCustomer.first_purchase_date).format('YYYY-MM-DD')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="备注">{currentCustomer.notes || '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  );
};

export default CustomersPage;
