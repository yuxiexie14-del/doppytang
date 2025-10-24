import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';

interface LoginFormValues {
  username: string;
  password: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const onFinish = (values: LoginFormValues) => {
    console.info('模拟登录', values);
    setToken('mock-token');
    navigate('/customers', { replace: true });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
      <Card style={{ width: 360 }}>
        <Typography.Title level={4} style={{ textAlign: 'center' }}>
          客户定养管理后台
        </Typography.Title>
        <Form<LoginFormValues> layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="username"
            label="账号"
            rules={[{ required: true, message: '请输入账号' }]}
            initialValue="admin"
          >
            <Input prefix={<UserOutlined />} placeholder="手机号或账号" autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
            initialValue="123456"
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
