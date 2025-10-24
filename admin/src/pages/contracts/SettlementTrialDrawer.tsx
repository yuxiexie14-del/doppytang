import { Alert, Button, Descriptions, Drawer, Form, Input, InputNumber, Space } from 'antd';
import { useEffect } from 'react';
import type { Contract, SettlementTrialResponse } from '../../types';

interface SettlementTrialDrawerProps {
  open: boolean;
  loading?: boolean;
  contract?: Contract;
  result?: SettlementTrialResponse;
  onSubmit: (values: { eggs_delivered?: number; price_override?: number; notes?: string }) => Promise<void> | void;
  onClose: () => void;
}

const SettlementTrialDrawer = ({ open, loading, contract, result, onSubmit, onClose }: SettlementTrialDrawerProps) => {
  const [form] = Form.useForm<{ eggs_delivered?: number; price_override?: number; notes?: string }>();

  useEffect(() => {
    if (open && contract) {
      form.setFieldsValue({
        eggs_delivered: contract.remaining_eggs ?? contract.total_eggs,
        price_override: contract.price,
        notes: undefined
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, contract, form]);

  const handleFinish = async (values: { eggs_delivered?: number; price_override?: number; notes?: string }) => {
    await onSubmit(values);
  };

  const disabled = !contract;

  return (
    <Drawer
      open={open}
      width={520}
      title={contract ? `价格试算：${contract.contract_code}` : '价格试算'}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={() => form.resetFields()} disabled={disabled}>
            重置
          </Button>
          <Button type="primary" loading={loading} onClick={() => form.submit()} disabled={disabled}>
            发起试算
          </Button>
        </Space>
      }
    >
      {contract ? (
        <Descriptions bordered size="small" column={1} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="合同编号">{contract.contract_code}</Descriptions.Item>
          <Descriptions.Item label="套餐">{contract.package_name}</Descriptions.Item>
          <Descriptions.Item label="客户">{contract.customer?.name ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="剩余鸡蛋">{contract.remaining_eggs ?? 0}</Descriptions.Item>
          <Descriptions.Item label="合同总鸡蛋">{contract.total_eggs}</Descriptions.Item>
          <Descriptions.Item label="合同价格">¥{contract.price}</Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert type="info" showIcon message="请选择需要试算的合同" style={{ marginBottom: 24 }} />
      )}

      <Form layout="vertical" form={form} onFinish={handleFinish} disabled={disabled}>
        <Form.Item name="eggs_delivered" label="试算鸡蛋数量">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="默认使用剩余鸡蛋数量" />
        </Form.Item>
        <Form.Item name="price_override" label="试算价格" tooltip="为空则使用合同价格">
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="请输入单价" />
        </Form.Item>
        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={3} placeholder="可填写试算说明" />
        </Form.Item>
      </Form>

      {result ? (
        <Descriptions bordered size="small" column={1} title="试算结果">
          <Descriptions.Item label="本次鸡蛋数">{result.eggs_delivered_total}</Descriptions.Item>
          <Descriptions.Item label="应收金额">¥{result.amount_due.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="状态">{result.status}</Descriptions.Item>
          <Descriptions.Item label="备注">{result.notes ?? '—'}</Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert type="info" showIcon message="提交表单以查看试算结果" />
      )}
    </Drawer>
  );
};

export default SettlementTrialDrawer;
