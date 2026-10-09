import { useState } from 'react';
import { Package, History, Phone, Edit2, Trash2, Save, X, Search } from 'lucide-react';

export default function HistoryLog({ items, setItems, isAdmin, isInternal, getClientName, supabase }) {
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState(items.length > 0 ? items[0].id : null);
  const [editingHistory, setEditingHistory] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // NEW: Search state

  const selectedItemForHistory = items.find(i => i.id === selectedHistoryItemId);

  const deleteHistoryRecord = async (itemId, historyIndex, logId) => {
    if (!isAdmin) return alert("Only Administrators can delete history logs.");
    if (window.confirm("Delete this specific history record?")) {
      await supabase.from('history_logs').delete().eq('id', logId);
      setItems(items.map(item => item.id === itemId 
        ? { ...item, history: item.history.filter((_, idx) => idx !== historyIndex) } 
        : item));
    }
  };

  const saveHistoryEdit = async () => {
    if (!editingHistory || !isInternal) return;
    await supabase.from('history_logs').update({ stage: editingHistory.stage }).eq('id', editingHistory.logId);
    
    setItems(items.map(item => {
      if (item.id === editingHistory.itemId) {
        const updatedHistory = [...item.history];
        updatedHistory[editingHistory.index] = { ...updatedHistory[editingHistory.index], stage: editingHistory.stage };
        return { ...item, history: updatedHistory };
      }
      return item;
    }));
    setEditingHistory(null);
  };

  // NEW: Filter items array based on Search
  const filteredItems = items.filter(item => 
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.owner && item.owner.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-slate-100 rounded-2xl shadow-sm border border-slate-300 overflow-hidden flex flex-col">
      <div className="bg-slate-200 border-b border-slate-300 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 shadow-sm border border-slate-300 flex items-center justify-center">
              <Package className="text-slate-700" size={16}/>
            </div>
            <h3 className="font-extrabold text-slate-800 m-0 text-base">Select Record to Inspect</h3>
          </div>
          
          {/* SEARCH BAR */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search ID, Name, or Phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500/20 bg-slate-50 text-sm outline-none"
            />
          </div>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-3 custom-scrollbar">
          {filteredItems.length > 0 ? filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedHistoryItemId(item.id)}
              className={`flex-none flex flex-col items-start px-5 py-4 rounded-xl border-2 transition-all min-w-[240px] text-left ${selectedHistoryItemId === item.id ? 'bg-slate-300 border-slate-500 shadow-sm' : 'bg-slate-50 border-slate-300 hover:border-slate-400'}`}
            >
              <span className={`text-xs font-mono font-bold mb-1.5 tracking-wide ${selectedHistoryItemId === item.id ? 'text-slate-800' : 'text-slate-500'}`}>{item.id}</span>
              <span className="text-sm font-bold text-slate-800 truncate w-full mb-1">{item.name}</span>
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1"><Phone size={10}/> {getClientName(item.owner)}</span>
            </button>
          )) : (
            <p className="text-sm text-slate-500 italic py-2">No records found matching your search.</p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="p-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Timestamp</th>
              <th className="p-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Event Log</th>
              <th className="p-5 font-bold text-slate-500 text-xs uppercase tracking-wider w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {selectedItemForHistory ? (
              selectedItemForHistory.history.length > 0 ? (
                selectedItemForHistory.history.map((log, idx) => {
                  const isEditing = editingHistory?.itemId === selectedItemForHistory.id && editingHistory?.index === idx;
                  const logDate = new Date(log.created_at).toLocaleString();
                  return (
                    <tr key={idx} className={`border-b border-slate-300 ${isEditing ? 'bg-slate-200/50' : 'hover:bg-slate-200 transition-colors bg-slate-50'}`}>
                      <td className="p-5 text-sm text-slate-700 font-medium">
                        {logDate}
                      </td>
                      <td className="p-5 text-sm">
                        {isEditing ? <input type="text" value={editingHistory.stage} onChange={(e) => setEditingHistory({...editingHistory, stage: e.target.value})} className="border border-slate-400 bg-slate-100 px-3 py-2 rounded-lg w-full text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:outline-none" /> : <span className="bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-md text-xs font-bold">{log.stage}</span>}
                      </td>
                      <td className="p-5 text-sm text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={saveHistoryEdit} className="text-slate-100 bg-slate-800 hover:bg-slate-900 p-2 rounded-lg transition-colors"><Save size={16} /></button>
                            <button onClick={() => setEditingHistory(null)} className="text-slate-600 bg-slate-300 hover:bg-slate-400 p-2 rounded-lg transition-colors"><X size={16} /></button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingHistory({ itemId: selectedItemForHistory.id, index: idx, stage: log.stage, logId: log.id })} className="text-slate-500 hover:text-slate-900 hover:bg-slate-300 p-2 rounded-lg transition-colors"><Edit2 size={16} /></button>
                            {isAdmin && <button onClick={() => deleteHistoryRecord(selectedItemForHistory.id, idx, log.id)} className="text-slate-500 hover:text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : <tr><td colSpan="3" className="p-12 text-center text-slate-500 font-medium">Log is empty.</td></tr>
            ) : <tr><td colSpan="3" className="p-16 text-center"><History className="mx-auto text-slate-400 mb-4" size={24} /><p className="text-slate-600 font-semibold">Select a waybill from the slider above</p></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}