import { Drawer, Form, Input, DatePicker, Select, Button, Space } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import type { Batch, BatchInput, Contract } from '../../types';

interface BatchDrawerProps {
  open: boolean;
  loading?: boolean;
  batch?: Batch;
  contracts: Contract[];
  onClose: () => void;
  onSubmit: (values: BatchInput) => Promise<void> | void;
}

const BatchDrawer = ({ open, loading, batch, contracts, onClose, onSubmit }: BatchDrawerProps) => {
  const [form] = Form.useForm<BatchInput>();

  useEffect(() => {
    if (open) {
      if (batch) {
        form.setFieldsValue({
          ...batch,
          start_date: batch.start_date ? dayjs(batch.start_date) : null,
          end_date: batch.end_date ? dayjs(batch.end_date) : null
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, batch, form]);

  const handleFinish = async (values: BatchInput) => {
    const payload: BatchInput = {
      ...values,
      start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : null
    };
    await onSubmit(payload);
    form.resetFields();
  };

  return (
    <Drawer
      title={batch ? `编辑批次：${batch.name}` : '新增批次'}
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
      <Form<BatchInput> layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item name="contract_id" label="所属合同" rules={[{ required: true, message: '请选择合同' }]}>
          <Select placeholder="请选择合同">
            {contracts.map((contract) => (
              <Select.Option key={contract.id} value={contract.id}>
                {contract.contract_code}（{contract.package_name}）
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="name" label="批次名称" rules={[{ required: true, message: '请输入批次名称' }]}>
          <Input placeholder="请输入批次名称" />
        </Form.Item>
        <Form.Item name="start_date" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="end_date" label="结束日期">
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="status" label="状态" rules={[{ required: true, message: '请输入状态' }]}>
          <Input placeholder="请输入状态，如 planned" />
        </Form.Item>
        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={3} placeholder="备注信息" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default BatchDrawer;
