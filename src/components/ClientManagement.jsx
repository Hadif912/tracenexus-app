import { useState } from 'react';
import { User, Phone, Edit2, Trash2, Plus, Save, Lock } from 'lucide-react';

export default function ClientManagement({ usersDB, setUsersDB, items, setItems, isAdmin, supabase }) {
  const [formData, setFormData] = useState({ phone: '', clientName: '', password: 'Abc@123' });
  const [editingPhone, setEditingPhone] = useState(null);
  const customers = usersDB.filter(u => u.role === 'customer');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.phone.trim()) return;

    if (editingPhone) {
      // Update User DB
      await supabase.from('users').update({ username: formData.phone, client_name: formData.clientName, password: formData.password || 'Abc@123' }).eq('username', editingPhone);
      setUsersDB(usersDB.map(u => u.username === editingPhone ? { ...u, username: formData.phone, client_name: formData.clientName, password: formData.password || u.password } : u));
      
      // Update cascade on items if phone changed
      if (formData.phone !== editingPhone) {
         await supabase.from('items').update({ owner: formData.phone }).eq('owner', editingPhone);
         setItems(items.map(item => item.owner === editingPhone ? { ...item, owner: formData.phone } : item));
      }
      setEditingPhone(null);
    } else {
      if (usersDB.some(u => u.username === formData.phone)) return alert("Phone number is already registered.");
      const newUser = { username: formData.phone, password: formData.password || 'Abc@123', role: 'customer', client_name: formData.clientName };
      await supabase.from('users').insert([newUser]);
      setUsersDB([...usersDB, newUser]);
    }
    setFormData({ phone: '', clientName: '', password: 'Abc@123' });
  };

  const startEdit = (client) => {
    setEditingPhone(client.username);
    setFormData({ phone: client.username, clientName: client.client_name || '', password: client.password });
  };

  const deleteClient = async (phone) => {
    if (!isAdmin) return;
    if (window.confirm(`Delete client ${phone}?`)) {
      await supabase.from('users').delete().eq('username', phone);
      setUsersDB(usersDB.filter(u => u.username !== phone));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="bg-slate-50 border-b border-slate-200 p-6">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">{editingPhone ? 'Edit Client Account' : 'Register New Client'}</h3>
        <form onSubmit={handleSave} className="flex flex-col gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative"><User size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Client Name" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm" /></div>
            <div className="relative"><Phone size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm" required/></div>
            <div className="relative"><Lock size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm" required/></div>
          </div>
          <div className="flex gap-3 mt-2 justify-end">
            {editingPhone && <button type="button" onClick={() => { setEditingPhone(null); setFormData({ phone: '', clientName: '', password: 'Abc@123' }); }} className="bg-white hover:bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-semibold text-sm">Cancel</button>}
            <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm">{editingPhone ? 'Save Client' : 'Add Client'}</button>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-200">
              <th className="p-5 font-bold text-slate-400 text-xs uppercase">Client Name</th>
              <th className="p-5 font-bold text-slate-400 text-xs uppercase">Phone</th>
              <th className="p-5 font-bold text-slate-400 text-xs uppercase">Password</th>
              <th className="p-5 font-bold text-slate-400 text-xs uppercase text-right">Manage</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((client, idx) => (
              <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 ${editingPhone === client.username ? 'bg-blue-50/50' : ''}`}>
                <td className="p-5 text-sm font-bold text-slate-700">{client.client_name || 'Unspecified'}</td>
                <td className="p-5 text-sm font-mono font-semibold text-slate-600">{client.username}</td>
                <td className="p-5 text-sm font-mono text-slate-500">{client.password === 'Abc@123' ? <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase">Pending Update</span> : <span className="opacity-50">••••••••</span>}</td>
                <td className="p-5 text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(client)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => deleteClient(client.username)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}