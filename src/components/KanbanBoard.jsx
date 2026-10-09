import { useState } from 'react';
import { STAGES, STAGE_CONFIG } from '../constants';
import { Package, Edit2, Trash2, User, ImageIcon, X, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function KanbanBoard({ items, setItems, isAdmin, isInternal, startEdit, deleteItem, getClientName, updateItemData, supabase }) {
  const [viewingPhoto, setViewingPhoto] = useState(null); 
  
  const updateItemStage = async (itemId, targetStage) => {
    // 1. Update DB Item
    await supabase.from('items').update({ stage: targetStage }).eq('id', itemId);
    // 2. Insert DB Log
    const { data: newLog } = await supabase.from('history_logs').insert([{ item_id: itemId, stage: targetStage }]).select().single();
    // 3. Update React
    setItems(items.map(item => item.id === itemId ? { ...item, stage: targetStage, history: [...item.history, newLog] } : item));
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
    <>
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
                  <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 group">
                    {item.photo && <button onClick={() => setViewingPhoto(item.photo)} className="mb-4 w-full flex items-center justify-center gap-2 bg-slate-50 text-blue-600 border border-slate-200 py-2 rounded-lg text-xs font-bold"><ImageIcon size={14} /> View Attached Photo</button>}
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border tracking-wide ${config.badge} border-transparent`}>{item.id}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-blue-600 p-1.5 rounded-md"><Edit2 size={14} /></button>
                          {isAdmin && <button onClick={() => deleteItem(item.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded-md"><Trash2 size={14} /></button>}
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-800 text-base m-0 leading-tight">{item.name}</h3>
                      <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mt-3 bg-slate-50 inline-flex px-2 py-1 rounded border border-slate-100"><User size={12}/> {getClientName(item.owner)} ({item.owner})</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                      {stage === 'Inspection' && (
                        <div className="flex flex-col gap-2">
                          <input type="text" placeholder="Detected problem..." defaultValue={item.problem || ''} onBlur={(e) => updateItemData(item.id, { problem: e.target.value })} className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                          <input type="text" placeholder="Price (e.g. $150)" defaultValue={item.price || ''} onBlur={(e) => updateItemData(item.id, { price: e.target.value })} className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" />
                        </div>
                      )}
                      {stage === 'Inform' && <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center text-xs font-semibold text-slate-600">Client Approval: <span className={item.client_decision === 'Proceed' ? 'text-emerald-600' : item.client_decision === 'Cancel' ? 'text-red-600' : 'text-amber-500'}>{item.client_decision || 'Pending...'}</span></div>}
                      {stage === 'Status' && (
                        <div className="flex justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="font-bold text-slate-600">Repair Status:</span>
                        <select value={item.repair_status || 'In Progress'} onChange={(e) => updateItemData(item.id, { repair_status: e.target.value })} className="p-1 border border-slate-200 rounded bg-white font-semibold text-blue-600 outline-none"><option value="In Progress">In Progress</option><option value="Done">Done</option></select></div>
                      )}
                      {stage === 'Outbound' && (
                        <div className="flex justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="font-bold text-slate-600">Inventory:</span>
                        <select value={item.outbound_status || 'In Inventory'} onChange={(e) => updateItemData(item.id, { outbound_status: e.target.value })} className="p-1 border border-slate-200 rounded bg-white font-semibold text-blue-600 outline-none"><option value="In Inventory">In Inventory</option><option value="Delivered">Delivered</option></select></div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <button onClick={() => moveItemBackward(item.id, stage)} disabled={stageIndex === 0} className={`flex-[0.5] py-2.5 rounded-lg flex items-center justify-center text-sm font-bold ${stageIndex === 0 ? 'bg-slate-50 text-slate-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><ArrowLeft size={16} /></button>
                      <button onClick={() => moveItemForward(item.id, stage)} disabled={stageIndex === STAGES.length - 1} className={`flex-[2] py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold ${stageIndex === STAGES.length - 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{stageIndex === STAGES.length - 1 ? <><CheckCircle2 size={16} /> Completed</> : <>Advance <ArrowRight size={16} /></>}</button>
                    </div>
                  </div>
                ))}
                {stageItems.length === 0 && <div className="text-center text-slate-400 text-sm font-medium p-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">Empty Queue</div>}
              </div>
            </div>
          );
        })}
      </div>

      {viewingPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setViewingPhoto(null)}>
          <div className="relative bg-white p-2 rounded-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingPhoto(null)} className="absolute -top-4 -right-4 bg-white hover:text-red-500 rounded-full p-2 shadow-lg border border-slate-100"><X size={20} /></button>
            <img src={viewingPhoto} alt="Device Full View" className="w-full rounded-lg object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </>
  );
}