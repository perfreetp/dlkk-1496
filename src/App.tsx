import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import CriticalValueListPage from '@/pages/CriticalValueList';
import RecipientManagementPage from '@/pages/RecipientManagement';
import AcknowledgeCenterPage from '@/pages/AcknowledgeCenter';
import EscalationDashboardPage from '@/pages/EscalationDashboard';
import ProcessingRecordsPage from '@/pages/ProcessingRecords';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<CriticalValueListPage />} />
        <Route path="/recipients" element={<RecipientManagementPage />} />
        <Route path="/acknowledge" element={<AcknowledgeCenterPage />} />
        <Route path="/escalation" element={<EscalationDashboardPage />} />
        <Route path="/records" element={<ProcessingRecordsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
