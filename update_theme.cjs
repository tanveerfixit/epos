const fs = require('fs');
let c = fs.readFileSync('c:\\\\epos\\\\src\\\\components\\\\admin\\\\AdminPortal.tsx', 'utf8');

c = c.replace(
  /<div className="fixed inset-0 bg-slate-950 text-slate-300 z-\[60\] flex flex-col font-sans overflow-hidden animate-in fade-in zoom-in duration-300 selection:bg-blue-500\/30">/,
  '<div className={`fixed inset-0 z-[60] flex flex-col font-sans overflow-hidden animate-in fade-in zoom-in duration-300 selection:bg-blue-500/30 ${theme===\\'dark\\' ? \\'bg-slate-950 text-slate-300\\' : \\'bg-slate-100 text-slate-800\\'}`}>'
);

c = c.replace(
  /<div className="absolute inset-0 bg-\[radial-gradient\(circle_at_top_right,rgba\(30,58,138,0\.15\),transparent_40%\),radial-gradient\(circle_at_bottom_left,rgba\(88,28,135,0\.15\),transparent_40%\)\] pointer-events-none" \/>/,
  '{theme===\\'dark\\' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,58,138,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(88,28,135,0.15),transparent_40%)] pointer-events-none" />}'
);

c = c.replace(
  /<header className="bg-slate-900\/50 backdrop-blur-md border-b border-white\/5 h-16 shrink-0 flex items-center justify-between px-8 z-10">/,
  '<header className={`backdrop-blur-md border-b h-16 shrink-0 flex items-center justify-between px-8 z-10 ${theme===\\'dark\\' ? \\'bg-slate-900/50 border-white/5\\' : \\'bg-white border-slate-200 shadow-sm\\'}`}>'
);

c = c.replace(
  /<h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight leading-none">/,
  '<h1 className={`text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r tracking-tight leading-none ${theme===\\'dark\\' ? \\'from-white to-slate-400\\' : \\'from-slate-800 to-slate-500\\'}`}>'
);

c = c.replace(
  /<div className="h-8 w-px bg-slate-900\/60 backdrop-blur-md\/5" \/>/,
  '<div className={`h-8 w-px backdrop-blur-md/5 ${theme===\\'dark\\' ? \\'bg-slate-900/60\\' : \\'bg-slate-200\\'}`} />'
);

c = c.replace(
  /<div className="text-sm font-black text-white">/,
  '<div className={`text-sm font-black ${theme===\\'dark\\' ? \\'text-white\\' : \\'text-slate-900\\'}`}>'
);

c = c.replace(
  /<button\s+onClick=\{onClose\}\s+className="w-10 h-10 rounded-lg hover:bg-slate-900\/60 backdrop-blur-md\/5 flex items-center justify-center transition-all group border border-transparent hover:border-white\/10"/,
  '<button onClick={() => setTheme(t => t === \\'dark\\' ? \\'grey\\' : \\'dark\\')} title="Toggle Theme" className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group border border-transparent ${theme===\\'dark\\' ? \\'hover:bg-slate-900/60 hover:border-white/10 text-slate-400\\' : \\'hover:bg-slate-100 hover:border-slate-300 text-slate-500\\'}`}>{theme === \\'dark\\' ? <Sun size={20} className="group-hover:text-amber-400" /> : <Moon size={20} className="group-hover:text-indigo-600" />}</button>\\n            <button onClick={onClose} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group border border-transparent ${theme===\\'dark\\' ? \\'hover:bg-slate-900/60 hover:border-white/10\\' : \\'hover:bg-slate-100 hover:border-slate-300\\'}`}'
);

c = c.replace(
  /<aside className="w-72 bg-slate-900\/30 backdrop-blur-xl border-r border-white\/5 p-6 flex flex-col gap-1\.5 shrink-0">/,
  '<aside className={`w-72 backdrop-blur-xl border-r p-6 flex flex-col gap-1.5 shrink-0 ${theme===\\'dark\\' ? \\'bg-slate-900/30 border-white/5\\' : \\'bg-slate-50 border-slate-200\\'}`}>'
);

c = c.replace(
  /className=\{`flex items-center gap-4 p-3\.5 rounded-xl transition-all duration-200 group text-left relative overflow-hidden \$\{\n\s*tab === t.id\n\s*\? 'bg-blue-600\/10 border-blue-500\/20 text-white shadow-\[inset_0_0_20px_rgba\(59,130,246,0\.05\)\] border'\n\s*: 'hover:bg-slate-900\/60 backdrop-blur-md\/5 text-slate-400 border border-transparent hover:border-white\/5'\n\s*\}`} /g,
  "className={`flex items-center gap-4 p-3.5 rounded-xl transition-all duration-200 group text-left relative overflow-hidden ${tab === t.id ? (theme==='dark' ? 'bg-blue-600/10 border-blue-500/20 text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] border' : 'bg-white border-blue-200 text-blue-700 shadow-sm border') : (theme==='dark' ? 'hover:bg-slate-900/60 backdrop-blur-md text-slate-400 border border-transparent hover:border-white/5' : 'hover:bg-white text-slate-600 border border-transparent hover:border-slate-200')} `} "
);

c = c.replace(
  /className=\{`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 \$\{\n\s*tab === t.id \? 'bg-gradient-to-br from-blue-500\/20 to-indigo-500\/20 text-blue-400 border border-blue-500\/30 shadow-\[0_0_15px_rgba\(59,130,246,0\.2\)\]' : 'bg-slate-800 border border-white\/5 text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-700'\n\s*\}`} /g,
  "className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${tab === t.id ? (theme==='dark' ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-blue-50 text-blue-600 border border-blue-100') : (theme==='dark' ? 'bg-slate-800 border border-white/5 text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-400 group-hover:text-slate-600 shadow-sm')} `} "
);

// Health block background
c = c.replace(/<div className="mt-auto p-4 bg-slate-900\/50 rounded-xl border border-white\/5 relative overflow-hidden group">/, '<div className={`mt-auto p-4 rounded-xl border relative overflow-hidden group ${theme===\\'dark\\' ? \\'bg-slate-900/50 border-white/5\\' : \\'bg-white border-slate-200 shadow-sm\\'}`}>');

fs.writeFileSync('c:\\\\epos\\\\src\\\\components\\\\admin\\\\AdminPortal.tsx', c);
