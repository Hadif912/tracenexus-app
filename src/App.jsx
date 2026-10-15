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
import Reviews from './components/Reviews';
import SummaryStatistics from './components/SummaryStatistics'; 
import { Shield, Activity, User, LogOut, LayoutDashboard, History, Plus, Edit2, Package, Tag, Phone, AlignLeft, Users, ImagePlus, X, Inbox, RefreshCw, MapPin, Wrench, Briefcase, Palette, Star, Hash, Calendar, ChevronDown, ChevronUp, PieChart } from 'lucide-react'; 

const THEMES = {
  slate: { bg: 'bg-slate-300', card: 'bg-slate-100', btn: 'bg-slate-800', hover: 'hover:bg-slate-900', text: 'text-slate-900', border: 'border-slate-300', dot: 'bg-slate-500' },
  blue: { bg: 'bg-sky-200', card: 'bg-sky-50', btn: 'bg-sky-600', hover: 'hover:bg-sky-700', text: 'text-sky-900', border: 'border-sky-200', dot: 'bg-sky-500' },
  petronas: { bg: 'bg-teal-200', card: 'bg-teal-50', btn: 'bg-teal-700', hover: 'hover:bg-teal-800', text: 'text-teal-900', border: 'border-teal-200', dot: 'bg-teal-500' },
  purple: { bg: 'bg-purple-200', card: 'bg-purple-50', btn: 'bg-purple-700', hover: 'hover:bg-purple-800', text: 'text-purple-900', border: 'border-purple-200', dot: 'bg-purple-500' }
};

export default function App() {
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('krc_theme') || 'slate');
  const [showThemes, setShowThemes] = useState(false);
  const t = THEMES[activeTheme];

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
  
  const [showPublicReviews, setShowPublicReviews] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({ 
    itemName: '', itemBrand: '', serialNumber: '', clientName: '', clientPhone: '', description: '', photo: null, assigned_engineer: '', intakeDate: getTodayDate() 
  });
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
    localStorage.setItem('krc_theme', activeTheme);
  }, [activeTheme]);

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

  const handleReceiveItem = async (e) => {
    e.preventDefault();
    if (!formData.itemName.trim() || !formData.clientPhone.trim() || !isAdmin) return alert("Required fields missing or unauthorized!");

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
      const updates = { 
        name: formData.itemName, 
        brand: formData.itemBrand, 
        serial_number: formData.serialNumber,
        description: formData.description, 
        owner: formData.clientPhone, 
        photo: formData.photo || editingItem.photo, 
        assigned_engineer: formData.assigned_engineer,
        intake_date: formData.intakeDate
      };
      await supabase.from('items').update(updates).eq('id', editingItem.id);
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...updates } : i));
      setEditingItem(null);
    } else {
      const newItemId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
      const newItem = { 
        id: newItemId, 
        name: formData.itemName, 
        brand: formData.itemBrand, 
        serial_number: formData.serialNumber,
        description: formData.description, 
        owner: formData.clientPhone, 
        photo: formData.photo, 
        assigned_engineer: formData.assigned_engineer,
        intake_date: formData.intakeDate,
        stage: 'Receiving', 
        problem: '', 
        price: '', 
        client_decision: 'Pending', 
        repair_status: 'In Progress', 
        outbound_status: 'In Inventory'
      };
      await supabase.from('items').insert([newItem]);
      const { data: newLog } = await supabase.from('history_logs').insert([{ item_id: newItemId, stage: 'Receiving' }]).select().single();
      setItems([...items, { ...newItem, history: newLog ? [newLog] : [] }]);
    }
    
    setFormData({ itemName: '', itemBrand: '', serialNumber: '', clientName: '', clientPhone: '', description: '', photo: null, assigned_engineer: '', intakeDate: getTodayDate() });
    setShowClientDropdown(false);
    setIsFormOpen(false); 
  };

  const deleteItem = async (id) => {
    if (!isAdmin) return alert("Only Admins can delete.");
    if(window.confirm("Delete item from database?")) {
      await supabase.from('items').delete().eq('id', id);
      setItems(items.filter(item => item.id !== id));
    }
  };

  const startEdit = (item) => {
    if (!isAdmin) return;
    setEditingItem(item);
    setFormData({ 
      itemName: item.name || '', 
      itemBrand: item.brand || '', 
      serialNumber: item.serial_number || '',
      clientPhone: item.owner || '', 
      clientName: getClientName(item.owner) || '', 
      description: item.description || '', 
      photo: null, 
      assigned_engineer: item.assigned_engineer || '',
      intakeDate: item.intake_date || getTodayDate()
    });
    setIsFormOpen(true); 
    setActiveTab('board');
  };

  const filteredClients = customerList.filter(c => c.username.includes(formData.clientPhone) && (c.client_name || '').toLowerCase().includes(formData.clientName.toLowerCase()));

  if (isLoading && items.length === 0) return <div className={`min-h-screen ${t.bg} flex items-center justify-center font-bold ${t.text}`}>Connecting to Database...</div>;

  return (
    <div className={`min-h-screen ${t.bg} font-sans text-slate-800 transition-colors duration-500`}>
      
      <div className="fixed top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 z-[100]">
        <div className={`flex items-center gap-2 bg-white/70 backdrop-blur-md rounded-full shadow-sm border border-white/50 transition-all duration-300 ease-in-out ${showThemes ? 'max-w-[200px] px-3 py-2 opacity-100 translate-x-0' : 'max-w-0 opacity-0 p-0 border-transparent translate-x-4 pointer-events-none'}`}>
          {Object.keys(THEMES).map(themeName => (
            <button 
              key={themeName} 
              onClick={() => setActiveTheme(themeName)}
              className={`w-6 h-6 rounded-full border-2 transition-all flex-none ${activeTheme === themeName ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-110'} ${THEMES[themeName].dot}`}
              title={`Switch to ${themeName} theme`}
            />
          ))}
        </div>
        <button 
          onClick={() => setShowThemes(!showThemes)} 
          className={`p-3 rounded-full shadow-sm border transition-all duration-300 flex items-center justify-center ${showThemes ? 'bg-white border-white' : 'bg-white/70 border-white/50 backdrop-blur-md hover:bg-white'}`}
          title="Change Theme"
        >
          <Palette size={20} className="text-slate-700" />
        </button>
      </div>

      {showPublicReviews ? (
        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full pt-20 md:pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6 flex justify-start">
             <button onClick={() => setShowPublicReviews(false)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-white/80 backdrop-blur-md border ${t.border} ${t.text} hover:bg-white shadow-sm transition-all`}>
               &larr; Back to Login
             </button>
          </div>
          <Reviews usersDB={usersDB} currentUser={null} userRole="guest" supabase={supabase} t={t} items={[]} />
        </div>
      ) : (!userRole || userRole === 'null') ? (
        <Auth usersDB={usersDB} setUsersDB={setUsersDB} setUserRole={setUserRole} setCurrentUser={setCurrentUser} addRequest={(req) => setRequests([...requests, req])} supabase={supabase} t={t} onViewReviews={() => setShowPublicReviews(true)} />
      ) : (
        <div className="p-2 md:p-4 text-left w-full max-w-[1600px] mx-auto">
          
          <div className={`${t.card} rounded-2xl shadow-md border ${t.border} p-4 md:p-6 mb-6 transition-colors duration-500`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm overflow-hidden flex-none bg-white">
                  <img src={companyLogo} alt="Company Logo" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <h1 className={`text-2xl font-extrabold ${t.text} m-0 tracking-tight transition-colors duration-500`}>KRC Electronic Track & Trace Dashboard</h1>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide flex items-center gap-1.5 uppercase ${isAdmin ? 'bg-slate-300 text-slate-800' : userRole === 'staff' ? 'bg-slate-200 text-slate-700' : 'bg-slate-200 text-slate-600'}`}>
                      {isAdmin ? <><Shield size={12}/> Admin</> : userRole === 'staff' ? <><Activity size={12}/> Engineer</> : <><User size={12}/> Client</>}
                    </span>
                    <span className="text-slate-600 text-sm font-medium">Session: <b className={t.text}>{currentUser}</b></span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <a href="https://www.google.com/maps/place/KRC+ELECTRONIC/@3.0434607,101.5977605,17z/data=!3m1!4b1!4m6!3m5!1s0x31cc4cb0942a27c7:0x280092f3b1e8a276!8m2!3d3.0434607!4d101.6003354!16s%2Fg%2F11bbt69cjm?entry=ttu&g_ep=EgoyMDI2MTAwNi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer" className={`flex items-center gap-2 text-slate-600 hover:${t.text} bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border ${t.border}`}>
                  <MapPin size={16} /> Location
                </a>
                
                {isInternal && (
                  <button onClick={loadData} className={`flex items-center gap-2 text-slate-600 hover:${t.text} bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border ${t.border}`}>
                    <RefreshCw size={16} className={isLoading ? `animate-spin ${t.text}` : ""} /> Sync
                  </button>
                )}
                <button onClick={handleLogout} className={`flex items-center gap-2 text-slate-600 hover:text-white hover:${t.btn} bg-slate-200 px-4 py-2 rounded-lg transition-colors text-sm font-semibold border ${t.border}`}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>

            <div className={`grid gap-2 w-full bg-white/50 p-1.5 rounded-xl relative z-30 border ${t.border} mt-6 ${
              isAdmin ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7' : 
              isInternal ? 'grid-cols-2 lg:grid-cols-4' : 
              'grid-cols-2'
            }`}>
              {isInternal ? (
                <>
                  {/* CHANGED PIPELINE VIEW TO KANBAN BOARD */}
                  <button onClick={() => setActiveTab('board')} className={`w-full flex justify-center items-center gap-2 px-2 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${activeTab === 'board' ? `${t.btn} text-white shadow-sm` : 'text-slate-600 hover:bg-black/5'}`}><LayoutDashboard size={16} className="shrink-0" /> <span className="truncate">Kanban Board</span></button>
                  <button onClick={() => setActiveTab('history')} className={`w-full flex justify-center items-center gap-2 px-2 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${activeTab === 'history' ? `${t.btn} text-white shadow-sm` : 'text-slate-600 hover:bg-black/5'}`}><History size={16} className="shrink-0" /> <span className="truncate">Audit Explorer</span></button>
                  {isAdmin && (
                    <>
                      <button onClick={() => setActiveTab('clients')} className={`w-full flex justify-center items-center gap-2 px-2 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${activeTab === 'clients' ? `${t.btn} text-white shadow-sm` : 'text-slate-600 hover:bg-black/5'}`}><Users size={16} className="shrink-0" /> <span className="truncate">Client Directory</span></button>
                      <button onClick={() => setActiveTab('engineers')} className={`w-full flex justify-center items-center gap-2 px-2 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${activeTab === 'engineers' ? `${t.btn} text-white shadow-sm` : 'text-slate-600 hover:bg-black/5'}`}><Briefcase size={16} className="shrink-0" /> <span className="truncate">Staff Directory</span></button>
                      <button onClick={() => setActiveTab('statistics')} className={`w-full flex justify-center items-center gap-2 px-2 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${activeTab === 'statistics' ? `${t.btn} text-white shadow-sm` : 'text-slate-600 hover:bg-black/5'}`}><PieChart size={16} className="shrink-0" /> <span className="truncate">Analytics</span></button>
                    </>
                  )}
                  <button onClick={() => setActiveTab('requests')} className={`w-full flex justify-center items-center gap-2 px-2 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${activeTab === 'requests' ? `${t.btn} text-white shadow-sm` : 'text-slate-600 hover:bg-black/5'}`}>
                    <Inbox size={16} className="shrink-0" /> <span className="truncate">Requests</span> 
                    {requests.length > 0 && <span className={`shrink-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full`}>{requests.length}</span>}
                  </button>
                </>
              ) : (
                <button onClick={() => setActiveTab('board')} className={`w-full flex justify-center items-center gap-2 px-2 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${activeTab === 'board' ? `${t.btn} text-white shadow-sm` : 'text-slate-600 hover:bg-black/5'}`}><Package size={16} className="shrink-0" /> <span className="truncate">My Repairs</span></button>
              )}
              <button onClick={() => setActiveTab('reviews')} className={`w-full flex justify-center items-center gap-2 px-2 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${activeTab === 'reviews' ? `${t.btn} text-white shadow-sm` : 'text-slate-600 hover:bg-black/5'}`}><Star size={16} className="shrink-0" /> <span className="truncate">Reviews</span></button>
            </div>
          </div>

          {isAdmin && activeTab === 'board' && (
            <div className={`bg-white/50 p-5 rounded-2xl border ${t.border} shadow-sm relative z-40 mb-6 transition-all duration-300`}>
              
              <button 
                onClick={() => {
                  if (isFormOpen && editingItem) {
                    setEditingItem(null);
                    setFormData({ itemName: '', itemBrand: '', serialNumber: '', clientName: '', clientPhone: '', description: '', photo: null, assigned_engineer: '', intakeDate: getTodayDate() });
                  }
                  setIsFormOpen(!isFormOpen);
                }}
                className={`w-full flex items-center justify-between font-bold ${t.text} hover:opacity-80 transition-opacity`}
              >
                <div className="flex items-center gap-2 text-lg">
                  {editingItem ? <Edit2 size={20} className="text-blue-600"/> : <Plus size={20} className="text-emerald-600"/>} 
                  {editingItem ? 'Edit Job' : 'Create New Repair Job'}
                </div>
                <div className="p-1 bg-slate-200/50 rounded-lg">
                  {isFormOpen ? <ChevronUp size={20} className="text-slate-600"/> : <ChevronDown size={20} className="text-slate-600"/>}
                </div>
              </button>

              {isFormOpen && (
                <form onSubmit={handleReceiveItem} className="flex flex-col gap-4 w-full mt-5 border-t border-slate-200 pt-5 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative"><Package size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Device/Item Name" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className={`w-full pl-11 pr-4 py-3 border ${t.border} rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-white text-sm`} required/></div>
                    <div className="relative"><Tag size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Brand" value={formData.itemBrand} onChange={(e) => setFormData({...formData, itemBrand: e.target.value})} className={`w-full pl-11 pr-4 py-3 border ${t.border} rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-white text-sm`} /></div>
                    <div className="relative"><Hash size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Serial / Service Number" value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} className={`w-full pl-11 pr-4 py-3 border ${t.border} rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-white text-sm`} /></div>
                    
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-3.5 text-slate-500" />
                      <input type="date" value={formData.intakeDate} onChange={(e) => setFormData({...formData, intakeDate: e.target.value})} className={`w-full pl-11 pr-4 py-3 border ${t.border} rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-white text-sm font-medium text-slate-700`} required/>
                    </div>
                    
                    <div className="md:col-span-2 relative" ref={dropdownRef}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative"><User size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Client Name" value={formData.clientName} onChange={(e) => { setFormData({...formData, clientName: e.target.value}); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} className={`w-full pl-11 pr-4 py-3 border ${t.border} rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-white text-sm`} autoComplete="off"/></div>
                        <div className="relative"><Phone size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Client Phone" value={formData.clientPhone} onChange={(e) => { setFormData({...formData, clientPhone: e.target.value}); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} className={`w-full pl-11 pr-4 py-3 border ${t.border} rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-white text-sm`} required autoComplete="off"/></div>
                      </div>

                      {showClientDropdown && (
                        <div className={`absolute z-50 top-full left-0 w-full mt-2 bg-white border ${t.border} shadow-[0_10px_40px_rgb(0,0,0,0.15)] rounded-xl max-h-72 overflow-y-auto`}>
                          {filteredClients.length > 0 && (
                            <div className="p-2 flex flex-col gap-1">
                              <div className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500">Existing Clients</div>
                              {filteredClients.map(client => (
                                <button key={client.username} type="button" onClick={() => { setFormData(prev => ({ ...prev, clientName: client.client_name || '', clientPhone: client.username })); setShowClientDropdown(false); }} className="flex justify-between items-center w-full px-3 py-2.5 hover:bg-slate-100 rounded-lg text-left">
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
                      <div className="relative"><AlignLeft size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Description / Problem mentioned by client" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={`w-full pl-11 pr-4 py-3 border ${t.border} rounded-xl bg-white text-sm`} /></div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <Wrench size={16} className="absolute left-4 top-3.5 text-slate-500" />
                          <select value={formData.assigned_engineer || ''} onChange={(e) => setFormData({...formData, assigned_engineer: e.target.value})} className={`w-full pl-11 pr-4 py-3 border ${t.border} rounded-xl focus:ring-2 focus:ring-slate-500/20 bg-white text-sm appearance-none cursor-pointer`}>
                            <option value="">Assign Engineer (Optional)</option>
                            {engineersList.map(eng => <option key={eng.username} value={eng.username}>{eng.client_name || eng.username}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className={`flex items-center gap-2 bg-white border ${t.border} text-slate-700 px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm w-full justify-center`}>
                            <ImagePlus size={16} className="text-slate-600" /> {formData.photo ? 'Change Photo' : 'Attach Device Photo'}
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>
                          {formData.photo && (
                            <div className={`relative border ${t.border} rounded-lg p-1 bg-white flex-none`}>
                              <img src={formData.photo} alt="Preview" className="h-10 w-10 object-cover rounded-md" />
                              <button type="button" onClick={() => setFormData({...formData, photo: null})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2 justify-end">
                    {editingItem && <button type="button" onClick={() => { setEditingItem(null); setIsFormOpen(false); setFormData({ itemName: '', itemBrand: '', serialNumber: '', clientName: '', clientPhone: '', description: '', photo: null, assigned_engineer: '', intakeDate: getTodayDate() }) }} className="bg-slate-300 hover:bg-slate-400 text-slate-800 border border-slate-400 px-6 py-2.5 rounded-xl font-semibold text-sm">Cancel Edit</button>}
                    <button type="submit" className={`${t.btn} ${t.hover} text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-md text-sm transition-colors`}>{editingItem ? 'Save Updates' : 'Add Item'}</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MAIN RENDER BLOCK */}
          {activeTab === 'reviews' ? (
            <Reviews usersDB={usersDB} currentUser={currentUser} userRole={userRole} supabase={supabase} t={t} items={items} />
          ) : activeTab === 'statistics' && isAdmin ? (
            <SummaryStatistics items={items} t={t} /> 
          ) : !isInternal ? (
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
      )}
    </div>
  );
}