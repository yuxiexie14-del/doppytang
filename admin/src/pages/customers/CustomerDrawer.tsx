import { Drawer, Form, Input, Button, Space, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import type { Customer, CustomerInput } from '../../types';

interface CustomerDrawerProps {
  open: boolean;
  loading?: boolean;
  customer?: Customer;
  onClose: () => void;
  onSubmit: (values: CustomerInput) => Promise<void> | void;
}

const sanitizePhones = (phones?: string[]) => phones?.filter((phone) => phone && phone.trim()) ?? [];

const CustomerDrawer = ({ open, customer, loading, onClose, onSubmit }: CustomerDrawerProps) => {
  const [form] = Form.useForm<CustomerInput>();

  useEffect(() => {
    if (open) {
      if (customer) {
        form.setFieldsValue({
          ...customer,
          phones: customer.phones?.length ? customer.phones : [''],
          first_purchase_date: customer.first_purchase_date ? dayjs(customer.first_purchase_date) : null
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ phones: [''] });
      }
    }
  }, [open, customer, form]);

  const handleSubmit = async (formValues: CustomerInput) => {
    const payload: CustomerInput = {
      ...formValues,
      phones: sanitizePhones(formValues.phones),
      first_purchase_date: formValues.first_purchase_date
        ? dayjs(formValues.first_purchase_date).format('YYYY-MM-DD')
        : null
    };
    await onSubmit(payload);
    form.resetFields();
    form.setFieldsValue({ phones: [''] });
  };

  return (
    <Drawer
      title={customer ? `编辑客户：${customer.name}` : '新增客户'}
      open={open}
      width={520}
      onClose={() => {
        form.resetFields();
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
      <Form<CustomerInput> layout="vertical" form={form} onFinish={handleSubmit}>
        <Form.Item
          name="customer_code"
          label="客户编号"
          rules={[{ required: true, message: '请输入客户编号' }]}
          tooltip="示例：23001"
        >
          <Input placeholder="请输入客户编号" />
        </Form.Item>
        <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
          <Input placeholder="请输入客户名称" />
        </Form.Item>
        <Form.Item name="recipient_name" label="收货人" rules={[{ required: true, message: '请输入收货人' }]}>
          <Input placeholder="请输入收货人" />
        </Form.Item>
        <Form.Item label="联系电话">
          <Form.List name="phones">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field, index) => (
                  <Space key={field.key} align="baseline" style={{ display: 'flex' }}>
                    <Form.Item
                      {...field}
                      rules={[{ required: index === 0, message: '请输入联系电话' }]}
                      style={{ flex: 1 }}
                    >
                      <Input placeholder="请输入联系电话" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button type="link" onClick={() => remove(field.name)}>
                        删除
                      </Button>
                    )}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add('')} block>
                  新增电话
                </Button>
              </Space>
            )}
          </Form.List>
        </Form.Item>
        <Form.Item name="address" label="收货地址" rules={[{ required: true, message: '请输入收货地址' }]}>
          <Input.TextArea placeholder="请输入收货地址" rows={3} />
        </Form.Item>
        <Form.Item name="area_code" label="区域码">
          <Input placeholder="请输入区域码" maxLength={10} />
        </Form.Item>
        <Form.Item name="first_purchase_date" label="首购日期">
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={3} placeholder="备注信息" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default CustomerDrawer;
