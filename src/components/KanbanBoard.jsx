import { useState } from 'react';
import { STAGES, STAGE_CONFIG } from '../constants';
import { Package, Edit2, Trash2, User, ImageIcon, X, ArrowLeft, ArrowRight, CheckCircle2, Wrench, Layers, AlertCircle } from 'lucide-react';

export default function KanbanBoard({ items, setItems, isAdmin, isInternal, startEdit, deleteItem, getClientName, updateItemData, supabase, currentUser, usersDB }) {
  const [viewingPhoto, setViewingPhoto] = useState(null); 
  // NEW: State to track which subpage/stage is currently active
  const [activeStage, setActiveStage] = useState(STAGES[0]);
  
  const updateItemStage = async (itemId, targetStage) => {
    await supabase.from('items').update({ stage: targetStage }).eq('id', itemId);
    const { data: newLog } = await supabase.from('history_logs').insert([{ item_id: itemId, stage: targetStage }]).select().single();
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

  const getEngineerName = (username) => {
    const user = usersDB.find(u => u.username === username);
    return user ? (user.client_name || user.username) : 'Unassigned';
  };

  // Get items for the currently selected subpage
  const stageItems = items.filter(item => item.stage === activeStage);
  const stageIndex = STAGES.indexOf(activeStage);
  const config = STAGE_CONFIG[activeStage];

  return (
    <div className="flex flex-col h-full">
      
      {/* NEW: Subpage Navigation Menu */}
      <div className="bg-slate-200/70 p-1.5 rounded-xl mb-6 flex overflow-x-auto custom-scrollbar border border-slate-300 shadow-sm">
        {STAGES.map((stage) => {
          const count = items.filter(i => i.stage === stage).length;
          const isActive = activeStage === stage;
          
          return (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-slate-800 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'}`}
            >
              {stage}
              <span className={`px-2 py-0.5 rounded-full text-[10px] tracking-wide ${isActive ? 'bg-slate-700 text-slate-100' : 'bg-slate-300 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* NEW: Subpage Header */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${config.bg} ${config.text} border ${config.border}`}>
          <Layers size={20} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{activeStage} Process</h2>
          <p className="text-sm font-medium text-slate-500">Currently managing {stageItems.length} active item{stageItems.length !== 1 && 's'} in this queue.</p>
        </div>
      </div>

      {/* NEW: Responsive Grid Layout for Cards */}
      <div className="flex-1 min-h-[50vh]">
        {stageItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
            {stageItems.map(item => {
              // Role Permissions Check
              const isAssignedEng = item.assigned_engineer === currentUser;
              const canInspect = isAdmin || isAssignedEng;
              const canStatus = isAdmin || isAssignedEng;
              const canOutbound = isAdmin;

              return (
                <div key={item.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-300 shadow-sm flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition-all group relative overflow-hidden">
                  
                  {/* Subtle top color bar based on stage */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${config.badge.split(' ')[0]}`}></div>

                  <div>
                    {item.photo && (
                      <button onClick={() => setViewingPhoto(item.photo)} className="mb-5 w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 py-2.5 rounded-xl text-xs font-bold transition-colors">
                        <ImageIcon size={16} /> View Device Photo
                      </button>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border tracking-wide shadow-sm ${config.badge} border-transparent`}>{item.id}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="text-slate-500 hover:text-slate-800 hover:bg-slate-200 p-2 rounded-lg transition-colors" title="Edit Meta"><Edit2 size={14} /></button>
                        {isAdmin && <button onClick={() => deleteItem(item.id)} className="text-slate-500 hover:text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>}
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg m-0 leading-tight mb-4">{item.name}</h3>
                    
                    <div className="flex flex-col gap-2 mb-6">
                      <div className="flex items-center gap-2 bg-slate-200 px-3 py-2 rounded-lg border border-slate-300 w-full">
                        <User size={14} className="text-slate-500 flex-none"/> 
                        <span className="text-xs font-bold text-slate-700 truncate">{getClientName(item.owner)}</span>
                        <span className="text-[10px] text-slate-500 ml-auto font-mono">{item.owner}</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 w-full ${!item.assigned_engineer ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                        <Wrench size={14} className={!item.assigned_engineer ? 'text-amber-500' : 'text-slate-500'}/> 
                        <span className="text-xs font-bold truncate">Eng: {getEngineerName(item.assigned_engineer)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stage Specific Actions */}
                  <div className="mt-auto pt-5 border-t border-slate-300 flex flex-col gap-4">
                    {activeStage === 'Inspection' && (
                      <div className="flex flex-col gap-3">
                        {canInspect ? (
                          <>
                            <div className="relative">
                              <AlertCircle size={14} className="absolute left-3 top-3 text-slate-400" />
                              <input type="text" placeholder="Detected problem..." defaultValue={item.problem || ''} onBlur={(e) => updateItemData(item.id, { problem: e.target.value })} className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 bg-white rounded-xl focus:ring-2 focus:ring-slate-500/20 outline-none shadow-sm" />
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">$</span>
                              <input type="text" placeholder="Estimated Price..." defaultValue={item.price || ''} onBlur={(e) => updateItemData(item.id, { price: e.target.value })} className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 bg-white rounded-xl focus:ring-2 focus:ring-slate-500/20 outline-none shadow-sm" />
                            </div>
                          </>
                        ) : (
                          <div className="text-xs p-4 bg-slate-200 rounded-xl border border-slate-300">
                            <p className="text-slate-700"><span className="font-bold">Problem:</span> {item.problem || 'Pending review...'}</p>
                            <p className="text-slate-700 mt-2"><span className="font-bold">Price:</span> {item.price || 'Pending...'}</p>
                            <p className="text-[10px] text-amber-700 font-bold mt-3 text-center bg-amber-100 py-1.5 rounded-lg border border-amber-300">Read-Only: Engineer or Admin required</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeStage === 'Inform' && (
                      <div className="bg-slate-200 p-4 rounded-xl border border-slate-300 flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">Awaiting Client Response</span>
                        <span className={`text-sm font-extrabold ${item.client_decision === 'Proceed' ? 'text-emerald-700' : item.client_decision === 'Cancel' ? 'text-red-600' : 'text-slate-800'}`}>
                          {item.client_decision || 'Pending...'}
                        </span>
                      </div>
                    )}

                    {activeStage === 'Status' && (
                      <div className="flex flex-col gap-2 bg-slate-200 p-3.5 rounded-xl border border-slate-300">
                        <div className="flex justify-between text-sm items-center">
                          <span className="font-bold text-slate-700">Repair Status:</span>
                          {canStatus ? (
                            <select value={item.repair_status || 'In Progress'} onChange={(e) => updateItemData(item.id, { repair_status: e.target.value })} className="p-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 outline-none shadow-sm cursor-pointer">
                              <option value="In Progress">In Progress</option>
                              <option value="Done">Done</option>
                            </select>
                          ) : (
                            <span className="font-extrabold text-slate-800">{item.repair_status || 'In Progress'}</span>
                          )}
                        </div>
                        {!canStatus && <p className="text-[10px] text-amber-700 font-bold text-center bg-amber-100 py-1.5 mt-1 rounded-lg border border-amber-300">Read-Only: Engineer or Admin required</p>}
                      </div>
                    )}

                    {activeStage === 'Outbound' && (
                      <div className="flex flex-col gap-2 bg-slate-200 p-3.5 rounded-xl border border-slate-300">
                        <div className="flex justify-between text-sm items-center">
                          <span className="font-bold text-slate-700">Inventory Status:</span>
                          {canOutbound ? (
                            <select value={item.outbound_status || 'In Inventory'} onChange={(e) => updateItemData(item.id, { outbound_status: e.target.value })} className="p-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800 outline-none shadow-sm cursor-pointer">
                              <option value="In Inventory">In Inventory</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          ) : (
                            <span className="font-extrabold text-slate-800">{item.outbound_status || 'In Inventory'}</span>
                          )}
                        </div>
                        {!canOutbound && <p className="text-[10px] text-amber-700 font-bold text-center bg-amber-100 py-1.5 mt-1 rounded-lg border border-amber-300">Only Admins can dispatch items</p>}
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-2 mt-2 pt-4 border-t border-slate-200">
                      <button 
                        onClick={() => moveItemBackward(item.id, activeStage)} 
                        disabled={stageIndex === 0} 
                        className={`flex-[0.5] py-3 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${stageIndex === 0 ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 border border-slate-300'}`}
                        title="Move Back"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <button 
                        onClick={() => moveItemForward(item.id, activeStage)} 
                        disabled={stageIndex === STAGES.length - 1} 
                        className={`flex-[2] py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm ${stageIndex === STAGES.length - 1 ? 'bg-slate-700 text-slate-400 border border-slate-800 cursor-not-allowed' : 'bg-slate-800 text-slate-100 hover:bg-slate-900 border border-slate-900 hover:shadow-md'}`}
                      >
                        {stageIndex === STAGES.length - 1 ? <><CheckCircle2 size={18} /> Process Complete</> : <>Advance to Next <ArrowRight size={18} /></>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-slate-100/50 min-h-[40vh]">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${config.bg} ${config.text} border ${config.border} opacity-50`}>
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-700 mb-2">Queue is Empty</h3>
            <p className="text-slate-500 font-medium max-w-md">There are currently no items in the <span className="text-slate-700 font-bold">{activeStage}</span> stage. Items moved here will appear in this subpage.</p>
          </div>
        )}
      </div>

      {/* Full Screen Photo Modal Overlay */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm" onClick={() => setViewingPhoto(null)}>
          <div className="relative bg-slate-100 p-2 rounded-2xl max-w-4xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingPhoto(null)} className="absolute -top-5 -right-5 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 rounded-full p-3 shadow-xl border border-slate-300 transition-colors">
              <X size={24} />
            </button>
            <img src={viewingPhoto} alt="Device Full View" className="w-full h-auto rounded-xl object-contain max-h-[85vh] bg-white border border-slate-200" />
          </div>
        </div>
      )}
    </div>
  );
}