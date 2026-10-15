import { useState, useMemo, useRef, useEffect } from 'react';
import { Layers, Wrench, CheckCircle2, Package, Truck, Calendar, BarChart3, PieChart, ChevronLeft, ChevronRight, ChevronDown, Activity } from 'lucide-react';

export default function SummaryStatistics({ items, t }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [chartType, setChartType] = useState('pie');

  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const pickerRef = useRef(null);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) setShowPicker(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthSelect = (monthIndex) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, '0');
    setSelectedMonth(`${pickerYear}-${formattedMonth}`);
    setShowPicker(false);
  };

  const displayDate = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const date = new Date(y, m - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const stats = useMemo(() => {
    const monthlyItems = items.filter(item => {
      const itemDate = item.intake_date || (item.created_at ? item.created_at.split('T')[0] : '');
      if (!itemDate) return false;
      return itemDate.startsWith(selectedMonth);
    });

    let sReceiving = 0, sChecking = 0, sInform = 0;
    let sInProgress = 0, sWaitingParts = 0, sDone = 0;
    let sInventory = 0, sPickup = 0, sDelivered = 0;

    monthlyItems.forEach(i => {
      const stage = (i.stage || '').toLowerCase();
      const rStatus = (i.repair_status || '').toLowerCase();
      const oStatus = (i.outbound_status || '').toLowerCase();
      
      if (stage === 'receiving') {
        sReceiving++;
      } 
      else if (stage === 'checking status' || stage === 'inspection') {
        sChecking++;
      } 
      else if (stage === 'inform') {
        sInform++;
      } 
      else if (stage === 'repair status' || stage === 'status') {
        if (rStatus === 'waiting for spare part') sWaitingParts++;
        else if (rStatus === 'done') sDone++;
        else sInProgress++; 
      } 
      else if (stage === 'outbound') {
        if (oStatus === 'waiting for customer pick up') sPickup++;
        else if (oStatus === 'delivered') sDelivered++;
        else sInventory++; 
      } 
      else {
        sReceiving++; 
      }
    });

    return { 
      total: monthlyItems.length, 
      sReceiving, sChecking, sInform, 
      sInProgress, sWaitingParts, sDone, 
      sInventory, sPickup, sDelivered 
    };
  }, [items, selectedMonth]);

  const globalChartData = [
    { label: '1. Receiving Queue', count: stats.sReceiving, bg: 'bg-slate-400', text: 'text-slate-400' },
    { label: '2. Checking Status', count: stats.sChecking, bg: 'bg-yellow-400', text: 'text-yellow-400' },
    { label: '3. Awaiting Client Approval', count: stats.sInform, bg: 'bg-orange-400', text: 'text-orange-400' },
    { label: '4. Repair In Progress', count: stats.sInProgress, bg: 'bg-blue-500', text: 'text-blue-500' },
    { label: '5. Waiting for Spare Parts', count: stats.sWaitingParts, bg: 'bg-red-500', text: 'text-red-500' },
    { label: '6. Repair Done', count: stats.sDone, bg: 'bg-emerald-400', text: 'text-emerald-400' },
    { label: '7. Outbound: In Inventory', count: stats.sInventory, bg: 'bg-slate-600', text: 'text-slate-600' },
    { label: '8. Waiting Customer Pickup', count: stats.sPickup, bg: 'bg-violet-500', text: 'text-violet-500' },
    { label: '9. Delivered / Completed', count: stats.sDelivered, bg: 'bg-indigo-600', text: 'text-indigo-600' }
  ];

  return (
    <div className={`p-6 bg-white/50 rounded-2xl border ${t.border} shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${t.btn} text-white`}>
            <PieChart size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Analytics</h2>
            <p className="text-sm font-medium text-slate-500">Monthly breakdown of repair operations and inventory.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-200/80 p-1 rounded-xl shadow-inner border border-slate-300">
            <button onClick={() => setChartType('pie')} className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${chartType === 'pie' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <PieChart size={14}/> Pie
            </button>
            <button onClick={() => setChartType('bars')} className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${chartType === 'bars' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              <BarChart3 size={14}/> Bars
            </button>
          </div>

          <div className="relative" ref={pickerRef}>
            <button 
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm hover:border-slate-400 transition-all group"
            >
              <Calendar size={18} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
              <span className="text-sm font-extrabold text-blue-700 flex items-center gap-1.5">
                {displayDate} <ChevronDown size={14} className={`text-slate-400 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {showPicker && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                  <button onClick={() => setPickerYear(prev => prev - 1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><ChevronLeft size={18}/></button>
                  <span className="font-extrabold text-slate-800 text-lg">{pickerYear}</span>
                  <button onClick={() => setPickerYear(prev => prev + 1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"><ChevronRight size={18}/></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((m, idx) => {
                    const isSelected = selectedMonth === `${pickerYear}-${String(idx + 1).padStart(2, '0')}`;
                    return (
                      <button
                        key={m}
                        onClick={() => handleMonthSelect(idx)}
                        className={`py-2 rounded-xl text-sm font-bold transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top KPI Cards - SIMPLIFIED TEXT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Layers size={24} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Received</p>
            <p className="text-2xl font-extrabold text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-100 text-amber-600 p-3 rounded-xl"><Wrench size={24} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ongoing / Parts</p>
            <p className="text-2xl font-extrabold text-slate-800">{stats.sReceiving + stats.sChecking + stats.sInform + stats.sInProgress + stats.sWaitingParts}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repairs Done</p>
            <p className="text-2xl font-extrabold text-slate-800">{stats.sDone + stats.sInventory + stats.sPickup}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl"><Truck size={24} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivered Out</p>
            <p className="text-2xl font-extrabold text-slate-800">{stats.sDelivered}</p>
          </div>
        </div>
      </div>

      {/* Massive Unified Graphical Section */}
      <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-slate-800 mb-8 flex items-center gap-2 text-lg">
          <Activity size={20} className="text-slate-400" /> Global Kanban Board Distribution
        </h3>
        
        {chartType === 'bars' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 animate-in fade-in duration-300">
            {globalChartData.map(d => (
              <StatBar key={d.label} label={d.label} count={d.count} total={stats.total} percent={stats.total === 0 ? 0 : Math.round((d.count / stats.total) * 100)} color={d.bg} />
            ))}
          </div>
        ) : (
          <UnifiedDonutChart data={globalChartData} total={stats.total} />
        )}
      </div>

    </div>
  );
}

// -------------------------------------------------------------
// REUSABLE UI COMPONENTS
// -------------------------------------------------------------

function StatBar({ label, count, total, percent, color }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className="text-xs font-mono font-bold text-slate-500">{count} <span className="text-[10px] font-sans font-medium text-slate-400">({percent}%)</span></span>
      </div>
      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        {total > 0 ? (
          <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }} />
        ) : (
          <div className="h-full w-full bg-slate-100" />
        )}
      </div>
    </div>
  );
}

function UnifiedDonutChart({ data, total }) {
  let currentOffset = 0;

  return (
    <div className="flex flex-col xl:flex-row items-center justify-center gap-12 xl:gap-20 animate-in fade-in zoom-in-95 duration-300">
      
      {/* THE GIANT PIE CHART */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex-none">
        {total === 0 ? (
          <div className="absolute inset-0 border-8 border-dashed border-slate-200 rounded-full flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-slate-300">0</span>
            <span className="text-xs font-bold text-slate-400 uppercase">Items</span>
          </div>
        ) : (
          <>
            <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90 rounded-full drop-shadow-xl">
              {data.map((slice, i) => {
                const percent = (slice.count / total) * 100;
                if (percent === 0) return null;
                
                const strokeDasharray = `${percent} ${100 - percent}`;
                const strokeDashoffset = -currentOffset;
                currentOffset += percent;
                
                return (
                  <circle
                    key={i}
                    r="15.91549430918954"
                    cx="16"
                    cy="16"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className={`${slice.text} transition-all duration-500 ease-out`}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full pointer-events-none bg-white/40 backdrop-blur-[2px] m-[15%] shadow-inner border border-white/50">
              <span className="text-4xl md:text-5xl font-extrabold text-slate-800 drop-shadow-sm">{total}</span>
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mt-1">Total Items</span>
            </div>
          </>
        )}
      </div>

      {/* THE 9-ELEMENT LEGEND */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 w-full max-w-3xl">
        {data.map((slice, i) => {
          const percent = total > 0 ? Math.round((slice.count / total) * 100) : 0;
          const isActive = slice.count > 0;
          
          return (
            <div key={i} className={`flex items-center justify-between text-sm p-3 rounded-xl border transition-all ${isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60 grayscale-[50%]'}`}>
              <div className="flex items-center gap-3">
                <span className={`w-4 h-4 rounded-full flex-none shadow-sm ${slice.bg}`}></span>
                <span className={`font-bold ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>{slice.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-sm font-extrabold ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>{slice.count}</span>
                <span className={`text-[10px] w-8 text-right ${isActive ? 'text-slate-500 font-bold' : 'text-slate-300 font-medium'}`}>{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}