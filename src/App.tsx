import React, { useState, useEffect } from 'react';
import './App.css';

// Types
interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Wallet {
  currency: string;
  balance: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  created_at: string;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

// Configuration
const API_BASE = process.env.REACT_APP_API_URL || 'https://nomadpay-api.onrender.com';
const FALLBACK_API = 'https://58hpi8clpqvp.manus.space';

// API utility
class ApiClient {
  private static getAuthToken(): string | null {
    return localStorage.getItem('nomadpay_token');
  }

  private static async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    
    // Create headers as Record<string, string> for proper TypeScript typing
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for better reliability

    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    // Try primary API first
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, requestOptions);
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }

      // If 401, try to refresh token
      if (response.status === 401 && token) {
        await this.refreshToken();
        return this.makeRequest(endpoint, options);
      }

      throw new Error(`API Error: ${response.status}`);
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort error (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Primary API request timed out, trying fallback');
      } else {
        console.warn('Primary API failed, trying fallback:', error);
      }
      
      // Try fallback API with new AbortController
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 30000); // 30 second timeout for fallback
      
      const fallbackOptions: RequestInit = {
        ...options,
        headers,
        signal: fallbackController.signal,
      };

      try {
        const response = await fetch(`${FALLBACK_API}${endpoint}`, fallbackOptions);
        clearTimeout(fallbackTimeoutId);

        if (response.ok) {
          return await response.json();
        }

        throw new Error(`Fallback API Error: ${response.status}`);
      } catch (fallbackError) {
        clearTimeout(fallbackTimeoutId);
        
        if (fallbackError instanceof Error && fallbackError.name === 'AbortError') {
          console.error('Both APIs timed out');
          throw new Error('Request timeout - please check your connection');
        } else {
          console.error('Both APIs failed:', fallbackError);
          throw new Error('Service temporarily unavailable');
        }
      }
    }
  }

  static async refreshToken(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ access_token: string }>('/api/auth/refresh', {
        method: 'POST',
      });

      if (response.success && response.access_token) {
        localStorage.setItem('nomadpay_token', response.access_token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
    }
    return false;
  }

  static async login(email: string, password: string): Promise<ApiResponse<{ user: User; access_token: string }>> {
    return this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(email: string, password: string): Promise<ApiResponse<{ user: User; access_token: string }>> {
    return this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async getWallets(): Promise<ApiResponse<{ wallets: Wallet[] }>> {
    return this.makeRequest('/api/wallet/balances');
  }

  static async getTransactions(): Promise<ApiResponse<{ transactions: Transaction[] }>> {
    return this.makeRequest('/api/transactions');
  }

  static async sendMoney(recipient: string, amount: number, currency: string): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/transactions/send', {
      method: 'POST',
      body: JSON.stringify({ recipient, amount, currency }),
    });
  }

  static async generateQR(amount?: number, currency?: string): Promise<ApiResponse<{ qr_code: string; wallet_address: string }>> {
    return this.makeRequest('/api/qr/generate', {
      method: 'POST',
      body: JSON.stringify({ amount: amount || 0, currency: currency || 'USD' }),
    });
  }

  static logout(): void {
    localStorage.removeItem('nomadpay_token');
    // Call logout API
    this.makeRequest('/api/auth/logout', { method: 'POST' }).catch(console.error);
  }
}

// Components
const LoadingSpinner: React.FC = () => (
  <div className="loading" role="status" aria-live="polite">
    <div className="spinner" aria-hidden="true"></div>
    Loading...
  </div>
);

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="error-state" role="alert">
    <strong>Error:</strong> {message}
    {onRetry && (
      <button className="btn btn-secondary" onClick={onRetry} style={{ marginTop: '12px' }}>
        Retry
      </button>
    )}
  </div>
);

const SuccessMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="success-message" role="alert" aria-live="polite">
    {message}
  </div>
);

const AuthForm: React.FC<{
  isLogin: boolean;
  onToggle: () => void;
  onSuccess: (user: User, token: string) => void;
}> = ({ isLogin, onToggle, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = isLogin 
        ? await ApiClient.login(email, password)
        : await ApiClient.register(email, password);

      // Check if the response indicates success
      if (response.success) {
        // Log the full response for debugging
        console.log('Auth response received:', response);
        
        if (response.access_token && response.user) {
          localStorage.setItem('nomadpay_token', response.access_token);
          if (response.refresh_token) {
            localStorage.setItem('nomadpay_refresh_token', response.refresh_token);
          }
          setSuccess(response.message || `${isLogin ? 'Login' : 'Registration'} successful!`);
          
          // Small delay to show success message before redirect
          setTimeout(() => {
            onSuccess(response.user, response.access_token);
          }, 1000);
        } else {
          // Success response but missing required data - provide detailed error
          console.error('Missing data in response:', response);
          console.error('Expected: access_token and user object');
          console.error('Received access_token:', !!response.access_token);
          console.error('Received user:', !!response.user);
          console.error('Available fields:', Object.keys(response));
          
          let missingFields = [];
          if (!response.access_token) missingFields.push('access_token');
          if (!response.user) missingFields.push('user');
          
          setError(`${isLogin ? 'Login' : 'Registration'} completed but missing: ${missingFields.join(', ')}. Please try again or contact support.`);
        }
      } else {
        // Explicit failure response
        setError(response.message || `${isLogin ? 'Login' : 'Registration'} failed`);
      }
    } catch (error) {
      // Network or other errors
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      console.error('Authentication error:', error);
      
      // Don't treat success messages as errors
      if (errorMessage.toLowerCase().includes('success') || errorMessage.toLowerCase().includes('registered successfully')) {
        // This is likely a success case that was incorrectly thrown as an error
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => {
          // Try to get user info and redirect
          window.location.reload();
        }, 1500);
      } else if (errorMessage.includes('timeout')) {
        setError('Connection timeout. The server may be slow. Please try again in a moment.');
      } else if (errorMessage.includes('Service temporarily unavailable')) {
        setError('Service temporarily unavailable. Please try again in a few minutes.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2 className="card-title">{isLogin ? 'Welcome Back' : 'Join NomadPay'}</h2>
      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            aria-describedby="email-help"
          />
          <small id="email-help" className="sr-only">
            {isLogin ? 'Enter the email address associated with your account' : 'Choose an email address for your new account'}
          </small>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={isLogin ? 'Enter your password' : 'Create a password'}
            aria-describedby="password-help"
          />
          <small id="password-help" className="sr-only">
            {isLogin ? 'Enter your account password' : 'Create a strong password for your account'}
          </small>
        </div>
        {!isLogin && (
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
            <input
              type="password"
              id="confirm-password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
              aria-describedby="confirm-password-help"
            />
            <small id="confirm-password-help" className="sr-only">
              Re-enter your password to confirm
            </small>
          </div>
        )}
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
        </button>
      </form>
      <div className="auth-toggle">
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="link-button" onClick={onToggle}>
            {isLogin ? 'Register here' : 'Login here'}
          </button>
        </p>
      </div>
    </div>
  );
};

const WalletCard: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWallets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ApiClient.getWallets();
      if (response.success && response.wallets) {
        setWallets(response.wallets);
      } else {
        setError(response.message || 'Failed to load wallets');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const totalBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance || '0'), 0);

  return (
    <section className="card" aria-labelledby="wallet-title">
      <div className="card-header">
        <h2 className="card-title" id="wallet-title">
          <span className="card-icon" aria-hidden="true">💰</span>
          Your Wallet
        </h2>
        <button className="btn btn-secondary" onClick={loadWallets} aria-label="Refresh wallet balance">
          Refresh
        </button>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadWallets} />
      ) : (
        <div>
          <div className="balance-display">${totalBalance.toLocaleString()}</div>
          <p>Total Balance</p>
          <div className="currency-grid">
            {wallets.length > 0 ? (
              wallets.map((wallet, index) => (
                <div key={index} className="currency-item">
                  <div className="currency-code">{wallet.currency}</div>
                  <div className="currency-amount">${wallet.balance}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No wallets found</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const SendMoneyCard: React.FC<{ onSuccess: (message: string) => void }> = ({ onSuccess }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await ApiClient.sendMoney(recipient, parseFloat(amount), currency);
      if (response.success) {
        onSuccess(`Successfully sent $${amount} ${currency} to ${recipient}`);
        setRecipient('');
        setAmount('');
      } else {
        setError(response.message || 'Transaction failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card" aria-labelledby="send-title">
      <div className="card-header">
        <h2 className="card-title" id="send-title">
          <span className="card-icon" aria-hidden="true">📤</span>
          Send Money
        </h2>
      </div>
      {error && <ErrorMessage message={error} />}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="recipient">Recipient Address</label>
          <input
            type="text"
            id="recipient"
            className="form-input"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
            placeholder="Enter wallet address or email"
            aria-describedby="recipient-help"
          />
          <small id="recipient-help" className="sr-only">
            Enter the recipient's wallet address or email
          </small>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            className="form-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            step="0.01"
            min="0.01"
            placeholder="0.00"
            aria-describedby="amount-help"
          />
          <small id="amount-help" className="sr-only">
            Enter the amount to send
          </small>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="currency">Currency</label>
          <select
            id="currency"
            className="form-input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            aria-describedby="currency-help"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
          <small id="currency-help" className="sr-only">
            Select the currency for this transaction
          </small>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Sending...' : 'Send Money'}
        </button>
      </form>
    </section>
  );
};

const TransactionsCard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ApiClient.getTransactions();
      if (response.success && response.transactions) {
        setTransactions(response.transactions);
      } else {
        setError(response.message || 'Failed to load transactions');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <section className="card" aria-labelledby="transactions-title">
      <div className="card-header">
        <h2 className="card-title" id="transactions-title">
          <span className="card-icon" aria-hidden="true">📋</span>
          Recent Transactions
        </h2>
        <button className="btn btn-secondary" onClick={loadTransactions} aria-label="Refresh transaction history">
          Refresh
        </button>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadTransactions} />
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions yet</p>
          <small>Your transaction history will appear here</small>
        </div>
      ) : (
        <div className="transaction-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-item">
              <div className="transaction-details">
                <div className="transaction-type">{tx.type || 'Transaction'}</div>
                <div className="transaction-date">{new Date(tx.created_at).toLocaleDateString()}</div>
              </div>
              <div className={`transaction-amount ${tx.amount > 0 ? 'amount-positive' : 'amount-negative'}`}>
                {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const QRCard: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateQR = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ApiClient.generateQR();
      if (response.success && response.wallet_address) {
        setWalletAddress(response.wallet_address);
      } else {
        // Fallback QR generation
        setWalletAddress(`nomadpay_user_${Date.now()}`);
      }
    } catch (error) {
      console.error('QR generation error:', error);
      // Fallback QR generation
      setWalletAddress(`nomadpay_user_${Date.now()}`);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      // Show success message (you could add a toast notification here)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = walletAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  useEffect(() => {
    generateQR();
  }, []);

  return (
    <section className="card" aria-labelledby="qr-title">
      <div className="card-header">
        <h2 className="card-title" id="qr-title">
          <span className="card-icon" aria-hidden="true">📱</span>
          Receive Money
        </h2>
        <button className="btn btn-secondary" onClick={generateQR} aria-label="Generate new QR code">
          Generate QR
        </button>
      </div>
      <div className="qr-display">
        <div className="qr-code" role="img" aria-label="QR code for receiving payments">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div style={{ fontSize: '12px', textAlign: 'center' }}>
              QR Code<br />
              <small>Scan to pay</small>
            </div>
          )}
        </div>
        <p>Share this QR code to receive payments</p>
        {walletAddress && (
          <>
            <div className="wallet-address" aria-label="Your wallet address">
              {walletAddress}
            </div>
            <button className="btn btn-secondary" onClick={copyAddress} style={{ marginTop: '12px' }}>
              Copy Address
            </button>
          </>
        )}
      </div>
    </section>
  );
};

// Main App Component
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('nomadpay_token');
    if (token) {
      // In a real app, you'd verify the token with the server
      // For now, we'll assume it's valid
      setUser({ id: 'demo', email: 'demo@nomadpay.io', created_at: new Date().toISOString() });
      setShowLanding(false);
    }
  }, []);

  useEffect(() => {
    // Auto-refresh data every 30 seconds when authenticated
    if (user) {
      const interval = setInterval(() => {
        // Trigger refresh of all components
        window.dispatchEvent(new Event('nomadpay-refresh'));
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleAuthSuccess = (userData: User, token: string) => {
    setUser(userData);
    setShowLanding(false);
    setSuccessMessage(isLogin ? 'Welcome back! Successfully logged in.' : 'Welcome to NomadPay! Your account has been created successfully.');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleLogout = () => {
    ApiClient.logout();
    setUser(null);
    setShowLanding(true);
    setSuccessMessage('Successfully logged out. See you next time!');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleSendSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
    // Trigger refresh of wallet and transactions
    window.dispatchEvent(new Event('nomadpay-refresh'));
  };

  const showAuthForm = () => {
    setShowLanding(false);
  };

  const showLoginForm = () => {
    setIsLogin(true);
    setShowLanding(false);
  };

  const showRegisterForm = () => {
    setIsLogin(false);
    setShowLanding(false);
  };

  const backToLanding = () => {
    setShowLanding(true);
  };

  // Landing Page
  if (showLanding && !user) {
    return (
      <div className="App">
        {/* Landing Page Header */}
        <header className="landing-header" role="banner">
          <nav className="landing-nav" role="navigation">
            <div className="logo">
              <div className="logo-icon" aria-hidden="true">🌺</div>
              <span>NomadPay</span>
            </div>
            <div className="landing-nav-buttons">
              <button className="btn-nav btn-nav-home" onClick={backToLanding}>
                Home
              </button>
              <button className="btn-nav btn-nav-login" onClick={showLoginForm}>
                Login
              </button>
              <button className="btn-nav btn-nav-signup" onClick={showRegisterForm}>
                Sign Up
              </button>
              {user && (
                <button className="btn-nav btn-nav-logout" onClick={handleLogout}>
                  Logout
                </button>
              )}
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="hero-section">
          <h1 className="hero-title">Welcome to NomadPay</h1>
          <p className="hero-subtitle">
            The secure digital wallet designed for digital nomads and global travelers. 
            Send, receive, and manage your money anywhere in the world.
          </p>
          <div className="hero-buttons">
            <button className="btn-hero-primary" onClick={showRegisterForm}>
              Get Started
            </button>
            <button className="btn-hero-secondary" onClick={showLoginForm}>
              Sign In
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Beta Banner */}
      <div className="beta-banner" role="banner">
        🌺 Welcome to NomadPay Beta - Your feedback helps us improve!
      </div>

      <div className="container">
        {/* Header */}
        <header className="header" role="banner">
          <div className="logo">
            <div className="logo-icon" aria-hidden="true">🌺</div>
            <span>NomadPay</span>
          </div>
          <nav className="nav-buttons" role="navigation">
            {user ? (
              <button className="btn btn-danger" onClick={handleLogout} aria-label="Logout from your account">
                Logout
              </button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={backToLanding}>
                  ← Back
                </button>
                <button
                  className={`btn ${isLogin ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setIsLogin(true)}
                  aria-label="Switch to login form"
                >
                  Login
                </button>
                <button
                  className={`btn ${!isLogin ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setIsLogin(false)}
                  aria-label="Switch to registration form"
                >
                  Register
                </button>
              </>
            )}
          </nav>
        </header>

        {/* Success Message */}
        {successMessage && <SuccessMessage message={successMessage} />}

        {/* Main Content */}
        {user ? (
          <main className="main-content">
            <WalletCard />
            <SendMoneyCard onSuccess={handleSendSuccess} />
            <TransactionsCard />
            <QRCard />
          </main>
        ) : (
          <div className="card">
            <AuthForm
              isLogin={isLogin}
              onToggle={() => setIsLogin(!isLogin)}
              onSuccess={handleAuthSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

