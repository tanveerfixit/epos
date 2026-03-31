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
  LogOut
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
import GettingStarted from './components/GettingStarted';
import BranchTransfer from './components/BranchTransfer';
import AdminPortal from './components/admin/AdminPortal';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AdminLoginPage from './components/auth/AdminLoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

type View = 'home' | 'dashboard' | 'register' | 'repairs' | 'invoices' | 'invoice-details' | 'customers' | 'customer-details' | 'products' | 'devices' | 'sku-device-details' | 'create-product' | 'product-details' | 'add-inventory' | 'purchase-orders' | 'purchase-order-detail' | 'manage-data' | 'end-of-day' | 'getting-started' | 'transfers';
type AuthView = 'login' | 'signup' | 'forgot' | 'reset' | 'admin-login';

function AppInner() {
  const { currentUser, isAdmin, logout, loading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);
  const [selectedPoNumber, setSelectedPoNumber] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<View | null>(null);

  // Check for reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) { setResetToken(token); setAuthView('reset'); }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <div className="text-slate-500 font-bold text-sm tracking-widest uppercase animate-pulse">Initializing System...</div>
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
          onViewCustomers={() => setCurrentView('customers')} 
          onSelectCustomer={(id) => {
            setSelectedCustomerId(id);
            setCurrentView('customer-details');
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
          onCreateInvoice={() => setCurrentView('register')}
          onCreateRepair={() => setCurrentView('repairs')}
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
      case 'getting-started': return <GettingStarted />;
      case 'transfers': return <BranchTransfer />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f4f7f9] font-sans text-slate-900 overflow-hidden">
      {showAdminPortal && isAdmin && <AdminPortal onClose={() => setShowAdminPortal(false)} />}

      {/* Sidebar */}
      <aside className="w-28 bg-[#2c3e50] text-white flex flex-col z-20">
        <button 
          onClick={() => setCurrentView('home')}
          className={`h-16 flex items-center justify-center border-b border-white/10 transition-colors hover:bg-[#34495e] ${currentView === 'home' ? 'bg-[#34495e]' : ''}`}
        >
          <Home size={32} className="text-[#3498db]" />
        </button>

        <nav className="flex-1 py-2 flex flex-col items-center">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSidebarNavigate(item.id as View)}
              className={`w-full flex flex-col items-center justify-center py-5 px-1 transition-all duration-200 border-l-4 ${
                currentView === item.id 
                  ? 'bg-[#34495e] border-[#3498db] text-white' 
                  : 'border-transparent text-slate-400 hover:bg-[#34495e] hover:text-white'
              }`}
            >
              <item.icon size={24} />
              <span className="text-[11px] mt-2 text-center font-bold leading-tight uppercase tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout at bottom */}
        <button onClick={logout} className="h-12 flex items-center justify-center border-t border-white/10 hover:bg-red-500/20 transition-colors text-slate-400 hover:text-red-300 gap-1.5 text-xs">
          <LogOut size={16} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Smartphone size={24} className="text-[#2980b9]" />
            <h1 className="text-xl font-bold text-[#2980b9]">Phone Lab</h1>
          </div>

          <div className="flex-1 max-w-xl px-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search here" 
                className="w-full bg-[#f8f9fa] border border-slate-200 rounded py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button onClick={() => setShowAdminPortal(true)}
                className="flex items-center gap-1.5 bg-[#2c3e50] hover:bg-[#34495e] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
                <Shield size={14} />
                Admin
              </button>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="text-right">
                <div className="font-medium text-xs text-slate-800 leading-tight">{currentUser.name}</div>
                <div className="text-xs text-slate-400 leading-tight">{currentUser.branch_name}</div>
              </div>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
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
        </div>
      </main>
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
