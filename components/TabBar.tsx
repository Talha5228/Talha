
import React, { useRef, useState } from 'react';
import { Home, Plus, Settings, Grid, User, Layers } from 'lucide-react';
import { ViewState } from '../types';

interface TabBarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onOpenCreate: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({ currentView, onChangeView, onOpenCreate }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  // Spotlight Effect Logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);
  
  // Simple Haptic Helper
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10); // Light tap
    }
  };

  const NavButton = ({ view, icon: Icon, onClick, index }: { view?: ViewState, icon: any, onClick?: () => void, index: number }) => {
    // View varsa ve currentView ile eşleşiyorsa aktif kabul et
    const isActive = view ? currentView === view : false;
    
    // Tıklama işleyicisi
    const handleClick = () => {
        triggerHaptic();
        if (onClick) {
            onClick();
        } else if (view) {
            onChangeView(view);
        }
    };

    // Staggered Delay Calculation
    const animationClass = "animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-both";

    return (
      <button 
        onClick={handleClick}
        className={`group relative h-14 flex items-center justify-center w-full focus:outline-none ${animationClass}`}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Container for the spring animation on click */}
        <div className={`relative flex items-center justify-center w-full h-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-75 ${isActive ? 'scale-100' : 'group-hover:scale-105'}`}>
            
            {/* Active Background Pill (Glassy & Glowing & Breathing) */}
            <div className={`absolute w-12 h-12 rounded-[1.2rem] transition-all duration-500 ease-out ${
                isActive 
                ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)] scale-100 rotate-0 opacity-100 animate-pulse-slow' 
                : 'bg-transparent scale-50 rotate-12 opacity-0'
            }`}></div>

            {/* Icon Wrapper for independent movement */}
            <div className={`relative z-10 transition-all duration-500 ${
                isActive ? '-translate-y-1' : 'translate-y-0 group-hover:-translate-y-0.5'
            }`}>
                <Icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-all duration-300 ${
                        isActive 
                        ? 'text-white drop-shadow-[0_4px_8px_rgba(255,255,255,0.4)]' 
                        : 'text-gray-500 group-hover:text-gray-300'
                    }`} 
                />
            </div>
            
            {/* Subtle Active Indicator Dot (Morphing) */}
            <div className={`absolute bottom-2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)] transition-all duration-500 delay-100 ${
                isActive ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-2'
            }`}></div>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[340px] px-4 animate-in slide-in-from-bottom-10 duration-700 delay-200 ease-out">
      
      {/* 
         CONTAINER
         - Minimalist Dark Glass
         - Grid layout
         - Added 'overflow-hidden' for shine effect
      */}
      <div 
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="
            relative
            grid grid-cols-4 gap-1 p-1.5
            bg-[#0a0a0a]/60 backdrop-blur-3xl 
            rounded-[2.5rem] 
            border border-white/10
            shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)]
            ring-1 ring-white/5
            overflow-hidden
            group/spotlight
      ">
        
        {/* Spotlight Effect Layer */}
        <div
            className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 rounded-[2.5rem]"
            style={{
                opacity,
                background: `radial-gradient(120px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.1), transparent 100%)`,
            }}
        />

        {/* Subtle Ambient Shine passing through */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-200%] animate-[shimmer_5s_infinite] pointer-events-none"></div>

        {/* 1. Home */}
        <NavButton view={ViewState.HOME} icon={Home} index={0} />

        {/* 2. Projects */}
        <NavButton view={ViewState.PROJECTS} icon={Grid} index={1} />

        {/* 3. Create (Integrated Style - Gradient Squircle) */}
        <button 
            onClick={() => { triggerHaptic(); onOpenCreate(); }}
            className="group relative h-14 flex items-center justify-center w-full focus:outline-none animate-in slide-in-from-bottom-4 fade-in duration-700 fill-mode-both"
            style={{ animationDelay: '200ms' }}
        >
            <div className="relative w-12 h-12 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 group-hover:scale-105">
                {/* Gradient Background with Pulse */}
                <div className="absolute inset-0 rounded-[1.2rem] bg-gradient-to-tr from-blue-600 to-violet-600 opacity-90 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-white/10 animate-pulse-slow"></div>
                
                {/* Shine Effect inside button */}
                <div className="absolute inset-0 rounded-[1.2rem] bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none"></div>

                {/* Rotating Icon */}
                <Plus 
                    size={26} 
                    strokeWidth={2.5}
                    className="relative z-10 text-white drop-shadow-md transition-transform duration-500 group-hover:rotate-90" 
                />
            </div>
        </button>

        {/* 4. Profile/Settings */}
        <NavButton view={ViewState.PROFILE} icon={User} index={3} />

      </div>

      {/* Global Style for the shimmer animation which isn't in standard Tailwind */}
      <style>{`
        @keyframes shimmer {
            0% { transform: translateX(-200%) skewX(12deg); }
            20% { transform: translateX(200%) skewX(12deg); }
            100% { transform: translateX(200%) skewX(12deg); }
        }
      `}</style>
    </div>
  );
};
