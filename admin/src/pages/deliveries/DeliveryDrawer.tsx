import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect } from 'react';
import type { Contract } from '../../types';

export interface DeliveryFormValues {
  delivered_at?: Dayjs;
  eggs_delivered: number;
  packaging: 'family_30' | 'gift_45' | 'bulk';
  vegetables?: string;
  kitchen_gift?: string;
  delivered_by?: string;
  notes?: string;
  hen_delivered?: boolean;
}

interface DeliveryDrawerProps {
  open: boolean;
  loading?: boolean;
  contract?: Contract;
  onSubmit: (values: DeliveryFormValues) => Promise<void> | void;
  onClose: () => void;
}

const DeliveryDrawer = ({ open, loading, contract, onSubmit, onClose }: DeliveryDrawerProps) => {
  const [form] = Form.useForm<DeliveryFormValues>();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        delivered_at: dayjs(),
        eggs_delivered: 30,
        packaging: 'family_30',
        vegetables: undefined,
        kitchen_gift: undefined,
        delivered_by: undefined,
        notes: undefined,
        hen_delivered: contract?.hen_delivered ?? false
      });
    }
  }, [open, form, contract]);

  const handleFinish = async (values: DeliveryFormValues) => {
    const payload: DeliveryFormValues = {
      ...values,
      delivered_at: values.delivered_at ?? dayjs(),
      packaging: values.packaging || 'family_30',
      eggs_delivered: values.eggs_delivered ?? 30
    };
    await onSubmit(payload);
    form.resetFields();
  };

  const disabled = !contract;

  return (
    <Drawer
      title={contract ? `登记配送：${contract.customer?.name ?? contract.contract_code}` : '登记配送'}
      open={open}
      width={520}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={() => form.resetFields()} disabled={disabled}>
            重置
          </Button>
          <Button type="primary" loading={loading} onClick={() => form.submit()} disabled={disabled}>
            提交登记
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" form={form} onFinish={handleFinish} disabled={disabled}>
        <Form.Item name="delivered_at" label="配送日期" rules={[{ required: true, message: '请选择配送日期' }]}> 
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="eggs_delivered" label="鸡蛋数量" rules={[{ required: true, message: '请输入鸡蛋数量' }]}> 
          <InputNumber min={1} style={{ width: '100%' }} placeholder="默认 30" />
        </Form.Item>
        <Form.Item name="packaging" label="包装方式" rules={[{ required: true, message: '请选择包装方式' }]}> 
          <Select>
            <Select.Option value="family_30">家庭装 30 枚</Select.Option>
            <Select.Option value="gift_45">礼盒 45 枚</Select.Option>
            <Select.Option value="bulk">散装</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="vegetables" label="蔬菜"> 
          <Input placeholder="可填写本次配送蔬菜" />
        </Form.Item>
        <Form.Item name="kitchen_gift" label="厨房小礼品"> 
          <Input placeholder="可填写本次配送礼品" />
        </Form.Item>
        <Form.Item name="delivered_by" label="配送员"> 
          <Input placeholder="请输入配送员姓名" />
        </Form.Item>
        <Form.Item name="hen_delivered" label="老母鸡已交付" valuePropName="checked"> 
          <Switch />
        </Form.Item>
        <Form.Item name="notes" label="备注"> 
          <Input.TextArea rows={3} placeholder="补充说明" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default DeliveryDrawer;
