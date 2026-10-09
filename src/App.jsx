import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import companyLogo from './assets/logo.png';
import Auth from './components/Auth';
import KanbanBoard from './components/KanbanBoard';
import HistoryLog from './components/HistoryLog';
import CustomerDashboard from './components/CustomerDashboard';
import ClientManagement from './components/ClientManagement';
import RequestsManagement from './components/RequestsManagement';
import EngineerManagement from './components/EngineerManagement';
import { Shield, Activity, User, LogOut, LayoutDashboard, History, Plus, Edit2, Package, Tag, Phone, AlignLeft, Users, ImagePlus, X, Inbox, RefreshCw, MapPin, Wrench } from 'lucide-react';

export default function App() {
  const [userRole, setUserRole] = useState(() => {
    const role = localStorage.getItem('wh_role');
    return (role && role !== 'null') ? role : null;
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem('wh_user');
    return (user && user !== 'null') ? user : null;
  });
  
  const [activeTab, setActiveTab] = useState('board'); 
  const [usersDB, setUsersDB] = useState([]);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '', photo: null, assigned_engineer: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const dropdownRef = useRef(null); 

  const isInternal = userRole === 'admin' || userRole === 'staff';
  const isAdmin = userRole === 'admin';
  const customerList = usersDB.filter(u => u.role === 'customer');
  const engineersList = usersDB.filter(u => u.role === 'staff');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) setUsersDB(usersData);

      const { data: reqData } = await supabase.from('repair_requests').select('*');
      if (reqData) setRequests(reqData);

      const { data: itemsData } = await supabase.from('items').select('*, history_logs(*)');
      if (itemsData) {
        const sortedItems = itemsData.map(item => ({
          ...item,
          history: Array.isArray(item.history_logs) ? item.history_logs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : []
        }));
        setItems(sortedItems);
      }
    } catch (error) {
      console.error("Safely caught DB error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (userRole && userRole !== 'null') localStorage.setItem('wh_role', userRole); 
    if (currentUser && currentUser !== 'null') localStorage.setItem('wh_user', currentUser); 
  }, [userRole, currentUser]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowClientDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getClientName = (phone) => {
    const user = usersDB.find(u => u.username === phone);
    return user && user.client_name ? user.client_name : 'Unknown Client';
  };

  const handleLogout = () => { 
    localStorage.removeItem('wh_role');
    localStorage.removeItem('wh_user');
    setUserRole(null); setCurrentUser(null); window.location.reload(); 
  };

  const updateItemData = async (itemId, updates) => {
    await supabase.from('items').update(updates).eq('id', itemId);
    setItems(items.map(item => item.id === itemId ? { ...item, ...updates } : item));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file); 
    reader.onload = (event) => {
      setFormData({ ...formData, photo: event.target.result });
    };
  };

  if (isLoading && items.length === 0) return <div className="min-h-screen bg-slate-300 flex items-center justify-center font-bold text-slate-700">Connecting to Database...</div>;

  if (!userRole || userRole === 'null') {
    return <Auth usersDB={usersDB} setUsersDB={setUsersDB} setUserRole={setUserRole} setCurrentUser={setCurrentUser} addRequest={(req) => setRequests([...requests, req])} supabase={supabase} />;
  }

  const handleReceiveItem = async (e) => {
    e.preventDefault();
    if (!formData.itemName.trim() || !formData.clientPhone.trim() || !isInternal) return alert("Required fields missing!");

    let existingCustomer = usersDB.find(u => u.username === formData.clientPhone);
    if (!existingCustomer) {
      const newUser = { username: formData.clientPhone, password: 'Abc@123', role: 'customer', client_name: formData.clientName || 'Unknown' };
      await supabase.from('users').insert([newUser]);
      setUsersDB([...usersDB, newUser]);
    } else if (formData.clientName && existingCustomer.client_name !== formData.clientName) {
      await supabase.from('users').update({ client_name: formData.clientName }).eq('username', formData.clientPhone);
      setUsersDB(usersDB.map(u => u.username === formData.clientPhone ? { ...u, client_name: formData.clientName } : u));
    }

    if (editingItem) {
      const updates = { name: formData.itemName, brand: formData.itemBrand, description: formData.description, owner: formData.clientPhone, photo: formData.photo || editingItem.photo, assigned_engineer: formData.assigned_engineer };
      await supabase.from('items').update(updates).eq('id', editingItem.id);
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...updates } : i));
      setEditingItem(null);
    } else {
      const newItemId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
      const newItem = { 
        id: newItemId, name: formData.itemName, brand: formData.itemBrand, description: formData.description, owner: formData.clientPhone, photo: formData.photo, assigned_engineer: formData.assigned_engineer,
        stage: 'Receiving', problem: '', price: '', client_decision: 'Pending', repair_status: 'In Progress', outbound_status: 'In Inventory'
      };
      await supabase.from('items').insert([newItem]);
      const { data: newLog } = await supabase.from('history_logs').insert([{ item_id: newItemId, stage: 'Receiving' }]).select().single();
      setItems([...items, { ...newItem, history: newLog ? [newLog] : [] }]);
    }
    setFormData({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '', photo: null, assigned_engineer: '' });
    setShowClientDropdown(false);
  };

  const deleteItem = async (id) => {
    if (!isAdmin) return alert("Only Admins can delete.");
    if(window.confirm("Delete item from database?")) {
      await supabase.from('items').delete().eq('id', id);
      setItems(items.filter(item => item.id !== id));
    }
  };

  const startEdit = (item) => {
    if (!isInternal) return;
    setEditingItem(item);
    setFormData({ itemName: item.name || '', itemBrand: item.brand || '', clientPhone: item.owner || '', clientName: getClientName(item.owner) || '', description: item.description || '', photo: null, assigned_engineer: item.assigned_engineer || '' });
  };

  const filteredClients = customerList.filter(c => c.username.includes(formData.clientPhone) && (c.client_name || '').toLowerCase().includes(formData.clientName.toLowerCase()));

  // FULL WIDTH LAYOUT: Removed max-w, adjusted padding
  return (
    <div className="min-h-screen bg-slate-300 p-2 md:p-4 text-left font-sans text-slate-800">
      <div className="w-full">
        <div className="bg-slate-100 rounded-2xl shadow-md border border-slate-300 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
            <div className="flex items-center gap-4">
              
              {/* COMPANY LOGO PLACEHOLDER */}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm overflow-hidden flex-none bg-white">
                <img src={companyLogo} alt="Company Logo" className="w-full h-full object-contain p-1" />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 m-0 tracking-tight">KRC Electronic Track & Trace Dashboard</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide flex items-center gap-1.5 uppercase ${isAdmin ? 'bg-slate-300 text-slate-800' : userRole === 'staff' ? 'bg-slate-200 text-slate-700' : 'bg-slate-200 text-slate-600'}`}>
                    {isAdmin ? <><Shield size={12}/> Admin</> : userRole === 'staff' ? <><Activity size={12}/> Engineer</> : <><User size={12}/> Client</>}
                  </span>
                  <span className="text-slate-600 text-sm font-medium">Session: <b className="text-slate-900">{currentUser}</b></span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* GOOGLE MAPS LOCATION BUTTON */}
              <a href="https://maps.google.com/?q=Sepang+Selangor+Malaysia" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border border-slate-300">
                <MapPin size={16} /> Location
              </a>
              
              {isInternal && (
                <button onClick={loadData} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border border-slate-300">
                  <RefreshCw size={16} className={isLoading ? "animate-spin text-slate-800" : ""} /> Sync
                </button>
              )}
              <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:text-slate-100 hover:bg-slate-800 bg-slate-200 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border border-slate-300">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>

          {isInternal && (
            <div className="flex flex-col gap-6 border-t border-slate-300 pt-6 mt-6">
              {activeTab === 'board' && (
                <div className="bg-slate-200 p-5 rounded-2xl border border-slate-300 shadow-sm relative z-40">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    {editingItem ? <Edit2 size={18} className="text-slate-600"/> : <Plus size={18} className="text-slate-700"/>} {editingItem ? 'Edit Job' : 'Create New Repair Job'}
                  </h3>
                  <form onSubmit={handleReceiveItem} className="flex flex-col gap-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative"><Package size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Device/Item Name" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-slate-50 text-sm" required/></div>
                      <div className="relative"><Tag size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Brand" value={formData.itemBrand} onChange={(e) => setFormData({...formData, itemBrand: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-slate-50 text-sm" /></div>
                      
                      <div className="md:col-span-2 relative" ref={dropdownRef}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative"><User size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Client Name" value={formData.clientName} onChange={(e) => { setFormData({...formData, clientName: e.target.value}); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-slate-50 text-sm" autoComplete="off"/></div>
                          <div className="relative"><Phone size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Client Phone" value={formData.clientPhone} onChange={(e) => { setFormData({...formData, clientPhone: e.target.value}); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-slate-50 text-sm" required autoComplete="off"/></div>
                        </div>

                        {showClientDropdown && (
                          <div className="absolute z-50 top-full left-0 w-full mt-2 bg-slate-50 border border-slate-300 shadow-[0_10px_40px_rgb(0,0,0,0.15)] rounded-xl max-h-72 overflow-y-auto">
                            {filteredClients.length > 0 && (
                              <div className="p-2 flex flex-col gap-1">
                                <div className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500">Existing Clients</div>
                                {filteredClients.map(client => (
                                  <button key={client.username} type="button" onClick={() => { setFormData(prev => ({ ...prev, clientName: client.client_name || '', clientPhone: client.username })); setShowClientDropdown(false); }} className="flex justify-between items-center w-full px-3 py-2.5 hover:bg-slate-200 rounded-lg text-left">
                                    <span className="font-semibold text-slate-800 text-sm flex items-center gap-2"><User size={14} className="text-slate-600"/> {client.client_name || 'Unknown'}</span>
                                    <span className="font-mono text-xs text-slate-500 flex items-center gap-1"><Phone size={12}/> {client.username}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="relative md:col-span-2 flex flex-col gap-3">
                        <div className="relative"><AlignLeft size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl bg-slate-50 text-sm" /></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <Wrench size={16} className="absolute left-4 top-3.5 text-slate-500" />
                            <select value={formData.assigned_engineer || ''} onChange={(e) => setFormData({...formData, assigned_engineer: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-slate-50 text-sm appearance-none cursor-pointer">
                              <option value="">Assign Engineer (Optional)</option>
                              {engineersList.map(eng => <option key={eng.username} value={eng.username}>{eng.client_name || eng.username}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 bg-slate-100 border border-slate-300 text-slate-700 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-300 transition-colors text-sm font-semibold shadow-sm w-full justify-center">
                              <ImagePlus size={16} className="text-slate-600" /> {formData.photo ? 'Change Photo' : 'Attach Device Photo'}
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                            {formData.photo && (
                              <div className="relative border border-slate-300 rounded-lg p-1 bg-slate-100 flex-none">
                                <img src={formData.photo} alt="Preview" className="h-10 w-10 object-cover rounded-md" />
                                <button type="button" onClick={() => setFormData({...formData, photo: null})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2 justify-end">
                      {editingItem && <button type="button" onClick={() => { setEditingItem(null); setFormData({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '', photo: null, assigned_engineer: '' }) }} className="bg-slate-300 hover:bg-slate-400 text-slate-800 border border-slate-400 px-6 py-2.5 rounded-xl font-semibold text-sm">Cancel Edit</button>}
                      <button type="submit" className={`bg-slate-800 hover:bg-slate-900 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-md shadow-slate-400/50 text-sm`}>{editingItem ? 'Save Updates' : 'Add Item'}</button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className="flex gap-2 w-full bg-slate-200/80 p-1 rounded-lg self-start overflow-x-auto relative z-30 flex-nowrap">
                <button onClick={() => setActiveTab('board')} className={`flex-none flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold ${activeTab === 'board' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'}`}><LayoutDashboard size={16} /> Pipeline View</button>
                <button onClick={() => setActiveTab('history')} className={`flex-none flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold ${activeTab === 'history' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'}`}><History size={16} /> Audit Explorer</button>
                {isAdmin && (
                  <>
                    <button onClick={() => setActiveTab('clients')} className={`flex-none flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold ${activeTab === 'clients' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'}`}><Users size={16} /> Client Directory</button>
                    <button onClick={() => setActiveTab('engineers')} className={`flex-none flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold ${activeTab === 'engineers' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'}`}><Wrench size={16} /> Engineer Directory</button>
                  </>
                )}
                <button onClick={() => setActiveTab('requests')} className={`flex-none flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold ${activeTab === 'requests' ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'}`}>
                  <Inbox size={16} /> Incoming Requests 
                  {requests.length > 0 && <span className="ml-1.5 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full">{requests.length}</span>}
                </button>
              </div>
            </div>
          )}
        </div>

        {!isInternal ? (
          <CustomerDashboard items={items} currentUser={currentUser} updateItemData={updateItemData} />
        ) : activeTab === 'history' ? (
          <HistoryLog items={items} setItems={setItems} isAdmin={isAdmin} isInternal={isInternal} getClientName={getClientName} supabase={supabase} />
        ) : activeTab === 'clients' && isAdmin ? (
          <ClientManagement usersDB={usersDB} setUsersDB={setUsersDB} items={items} setItems={setItems} isAdmin={isAdmin} supabase={supabase} />
        ) : activeTab === 'engineers' && isAdmin ? (
          <EngineerManagement usersDB={usersDB} setUsersDB={setUsersDB} isAdmin={isAdmin} supabase={supabase} />
        ) : activeTab === 'requests' ? (
          <RequestsManagement requests={requests} setRequests={setRequests} items={items} setItems={setItems} usersDB={usersDB} setUsersDB={setUsersDB} supabase={supabase} />
        ) : (
          <KanbanBoard items={items} setItems={setItems} isAdmin={isAdmin} isInternal={isInternal} startEdit={startEdit} deleteItem={deleteItem} getClientName={getClientName} updateItemData={updateItemData} supabase={supabase} currentUser={currentUser} usersDB={usersDB} />
        )}
      </div>
    </div>
  );
}