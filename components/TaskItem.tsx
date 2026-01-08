
import React, { useState, useEffect, useMemo } from 'react';
import { MoreVertical, Edit2, Trash2, Zap, Target } from 'lucide-react';
import { AtomicTask } from '../types';

interface TaskItemProps {
  task: AtomicTask;
  color: string;
  onToggle: (taskId: number, x: number, y: number) => void;
  onEdit: (task: AtomicTask) => void;
  onDelete: (taskId: number) => void;
  onEnterFocus?: (task: AtomicTask) => void;
  onViewDetails?: (task: AtomicTask) => void;
}

// Sub-component for the explosion to keep main component clean
const ParticleExplosion = React.memo(({ color }: { color: string }) => {
    // Memoize particles to prevent regeneration on parent re-renders
    const particles = useMemo(() => Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        angle: Math.random() * 360,
        distance: 30 + Math.random() * 30, // Distance to fly
        size: 2 + Math.random() * 5, // Size
        delay: Math.random() * 0.15 // Delay
    })), []);

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full animate-particle-out"
                    style={{
                        backgroundColor: color,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        left: '50%',
                        top: '50%',
                        ['--tx' as any]: `${Math.cos(p.angle * Math.PI / 180) * p.distance}px`,
                        ['--ty' as any]: `${Math.sin(p.angle * Math.PI / 180) * p.distance}px`,
                        animationDelay: `${p.delay}s`
                    }}
                ></div>
            ))}
        </div>
    );
});

const TaskItemComponent: React.FC<TaskItemProps> = ({ task, color, onToggle, onEdit, onDelete, onEnterFocus, onViewDetails }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  // If task changes externally (e.g. from Detail view toggle), ensure animation state is clean
  useEffect(() => {
    if (!task.isCompleted) {
        setJustCompleted(false);
    }
  }, [task.isCompleted]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Trigger bounce animation
    setIsAnimating(true);
    
    // If we are completing the task (not un-completing)
    if (!task.isCompleted) {
        setJustCompleted(true);
        // Reset the flash effect after animation duration
        setTimeout(() => setJustCompleted(false), 600);
    }

    setTimeout(() => setIsAnimating(false), 300);
    onToggle(task.id, e.clientX, e.clientY);
  };

  return (
    <div className={`group relative mb-3 transition-all duration-500 ease-out ${
      task.isCompleted ? 'opacity-60 scale-[0.98]' : 'hover:translate-x-1'
    }`}>
      
      {/* 1. Glow Effect on Completion (Background) */}
      {task.isCompleted && (
          <div className="absolute inset-0 bg-white/5 rounded-[1.5rem] blur-xl transition-all duration-1000"></div>
      )}

      {/* iOS Style Card */}
      <div className={`relative overflow-hidden bg-white/5 border rounded-[1.5rem] p-4 flex items-center gap-4 transition-all duration-300 ${
          task.isCompleted ? 'border-transparent bg-white/5' : 'border-white/5 hover:bg-white/10'
      }`}>
        
        {/* 2. Success Flash Overlay (White flash when completed) */}
        {justCompleted && (
            <div className="absolute inset-0 z-10 animate-success-flash pointer-events-none mix-blend-overlay"></div>
        )}

        {/* Custom Round Checkbox */}
        <button 
          onClick={handleToggle}
          className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-20 ${
            isAnimating ? 'scale-75' : 'scale-100'
          } ${
            task.isCompleted 
              ? 'bg-transparent border-transparent' 
              : 'border-white/20 hover:border-white/40'
          }`}
          style={{ 
             backgroundColor: task.isCompleted ? color : 'transparent',
             borderColor: task.isCompleted ? color : undefined,
             boxShadow: task.isCompleted ? `0 0 15px ${color}66` : 'none'
          }}
        >
          {/* 3. Local Particle Explosion */}
          {justCompleted && <ParticleExplosion color={color} />}

          {/* 4. Shockwave Ring Animation */}
          {justCompleted && (
              <div className="absolute inset-0 rounded-full animate-shockwave" style={{ borderColor: color, borderWidth: '2px' }}></div>
          )}

          <div className={`transform transition-all duration-500 ${task.isCompleted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
             <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white stroke-[3px] stroke-current">
               <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          </div>
        </button>

        {/* Content (Clicking here now opens detail view) */}
        <div className="flex-1 min-w-0 cursor-pointer relative" onClick={() => onViewDetails && onViewDetails(task)}>
          
          <div className="relative mb-1 w-fit">
             <h4 className={`text-base font-semibold leading-tight transition-colors duration-300 ${
                task.isCompleted ? 'text-gray-500' : 'text-gray-100'
             }`}>
                {task.task_title}
             </h4>
             
             {/* 5. Animated Strikethrough Line */}
             <div 
                className="absolute top-1/2 left-0 h-[2px] bg-gray-500/80 rounded-full transition-all duration-500 ease-out pointer-events-none"
                style={{ 
                    width: task.isCompleted ? '110%' : '0%', 
                    transform: 'translateY(-50%)' 
                }}
             ></div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-black/70 flex items-center gap-1 transition-opacity ${task.isCompleted ? 'opacity-50' : 'opacity-100'}`} style={{ backgroundColor: color }}>
               <Zap size={10} fill="currentColor" /> {task.xp_weight} PTS
            </span>
            {task.description && (
                <span className="text-xs text-gray-500 truncate max-w-[150px]">{task.description}</span>
            )}
            {/* Intel Indicator */}
            {task.ai_tip && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            )}
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="relative z-20 flex items-center gap-1">
             
             {/* Focus Button */}
             {!task.isCompleted && onEnterFocus && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onEnterFocus(task); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    title="Enter Focus Mode"
                >
                    <Target size={18} />
                </button>
             )}

             <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
                <MoreVertical size={18} />
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-32 glass-modal rounded-xl shadow-2xl z-30 p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 border border-white/10 bg-[#0f172a]">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(task); }}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
                        >
                            <Edit2 size={12} /> <span>Edit</span>
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(task.id); }}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={12} /> <span>Delete</span>
                        </button>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

// Optimized Export using React.memo for high performance lists
export const TaskItem = React.memo(TaskItemComponent, (prev, next) => {
    return (
        prev.task.id === next.task.id &&
        prev.task.isCompleted === next.task.isCompleted &&
        prev.task.task_title === next.task.task_title &&
        prev.task.description === next.task.description &&
        prev.task.xp_weight === next.task.xp_weight &&
        prev.color === next.color &&
        // If these function references change (which they shouldn't if parent uses useCallback), we re-render
        // Ideally they should be stable.
        prev.task.ai_tip === next.task.ai_tip
    );
});
