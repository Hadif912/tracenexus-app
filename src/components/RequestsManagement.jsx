import { CheckCircle2, XCircle, Clock, User, Phone, Package, Tag, AlignLeft } from 'lucide-react';

export default function RequestsManagement({ requests, setRequests, items, setItems, usersDB, setUsersDB, supabase }) {
  
  const handleAccept = async (req) => {
    if (!usersDB.some(u => u.username === req.phone)) {
      const newUser = { username: req.phone, password: req.password || 'Abc@123', role: 'customer', client_name: req.client_name || 'Unknown' };
      await supabase.from('users').insert([newUser]);
      setUsersDB([...usersDB, newUser]);
    }

    const newItemId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newItem = {
      id: newItemId, name: req.item_name, brand: req.item_brand, description: req.description, owner: req.phone, stage: 'Receiving',
      client_decision: 'Pending', repair_status: 'In Progress', outbound_status: 'In Inventory'
    };
    
    await supabase.from('items').insert([newItem]);
    const { data: log1 } = await supabase.from('history_logs').insert([{ item_id: newItemId, stage: 'Request Accepted' }]).select().single();
    const { data: log2 } = await supabase.from('history_logs').insert([{ item_id: newItemId, stage: 'Receiving' }]).select().single();
    await supabase.from('repair_requests').delete().eq('id', req.id);

    setItems([...items, { ...newItem, history: [log1, log2] }]);
    setRequests(requests.filter(r => r.id !== req.id));
  };

  const handleDeny = async (reqId) => {
    if (window.confirm("Reject and delete this request?")) {
      await supabase.from('repair_requests').delete().eq('id', reqId);
      setRequests(requests.filter(r => r.id !== reqId));
    }
  };

  return (
    <div className="bg-slate-100 rounded-2xl shadow-sm border border-slate-300 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3"><Clock className="text-slate-600" size={24} /> Pending Requests</h2>
        <span className="bg-slate-300 text-slate-800 font-bold px-3 py-1 rounded-full text-sm">{requests.length}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.length > 0 ? requests.map(req => (
            <div key={req.id} className="border border-slate-300 rounded-2xl p-6 bg-slate-50 flex flex-col justify-between hover:border-slate-400">
              <div>
                <div className="flex justify-between items-start mb-4 border-b border-slate-300 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Package size={18} className="text-slate-600"/> {req.item_name}</h3>
                    {req.item_brand && <p className="text-xs font-bold text-slate-500 uppercase mt-1"><Tag size={12} className="inline mr-1"/>{req.item_brand}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Client Name</p><p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"><User size={14}/> {req.client_name}</p></div>
                  <div><p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Contact Phone</p><p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"><Phone size={14}/> {req.phone}</p></div>
                </div>
                <div className="bg-slate-200 p-3 rounded-lg border border-slate-300 mb-6"><p className="text-[10px] uppercase font-bold text-slate-600 mb-1 flex items-center gap-1"><AlignLeft size={12}/> Issue Description</p><p className="text-sm text-slate-800">{req.description || 'No description provided.'}</p></div>
              </div>
              <div className="flex gap-3 mt-auto">
                <button onClick={() => handleDeny(req.id)} className="flex-1 bg-slate-100 hover:bg-red-100 border border-slate-300 hover:border-red-300 text-red-600 py-2.5 rounded-xl font-bold text-sm transition-colors"><XCircle size={16} className="inline mr-1" /> Deny</button>
                <button onClick={() => handleAccept(req)} className="flex-[2] bg-slate-800 hover:bg-slate-900 text-slate-100 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors"><CheckCircle2 size={16} className="inline mr-1" /> Accept & Create Job</button>
              </div>
            </div>
          )) : <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50"><p className="text-slate-500 font-semibold text-lg">Inbox Zero</p></div>}
      </div>
    </div>
  );
}