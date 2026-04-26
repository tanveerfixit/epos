import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Wrench, 
  FileText, 
  Users, 
  Package, 
  Home, 
  Smartphone,
  Search,
  ChevronDown,
  ShoppingBag,
  ClipboardList,
  Banknote,
  ArrowLeftRight,
  Shield,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CashRegister from './components/CashRegister';
import ProductList from './components/ProductList';
import InvoiceList from './components/InvoiceList';
import CustomerList from './components/CustomerList';
import CustomerDetails from './components/CustomerDetails';
import RepairList from './components/RepairList';
import DeviceInventory from './components/DeviceInventory';
import PurchaseOrderList from './components/PurchaseOrderList';
import PurchaseOrderDetail from './components/PurchaseOrderDetail';
import Dashboard from './components/Dashboard';
import InvoiceDetails from './components/InvoiceDetails';
import HomeMenu from './components/HomeMenu';
import SkuDeviceDetails from './components/SkuDeviceDetails';
import ManageData from './components/ManageData';
import EndOfDay from './components/EndOfDay';
import ErrorBoundary from './components/ErrorBoundary';
import CreateProduct from './components/CreateProduct';
import ProductDetails from './components/ProductDetails';
import AddInventory from './components/AddInventory';
import DeviceDetailView from './components/inventory/DeviceDetails';
import GettingStarted from './components/GettingStarted';
import BranchTransfer from './components/BranchTransfer';
import AdminPortal from './components/admin/AdminPortal';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AdminLoginPage from './components/auth/AdminLoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

type View = 'home' | 'dashboard' | 'register' | 'repairs' | 'invoices' | 'invoice-details' | 'customers' | 'customer-details' | 'products' | 'devices' | 'device-details' | 'sku-device-details' | 'create-product' | 'product-details' | 'add-inventory' | 'purchase-orders' | 'purchase-order-detail' | 'manage-data' | 'end-of-day' | 'getting-started' | 'transfers';
type AuthView = 'login' | 'signup' | 'forgot' | 'reset' | 'admin-login';

function AppInner() {
  const { currentUser, isAdmin, logout, loading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);
  const [selectedPoNumber, setSelectedPoNumber] = useState<string | null>(null);
  const [gettingStartedTab, setGettingStartedTab] = useState<string | undefined>(undefined);
  const [previousView, setPreviousView] = useState<View | null>(null);
  const [initiateDeposit, setInitiateDeposit] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Check for reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) { setResetToken(token); setAuthView('reset'); }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-[var(--border-base)] border-t-[var(--brand-primary)] rounded-full animate-spin mb-4" />
        <div className="text-[var(--text-muted)] font-bold text-sm tracking-widest uppercase animate-pulse">Initializing System...</div>
      </div>
    );
  }

  // Auth flow
  if (!currentUser) {
    if (authView === 'signup') return <SignupPage onGoLogin={() => setAuthView('login')} />;
    if (authView === 'forgot') return <ForgotPassword onBack={() => setAuthView('login')} />;
    if (authView === 'reset' && resetToken) return <ResetPassword token={resetToken} onGoLogin={() => { setResetToken(null); setAuthView('login'); window.history.replaceState({}, '', '/'); }} />;
    if (authView === 'admin-login') return <AdminLoginPage onBack={() => setAuthView('login')} />;
    return (
      <LoginPage 
        onGoSignup={() => setAuthView('signup')} 
        onForgotPassword={() => setAuthView('forgot')} 
        onAdminLogin={() => setAuthView('admin-login')}
      />
    );
  }

  const handleSidebarNavigate = (view: View) => {
    setSelectedCustomerId(null);
    setSelectedProductId(null);
    setSelectedInvoiceId(null);
    setSelectedPoId(null);
    setSelectedDeviceId(null);
    setInitiateDeposit(false);
    setCurrentView(view);
  };

  const menuItems = [
    { id: 'register', label: 'Cash Register', icon: ShoppingCart },
    { id: 'repairs', label: 'Repairs', icon: Wrench },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingBag },
    { id: 'end-of-day', label: 'End of Day', icon: Banknote },
    { id: 'devices', label: 'Devices Inventory', icon: Smartphone },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeMenu onNavigate={(view) => handleSidebarNavigate(view as View)} />;
      case 'dashboard': return <Dashboard />;
      case 'register': return (
        <CashRegister 
          preSelectedCustomerId={selectedCustomerId}
          initiateDeposit={initiateDeposit}
          onViewCustomers={() => setCurrentView('customers')} 
          onSelectCustomer={(id) => {
            setSelectedCustomerId(id);
            setCurrentView('customer-details');
          }}
          onSelectProduct={(id) => {
            setSelectedProductId(id);
            setCurrentView('product-details');
          }}
        />
      );
      case 'products': return (
        <ProductList 
          onCreateProduct={() => setCurrentView('create-product')} 
          onSelectProduct={(id) => {
            setSelectedProductId(id);
            setCurrentView('product-details');
          }}
        />
      );
      case 'product-details': return (
        <ProductDetails 
          productId={selectedProductId!} 
          onBack={() => setCurrentView('products')}
          onAddInventory={(id) => {
            setSelectedProductId(id);
            setCurrentView('add-inventory');
          }}
          onViewDevices={(id) => {
            setPreviousView('product-details');
            setSelectedProductId(id);
            setCurrentView('sku-device-details');
          }}
        />
      );
      case 'add-inventory': return (
        <AddInventory 
          productId={selectedProductId!} 
          onBack={() => setCurrentView('product-details')}
          onSuccess={() => setCurrentView('product-details')}
        />
      );
      case 'create-product': return <CreateProduct onCancel={() => setCurrentView('products')} onSave={() => setCurrentView('products')} />;
      case 'invoices': return (
        <InvoiceList 
          onSelectInvoice={(id) => {
            setSelectedInvoiceId(id);
            setCurrentView('invoice-details');
          }} 
          onSelectCustomer={(id) => {
            setSelectedCustomerId(id);
            setCurrentView('customer-details');
          }}
        />
      );
      case 'invoice-details': return (
        <InvoiceDetails 
          invoiceId={selectedInvoiceId!} 
          onBack={() => setCurrentView('invoices')} 
          onSelectCustomer={(id) => {
            setSelectedCustomerId(id);
            setCurrentView('customer-details');
          }}
        />
      );
      case 'customers': return (
        <CustomerList 
          onSelectCustomer={(id) => {
            setSelectedCustomerId(id);
            setCurrentView('customer-details');
          }} 
        />
      );
      case 'customer-details': return (
        <CustomerDetails 
          customerId={selectedCustomerId!} 
          onBack={() => setCurrentView('customers')} 
          onSelectInvoice={(id) => {
            setSelectedInvoiceId(id);
            setCurrentView('invoice-details');
          }}
          onCreateInvoice={() => {
            setInitiateDeposit(false);
            setCurrentView('register');
          }}
          onCreateRepair={() => setCurrentView('repairs')}
          onDeposit={() => {
            setInitiateDeposit(true);
            setCurrentView('register');
          }}
        />
      );
      case 'repairs': return <RepairList preSelectedCustomerId={selectedCustomerId} />;
      case 'devices': return (
        <DeviceInventory 
          onSelectPO={(poNumber) => {
            fetch(`/api/purchase-orders/by-number/${poNumber}`)
              .then(res => res.json())
              .then(data => {
                if (data.id) {
                  setSelectedPoId(data.id);
                  setCurrentView('purchase-order-detail');
                }
              });
          }}
          onSelectProduct={(skuId) => {
            setPreviousView('devices');
            setSelectedProductId(skuId);
            setCurrentView('sku-device-details');
          }}
          onSelectDevice={(id) => {
            setSelectedDeviceId(id);
            setCurrentView('device-details');
          }}
        />
      );
      case 'device-details': return (
        <DeviceDetailView 
          deviceId={selectedDeviceId!} 
          onBack={() => setCurrentView('devices')} 
          onOpenPrinterSettings={() => {
            setGettingStartedTab('manage-label-printer');
            setCurrentView('getting-started');
          }}
        />
      );
      case 'sku-device-details': return (
        <SkuDeviceDetails 
          skuId={selectedProductId!} 
          onBack={() => setCurrentView(previousView || 'devices')} 
        />
      );
      case 'purchase-orders': return (
        <PurchaseOrderList 
          onSelectPO={(id) => {
            setSelectedPoId(id);
            setCurrentView('purchase-order-detail');
          }}
        />
      );
      case 'purchase-order-detail': return (
        <PurchaseOrderDetail 
          poId={selectedPoId || 1}
          onBack={() => setCurrentView('purchase-orders')}
        />
      );
      case 'manage-data': return <ManageData />;
      case 'end-of-day': return <EndOfDay />;
      case 'getting-started': return <GettingStarted initialTab={gettingStartedTab} />;
      case 'transfers': return <BranchTransfer />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-app)] font-sans text-[var(--text-main)] overflow-hidden transition-colors duration-300">
      {showAdminPortal && isAdmin && <AdminPortal onClose={() => setShowAdminPortal(false)} />}

      {/* Header */}
      <header className="h-14 bg-[var(--bg-header)] flex items-center justify-between z-30 transition-colors duration-300">
        <div className="flex h-full items-center">
          <div className="w-28 flex items-center justify-center h-full">
            <button 
              onClick={() => setCurrentView('home')}
              className="transition-transform hover:scale-110 p-2"
            >
              <Home size={24} className="text-[var(--text-main)]" />
            </button>
          </div>
          
          <div className="pl-6 flex flex-col items-start font-sans">
            <h1 className="text-lg font-bold text-[var(--text-main)] tracking-tight leading-none">PHONE LAB</h1>
          </div>
        </div>

        <div className="flex-1 max-w-xl px-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Search here" 
              className="w-full bg-[var(--bg-card)] border border-[var(--border-base)] rounded-full py-1.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-main)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-6">
          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-main)] flex items-center justify-center"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAdmin && (
            <button 
              onClick={() => setShowAdminPortal(true)}
              className="h-8 overflow-hidden group bg-transparent text-[var(--text-main)] px-3 rounded-full text-[11px] uppercase tracking-widest transition-all cursor-pointer"
            >
              <div className="flex flex-col transition-transform duration-500 group-hover:-translate-y-8 ease-in-out">
                <div className="h-8 flex items-center justify-center whitespace-nowrap">
                  Admin
                </div>
                <div className="h-8 flex items-center justify-center whitespace-nowrap text-blue-600">
                  Log In
                </div>
              </div>
            </button>
          )}
          
          <button 
            onClick={logout}
            className="h-8 overflow-hidden group bg-[var(--bg-card)] text-[var(--text-main)] px-5 rounded-full text-[11px] uppercase tracking-widest transition-all border border-[var(--border-base)] shadow-sm cursor-pointer"
          >
            <div className="flex flex-col transition-transform duration-500 group-hover:-translate-y-8 ease-in-out">
              <div className="h-8 flex items-center justify-center whitespace-nowrap">
                {currentUser.name}
              </div>
              <div className="h-8 flex items-center justify-center whitespace-nowrap text-red-500">
                Log Out
              </div>
            </div>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-28 bg-[var(--bg-sidebar)] text-white flex flex-col z-20 shadow-xl">
          <nav className="flex-1 py-1 flex flex-col items-center">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSidebarNavigate(item.id as View)}
                className={`w-full flex flex-col items-center justify-center py-5 px-1 transition-all duration-200 border-l-4 ${
                  currentView === item.id 
                    ? 'bg-white/10 border-[var(--brand-primary)] text-white' 
                    : 'border-transparent text-[var(--text-muted-more)] hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={24} />
                <span className="text-[11px] mt-2 text-center font-normal leading-tight uppercase tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>

        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-[var(--bg-app)] transition-colors duration-300">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="h-full"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
