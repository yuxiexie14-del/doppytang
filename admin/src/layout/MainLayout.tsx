import { Layout, Menu, Typography, Button } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  DeploymentUnitOutlined,
  ScheduleOutlined,
  CarOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { useMemo } from 'react';
import { useAuth } from '../utils/auth';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/customers',
    icon: <UserOutlined />,
    label: '客户管理'
  },
  {
    key: '/contracts',
    icon: <FileTextOutlined />,
    label: '合同管理'
  },
  {
    key: '/deliveries',
    icon: <CarOutlined />,
    label: '配送任务'
  },
  {
    key: '/batches',
    icon: <DeploymentUnitOutlined />,
    label: '批次管理'
  },
  {
    key: '/rearing-plans',
    icon: <ScheduleOutlined />,
    label: '养殖计划'
  }
];

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith('/deliveries')) {
      return '/deliveries';
    }
    if (location.pathname.startsWith('/rearing-plans')) {
      return '/rearing-plans';
    }
    if (location.pathname.startsWith('/batches')) {
      return '/batches';
    }
    if (location.pathname.startsWith('/contracts')) {
      return '/contracts';
    }
    if (location.pathname.startsWith('/customers')) {
      return '/customers';
    }
    return '/customers';
  }, [location.pathname]);

  const handleSelect: MenuProps['onClick'] = (info) => {
    navigate(info.key);
  };

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <Layout className="app-layout">
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 64, margin: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 8 }} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleSelect}
        />
      </Sider>
      <Layout>
        <Header className="site-header">
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            客户定养管理后台
          </Typography.Title>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} type="link" style={{ color: '#fff' }}>
            退出
          </Button>
        </Header>
        <Content className="site-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
