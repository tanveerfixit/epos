const fs = require('fs');

let c = fs.readFileSync('c:\\\\epos\\\\src\\\\components\\\\admin\\\\AdminPortal.tsx', 'utf8');

c = c.replace(/text-2xl font-black text-white/g, "${theme === 'dark' ? 'text-2xl font-black text-white' : 'text-2xl font-black text-[#1F3BB3]'}");
c = c.replace(/text-slate-500 font-medium/g, "${theme === 'dark' ? 'text-slate-500 font-medium' : 'text-[#6C7383] font-medium'}");
c = c.replace(/bg-slate-900\\/60 backdrop-blur-md/g, "${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md' : 'bg-[#FFFFFF] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px]'}");
c = c.replace(/border-white\\/10/g, "${theme === 'dark' ? 'border-white/10' : 'border-transparent'}");

// The h3 elements and similar headers
c = c.replace(/text-lg font-bold text-white/g, "text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}");
c = c.replace(/text-xl font-bold text-white/g, "text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}");
c = c.replace(/font-bold text-white mb-1/g, "font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'} mb-1");

// Standard list rows
c = c.replace(/hover:bg-slate-800\\/30\\/80/g, "${theme === 'dark' ? 'hover:bg-slate-800/30/80' : 'hover:bg-slate-50'}");
c = c.replace(/text-base font-bold text-white/g, "text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}");

c = c.replace(/text-slate-400 font-semibold/g, "${theme === 'dark' ? 'text-slate-400 font-semibold' : 'text-[#6C7383] font-semibold'}");

// Now we safely handle the JSX className attribute interpolation
let blocks = c.split('className="');
for (let i = 1; i < blocks.length; i++) {
  let closingIdx = blocks[i].indexOf('"');
  if (closingIdx !== -1) {
    let cls = blocks[i].slice(0, closingIdx);
    if (cls.includes('${')) {
      // Must become target pattern: className={`...`}
      blocks[i] = '{`' + cls + '`}' + blocks[i].slice(closingIdx + 1);
    } else {
      blocks[i] = '"' + blocks[i];
    }
  } else {
    blocks[i] = '"' + blocks[i];
  }
}
c = blocks.join('className=');

// Fix potential issues inside inputs
c = c.replace(/bg-slate-800\\/30/g, "${theme === 'dark' ? 'bg-slate-800/30' : 'bg-[#e9ecef] text-slate-800'}");

fs.writeFileSync('c:\\\\epos\\\\src\\\\components\\\\admin\\\\AdminPortal.tsx', c);
