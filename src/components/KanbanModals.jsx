import { X, Hash, Calendar, User, Briefcase, Clock, Activity, ArrowRight } from 'lucide-react';

export default function KanbanModals({
  viewingJob, setViewingJob, getClientName, handleTakeJob,
  quotationModalJob, setQuotationModalJob, tempQuotation, setTempQuotation, saveQuotation,
  viewingPhoto, setViewingPhoto
}) {

  // Helper function to format duration between two ISO timestamps
  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(); // If no end time, use current time
    const diffMs = end - start;
    
    // Convert to minutes
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "< 1m";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
    
    const days = Math.floor(diffMins / 1440);
    const hours = Math.floor((diffMins % 1440) / 60);
    return `${days}d ${hours}h`;
  };

  return (
    <>
      {/* Engineer Job Details Modal */}
      {viewingJob && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setViewingJob(null)}>
          <div className="bg-white p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4 flex-none">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Job Details</h2>
                <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded mt-1 inline-block border border-slate-200">{viewingJob.id}</span>
              </div>
              <button onClick={() => setViewingJob(null)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors"><X size={20}/></button>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="overflow-y-auto custom-scrollbar pr-2 mb-6 flex-1 space-y-6">
              
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serial / Service No</span>
                    <p className="font-semibold text-slate-700 text-sm mt-0.5 flex items-center gap-1.5"><Hash size={14} className="text-slate-400"/> {viewingJob.serial_number}</p>
                  </div>
                )}
                {viewingJob.intake_date && (
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intake Date</span>
                    <p className="font-semibold text-slate-700 text-sm mt-0.5 flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> {viewingJob.intake_date}</p>
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
                  <p className="text-sm text-slate-600 leading-relaxed italic">"{viewingJob.description || 'No specific description provided by admin.'}"</p>
                </div>
              </div>

              {/* NEW: PROCESS EFFICIENCY TIMELINE */}
              {viewingJob.history && viewingJob.history.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={16} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Process Efficiency Timeline</span>
                  </div>
                  
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
                    <div className="space-y-4">
                      {viewingJob.history.map((log, index) => {
                        const isLast = index === viewingJob.history.length - 1;
                        const nextLog = viewingJob.history[index + 1];
                        
                        // Calculate duration: Next log's created_at, or current time if it's the active stage
                        const endTime = nextLog ? nextLog.created_at : (viewingJob.stage === 'Outbound' && viewingJob.outbound_status === 'Delivered' ? null : new Date());
                        const durationStr = endTime ? formatDuration(log.created_at, endTime) : 'Done';
                        
                        return (
                          <div key={log.id || index} className="flex gap-4 relative">
                            {/* Vertical Line Connector */}
                            {!isLast && (
                              <div className="absolute left-2.5 top-6 bottom-[-24px] w-[2px] bg-slate-200"></div>
                            )}
                            
                            {/* Circle Node */}
                            <div className={`w-5 h-5 rounded-full flex-none z-10 flex items-center justify-center mt-0.5 ${isLast ? 'bg-blue-500 shadow-md shadow-blue-500/30' : 'bg-slate-300'}`}>
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            
                            {/* Details */}
                            <div className="flex-1 pb-1">
                              <div className="flex justify-between items-start gap-2">
                                <p className={`text-sm font-extrabold ${isLast ? 'text-blue-700' : 'text-slate-700'}`}>{log.stage}</p>
                                <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border flex items-center gap-1 flex-none ${isLast ? 'text-blue-700 bg-blue-100 border-blue-200' : 'text-slate-600 bg-white border-slate-300 shadow-sm'}`}>
                                  <Clock size={10} /> {durationStr}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">
                                {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Action */}
            {!viewingJob.assigned_engineer && (
              <div className="pt-4 border-t border-slate-100 flex-none">
                <button onClick={() => handleTakeJob(viewingJob)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2 transition-all transform hover:scale-[1.02]">
                  <Briefcase size={18} /> Take This Job
                </button>
              </div>
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
              <button onClick={() => setQuotationModalJob(null)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors"><X size={20}/></button>
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

            <button onClick={saveQuotation} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all transform hover:scale-[1.02]">
              Save Quotation
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Photo Modal Overlay */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm" onClick={() => setViewingPhoto(null)}>
          <div className="relative bg-slate-100 p-2 rounded-2xl max-w-4xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingPhoto(null)} className="absolute -top-5 -right-5 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 rounded-full p-3 shadow-xl border border-slate-300 transition-colors z-10"><X size={24} /></button>
            <img src={viewingPhoto} alt="Device Full View" className="w-full h-auto rounded-xl object-contain max-h-[85vh] bg-white border border-slate-200" />
          </div>
        </div>
      )}
    </>
  );
}