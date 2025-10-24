import { Navigate, useRoutes } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import LoginPage from './pages/Login';
import CustomersPage from './pages/customers/CustomersPage';
import ContractsPage from './pages/contracts/ContractsPage';
import BatchesPage from './pages/batches/BatchesPage';
import RearingPlansPage from './pages/rearingPlans/RearingPlansPage';
import DeliveriesPage from './pages/deliveries/DeliveriesPage';
import { useAuth } from './utils/auth';

const App = () => {
  const { token } = useAuth();
  const isAuthed = Boolean(token);

  const element = useRoutes([
    {
      path: '/',
      element: isAuthed ? <MainLayout /> : <Navigate to="/login" replace />,
      children: [
        { index: true, element: <Navigate to="/customers" replace /> },
        { path: 'customers', element: <CustomersPage /> },
        { path: 'contracts', element: <ContractsPage /> },
        { path: 'deliveries', element: <DeliveriesPage /> },
        { path: 'batches', element: <BatchesPage /> },
        { path: 'rearing-plans', element: <RearingPlansPage /> }
      ]
    },
    {
      path: '/login',
      element: isAuthed ? <Navigate to="/customers" replace /> : <LoginPage />
    },
    { path: '*', element: <Navigate to="/" replace /> }
  ]);

  return element;
};

export default App;
