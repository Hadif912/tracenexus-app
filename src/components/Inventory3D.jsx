import { useState, useEffect } from 'react';
import { Box, Search, Loader2, AlertCircle, CheckCircle2, RotateCcw, Plus, Minus, Database, PlusCircle, Save, Trash2 } from 'lucide-react';

export default function Inventory3D({ t, supabase, isAdmin }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [partData, setPartData] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Unified System Message State
  const [systemMsg, setSystemMsg] = useState({ text: '', type: '' });

  // Add Item States
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ part_no: '', category: 'IC', quantity: 0, bin_location: '' });

  // Dynamic Category State
  const defaultCategories = ['IC', 'TRANSISTOR', 'CAPACITOR', 'DIODE', 'RESISTOR', 'RELAY'];
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('krc_categories');
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  useEffect(() => {
    localStorage.setItem('krc_categories', JSON.stringify(categories));
  }, [categories]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setSystemMsg({ text: '', type: '' });
    setIsSearchLoading(true);
    
    try {
      const { data, error: sbError } = await supabase.from('inventory').select('*').ilike('part_no', `%${searchTerm}%`).limit(1).maybeSingle();
      
      if (sbError || !data) throw new Error('Component not found in database.');

      setTimeout(() => {
        setPartData(data);
        setIsSearchLoading(false);
      }, 400);
      
    } catch (err) {
      setTimeout(() => {
        setSystemMsg({ text: err.message, type: 'error' });
        setPartData(null);
        setIsSearchLoading(false);
      }, 400);
    }
  };

  const updateStock = async (amount) => {
    if (!partData || !isAdmin) return;
    const newQty = partData.quantity + amount;
    if (newQty < 0) return; 
    
    await supabase.from('inventory').update({ quantity: newQty }).eq('id', partData.id);
    setPartData({ ...partData, quantity: newQty });
  };

  const deleteComponent = async () => {
    if (!partData || !isAdmin) return;
    if (window.confirm(`WARNING: Are you sure you want to permanently delete ${partData.part_no} from the database?`)) {
      await supabase.from('inventory').delete().eq('id', partData.id);
      
      const deletedName = partData.part_no;
      clearSearch();
      setSystemMsg({ text: `Component ${deletedName} was permanently deleted.`, type: 'success' });
    }
  };

  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!newItem.part_no.trim() || !isAdmin) return;
    setIsSearchLoading(true);
    setSystemMsg({ text: '', type: '' });
    
    try {
      const { error } = await supabase.from('inventory').insert([{
        part_no: newItem.part_no.toUpperCase(),
        category: newItem.category,
        quantity: parseInt(newItem.quantity) || 0,
        unit: 'pcs',
        bin_location: newItem.bin_location
      }]);
      
      if (error) throw error;
      
      setSystemMsg({ text: `${newItem.part_no.toUpperCase()} added successfully!`, type: 'success' });
      setNewItem({ part_no: '', category: categories[0] || '', quantity: 0, bin_location: '' });
    } catch (err) {
      setSystemMsg({ text: 'Error: Part No might already exist.', type: 'error' });
    } finally {
      setIsSearchLoading(false);
    }
  };

  const addCategory = () => {
    const newCat = window.prompt("Enter new category name:");
    if (newCat && newCat.trim()) {
      const formatted = newCat.trim().toUpperCase();
      if (!categories.includes(formatted)) {
        setCategories([...categories, formatted]);
        setNewItem({ ...newItem, category: formatted });
      }
    }
  };

  const deleteCategory = () => {
    if (categories.length <= 1) return alert("You must have at least one category.");
    if (window.confirm(`Remove category "${newItem.category}" from the list?`)) {
      const updated = categories.filter(c => c !== newItem.category);
      setCategories(updated);
      setNewItem({ ...newItem, category: updated[0] });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPartData(null);
    setSystemMsg({ text: '', type: '' });
  };

  return (
    <div className={`p-6 bg-white/50 rounded-2xl border ${t.border} shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[70vh] flex flex-col`}>
      
      <div className="flex items-center gap-3 mb-6 flex-none">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${t.btn} text-white`}>
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Parts Inventory System</h2>
          <p className="text-sm font-medium text-slate-500">Search, locate, and manage repair components.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-6 md:p-8 flex flex-col w-full lg:w-1/3 flex-none relative overflow-hidden">
           <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isAdding ? 'from-emerald-500 to-teal-400' : 'from-blue-500 to-emerald-400'}`}></div>

           <div className="flex items-center gap-3 mb-6">
             <div className={`w-3 h-3 rounded-full ${isAdding ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`}></div>
             <h3 className="font-extrabold text-white text-xl tracking-wide m-0">KRC INVENTORY</h3>
           </div>

           {isAdmin && (
             <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6 border border-slate-700">
               <button onClick={() => {setIsAdding(false); setSystemMsg({ text: '', type: '' });}} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isAdding ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>Search Part</button>
               <button onClick={() => {setIsAdding(true); setSystemMsg({ text: '', type: '' }); setPartData(null);}} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${isAdding ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}><PlusCircle size={14}/> Add New</button>
             </div>
           )}

           {!isAdding ? (
             <form onSubmit={handleSearch} className="flex flex-col gap-5 animate-in fade-in">
               <div>
                 <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Locate Component</label>
                 <div className="relative">
                   <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
                   <input 
                     type="text" 
                     placeholder="Enter Part No..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                   />
                 </div>
               </div>
               <button type="submit" disabled={isSearchLoading || !searchTerm.trim()} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
                 {isSearchLoading ? <><Loader2 size={18} className="animate-spin" /> Scanning...</> : 'Execute Search'}
               </button>
             </form>
           ) : (
             <form onSubmit={handleAddNew} className="flex flex-col gap-4 animate-in fade-in">
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Part Number</label>
                 <input type="text" required placeholder="e.g. CD4045BE" value={newItem.part_no} onChange={(e) => setNewItem({...newItem, part_no: e.target.value})} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                   <div className="flex items-center gap-1">
                     <select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} className="flex-1 px-2 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-0">
                       {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                     </select>
                     <div className="flex flex-col gap-1">
                       <button type="button" onClick={addCategory} className="p-1 bg-slate-700 hover:bg-emerald-600 text-white rounded transition-colors" title="Add Category"><Plus size={10}/></button>
                       <button type="button" onClick={deleteCategory} className="p-1 bg-slate-700 hover:bg-red-600 text-white rounded transition-colors" title="Delete Category"><Trash2 size={10}/></button>
                     </div>
                   </div>
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Initial Qty</label>
                   <input type="number" min="0" required value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: e.target.value})} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                 </div>
               </div>

               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bin Location</label>
                 <input type="text" placeholder="e.g. A1, 4042" value={newItem.bin_location} onChange={(e) => setNewItem({...newItem, bin_location: e.target.value})} className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
               </div>
               <button type="submit" disabled={isSearchLoading || !newItem.part_no.trim()} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
                 {isSearchLoading ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Save size={18}/> Register Component</>}
               </button>
             </form>
           )}

           {/* Unified System Notifications */}
           {systemMsg.text && (
             <div className={`mt-6 p-4 border-l-4 rounded-r-xl animate-in fade-in ${systemMsg.type === 'error' ? 'bg-red-500/10 border-red-500' : 'bg-emerald-500/10 border-emerald-500'}`}>
               <div className={`flex items-center gap-2 font-bold text-sm mb-1 ${systemMsg.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                 {systemMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} 
                 {systemMsg.type === 'error' ? 'Action Failed' : 'Success'}
               </div>
               <p className={`text-xs ${systemMsg.type === 'error' ? 'text-red-300/80' : 'text-emerald-300/80'}`}>{systemMsg.text}</p>
             </div>
           )}
        </div>

        <div className="flex-1 bg-white/60 rounded-2xl border border-slate-200 shadow-inner p-6 md:p-8 flex flex-col justify-center items-center relative">
          {!partData && !isSearchLoading && (
             <div className="text-center opacity-60">
               <Box size={48} className="mx-auto text-slate-300 mb-4" />
               <p className="text-slate-500 font-bold text-lg">System Ready</p>
               <p className="text-slate-400 text-sm">Use the panel to search or add components.</p>
             </div>
          )}

          {isSearchLoading && (
             <div className="text-center opacity-80">
               <Loader2 size={48} className="animate-spin mx-auto text-blue-500 mb-4" />
               <p className="text-slate-600 font-bold text-lg">Accessing Database...</p>
             </div>
          )}

          {partData && !isSearchLoading && !isAdding && (
             <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-extrabold text-slate-700 text-sm uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Target Acquired
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wider ${partData.quantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {partData.quantity > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                  </span>
                </div>

                <div className="p-6 md:p-8 flex flex-col gap-6">
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Component Number</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tight">{partData.part_no}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-6 border-b border-slate-100 pb-6">
                     <div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                       <p className="text-base font-bold text-slate-700">{partData.category}</p>
                     </div>
                     <div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Quantity Available</p>
                       <div className="flex items-center gap-2">
                         <p className="text-2xl font-black text-slate-800">{partData.quantity}</p>
                         <span className="text-slate-400 font-medium text-sm mt-1">{partData.unit}</span>
                       </div>
                       
                       {isAdmin && (
                         <div className="flex items-center gap-2 mt-2">
                           <button onClick={() => updateStock(-1)} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors"><Minus size={16}/></button>
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Adjust</span>
                           <button onClick={() => updateStock(1)} className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-md transition-colors"><Plus size={16}/></button>
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="p-5 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
                     <p className="text-slate-500 text-xs font-extrabold uppercase tracking-widest mb-1">Bin Location Coordinates</p>
                     <p className="text-3xl font-black text-slate-700 tracking-wider">BIN - {partData.bin_location}</p>
                   </div>

                   <div className="flex gap-3 mt-2">
                     <button onClick={clearSearch} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors">
                       <RotateCcw size={16} /> Reset
                     </button>
                     {isAdmin && (
                       <button onClick={deleteComponent} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold transition-colors">
                         <Trash2 size={16} /> Delete Item
                       </button>
                     )}
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}