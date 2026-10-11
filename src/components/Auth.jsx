import { useState, useEffect } from 'react';
import { Package, User, Lock, Phone, Eye, EyeOff, Save, Tag, AlignLeft, Send, Info, LucideSquareDashedMousePointer } from 'lucide-react';
import companyLogo from '../assets/logo.png';
import slide1 from '../assets/slide1.png';
import slide2 from '../assets/slide2.png';
import slide3 from '../assets/slide3.png';

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
  
  // NEW: State for Input Guide and Slideshow
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  

 const slides = [
    { url: slide1, title: 'Precision Component Repair', subtitle: 'Advanced diagnostics for industrial electronics.' },
    { url: slide2, title: 'Expert Engineering Team', subtitle: 'Dedicated technicians handling your equipment.' },
    { url: slide3, title: 'Quality Assurance', subtitle: 'Rigorous testing before deployment.' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
      if (userErr) return setAuthError("Database Error: Could not create user account.");
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
    
    const { error: reqErr } = await supabase.from('repair_requests').insert([newReq]);
    if (reqErr) return setAuthError("Database Error: Could not submit request.");
    
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-300">
        <div className="bg-slate-100 p-10 rounded-2xl max-w-md w-full shadow-lg border border-slate-300">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-6 text-center">Secure Your Account</h1>
          {authError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">{authError}</div>}
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <input type="password" placeholder="New Password" value={passwordForm.newPass} onChange={(e) => setPasswordForm({...passwordForm, newPass: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50" required/>
            <input type="password" placeholder="Confirm Password" value={passwordForm.confirmPass} onChange={(e) => setPasswordForm({...passwordForm, confirmPass: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl bg-slate-50" required/>
            <button type="submit" className="w-full bg-slate-800 text-slate-100 py-3 rounded-xl font-bold">Save & Continue</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-300 flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden border border-slate-300 min-h-[650px]">
        
        {/* Left Panel: Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm overflow-hidden flex-none bg-white">
                <img src={companyLogo} alt="Company Logo" className="w-full h-full object-contain p-2" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{authMode === 'request' ? 'Request a Repair' : 'KRC Electronic'}</h1>
              <p className="text-slate-500 font-medium">{authMode === 'login' ? 'Track & Trace System Portal' : authMode === 'request' ? 'Send us your device details.' : 'Customer Registration'}</p>
            </div>
            
            {authError && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-sm font-semibold border border-red-200">{authError}</div>}
            {authSuccess && <div className="mb-6 p-4 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-semibold border border-emerald-200">{authSuccess}</div>}
            
            {authMode === 'request' ? (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative"><Package size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Device Name" value={requestForm.itemName} onChange={(e) => setRequestForm({...requestForm, itemName: e.target.value})} className="w-full pl-11 p-3 border border-slate-300 bg-slate-50 rounded-xl" required/></div>
                  <div className="relative"><Tag size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Brand" value={requestForm.itemBrand} onChange={(e) => setRequestForm({...requestForm, itemBrand: e.target.value})} className="w-full pl-11 p-3 border border-slate-300 bg-slate-50 rounded-xl"/></div>
                  <div className="relative"><User size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Full Name" value={requestForm.clientName} onChange={(e) => setRequestForm({...requestForm, clientName: e.target.value})} className="w-full pl-11 p-3 border border-slate-300 bg-slate-50 rounded-xl" required/></div>
                  <div className="relative"><Phone size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Phone Number (+60...)" value={requestForm.phone} onChange={(e) => setRequestForm({...requestForm, phone: e.target.value})} className="w-full pl-11 p-3 border border-slate-300 bg-slate-50 rounded-xl" required/></div>
                  <div className="relative md:col-span-2">
                    <Lock size={16} className="absolute left-4 top-3.5 text-slate-500" />
                    <input type={showRequestPassword ? "text" : "password"} placeholder="Create Password to Track Request" value={requestForm.password} onChange={(e) => setRequestForm({...requestForm, password: e.target.value})} className="w-full pl-11 pr-12 p-3 border border-slate-300 bg-slate-50 rounded-xl" required/>
                    <button type="button" onClick={() => setShowRequestPassword(!showRequestPassword)} className="absolute right-4 top-3.5 text-slate-500"><Eye size={16}/></button>
                  </div>
                  <div className="relative md:col-span-2"><AlignLeft size={16} className="absolute left-4 top-3.5 text-slate-500" /><input type="text" placeholder="Describe issue..." value={requestForm.description} onChange={(e) => setRequestForm({...requestForm, description: e.target.value})} className="w-full pl-11 p-3 border border-slate-300 bg-slate-50 rounded-xl" /></div>
                </div>
                <button type="submit" className="w-full bg-slate-800 text-slate-100 hover:bg-slate-900 p-4 rounded-xl font-bold mt-4 transition-colors"><Send size={18} className="inline mr-2"/> Submit Request</button>
                <button type="button" onClick={() => setAuthMode('login')} className="mt-4 w-full text-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel & Back to Login</button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-5">
                <div className="relative">
                  <User size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input 
                    type="text" 
                    value={credentials.username} 
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})} 
                    onFocus={() => setIsUsernameFocused(true)}
                    onBlur={() => setTimeout(() => setIsUsernameFocused(false), 200)}
                    className="w-full pl-12 p-3.5 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-slate-500/20 outline-none transition-all" 
                    placeholder="Enter Identifier" 
                  />
                  
                  {/* Dynamic Login Guide Popover */}
                  {isUsernameFocused && (
                    <div className="absolute z-10 w-full mt-2 p-4 bg-slate-800 text-slate-100 rounded-xl text-sm shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="font-bold mb-2 flex items-center gap-2 text-blue-400"><Info size={16}/> Login Format Guide</p>
                      <ul className="space-y-1.5 ml-1 text-slate-300">
                        <li><b className="text-white">Admin:</b> Use admin username</li>
                        <li><b className="text-white">Staff:</b> Use assigned Staff ID</li>
                        <li><b className="text-white">Customer:</b> Use phone number (e.g., <span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded text-xs">+60184352453</span>)</li>
                      </ul>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input type={showLoginPassword ? "text" : "password"} value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} className="w-full pl-12 pr-12 p-3.5 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-slate-500/20 outline-none" placeholder="Password" />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-800 transition-colors"><Eye size={18}/></button>
                </div>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-slate-100 p-4 rounded-xl font-bold transition-all shadow-md shadow-slate-900/10">Access Portal</button>
                <button type="button" onClick={() => setAuthMode('request')} className="w-full mt-4 bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-700 py-3.5 rounded-xl font-bold transition-colors">Want to repair an item? Submit request</button>
              </form>
            )}
          </div>
        </div>

        {/* Right Panel: Slideshow */}
        <div className="hidden lg:block w-1/2 relative bg-slate-900 overflow-hidden">
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="absolute inset-0 bg-slate-900/40 z-10"></div>
              <img src={slide.url} alt={slide.title} className="w-full h-full object-cover scale-105" />
              <div className="absolute bottom-0 left-0 w-full p-12 z-20 bg-gradient-to-t from-slate-900/90 to-transparent">
                <h2 className="text-3xl font-extrabold text-white mb-2">{slide.title}</h2>
                <p className="text-slate-300 font-medium text-lg">{slide.subtitle}</p>
              </div>
            </div>
          ))}
          
          {/* Slide Indicators */}
          <div className="absolute bottom-6 left-0 w-full flex justify-center gap-2 z-30">
            {slides.map((_, index) => (
              <button 
                key={index} 
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}