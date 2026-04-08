const fs = require('fs');
let c = fs.readFileSync('c:\\\\epos\\\\src\\\\components\\\\admin\\\\AdminPortal.tsx', 'utf8');

// statusColors
c = c.replace(/approved: 'bg-green-100 text-green-700 border-green-200'/, "approved: 'bg-[#71C02B]/10 text-[#71C02B] border-[#71C02B]/20'");
c = c.replace(/pending: 'bg-yellow-100 text-yellow-700 border-yellow-200'/, "pending: 'bg-[#FFC100]/10 text-[#FFC100] border-[#FFC100]/20'");
c = c.replace(/rejected: 'bg-red-100 text-red-700 border-red-200'/, "rejected: 'bg-[#FF4747]/10 text-[#FF4747] border-[#FF4747]/20'");

// pending badges
c = c.replace(/bg-yellow-100 text-yellow-700/g, 'bg-[#FFC100]/10 text-[#FFC100] border-[#FFC100]/20');

// buttons
// Primary
c = c.replace(/bg-blue-600 hover:bg-blue-700 text-white/g, 'bg-[#F5A623] hover:bg-[#e0961b] text-white shadow-[#F5A623]/20');
c = c.replace(/bg-slate-800 hover:bg-slate-700 hover:bg-black text-white/g, 'bg-[#F5A623] hover:bg-[#e0961b] text-white shadow-[#F5A623]/20');
c = c.replace(/bg-slate-800 hover:bg-slate-700 text-white/g, 'bg-[#F5A623] hover:bg-[#e0961b] text-white shadow-[#F5A623]/20');

// Secondary
c = c.replace(/bg-slate-800\/80 hover:bg-slate-200 text-slate-300/g, 'bg-[#248AFD] hover:bg-[#1f7ae6] text-white border-transparent');

// Green
c = c.replace(/bg-green-50 text-green-600 rounded-md hover:bg-green-600/g, 'bg-[#71C02B]/10 text-[#71C02B] rounded-md hover:bg-[#71C02B]');
c = c.replace(/border-green-100/g, 'border-[#71C02B]/20');

// Red
c = c.replace(/bg-red-50 text-red-600 rounded-md hover:bg-red-600/g, 'bg-[#FF4747]/10 text-[#FF4747] rounded-md hover:bg-[#FF4747]');
c = c.replace(/bg-red-50 text-red-400 rounded-md hover:bg-red-600/g, 'bg-[#FF4747]/10 text-[#FF4747] rounded-md hover:bg-[#FF4747]');
c = c.replace(/border-red-100/g, 'border-[#FF4747]/20');

// Blue hover icon buttons to secondary
c = c.replace(/bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600/g, 'bg-[#248AFD]/10 text-[#248AFD] rounded-md hover:bg-[#248AFD]');
c = c.replace(/border-blue-100/g, 'border-[#248AFD]/20');

fs.writeFileSync('c:\\\\epos\\\\src\\\\components\\\\admin\\\\AdminPortal.tsx', c);
