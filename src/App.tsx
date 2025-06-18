import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Wallet, Send, ArrowUpRight, ArrowDownLeft, QrCode, CreditCard, Users, BarChart3, Shield, Globe } from 'lucide-react';
import './App.css';

// Components
const Header: React.FC = () => (
  <header className="bg-blue-600 text-white shadow-lg">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-yellow-400 p-2 rounded-lg">
            <Wallet className="h-8 w-8 text-blue-800" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">NomadPay</h1>
            <p className="text-blue-100 text-sm">Global Finance for Digital Nomads</p>
          </div>
        </div>
        <nav className="hidden md:flex space-x-6">
          <a href="#features" className="hover:text-yellow-300 transition-colors">Features</a>
          <a href="#about" className="hover:text-yellow-300 transition-colors">About</a>
          <a href="#contact" className="hover:text-yellow-300 transition-colors">Contact</a>
        </nav>
      </div>
    </div>
  </header>
);

const Hero: React.FC = () => (
  <section className="hero-gradient py-20">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-5xl font-bold text-gray-800 mb-6">
        Banking Without Borders
      </h2>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        The complete financial platform designed for digital nomads. Send money globally, 
        manage multiple currencies, and access your funds anywhere in the world.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="btn btn-primary">
          <span>Get Started</span>
          <ArrowUpRight className="h-5 w-5" />
        </button>
        <button className="btn btn-secondary">
          Watch Demo
        </button>
      </div>
    </div>
  </section>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="card">
    <div className="icon-box">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const Features: React.FC = () => (
  <section id="features" className="py-20 bg-gray-50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Everything You Need for Global Finance
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Powerful features designed specifically for the nomadic lifestyle
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          icon={<Send className="h-8 w-8 text-blue-600" />}
          title="Instant Global Transfers"
          description="Send money to anyone, anywhere in the world with real-time exchange rates and minimal fees."
        />
        <FeatureCard
          icon={<Wallet className="h-8 w-8 text-blue-600" />}
          title="Multi-Currency Wallets"
          description="Hold and manage multiple currencies including USD, EUR, BTC, ETH, and more in one secure wallet."
        />
        <FeatureCard
          icon={<QrCode className="h-8 w-8 text-blue-600" />}
          title="QR Code Payments"
          description="Pay and receive payments instantly using QR codes. Perfect for local transactions while traveling."
        />
        <FeatureCard
          icon={<CreditCard className="h-8 w-8 text-blue-600" />}
          title="Virtual Cards"
          description="Generate virtual debit cards for online purchases and secure transactions worldwide."
        />
        <FeatureCard
          icon={<Shield className="h-8 w-8 text-blue-600" />}
          title="Bank-Level Security"
          description="Advanced encryption, 2FA, and biometric authentication keep your funds completely secure."
        />
        <FeatureCard
          icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
          title="Expense Tracking"
          description="Track your spending across countries and currencies with detailed analytics and insights."
        />
      </div>
    </div>
  </section>
);

const Stats: React.FC = () => (
  <section className="py-20 bg-blue-600 text-white">
    <div className="container mx-auto px-6">
      <div className="stats-grid">
        <div>
          <div className="text-4xl font-bold mb-2">150+</div>
          <div className="text-blue-200">Countries Supported</div>
        </div>
        <div>
          <div className="text-4xl font-bold mb-2">$2.5B+</div>
          <div className="text-blue-200">Transferred Globally</div>
        </div>
        <div>
          <div className="text-4xl font-bold mb-2">500K+</div>
          <div className="text-blue-200">Active Nomads</div>
        </div>
        <div>
          <div className="text-4xl font-bold mb-2">99.9%</div>
          <div className="text-blue-200">Uptime Guarantee</div>
        </div>
      </div>
    </div>
  </section>
);

const About: React.FC = () => (
  <section id="about" className="py-20">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Built for the Modern Nomad
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            NomadPay was created by digital nomads, for digital nomads. We understand the unique 
            financial challenges of location-independent living and have built a platform that 
            makes global finance simple, secure, and accessible.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Globe className="h-6 w-6 text-blue-600" />
              <span className="text-gray-700">Available in 150+ countries</span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-gray-700">Trusted by 500,000+ nomads</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-gray-700">Bank-level security & compliance</span>
            </div>
          </div>
        </div>
        <div className="hero-gradient p-8 rounded-2xl">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Transfer Time</span>
                <span className="font-semibold text-blue-600">&lt; 2 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transfer Fees</span>
                <span className="font-semibold text-blue-600">From 0.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Supported Currencies</span>
                <span className="font-semibold text-blue-600">50+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer Support</span>
                <span className="font-semibold text-blue-600">24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const CTA: React.FC = () => (
  <section className="py-20 gradient-bg text-white">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold mb-6">
        Ready to Go Global?
      </h2>
      <p className="text-xl mb-8 max-w-2xl mx-auto">
        Join thousands of digital nomads who trust NomadPay for their global financial needs.
        Get started in minutes.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="bg-yellow-400 hover:bg-yellow-500 text-blue-800 px-8 py-4 rounded-lg font-semibold transition-colors">
          Create Free Account
        </button>
        <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold transition-colors">
          Contact Sales
        </button>
      </div>
    </div>
  </section>
);

const Footer: React.FC = () => (
  <footer className="bg-gray-800 text-white py-12">
    <div className="container mx-auto px-6">
      <div className="footer-grid">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-yellow-400 p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-blue-800" />
            </div>
            <span className="text-xl font-bold">NomadPay</span>
          </div>
          <p className="text-gray-400">
            Global finance platform for digital nomads worldwide.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Product</h3>
          <ul className="footer-links">
            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            <li><a href="#" className="hover:text-white transition-colors">API</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Company</h3>
          <ul className="footer-links">
            <li><a href="#" className="hover:text-white transition-colors">About</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Support</h3>
          <ul className="footer-links">
            <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2025 NomadPay. All rights reserved. Built with ❤️ for digital nomads worldwide.</p>
      </div>
    </div>
  </footer>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <Features />
              <Stats />
              <About />
              <CTA />
            </>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;

