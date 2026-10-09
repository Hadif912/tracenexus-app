import { useState } from 'react';
import { Package, History, Phone, Edit2, Trash2, Save, X } from 'lucide-react';

export default function HistoryLog({ items, setItems, isAdmin, isInternal, getClientName }) {
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState(items.length > 0 ? items[0].id : null);
  const [editingHistory, setEditingHistory] = useState(null);

  const selectedItemForHistory = items.find(i => i.id === selectedHistoryItemId);

  const deleteHistoryRecord = (itemId, historyIndex) => {
    if (!isAdmin) return alert("Only Administrators can delete history logs.");
    if (window.confirm("Delete this specific history record?")) {
      setItems(items.map(item => item.id === itemId 
        ? { ...item, history: item.history.filter((_, idx) => idx !== historyIndex) } 
        : item));
    }
  };

  const saveHistoryEdit = () => {
    if (!editingHistory || !isInternal) return;
    setItems(items.map(item => {
      if (item.id === editingHistory.itemId) {
        const updatedHistory = [...item.history];
        updatedHistory[editingHistory.index] = { ...updatedHistory[editingHistory.index], stage: editingHistory.stage, timestamp: editingHistory.timestamp };
        return { ...item, history: updatedHistory };
      }
      return item;
    }));
    setEditingHistory(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center">
            <Package className="text-slate-600" size={16}/>
          </div>
          <h3 className="font-extrabold text-slate-800 m-0 text-base">Select Record to Inspect</h3>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-3 custom-scrollbar">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedHistoryItemId(item.id)}
              className={`flex-none flex flex-col items-start px-5 py-4 rounded-xl border-2 transition-all min-w-[240px] text-left ${selectedHistoryItemId === item.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-200'}`}
            >
              <span className={`text-xs font-mono font-bold mb-1.5 tracking-wide ${selectedHistoryItemId === item.id ? 'text-blue-700' : 'text-slate-500'}`}>{item.id}</span>
              <span className="text-sm font-bold text-slate-800 truncate w-full mb-1">{item.name}</span>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><Phone size={10}/> {getClientName(item.owner)}</span>
            </button>
          ))}
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
                    <tr key={idx} className={`border-b border-slate-100 ${isEditing ? 'bg-sky-50/50' : 'hover:bg-slate-50'}`}>
                      <td className="p-5 text-sm text-slate-600">
                        {isEditing ? <input type="text" value={editingHistory.timestamp} onChange={(e) => setEditingHistory({...editingHistory, timestamp: e.target.value})} className="border border-blue-300 px-3 py-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none" /> : log.timestamp}
                      </td>
                      <td className="p-5 text-sm">
                        {isEditing ? <input type="text" value={editingHistory.stage} onChange={(e) => setEditingHistory({...editingHistory, stage: e.target.value})} className="border border-blue-300 px-3 py-2 rounded-lg w-full text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none" /> : <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-md text-xs font-bold">{log.stage}</span>}
                      </td>
                      <td className="p-5 text-sm text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={saveHistoryEdit} className="text-blue-700 bg-blue-100 hover:bg-blue-200 p-2 rounded-lg"><Save size={16} /></button>
                            <button onClick={() => setEditingHistory(null)} className="text-slate-600 bg-slate-200 hover:bg-slate-300 p-2 rounded-lg"><X size={16} /></button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingHistory({ itemId: selectedItemForHistory.id, index: idx, stage: log.stage, timestamp: log.timestamp })} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit2 size={16} /></button>
                            {isAdmin && <button onClick={() => deleteHistoryRecord(selectedItemForHistory.id, idx)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : <tr><td colSpan="3" className="p-12 text-center text-slate-400 font-medium">Log is empty.</td></tr>
            ) : <tr><td colSpan="3" className="p-16 text-center"><History className="mx-auto text-slate-300 mb-4" size={24} /><p className="text-slate-500 font-semibold">Select a waybill from the slider above</p></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}