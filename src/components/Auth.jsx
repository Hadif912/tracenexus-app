import { useState } from 'react';
import { Package, User, Lock, Phone, KeyRound, BadgeCheck, Eye, EyeOff, Truck, Save, Tag, AlignLeft, Send } from 'lucide-react';

export default function Auth({ usersDB, setUsersDB, setUserRole, setCurrentUser, addRequest, supabase }) {
  const [authMode, setAuthMode] = useState('login'); 
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [pendingPasswordChange, setPendingPasswordChange] = useState(null);
  
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirmPass: '' });
  const [requestForm, setRequestForm] = useState({ itemName: '', itemBrand: '', clientName: '', phone: '', password: '', description: '' });
  
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRequestPassword, setShowRequestPassword] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess('');

    if (authMode === 'login') {
      if (!credentials.username || !credentials.password) return setAuthError('Please fill in all fields');

      if (credentials.username === 'admin' && credentials.password === 'admin123') {
        let adminUser = usersDB.find(u => u.username === 'admin');
        if (!adminUser) {
           adminUser = { username: 'admin', password: 'admin123', role: 'admin', client_name: 'System Administrator' };
           await supabase.from('users').insert([adminUser]);
           setUsersDB([...usersDB, adminUser]);
        }
        finalizeLogin(adminUser);
        return;
      }

      let user = usersDB.find(u => u.username === credentials.username && u.password === credentials.password);
      
      if (!user && credentials.username === credentials.password && credentials.username.toLowerCase() !== 'admin') {
         user = { username: credentials.username, password: credentials.password, role: 'staff' };
         await supabase.from('users').insert([user]);
         setUsersDB([...usersDB, user]); 
      }

      if (user) {
        if (user.role === 'customer' && user.password === 'Abc@123') setPendingPasswordChange(user);
        else finalizeLogin(user);
      } else {
        setAuthError('Invalid credentials');
      }
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess('');
    
    if (!requestForm.itemName || !requestForm.phone || !requestForm.clientName || !requestForm.password) {
      return setAuthError('Item Name, Client Name, Phone, and Password are required.');
    }

    if (!usersDB.some(u => u.username === requestForm.phone)) {
      const newUser = { username: requestForm.phone, password: requestForm.password, role: 'customer', client_name: requestForm.clientName };
      const { error: userErr } = await supabase.from('users').insert([newUser]);
      if (userErr) {
        console.error("User DB Error:", userErr);
        return setAuthError("Database Error: Could not create user account.");
      }
      setUsersDB([...usersDB, newUser]);
    }

    const newReq = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      item_name: requestForm.itemName,
      item_brand: requestForm.itemBrand,
      client_name: requestForm.clientName,
      phone: requestForm.phone,
      description: requestForm.description
    };
    
    // FIXED: Catch errors directly so we know if the database blocked the insert
    const { error: reqErr } = await supabase.from('repair_requests').insert([newReq]);
    if (reqErr) {
      console.error("Request DB Error:", reqErr);
      return setAuthError("Database Error: Could not submit request.");
    }
    
    addRequest(newReq);
    setAuthSuccess('Repair request sent! You can now log in using your phone number and password to track the status.');
    setAuthMode('login');
    setRequestForm({ itemName: '', itemBrand: '', clientName: '', phone: '', password: '', description: '' });
  };

  const finalizeLogin = (user) => { setUserRole(user.role); setCurrentUser(user.username); };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (passwordForm.newPass !== passwordForm.confirmPass) return setAuthError('Passwords do not match');
    
    await supabase.from('users').update({ password: passwordForm.newPass }).eq('username', pendingPasswordChange.username);
    setUsersDB(usersDB.map(u => u.username === pendingPasswordChange.username ? { ...u, password: passwordForm.newPass } : u));
    finalizeLogin({ ...pendingPasswordChange, password: passwordForm.newPass });
  };

  if (pendingPasswordChange) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50"><div className="bg-white p-10 rounded-2xl max-w-md w-full shadow-lg">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-6 text-center">Secure Your Account</h1>
        {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">{authError}</div>}
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <input type="password" placeholder="New Password" value={passwordForm.newPass} onChange={(e) => setPasswordForm({...passwordForm, newPass: e.target.value})} className="w-full p-3 border rounded-xl" required/>
          <input type="password" placeholder="Confirm Password" value={passwordForm.confirmPass} onChange={(e) => setPasswordForm({...passwordForm, confirmPass: e.target.value})} className="w-full p-3 border rounded-xl" required/>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Save & Continue</button>
        </form>
      </div></div>
    );
  }

  if (authMode === 'request') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full">
          <div className="text-center mb-8"><h1 className="text-2xl font-extrabold text-slate-900 mb-2">Request a Repair</h1></div>
          {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{authError}</div>}
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative"><Package size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Device Name" value={requestForm.itemName} onChange={(e) => setRequestForm({...requestForm, itemName: e.target.value})} className="w-full pl-11 p-3 border rounded-xl" required/></div>
              <div className="relative"><Tag size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Brand" value={requestForm.itemBrand} onChange={(e) => setRequestForm({...requestForm, itemBrand: e.target.value})} className="w-full pl-11 p-3 border rounded-xl"/></div>
              <div className="relative"><User size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Full Name" value={requestForm.clientName} onChange={(e) => setRequestForm({...requestForm, clientName: e.target.value})} className="w-full pl-11 p-3 border rounded-xl" required/></div>
              <div className="relative"><Phone size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Phone Number" value={requestForm.phone} onChange={(e) => setRequestForm({...requestForm, phone: e.target.value})} className="w-full pl-11 p-3 border rounded-xl" required/></div>
              <div className="relative md:col-span-2">
                <Lock size={16} className="absolute left-4 top-3.5 text-slate-400" />
                <input type={showRequestPassword ? "text" : "password"} placeholder="Create Password to Track Request" value={requestForm.password} onChange={(e) => setRequestForm({...requestForm, password: e.target.value})} className="w-full pl-11 pr-12 p-3 border rounded-xl" required/>
                <button type="button" onClick={() => setShowRequestPassword(!showRequestPassword)} className="absolute right-4 top-3.5 text-slate-400"><Eye size={16}/></button>
              </div>
              <div className="relative md:col-span-2"><AlignLeft size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Describe issue..." value={requestForm.description} onChange={(e) => setRequestForm({...requestForm, description: e.target.value})} className="w-full pl-11 p-3 border rounded-xl" /></div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-bold mt-4"><Send size={18} className="inline mr-2"/> Send Request & Register</button>
          </form>
          <button onClick={() => setAuthMode('login')} className="mt-6 w-full text-center text-sm font-semibold text-slate-500">Cancel & Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8"><h1 className="text-2xl font-extrabold text-slate-900 mb-2">TraceNexus</h1></div>
        {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{authError}</div>}
        {authSuccess && <div className="mb-4 p-3 bg-sky-50 text-sky-700 rounded-lg text-sm">{authSuccess}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative"><User size={18} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" value={credentials.username} onChange={(e) => setCredentials({...credentials, username: e.target.value})} className="w-full pl-12 p-3 border rounded-xl" placeholder="Phone / Username" /></div>
          <div className="relative"><Lock size={18} className="absolute left-4 top-3.5 text-slate-400" /><input type={showLoginPassword ? "text" : "password"} value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} className="w-full pl-12 pr-12 p-3 border rounded-xl" placeholder="Password" /><button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-3.5 text-slate-400"><Eye size={16}/></button></div>
          <button type="submit" className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-bold">Login</button>
        </form>
        <button onClick={() => setAuthMode('request')} className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors">Want to repair an item? Submit request</button>
      </div>
    </div>
  );
}