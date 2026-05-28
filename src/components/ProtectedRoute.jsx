import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="bmm-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner-ring" style={{ width: 40, height: 40, borderWidth: 4, borderColor: '#0A1F5C', borderTopColor: 'transparent', margin: '0 auto 16px' }} />
          <p style={{ color: '#0A1F5C', fontWeight: 600 }}>Verifying Access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
