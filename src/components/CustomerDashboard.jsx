import { useState } from 'react';
import { Search, Package, Clock, CheckCircle2, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { STAGE_CONFIG } from '../constants';

export default function CustomerDashboard({ items, currentUser, updateItemData }) {
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState(null);
  
  const customerOwnedItems = items.filter(item => item.owner === currentUser);
  const filteredCustomerItems = customerOwnedItems.filter(item => 
    item.id.toLowerCase().includes(customerSearchQuery.toLowerCase()) || item.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3"><Search className="text-blue-600" size={24} /> Locate Repair Jobs</h2>
          <div className="relative w-full md:w-96"><Search size={18} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Tracking ID or Device Name..." value={customerSearchQuery} onChange={(e) => setCustomerSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 bg-slate-50 text-sm"/></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomerItems.map(item => {
            const config = STAGE_CONFIG[item.stage];
            return (
              <div key={item.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-white flex flex-col justify-between">
                {item.photo && <button onClick={() => setViewingPhoto(item.photo)} className="mb-5 w-full flex items-center justify-center gap-2 bg-slate-50 text-blue-600 border border-slate-200 py-2.5 rounded-lg text-xs font-bold"><ImageIcon size={14} /> View Device Photo</button>}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border tracking-wide ${config.badge}`}>{item.id}</span>
                      <h3 className="font-bold text-slate-800 mt-3 m-0 leading-snug text-lg">{item.name}</h3>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-5 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 mb-2 uppercase font-bold tracking-widest">Active Status</p>
                    <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold ${config.bg} ${config.text} border ${config.border}`}>
                      {item.stage === 'Outbound' && item.outbound_status === 'Delivered' ? <CheckCircle2 size={16}/> : <Clock size={16}/>}
                      {item.stage} 
                      {item.stage === 'Status' && ` - ${item.repair_status || 'In Progress'}`}
                      {item.stage === 'Outbound' && ` - ${item.outbound_status || 'In Inventory'}`}
                    </div>
                  </div>

                  {(item.problem || item.price) && (
                    <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <p className="text-[11px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1.5"><AlertCircle size={14}/> Inspection Report</p>
                      {item.problem && <p className="text-sm font-medium text-slate-800">{item.problem}</p>}
                      {item.price && <p className="text-sm font-extrabold text-blue-600 mt-1">Quoted Price: {item.price}</p>}
                    </div>
                  )}

                  {item.stage === 'Inform' && (!item.client_decision || item.client_decision === 'Pending') && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => updateItemData(item.id, { client_decision: 'Proceed' })} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-lg font-bold text-xs">Proceed</button>
                      <button onClick={() => updateItemData(item.id, { client_decision: 'Cancel' })} className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-bold text-xs">Cancel Repair</button>
                    </div>
                  )}

                  {item.client_decision && item.client_decision !== 'Pending' && (
                    <p className="text-xs font-bold text-slate-600 mt-4">Your Decision: <span className={item.client_decision === 'Proceed' ? 'text-emerald-600' : 'text-red-600'}>{item.client_decision}</span></p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {viewingPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setViewingPhoto(null)}>
          <div className="relative bg-white p-2 rounded-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingPhoto(null)} className="absolute -top-4 -right-4 bg-white hover:text-red-500 rounded-full p-2 shadow-lg"><X size={20} /></button>
            <img src={viewingPhoto} alt="Device Full View" className="w-full rounded-lg object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </>
  );
}