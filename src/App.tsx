import React, { useState, useEffect } from 'react';
import './App.css';

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  currency: string;
  recipient?: string;
  sender?: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
}

interface Balance {
  currency: string;
  amount: number;
}

// Production API endpoint for NomadPay backend
const API_BASE = 'https://nomadpay-api.onrender.com';

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<string>('home');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState<{ [key: string]: string }>({});

  // Data states
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState<string>('$0.00');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('nomadpay_token');
    const userData = localStorage.getItem('nomadpay_user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
      setCurrentSection('dashboard');
      loadUserData();
    }
  }, []);

  const showSection = (section: string) => {
    setCurrentSection(section);
    clearMessages();
  };

  const clearMessages = () => {
    setErrors({});
    setSuccess({});
  };

  const setLoadingState = (key: string, state: boolean) => {
    setLoading(prev => ({ ...prev, [key]: state }));
  };

  const setError = (key: string, message: string) => {
    setErrors(prev => ({ ...prev, [key]: message }));
  };

  const setSuccessMessage = (key: string, message: string) => {
    setSuccess(prev => ({ ...prev, [key]: message }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setLoadingState('login', true);
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('nomadpay_token', data.data.access_token);
        localStorage.setItem('nomadpay_user', JSON.stringify(data.data.user));
        setIsAuthenticated(true);
        setUser(data.data.user);
        setSuccessMessage('login', 'Welcome back! Successfully logged in.');
        setTimeout(() => {
          setCurrentSection('dashboard');
          loadUserData();
        }, 1000);
      } else {
        setError('login', data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('login', 'Network error. Please check your connection.');
    } finally {
      setLoadingState('login', false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setLoadingState('register', true);
    clearMessages();

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('nomadpay_token', data.data.access_token);
        localStorage.setItem('nomadpay_user', JSON.stringify(data.data.user));
        setIsAuthenticated(true);
        setUser(data.data.user);
        setSuccessMessage('register', 'Account created successfully! Welcome to NomadPay.');
        setTimeout(() => {
          setCurrentSection('dashboard');
          loadUserData();
        }, 1000);
      } else {
        setError('register', data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError('register', 'Network error. Please check your connection.');
    } finally {
      setLoadingState('register', false);
    }
  };

  const logout = () => {
    localStorage.removeItem('nomadpay_token');
    localStorage.removeItem('nomadpay_user');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentSection('home');
    setBalances([]);
    setTransactions([]);
    setTotalBalance('$0.00');
  };

  const loadUserData = async () => {
    const token = localStorage.getItem('nomadpay_token');
    if (!token) return;

    // Load balances
    setLoadingState('balance', true);
    try {
      // Mock data for demonstration
      const mockBalances: Balance[] = [
        { currency: 'USD', amount: 1250.75 },
        { currency: 'EUR', amount: 850.50 },
        { currency: 'BTC', amount: 0.05 }
      ];
      setBalances(mockBalances);
      setTotalBalance('$2,100.25');
    } catch (error) {
      setError('balance', 'Failed to load wallet balance');
    } finally {
      setLoadingState('balance', false);
    }

    // Load transactions
    setLoadingState('transactions', true);
    try {
      // Mock data for demonstration
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'receive',
          amount: 500,
          currency: 'USD',
          sender: 'john@example.com',
          status: 'completed',
          timestamp: '2024-06-24 10:30'
        },
        {
          id: '2',
          type: 'send',
          amount: 250,
          currency: 'EUR',
          recipient: 'jane@example.com',
          status: 'pending',
          timestamp: '2024-06-24 09:15'
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      setError('transactions', 'Failed to load transactions');
    } finally {
      setLoadingState('transactions', false);
    }
  };

  const refreshData = () => {
    if (isAuthenticated) {
      loadUserData();
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <nav className="nav container">
          <div className="logo">
            🌺 NomadPay
          </div>
          <ul className="nav-links">
            <li><a href="#" onClick={() => showSection('home')}>Home</a></li>
            {isAuthenticated && (
              <>
                <li><a href="#" onClick={() => showSection('dashboard')}>Dashboard</a></li>
                <li><a href="#" onClick={() => showSection('send')}>Send</a></li>
                <li><a href="#" onClick={() => showSection('receive')}>Receive</a></li>
              </>
            )}
          </ul>
          <div className="auth-buttons">
            {!isAuthenticated ? (
              <>
                <a href="#" className="btn btn-secondary" onClick={() => showSection('login')}>Login</a>
                <a href="#" className="btn btn-primary" onClick={() => showSection('register')}>Sign Up</a>
              </>
            ) : (
              <a href="#" className="btn btn-secondary" onClick={logout}>Logout</a>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content container">
        {/* Home Section */}
        {currentSection === 'home' && (
          <section className="hero">
            <h1>Welcome to NomadPay</h1>
            <p>The secure digital wallet designed for digital nomads and global travelers. Send, receive, and manage your money anywhere in the world.</p>
            <div className="mt-2">
              <a href="#" className="btn btn-primary" onClick={() => showSection('register')}>Get Started</a>
              <a href="#" className="btn btn-secondary" onClick={() => showSection('login')}>Sign In</a>
            </div>
          </section>
        )}

        {/* Login Form */}
        {currentSection === 'login' && (
          <section className="form-container active">
            <h2 className="text-center mb-2">Welcome Back</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" name="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" name="password" required />
              </div>
              {loading.login && (
                <div className="loading active">
                  <div className="spinner"></div>
                  Signing you in...
                </div>
              )}
              {errors.login && <div className="error-message" style={{display: 'block'}}>{errors.login}</div>}
              {success.login && <div className="success-message" style={{display: 'block'}}>{success.login}</div>}
              <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={loading.login}>
                Sign In
              </button>
            </form>
            <p className="text-center mt-2">
              Don't have an account? <a href="#" onClick={() => showSection('register')} style={{color: '#FFD700'}}>Sign up</a>
            </p>
          </section>
        )}

        {/* Register Form */}
        {currentSection === 'register' && (
          <section className="form-container active">
            <h2 className="text-center mb-2">Join NomadPay</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" name="name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" name="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" name="password" required />
              </div>
              {loading.register && (
                <div className="loading active">
                  <div className="spinner"></div>
                  Creating your account...
                </div>
              )}
              {errors.register && <div className="error-message" style={{display: 'block'}}>{errors.register}</div>}
              {success.register && <div className="success-message" style={{display: 'block'}}>{success.register}</div>}
              <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={loading.register}>
                Create Account
              </button>
            </form>
            <p className="text-center mt-2">
              Already have an account? <a href="#" onClick={() => showSection('login')} style={{color: '#FFD700'}}>Sign in</a>
            </p>
          </section>
        )}

        {/* Dashboard */}
        {currentSection === 'dashboard' && isAuthenticated && (
          <section className="dashboard active">
            <div className="card">
              <h3>💰 Wallet Balance</h3>
              {loading.balance ? (
                <div className="loading active">
                  <div className="spinner"></div>
                  Loading balance...
                </div>
              ) : (
                <div>
                  <div className="balance">{totalBalance}</div>
                  <div>
                    {balances.map((balance, index) => (
                      <div key={index} style={{marginBottom: '0.5rem'}}>
                        {balance.currency}: {balance.amount.toFixed(2)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.balance && <div className="error-message" style={{display: 'block'}}>{errors.balance}</div>}
            </div>

            <div className="card">
              <h3>📊 Recent Transactions</h3>
              {loading.transactions ? (
                <div className="loading active">
                  <div className="spinner"></div>
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <p>No transactions yet</p>
                  <p>Start by sending or receiving money!</p>
                </div>
              ) : (
                <div>
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-item">
                      <div>
                        <div>{transaction.type === 'send' ? '↗️ Sent' : '↙️ Received'}</div>
                        <div style={{fontSize: '0.9rem', color: '#888'}}>
                          {transaction.type === 'send' ? `To: ${transaction.recipient}` : `From: ${transaction.sender}`}
                        </div>
                      </div>
                      <div>
                        <div>{transaction.amount} {transaction.currency}</div>
                        <div className={`transaction-status status-${transaction.status}`}>
                          {transaction.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.transactions && <div className="error-message" style={{display: 'block'}}>{errors.transactions}</div>}
            </div>

            <div className="card">
              <h3>🚀 Quick Actions</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <button className="btn btn-primary" onClick={() => showSection('send')}>Send Money</button>
                <button className="btn btn-secondary" onClick={() => showSection('receive')}>Receive Money</button>
                <button className="btn btn-secondary" onClick={refreshData}>Refresh Data</button>
              </div>
            </div>
          </section>
        )}

        {/* Send Money */}
        {currentSection === 'send' && isAuthenticated && (
          <section className="form-container active">
            <h2 className="text-center mb-2">Send Money</h2>
            <form>
              <div className="form-group">
                <label htmlFor="recipient">Recipient Address</label>
                <input type="text" placeholder="Enter wallet address or email" required />
              </div>
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input type="number" step="0.01" min="0.01" placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select style={{width: '100%', padding: '0.75rem', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.2)', color: '#ffffff'}}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
                Send Money
              </button>
            </form>
            <p className="text-center mt-2">
              <a href="#" onClick={() => showSection('dashboard')} style={{color: '#FFD700'}}>← Back to Dashboard</a>
            </p>
          </section>
        )}

        {/* Receive Money */}
        {currentSection === 'receive' && isAuthenticated && (
          <section className="form-container active">
            <h2 className="text-center mb-2">Receive Money</h2>
            <div className="qr-container">
              <p>Share your wallet address or QR code:</p>
              <div className="qr-code">
                <div style={{width: '200px', height: '200px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333'}}>
                  QR Code
                </div>
              </div>
              <div style={{background: 'rgba(0, 0, 0, 0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem'}}>
                <p style={{fontSize: '0.9rem', wordBreak: 'break-all'}}>
                  nomadpay:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
                </p>
              </div>
            </div>
            <p className="text-center mt-2">
              <a href="#" onClick={() => showSection('dashboard')} style={{color: '#FFD700'}}>← Back to Dashboard</a>
            </p>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;

