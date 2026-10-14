import { useState, useEffect } from 'react';
import { STAGES, STAGE_CONFIG } from '../constants';
import { Package, Edit2, Trash2, User, ImageIcon, X, ArrowLeft, ArrowRight, CheckCircle2, Wrench, Layers, AlertCircle, Inbox, Briefcase, ChevronLeft, ChevronRight, Info, Hash, Calendar, FileText, ArrowDownUp, ChevronDown, ChevronUp, Plus } from 'lucide-react';

export default function KanbanBoard({ items, setItems, isAdmin, isInternal, startEdit, deleteItem, getClientName, updateItemData, supabase, currentUser, usersDB }) {
  const [viewingPhoto, setViewingPhoto] = useState(null); 
  const [activeStage, setActiveStage] = useState(STAGES[0]);
  
  const [viewingJob, setViewingJob] = useState(null);
  
  // Quotation Modal State
  const [quotationModalJob, setQuotationModalJob] = useState(null);
  const [tempQuotation, setTempQuotation] = useState('');
  
  // Pagination, Sorting & Grouping State
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date'); 
  const [groupBy, setGroupBy] = useState('none'); 
  const [expandedGroup, setExpandedGroup] = useState(null); 
  const jobsPerPage = 10;

  // Reset expanded group when changing stages
  useEffect(() => {
    setExpandedGroup(null);
  }, [activeStage, groupBy]);

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

  const handleTakeJob = async (job) => {
    await updateItemData(job.id, { assigned_engineer: currentUser });
    setViewingJob(null);
    setActiveStage(STAGES[0]); 
  };

  const handleClientDecision = async (item, decisionVal) => {
    if (!decisionVal) return;
    
    const repairStage = STAGES[3]; 
    const outboundStage = STAGES[4]; 

    let updates = {};
    let nextStage = '';

    if (decisionVal === 'proceed') {
      updates = { client_decision: 'Proceed', repair_status: 'In Progress', stage: repairStage };
      nextStage = repairStage;
    } else if (decisionVal === 'parts') {
      updates = { client_decision: 'Proceed (Awaiting Parts)', repair_status: 'Waiting for spare part', stage: repairStage };
      nextStage = repairStage;
    } else if (decisionVal === 'cancel') {
      updates = { client_decision: 'Cancel', outbound_status: 'Waiting for customer pick up', stage: outboundStage };
      nextStage = outboundStage;
    }
    
    if (window.confirm(`Apply this decision? The item will automatically move to the ${nextStage} stage.`)) {
      await supabase.from('items').update(updates).eq('id', item.id);
      const { data: newLog } = await supabase.from('history_logs').insert([{ item_id: item.id, stage: nextStage }]).select().single();
      
      setItems(items.map(i => i.id === item.id ? { 
        ...i, 
        ...updates, 
        history: newLog ? [...(i.history || []), newLog] : (i.history || []) 
      } : i));
    }
  };

  const saveQuotation = async () => {
    if (!quotationModalJob) return;
    await updateItemData(quotationModalJob.id, { quotation: tempQuotation });
    setQuotationModalJob(null);
  };

  const unassignedJobs = items.filter(item => !item.assigned_engineer && item.stage !== STAGES[4] && item.stage !== 'Done');
  const totalPages = Math.max(1, Math.ceil(unassignedJobs.length / jobsPerPage));
  if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  const currentJobs = unassignedJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);

  let stageItems = items.filter(item => {
    if (item.stage !== activeStage) return false;
    if (isAdmin) return true; 
    return item.assigned_engineer === currentUser;
  });

  stageItems = stageItems.sort((a, b) => {
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
  if (groupBy === 'client') {
    stageItems.forEach(item => {
      const cName = getClientName(item.owner);
      if (!groupedItems[cName]) groupedItems[cName] = [];
      groupedItems[cName].push(item);
    });
  } else if (groupBy === 'date') {
    stageItems.forEach(item => {
      const date = item.intake_date || new Date(item.created_at).toISOString().split('T')[0];
      if (!groupedItems[date]) groupedItems[date] = [];
      groupedItems[date].push(item);
    });
  }

  const stageIndex = STAGES.indexOf(activeStage);
  const config = STAGE_CONFIG[activeStage] || { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', badge: 'bg-slate-200 text-slate-800' };

  const renderItemCard = (item) => {
    const isAssignedEng = item.assigned_engineer === currentUser;
    const canInspect = isAdmin || isAssignedEng;
    const canStatus = isAdmin || isAssignedEng;
    const canOutbound = isAdmin;

    return (
      <div key={item.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-300 shadow-sm flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition-all group relative overflow-hidden">
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
              {isAdmin && <button onClick={() => startEdit(item)} className="text-slate-500 hover:text-slate-800 hover:bg-slate-200 p-2 rounded-lg transition-colors" title="Edit Meta"><Edit2 size={14} /></button>}
              {isAdmin && <button onClick={() => deleteItem(item.id)} className="text-slate-500 hover:text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>}
            </div>
          </div>

          <h3 className="font-bold text-slate-900 text-lg m-0 leading-tight mb-4">{item.name}</h3>
          
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-2 bg-slate-200 px-3 py-2 rounded-lg border border-slate-300 w-full overflow-hidden">
              <User size={14} className="text-slate-500 flex-none"/> 
              <span className="text-xs font-bold text-slate-700 truncate">{getClientName(item.owner)}</span>
              {isAdmin && <span className="text-[10px] text-slate-500 ml-auto font-mono flex-none">{item.owner}</span>}
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

          {activeStage === STAGES[2] && (
            <div className="flex flex-col gap-3">
              {isAdmin ? (
                <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col gap-3">
                  
                  {/* TITLE AND EDIT ICON ROW */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-600" />
                      <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Quotation Form</span>
                    </div>
                    {item.quotation && (
                      <button 
                        onClick={() => {
                          setQuotationModalJob(item);
                          setTempQuotation(item.quotation || '');
                        }}
                        className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors" 
                        title="Edit Quotation"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  {/* QUOTATION TEXT OR CREATE BUTTON */}
                  {!item.quotation ? (
                    <button 
                      onClick={() => {
                        setQuotationModalJob(item);
                        setTempQuotation('');
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg text-xs font-bold transition-colors border border-slate-300 flex items-center justify-center gap-2 border-dashed"
                    >
                      <Plus size={16} /> Create Quotation
                    </button>
                  ) : (
                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-inner max-h-24 overflow-y-auto italic">
                      "{item.quotation}"
                    </div>
                  )}
                  
                  {/* DECISION DROPDOWN */}
                  <select 
                    onChange={(e) => handleClientDecision(item, e.target.value)} 
                    value="" 
                    className="w-full text-xs font-bold bg-slate-800 text-white p-3 rounded-lg border border-slate-900 outline-none cursor-pointer mt-2"
                  >
                    <option value="" disabled>Decision...</option>
                    <option value="proceed">1. Accept Offer & Proceed Repair</option>
                    <option value="parts">2. Accept (Wait for Spare Part)</option>
                    <option value="cancel">3. Cancel & Return Device</option>
                  </select>
                </div>
              ) : (
                <div className="bg-slate-200 p-4 rounded-xl border border-slate-300 flex flex-col gap-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 text-center">Quotation Status</span>
                  
                  {item.quotation && (
                    <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-2 max-h-24 overflow-y-auto italic">
                      "{item.quotation}"
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 mb-1">Decision:</span>
                    <span className={`text-sm font-extrabold text-center ${item.client_decision === 'Proceed' || item.client_decision === 'Proceed (Awaiting Parts)' ? 'text-emerald-700' : item.client_decision === 'Cancel' ? 'text-red-600' : 'text-slate-800'}`}>
                      {item.client_decision || 'Pending Customer Reply...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeStage === STAGES[3] && (
            <div className="flex flex-col gap-1.5 bg-slate-200 p-3.5 rounded-xl border border-slate-300">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repair Status</span>
              {canStatus ? (
                <select value={item.repair_status || 'In Progress'} onChange={(e) => updateItemData(item.id, { repair_status: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-500/20 outline-none cursor-pointer">
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting for spare part">Waiting for spare part</option>
                  <option value="Done">Done</option>
                </select>
              ) : (
                <span className="font-extrabold text-slate-800 text-base">{item.repair_status || 'In Progress'}</span>
              )}
              {!canStatus && <p className="text-[10px] text-amber-700 font-bold text-center bg-amber-100 py-1.5 mt-1 rounded-lg border border-amber-300">Read-Only: Engineer or Admin required</p>}
            </div>
          )}

          {activeStage === STAGES[4] && (
            <div className="flex flex-col gap-1.5 bg-slate-200 p-3.5 rounded-xl border border-slate-300">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Status</span>
              {canOutbound ? (
                <select value={item.outbound_status || 'In Inventory'} onChange={(e) => updateItemData(item.id, { outbound_status: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-500/20 outline-none cursor-pointer">
                  <option value="In Inventory">In Inventory</option>
                  <option value="Waiting for customer pick up">Waiting for customer pick up</option>
                  <option value="Delivered">Delivered</option>
                </select>
              ) : (
                <span className="font-extrabold text-slate-800 text-base">{item.outbound_status || 'In Inventory'}</span>
              )}
              {!canOutbound && <p className="text-[10px] text-amber-700 font-bold text-center bg-amber-100 py-1.5 mt-1 rounded-lg border border-amber-300">Only Admins can dispatch items</p>}
            </div>
          )}

          {/* NAVIGATION BUTTONS - Now fully visible on all stages */}
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
  };

  return (
    <div className="flex flex-col gap-6 h-full w-full">
      
      {!isAdmin && isInternal && (
        <div className="w-full bg-slate-200/50 rounded-2xl border border-slate-300 p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Inbox size={20} className="text-slate-500" /> Available Jobs 
              <span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">{unassignedJobs.length}</span>
            </h3>
            
            {unassignedJobs.length > jobsPerPage && (
              <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-lg border border-slate-300 shadow-sm">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  disabled={currentPage === 1}
                  className={`p-1 rounded-md transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-bold text-slate-600 min-w-[60px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  disabled={currentPage === totalPages}
                  className={`p-1 rounded-md transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {unassignedJobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {currentJobs.map(job => (
                <button 
                  key={job.id} 
                  onClick={() => setViewingJob(job)} 
                  className="bg-white p-4 rounded-xl border border-slate-200 text-left hover:border-slate-400 hover:shadow-md transition-all group flex flex-col h-32"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">{job.id}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{job.name}</div>
                  <div className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed flex-1">
                    {job.description || 'No description provided.'}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-white/50 rounded-xl border border-dashed border-slate-300">
              <CheckCircle2 size={28} className="text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-slate-500 text-sm font-medium">No available jobs at the moment.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col h-full min-w-0 w-full">
        <div className="bg-slate-200/70 p-1.5 rounded-xl mb-6 flex overflow-x-auto custom-scrollbar border border-slate-300 shadow-sm flex-none">
          {STAGES.map((stage) => {
            const count = items.filter(i => i.stage === stage && (isAdmin || i.assigned_engineer === currentUser)).length;
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

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 px-2 flex-none">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${config.bg} ${config.text} border ${config.border}`}>
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{!isAdmin ? 'My Pipeline: ' : ''}{activeStage} Process</h2>
              <p className="text-sm font-medium text-slate-500">Currently managing {stageItems.length} active item{stageItems.length !== 1 && 's'} in this queue.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-200/80 px-3 py-2 rounded-xl border border-slate-300 shadow-sm">
              <ArrowDownUp size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-600">Sort:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="text-sm border-none bg-transparent font-extrabold text-slate-800 outline-none cursor-pointer p-0 pr-4"
              >
                <option value="date">Date (Newest)</option>
                <option value="client">Client Name (A-Z)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-200/80 px-3 py-2 rounded-xl border border-slate-300 shadow-sm">
              <Layers size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-600">Group:</span>
              <select 
                value={groupBy} 
                onChange={(e) => { setGroupBy(e.target.value); setExpandedGroup(null); }} 
                className="text-sm border-none bg-transparent font-extrabold text-slate-800 outline-none cursor-pointer p-0 pr-4"
              >
                <option value="none">None</option>
                <option value="client">Client Name</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[50vh]">
          {stageItems.length > 0 ? (
            groupBy !== 'none' ? (
              <div className="flex flex-col gap-4 pb-8">
                {Object.keys(groupedItems).sort((a, b) => groupBy === 'date' ? new Date(b) - new Date(a) : a.localeCompare(b)).map(groupKey => (
                   <div key={groupKey} className="bg-slate-50 rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
                      <button 
                          onClick={() => setExpandedGroup(expandedGroup === groupKey ? null : groupKey)} 
                          className="w-full px-6 py-4 flex justify-between items-center bg-slate-200 hover:bg-slate-300 transition-colors border-b border-slate-300"
                      >
                         <div className="flex items-center gap-3">
                            {groupBy === 'client' ? <User size={18} className="text-slate-600"/> : <Calendar size={18} className="text-slate-600"/>}
                            <span className="font-extrabold text-slate-800 text-lg">{groupKey}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">{groupedItems[groupKey].length} Item{groupedItems[groupKey].length !== 1 ? 's' : ''}</span>
                            {expandedGroup === groupKey ? <ChevronUp size={20} className="text-slate-500"/> : <ChevronDown size={20} className="text-slate-500"/>}
                         </div>
                      </button>
                      
                      {expandedGroup === groupKey && (
                         <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-slate-100/50">
                            {groupedItems[groupKey].map(item => renderItemCard(item))}
                         </div>
                      )}
                   </div>
                ))}
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8`}>
                {stageItems.map(item => renderItemCard(item))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-slate-100/50 min-h-[40vh]">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${config.bg} ${config.text} border ${config.border} opacity-50`}>
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-700 mb-2">Pipeline is Empty</h3>
              <p className="text-slate-500 font-medium max-w-md">
                {!isAdmin ? "You have no assigned items in this stage. Check the Available Jobs above to claim new work!" : `There are currently no items in the ${activeStage} stage.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Engineer Job Details Modal */}
      {viewingJob && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setViewingJob(null)}>
          <div className="bg-white p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Job Details</h2>
                <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded mt-1 inline-block border border-slate-200">{viewingJob.id}</span>
              </div>
              <button onClick={() => setViewingJob(null)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            <div className="space-y-5 mb-8">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Device Name</span>
                <p className="text-lg font-bold text-slate-800 leading-tight mt-0.5">{viewingJob.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {viewingJob.brand && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brand</span>
                    <p className="font-semibold text-slate-700 text-sm mt-0.5">{viewingJob.brand}</p>
                  </div>
                )}
                
                {viewingJob.serial_number && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serial / Service Number</span>
                    <p className="font-semibold text-slate-700 text-sm mt-0.5 flex items-center gap-1.5">
                      <Hash size={14} className="text-slate-400"/> {viewingJob.serial_number}
                    </p>
                  </div>
                )}

                {viewingJob.intake_date && (
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intake Date</span>
                    <p className="font-semibold text-slate-700 text-sm mt-0.5 flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400"/> {viewingJob.intake_date}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Name</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><User size={12} className="text-slate-500"/></div>
                  <p className="font-semibold text-slate-700 text-sm">{getClientName(viewingJob.owner)}</p>
                </div>
              </div>
              
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Description</span>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-1.5 shadow-inner">
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "{viewingJob.description || 'No specific description provided by admin.'}"
                  </p>
                </div>
              </div>
            </div>

            {!viewingJob.assigned_engineer && (
              <button 
                onClick={() => handleTakeJob(viewingJob)} 
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2 transition-all transform hover:scale-[1.02]"
              >
                <Briefcase size={18} /> Take This Job
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quotation Creation/Edit Modal */}
      {quotationModalJob && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setQuotationModalJob(null)}>
          <div className="bg-white p-6 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Professional Quotation</h2>
                <p className="text-xs font-medium text-slate-500 mt-1">For {quotationModalJob.name} <span className="font-mono bg-slate-100 border border-slate-200 px-1 py-0.5 rounded">{quotationModalJob.id}</span></p>
              </div>
              <button onClick={() => setQuotationModalJob(null)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors">
                <X size={20}/>
              </button>
            </div>

            <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Total</span>
              <span className="font-extrabold text-emerald-700 text-lg">{quotationModalJob.price || 'Not Set'}</span>
            </div>

            <div className="mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Quotation Details & Breakdown</label>
              <textarea 
                placeholder="Enter professional quotation breakdown & details here..."
                value={tempQuotation}
                onChange={(e) => setTempQuotation(e.target.value)}
                className="w-full text-sm p-4 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-slate-500/20 outline-none shadow-inner min-h-[160px]"
              />
            </div>

            <button 
              onClick={saveQuotation}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all transform hover:scale-[1.02]"
            >
              Save Quotation
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Photo Modal Overlay */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm" onClick={() => setViewingPhoto(null)}>
          <div className="relative bg-slate-100 p-2 rounded-2xl max-w-4xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingPhoto(null)} className="absolute -top-5 -right-5 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 rounded-full p-3 shadow-xl border border-slate-300 transition-colors z-10">
              <X size={24} />
            </button>
            <img src={viewingPhoto} alt="Device Full View" className="w-full h-auto rounded-xl object-contain max-h-[85vh] bg-white border border-slate-200" />
          </div>
        </div>
      )}
    </div>
  );
}