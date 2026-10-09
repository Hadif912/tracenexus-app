import { useState } from 'react';
import { User, Phone, Edit2, Trash2, Briefcase, Lock, Wrench } from 'lucide-react';

export default function EngineerManagement({ usersDB, setUsersDB, isAdmin, supabase }) {
  const [formData, setFormData] = useState({ phone: '', clientName: '', position: '', password: 'StaffPassword123' });
  const [editingPhone, setEditingPhone] = useState(null);
  const staffMembers = usersDB.filter(u => u.role === 'staff');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.phone.trim()) return;

    if (editingPhone) {
      await supabase.from('users').update({ 
        username: formData.phone, 
        client_name: formData.clientName, 
        position: formData.position,
        password: formData.password 
      }).eq('username', editingPhone);
      
      setUsersDB(usersDB.map(u => u.username === editingPhone ? { ...u, username: formData.phone, client_name: formData.clientName, position: formData.position, password: formData.password } : u));
      setEditingPhone(null);
    } else {
      if (usersDB.some(u => u.username === formData.phone)) return alert("Staff ID / Phone is already registered.");
      const newStaff = { 
        username: formData.phone, 
        password: formData.password || 'StaffPassword123', 
        role: 'staff', 
        client_name: formData.clientName,
        position: formData.position
      };
      await supabase.from('users').insert([newStaff]);
      setUsersDB([...usersDB, newStaff]);
    }
    setFormData({ phone: '', clientName: '', position: '', password: 'StaffPassword123' });
  };

  const startEdit = (staff) => {
    setEditingPhone(staff.username);
    setFormData({ phone: staff.username, clientName: staff.client_name || '', position: staff.position || '', password: staff.password });
  };

  const deleteStaff = async (phone) => {
    if (!isAdmin) return;
    if (window.confirm(`Delete staff member ${phone}?`)) {
      await supabase.from('users').delete().eq('username', phone);
      setUsersDB(usersDB.filter(u => u.username !== phone));
    }
  };

  return (
    <div className="bg-slate-100 rounded-2xl shadow-sm border border-slate-300 overflow-hidden flex flex-col">
      <div className="bg-slate-200 border-b border-slate-300 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-slate-700"/> {editingPhone ? 'Edit Staff Account' : 'Register New Staff Member'}</h3>
        <form onSubmit={handleSave} className="flex flex-col gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative"><User size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Full Name" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm" required/></div>
            <div className="relative"><Briefcase size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Position (e.g. Senior Tech)" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm" required/></div>
            <div className="relative"><Phone size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Staff ID / Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm" required/></div>
            <div className="relative"><Lock size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-11 pr-4 py-3 border border-slate-300 bg-slate-50 rounded-xl text-sm" required/></div>
          </div>
          <div className="flex gap-3 mt-2 justify-end">
            {editingPhone && <button type="button" onClick={() => { setEditingPhone(null); setFormData({ phone: '', clientName: '', position: '', password: 'StaffPassword123' }); }} className="bg-slate-300 hover:bg-slate-400 text-slate-800 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">Cancel</button>}
            <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-slate-100 px-8 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm transition-colors">{editingPhone ? 'Save Staff' : 'Add Staff'}</button>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="p-5 font-bold text-slate-500 text-xs uppercase">Staff Member</th>
              <th className="p-5 font-bold text-slate-500 text-xs uppercase">Position</th>
              <th className="p-5 font-bold text-slate-500 text-xs uppercase">ID / Phone</th>
              <th className="p-5 font-bold text-slate-500 text-xs uppercase">Password</th>
              <th className="p-5 font-bold text-slate-500 text-xs uppercase text-right">Manage</th>
            </tr>
          </thead>
          <tbody>
            {staffMembers.length > 0 ? staffMembers.map((staff, idx) => (
              <tr key={idx} className={`border-b border-slate-300 hover:bg-slate-200 transition-colors ${editingPhone === staff.username ? 'bg-slate-300/50' : 'bg-slate-50'}`}>
                <td className="p-5 text-sm font-bold text-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs"><Wrench size={14}/></div>
                    {staff.client_name || <span className="text-slate-400 italic">Unspecified</span>}
                  </div>
                </td>
                <td className="p-5 text-sm font-semibold text-slate-600">{staff.position || '-'}</td>
                <td className="p-5 text-sm font-mono font-semibold text-slate-700">{staff.username}</td>
                <td className="p-5 text-sm font-mono text-slate-500">{staff.password}</td>
                <td className="p-5 text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => startEdit(staff)} className="text-slate-500 hover:text-slate-800 hover:bg-slate-300 p-2 rounded-lg transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => deleteStaff(staff.username)} className="text-slate-500 hover:text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan="5" className="p-12 text-center text-slate-500 font-medium">No staff members registered.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}