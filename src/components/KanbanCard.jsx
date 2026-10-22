import { useState } from 'react';
import { Info, ImageIcon, Calendar, Edit2, Trash2, User, Wrench, AlertCircle, FileText, Plus, CheckCircle2, ArrowLeft, ArrowRight, Search, PackageMinus } from 'lucide-react';
import { STAGES } from '../constants';

export default function KanbanCard({
  item, config, activeStage, stageIndex, isAdmin, currentUser,
  getClientName, getEngineerName, startEdit, deleteItem, updateItemData,
  setViewingJob, setViewingPhoto, setQuotationModalJob, handleClientDecision,
  moveItemBackward, moveItemForward, supabase
}) {
  const isAssignedEng = item.assigned_engineer === currentUser;
  const canInspect = isAdmin || isAssignedEng;
  const canStatus = isAdmin || isAssignedEng;
  const canOutbound = isAdmin;

  // SPARE PART STATES
  const [partSearch, setPartSearch] = useState('');
  const [partData, setPartData] = useState(null);
  const [qtyNeeded, setQtyNeeded] = useState(1);
  const [partMsg, setPartMsg] = useState({ text: '', type: '' });

  const checkPart = async () => {
    if (!partSearch.trim()) return;
    setPartMsg({ text: 'Checking inventory...', type: 'normal' });
    setPartData(null);

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .ilike('part_no', `%${partSearch}%`)
      .limit(1)
      .maybeSingle();
    
    const isWaiting = item.repair_status === 'Waiting for spare part';

    if (error || !data) {
      setPartMsg({ 
        text: isWaiting ? 'Still not available in inventory.' : 'Part not found. Prompt Admin to add item.', 
        type: 'error' 
      });
    } else {
      setPartData(data);
      if (data.quantity > 0) {
        setPartMsg({ 
          text: isWaiting ? `Available! ${data.quantity} ${data.unit} in stock.` : `Found ${data.part_no} | In Stock: ${data.quantity} ${data.unit}`, 
          type: 'success' 
        });
      } else {
        setPartMsg({ 
          text: isWaiting ? 'Still not available (Out of stock).' : `Found ${data.part_no} | Out of stock. Prompt Admin to restock.`, 
          type: 'error' 
        });
      }
    }
  };

  const consumePart = async () => {
    if (!partData) return;
    if (qtyNeeded > partData.quantity) {
      setPartMsg({ text: 'Not enough item. Prompt Admin to restock.', type: 'error' });
      return;
    }
    
    const newQty = partData.quantity - qtyNeeded;
    await supabase.from('inventory').update({ quantity: newQty }).eq('part_no', partData.part_no);
    
    const updatedDesc = `${item.description || ''}\n[Used ${qtyNeeded}x ${partData.part_no}]`;
    await updateItemData(item.id, { description: updatedDesc });
    
    setPartData({ ...partData, quantity: newQty });
    setPartMsg({ text: `Success! Deducted ${qtyNeeded}. Remaining: ${newQty}`, type: 'success' });
    setPartSearch('');
    setTimeout(() => { setPartData(null); setPartMsg({ text: '', type: '' }); }, 3000);
  };

  const handleStatusChange = (newStatus) => {
    updateItemData(item.id, { repair_status: newStatus });
    setPartSearch('');
    setPartData(null);
    setPartMsg({ text: '', type: '' });
  };

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-300 shadow-sm flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition-all group relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1.5 ${config.badge.split(' ')[0]}`}></div>

      <div>
        <div className="flex gap-2 mb-5">
          <button onClick={() => setViewingJob(item)} className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 text-slate-800 border border-slate-300 py-2.5 rounded-xl text-xs font-bold transition-colors">
            <Info size={16} /> Details
          </button>
          {item.photo && (
            <button onClick={() => setViewingPhoto(item.photo)} className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 py-2.5 rounded-xl text-xs font-bold transition-colors">
              <ImageIcon size={16} /> Photo
            </button>
          )}
        </div>

        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1.5">
            <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border tracking-wide shadow-sm ${config.badge} border-transparent w-fit`}>{item.id}</span>
            {item.intake_date && (
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <Calendar size={12} /> {item.intake_date}
              </span>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAdmin && <button onClick={() => startEdit(item)} className="text-slate-500 hover:text-slate-800 hover:bg-slate-200 p-2 rounded-lg transition-colors"><Edit2 size={14} /></button>}
            {isAdmin && <button onClick={() => deleteItem(item.id)} className="text-slate-500 hover:text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={14} /></button>}
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-lg m-0 leading-tight mb-4">{item.name}</h3>
        
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2 bg-slate-200 px-3 py-2 rounded-lg border border-slate-300 w-full overflow-hidden">
            <User size={14} className="text-slate-500 flex-none"/> 
            <span className="text-xs font-bold text-slate-700 truncate">{getClientName(item.owner)}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 w-full ${!item.assigned_engineer ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
            <Wrench size={14} className={!item.assigned_engineer ? 'text-amber-500' : 'text-slate-500'}/> 
            <span className="text-xs font-bold truncate">Eng: {getEngineerName(item.assigned_engineer)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-5 border-t border-slate-300 flex flex-col gap-4">
        
        {activeStage === STAGES[1] && (
          <div className="flex flex-col gap-3">
            {canInspect ? (
              <>
                <div className="relative">
                  <AlertCircle size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input type="text" placeholder="Detected problem..." defaultValue={item.problem || ''} onBlur={(e) => updateItemData(item.id, { problem: e.target.value })} className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 bg-white rounded-xl shadow-sm" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">$</span>
                  <input type="text" placeholder="Estimated Price..." defaultValue={item.price || ''} onBlur={(e) => updateItemData(item.id, { price: e.target.value })} className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 bg-white rounded-xl shadow-sm" />
                </div>
              </>
            ) : (
              <div className="text-xs p-4 bg-slate-200 rounded-xl border border-slate-300">
                <p className="text-slate-700"><span className="font-bold">Problem:</span> {item.problem || 'Pending...'}</p>
                <p className="text-slate-700 mt-2"><span className="font-bold">Price:</span> {item.price || 'Pending...'}</p>
              </div>
            )}
          </div>
        )}

        {activeStage === STAGES[2] && (
          <div className="flex flex-col gap-3">
            {isAdmin ? (
              <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-slate-600" />
                    <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Quotation Form</span>
                  </div>
                  {item.quotation && (
                    <button onClick={() => { setQuotationModalJob(item); }} className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md"><Edit2 size={14} /></button>
                  )}
                </div>
                {!item.quotation ? (
                  <button onClick={() => { setQuotationModalJob(item); }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg text-xs font-bold border border-slate-300 flex items-center justify-center gap-2 border-dashed"><Plus size={16} /> Create Quotation</button>
                ) : (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-inner italic">"{item.quotation}"</div>
                )}
                <select onChange={(e) => handleClientDecision(item, e.target.value)} value="" className="w-full text-xs font-bold bg-slate-800 text-white p-3 rounded-lg border border-slate-900 mt-2">
                  <option value="" disabled>Decision...</option>
                  <option value="proceed">1. Accept Offer & Proceed Repair</option>
                  <option value="parts">2. Accept (Wait for Spare Part)</option>
                  <option value="cancel">3. Cancel & Return Device</option>
                </select>
              </div>
            ) : (
              <div className="bg-slate-200 p-4 rounded-xl border border-slate-300 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Quotation Status</span>
                <span className="text-sm font-extrabold mt-1">{item.client_decision || 'Pending Customer Reply...'}</span>
              </div>
            )}
          </div>
        )}

        {activeStage === STAGES[3] && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-200 p-3.5 rounded-xl border border-slate-300">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Repair Status</span>
              {canStatus ? (
                <select value={item.repair_status || 'In Progress'} onChange={(e) => handleStatusChange(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-500/20 outline-none cursor-pointer">
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting for spare part">Waiting for spare part</option>
                  <option value="Done">Done</option>
                </select>
              ) : (
                <span className="font-extrabold text-slate-800 text-base">{item.repair_status || 'In Progress'}</span>
              )}
            </div>

            {/* IN PROGRESS: INVENTORY DEDUCTION SYSTEM */}
            {canStatus && (item.repair_status === 'In Progress' || !item.repair_status) && (
              <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm animate-in fade-in">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3 flex items-center gap-1.5"><Wrench size={12}/> Request Spare Part</span>
                
                <div className="flex flex-col gap-2">
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input type="text" placeholder="Enter Part No..." value={partSearch} onChange={(e) => setPartSearch(e.target.value)} className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 bg-slate-50 rounded-lg focus:ring-2 focus:ring-slate-500/20 outline-none transition-all" />
                  </div>
                  <button onClick={checkPart} disabled={!partSearch.trim()} className="w-full bg-slate-800 disabled:bg-slate-400 text-white px-3 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-900 transition-colors flex justify-center items-center gap-2">
                    <Search size={14} /> Check Inventory
                  </button>
                </div>
                
                {partMsg.text && (
                  <p className={`text-xs font-bold mt-3 text-center ${partMsg.type === 'error' ? 'text-red-500' : partMsg.type === 'success' ? 'text-emerald-600' : 'text-slate-500'}`}>{partMsg.text}</p>
                )}

                {partData && partData.quantity > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <input type="number" min="1" max={partData.quantity} value={qtyNeeded} onChange={(e) => setQtyNeeded(parseInt(e.target.value))} className="w-16 text-sm p-2 border border-slate-300 bg-slate-50 rounded-lg outline-none font-bold text-center" />
                    <button onClick={consumePart} className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300 px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"><PackageMinus size={16}/> Deduct Part</button>
                  </div>
                )}
              </div>
            )}

            {/* WAITING FOR SPARE PART: CHECK AVAILABILITY SYSTEM */}
            {canStatus && item.repair_status === 'Waiting for spare part' && (
              <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm animate-in fade-in">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-3 flex items-center gap-1.5"><Search size={12}/> Check Part Availability</span>
                
                <div className="flex flex-col gap-2">
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-3 top-2.5 text-amber-400/70" />
                    <input type="text" placeholder="Enter Part No..." value={partSearch} onChange={(e) => setPartSearch(e.target.value)} className="w-full text-sm pl-9 pr-3 py-2 border border-amber-200 bg-amber-50/50 rounded-lg focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-amber-700/40" />
                  </div>
                  <button onClick={checkPart} disabled={!partSearch.trim()} className="w-full bg-amber-100 disabled:opacity-50 hover:bg-amber-200 text-amber-800 border border-amber-300 px-3 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex justify-center items-center gap-2">
                    <Search size={14} /> Check Status
                  </button>
                </div>
                
                {partMsg.text && (
                  <p className={`text-xs font-bold mt-3 text-center ${partMsg.type === 'error' ? 'text-red-500' : partMsg.type === 'success' ? 'text-emerald-600' : 'text-slate-500'}`}>{partMsg.text}</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeStage === STAGES[4] && (
          <div className="flex flex-col gap-1.5 bg-slate-200 p-3.5 rounded-xl border border-slate-300">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Status</span>
            {canOutbound ? (
              <select value={item.outbound_status || 'In Inventory'} onChange={(e) => updateItemData(item.id, { outbound_status: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm font-bold text-slate-800">
                <option value="In Inventory">In Inventory</option>
                <option value="Waiting for customer pick up">Waiting for customer pick up</option>
                <option value="Delivered">Delivered</option>
              </select>
            ) : (
              <span className="font-extrabold text-slate-800 text-base">{item.outbound_status || 'In Inventory'}</span>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-2 pt-4 border-t border-slate-200">
          <button onClick={() => moveItemBackward(item.id, activeStage)} disabled={stageIndex === 0} className={`flex-[0.5] py-3 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${stageIndex === 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}><ArrowLeft size={18} /></button>
          <button onClick={() => moveItemForward(item.id, activeStage)} disabled={stageIndex === STAGES.length - 1} className={`flex-[2] py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${stageIndex === STAGES.length - 1 ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-slate-100 hover:bg-slate-900 shadow-sm'}`}>
            {stageIndex === STAGES.length - 1 ? <><CheckCircle2 size={18} /> Complete</> : <>Advance <ArrowRight size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}