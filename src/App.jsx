import { useState, useEffect } from 'react';
import { 
  Package, ArrowRight, ArrowLeft, Plus, Clock, CheckCircle2, 
  Edit2, Trash2, LogOut, User, Shield, Lock, History, LayoutDashboard,
  Save, X, Search, Phone, KeyRound, BadgeCheck, Eye, EyeOff, Activity, Truck,
  Tag, AlignLeft
} from 'lucide-react';

const STAGES = ['Receiving', 'Inspection', 'Storage', 'Picking', 'Packing', 'Shipping'];

const STAGE_CONFIG = {
  'Receiving': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
  'Inspection': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  'Storage': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  'Picking': { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-700' },
  'Packing': { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  'Shipping': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' }
};

const INITIAL_ITEMS = [
  {
    id: 'TRK-8492',
    name: 'Wireless Keyboards (Pallet)',
    brand: 'Logitech',
    description: 'Bulk pallet of MX Master keyboards',
    owner: '0123456789',
    stage: 'Storage',
    history: [
      { stage: 'Receiving', timestamp: new Date(Date.now() - 86400000).toLocaleString(), iso: new Date(Date.now() - 86400000).toISOString() },
      { stage: 'Inspection', timestamp: new Date(Date.now() - 43200000).toLocaleString(), iso: new Date(Date.now() - 43200000).toISOString() },
      { stage: 'Storage', timestamp: new Date().toLocaleString(), iso: new Date().toISOString() }
    ]
  }
];

export default function App() {
  const [userRole, setUserRole] = useState(() => localStorage.getItem('wh_role') || null);
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('wh_user') || null);
  const [authMode, setAuthMode] = useState('login'); 
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [pendingPasswordChange, setPendingPasswordChange] = useState(null);
  
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirmPass: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [activeTab, setActiveTab] = useState('board'); 
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState(null);
  const [editingHistory, setEditingHistory] = useState(null); 
  const [customerSearchQuery, setCustomerSearchQuery] = useState(''); 

  const [usersDB, setUsersDB] = useState(() => {
    const savedUsers = localStorage.getItem('wh_usersDB');
    if (savedUsers) return JSON.parse(savedUsers);
    return [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'STF001', password: 'STF001', role: 'staff' }, 
      { username: '0123456789', password: 'Abc@123', role: 'customer', clientName: 'John Doe' } 
    ];
  });
  
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem('wh_items');
    return savedItems ? JSON.parse(savedItems) : INITIAL_ITEMS;
  });
  
  // --- Unified Form State for Receiving ---
  const [formData, setFormData] = useState({
    itemName: '',
    itemBrand: '',
    clientName: '',
    clientPhone: '',
    description: ''
  });
  const [editingItem, setEditingItem] = useState(null);

  const isInternal = userRole === 'admin' || userRole === 'staff';
  const isAdmin = userRole === 'admin';

  useEffect(() => { localStorage.setItem('wh_usersDB', JSON.stringify(usersDB)); }, [usersDB]);

  useEffect(() => {
    localStorage.setItem('wh_items', JSON.stringify(items));
    if (items.length > 0 && !selectedHistoryItemId) {
      setSelectedHistoryItemId(items[0].id);
    } else if (items.length === 0) {
      setSelectedHistoryItemId(null);
    }
  }, [items]);

  useEffect(() => {
    if (userRole) localStorage.setItem('wh_role', userRole);
    else localStorage.removeItem('wh_role');
    
    if (currentUser) localStorage.setItem('wh_user', currentUser);
    else localStorage.removeItem('wh_user');
  }, [userRole, currentUser]);

  // --- Helpers ---
  const getClientName = (phone) => {
    const user = usersDB.find(u => u.username === phone);
    return user && user.clientName ? user.clientName : 'Unknown Client';
  };

  // --- Authentication Handlers ---
  const handleAuth = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authMode === 'login') {
      if (!credentials.username || !credentials.password) {
        setAuthError('Please fill in all fields');
        return;
      }

      let user = usersDB.find(u => u.username === credentials.username && u.password === credentials.password);
      
      if (!user && credentials.username === credentials.password && credentials.username.toLowerCase() !== 'admin') {
         user = { username: credentials.username, password: credentials.password, role: 'staff' };
         setUsersDB([...usersDB, user]); 
      }

      if (user) {
        if (user.role === 'customer' && user.password === 'Abc@123') {
          setPendingPasswordChange(user);
        } else {
          finalizeLogin(user);
        }
      } else {
        setAuthError('Invalid credentials');
      }
    } else {
      if (!credentials.username) {
        setAuthError('Phone number is required');
        return;
      }
      if (usersDB.some(u => u.username === credentials.username)) {
        setAuthError('Phone number is already registered');
        return;
      }
      const newUser = { username: credentials.username, password: 'Abc@123', role: 'customer' };
      setUsersDB([...usersDB, newUser]);
      
      setAuthSuccess('Registration successful! Please login with temporary password: Abc@123');
      setAuthMode('login');
      setCredentials({ username: credentials.username, password: '' });
      setShowLoginPassword(false);
    }
  };

  const finalizeLogin = (user) => {
    setUserRole(user.role);
    setCurrentUser(user.username);
    setCredentials({ username: '', password: '' }); 
    setActiveTab('board'); 
    setCustomerSearchQuery('');
    setShowLoginPassword(false);
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setAuthError('');
    if (passwordForm.newPass !== passwordForm.confirmPass) {
      setAuthError('Passwords do not match');
      return;
    }
    if (passwordForm.newPass === 'Abc@123') {
      setAuthError('Please choose a different password than the temporary one');
      return;
    }

    const updatedUsers = usersDB.map(u => 
      u.username === pendingPasswordChange.username 
        ? { ...u, password: passwordForm.newPass } 
        : u
    );
    setUsersDB(updatedUsers);

    finalizeLogin({ ...pendingPasswordChange, password: passwordForm.newPass });
    setPendingPasswordChange(null);
    setPasswordForm({ newPass: '', confirmPass: '' });
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setAuthMode('login');
    setPendingPasswordChange(null);
    setShowLoginPassword(false);
  };

  if (pendingPasswordChange) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-left font-sans text-slate-800">
        <div className="bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <KeyRound size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Secure Your Account</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Welcome! Since this is your first login, please update your temporary password.
            </p>
          </div>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-50/50 text-red-600 border border-red-100 rounded-xl text-sm text-center font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
              <div className="relative group">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({...passwordForm, newPass: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all pr-12 text-slate-700"
                  placeholder="Enter secure password"
                  required
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600">
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={passwordForm.confirmPass}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPass: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all pr-12 text-slate-700"
                  placeholder="Confirm password"
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-md shadow-indigo-200 mt-6 flex items-center justify-center gap-2">
              <Save size={18} /> Save & Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-left font-sans text-slate-800">
        <div className="bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 transform -rotate-3">
              <Truck size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">TraceNexus</h1>
            <p className="text-slate-500 text-sm font-medium">
              {authMode === 'login' ? 'Enterprise Logistics Portal' : 'Customer Phone Registration'}
            </p>
          </div>
          
          {authError && <div className="mb-6 p-4 bg-red-50/50 text-red-600 border border-red-100 rounded-xl text-sm text-center font-medium">{authError}</div>}
          {authSuccess && <div className="mb-6 p-4 bg-emerald-50/50 text-emerald-700 border border-emerald-100 rounded-xl text-sm text-center flex flex-col items-center gap-2 font-medium"><BadgeCheck size={24} className="text-emerald-500" />{authSuccess}</div>}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {authMode === 'login' ? 'Identifier / Phone / Staff ID' : 'Mobile Phone Number'}
              </label>
              <div className="relative">
                {authMode === 'register' ? <Phone size={18} className="absolute left-4 top-3.5 text-slate-400" /> : <User size={18} className="absolute left-4 top-3.5 text-slate-400" />}
                <input 
                  type="text" 
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all text-slate-700"
                  placeholder={authMode === 'login' ? "Enter your ID" : "e.g., 0123456789"}
                />
              </div>
            </div>

            {authMode === 'login' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <input 
                    type={showLoginPassword ? "text" : "password"} 
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all text-slate-700"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors">
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-md shadow-indigo-200 mt-2">
              {authMode === 'login' ? 'Access Dashboard' : 'Register Number'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
            {authMode === 'login' ? "Expecting a shipment? " : "Already registered? "}
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); setAuthSuccess(''); setShowLoginPassword(false); }}
              className="text-indigo-600 hover:text-indigo-700 font-semibold ml-1 hover:underline"
            >
              {authMode === 'login' ? 'Register here' : 'Back to login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Board Actions (Admin & Staff) ---
  const handleReceiveItem = (e) => {
    e.preventDefault();
    if (!formData.itemName.trim() || !formData.clientPhone.trim() || !isInternal) {
        setAuthError("Item Name and Client Phone are required!");
        return;
    }

    // Process Client Account
    let updatedUsers = [...usersDB];
    const existingCustomer = usersDB.find(u => u.username === formData.clientPhone);
    
    if (!existingCustomer) {
      // Create new customer account using phone number
      const newUser = { 
        username: formData.clientPhone, 
        password: 'Abc@123', 
        role: 'customer',
        clientName: formData.clientName || 'Unknown Client'
      };
      updatedUsers.push(newUser);
      setUsersDB(updatedUsers);
      alert(`System Note: New client account auto-created for phone ${formData.clientPhone}`);
    } else if (formData.clientName && existingCustomer.clientName !== formData.clientName) {
      // Optional: Update existing customer name if a new one is provided
      updatedUsers = usersDB.map(u => u.username === formData.clientPhone ? { ...u, clientName: formData.clientName } : u);
      setUsersDB(updatedUsers);
    }

    // Process Inventory Item
    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { 
        ...i, 
        name: formData.itemName, 
        brand: formData.itemBrand,
        description: formData.description,
        owner: formData.clientPhone 
      } : i));
      setEditingItem(null);
    } else {
      const newItem = {
        id: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formData.itemName,
        brand: formData.itemBrand,
        description: formData.description,
        owner: formData.clientPhone,
        stage: 'Receiving',
        history: [{ stage: 'Receiving', timestamp: new Date().toLocaleString(), iso: new Date().toISOString() }]
      };
      setItems([...items, newItem]);
    }
    
    // Reset form
    setFormData({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '' });
  };

  const deleteItem = (id) => {
    if (!isAdmin) {
      alert("Only Administrators can permanently delete items.");
      return;
    }
    if(window.confirm("Are you sure you want to delete this item completely?")) {
      setItems(items.filter(item => item.id !== id));
      if (selectedHistoryItemId === id) setSelectedHistoryItemId(null);
    }
  };

  const startEdit = (item) => {
    if (!isInternal) return;
    setEditingItem(item);
    setFormData({
      itemName: item.name || '',
      itemBrand: item.brand || '',
      clientPhone: item.owner || '',
      clientName: getClientName(item.owner) || '',
      description: item.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setFormData({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '' });
  };

  const updateItemStage = (itemId, targetStage) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          stage: targetStage,
          history: [...item.history, { stage: targetStage, timestamp: new Date().toLocaleString(), iso: new Date().toISOString() }]
        };
      }
      return item;
    }));
  };

  const moveItemForward = (itemId, currentStage) => {
    if (!isInternal) return;
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex >= STAGES.length - 1) return;
    updateItemStage(itemId, STAGES[currentIndex + 1]);
  };

  const moveItemBackward = (itemId, currentStage) => {
    if (!isInternal) return;
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex <= 0) return;
    updateItemStage(itemId, STAGES[currentIndex - 1]);
  };

  const deleteHistoryRecord = (itemId, historyIndex) => {
    if (!isAdmin) {
      alert("Only Administrators can delete history logs.");
      return;
    }
    if (window.confirm("Delete this specific history record?")) {
      setItems(items.map(item => {
        if (item.id === itemId) {
          const updatedHistory = item.history.filter((_, idx) => idx !== historyIndex);
          return { ...item, history: updatedHistory };
        }
        return item;
      }));
    }
  };

  const startHistoryEdit = (itemId, index, log) => {
    if (!isInternal) return;
    setEditingHistory({ itemId, index, stage: log.stage, timestamp: log.timestamp });
  };

  const saveHistoryEdit = () => {
    if (!editingHistory || !isInternal) return;
    setItems(items.map(item => {
      if (item.id === editingHistory.itemId) {
        const updatedHistory = [...item.history];
        updatedHistory[editingHistory.index] = {
          ...updatedHistory[editingHistory.index],
          stage: editingHistory.stage,
          timestamp: editingHistory.timestamp
        };
        return { ...item, history: updatedHistory };
      }
      return item;
    }));
    setEditingHistory(null);
  };

  const selectedItemForHistory = items.find(i => i.id === selectedHistoryItemId);
  const customerOwnedItems = items.filter(item => item.owner === currentUser);
  const filteredCustomerItems = customerOwnedItems.filter(item => 
    item.id.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
    item.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-left font-sans text-slate-800">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Modern Header */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                <Truck size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 m-0 tracking-tight">TraceNexus Dashboard</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide flex items-center gap-1.5 uppercase ${isAdmin ? 'bg-indigo-100 text-indigo-700' : userRole === 'staff' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                    {isAdmin ? <><Shield size={12}/> Admin</> : userRole === 'staff' ? <><Activity size={12}/> Staff</> : <><User size={12}/> Client</>}
                  </span>
                  <span className="text-slate-500 text-sm font-medium">Session: <b className="text-slate-800">{currentUser}</b></span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border border-slate-200 hover:border-red-200"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>

          {isInternal && (
            <div className="flex flex-col gap-6 border-t border-slate-100 pt-6 mt-6">
              {activeTab === 'board' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    {editingItem ? <Edit2 size={18} className="text-amber-500"/> : <Plus size={18} className="text-indigo-500"/>} 
                    {editingItem ? 'Edit Consignment' : 'Receive New Consignment'}
                  </h3>
                  
                  <form onSubmit={handleReceiveItem} className="flex flex-col gap-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Row 1 */}
                      <div className="relative">
                        <Package size={16} className="absolute left-4 top-3.5 text-slate-400" />
                        <input type="text" placeholder="Item Name (e.g. Wireless Router)" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm" required/>
                      </div>
                      
                      <div className="relative">
                        <Tag size={16} className="absolute left-4 top-3.5 text-slate-400" />
                        <input type="text" placeholder="Item Brand (Optional)" value={formData.itemBrand} onChange={(e) => setFormData({...formData, itemBrand: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm" />
                      </div>

                      {/* Row 2 */}
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-3.5 text-slate-400" />
                        <input type="text" placeholder="Client Name (e.g. John Doe)" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm" />
                      </div>

                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-3.5 text-slate-400" />
                        <input type="text" placeholder="Client Phone (Used for Login)" value={formData.clientPhone} onChange={(e) => setFormData({...formData, clientPhone: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm" required/>
                      </div>

                      {/* Row 3 - Full Width Description */}
                      <div className="relative md:col-span-2">
                        <AlignLeft size={16} className="absolute left-4 top-3.5 text-slate-400" />
                        <input type="text" placeholder="Description (e.g., iPhone 15 Pro Max 256GB Titanium)" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm" />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2 justify-end">
                      {editingItem && (
                        <button type="button" onClick={cancelEdit} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-6 py-2.5 rounded-xl font-semibold whitespace-nowrap text-sm transition-colors">
                          Cancel Edit
                        </button>
                      )}
                      <button type="submit" className={`${editingItem ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-slate-800'} text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-md text-sm`}>
                        {editingItem ? <Edit2 size={16} /> : <Plus size={18} />}
                        {editingItem ? 'Save Updates' : 'Add to Inventory'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="flex gap-2 w-full bg-slate-100/50 p-1 rounded-lg self-start">
                <button
                  onClick={() => setActiveTab('board')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'board' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <LayoutDashboard size={16} /> Pipeline View
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <History size={16} /> Audit Explorer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1. CUSTOMER VIEW */}
        {!isInternal ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 p-8">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
                <Search className="text-indigo-500" size={24} /> Locate Consignments
              </h2>
              <div className="relative w-full md:w-96">
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tracking ID or Waybill Name..." 
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomerItems.map(item => {
                const config = STAGE_CONFIG[item.stage];
                const latestUpdate = item.history[item.history.length - 1];

                return (
                  <div key={item.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:shadow-slate-200/50 transition-all bg-white flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 tracking-wide">
                            {item.id}
                          </span>
                          <h3 className="font-bold text-slate-800 mt-3 m-0 leading-snug text-lg">{item.name}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                          <Package className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={20} />
                        </div>
                      </div>

                      <div className="mb-4">
                        {item.brand && <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded">{item.brand}</span>}
                        {item.description && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.description}</p>}
                      </div>
                      
                      <div className="mt-4 pt-5 border-t border-slate-100">
                        <p className="text-[11px] text-slate-400 mb-2 uppercase font-bold tracking-widest">Active Status</p>
                        <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold ${config.bg} ${config.text} border ${config.border}`}>
                          {item.stage === 'Shipping' ? <CheckCircle2 size={16}/> : <Clock size={16}/>}
                          {item.stage}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400 mb-3 uppercase font-bold tracking-widest block">Transit Log</span>
                      <div className="flex flex-col gap-3">
                        {item.history.slice(-2).map((h, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-none mt-0.5">
                              <History size={12} className="text-slate-500"/>
                            </div>
                            <div className="text-sm">
                              <b className="text-slate-700 block text-xs mb-0.5">{h.stage}</b>
                              <span className="text-slate-500 text-[11px] font-medium">{h.timestamp.split(',')[1] || h.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {customerOwnedItems.length === 0 ? (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                    <Package className="text-slate-300" size={28} />
                  </div>
                  <p className="text-slate-500 font-semibold text-lg">No active shipments.</p>
                  <p className="text-slate-400 text-sm mt-1">Your assigned items will appear here.</p>
                </div>
              ) : filteredCustomerItems.length === 0 ? (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Search className="mx-auto text-slate-300 mb-4" size={36} />
                  <p className="text-slate-500 font-semibold text-lg">No matches found.</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : 

        /* 2. ADMIN/STAFF HISTORY VIEW */
        activeTab === 'history' ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                  <Package className="text-slate-600" size={16}/>
                </div>
                <h3 className="font-extrabold text-slate-800 m-0 text-base">Select Record to Inspect</h3>
              </div>
              
              <div className="flex overflow-x-auto gap-4 pb-3 custom-scrollbar">
                {items.length === 0 ? (
                  <p className="text-sm text-slate-500 italic font-medium">Database is empty.</p>
                ) : (
                  items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedHistoryItemId(item.id)}
                      className={`flex-none flex flex-col items-start px-5 py-4 rounded-xl border-2 transition-all min-w-[240px] text-left ${
                        selectedHistoryItemId === item.id 
                          ? 'bg-indigo-50 border-indigo-500 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      <span className={`text-xs font-mono font-bold mb-1.5 tracking-wide ${selectedHistoryItemId === item.id ? 'text-indigo-700' : 'text-slate-500'}`}>
                        {item.id}
                      </span>
                      <span className="text-sm font-bold text-slate-800 truncate w-full mb-1">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Phone size={10}/> {getClientName(item.owner)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="p-5 font-bold text-slate-400 text-xs uppercase tracking-wider">Timestamp</th>
                    <th className="p-5 font-bold text-slate-400 text-xs uppercase tracking-wider">Event Log</th>
                    <th className="p-5 font-bold text-slate-400 text-xs uppercase tracking-wider w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItemForHistory ? (
                    selectedItemForHistory.history.length > 0 ? (
                      selectedItemForHistory.history.map((log, idx) => {
                        const isEditing = editingHistory?.itemId === selectedItemForHistory.id && editingHistory?.index === idx;

                        return (
                          <tr key={idx} className={`border-b border-slate-100 transition-colors ${isEditing ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}>
                            <td className="p-5 text-sm font-medium text-slate-600 whitespace-nowrap">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={editingHistory.timestamp} 
                                  onChange={(e) => setEditingHistory({...editingHistory, timestamp: e.target.value})}
                                  className="border border-amber-300 px-3 py-2 rounded-lg w-full bg-white text-sm focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                                />
                              ) : (
                                log.timestamp
                              )}
                            </td>
                            <td className="p-5 text-sm">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={editingHistory.stage} 
                                  onChange={(e) => setEditingHistory({...editingHistory, stage: e.target.value})}
                                  className="border border-amber-300 px-3 py-2 rounded-lg w-full bg-white text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                                />
                              ) : (
                                <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-md text-xs font-bold">
                                  {log.stage}
                                </span>
                              )}
                            </td>
                            <td className="p-5 text-sm text-right">
                              {isEditing ? (
                                <div className="flex justify-end gap-2">
                                  <button onClick={saveHistoryEdit} className="text-emerald-700 bg-emerald-100 hover:bg-emerald-200 p-2 rounded-lg transition-colors" title="Save">
                                    <Save size={16} />
                                  </button>
                                  <button onClick={() => setEditingHistory(null)} className="text-slate-600 bg-slate-200 hover:bg-slate-300 p-2 rounded-lg transition-colors" title="Cancel">
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => startHistoryEdit(selectedItemForHistory.id, idx, log)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all" title="Edit Record">
                                    <Edit2 size={16} />
                                  </button>
                                  {isAdmin && (
                                    <button onClick={() => deleteHistoryRecord(selectedItemForHistory.id, idx)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all" title="Delete Record">
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="p-12 text-center text-slate-400 font-medium">Log is empty.</td>
                      </tr>
                    )
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <History className="text-slate-300" size={24} />
                        </div>
                        <p className="text-slate-500 font-semibold">Select a waybill from the slider above</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (

        /* 3. ADMIN/STAFF KANBAN BOARD VIEW */
        <div className="flex overflow-x-auto gap-6 pb-6 pt-2 custom-scrollbar">
          {STAGES.map((stage, stageIndex) => {
            const stageItems = items.filter(item => item.stage === stage);
            const config = STAGE_CONFIG[stage];

            return (
              <div key={stage} className="flex-none w-[360px] bg-slate-100/50 rounded-2xl p-4 border border-slate-200 flex flex-col h-[72vh]">
                <div className="flex justify-between items-center mb-5 px-2">
                  <h2 className="font-extrabold text-slate-800 m-0 text-base">{stage}</h2>
                  <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                    {stageItems.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 custom-scrollbar">
                  {stageItems.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:border-indigo-300 transition-colors group">
                      
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border tracking-wide ${config.badge} border-transparent`}>
                            {item.id}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-md transition-all" title="Edit Meta">
                              <Edit2 size={14} />
                            </button>
                            {isAdmin && (
                              <button onClick={() => deleteItem(item.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-all" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="font-bold text-slate-800 text-base m-0 leading-tight">{item.name}</h3>
                        
                        <div className="mt-2 mb-3">
                          {item.brand && <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded mr-2">{item.brand}</span>}
                          {item.description && <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{item.description}</p>}
                        </div>

                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 bg-slate-50 inline-flex px-2 py-1 rounded border border-slate-100">
                          <User size={12}/> {getClientName(item.owner)} ({item.owner || 'Unassigned'})
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-widest text-slate-400 mb-3">
                          <Clock size={12} /> Last Scanned
                        </div>
                        {item.history.slice(-1).map((h, i) => (
                          <div key={i} className="text-sm font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {h.timestamp.split(',')[1] || h.timestamp}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => moveItemBackward(item.id, stage)}
                          disabled={stageIndex === 0}
                          className={`flex-[0.5] py-2.5 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${stageIndex === 0 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          title="Reverse Stage"
                        >
                          <ArrowLeft size={16} />
                        </button>

                        <button
                          onClick={() => moveItemForward(item.id, stage)}
                          disabled={stageIndex === STAGES.length - 1}
                          className={`flex-[2] py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all border border-transparent ${stageIndex === STAGES.length - 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-200'}`}
                        >
                          {stageIndex === STAGES.length - 1 ? (
                            <><CheckCircle2 size={16} /> Finalized</>
                          ) : (
                            <>Advance Stage <ArrowRight size={16} /></>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {stageItems.length === 0 && (
                    <div className="text-center text-slate-400 text-sm font-medium p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                      Empty Queue
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}