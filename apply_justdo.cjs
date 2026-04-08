const fs = require('fs');

let c = fs.readFileSync('c:\\\\epos\\\\src\\\\components\\\\admin\\\\AdminPortal.tsx', 'utf8');

// Replace standard headings with JustDo specific coloring:
c = c.replace(/text-2xl font-black text-white/g, "${theme === 'dark' ? 'text-2xl font-black text-white' : 'text-2xl font-black text-[#1F3BB3]'}");
c = c.replace(/text-slate-500 font-medium/g, "${theme === 'dark' ? 'text-slate-500 font-medium' : 'text-[#6C7383] font-medium'}");

// Replace top level panels (users, branches, smtp, access content wrappers)
// Currently they use bg-slate-900/60 backdrop-blur-md
c = c.replace(/bg-slate-900\\/60 backdrop-blur-md/g, "${theme === 'dark' ? 'bg-slate-900/60 backdrop-blur-md' : 'bg-[#FFFFFF] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] rounded-[15px]'}");

// Replace borders in panels
c = c.replace(/border-white\\/10/g, "${theme === 'dark' ? 'border-white/10' : 'border-transparent'}");

// Replace generic white text inside panels
// We need to be careful with text-white as it's used inside buttons too.
// The panel titles use <h3 className="text-xl font-bold text-white"> etc.
c = c.replace(/font-bold text-white/g, "font-bold ${theme === 'dark' ? 'text-white' : 'text-[#1F3BB3]'}");

// Fix list row hover
c = c.replace(/hover:bg-slate-800\\/30\\/80/g, "${theme === 'dark' ? 'hover:bg-slate-800/30/80' : 'hover:bg-slate-50'}");

// Fix internal secondary text text-slate-400
c = c.replace(/text-slate-400/g, "${theme === 'dark' ? 'text-slate-400' : 'text-[#6C7383]'}");

// Generic table borders divide-slate-100 -> actually the divide needs conditional if it's there
c = c.replace(/divide-slate-100/g, "divide-slate-100/10"); // just soften it

// To make this dynamic formatting work inside className="..." we must use backticks
// I'll scan the file and update any className="... ${theme === 'dark' ..." to className={`... ${theme === ...
// To ensure we don't break existing template strings, I'll only replace ones that currently use double quotes but contain ${.
// Actually, earlier I injected literal template variables so I MUST convert enclosing quotes to backticks.

let blocks = c.split('className="');
for (let i = 1; i < blocks.length; i++) {
  let closingIdx = blocks[i].indexOf('"');
  if (closingIdx !== -1) {
    let cls = blocks[i].slice(0, closingIdx);
    if (cls.includes('${')) {
      blocks[i] = '`' + cls + '`' + blocks[i].slice(closingIdx + 1);
    } else {
      blocks[i] = '"' + blocks[i];
    }
  } else {
    blocks[i] = '"' + blocks[i];
  }
}
c = blocks.join('className=');

// The replacement above changed `<h3 className="text-xl font-bold ${...}">` into `<h3 className={`text-xl font-bold ${...}`}>` properly!

fs.writeFileSync('c:\\\\epos\\\\src\\\\components\\\\admin\\\\AdminPortal.tsx', c);
