import { CheckCircle2, XCircle, Clock, User, Phone, Package, Tag, AlignLeft } from 'lucide-react';

export default function RequestsManagement({ requests, setRequests, items, setItems, usersDB, setUsersDB }) {
  
  const handleAccept = (req) => {
    // 1. Auto-register client if they don't exist (Fallback if it didn't trigger during submission)
    if (!usersDB.some(u => u.username === req.phone)) {
      setUsersDB([...usersDB, { 
        username: req.phone, 
        password: req.password || 'Abc@123', // NEW: Uses the password submitted by the user
        role: 'customer', 
        clientName: req.clientName || 'Unknown' 
      }]);
      alert(`System Note: New client account auto-created for phone ${req.phone}`);
    }

    // 2. Add item to pipeline (Receiving stage)
    const newItem = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: req.itemName,
      brand: req.itemBrand,
      description: req.description,
      owner: req.phone,
      stage: 'Receiving',
      problem: '', price: '', clientDecision: 'Pending', repairStatus: 'In Progress', outboundStatus: 'In Inventory',
      history: [
        { stage: 'Request Accepted', timestamp: new Date().toLocaleString(), iso: new Date().toISOString() },
        { stage: 'Receiving', timestamp: new Date().toLocaleString(), iso: new Date().toISOString() }
      ]
    };
    setItems([...items, newItem]);

    // 3. Remove from pending requests
    setRequests(requests.filter(r => r.id !== req.id));
  };

  const handleDeny = (reqId) => {
    if (window.confirm("Are you sure you want to reject and delete this request?")) {
      setRequests(requests.filter(r => r.id !== reqId));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
          <Clock className="text-blue-600" size={24} /> Pending Repair Requests
        </h2>
        <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">
          {requests.length} Total
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.length > 0 ? (
          requests.map(req => (
            <div key={req.id} className="border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <Package size={18} className="text-blue-500"/> {req.itemName}
                    </h3>
                    {req.itemBrand && <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1"><Tag size={12} className="inline mr-1"/>{req.itemBrand}</p>}
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200">
                    PENDING
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Client Name</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><User size={14} className="text-slate-400"/> {req.clientName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Contact Phone</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/> {req.phone}</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 mb-6">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><AlignLeft size={12}/> Issue Description</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{req.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                <button onClick={() => handleDeny(req.id)} className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                  <XCircle size={16} /> Deny
                </button>
                <button onClick={() => handleAccept(req)} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200/50">
                  <CheckCircle2 size={16} /> Accept & Create Job
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
            <CheckCircle2 className="mx-auto text-slate-300 mb-4" size={36} />
            <p className="text-slate-500 font-semibold text-lg">Inbox Zero</p>
            <p className="text-slate-400 text-sm mt-1">There are no pending requests right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}