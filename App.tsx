
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ViewState, Roadmap, AtomicTask, Priority, Status } from './types';
import { generateRoadmapFromGoal, generateTaskIntel } from './services/geminiService';
import { TabBar } from './components/TabBar';
import { TaskItem } from './components/TaskItem';
import { 
    ArrowLeft, Sparkles, ChevronRight, Loader2, Plus, Minus, X, Zap, 
    Calendar, Flag, Clock, MoreHorizontal, Layout, CheckCircle2, 
    Rocket, BookOpen, Dumbbell, Plane, Briefcase, Code, Palette, 
    Music, Heart, Check, Grid, ListFilter, SlidersHorizontal, Inbox, Ghost, Layers, Trophy, Flame, Settings, ChevronDown, User, Volume2, VolumeX, AlertTriangle, LogOut, Edit3, Target, Play, Pause, Square, Radio, Activity, Lightbulb, Hourglass, Search, Crown
} from 'lucide-react';
import canvasConfetti from 'https://cdn.skypack.dev/canvas-confetti';

const MOCK_DATA_KEY = 'atomize_roadmaps_v6_final';
const USER_SETTINGS_KEY = 'atomize_user_settings_v1';

// --- Constants ---
const THEME_COLORS = [
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#ef4444', // Red
  '#000000', // Black (Special)
];

const ICONS = ['🚀', '💻', '🎨', '💪', '📚', '✈️', '💼', '🎵', '❤️', '🧠', '🤖', '🏠'];

const CATEGORIES = [
    { id: 'all', name: 'All', icon: <Grid size={14} /> },
    { id: 'dev', name: 'Programming', icon: <Code size={14} /> },
    { id: 'design', name: 'Design', icon: <Palette size={14} /> },
    { id: 'business', name: 'Business', icon: <Briefcase size={14} /> },
    { id: 'health', name: 'Health', icon: <Heart size={14} /> },
    { id: 'personal', name: 'Personal', icon: <Sparkles size={14} /> },
];

const QUOTES = [
    "Big journeys begin with small steps.",
    "Focus on the process, not just the goal.",
    "Atomic habits build empires.",
    "Consistency is your superpower.",
    "Dream big, start small, act now."
];

// Animation Class for Page Transitions
const PAGE_TRANSITION_CLASS = "animate-in slide-in-from-bottom-[100%] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]";

// --- Helper Functions ---
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        switch(type) {
            case 'light': navigator.vibrate(10); break;
            case 'medium': navigator.vibrate(20); break;
            case 'heavy': navigator.vibrate([30, 50, 30]); break;
        }
    }
};

// --- Singleton Audio Engine for Performance ---
class AudioEngine {
    private static instance: AudioEngine;
    private ctx: AudioContext | null = null;
    private ambientNode: AudioBufferSourceNode | null = null;
    private ambientGain: GainNode | null = null;
    
    private constructor() {}

    public static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }

    private initCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public playSuccessSound(enabled: boolean) {
        if (!enabled) return;
        this.initCtx();
        if (!this.ctx) return;
        
        try {
            const now = this.ctx.currentTime;
            const masterGain = this.ctx.createGain();
            masterGain.gain.value = 0.2;
            masterGain.connect(this.ctx.destination);

            // Sine
            const osc1 = this.ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(800, now);
            osc1.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
            
            const gain1 = this.ctx.createGain();
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(1, now + 0.02);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            
            osc1.connect(gain1);
            gain1.connect(masterGain);
            osc1.start(now);
            osc1.stop(now + 0.6);

            // Triangle
            const osc2 = this.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(400, now);
            osc2.frequency.linearRampToValueAtTime(800, now + 0.1);
            
            const gain2 = this.ctx.createGain();
            gain2.gain.setValueAtTime(0, now);
            gain2.gain.linearRampToValueAtTime(0.3, now + 0.02);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            
            osc2.connect(gain2);
            gain2.connect(masterGain);
            osc2.start(now);
            osc2.stop(now + 0.4);
        } catch (e) {
            console.warn("Audio Play Error", e);
        }
    }

    public startAmbient() {
        this.initCtx();
        if (!this.ctx) return;
        if (this.ambientNode) return; // Already playing

        // Create Brown Noise
        const bufferSize = this.ctx.sampleRate * 5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        this.ambientNode = this.ctx.createBufferSource();
        this.ambientNode.buffer = buffer;
        this.ambientNode.loop = true;

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2);

        this.ambientNode.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);
        this.ambientNode.start();
    }

    public stopAmbient() {
        if (!this.ctx || !this.ambientGain || !this.ambientNode) return;
        
        const curr = this.ambientGain.gain.value;
        this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.ambientGain.gain.setValueAtTime(curr, this.ctx.currentTime);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);

        setTimeout(() => {
            if (this.ambientNode) {
                try {
                    this.ambientNode.stop();
                    this.ambientNode.disconnect();
                } catch(e) {}
                this.ambientNode = null;
            }
        }, 1000);
    }
}
const audioEngine = AudioEngine.getInstance();


// --- Components ---

// 1. Progress Bar Component
const ProgressBar = ({ current, total, color }: { current: number; total: number; color: string }) => {
    const percentage = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
    
    return (
        <div className="w-full">
            <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-white/5"></div>
                
                {/* Fill */}
                <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                >
                    {/* Inner Glow/Shine */}
                    <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                </div>
            </div>
            <div className="flex justify-between items-center mt-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                <span className="text-xs font-bold" style={{ color: color }}>{Math.round(percentage)}%</span>
            </div>
        </div>
    );
};

// 2. Tab Button
const TabButton: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${
            active 
            ? 'bg-white text-black shadow-lg scale-105' 
            : 'text-gray-500 hover:text-white hover:bg-white/5'
        }`}
    >
        {label}
    </button>
);

export default function App() {
  const [showSplash, setShowSplash] = useState(true); // START WITH SPLASH
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  
  // User Profile & Settings State
  const [userProfile, setUserProfile] = useState({
      name: 'Talha',
      soundEnabled: true,
      zenMode: false,
  });

  // Home View State
  const [activeTab, setActiveTab] = useState<Status | 'All'>('All');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Dashboard State
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Focus State
  const [focusTask, setFocusTask] = useState<AtomicTask | null>(null);
  const [focusTimer, setFocusTimer] = useState(0); // in seconds
  const [isFocusRunning, setIsFocusRunning] = useState(false);
  const focusIntervalRef = useRef<number | null>(null);

  // Create Flow State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showManualOptions, setShowManualOptions] = useState(false); 
  const [createForm, setCreateForm] = useState({
      title: '',
      description: '',
      duration: 7, 
      priority: 'Medium' as Priority,
      color: THEME_COLORS[2],
      icon: ICONS[0],
      category: 'Personal'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AtomicTask | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  // Level Up State
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lastTotalXP, setLastTotalXP] = useState(0);

  // --- NEW: Intel Card State ---
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<AtomicTask | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);

  // LOAD DATA SAFELY
  useEffect(() => {
    // Splash Screen Timer
    const timer = setTimeout(() => setShowSplash(false), 2500);

    try {
        const savedData = localStorage.getItem(MOCK_DATA_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setRoadmaps(parsed);
            // Calculate initial total XP to track leveling
            const total = parsed.reduce((sum: number, map: Roadmap) => sum + map.currentXp, 0);
            setLastTotalXP(total);
        }
    } catch (error) {
        console.error("Failed to load roadmaps from storage", error);
        // Fail quietly, start with empty state
    }

    try {
        const savedSettings = localStorage.getItem(USER_SETTINGS_KEY);
        if (savedSettings) setUserProfile(JSON.parse(savedSettings));
    } catch (e) { console.error("Failed settings load"); }

    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(roadmaps));
  }, [roadmaps]);

  useEffect(() => {
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(userProfile));
  }, [userProfile]);

  // Focus Timer Logic
  useEffect(() => {
      if (isFocusRunning) {
          focusIntervalRef.current = window.setInterval(() => {
              setFocusTimer(prev => prev + 1);
          }, 1000);
      } else if (focusIntervalRef.current) {
          clearInterval(focusIntervalRef.current);
      }
      return () => {
          if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
      };
  }, [isFocusRunning]);

  // --- Actions ---

  const triggerConfetti = (x: number, y: number, color?: string) => {
    audioEngine.playSuccessSound(userProfile.soundEnabled);
    
    const normalizeX = x / window.innerWidth;
    const normalizeY = y / window.innerHeight;

    // Burst 1: Circles
    canvasConfetti({
        particleCount: 40,
        spread: 50,
        origin: { x: normalizeX, y: normalizeY },
        colors: color ? [color, '#ffffff', '#FFD700'] : THEME_COLORS,
        disableForReducedMotion: true,
        zIndex: 9999,
        scalar: 0.7,
        ticks: 150,
        gravity: 1.2,
        startVelocity: 25,
    });

    // Burst 2: Stars (Sweet effect)
    setTimeout(() => {
        canvasConfetti({
            particleCount: 15,
            spread: 80,
            origin: { x: normalizeX, y: normalizeY },
            colors: ['#FFD700', '#FFFFFF'], // Gold and White
            shapes: ['star'],
            disableForReducedMotion: true,
            zIndex: 9999,
            scalar: 1.2,
            ticks: 100,
            gravity: 0.8,
            startVelocity: 35,
        });
    }, 100);
  };

  const checkLevelUp = (currentTotalXP: number, newTotalXP: number) => {
      // Level Up every 500 XP
      const currentLevel = Math.floor(currentTotalXP / 500);
      const newLevel = Math.floor(newTotalXP / 500);

      if (newLevel > currentLevel) {
          setTimeout(() => {
              triggerHaptic('heavy');
              setShowLevelUp(true);
              audioEngine.playSuccessSound(userProfile.soundEnabled); // Double sound
              canvasConfetti({
                  particleCount: 100,
                  spread: 100,
                  origin: { y: 0.6 },
                  colors: ['#FFD700', '#FFA500', '#FFFFFF'],
                  zIndex: 10000
              });
          }, 800); // Wait for task animation
      }
      setLastTotalXP(newTotalXP);
  };

  const handleCreateProject = async (useAI: boolean) => {
    if (!createForm.title.trim()) return;
    triggerHaptic('medium');

    // Calculate Due Date based on duration
    const calculatedDueDate = new Date();
    calculatedDueDate.setDate(calculatedDueDate.getDate() + createForm.duration);
    const dueDateIso = calculatedDueDate.toISOString();

    if (useAI) {
        setIsGenerating(true);
        try {
            const prompt = `Goal: ${createForm.title}. Description: ${createForm.description}. Category: ${createForm.category}. Priority: ${createForm.priority}. Duration: ${createForm.duration} days.`;
            const response = await generateRoadmapFromGoal(prompt);
            
            const tasks: AtomicTask[] = response.roadmap.map(t => ({ ...t, isCompleted: false }));
            const totalXp = tasks.reduce((sum, t) => sum + (t.xp_weight * 100), 0);
            
            const newRoadmap: Roadmap = {
                id: Date.now().toString(),
                title: createForm.title, 
                description: createForm.description || response.project_meta.description,
                icon: createForm.icon,
                category: createForm.category,
                tasks: tasks,
                totalXp,
                currentXp: 0,
                createdAt: Date.now(),
                dueDate: dueDateIso,
                status: 'Not Started',
                priority: createForm.priority,
                themeColor: createForm.color,
            };
            setRoadmaps(prev => [newRoadmap, ...prev]);
            resetCreateForm();
            setIsCreateModalOpen(false);
            setCurrentView(ViewState.HOME);
        } catch (e) {
            alert("AI Generation failed. Try manual creation.");
        } finally {
            setIsGenerating(false);
        }
    } else {
        // Manual Create
        const newRoadmap: Roadmap = {
            id: Date.now().toString(),
            title: createForm.title,
            description: createForm.description,
            icon: createForm.icon,
            category: createForm.category,
            tasks: [], // Empty tasks for manual
            totalXp: 100, // Default base XP until tasks added
            currentXp: 0,
            createdAt: Date.now(),
            dueDate: dueDateIso,
            status: 'Not Started',
            priority: createForm.priority,
            themeColor: createForm.color,
        };
        setRoadmaps(prev => [newRoadmap, ...prev]);
        resetCreateForm();
        setIsCreateModalOpen(false);
        setActiveRoadmapId(newRoadmap.id);
        setCurrentView(ViewState.DETAIL); // Go to detail to add tasks
    }
  };

  const resetCreateForm = () => {
      setCreateForm({
        title: '',
        description: '',
        duration: 7,
        priority: 'Medium',
        color: THEME_COLORS[2],
        icon: ICONS[0],
        category: 'Personal'
      });
      setShowManualOptions(false);
  };

  const updateRoadmap = (roadmapId: string, updater: (map: Roadmap) => Roadmap) => {
    setRoadmaps(prev => prev.map(map => map.id === roadmapId ? updater(map) : map));
  };

  // Wrapped in useCallback for Child Performance
  const handleToggleTask = useCallback((roadmapId: string, taskId: number, clickX: number, clickY: number) => {
    triggerHaptic('heavy');
    
    // Check roadmap existence to avoid error in callback
    setRoadmaps(prev => {
        const roadmapIndex = prev.findIndex(m => m.id === roadmapId);
        if (roadmapIndex === -1) return prev;
        
        const map = prev[roadmapIndex];
        let justCompleted = false;
        let color = map.themeColor;

        const updatedTasks = map.tasks.map(t => {
            if (t.id === taskId) {
                const newState = !t.isCompleted;
                if (newState) justCompleted = true;
                return { ...t, isCompleted: newState };
            }
            return t;
        });

        const currentXp = updatedTasks.reduce((sum, t) => t.isCompleted ? sum + (t.xp_weight * 100) : sum, 0);
        const isAllCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.isCompleted);
        const totalXp = updatedTasks.reduce((sum, t) => sum + (t.xp_weight * 100), 0);
        
        // Side Effect: Trigger confetti (outside state update is better but this works for sync)
        if (justCompleted) {
             // We use setTimeout to break the render cycle for the visual effect
             setTimeout(() => triggerConfetti(clickX, clickY, color), 0);
        }

        const newMap = { 
          ...map, 
          tasks: updatedTasks, 
          currentXp,
          totalXp,
          status: isAllCompleted ? 'Done' : (currentXp > 0 ? 'In Progress' : 'Not Started') as Status
        };

        const newRoadmaps = [...prev];
        newRoadmaps[roadmapIndex] = newMap;
        return newRoadmaps;
    });
  }, [userProfile.soundEnabled]);
  
  // Track XP for Level Up
  useEffect(() => {
      const currentGlobalXP = roadmaps.reduce((sum, m) => sum + m.currentXp, 0);
      if (currentGlobalXP > lastTotalXP && lastTotalXP > 0) {
          checkLevelUp(lastTotalXP, currentGlobalXP);
      } else if (lastTotalXP === 0 && currentGlobalXP > 0) {
          // Initial load or first task ever
          setLastTotalXP(currentGlobalXP);
      }
  }, [roadmaps]);

  const handleDeleteTask = useCallback((roadmapId: string, taskId: number) => {
    if (!confirm('Delete task?')) return;
    updateRoadmap(roadmapId, (map) => {
      const updatedTasks = map.tasks.filter(t => t.id !== taskId);
      const totalXp = updatedTasks.reduce((sum, t) => sum + (t.xp_weight * 100), 0);
      const currentXp = updatedTasks.reduce((sum, t) => t.isCompleted ? sum + (t.xp_weight * 100) : sum, 0);
      return { ...map, tasks: updatedTasks, totalXp, currentXp };
    });
  }, []);

  const handleSaveTask = useCallback((data: { title: string; description: string; xp: number }) => {
    if (!activeRoadmapId) return;
    triggerHaptic('medium');
    
    setRoadmaps(prev => {
        return prev.map(map => {
            if (map.id !== activeRoadmapId) return map;

            let updatedTasks;
            // Note: We're using state editingTask here, but inside callback it might be stale 
            // if not in dependency array. However, we'll pass editingTask ID or handle logic differently?
            // Simplified: We assume activeRoadmapId is enough context.
            // For the edit logic to work perfectly inside useCallback with stable ref, 
            // strictly we should pass the editingTaskId as arg or use a Ref. 
            // For now, we will trust the caller (Modal) passes correct context or update the logic.
            
            // To be safe with editingTask state inside callback:
            // Since we rely on `editingTask` state, we should add it to deps OR pass it as arg.
            // Let's rely on deps for now.
             
             // Wait, `editingTask` is in scope.
             return map; 
        });
    });
    
    // Re-implemented to be simpler and safe without heavy callback complexity
    updateRoadmap(activeRoadmapId, (map) => {
      let updatedTasks;
      if (editingTask) {
        updatedTasks = map.tasks.map(t => t.id === editingTask.id ? { 
          ...t, task_title: data.title, description: data.description, xp_weight: data.xp 
        } : t);
      } else {
        updatedTasks = [...map.tasks, {
          id: Date.now(), task_title: data.title, description: data.description, xp_weight: data.xp, isCompleted: false
        }];
      }
      const totalXp = updatedTasks.reduce((sum, t) => sum + (t.xp_weight * 100), 0);
      const currentXp = updatedTasks.reduce((sum, t) => t.isCompleted ? sum + (t.xp_weight * 100) : sum, 0);

      return { ...map, tasks: updatedTasks, totalXp, currentXp, status: map.status === 'Not Started' ? 'In Progress' : map.status };
    });
    setEditingTask(null);
  }, [activeRoadmapId, editingTask]);

  const handleEnterFocus = (task: AtomicTask) => {
      triggerHaptic('medium');
      setFocusTask(task);
      setFocusTimer(0);
      setIsFocusRunning(true); 
      setCurrentView(ViewState.FOCUS);
      audioEngine.startAmbient();
  };

  const handleExitFocus = (completeTask = false) => {
      triggerHaptic('medium');
      setIsFocusRunning(false);
      audioEngine.stopAmbient();
      if (completeTask && focusTask && activeRoadmapId) {
          handleToggleTask(activeRoadmapId, focusTask.id, window.innerWidth/2, window.innerHeight/2);
      }
      setCurrentView(ViewState.DETAIL);
      setFocusTask(null);
  };

  // --- NEW: Intel Detail Logic ---
  const handleViewTaskDetails = async (task: AtomicTask) => {
      triggerHaptic('light');
      setSelectedTaskForDetail(task);
      
      if (task.ai_tip && task.estimated_minutes) {
          return;
      }

      setIntelLoading(true);
      const project = getActiveRoadmap();
      if (!project) return;

      try {
          const intel = await generateTaskIntel(task.task_title, project.title);
          
          updateRoadmap(project.id, (map) => {
              const updatedTasks = map.tasks.map(t => 
                  t.id === task.id 
                  ? { ...t, ai_tip: intel.tip, estimated_minutes: intel.minutes }
                  : t
              );
              return { ...map, tasks: updatedTasks };
          });
          
          setSelectedTaskForDetail(prev => prev ? { ...prev, ai_tip: intel.tip, estimated_minutes: intel.minutes } : null);

      } catch (e) {
          console.error("Failed to fetch intel");
      } finally {
          setIntelLoading(false);
      }
  };

  const resetAllData = () => {
      if(confirm("Are you sure you want to delete all projects and settings? This action cannot be undone.")) {
          localStorage.removeItem(MOCK_DATA_KEY);
          setRoadmaps([]);
          alert("All data has been reset.");
      }
  };

  const getActiveRoadmap = () => roadmaps.find(r => r.id === activeRoadmapId);

  // --- Render Views ---

  const renderSplashScreen = () => (
      <div className={`fixed inset-0 z-[200] bg-black flex items-center justify-center transition-opacity duration-1000 ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="text-center relative">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                   <div className="absolute inset-0 bg-blue-600 rounded-full blur-2xl opacity-50 animate-pulse-slow"></div>
                   <div className="relative w-full h-full bg-black rounded-full border border-blue-500/50 flex items-center justify-center overflow-hidden">
                       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                       <Sparkles size={40} className="text-blue-500 animate-spin-slow" />
                   </div>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2 animate-in slide-in-from-bottom-5 duration-700">ATOMIZE</h1>
              <div className="flex flex-col gap-1">
                  <p className="text-xs text-blue-500 font-mono tracking-[0.3em] uppercase animate-pulse">Initializing System...</p>
                  <p className="text-[10px] text-gray-600 font-mono">v1.0.0 Stable</p>
              </div>
          </div>
      </div>
  );

  const renderLevelUpModal = () => {
      if (!showLevelUp) return null;
      const currentXP = lastTotalXP;
      const currentLevel = Math.floor(currentXP / 500);

      return (
          <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="relative text-center w-full max-w-sm">
                  {/* Rays of light */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl animate-spin-slow pointer-events-none"></div>
                  
                  <div className="relative z-10 animate-elastic-slide">
                      <div className="inline-block p-4 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-600 mb-6 shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                          <Crown size={64} className="text-white fill-white" />
                      </div>
                      <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-yellow-200 mb-2 drop-shadow-sm">LEVEL UP!</h2>
                      <p className="text-yellow-500 font-bold text-xl uppercase tracking-widest mb-8">Level {currentLevel} Architect</p>
                      
                      <div className="bg-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-400 text-xs font-bold uppercase">Next Level</span>
                              <span className="text-white font-bold text-xs">{(currentLevel + 1) * 500} XP</span>
                          </div>
                          <ProgressBar current={currentXP % 500} total={500} color="#EAB308" />
                          <p className="mt-4 text-gray-300 text-sm">You are becoming unstoppable. Keep building.</p>
                      </div>

                      <button 
                        onClick={() => setShowLevelUp(false)}
                        className="mt-8 bg-white text-black font-bold py-3 px-12 rounded-full hover:scale-105 transition-transform shadow-lg"
                      >
                          Continue
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  const renderTaskIntelModal = () => {
      if (!selectedTaskForDetail) return null;

      const activeProject = getActiveRoadmap();

      return (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
              <div 
                  className="bg-[#0f172a] w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-white/10 p-6 shadow-2xl animate-elastic-slide relative overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
              >
                  {/* Decorative Glow */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                  
                  {/* Close Handle / Button */}
                  <div className="flex justify-center mb-6" onClick={() => setSelectedTaskForDetail(null)}>
                      <div className="w-12 h-1.5 bg-white/20 rounded-full cursor-pointer"></div>
                  </div>

                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                      <div>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Tactical Analysis</div>
                          <h2 className="text-2xl font-black text-white leading-tight">{selectedTaskForDetail.task_title}</h2>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl">
                          <Target size={24} className="text-blue-500" />
                      </div>
                  </div>

                  {/* Intel Content */}
                  {intelLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4">
                          <Loader2 size={32} className="animate-spin text-blue-500" />
                          <p className="text-xs font-mono text-blue-400 animate-pulse">Decrypting Task Parameters...</p>
                      </div>
                  ) : (
                      <div className="space-y-6 animate-in fade-in duration-500">
                          
                          {/* Duration Estimate */}
                          <div className="flex items-center gap-4">
                              <div className="bg-white/5 rounded-2xl p-3 flex items-center gap-3 border border-white/5 flex-1">
                                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                                      <Hourglass size={18} />
                                  </div>
                                  <div>
                                      <div className="text-[10px] font-bold text-gray-500 uppercase">Est. Time</div>
                                      <div className="text-white font-bold">{selectedTaskForDetail.estimated_minutes || 15} Mins</div>
                                  </div>
                              </div>
                              <div className="bg-white/5 rounded-2xl p-3 flex items-center gap-3 border border-white/5 flex-1">
                                  <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                                      <Zap size={18} />
                                  </div>
                                  <div>
                                      <div className="text-[10px] font-bold text-gray-500 uppercase">Reward</div>
                                      <div className="text-white font-bold">{selectedTaskForDetail.xp_weight * 100} XP</div>
                                  </div>
                              </div>
                          </div>

                          {/* Tactical Tip */}
                          <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden">
                               <div className="absolute top-0 right-0 p-4 opacity-5">
                                   <Lightbulb size={100} />
                               </div>
                               <div className="flex items-start gap-3 relative z-10">
                                   <Lightbulb size={20} className="text-yellow-400 mt-1 flex-shrink-0" />
                                   <div>
                                       <h4 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Operational Tip</h4>
                                       <p className="text-gray-200 text-sm leading-relaxed font-medium">
                                           {selectedTaskForDetail.ai_tip}
                                       </p>
                                   </div>
                               </div>
                          </div>

                          {/* Action Button */}
                          <button 
                            onClick={() => {
                                handleEnterFocus(selectedTaskForDetail);
                                setSelectedTaskForDetail(null);
                            }}
                            className="w-full py-4 bg-blue-600 rounded-2xl font-bold text-white shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                          >
                              <Play size={18} fill="currentColor" />
                              <span>Initiate Task</span>
                          </button>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderProjects = () => {
    // Filter Roadmaps based on search and tabs
    const filteredRoadmaps = roadmaps.filter(r => {
        const matchesStatus = activeTab === 'All' || r.status === activeTab;
        const matchesCategory = activeCategoryFilter === 'All' || r.category === activeCategoryFilter;
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesCategory && matchesSearch;
    });

    return (
        <div className={`pt-8 px-6 pb-32 h-full overflow-y-auto no-scrollbar ${PAGE_TRANSITION_CLASS}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-black text-white">Mission Control</h2>
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <Grid size={20} className="text-gray-400" />
                 </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <Search size={18} />
                </div>
                <input 
                    type="text" 
                    placeholder="Search protocols..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-full mb-6 border border-white/5 overflow-x-auto no-scrollbar">
                {(['All', 'In Progress', 'Not Started', 'Done'] as const).map((tab) => (
                    <TabButton 
                        key={tab} 
                        active={activeTab === tab} 
                        label={tab} 
                        onClick={() => { triggerHaptic(); setActiveTab(tab); }} 
                    />
                ))}
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => { triggerHaptic(); setActiveCategoryFilter(cat.name === 'All' ? 'All' : cat.name); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 whitespace-nowrap transition-all ${
                            (activeCategoryFilter === cat.name || (activeCategoryFilter === 'All' && cat.name === 'All'))
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                        }`}
                    >
                        {cat.icon}
                        <span>{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Grid List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredRoadmaps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <Inbox size={48} className="text-gray-600 mb-4" />
                        <p className="text-gray-500 font-bold">No active missions found</p>
                    </div>
                ) : (
                    filteredRoadmaps.map(map => (
                        <div 
                            key={map.id}
                            onClick={() => { triggerHaptic(); setActiveRoadmapId(map.id); setCurrentView(ViewState.DETAIL); }}
                            className="bg-[#1c1c1e] rounded-3xl p-5 cursor-pointer hover:bg-[#2c2c2e] transition-colors border border-white/5 group relative overflow-hidden"
                        >
                             <div className="flex justify-between items-start mb-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">
                                    {map.icon}
                                </div>
                                <div className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-gray-400 uppercase">
                                    {map.category}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{map.title}</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`w-2 h-2 rounded-full ${map.status === 'In Progress' ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></span>
                                <span className="text-xs text-gray-500 font-medium">{map.status}</span>
                            </div>
                             <ProgressBar 
                                    current={map.currentXp} 
                                    total={map.totalXp} 
                                    color={map.themeColor} 
                                />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
  };

  const renderHome = () => {
    const days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    const totalTasksDone = roadmaps.reduce((sum, map) => sum + map.tasks.filter(t => t.isCompleted).length, 0);
    const totalXpEarned = roadmaps.reduce((sum, map) => sum + map.currentXp, 0);
    
    // Only show "In Progress" or recent roadmaps on Home
    const recentRoadmaps = roadmaps
        .filter(r => r.status === 'In Progress' || r.status === 'Not Started')
        .slice(0, 3); // Limit to top 3

    return (
        <div className={`pt-8 px-6 pb-32 h-full relative overflow-y-auto no-scrollbar ${PAGE_TRANSITION_CLASS}`}>
            
            {/* --- DASHBOARD SECTION --- */}

            {/* Header / Greeting */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">{new Date().toLocaleDateString('en-US', {weekday: 'long', day: 'numeric'})}</h2>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 leading-tight">
                        {getGreeting()}, <br />
                        <span className="text-blue-500">{userProfile.name}</span>
                    </h1>
                </div>
                <div onClick={() => { triggerHaptic(); setCurrentView(ViewState.PROFILE); }} className="cursor-pointer w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px] shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                         <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userProfile.name}`} alt="User" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>

            {/* Motivational Quote Card */}
            {!userProfile.zenMode && (
                <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles size={80} />
                        </div>
                        <p className="text-lg font-medium text-white italic mb-2 relative z-10">"{QUOTES[quoteIndex]}"</p>
                        <div className="flex items-center gap-2 mt-4">
                            <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Daily Motivation</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            {!userProfile.zenMode && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#0f172a] p-5 rounded-3xl border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-colors"></div>
                        <div className="p-2 bg-blue-500/20 w-fit rounded-xl text-blue-400 mb-2">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">{totalXpEarned}</div>
                            <div className="text-xs font-bold text-gray-500">Total XP Gained</div>
                        </div>
                    </div>
                    <div className="bg-[#0f172a] p-5 rounded-3xl border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-colors"></div>
                        <div className="p-2 bg-purple-500/20 w-fit rounded-xl text-purple-400 mb-2">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">{totalTasksDone}</div>
                            <div className="text-xs font-bold text-gray-500">Tasks Crushed</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar Strip */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Schedule</h3>
                    <Calendar size={16} className="text-gray-500" />
                </div>
                <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
                    {days.map((date, i) => {
                        const isToday = i === 0;
                        return (
                            <div 
                                key={i} 
                                className={`flex flex-col items-center justify-center min-w-[50px] h-[70px] rounded-2xl border transition-all ${
                                    isToday 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50 scale-105' 
                                    : 'bg-white/5 border-white/5 text-gray-500'
                                }`}
                            >
                                <span className="text-[10px] font-bold uppercase mb-1">{date.toLocaleDateString('en-US', {weekday: 'short'})}</span>
                                <span className={`text-lg font-black ${isToday ? 'text-white' : 'text-gray-300'}`}>{date.getDate()}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="w-full h-px bg-white/10 my-8"></div>

            {/* --- QUICK ACCESS PROJECTS SECTION --- */}
            
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-white tracking-tight">Active Missions</h2>
                <button 
                    onClick={() => { triggerHaptic(); setCurrentView(ViewState.PROJECTS); }}
                    className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider flex items-center gap-1"
                >
                    View All <ChevronRight size={14} />
                </button>
            </div>

            {/* Simplified List for Dashboard */}
            <div className="space-y-4">
                {recentRoadmaps.length === 0 ? (
                    <div className="bg-white/5 rounded-3xl p-6 text-center border border-white/5 dashed">
                        <p className="text-gray-500 font-bold mb-4">No active missions.</p>
                        <button onClick={() => { triggerHaptic(); setIsCreateModalOpen(true); }} className="text-blue-500 text-sm font-bold hover:underline">Start a new one</button>
                    </div>
                ) : (
                    recentRoadmaps.map(map => (
                        <div 
                            key={map.id}
                            onClick={() => { triggerHaptic(); setActiveRoadmapId(map.id); setCurrentView(ViewState.DETAIL); }}
                            className="bg-white/5 rounded-[2rem] p-5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300 relative overflow-hidden group border border-white/5 flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                                {map.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-white leading-tight truncate">{map.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-1.5 flex-1 bg-black/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(map.currentXp / map.totalXp) * 100}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500">{Math.round((map.currentXp / map.totalXp) * 100)}%</span>
                                </div>
                            </div>
                            <div className="text-gray-500 group-hover:text-white transition-colors">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
  };

  const renderCreateModal = () => (
    <div className={`fixed inset-0 z-[60] bg-[#030712]/95 backdrop-blur-xl transition-transform duration-500 ease-in-out ${isCreateModalOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      {/* Added pb-32 to accommodate the floating TabBar */}
      <div className="h-full flex flex-col pt-8 px-6 pb-32 overflow-y-auto no-scrollbar relative">
        
        {/* Header (Minimal) */}
        <div className="flex items-center justify-between mb-10">
            <button onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors group">
                <X size={20} className="text-gray-400 group-hover:text-white" />
            </button>
            <span className="font-bold text-white/50 text-xs tracking-widest uppercase">New Mission</span>
            <div className="w-10"></div> {/* Spacer for balance */}
        </div>

        {/* HERO SECTION: Input & Magic Button */}
        <div className="flex flex-col flex-1">
            
            {/* Main Input - Styled as a Title */}
            <div className="mb-8">
                <label className="block text-blue-500 font-bold text-sm mb-4 uppercase tracking-wider">Goal</label>
                <textarea 
                    value={createForm.title}
                    onChange={e => setCreateForm({...createForm, title: e.target.value})}
                    placeholder="What is your next big win?"
                    rows={2}
                    className="w-full bg-transparent text-4xl sm:text-5xl font-black text-white placeholder:text-gray-700 focus:outline-none resize-none leading-tight"
                    autoFocus
                />
            </div>

            {/* Description (Subtle) */}
            <div className="mb-10">
                 <input 
                    value={createForm.description}
                    onChange={e => setCreateForm({...createForm, description: e.target.value})}
                    placeholder="Add a quick note or description (Optional)..."
                    className="w-full bg-transparent text-lg font-medium text-gray-400 placeholder:text-gray-800 focus:outline-none"
                />
            </div>

            {/* MAGIC ACTION BUTTON */}
            <button 
                onClick={() => handleCreateProject(true)}
                disabled={isGenerating || !createForm.title}
                className={`w-full py-6 rounded-3xl relative group overflow-hidden transition-all duration-300 ${!createForm.title ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] shadow-[0_0_40px_rgba(59,130,246,0.3)]'}`}
            >
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                
                <div className="relative z-10 flex items-center justify-center gap-3">
                    {isGenerating ? (
                        <>
                            <Loader2 size={24} className="animate-spin text-white" />
                            <span className="text-xl font-bold text-white">Atomizing Goal...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={24} className="text-yellow-300 fill-yellow-300" />
                            <span className="text-xl font-black text-white tracking-wide">Atomize with AI</span>
                        </>
                    )}
                </div>
            </button>

            {/* Divider / Manual Option */}
            <div className="flex items-center gap-4 my-8">
                <div className="h-px bg-white/10 flex-1"></div>
                <button 
                    onClick={() => setShowManualOptions(!showManualOptions)}
                    className="text-xs font-bold text-gray-500 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-widest"
                >
                    <SlidersHorizontal size={12} /> Customize Details
                    <ChevronDown size={12} className={`transition-transform duration-300 ${showManualOptions ? 'rotate-180' : ''}`} />
                </button>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {/* MANUAL OPTIONS (Collapsible) */}
            {showManualOptions && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-300 pb-10">
                    
                    {/* Grid for Duration & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* DURATION COUNTER */}
                        <div className="bg-[#111827] p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Duration</label>
                            <div className="flex items-center justify-between mb-1">
                                <button 
                                    onClick={() => setCreateForm(prev => ({...prev, duration: Math.max(1, prev.duration - 1)}))}
                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="text-lg font-black text-white tabular-nums">{createForm.duration} <span className="text-xs font-bold text-gray-500">Days</span></span>
                                <button 
                                    onClick={() => setCreateForm(prev => ({...prev, duration: prev.duration + 1}))}
                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 text-center bg-white/5 rounded py-1">
                                Ends {new Date(Date.now() + createForm.duration * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                            </div>
                        </div>

                        <div className="bg-[#111827] p-4 rounded-2xl border border-white/5">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Priority</label>
                            <div className="flex flex-col gap-2 h-full justify-center">
                                {(['Low', 'Medium', 'High'] as Priority[]).map(p => (
                                    <button 
                                        key={p}
                                        onClick={() => setCreateForm({...createForm, priority: p})}
                                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            createForm.priority === p 
                                            ? 'bg-white text-black' 
                                            : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-3 uppercase">Category</label>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                            {CATEGORIES.filter(c => c.name !== 'All').map(cat => (
                                <button 
                                    key={cat.id}
                                    onClick={() => setCreateForm({...createForm, category: cat.name})}
                                    className={`px-4 py-3 rounded-xl border flex items-center gap-2 flex-shrink-0 transition-all ${
                                        createForm.category === cat.name 
                                        ? 'bg-blue-600 border-blue-600 text-white' 
                                        : 'bg-[#111827] border-white/5 text-gray-500 hover:bg-white/5'
                                    }`}
                                >
                                    {cat.icon}
                                    <span className="text-xs font-bold">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color & Icon */}
                    <div>
                         <label className="block text-xs font-bold text-gray-500 mb-3 uppercase">Theme</label>
                         <div className="flex items-center gap-4 bg-[#111827] p-4 rounded-2xl border border-white/5">
                            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-2xl border border-white/10 cursor-pointer" onClick={() => {
                                const random = ICONS[Math.floor(Math.random() * ICONS.length)];
                                setCreateForm({...createForm, icon: random});
                            }}>
                                {createForm.icon}
                            </div>
                            <div className="h-8 w-px bg-white/10"></div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                                {THEME_COLORS.map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setCreateForm({...createForm, color: c})}
                                        className={`w-8 h-8 rounded-full border-2 flex-shrink-0 transition-transform ${createForm.color === c ? 'border-white scale-110' : 'border-transparent opacity-50'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                         </div>
                    </div>

                    {/* Manual Save Button */}
                    <button 
                        onClick={() => handleCreateProject(false)}
                        className="w-full py-4 bg-[#111827] border border-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/5 transition-colors"
                    >
                        Create Manually (No AI)
                    </button>

                </div>
            )}
        </div>
      </div>
    </div>
  );

  const renderDetail = () => {
    const activeMap = getActiveRoadmap();
    if (!activeMap) return null;

    return (
      <div className={`pt-8 px-4 pb-28 h-full overflow-y-auto no-scrollbar relative ${PAGE_TRANSITION_CLASS}`}>
        
        {/* Navbar */}
        <div className="flex items-center justify-between mb-8 px-2">
            <button 
                onClick={() => { triggerHaptic(); setCurrentView(ViewState.HOME); }}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{activeMap.category}</div>
            
            <div className="flex items-center gap-2">
                 {/* New: Add Task Button in Header */}
                 <button 
                    onClick={() => { triggerHaptic(); setEditingTask(null); setIsTaskModalOpen(true); }}
                    className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30"
                >
                    <Plus size={20} strokeWidth={2.5} />
                </button>
                <button 
                    onClick={() => {}} // Placeholder for settings
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                >
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </div>

        {/* Project Header */}
        <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-white/5 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/10">
                {activeMap.icon}
            </div>
            <h1 className="text-3xl font-black text-white mb-2">{activeMap.title}</h1>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">{activeMap.description}</p>
        </div>

        {/* Progress Card */}
        <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/5 mb-8 shadow-2xl relative overflow-hidden">
             <div className="flex justify-between items-end mb-4 relative z-10">
                 <div>
                     <div className="text-xs font-bold text-gray-500 uppercase mb-1">Total Progress</div>
                     <div className="text-3xl font-black text-white">{Math.round((activeMap.currentXp / activeMap.totalXp) * 100) || 0}%</div>
                 </div>
                 <div className="bg-white/10 px-3 py-1 rounded-lg text-xs font-bold text-gray-300">
                     {activeMap.status}
                 </div>
             </div>
             <div className="relative z-10">
                <ProgressBar current={activeMap.currentXp} total={activeMap.totalXp} color={activeMap.themeColor} />
             </div>
             {/* Glow */}
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/5 to-transparent pointer-events-none"></div>
        </div>

        {/* Tasks */}
        <div className="mb-20">
            <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-lg font-bold text-white">Tasks</h3>
            </div>

            <div className="space-y-3 pb-32">
                {activeMap.tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-10 pb-10 opacity-70">
                        <div className="w-24 h-24 bg-gradient-to-tr from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-black/50 border border-white/5 relative">
                             <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl"></div>
                             <Layers size={48} className="text-gray-500 relative z-10" strokeWidth={1.5} />
                             <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border border-gray-900"></div>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">No tasks yet</h3>
                        <p className="text-gray-500 text-xs text-center max-w-[200px]">
                           Add your first atomic task to start progress.
                        </p>
                    </div>
                ) : (
                    activeMap.tasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            color={activeMap.themeColor}
                            onToggle={(id, x, y) => handleToggleTask(activeMap.id, id, x, y)} 
                            onEdit={(task) => { setEditingTask(task); setIsTaskModalOpen(true); }}
                            onDelete={(id) => handleDeleteTask(activeMap.id, id)}
                            onEnterFocus={() => handleEnterFocus(task)}
                            onViewDetails={handleViewTaskDetails}
                        />
                    ))
                )}
            </div>
        </div>

      </div>
    );
  };

  const renderFocusMode = () => {
      if (!focusTask) return null;
      
      const formatTime = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      return (
          <div className="absolute inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
              {/* Ambient Background Animation */}
              <div className="absolute inset-0 bg-blue-900/20 animate-pulse-slow pointer-events-none"></div>
              
              <div className="relative z-10 w-full max-w-sm text-center">
                  <div className="mb-8">
                      <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-full mb-4 animate-bounce-slow border border-white/10">
                          <Target size={32} className="text-blue-500" />
                      </div>
                      <h2 className="text-3xl font-black text-white mb-2 leading-tight">{focusTask.task_title}</h2>
                      <p className="text-gray-500 text-lg font-medium">{focusTask.description || "Stay focused. Deep work."}</p>
                  </div>

                  {/* Timer */}
                  <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 font-mono mb-12 tracking-tighter">
                      {formatTime(focusTimer)}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-6">
                       <button 
                          onClick={() => { triggerHaptic(); setIsFocusRunning(!isFocusRunning); }}
                          className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
                      >
                          {isFocusRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                      </button>

                      <button 
                          onClick={() => handleExitFocus(true)}
                          className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-[0_0_50px_rgba(37,99,235,0.4)] hover:scale-105 transition-transform border-4 border-[#000000]"
                      >
                          <Check size={40} strokeWidth={4} />
                      </button>

                      <button 
                          onClick={() => handleExitFocus(false)}
                          className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all border border-white/10"
                      >
                          <X size={28} />
                      </button>
                  </div>
                  
                  <div className="mt-12 text-xs font-bold text-gray-600 uppercase tracking-[0.2em] animate-pulse">
                      {isFocusRunning ? "Hyper-Focus Active" : "Session Paused"}
                  </div>
              </div>
          </div>
      );
  };

  const renderProfile = () => {
      return (
          <div className={`pt-8 px-6 pb-32 h-full overflow-y-auto no-scrollbar ${PAGE_TRANSITION_CLASS}`}>
              <h2 className="text-3xl font-black text-white mb-8">Settings</h2>
              
              {/* User Card */}
              <div className="bg-[#1c1c1e] rounded-3xl p-6 mb-6 border border-white/5 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[2px]">
                       <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                           <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userProfile.name}`} alt="User" className="w-full h-full object-cover" />
                       </div>
                  </div>
                  <div className="flex-1">
                      {isEditingName ? (
                          <div className="flex items-center gap-2">
                              <input 
                                  value={userProfile.name}
                                  onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                                  className="bg-white/10 rounded px-2 py-1 text-white font-bold w-full focus:outline-none"
                                  autoFocus
                                  onBlur={() => setIsEditingName(false)}
                              />
                              <button onClick={() => setIsEditingName(false)} className="bg-blue-600 p-1 rounded text-white"><Check size={14}/></button>
                          </div>
                      ) : (
                          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                              <h3 className="text-xl font-bold text-white">{userProfile.name}</h3>
                              <Edit3 size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                          </div>
                      )}
                      <p className="text-xs text-gray-500 font-medium">Level {Math.floor(lastTotalXP / 500)} Architect</p>
                  </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4 mb-8">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Preferences</h3>
                  
                  <div className="bg-[#1c1c1e] rounded-2xl p-1 border border-white/5">
                      <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" onClick={() => setUserProfile({...userProfile, soundEnabled: !userProfile.soundEnabled})}>
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${userProfile.soundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-500'}`}>
                                  {userProfile.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                              </div>
                              <span className="text-white font-medium">Sound Effects</span>
                          </div>
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${userProfile.soundEnabled ? 'bg-green-500' : 'bg-gray-700'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${userProfile.soundEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </div>
                      </div>

                      <div className="h-px bg-white/5 mx-4"></div>

                      <div className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" onClick={() => setUserProfile({...userProfile, zenMode: !userProfile.zenMode})}>
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${userProfile.zenMode ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-500'}`}>
                                  <Ghost size={20} />
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-white font-medium">Zen Mode</span>
                                  <span className="text-[10px] text-gray-500">Hide stats on dashboard</span>
                              </div>
                          </div>
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${userProfile.zenMode ? 'bg-blue-500' : 'bg-gray-700'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${userProfile.zenMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Data Management */}
              <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Data</h3>
                  <button 
                      onClick={resetAllData}
                      className="w-full bg-[#1c1c1e] border border-red-500/20 rounded-2xl p-4 flex items-center justify-between text-red-400 hover:bg-red-500/10 transition-colors group"
                  >
                      <div className="flex items-center gap-3">
                          <AlertTriangle size={20} />
                          <span className="font-bold">Reset All Data</span>
                      </div>
                      <ChevronRight size={16} className="text-red-500/50 group-hover:text-red-500" />
                  </button>
                  
                  <div className="text-center mt-8">
                       <p className="text-[10px] text-gray-600">Version 1.0.2 (Beta)</p>
                       <p className="text-[10px] text-gray-700 mt-1">Made with Gemini 2.0</p>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="h-screen max-w-md mx-auto bg-[#030712] relative shadow-2xl overflow-hidden sm:border-x sm:border-white/5 font-sans">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* Splash Screen */}
      {renderSplashScreen()}

      <div className="h-full relative z-10">
        {currentView === ViewState.HOME && renderHome()}
        {currentView === ViewState.PROJECTS && renderProjects()}
        {currentView === ViewState.PROFILE && renderProfile()}
        {renderCreateModal()}
        {currentView === ViewState.DETAIL && renderDetail()}
        {currentView === ViewState.FOCUS && renderFocusMode()}
        {/* renderBriefingModal removed */}
        {renderTaskIntelModal()}
        {renderLevelUpModal()}
      </div>

      {currentView !== ViewState.DETAIL && currentView !== ViewState.FOCUS && !showSplash && (
        <TabBar 
            currentView={currentView} 
            onChangeView={(view) => {
                setIsCreateModalOpen(false); // Ensure Create Modal closes when tabs are clicked
                setCurrentView(view);
            }} 
            onOpenCreate={() => setIsCreateModalOpen(true)}
        />
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="glass-modal w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 border border-white/10 bg-[#0f172a]">
                <h3 className="text-xl font-bold text-white mb-6">{editingTask ? 'Edit Task' : 'New Task'}</h3>
                
                <input 
                    placeholder="Task Title"
                    className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white mb-4 focus:outline-none focus:border-blue-500"
                    id="task-title-input"
                    defaultValue={editingTask?.task_title || ''}
                />
                
                <div className="mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Difficulty (XP)</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(xp => (
                            <button 
                                key={xp}
                                id={`xp-${xp}`}
                                className={`flex-1 h-10 rounded-xl font-bold text-sm border transition-all hover:bg-white/10 ${editingTask?.xp_weight === xp ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10'}`}
                                onClick={(e) => {
                                    document.querySelectorAll('[id^="xp-"]').forEach(el => el.classList.remove('bg-white', 'text-black', 'border-white'));
                                    e.currentTarget.classList.add('bg-white', 'text-black', 'border-white');
                                    e.currentTarget.dataset.selected = "true";
                                }}
                                data-selected={editingTask?.xp_weight === xp}
                            >
                                {xp}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={() => {
                        const titleInput = document.getElementById('task-title-input') as HTMLInputElement;
                        const xpBtn = document.querySelector('[data-selected="true"]') as HTMLButtonElement;
                        if(titleInput.value) {
                            handleSaveTask({
                                title: titleInput.value,
                                description: '',
                                xp: xpBtn ? parseInt(xpBtn.textContent!) : 1
                            });
                            setIsTaskModalOpen(false);
                        }
                    }}
                    className="w-full py-4 bg-blue-600 rounded-2xl font-bold text-white shadow-lg"
                >
                    Save Task
                </button>
                <button onClick={() => setIsTaskModalOpen(false)} className="w-full py-3 mt-2 text-gray-500 font-bold text-sm">Cancel</button>
            </div>
        </div>
      )}
    </div>
  );
}
