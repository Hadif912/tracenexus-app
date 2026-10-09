import { useState } from 'react';
import { User, Phone, Edit2, Trash2, Plus, Save, Lock } from 'lucide-react';

export default function ClientManagement({ usersDB, setUsersDB, items, setItems, isAdmin }) {
  const [formData, setFormData] = useState({ phone: '', clientName: '', password: 'Abc@123' });
  const [editingPhone, setEditingPhone] = useState(null);

  const customers = usersDB.filter(u => u.role === 'customer');

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.phone.trim()) return alert("Phone number is required.");

    if (editingPhone) {
      if (formData.phone !== editingPhone && usersDB.some(u => u.username === formData.phone)) {
        return alert("This new phone number is already registered to another account.");
      }

      setUsersDB(usersDB.map(u => u.username === editingPhone ? {
        ...u, username: formData.phone, clientName: formData.clientName, password: formData.password || u.password
      } : u));

      if (formData.phone !== editingPhone) {
         setItems(items.map(item => item.owner === editingPhone ? { ...item, owner: formData.phone } : item));
      }
      
      setEditingPhone(null);
    } else {
      if (usersDB.some(u => u.username === formData.phone)) return alert("Phone number is already registered.");
      setUsersDB([...usersDB, { username: formData.phone, password: formData.password || 'Abc@123', role: 'customer', clientName: formData.clientName }]);
    }
    setFormData({ phone: '', clientName: '', password: 'Abc@123' });
  };

  const startEdit = (client) => {
    setEditingPhone(client.username);
    setFormData({ phone: client.username, clientName: client.clientName || '', password: client.password });
  };

  const cancelEdit = () => {
    setEditingPhone(null);
    setFormData({ phone: '', clientName: '', password: 'Abc@123' });
  };

  const deleteClient = (phone) => {
    if (!isAdmin) return alert("Only Administrators can delete clients.");
    if (window.confirm(`Are you sure you want to delete the client account for ${phone}?`)) {
      setUsersDB(usersDB.filter(u => u.username !== phone));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 p-6">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          {editingPhone ? <Edit2 size={18} className="text-blue-500"/> : <Plus size={18} className="text-blue-600"/>} 
          {editingPhone ? 'Edit Client Account' : 'Register New Client'}
        </h3>
        
        <form onSubmit={handleSave} className="flex flex-col gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-slate-400" />
              <input type="text" placeholder="Client Name" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm" />
            </div>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-3.5 text-slate-400" />
              <input type="text" placeholder="Phone Number (Username)" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm" required/>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-3.5 text-slate-400" />
              <input type="text" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm" required/>
            </div>
          </div>

          <div className="flex gap-3 mt-2 justify-end">
            {editingPhone && <button type="button" onClick={cancelEdit} className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-6 py-2.5 rounded-xl font-semibold text-sm">Cancel</button>}
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-md shadow-blue-200/50 text-sm">
              {editingPhone ? <Save size={16} /> : <Plus size={18} />}
              {editingPhone ? 'Save Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-200">
              <th className="p-5 font-bold text-slate-400 text-xs uppercase tracking-wider">Client Name</th>
              <th className="p-5 font-bold text-slate-400 text-xs uppercase tracking-wider">Phone / Username</th>
              <th className="p-5 font-bold text-slate-400 text-xs uppercase tracking-wider">Password</th>
              <th className="p-5 font-bold text-slate-400 text-xs uppercase tracking-wider w-32 text-right">Manage</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? customers.map((client, idx) => (
              <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${editingPhone === client.username ? 'bg-blue-50/50' : ''}`}>
                <td className="p-5 text-sm font-bold text-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {client.clientName ? client.clientName.charAt(0).toUpperCase() : <User size={14}/>}
                    </div>
                    {client.clientName || <span className="text-slate-400 italic">Unspecified</span>}
                  </div>
                </td>
                <td className="p-5 text-sm font-mono font-semibold text-slate-600">{client.username}</td>
                <td className="p-5 text-sm font-mono text-slate-500">
                  {client.password === 'Abc@123' ? <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border border-slate-200">Pending Update</span> : <span className="opacity-50">••••••••</span>}
                </td>
                <td className="p-5 text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(client)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="Edit Client"><Edit2 size={16} /></button>
                    <button onClick={() => deleteClient(client.username)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Delete Client"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan="4" className="p-12 text-center text-slate-400 font-medium">No clients registered in the system.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}