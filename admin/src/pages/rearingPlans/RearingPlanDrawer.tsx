import { Drawer, Form, Input, DatePicker, Select, InputNumber, Button, Space } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import type { Batch, RearingPlan, RearingPlanInput } from '../../types';

interface RearingPlanDrawerProps {
  open: boolean;
  loading?: boolean;
  plan?: RearingPlan;
  batches: Batch[];
  onClose: () => void;
  onSubmit: (values: RearingPlanInput) => Promise<void> | void;
}

const RearingPlanDrawer = ({ open, loading, plan, batches, onClose, onSubmit }: RearingPlanDrawerProps) => {
  const [form] = Form.useForm<RearingPlanInput>();

  useEffect(() => {
    if (open) {
      if (plan) {
        form.setFieldsValue({
          ...plan,
          scheduled_date: plan.scheduled_date ? dayjs(plan.scheduled_date) : null
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, plan, form]);

  const handleFinish = async (values: RearingPlanInput) => {
    const payload: RearingPlanInput = {
      ...values,
      scheduled_date: values.scheduled_date
        ? dayjs(values.scheduled_date).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD')
    };
    await onSubmit(payload);
    form.resetFields();
  };

  return (
    <Drawer
      title={plan ? `编辑养殖计划：${plan.activity}` : '新增养殖计划'}
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
      <Form<RearingPlanInput> layout="vertical" form={form} onFinish={handleFinish}>
        <Form.Item name="batch_id" label="所属批次" rules={[{ required: true, message: '请选择批次' }]}>
          <Select placeholder="请选择批次">
            {batches.map((batch) => (
              <Select.Option key={batch.id} value={batch.id}>
                {batch.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="scheduled_date" label="计划日期" rules={[{ required: true, message: '请选择日期' }]}>
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="activity" label="计划内容" rules={[{ required: true, message: '请输入计划内容' }]}>
          <Input placeholder="如：巡检/喂料" />
        </Form.Item>
        <Form.Item name="feed_amount" label="饲料用量(kg)">
          <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="请输入饲料用量" />
        </Form.Item>
        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={3} placeholder="备注信息" />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default RearingPlanDrawer;
