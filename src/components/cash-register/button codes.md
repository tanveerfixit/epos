import React, { useState } from 'react';

const App = () => {
  const [activeTab, setActiveTab] = useState(0);
  const options = ['Card', 'Cash', 'Other'];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 font-sans">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {}
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">
          Payment Method
        </h2>

        {}
        <div className="relative bg-gray-100 p-1.5 rounded-full flex items-center w-full h-14 select-none mb-10">
          
          {}
          <div 
            className="absolute top-1.5 bottom-1.5 left-1.5 bg-white border-2 border-blue-500 rounded-full shadow-sm transition-all duration-300 ease-out z-0 overflow-hidden"
            style={{
              width: `calc((100% - 12px) / ${options.length})`,
              transform: `translateX(calc(${activeTab} * 100%))`
            }}
          >
            {/* Transparent Blue Overlay */}
            <div className="absolute inset-0 bg-blue-500/10" />
          </div>

          {}
          {options.map((option, index) => (
            <button
              key={option}
              onClick={() => setActiveTab(index)}
              className={`
                flex-1 relative z-10 h-full text-sm font-semibold transition-all duration-200 rounded-full
                ${activeTab === index 
                  ? 'text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/60'}
              `}
            >
              {option}
            </button>
          ))}
        </div>

        {}
        <div className="text-center w-full">
          <p className="text-gray-400 text-sm mb-1">Proceeding with</p>
          <div className="text-3xl font-bold text-gray-900 mb-8">
            {options[activeTab]}
          </div>
          
          <button className="w-full bg-black text-white py-4 rounded-full font-bold shadow-lg active:scale-[0.98] transition-transform">
            Confirm Selection
          </button>
        </div>

        {}
        <p className="mt-8 text-gray-400 text-xs italic">
          The white indicator slides smoothly between selections.
        </p>
      </div>
    </div>
  );
};

export default App;