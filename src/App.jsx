import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import KanbanBoard from './components/KanbanBoard';
import HistoryLog from './components/HistoryLog';
import CustomerDashboard from './components/CustomerDashboard';
import ClientManagement from './components/ClientManagement';
import RequestsManagement from './components/RequestsManagement';
import { Truck, Shield, Activity, User, LogOut, LayoutDashboard, History, Plus, Edit2, Package, Tag, Phone, AlignLeft, Users, ImagePlus, X, Inbox } from 'lucide-react';

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
  
  const [formData, setFormData] = useState({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '', photo: null });
  const [editingItem, setEditingItem] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const dropdownRef = useRef(null); 

  const isInternal = userRole === 'admin' || userRole === 'staff';
  const isAdmin = userRole === 'admin';
  const customerList = usersDB.filter(u => u.role === 'customer');

  // FIX: Bulletproof Database Fetching
  useEffect(() => {
    async function loadData() {
      try {
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) setUsersDB(usersData);

        const { data: reqData } = await supabase.from('repair_requests').select('*');
        if (reqData) setRequests(reqData);

        const { data: itemsData } = await supabase.from('items').select('*, history:history_logs(*)');
        if (itemsData) {
          const sortedItems = itemsData.map(item => ({
            ...item,
            history: Array.isArray(item.history) ? item.history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : []
          }));
          setItems(sortedItems);
        }
      } catch (error) {
        console.error("Safely caught DB error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = 400 / img.width;
        canvas.width = 400; canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData({ ...formData, photo: canvas.toDataURL('image/jpeg', 0.6) });
      };
    };
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">Connecting to Database...</div>;

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
      alert(`System Note: New client account created for ${formData.clientPhone}`);
    } else if (formData.clientName && existingCustomer.client_name !== formData.clientName) {
      await supabase.from('users').update({ client_name: formData.clientName }).eq('username', formData.clientPhone);
      setUsersDB(usersDB.map(u => u.username === formData.clientPhone ? { ...u, client_name: formData.clientName } : u));
    }

    if (editingItem) {
      const updates = { name: formData.itemName, brand: formData.itemBrand, description: formData.description, owner: formData.clientPhone, photo: formData.photo || editingItem.photo };
      await supabase.from('items').update(updates).eq('id', editingItem.id);
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...updates } : i));
      setEditingItem(null);
    } else {
      const newItemId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
      const newItem = { 
        id: newItemId, name: formData.itemName, brand: formData.itemBrand, description: formData.description, owner: formData.clientPhone, photo: formData.photo,
        stage: 'Receiving', problem: '', price: '', client_decision: 'Pending', repair_status: 'In Progress', outbound_status: 'In Inventory'
      };
      await supabase.from('items').insert([newItem]);
      
      const { data: newLog } = await supabase.from('history_logs').insert([{ item_id: newItemId, stage: 'Receiving' }]).select().single();
      setItems([...items, { ...newItem, history: newLog ? [newLog] : [] }]);
    }
    setFormData({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '', photo: null });
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
    setFormData({ itemName: item.name || '', itemBrand: item.brand || '', clientPhone: item.owner || '', clientName: getClientName(item.owner) || '', description: item.description || '', photo: null });
  };

  const filteredClients = customerList.filter(c => c.username.includes(formData.clientPhone) && (c.client_name || '').toLowerCase().includes(formData.clientName.toLowerCase()));

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
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border border-slate-200"><LogOut size={16} /> Logout</button>
          </div>

          {isInternal && (
            <div className="flex flex-col gap-6 border-t border-slate-100 pt-6 mt-6">
              {activeTab === 'board' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm relative z-40">
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    {editingItem ? <Edit2 size={18} className="text-blue-500"/> : <Plus size={18} className="text-blue-600"/>} {editingItem ? 'Edit Job' : 'Create New Repair Job'}
                  </h3>
                  <form onSubmit={handleReceiveItem} className="flex flex-col gap-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative"><Package size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Device/Item Name" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-white text-sm" required/></div>
                      <div className="relative"><Tag size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Brand" value={formData.itemBrand} onChange={(e) => setFormData({...formData, itemBrand: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-white text-sm" /></div>
                      
                      <div className="md:col-span-2 relative" ref={dropdownRef}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative"><User size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Client Name" value={formData.clientName} onChange={(e) => { setFormData({...formData, clientName: e.target.value}); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-white text-sm" autoComplete="off"/></div>
                          <div className="relative"><Phone size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Client Phone" value={formData.clientPhone} onChange={(e) => { setFormData({...formData, clientPhone: e.target.value}); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-white text-sm" required autoComplete="off"/></div>
                        </div>

                        {showClientDropdown && (
                          <div className="absolute z-50 top-full left-0 w-full mt-2 bg-white border border-slate-200 shadow-[0_10px_40px_rgb(0,0,0,0.08)] rounded-xl max-h-72 overflow-y-auto">
                            {filteredClients.length > 0 && (
                              <div className="p-2 flex flex-col gap-1">
                                <div className="px-3 py-2 text-[10px] font-bold uppercase text-slate-400">Existing Clients</div>
                                {filteredClients.map(client => (
                                  <button key={client.username} type="button" onClick={() => { setFormData(prev => ({ ...prev, clientName: client.client_name || '', clientPhone: client.username })); setShowClientDropdown(false); }} className="flex justify-between items-center w-full px-3 py-2.5 hover:bg-blue-50 rounded-lg text-left">
                                    <span className="font-semibold text-slate-700 text-sm flex items-center gap-2"><User size={14} className="text-blue-500"/> {client.client_name || 'Unknown'}</span>
                                    <span className="font-mono text-xs text-slate-500 flex items-center gap-1"><Phone size={12}/> {client.username}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="relative md:col-span-2 flex flex-col gap-3">
                        <div className="relative"><AlignLeft size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-sm" /></div>
                        
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 text-sm font-semibold shadow-sm">
                            <ImagePlus size={16} className="text-blue-500" /> {formData.photo ? 'Change Photo' : 'Attach Device Photo'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>
                          {formData.photo && (
                            <div className="relative border border-slate-200 rounded-lg p-1">
                              <img src={formData.photo} alt="Preview" className="h-10 w-10 object-cover rounded-md" />
                              <button type="button" onClick={() => setFormData({...formData, photo: null})} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-0.5"><X size={12}/></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2 justify-end">
                      {editingItem && <button type="button" onClick={() => { setEditingItem(null); setFormData({ itemName: '', itemBrand: '', clientName: '', clientPhone: '', description: '', photo: null }) }} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-6 py-2.5 rounded-xl font-semibold text-sm">Cancel Edit</button>}
                      <button type="submit" className={`bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-md shadow-blue-200/50 text-sm`}>{editingItem ? 'Save Updates' : 'Add to Pipeline'}</button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className="flex gap-2 w-full bg-slate-100/50 p-1 rounded-lg self-start overflow-x-auto relative z-30">
                <button onClick={() => setActiveTab('board')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold ${activeTab === 'board' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}><LayoutDashboard size={16} /> Pipeline View</button>
                <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold ${activeTab === 'history' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}><History size={16} /> Audit Explorer</button>
                {isAdmin && <button onClick={() => setActiveTab('clients')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold ${activeTab === 'clients' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}><Users size={16} /> Client Directory</button>}
                <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold ${activeTab === 'requests' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                  <Inbox size={16} /> Incoming Requests 
                  {requests.length > 0 && <span className="ml-1.5 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{requests.length}</span>}
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
        ) : activeTab === 'requests' ? (
          <RequestsManagement requests={requests} setRequests={setRequests} items={items} setItems={setItems} usersDB={usersDB} setUsersDB={setUsersDB} supabase={supabase} />
        ) : (
          <KanbanBoard items={items} setItems={setItems} isAdmin={isAdmin} isInternal={isInternal} startEdit={startEdit} deleteItem={deleteItem} getClientName={getClientName} updateItemData={updateItemData} supabase={supabase} />
        )}
      </div>
    </div>
  );
}