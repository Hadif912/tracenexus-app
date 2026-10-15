import { Inbox, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function AvailableJobs({ unassignedJobs, jobsPerPage, currentPage, setCurrentPage, totalPages, currentJobs, setViewingJob }) {
  return (
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
  );
}