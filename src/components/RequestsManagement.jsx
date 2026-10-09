import { CheckCircle2, XCircle, Clock, User, Phone, Package, Tag, AlignLeft } from 'lucide-react';

export default function RequestsManagement({ requests, setRequests, items, setItems, usersDB, setUsersDB, supabase }) {
  
  const handleAccept = async (req) => {
    // Ensure user is in DB
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
    
    // DB Inserts
    await supabase.from('items').insert([newItem]);
    const { data: log1 } = await supabase.from('history_logs').insert([{ item_id: newItemId, stage: 'Request Accepted' }]).select().single();
    const { data: log2 } = await supabase.from('history_logs').insert([{ item_id: newItemId, stage: 'Receiving' }]).select().single();
    await supabase.from('repair_requests').delete().eq('id', req.id);

    // Update Local UI
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3"><Clock className="text-blue-600" size={24} /> Pending Requests</h2>
        <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-sm">{requests.length}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.length > 0 ? requests.map(req => (
            <div key={req.id} className="border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col justify-between hover:shadow-md">
              <div>
                <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Package size={18} className="text-blue-500"/> {req.item_name}</h3>
                    {req.item_brand && <p className="text-xs font-bold text-slate-500 uppercase mt-1"><Tag size={12} className="inline mr-1"/>{req.item_brand}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Client Name</p><p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><User size={14}/> {req.client_name}</p></div>
                  <div><p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Contact Phone</p><p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Phone size={14}/> {req.phone}</p></div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 mb-6"><p className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><AlignLeft size={12}/> Issue Description</p><p className="text-sm text-slate-600">{req.description || 'No description provided.'}</p></div>
              </div>
              <div className="flex gap-3 mt-auto">
                <button onClick={() => handleDeny(req.id)} className="flex-1 bg-white border border-red-200 text-red-600 py-2.5 rounded-xl font-bold text-sm"><XCircle size={16} className="inline mr-1" /> Deny</button>
                <button onClick={() => handleAccept(req)} className="flex-[2] bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-md"><CheckCircle2 size={16} className="inline mr-1" /> Accept & Create Job</button>
              </div>
            </div>
          )) : <div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl bg-white"><p className="text-slate-500 font-semibold text-lg">Inbox Zero</p></div>}
      </div>
    </div>
  );
}