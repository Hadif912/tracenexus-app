import { useState } from 'react';
import { Package, User, Lock, Phone, KeyRound, BadgeCheck, Eye, EyeOff, Truck, Save, Tag, AlignLeft, Send } from 'lucide-react';

export default function Auth({ usersDB, setUsersDB, setUserRole, setCurrentUser, addRequest }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'request'
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [pendingPasswordChange, setPendingPasswordChange] = useState(null);
  
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirmPass: '' });
  const [requestForm, setRequestForm] = useState({ itemName: '', itemBrand: '', clientName: '', phone: '', description: '' });
  
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAuth = (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess('');

    if (authMode === 'login') {
      if (!credentials.username || !credentials.password) return setAuthError('Please fill in all fields');

      let user = usersDB.find(u => u.username === credentials.username && u.password === credentials.password);
      
      if (!user && credentials.username === credentials.password && credentials.username.toLowerCase() !== 'admin') {
         user = { username: credentials.username, password: credentials.password, role: 'staff' };
         setUsersDB([...usersDB, user]); 
      }

      if (user) {
        if (user.role === 'customer' && user.password === 'Abc@123') {
          setPendingPasswordChange(user);
        } else {
          finalizeLogin(user);
        }
      } else {
        setAuthError('Invalid credentials');
      }
    } else if (authMode === 'register') {
      if (!credentials.username) return setAuthError('Phone number is required');
      if (usersDB.some(u => u.username === credentials.username)) return setAuthError('Phone number is already registered');
      
      const newUser = { username: credentials.username, password: 'Abc@123', role: 'customer' };
      setUsersDB([...usersDB, newUser]);
      
      setAuthSuccess('Registration successful! Please login with temporary password: Abc@123');
      setAuthMode('login');
      setCredentials({ username: credentials.username, password: '' });
      setShowLoginPassword(false);
    }
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess('');
    if (!requestForm.itemName || !requestForm.phone || !requestForm.clientName) {
      return setAuthError('Item Name, Client Name, and Phone are required.');
    }

    addRequest({
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      ...requestForm,
      timestamp: new Date().toLocaleString()
    });

    setAuthSuccess('Repair request sent to admins! You will be notified shortly.');
    setAuthMode('login');
    setRequestForm({ itemName: '', itemBrand: '', clientName: '', phone: '', description: '' });
  };

  const finalizeLogin = (user) => {
    setUserRole(user.role);
    setCurrentUser(user.username);
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setAuthError('');
    if (passwordForm.newPass !== passwordForm.confirmPass) return setAuthError('Passwords do not match');
    if (passwordForm.newPass === 'Abc@123') return setAuthError('Please choose a different password');

    const updatedUsers = usersDB.map(u => u.username === pendingPasswordChange.username ? { ...u, password: passwordForm.newPass } : u);
    setUsersDB(updatedUsers);

    finalizeLogin({ ...pendingPasswordChange, password: passwordForm.newPass });
  };

  if (pendingPasswordChange) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3"><KeyRound size={32} /></div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Secure Your Account</h1>
            <p className="text-slate-500 text-sm">Welcome! Please update your temporary password.</p>
          </div>
          {authError && <div className="mb-6 p-4 bg-red-50/50 text-red-600 border border-red-100 rounded-xl text-sm text-center font-medium">{authError}</div>}
          <form onSubmit={handlePasswordUpdate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? "text" : "password"} value={passwordForm.newPass} onChange={(e) => setPasswordForm({...passwordForm, newPass: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-12" required/>
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-blue-600"><EyeOff size={18} /></button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={passwordForm.confirmPass} onChange={(e) => setPasswordForm({...passwordForm, confirmPass: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-12" required/>
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-blue-600"><EyeOff size={18} /></button>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 mt-6 shadow-md shadow-blue-200/50"><Save size={18} /> Save & Continue</button>
          </form>
        </div>
      </div>
    );
  }

  // RENDER CUSTOMER REQUEST FORM
  if (authMode === 'request') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"><Package size={32} /></div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Request a Repair</h1>
            <p className="text-slate-500 text-sm font-medium">Send us your device details and we will review it.</p>
          </div>

          {authError && <div className="mb-6 p-4 bg-red-50/50 text-red-600 border border-red-100 rounded-xl text-sm text-center font-medium">{authError}</div>}

          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative"><Package size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Device Name" value={requestForm.itemName} onChange={(e) => setRequestForm({...requestForm, itemName: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm" required/></div>
              <div className="relative"><Tag size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Brand" value={requestForm.itemBrand} onChange={(e) => setRequestForm({...requestForm, itemBrand: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm" /></div>
              <div className="relative"><User size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Your Full Name" value={requestForm.clientName} onChange={(e) => setRequestForm({...requestForm, clientName: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm" required/></div>
              <div className="relative"><Phone size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Phone Number" value={requestForm.phone} onChange={(e) => setRequestForm({...requestForm, phone: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm" required/></div>
              <div className="relative md:col-span-2"><AlignLeft size={16} className="absolute left-4 top-3.5 text-slate-400" /><input type="text" placeholder="Describe the problem..." value={requestForm.description} onChange={(e) => setRequestForm({...requestForm, description: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-sm" /></div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold mt-4 shadow-md flex items-center justify-center gap-2 transition-all"><Send size={18}/> Send Request</button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
            <button onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} className="text-slate-600 hover:text-slate-800 font-semibold transition-colors">
              Cancel & Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER DEFAULT LOGIN / REGISTER
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3 shadow-lg shadow-blue-200"><Truck size={32} /></div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">TraceNexus</h1>
          <p className="text-slate-500 text-sm font-medium">{authMode === 'login' ? 'Enterprise Logistics Portal' : 'Customer Registration'}</p>
        </div>
        
        {authError && <div className="mb-6 p-4 bg-red-50/50 text-red-600 border border-red-100 rounded-xl text-sm text-center font-medium">{authError}</div>}
        {authSuccess && <div className="mb-6 p-4 bg-sky-50 text-sky-700 border border-sky-100 rounded-xl text-sm text-center flex flex-col items-center gap-2 font-medium"><BadgeCheck size={24} className="text-sky-500" />{authSuccess}</div>}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{authMode === 'login' ? 'Identifier / Phone / Staff ID' : 'Mobile Phone Number'}</label>
            <div className="relative">
              {authMode === 'register' ? <Phone size={18} className="absolute left-4 top-3.5 text-slate-400" /> : <User size={18} className="absolute left-4 top-3.5 text-slate-400" />}
              <input type="text" value={credentials.username} onChange={(e) => setCredentials({...credentials, username: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder={authMode === 'login' ? "Enter your ID" : "e.g., 0123456789"} />
            </div>
          </div>
          {authMode === 'login' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input type={showLoginPassword ? "text" : "password"} value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="••••••••" />
                <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-blue-600"><EyeOff size={18} /></button>
              </div>
            </div>
          )}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold mt-2 shadow-md shadow-blue-200/50 transition-all">{authMode === 'login' ? 'Access Dashboard' : 'Register Number'}</button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 pt-4 flex flex-col gap-3 border-t border-slate-100">
          <button onClick={() => { setAuthMode('request'); setAuthError(''); setAuthSuccess(''); }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-all border border-slate-200">
            Want to repair an item? Submit request
          </button>
        </div>
      </div>
    </div>
  );
}