import { useState, useEffect } from 'react';
import { INITIAL_ITEMS } from './constants';
import Auth from './components/Auth';
import KanbanBoard from './components/KanbanBoard';
import HistoryLog from './components/HistoryLog';
import CustomerDashboard from './components/CustomerDashboard';
import ClientManagement from './components/ClientManagement';
import { Truck, Shield, Activity, User, LogOut, LayoutDashboard, History, Plus, Edit2, Package, Tag, Phone, AlignLeft, Users } from 'lucide-react';

export default function App() {
  const [userRole, setUserRole] = useState(() => localStorage.getItem('wh_role') || null);
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('wh_user') || null);
  const [activeTab, setActiveTab] = useState('board'); 
  
  const [usersDB, setUsersDB] = useState(() => {
    const saved = localStorage.getItem('wh_usersDB');
    return saved ? JSON.parse(saved) : [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'STF001', password: 'STF001', role: 'staff' }, 
      { username: '0123456789', password: 'Abc@123', role: 'customer', clientName: 'John Doe' } 
    ];
  });
  
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('wh_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });
  
  const [formData, setFormData] = useState({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '' });
  const [editingItem, setEditingItem] = useState(null);
  
  // NEW: State to control the visibility of the client selection slider/dropdown
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const isInternal = userRole === 'admin' || userRole === 'staff';
  const isAdmin = userRole === 'admin';
  const customerList = usersDB.filter(u => u.role === 'customer');

  useEffect(() => { localStorage.setItem('wh_usersDB', JSON.stringify(usersDB)); }, [usersDB]);
  useEffect(() => { localStorage.setItem('wh_items', JSON.stringify(items)); }, [items]);
  useEffect(() => {
    if (userRole) localStorage.setItem('wh_role', userRole); else localStorage.removeItem('wh_role');
    if (currentUser) localStorage.setItem('wh_user', currentUser); else localStorage.removeItem('wh_user');
  }, [userRole, currentUser]);

  const getClientName = (phone) => {
    const user = usersDB.find(u => u.username === phone);
    return user && user.clientName ? user.clientName : 'Unknown Client';
  };

  const handleLogout = () => { setUserRole(null); setCurrentUser(null); };

  const updateItemData = (itemId, updates) => {
    setItems(items.map(item => item.id === itemId ? { ...item, ...updates } : item));
  };

  if (!userRole) {
    return <Auth usersDB={usersDB} setUsersDB={setUsersDB} setUserRole={setUserRole} setCurrentUser={setCurrentUser} />;
  }

  const handleReceiveItem = (e) => {
    e.preventDefault();
    if (!formData.itemName.trim() || !formData.clientPhone.trim() || !isInternal) return alert("Item Name and Client Phone required!");

    let updatedUsers = [...usersDB];
    const existingCustomer = usersDB.find(u => u.username === formData.clientPhone);
    
    if (!existingCustomer) {
      updatedUsers.push({ username: formData.clientPhone, password: 'Abc@123', role: 'customer', clientName: formData.clientName || 'Unknown' });
      setUsersDB(updatedUsers);
      alert(`System Note: New client account auto-created for phone ${formData.clientPhone}`);
    } else if (formData.clientName && existingCustomer.clientName !== formData.clientName) {
      setUsersDB(usersDB.map(u => u.username === formData.clientPhone ? { ...u, clientName: formData.clientName } : u));
    }

    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...i, name: formData.itemName, brand: formData.itemBrand, description: formData.description, owner: formData.clientPhone } : i));
      setEditingItem(null);
    } else {
      setItems([...items, { 
        id: `REP-${Math.floor(1000 + Math.random() * 9000)}`, 
        name: formData.itemName, brand: formData.itemBrand, description: formData.description, owner: formData.clientPhone, 
        stage: 'Receiving', problem: '', price: '', clientDecision: 'Pending', repairStatus: 'In Progress', outboundStatus: 'In Inventory',
        history: [{ stage: 'Receiving', timestamp: new Date().toLocaleString(), iso: new Date().toISOString() }] 
      }]);
    }
    setFormData({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '' });
  };

  const deleteItem = (id) => {
    if (!isAdmin) return alert("Only Administrators can permanently delete items.");
    if(window.confirm("Delete this item completely?")) setItems(items.filter(item => item.id !== id));
  };

  const startEdit = (item) => {
    if (!isInternal) return;
    setEditingItem(item);
    setFormData({ itemName: item.name || '', itemBrand: item.brand || '', clientPhone: item.owner || '', clientName: getClientName(item.owner) || '', description: item.description || '' });
  };

  // Filter clients dynamically as the admin types
  const filteredClients = customerList.filter(c => {
    const matchPhone = c.username.includes(formData.clientPhone);
    const matchName = (c.clientName || '').toLowerCase().includes(formData.clientName.toLowerCase());
    return matchPhone && matchName;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-left font-sans text-slate-800">
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-200"><Truck size={24} /></div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 m-0 tracking-tight">TraceNexus Dashboard</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide flex items-center gap-1.5 uppercase ${isAdmin ? 'bg-blue-100 text-blue-700' : userRole === 'staff' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                    {isAdmin ? <><Shield size={12}/> Admin</> : userRole === 'staff' ? <><Activity size={12}/> Staff</> : <><User size={12}/> Client</>}
                  </span>
                  <span className="text-slate-500 text-sm font-medium">Session: <b className="text-slate-800">{currentUser}</b></span>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border border-slate-200">
              <LogOut size={16} /> Logout
            </button>
          </div>

          {isInternal && (
            <div className="flex flex-col gap-6 border-t border-slate-100 pt-6 mt-6">
              {activeTab === 'board' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    {editingItem ? <Edit2 size={18} className="text-blue-500"/> : <Plus size={18} className="text-blue-600"/>} {editingItem ? 'Edit Job' : 'Create New Repair Job'}
                  </h3>
                  <form onSubmit={handleReceiveItem} className="flex flex-col gap-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Row 1: Device Details */}
                      <div className="relative"><Package size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Device/Item Name" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-white text-sm" required/></div>
                      <div className="relative"><Tag size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Brand" value={formData.itemBrand} onChange={(e) => setFormData({...formData, itemBrand: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-white text-sm" /></div>
                      
                      {/* Row 2: Smart Client Selection Area */}
                      <div className="md:col-span-2 relative" onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <User size={16} className="absolute left-4 top-3.5 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Client Name" 
                              value={formData.clientName} 
                              onChange={(e) => { setFormData({...formData, clientName: e.target.value}); setShowClientDropdown(true); }} 
                              onFocus={() => setShowClientDropdown(true)}
                              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-white text-sm" 
                              autoComplete="off"
                            />
                          </div>
                          <div className="relative">
                            <Phone size={16} className="absolute left-4 top-3.5 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Client Phone (Used for Login)" 
                              value={formData.clientPhone} 
                              onChange={(e) => { setFormData({...formData, clientPhone: e.target.value}); setShowClientDropdown(true); }} 
                              onFocus={() => setShowClientDropdown(true)}
                              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-white text-sm" 
                              required
                              autoComplete="off"
                            />
                          </div>
                        </div>

                        {/* Interactive Client Slider / Dropdown */}
                        {showClientDropdown && (
                          <div className="absolute z-50 top-full left-0 w-full mt-2 bg-white border border-slate-200 shadow-xl rounded-xl max-h-72 overflow-y-auto overflow-x-hidden">
                            {filteredClients.length > 0 && (
                              <div className="p-2 flex flex-col gap-1">
                                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Existing Clients</div>
                                {filteredClients.map(client => (
                                  <button
                                    key={client.username}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, clientName: client.clientName || '', clientPhone: client.username }));
                                      setShowClientDropdown(false);
                                    }}
                                    className="flex justify-between items-center w-full px-3 py-2.5 hover:bg-blue-50 rounded-lg transition-colors text-left"
                                  >
                                    <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                      <User size={14} className="text-blue-500"/> {client.clientName || 'Unknown'}
                                    </span>
                                    <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                                      <Phone size={12}/> {client.username}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-start gap-3 rounded-b-xl">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-none mt-0.5">
                                  <Plus size={16} />
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-700">Auto-Register New Client</p>
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Can't find them? Just type their name and phone above. Submitting this repair job will automatically register them as a new client instantly.
                                  </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Row 3: Description */}
                      <div className="relative md:col-span-2"><AlignLeft size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Initial Description from Client" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-white text-sm" /></div>
                    </div>

                    <div className="flex gap-3 mt-2 justify-end">
                      {editingItem && <button type="button" onClick={() => { setEditingItem(null); setFormData({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '' }) }} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-6 py-2.5 rounded-xl font-semibold text-sm">Cancel Edit</button>}
                      <button type="submit" className={`bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-md shadow-blue-200/50 text-sm`}>
                        {editingItem ? 'Save Updates' : 'Add to Pipeline'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className="flex gap-2 w-full bg-slate-100/50 p-1 rounded-lg self-start overflow-x-auto">
                <button onClick={() => setActiveTab('board')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'board' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}><LayoutDashboard size={16} /> Pipeline View</button>
                <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}><History size={16} /> Audit Explorer</button>
                {isAdmin && (
                  <button onClick={() => setActiveTab('clients')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'clients' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}><Users size={16} /> Client Directory</button>
                )}
              </div>
            </div>
          )}
        </div>

        {!isInternal ? (
          <CustomerDashboard items={items} currentUser={currentUser} updateItemData={updateItemData} />
        ) : activeTab === 'history' ? (
          <HistoryLog items={items} setItems={setItems} isAdmin={isAdmin} isInternal={isInternal} getClientName={getClientName} />
        ) : activeTab === 'clients' && isAdmin ? (
          <ClientManagement usersDB={usersDB} setUsersDB={setUsersDB} items={items} setItems={setItems} isAdmin={isAdmin} />
        ) : (
          <KanbanBoard items={items} setItems={setItems} isAdmin={isAdmin} isInternal={isInternal} startEdit={startEdit} deleteItem={deleteItem} getClientName={getClientName} updateItemData={updateItemData} />
        )}
      </div>
    </div>
  );
}