import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch
} from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import type { Contract, ContractInput, Customer } from '../../types';

interface ContractDrawerProps {
  open: boolean;
  loading?: boolean;
  contract?: Contract;
  customers: Customer[];
  customerLoading?: boolean;
  selectedCustomer?: Customer;
  onCustomerSearch?: (keyword: string) => void;
  onCustomerChange?: (customerId: number | null) => void;
  onClose: () => void;
  onSubmit: (values: ContractInput) => Promise<void> | void;
}

const ContractDrawer = ({
  open,
  loading,
  contract,
  customers,
  customerLoading,
  selectedCustomer,
  onCustomerSearch,
  onCustomerChange,
  onClose,
  onSubmit
}: ContractDrawerProps) => {
  const [form] = Form.useForm<ContractInput>();

  useEffect(() => {
    if (!open) {
      return;
    }
    if (contract) {
      form.setFieldsValue({
        ...contract,
        start_date: contract.start_date ? dayjs(contract.start_date) : null
      });
      if (contract.customer_id) {
        onCustomerChange?.(contract.customer_id);
      }
    } else {
      form.resetFields();
      onCustomerChange?.(null);
    }
  }, [open, contract, form, onCustomerChange]);

  const handleFinish = async (values: ContractInput) => {
    const payload: ContractInput = {
      ...values,
      start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    };
    await onSubmit(payload);
    form.resetFields();
  };

  const handleCustomerSelect = (value: number | undefined) => {
    if (typeof value === 'number') {
      onCustomerChange?.(value);
    } else {
      onCustomerChange?.(null);
    }
  };

  return (
    <Drawer
      title={contract ? `编辑合同：${contract.contract_code}` : '新增合同'}
      open={open}
      width={600}
      onClose={() => {
        form.resetFields();
        onCustomerChange?.(null);
        onClose();
      }}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={() => form.resetFields()}>重置</Button>
          <Button type="primary" loading={loading} onClick={() => form.submit()}>
            保存
          </Button>
        </Space>
      }
    >
      <Form<ContractInput> layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item
          name="contract_code"
          label="合同编号"
          rules={[{ required: true, message: '请输入合同编号' }]}
          tooltip="示例：HT202401"
        >
          <Input placeholder="请输入合同编号" />
        </Form.Item>
        <Form.Item name="customer_id" label="客户" rules={[{ required: true, message: '请选择客户' }]}> 
          <Select
            placeholder="请选择客户"
            allowClear
            showSearch
            filterOption={false}
            loading={customerLoading}
            onSearch={onCustomerSearch}
            onChange={handleCustomerSelect}
            onClear={() => onCustomerChange?.(null)}
            optionLabelProp="label"
          >
            {customers.map((customer) => (
              <Select.Option key={customer.id} value={customer.id} label={`${customer.name}（${customer.customer_code}）`}>
                {customer.name}（{customer.customer_code}）
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        {selectedCustomer ? (
          <Descriptions bordered size="small" column={1} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="收货人">{selectedCustomer.recipient_name || selectedCustomer.name}</Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {selectedCustomer.phones?.length ? selectedCustomer.phones.join(' / ') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="收货地址">{selectedCustomer.address || '—'}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Alert type="info" showIcon message="请选择客户以查看收货信息" style={{ marginBottom: 24 }} />
        )}
        <Form.Item name="package_name" label="套餐名称" rules={[{ required: true, message: '请输入套餐名称' }]}> 
          <Input placeholder="请输入套餐名称" />
        </Form.Item>
        <Form.Item name="hen_type" label="老母鸡品种" rules={[{ required: true, message: '请输入老母鸡品种' }]}> 
          <Input placeholder="请输入老母鸡品种" />
        </Form.Item>
        <Form.Item name="egg_type" label="鸡蛋品种" rules={[{ required: true, message: '请输入鸡蛋品种' }]}> 
          <Input placeholder="请输入鸡蛋品种" />
        </Form.Item>
        <Form.Item name="total_eggs" label="总鸡蛋数量" rules={[{ required: true, message: '请输入鸡蛋数量' }]}> 
          <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入鸡蛋数量" />
        </Form.Item>
        <Form.Item name="remaining_eggs" label="剩余鸡蛋数量"> 
          <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入剩余鸡蛋数量" />
        </Form.Item>
        <Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}> 
          <InputNumber style={{ width: '100%' }} min={0} step={1} placeholder="请输入价格" />
        </Form.Item>
        <Form.Item name="start_date" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}> 
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请输入状态' }]}> 
          <Input placeholder="请输入状态，如 active" />
        </Form.Item>
        <Form.Item name="hen_delivered" label="老母鸡已交付" valuePropName="checked"> 
          <Switch />
        </Form.Item>
        <Form.Item name="description" label="备注"> 
          <Input.TextArea rows={3} placeholder="备注信息" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default ContractDrawer;
