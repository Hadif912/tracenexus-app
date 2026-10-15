import { useState, useEffect } from 'react';
import { Package, History, Phone, Edit2, Trash2, Save, X, Search, ChevronLeft, ChevronRight, ArrowDownUp, Layers, Loader2 } from 'lucide-react';

export default function HistoryLog({ items, setItems, isAdmin, isInternal, getClientName, supabase }) {
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState(items.length > 0 ? items[0].id : null);
  const [editingHistory, setEditingHistory] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); 
  
  const [sortBy, setSortBy] = useState('date');
  const [groupBy, setGroupBy] = useState('none');

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const [selectedLogs, setSelectedLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedLogs([]);
    setEditingHistory(null);
  }, [selectedHistoryItemId]);

  let processedItems = items.filter(item => 
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.owner && item.owner.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  processedItems = processedItems.sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.intake_date || a.created_at);
      const dateB = new Date(b.intake_date || b.created_at);
      return dateB - dateA; 
    } else {
      const nameA = getClientName(a.owner).toLowerCase();
      const nameB = getClientName(b.owner).toLowerCase();
      return nameA.localeCompare(nameB); 
    }
  });

  let groupedItems = {};
  if (groupBy === 'none') {
    groupedItems['All'] = processedItems;
  } else if (groupBy === 'client') {
    processedItems.forEach(item => {
      const cName = getClientName(item.owner);
      if (!groupedItems[cName]) groupedItems[cName] = [];
      groupedItems[cName].push(item);
    });
  } else if (groupBy === 'date') {
    processedItems.forEach(item => {
      const date = item.intake_date || new Date(item.created_at).toISOString().split('T')[0];
      if (!groupedItems[date]) groupedItems[date] = [];
      groupedItems[date].push(item);
    });
  }

  const selectedItemForHistory = items.find(i => i.id === selectedHistoryItemId);
  
  // NEW: Sort the logs by timestamp descending (Latest First)
  const historyLogs = [...(selectedItemForHistory?.history || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  const totalLogs = historyLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / logsPerPage));
  
  if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  const currentLogs = historyLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  const saveHistoryEdit = async () => {
    if (!editingHistory || !isInternal) return;
    setIsProcessing(true);
    try {
      await supabase.from('history_logs').update({ stage: editingHistory.stage }).eq('id', editingHistory.logId);
      setItems(items.map(item => {
        if (item.id === editingHistory.itemId) {
          const updatedHistory = [...item.history];
          const indexToUpdate = updatedHistory.findIndex(l => l.id === editingHistory.logId);
          if (indexToUpdate !== -1) {
            updatedHistory[indexToUpdate] = { ...updatedHistory[indexToUpdate], stage: editingHistory.stage };
          }
          return { ...item, history: updatedHistory };
        }
        return item;
      }));
      setEditingHistory(null);
    } catch (e) {
      console.error(e);
      alert("Error saving record.");
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteSingleLog = async (logId) => {
    if (!isAdmin) return alert("Only Administrators can delete history logs.");
    if (window.confirm("Delete this specific history record?")) {
      setIsProcessing(true);
      try {
        await supabase.from('history_logs').delete().eq('id', logId);
        setItems(items.map(item => item.id === selectedHistoryItemId 
          ? { ...item, history: item.history.filter(log => log.id !== logId) } 
          : item));
        setSelectedLogs(prev => prev.filter(id => id !== logId));
      } catch (e) {
        console.error(e);
        alert("Error deleting record.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (!isAdmin || selectedLogs.length === 0) return;
    if (window.confirm(`Delete ${selectedLogs.length} selected history record(s)?`)) {
      setIsProcessing(true);
      try {
        await supabase.from('history_logs').delete().in('id', selectedLogs);
        setItems(items.map(item => {
          if (item.id === selectedHistoryItemId) {
            return { ...item, history: item.history.filter(log => !selectedLogs.includes(log.id)) };
          }
          return item;
        }));
        setSelectedLogs([]);
      } catch (e) {
        console.error(e);
        alert("Error during batch delete.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedLogs.length === currentLogs.length && currentLogs.length > 0) {
      setSelectedLogs([]); 
    } else {
      setSelectedLogs(currentLogs.map(log => log.id)); 
    }
  };

  const toggleSelectLog = (logId) => {
    if (selectedLogs.includes(logId)) {
      setSelectedLogs(prev => prev.filter(id => id !== logId));
    } else {
      setSelectedLogs(prev => [...prev, logId]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col relative min-h-[600px]">
      
      {isProcessing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 flex flex-col items-center">
            <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
            <span className="text-sm font-extrabold text-slate-700 tracking-wide">Syncing Database...</span>
          </div>
        </div>
      )}

      {/* REFINED TOP SECTION: Sleeker Controls & Slider */}
      <div className="bg-slate-50/50 border-b border-slate-200 p-5 rounded-t-2xl">
        
        {/* Streamlined Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600">
              <Package size={16}/>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">Select Record</h3>
              <p className="text-[11px] font-medium text-slate-500">Showing {processedItems.length} items</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 outline-none shadow-sm transition-all"
              />
            </div>
            
            {/* Sort */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-slate-300">
              <ArrowDownUp size={14} className="text-slate-400" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs font-semibold text-slate-700 border-none bg-transparent outline-none cursor-pointer p-0 pr-2">
                <option value="date">Date (Newest)</option>
                <option value="client">Client (A-Z)</option>
              </select>
            </div>

            {/* Group */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-slate-300">
              <Layers size={14} className="text-slate-400" />
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="text-xs font-semibold text-slate-700 border-none bg-transparent outline-none cursor-pointer p-0 pr-2">
                <option value="none">No Grouping</option>
                <option value="client">Group by Client</option>
                <option value="date">Group by Date</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Compact Item Slider */}
        <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar items-start">
          {processedItems.length > 0 ? (
            Object.keys(groupedItems).map(groupKey => (
              <div key={groupKey} className="flex flex-col gap-2">
                {groupBy !== 'none' && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-wider flex items-center gap-1.5">
                    {groupKey} <span className="bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded text-[9px]">{groupedItems[groupKey].length}</span>
                  </span>
                )}
                <div className="flex gap-3">
                  {groupedItems[groupKey].map(item => {
                    const isSelected = selectedHistoryItemId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedHistoryItemId(item.id)}
                        className={`flex-none flex flex-col items-start p-3.5 rounded-xl border transition-all min-w-[200px] max-w-[220px] text-left ${isSelected ? 'bg-slate-800 border-slate-900 shadow-md ring-1 ring-slate-800' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:bg-slate-50'}`}
                      >
                        <span className={`text-[10px] font-mono font-bold mb-1.5 tracking-wide px-1.5 py-0.5 rounded ${isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>{item.id}</span>
                        <span className={`text-sm font-bold truncate w-full mb-1 ${isSelected ? 'text-white' : 'text-slate-800'}`}>{item.name}</span>
                        <span className={`text-[10px] font-medium flex items-center gap-1.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          <Phone size={10}/> {getClientName(item.owner)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-500 font-medium">No records found matching your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Logs Table */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white rounded-b-2xl">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                {isAdmin && selectedItemForHistory?.history.length > 0 && (
                  <th className="py-4 px-5 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={currentLogs.length > 0 && selectedLogs.length === currentLogs.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                <th className={`py-4 px-5 font-bold text-slate-400 text-xs uppercase tracking-wider ${!isAdmin || !selectedItemForHistory?.history.length ? 'pl-8' : ''}`}>Timestamp</th>
                <th className="py-4 px-5 font-bold text-slate-400 text-xs uppercase tracking-wider">Event Log</th>
                <th className="py-4 px-5 font-bold text-slate-400 text-xs uppercase tracking-wider w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedItemForHistory ? (
                currentLogs.length > 0 ? (
                  currentLogs.map((log, idx) => {
                    const isEditing = editingHistory?.itemId === selectedItemForHistory.id && editingHistory?.logId === log.id;
                    const logDate = new Date(log.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                    const isChecked = selectedLogs.includes(log.id);

                    return (
                      <tr key={log.id} className={`border-b border-slate-100 transition-colors ${isChecked ? 'bg-blue-50/50' : isEditing ? 'bg-slate-50' : 'hover:bg-slate-50/50 bg-white'}`}>
                        {isAdmin && (
                          <td className="py-3 px-5 text-center">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => toggleSelectLog(log.id)}
                              className="w-4 h-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        )}
                        <td className={`py-3 px-5 text-sm text-slate-600 font-medium ${!isAdmin ? 'pl-8' : ''}`}>
                          {logDate}
                        </td>
                        <td className="py-3 px-5 text-sm">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editingHistory.stage} 
                              onChange={(e) => setEditingHistory({...editingHistory, stage: e.target.value})} 
                              className="border border-blue-300 bg-white px-3 py-1.5 rounded-md w-full text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none shadow-sm" 
                            />
                          ) : (
                            <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded text-xs font-semibold">{log.stage}</span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-sm text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1.5">
                              <button onClick={saveHistoryEdit} className="text-white bg-blue-600 hover:bg-blue-700 p-1.5 rounded-md transition-colors shadow-sm"><Save size={14} /></button>
                              <button onClick={() => setEditingHistory(null)} className="text-slate-500 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-md transition-colors border border-slate-200"><X size={14} /></button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingHistory({ itemId: selectedItemForHistory.id, logId: log.id, stage: log.stage })} className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors"><Edit2 size={14} /></button>
                              {isAdmin && <button onClick={() => deleteSingleLog(log.id)} className="text-slate-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"><Trash2 size={14} /></button>}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : <tr><td colSpan={isAdmin ? "4" : "3"} className="py-12 text-center text-slate-400 text-sm font-medium bg-white">Log is empty for this record.</td></tr>
              ) : <tr><td colSpan={isAdmin ? "4" : "3"} className="py-20 text-center bg-white"><History className="mx-auto text-slate-300 mb-3" size={32} /><p className="text-slate-400 font-bold text-sm">Select a record from the slider above</p></td></tr>}
            </tbody>
          </table>
        </div>

        {/* PAGINATION & BATCH ACTIONS FOOTER */}
        {selectedItemForHistory && totalLogs > 0 && (
          <div className="flex items-center justify-between p-4 bg-white border-t border-slate-200 rounded-b-2xl">
            
            <div className="flex items-center gap-4">
              {isAdmin && (
                <button 
                  onClick={handleBatchDelete} 
                  disabled={selectedLogs.length === 0} 
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${selectedLogs.length > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm' : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'}`}
                >
                  <Trash2 size={14}/> Delete ({selectedLogs.length})
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-slate-500">
                {totalLogs === 0 ? '0-0 of 0' : `${(currentPage - 1) * logsPerPage + 1}-${Math.min(currentPage * logsPerPage, totalLogs)} of ${totalLogs}`}
              </span>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1} 
                  className={`p-1.5 rounded-md transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <ChevronLeft size={16}/>
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage === totalPages || totalPages === 0} 
                  className={`p-1.5 rounded-md transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <ChevronRight size={16}/>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// aku rasa kene tambah 1 type user lg..  inventory controller.
// sbb kertas tepi ni dy kata akan key in barang masuk.. jadi mungkin akan kena key in spare part yg masuk juga rasanya.....
// 