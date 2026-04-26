import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  XCircle
} from 'lucide-react';
import ThermalReceipt from './ThermalReceipt';
import { Product, Customer, Invoice } from '../types';

// Import refactored components
import { ProductSearchBar } from './cash-register/ProductSearchBar';
import { SearchResults } from './cash-register/SearchResults';
import { CartTable } from './cash-register/CartTable';
import { ActivityLog } from './cash-register/ActivityLog';
import { Sidebar } from './cash-register/Sidebar';
import { ReviewCheckoutModal } from './cash-register/ReviewCheckoutModal';
import { ImeiSelectorModal } from './cash-register/ImeiSelectorModal';
import { DepositAmountModal } from './cash-register/DepositAmountModal';
import { UpdateCartModal } from './cash-register/UpdateCartModal';
import CustomerFormModal from './CustomerFormModal';
import { CartItem, PaymentEntry, Activity } from './cash-register/types';
import { useThermalSettings } from '../hooks/useThermalSettings';

interface CashRegisterProps {
  onViewCustomers?: () => void;
  onSelectCustomer?: (id: number) => void;
  preSelectedCustomerId?: number | null;
  initiateDeposit?: boolean;
  onSelectProduct?: (id: number) => void;
}

export default function CashRegister({ onViewCustomers, onSelectCustomer, preSelectedCustomerId, initiateDeposit, onSelectProduct }: CashRegisterProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('epos_cart');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    const saved = localStorage.getItem('epos_customer');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [availableMethods, setAvailableMethods] = useState<string[]>(['Cash', 'Card']);
  const [addedPayments, setAddedPayments] = useState<PaymentEntry[]>(() => {
    const saved = localStorage.getItem('epos_payments');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [lastInvoiceData, setLastInvoiceData] = useState<any>(null);
  const [printType, setPrintType] = useState<'Thermal' | 'A4'>('Thermal');
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('epos_activities');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  
  // New Customer Modal State
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const walkInCustomerRef = useRef<Customer | null>(null);

  // IMEI Selector State
  const [showImeiSelector, setShowImeiSelector] = useState(false);
  const [imeiSelectorProduct, setImeiSelectorProduct] = useState<any>(null);
  const [availableImeis, setAvailableImeis] = useState<any[]>([]);
  const [isLoadingImeis, setIsLoadingImeis] = useState(false);
  const { settings, company } = useThermalSettings();

  // Update Cart Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  // Deposit State
  const [showDepositModal, setShowDepositModal] = useState(false);

  const [depositProductInfo, setDepositProductInfo] = useState<any>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('epos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('epos_customer', JSON.stringify(selectedCustomer));
  }, [selectedCustomer]);

  useEffect(() => {
    localStorage.setItem('epos_payments', JSON.stringify(addedPayments));
  }, [addedPayments]);

  useEffect(() => {
    localStorage.setItem('epos_activities', JSON.stringify(activities));
  }, [activities]);

  // Effects
  useEffect(() => {
    fetch('/api/products/special/get-deposit-product')
      .then(res => res.json())
      .then(data => setDepositProductInfo(data))
      .catch(err => console.error('Error fetching deposit product:', err));
  }, []);

  useEffect(() => {
    if (initiateDeposit && preSelectedCustomerId && !showDepositModal) {
      setShowDepositModal(true);
    }
  }, [initiateDeposit, preSelectedCustomerId]);

  useEffect(() => {
    // Fetch payment methods
    fetch('/api/payment-methods')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const names = data.map((m: any) => m.name);
          setAvailableMethods(names);
          if (!names.includes(paymentMethod)) {
            setPaymentMethod(names[0]);
          }
        }
      })
      .catch(err => console.error('Error fetching payment methods:', err));
  }, []);

  // Fetch "Walk-in Customer" on startup (to keep a reference if needed, but don't select by default)
  useEffect(() => {
    const fetchWalkIn = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const customers = await response.json();
          const walkIn = customers.find((c: any) => c.name === 'Walk-in Customer');
          if (walkIn) {
            walkInCustomerRef.current = walkIn;
          }
        }
      } catch (error) {
        console.error('Error fetching walk-in customer:', error);
      }
    };
    fetchWalkIn();
  }, []);

  // Fetch pre-selected customer if provided
  useEffect(() => {
    if (preSelectedCustomerId) {
      fetch(`/api/customers/${preSelectedCustomerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setSelectedCustomer(data);
            addActivity('Customer Selected', `${data.name} attached to sale`, 'customer');
          }
        })
        .catch(err => console.error('Error fetching pre-selected customer:', err));
    }
  }, [preSelectedCustomerId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        fetchProducts();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        fetchCustomers();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setCustomerResults([]);
    }
  }, [customerSearch]);

  // Handlers
  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=products`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(customerSearch)}&type=customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomerResults(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const addActivity = (action: string, details: string, type: Activity['type'] = 'system') => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action,
      details,
      type
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 20));
  };

  const addToCart = (product: Product | any) => {
    // If it's a serialized product and no IMEI is selected yet, open the selector
    if (product.product_type === 'serialized' && !product.imei) {
      handleOpenImeiSelector(product);
      return;
    }

    setCart(prevCart => {
      // For serialized products, we match by product id AND device_id/imei
      const existingItemIndex = prevCart.findIndex(item => 
        item.id === product.id && 
        (product.product_type !== 'serialized' || item.device_id === product.device_id)
      );

      if (existingItemIndex > -1 && product.product_type !== 'serialized') {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += 1;
        return newCart;
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });

    addActivity('Added to Cart', `${product.product_name} added`, 'stock');
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (productId: number, delta: number, deviceId?: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId && (!deviceId || item.device_id === deviceId)) {
          const newQty = Math.max(1, item.quantity + delta);
          if (newQty !== item.quantity) {
            addActivity('Quantity Changed', `${item.product_name}: ${item.quantity} → ${newQty}`, 'stock');
          }
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const updatePrice = (productId: number, newPrice: number, deviceId?: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId && (!deviceId || item.device_id === deviceId)) {
          const oldPrice = item.customPrice ?? item.selling_price;
          if (newPrice !== oldPrice) {
            addActivity('Price Changed', `${item.product_name}: €${oldPrice.toFixed(2)} → €${newPrice.toFixed(2)}`, 'sale');
          }
          return { ...item, customPrice: newPrice };
        }
        return item;
      });
    });
  };

  const handleEditItem = (item: CartItem) => {
    setEditingItem(item);
    setShowUpdateModal(true);
  };

  const handleUpdateCartItem = (updatedFields: Partial<CartItem>) => {
    if (!editingItem) return;

    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === editingItem.id && (!editingItem.device_id || item.device_id === editingItem.device_id)) {
          const updatedItem = { ...item, ...updatedFields };
          
          // Log activity for significant changes
          if (updatedFields.quantity && updatedFields.quantity !== item.quantity) {
            addActivity('Quantity Updated', `${item.product_name}: ${item.quantity} → ${updatedFields.quantity}`, 'stock');
          }
          if (updatedFields.customPrice && updatedFields.customPrice !== (item.customPrice ?? item.selling_price)) {
            addActivity('Price Updated', `${item.product_name}: €${(item.customPrice ?? item.selling_price).toFixed(2)} → €${updatedFields.customPrice.toFixed(2)}`, 'sale');
          }
          if (updatedFields.discount !== undefined) {
            addActivity('Discount Applied', `${item.product_name}: ${updatedFields.discount}${updatedFields.discountType === 'percentage' ? '%' : '€'} discount`, 'sale');
          }

          return updatedItem;
        }
        return item;
      });
    });

    setShowUpdateModal(false);
    setEditingItem(null);
  };

  const removeFromCart = (productId: number, deviceId?: number) => {
    const itemToRemove = cart.find(item => item.id === productId && (!deviceId || item.device_id === deviceId));
    setCart(prevCart => prevCart.filter(item => !(item.id === productId && (!deviceId || item.device_id === deviceId))));
    if (itemToRemove) {
      addActivity('Removed from Cart', `${itemToRemove.product_name} removed`, 'stock');
    }
  };

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (paymentMethod === 'Wallet') {
      const balance = selectedCustomer?.wallet_balance || 0;
      if (amount > balance) {
        alert(`Insufficient wallet balance. Available: €${balance.toFixed(2)}`);
        return;
      }
    }

    setAddedPayments(prev => [...prev, { method: paymentMethod, amount }]);
    setPaymentAmount('');
    addActivity('Payment Added', `€${amount.toFixed(2)} via ${paymentMethod}`, 'sale');
  };

  const removePayment = (index: number) => {
    setAddedPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddDepositToCart = (amount: number) => {
    if (!depositProductInfo || !selectedCustomer) return;
    
    const existingIndex = cart.findIndex(c => c.is_deposit);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        price: newCart[existingIndex].price + amount,
        selling_price: (newCart[existingIndex].selling_price || 0) + amount,
        customPrice: (newCart[existingIndex].customPrice || 0) + amount,
        total: newCart[existingIndex].total + amount
      };
      setCart(newCart);
    } else {
      setCart(prev => [{
        id: depositProductInfo.sku_id,
        name: depositProductInfo.product_name,
        category: 'Service',
        price: amount,
        selling_price: amount,
        customPrice: amount,
        quantity: 1,
        total: amount,
        is_deposit: true
      }, ...prev]);
    }
    
    setShowDepositModal(false);
    addActivity('Item Added', `Wallet Deposit for €${amount.toFixed(2)}`, 'item');
  };

  const handleOpenImeiSelector = async (product: Product) => {
    setImeiSelectorProduct(product);
    setShowImeiSelector(true);
    setIsLoadingImeis(true);
    try {
      const response = await fetch(`/api/products/${product.product_id}/available-devices`);
      if (response.ok) {
        const data = await response.json();
        setAvailableImeis(data);
      }
    } catch (error) {
      console.error('Error fetching IMEIs:', error);
    } finally {
      setIsLoadingImeis(false);
    }
  };

  const handleSaveNewCustomer = async (customerData: Partial<Customer>) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      if (response.ok) {
        const customer = await response.json();
        setSelectedCustomer(customer);
        setShowNewCustomerModal(false);
        addActivity('New Customer', `${customer.name} registered`, 'customer');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowReviewModal(true);
  };

  const handleFinalizeTransaction = async (printPreference: 'Thermal' | 'A4' | null) => {
    const invoiceData = {
      customer_id: selectedCustomer?.id || null,
      subtotal,
      tax_total: 0,
      discount_total: 0,
      grand_total: total,
      items: cart.map(item => {
        const itemPrice = item.customPrice ?? item.selling_price;
        let itemTotal = itemPrice * item.quantity;
        if (item.discount) {
          if (item.discountType === 'percentage') {
            itemTotal = itemTotal * (1 - item.discount / 100);
          } else {
            itemTotal = itemTotal - item.discount;
          }
        }
        return {
          sku_id: item.id,
          device_id: item.device_id,
          imei: item.imei,
          quantity: item.quantity,
          price: itemPrice,
          discount: item.discount || 0,
          discount_type: item.discountType || 'percentage',
          total: Math.max(0, itemTotal),
          is_deposit: item.is_deposit || false,
          notes: item.notes || ''
        };
      }),
      payments: addedPayments,
      activities: activities
    };

    setIsFinalizing(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const fullInvoice = await response.json();
        
        setLastInvoiceData(fullInvoice);
        setShowReviewModal(false);
        addActivity('Checkout Complete', `Invoice #${fullInvoice.invoice_number} generated`, 'sale');

        if (printPreference) {
          setPrintType(printPreference);
          setTimeout(() => {
            window.print();
            resetRegister();
          }, 300);
        } else {
          resetRegister();
        }
      } else {
        const err = await response.json();
        alert('Checkout failed: ' + (err.error || 'Server error'));
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Checkout failed: ' + (error.message || error));
    } finally {
      setIsFinalizing(false);
    }
  };

  const resetRegister = () => {
    setCart([]);
    setSelectedCustomer(null);
    setAddedPayments([]);
    setPaymentAmount('');
    setShowReviewModal(false);
    setLastInvoiceData(null);
    setSearchQuery('');
    setCustomerSearch('');
    setActivities([]); // Reset activities for the new invoice
    
    // Clear persistence
    localStorage.removeItem('epos_cart');
    localStorage.removeItem('epos_customer');
    localStorage.removeItem('epos_payments');
    localStorage.removeItem('epos_activities');
  };

  const handlePrint = (type: 'Thermal' | 'A4') => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.customPrice ?? item.selling_price) * item.quantity, 0);
  
  const discountTotal = cart.reduce((sum, item) => {
    if (!item.discount) return sum;
    const itemSubtotal = (item.customPrice ?? item.selling_price) * item.quantity;
    if (item.discountType === 'percentage') {
      return sum + (itemSubtotal * (item.discount / 100));
    } else {
      return sum + item.discount;
    }
  }, 0);

  const total = Math.max(0, subtotal - discountTotal);
  const paidAmount = addedPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = total - paidAmount;
  const isPaymentComplete = remainingAmount <= 0.01;

  useEffect(() => {
    if (remainingAmount > 0) {
      setPaymentAmount(remainingAmount.toFixed(2));
    } else {
      setPaymentAmount('');
    }
  }, [remainingAmount]);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)] overflow-hidden transition-colors duration-300">
      {/* Header Area */}
      <div className="bg-[var(--bg-card)] px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-normal text-[var(--text-main)] uppercase tracking-wide">Register</h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden px-6 py-0 gap-0">
        {/* Left Side: Product Search & Cart */}
        <div className="flex-1 flex flex-col pt-6 pb-6 pr-6 border-r border-[var(--border-base)] min-w-0">
          {/* Search Bar & Results (Floating setup) */}
          <div className="shrink-0 mb-3 relative z-50">
            <ProductSearchBar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
            
            {/* Search Results (Floating) */}
            <SearchResults 
              results={searchResults}
              searchQuery={searchQuery}
              onAddProduct={addToCart}
            />
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {/* Cart Table */}
            <CartTable 
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onUpdatePrice={updatePrice}
              onRemove={removeFromCart}
              onOpenImeiSelector={handleOpenImeiSelector}
              onEdit={handleEditItem}
              onSelectProduct={onSelectProduct}
            />

            {/* Activity Log */}
            <ActivityLog activities={activities} />
          </div>
        </div>

        {/* Right Side: Sidebar (Customer, Totals, Payment) */}
        <Sidebar 
          selectedCustomer={selectedCustomer}
          customerSearch={customerSearch}
          setCustomerSearch={setCustomerSearch}
          customerResults={customerResults}
          onSelectCustomer={(c) => {
            setSelectedCustomer(c);
            setCustomerSearch('');
            setCustomerResults([]);
            addActivity('Customer Selected', `${c.name} attached to sale`, 'customer');
          }}
          onClearCustomer={() => setSelectedCustomer(null)}
          onOpenNewCustomerModal={() => setShowNewCustomerModal(true)}
          onOpenDepositModal={() => setShowDepositModal(true)}
          
          subtotal={subtotal}
          tax={0}
          discount={discountTotal}
          total={total}
          
          addedPayments={addedPayments}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          onAddPayment={handleAddPayment}
          onRemovePayment={removePayment}
          remainingAmount={remainingAmount}
          
          onCheckout={handleCheckout}
          onClearCart={() => setShowDiscardConfirm(true)}
          isCartEmpty={cart.length === 0 && !selectedCustomer && addedPayments.length === 0}
          isPaymentComplete={isPaymentComplete}
          availableMethods={availableMethods}
        />
      </div>

      {/* Modals */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] rounded-md shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-[var(--border-base)]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-[var(--bg-hover)] rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-[var(--brand-danger)]" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)] mb-2 uppercase tracking-tight">Discard Sale?</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">Are you sure you want to clear the current cart and reset the transaction? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 py-3 rounded-md font-bold text-[var(--text-muted)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] transition-all border border-[var(--border-base)]"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    resetRegister();
                    addActivity('Cart Cleared', 'Transaction discarded and reset to default', 'system');
                    setShowDiscardConfirm(false);
                  }}
                  className="flex-1 py-3 rounded-md font-bold text-white bg-[var(--brand-danger)] hover:bg-[var(--brand-danger-hover)] transition-all shadow-lg shadow-red-100"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <ReviewCheckoutModal 
          grandTotal={total}
          payments={addedPayments}
          isFinalizing={isFinalizing}
          onCancel={() => setShowReviewModal(false)}
          onConfirm={handleFinalizeTransaction}
        />
      )}

      {showDepositModal && (
        <DepositAmountModal 
          customer={selectedCustomer}
          onClose={() => setShowDepositModal(false)}
          onAddDeposit={handleAddDepositToCart}
        />
      )}

      {showImeiSelector && imeiSelectorProduct && (
        <ImeiSelectorModal 
          product={imeiSelectorProduct}
          availableImeis={availableImeis}
          isLoading={isLoadingImeis}
          onClose={() => setShowImeiSelector(false)}
          onSelect={(device) => {
            addToCart({
              ...imeiSelectorProduct,
              device_id: device.id,
              imei: device.imei
            });
            setShowImeiSelector(false);
          }}
        />
      )}

      {showNewCustomerModal && (
        <CustomerFormModal 
          onClose={() => setShowNewCustomerModal(false)}
          onSave={handleSaveNewCustomer}
        />
      )}

      {showUpdateModal && editingItem && (
        <UpdateCartModal 
          item={editingItem}
          onClose={() => {
            setShowUpdateModal(false);
            setEditingItem(null);
          }}
          onSave={handleUpdateCartItem}
        />
      )}

      {/* Hidden Print Container */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
        {lastInvoiceData && (
          <div className={printType === 'Thermal' ? 'w-[80mm]' : 'w-full'}>
            <ThermalReceipt invoice={lastInvoiceData} settings={settings} company={company} />
          </div>
        )}
      </div>
    </div>
  );
}
