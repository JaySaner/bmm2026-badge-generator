import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/admin/dashboard');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(`An error occurred: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bmm-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F0F4F8' }}>
      <div className="bmm-card" style={{ maxWidth: 400, width: '100%', margin: '0 20px', padding: '40px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo.png" alt="BMM 2026" style={{ height: 60, marginBottom: 16 }} />
          <h2 className="card-title">Admin Login</h2>
          <p className="card-desc">Secure access for authorized personnel only.</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="admin@example.com" 
              required 
            />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="bmm-btn-primary" 
            disabled={loading}
            style={{ marginTop: 24 }}
          >
            {loading ? <span className="spinner-ring" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Log In'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button 
              type="button" 
              className="bmm-btn-ghost" 
              onClick={() => navigate(location.state?.from || '/')}
            >
              ← Go Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
