export const STAGES = ['Receiving', 'Inspection', 'Inform', 'Status', 'Outbound'];

export const STAGE_CONFIG = {
  'Receiving': { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-600' },
  'Inspection': { bg: 'bg-slate-50', border: 'border-blue-100', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-600' },
  'Inform': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  'Status': { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-700' },
  'Outbound': { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white', badge: 'bg-blue-500 text-white' }
};

export const INITIAL_ITEMS = [
  {
    id: 'REP-8492',
    name: 'iPhone 13 Pro Max',
    brand: 'Apple',
    description: 'Cracked screen and battery draining fast',
    owner: '0123456789',
    stage: 'Inspection',
    problem: '',
    price: '',
    clientDecision: 'Pending',
    repairStatus: 'In Progress',
    outboundStatus: 'In Inventory',
    history: [
      { stage: 'Receiving', timestamp: new Date(Date.now() - 86400000).toLocaleString(), iso: new Date(Date.now() - 86400000).toISOString() },
      { stage: 'Inspection', timestamp: new Date().toLocaleString(), iso: new Date().toISOString() }
    ]
  }
];