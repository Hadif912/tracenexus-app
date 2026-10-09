import { STAGES, STAGE_CONFIG } from '../constants';
import { Package, Edit2, Trash2, Phone, Clock, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function KanbanBoard({ items, setItems, isAdmin, isInternal, startEdit, deleteItem, getClientName, updateItemData }) {
  
  const updateItemStage = (itemId, targetStage) => {
    setItems(items.map(item => item.id === itemId 
      ? { ...item, stage: targetStage, history: [...item.history, { stage: targetStage, timestamp: new Date().toLocaleString(), iso: new Date().toISOString() }] } 
      : item));
  };

  const moveItemForward = (itemId, currentStage) => {
    if (!isInternal) return;
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex < STAGES.length - 1) updateItemStage(itemId, STAGES[currentIndex + 1]);
  };

  const moveItemBackward = (itemId, currentStage) => {
    if (!isInternal) return;
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex > 0) updateItemStage(itemId, STAGES[currentIndex - 1]);
  };

  return (
    <div className="flex overflow-x-auto gap-6 pb-6 pt-2 custom-scrollbar">
      {STAGES.map((stage, stageIndex) => {
        const stageItems = items.filter(item => item.stage === stage);
        const config = STAGE_CONFIG[stage];

        return (
          <div key={stage} className="flex-none w-[360px] bg-slate-100/50 rounded-2xl p-4 border border-slate-200 flex flex-col h-[72vh]">
            <div className="flex justify-between items-center mb-5 px-2">
              <h2 className="font-extrabold text-slate-800 m-0 text-base">{stage}</h2>
              <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">{stageItems.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 custom-scrollbar">
              {stageItems.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:border-blue-300 transition-colors group">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border tracking-wide ${config.badge} border-transparent`}>
                        {item.id}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-all" title="Edit Meta">
                          <Edit2 size={14} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => deleteItem(item.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-all" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-base m-0 leading-tight">{item.name}</h3>
                    
                    <div className="mt-2 mb-3">
                      {item.brand && <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded mr-2">{item.brand}</span>}
                      {item.description && <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{item.description}</p>}
                    </div>

                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 bg-slate-50 inline-flex px-2 py-1 rounded border border-slate-100">
                      <User size={12}/> {getClientName(item.owner)} ({item.owner || 'Unassigned'})
                    </p>
                  </div>

                  {/* Dynamic Stage Actions */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                    
                    {/* Inspection Fields */}
                    {stage === 'Inspection' && (
                      <div className="flex flex-col gap-2">
                        <input 
                          type="text" 
                          placeholder="Detected problem..." 
                          defaultValue={item.problem || ''} 
                          onBlur={(e) => updateItemData(item.id, { problem: e.target.value })} 
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                        />
                        <input 
                          type="text" 
                          placeholder="Price (e.g. $150)" 
                          defaultValue={item.price || ''} 
                          onBlur={(e) => updateItemData(item.id, { price: e.target.value })} 
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                        />
                      </div>
                    )}

                    {/* Inform Field */}
                    {stage === 'Inform' && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center text-xs font-semibold text-slate-600">
                        Client Approval: <span className={item.clientDecision === 'Proceed' ? 'text-emerald-600' : item.clientDecision === 'Cancel' ? 'text-red-600' : 'text-amber-500'}>{item.clientDecision || 'Pending...'}</span>
                      </div>
                    )}

                    {/* Status Field */}
                    {stage === 'Status' && (
                      <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-600">Repair Status:</span>
                        <select 
                          value={item.repairStatus || 'In Progress'} 
                          onChange={(e) => updateItemData(item.id, { repairStatus: e.target.value })} 
                          className="p-1 border border-slate-200 rounded bg-white font-semibold text-blue-600 outline-none cursor-pointer"
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>
                    )}

                    {/* Outbound Field */}
                    {stage === 'Outbound' && (
                      <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-600">Inventory:</span>
                        <select 
                          value={item.outboundStatus || 'In Inventory'} 
                          onChange={(e) => updateItemData(item.id, { outboundStatus: e.target.value })} 
                          className="p-1 border border-slate-200 rounded bg-white font-semibold text-blue-600 outline-none cursor-pointer"
                        >
                          <option value="In Inventory">In Inventory</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    )}

                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => moveItemBackward(item.id, stage)} disabled={stageIndex === 0} className={`flex-[0.5] py-2.5 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${stageIndex === 0 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      <ArrowLeft size={16} />
                    </button>
                    <button onClick={() => moveItemForward(item.id, stage)} disabled={stageIndex === STAGES.length - 1} className={`flex-[2] py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all border border-transparent ${stageIndex === STAGES.length - 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'}`}>
                      {stageIndex === STAGES.length - 1 ? <><CheckCircle2 size={16} /> Completed</> : <>Advance Stage <ArrowRight size={16} /></>}
                    </button>
                  </div>
                </div>
              ))}
              {stageItems.length === 0 && <div className="text-center text-slate-400 text-sm font-medium p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">Empty Queue</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}