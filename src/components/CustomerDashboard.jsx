import { useState } from 'react';
import { Search, Package, Clock, CheckCircle2, History, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { STAGE_CONFIG } from '../constants';

export default function CustomerDashboard({ items, currentUser, updateItemData }) {
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  const customerOwnedItems = items.filter(item => item.owner === currentUser);
  const filteredCustomerItems = customerOwnedItems.filter(item => 
    item.id.toLowerCase().includes(customerSearchQuery.toLowerCase()) || 
    item.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 p-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
          <Search className="text-blue-600" size={24} /> Locate Repair Jobs
        </h2>
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tracking ID or Device Name..." 
            value={customerSearchQuery}
            onChange={(e) => setCustomerSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomerItems.map(item => {
          const config = STAGE_CONFIG[item.stage];
          return (
            <div key={item.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-900/5 hover:border-blue-200 transition-all bg-white flex flex-col justify-between group">
              
              {/* Photo Display for Customer */}
              {item.photo && (
                <div className="mb-5 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                  <img src={item.photo} alt="Device" className="w-full h-36 object-cover object-center" />
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border tracking-wide ${config.badge} border-transparent`}>
                      {item.id}
                    </span>
                    <h3 className="font-bold text-slate-800 mt-3 m-0 leading-snug text-lg">{item.name}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                    <Package className="text-slate-400 group-hover:text-blue-600 transition-colors" size={20} />
                  </div>
                </div>

                <div className="mb-4">
                  {item.brand && <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded">{item.brand}</span>}
                  {item.description && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.description}</p>}
                </div>
                
                <div className="mt-4 pt-5 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400 mb-2 uppercase font-bold tracking-widest">Active Status</p>
                  <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold ${config.bg} ${config.text} border ${config.border}`}>
                    {item.stage === 'Outbound' && item.outboundStatus === 'Delivered' ? <CheckCircle2 size={16}/> : <Clock size={16}/>}
                    {item.stage} 
                    {item.stage === 'Status' && ` - ${item.repairStatus || 'In Progress'}`}
                    {item.stage === 'Outbound' && ` - ${item.outboundStatus || 'In Inventory'}`}
                  </div>
                </div>

                {(item.problem || item.price) && (
                  <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-[11px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1.5"><AlertCircle size={14}/> Inspection Report</p>
                    {item.problem && <p className="text-sm font-medium text-slate-800">{item.problem}</p>}
                    {item.price && <p className="text-sm font-extrabold text-blue-600 mt-1">Quoted Price: {item.price}</p>}
                  </div>
                )}

                {item.stage === 'Inform' && (!item.clientDecision || item.clientDecision === 'Pending') && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => updateItemData(item.id, { clientDecision: 'Proceed' })} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-bold text-xs transition-colors">Proceed</button>
                    <button onClick={() => updateItemData(item.id, { clientDecision: 'Cancel' })} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-bold text-xs transition-colors">Cancel Repair</button>
                  </div>
                )}

                {item.clientDecision && item.clientDecision !== 'Pending' && (
                  <p className="text-xs font-bold text-slate-600 mt-4">
                    Your Decision: <span className={item.clientDecision === 'Proceed' ? 'text-emerald-600' : 'text-red-600'}>{item.clientDecision}</span>
                  </p>
                )}

              </div>
            </div>
          );
        })}

        {customerOwnedItems.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
              <Package className="text-slate-300" size={28} />
            </div>
            <p className="text-slate-500 font-semibold text-lg">No active jobs.</p>
            <p className="text-slate-400 text-sm mt-1">Your assigned devices will appear here.</p>
          </div>
        ) : filteredCustomerItems.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Search className="mx-auto text-slate-300 mb-4" size={36} />
            <p className="text-slate-500 font-semibold text-lg">No matches found.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}