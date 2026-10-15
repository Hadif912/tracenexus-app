import { useState, useEffect } from 'react';
import { STAGES, STAGE_CONFIG } from '../constants';
import { Layers, ArrowDownUp, ChevronDown, ChevronUp, CheckCircle2, Calendar, User } from 'lucide-react';
import AvailableJobs from './AvailableJobs';
import KanbanCard from './KanbanCard';
import KanbanModals from './KanbanModals';

export default function KanbanBoard({ items, setItems, isAdmin, isInternal, startEdit, deleteItem, getClientName, updateItemData, supabase, currentUser, usersDB }) {
  const [viewingPhoto, setViewingPhoto] = useState(null); 
  const [activeStage, setActiveStage] = useState(STAGES[0]);
  
  const [viewingJob, setViewingJob] = useState(null);
  
  const [quotationModalJob, setQuotationModalJob] = useState(null);
  const [tempQuotation, setTempQuotation] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date'); 
  const [groupBy, setGroupBy] = useState('none'); 
  const [expandedGroup, setExpandedGroup] = useState(null); 
  const jobsPerPage = 10;

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

  return (
    <div className="flex flex-col gap-6 h-full w-full">
      
      {!isAdmin && isInternal && (
        <AvailableJobs 
          unassignedJobs={unassignedJobs} 
          jobsPerPage={jobsPerPage} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          totalPages={totalPages} 
          currentJobs={currentJobs} 
          setViewingJob={setViewingJob} 
        />
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
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{!isAdmin ? 'My Kanban Board: ' : ''}{activeStage} Process</h2>
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
                            {groupedItems[groupKey].map(item => (
                              <KanbanCard 
                                key={item.id} item={item} config={config} activeStage={activeStage} stageIndex={stageIndex} 
                                isAdmin={isAdmin} currentUser={currentUser} getClientName={getClientName} getEngineerName={getEngineerName} 
                                startEdit={startEdit} deleteItem={deleteItem} updateItemData={updateItemData} setViewingJob={setViewingJob} 
                                setViewingPhoto={setViewingPhoto} setQuotationModalJob={setQuotationModalJob} handleClientDecision={handleClientDecision} 
                                moveItemBackward={moveItemBackward} moveItemForward={moveItemForward}
                              />
                            ))}
                         </div>
                      )}
                   </div>
                ))}
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8`}>
                {stageItems.map(item => (
                  <KanbanCard 
                    key={item.id} item={item} config={config} activeStage={activeStage} stageIndex={stageIndex} 
                    isAdmin={isAdmin} currentUser={currentUser} getClientName={getClientName} getEngineerName={getEngineerName} 
                    startEdit={startEdit} deleteItem={deleteItem} updateItemData={updateItemData} setViewingJob={setViewingJob} 
                    setViewingPhoto={setViewingPhoto} setQuotationModalJob={setQuotationModalJob} handleClientDecision={handleClientDecision} 
                    moveItemBackward={moveItemBackward} moveItemForward={moveItemForward}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-slate-100/50 min-h-[40vh]">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${config.bg} ${config.text} border ${config.border} opacity-50`}>
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-700 mb-2">Kanban Board is Empty</h3>
              <p className="text-slate-500 font-medium max-w-md">
                {!isAdmin ? "You have no assigned items in this stage. Check the Available Jobs above to claim new work!" : `There are currently no items in the ${activeStage} stage.`}
              </p>
            </div>
          )}
        </div>
      </div>

      <KanbanModals 
        viewingJob={viewingJob} setViewingJob={setViewingJob} getClientName={getClientName} handleTakeJob={handleTakeJob}
        quotationModalJob={quotationModalJob} setQuotationModalJob={setQuotationModalJob} tempQuotation={tempQuotation} 
        setTempQuotation={setTempQuotation} saveQuotation={saveQuotation} viewingPhoto={viewingPhoto} setViewingPhoto={setViewingPhoto}
      />
    </div>
  );
}