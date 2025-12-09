import React, { useState, useEffect } from 'react';
import { Insect, CollectionData, UserProfile, Drawer } from './types';
import { Editor } from './components/Editor';
import { Plus, Maximize2, Archive, Moon, Sun, Download, Upload, User, ArrowRight, LogOut, Lock, ShieldCheck, RefreshCw, Eye, ChevronDown, ChevronRight, Trash2, Minus } from 'lucide-react';

const ADMIN_ID = "STAFF_ADMIN"; // The "Staff Number" for admin access
const ADMIN_PASS = "admin2024"; // Hardcoded Admin Password

// Brand Logo Component with Fallback
const BrandLogo = ({ size, className, isAdmin = false }: { size: number, className?: string, isAdmin?: boolean }) => {
    const [error, setError] = useState(false);
    
    // If admin, keep the Shield icon unless specifically overridden, but request was to replace "box" icon (Archive)
    if (isAdmin) return <ShieldCheck size={size} className={className} />;

    if (error) return <Archive size={size} className={className} />;
    
    return (
        <img 
            src="./logo.png" 
            alt="Entomology Logo" 
            className={`object-contain transition-opacity duration-300 ${className}`}
            style={{ width: size, height: size }}
            onError={() => setError(true)}
        />
    );
};

export default function App() {
  // App State
  const [insects, setInsects] = useState<Insect[]>([]);
  const [drawers, setDrawers] = useState<Drawer[]>([]);
  const [collectionTitle, setCollectionTitle] = useState("Virtual Entomology Collection");
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // UI State
  // editingSlot is now a combo of drawerId + slotIndex
  const [editingSlot, setEditingSlot] = useState<{drawerId: string, index: number} | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form State
  const [authId, setAuthId] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load User Data when currentUser changes
  useEffect(() => {
    if (currentUser && !isAdmin) {
      const storageKey = `collection_${currentUser.studentId}`;
      const savedCollection = localStorage.getItem(storageKey);
      
      if (savedCollection) {
        try {
          const data: CollectionData = JSON.parse(savedCollection);
          setInsects(data.insects || []);
          setCollectionTitle(data.title || "Virtual Entomology Collection");
          
          // MIGRATION: Logic for old single-drawer format
          if (data.drawers && data.drawers.length > 0) {
              setDrawers(data.drawers);
          } else {
              // Convert legacy format to new drawer format
              const legacyDrawerTitle = data.drawerTitle || "Specimen Drawer #01";
              const defaultDrawerId = crypto.randomUUID();
              
              // Assign all existing insects to this new default drawer
              const migratedInsects = (data.insects || []).map(i => ({
                  ...i,
                  drawerId: defaultDrawerId
              }));

              setInsects(migratedInsects);
              setDrawers([{
                  id: defaultDrawerId,
                  title: legacyDrawerTitle,
                  slotCount: 10,
                  isCollapsed: false
              }]);
          }

        } catch (e) {
          console.error("Failed to parse saved collection", e);
        }
      } else {
        // New collection for this user
        setInsects([]);
        setCollectionTitle("Virtual Entomology Collection");
        setDrawers([{
            id: crypto.randomUUID(),
            title: "Specimen Drawer #01",
            slotCount: 10,
            isCollapsed: false
        }]);
      }
    }
  }, [currentUser, isAdmin]);

  // Persistence: Save whenever data changes
  useEffect(() => {
    if (currentUser && !isAdmin) {
        const data: CollectionData = {
            title: collectionTitle,
            studentName: currentUser.fullName,
            studentId: currentUser.studentId,
            insects,
            drawers,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem(`collection_${currentUser.studentId}`, JSON.stringify(data));
    }
  }, [insects, collectionTitle, drawers, currentUser, isAdmin]);

  const toggleTheme = () => {
    setDarkMode(prev => {
      const newVal = !prev;
      if (newVal) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newVal;
    });
  };

  // --- Auth Handlers ---
  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError("");
      if (authId === ADMIN_ID) {
          if (authPass === ADMIN_PASS) {
            setIsAdmin(true);
            setCurrentUser({ studentId: ADMIN_ID, fullName: "Staff Administrator", password: "" });
            return;
          } else {
              setAuthError("Invalid Staff Password");
              return;
          }
      }
      const storedUsersStr = localStorage.getItem('entomology_users');
      const storedUsers: UserProfile[] = storedUsersStr ? JSON.parse(storedUsersStr) : [];
      const user = storedUsers.find(u => u.studentId === authId);
      if (user && user.password === authPass) {
          setCurrentUser(user);
          setIsAdmin(false);
      } else {
          setAuthError("Invalid Student ID or Password");
      }
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError("");
      if (authId === ADMIN_ID) {
          setAuthError("This ID is reserved for Staff.");
          return;
      }
      const storedUsersStr = localStorage.getItem('entomology_users');
      const storedUsers: UserProfile[] = storedUsersStr ? JSON.parse(storedUsersStr) : [];
      if (storedUsers.some(u => u.studentId === authId)) {
          setAuthError("Student ID already registered on this device.");
          return;
      }
      const newUser: UserProfile = {
          studentId: authId,
          password: authPass,
          fullName: authName
      };
      localStorage.setItem('entomology_users', JSON.stringify([...storedUsers, newUser]));
      setCurrentUser(newUser);
      setIsAdmin(false);
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setIsAdmin(false);
      setInsects([]);
      setDrawers([]);
      setAuthId("");
      setAuthPass("");
      setAuthName("");
  };

  // --- App Logic ---

  // Drawer Management
  const handleAddDrawer = () => {
      setDrawers(prev => [...prev, {
          id: crypto.randomUUID(),
          title: `Specimen Drawer #${String(prev.length + 1).padStart(2, '0')}`,
          slotCount: 10,
          isCollapsed: false
      }]);
  };

  const handleDeleteDrawer = (id: string) => {
      const hasInsects = insects.some(i => i.drawerId === id);
      if (hasInsects) {
          if (!confirm("This drawer contains specimens. Deleting it will remove all insects inside. Are you sure?")) {
              return;
          }
      }
      setDrawers(prev => prev.filter(d => d.id !== id));
      setInsects(prev => prev.filter(i => i.drawerId !== id));
  };

  const handleToggleDrawer = (id: string) => {
      setDrawers(prev => prev.map(d => d.id === id ? { ...d, isCollapsed: !d.isCollapsed } : d));
  };

  const handleUpdateDrawerTitle = (id: string, newTitle: string) => {
      setDrawers(prev => prev.map(d => d.id === id ? { ...d, title: newTitle } : d));
  };

  // Slot Management
  const handleAddSlot = (drawerId: string) => {
      setDrawers(prev => prev.map(d => d.id === drawerId ? { ...d, slotCount: d.slotCount + 1 } : d));
  };

  const handleRemoveSlot = (drawerId: string) => {
      const drawer = drawers.find(d => d.id === drawerId);
      if (!drawer || drawer.slotCount <= 0) return;
      
      // Check if last slot has insect
      const lastIndex = drawer.slotCount - 1;
      const hasInsect = insects.some(i => i.drawerId === drawerId && i.slotIndex === lastIndex);
      
      if (hasInsect) {
          alert("Cannot remove occupied slot. Delete the specimen first.");
          return;
      }
      
      setDrawers(prev => prev.map(d => d.id === drawerId ? { ...d, slotCount: d.slotCount - 1 } : d));
  };

  const handleSlotClick = (drawerId: string, index: number) => {
    if (isAdmin) {
        const hasInsect = insects.some(i => i.drawerId === drawerId && i.slotIndex === index);
        if (hasInsect) {
            setEditingSlot({ drawerId, index });
        }
    } else {
        setEditingSlot({ drawerId, index });
    }
  };

  const handleSaveInsect = (insect: Insect) => {
    setInsects(prev => {
      // Remove any existing insect in this specific slot location
      const filtered = prev.filter(i => !(i.drawerId === insect.drawerId && i.slotIndex === insect.slotIndex));
      return [...filtered, insect];
    });
    setEditingSlot(null);
  };
  
  const handleDeleteInsect = (id: string) => {
      setInsects(prev => prev.filter(i => i.id !== id));
      setEditingSlot(null);
  };

  const handleExport = () => {
      if (!currentUser) return;
      const data: CollectionData = {
          title: collectionTitle,
          studentName: currentUser.fullName,
          studentId: currentUser.studentId,
          drawers,
          insects,
          lastSaved: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentUser.studentId}_${currentUser.fullName.replace(/\s+/g, '_')}_Collection.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert("Progress saved to file. Keep this file safe as a backup.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const data: CollectionData = JSON.parse(event.target?.result as string);
                  if (data.insects) {
                      setInsects(data.insects);
                      setCollectionTitle(data.title || "Virtual Entomology Collection");
                      
                       // Handle migration on Import as well
                      if (data.drawers && data.drawers.length > 0) {
                          setDrawers(data.drawers);
                      } else {
                          const defaultDrawerId = crypto.randomUUID();
                          const migratedInsects = (data.insects || []).map(i => ({
                              ...i,
                              drawerId: defaultDrawerId
                          }));
                          setInsects(migratedInsects);
                          setDrawers([{
                              id: defaultDrawerId,
                              title: data.drawerTitle || "Specimen Drawer #01",
                              slotCount: 10,
                              isCollapsed: false
                          }]);
                      }

                      if (!isAdmin && data.studentId !== currentUser?.studentId) {
                         if (!confirm(`Warning: This file belongs to ${data.studentName} (${data.studentId}). Do you want to load it anyway?`)) {
                             return;
                         }
                      } else if (!isAdmin && !currentUser) {
                          alert(`Restored collection for ${data.studentName}. Please log in to continue editing.`);
                      }
                  }
              } catch (err) {
                  alert("Invalid collection file.");
              }
          };
          reader.readAsText(e.target.files[0]);
      }
  };

  const getInsectAtSlot = (drawerId: string, index: number) => 
      insects.find(i => i.drawerId === drawerId && i.slotIndex === index) || null;

  // --- Render: Login Screen ---
  if (!currentUser) {
      return (
          <div className="h-screen w-full bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center p-4 transition-colors duration-300">
              <div className="bg-white dark:bg-neutral-900 w-full max-w-md p-8 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col">
                  <div className="flex justify-center mb-6">
                      <div className="bg-indigo-600 p-4 rounded-xl shadow-lg transform rotate-3 hover:rotate-6 transition">
                          <BrandLogo size={40} className="text-white" />
                      </div>
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-center text-neutral-800 dark:text-neutral-100 mb-1">Entomology Lab</h1>
                  <p className="text-center text-neutral-500 dark:text-neutral-400 mb-6 text-xs uppercase tracking-widest font-bold">Virtual Collection Access</p>
                  <div className="flex mb-6 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                      <button 
                        onClick={() => { setAuthMode('login'); setAuthError(""); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition ${authMode === 'login' ? 'bg-white dark:bg-neutral-700 shadow text-indigo-600 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                      >
                          Sign In
                      </button>
                      <button 
                        onClick={() => { setAuthMode('register'); setAuthError(""); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition ${authMode === 'register' ? 'bg-white dark:bg-neutral-700 shadow text-indigo-600 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                      >
                          Register ID
                      </button>
                  </div>
                  <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                      {authMode === 'register' && (
                          <div>
                              <label className="block text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">Full Name</label>
                              <input 
                                  type="text" 
                                  required
                                  value={authName}
                                  onChange={(e) => setAuthName(e.target.value)}
                                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white text-sm"
                                  placeholder="Jane Doe"
                              />
                          </div>
                      )}
                      <div>
                          <label className="block text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">Student Number</label>
                          <div className="relative">
                            <User size={16} className="absolute left-3 top-3.5 text-neutral-400" />
                            <input 
                                type="text" 
                                required
                                value={authId}
                                onChange={(e) => setAuthId(e.target.value)}
                                className="w-full pl-10 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white text-sm font-mono"
                                placeholder={authMode === 'login' ? "ID or Staff Number" : "Student ID"}
                            />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">Password</label>
                          <div className="relative">
                            <Lock size={16} className="absolute left-3 top-3.5 text-neutral-400" />
                            <input 
                                type="password" 
                                required
                                value={authPass}
                                onChange={(e) => setAuthPass(e.target.value)}
                                className="w-full pl-10 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white text-sm"
                                placeholder="Create or Enter Password"
                            />
                          </div>
                      </div>
                      {authError && (
                          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
                              {authError}
                          </div>
                      )}
                      <button 
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition flex items-center justify-center gap-2 mt-2"
                      >
                          {authMode === 'login' ? 'Access Collection' : 'Create Account'} <ArrowRight size={18} />
                      </button>
                  </form>
                  <div className="mt-8 text-center pt-6 border-t border-neutral-200 dark:border-neutral-800">
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-tight mb-2">
                        * Data is stored locally on this device. <br/>Use "Save Progress" to backup your work.
                      </p>
                       <label className="cursor-pointer inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-bold uppercase tracking-wide">
                          <RefreshCw size={12} /> Restore from Backup (.json)
                          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                      </label>
                  </div>
              </div>
          </div>
      );
  }

  // --- Render: Main App ---
  return (
    <div className="h-full flex flex-col relative bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
      
      {/* Header */}
      <header className={`py-4 px-8 shadow-md z-10 flex flex-col md:flex-row justify-between items-center border-b gap-4 md:gap-0 transition-colors ${isAdmin ? 'bg-slate-800 border-slate-700' : 'bg-neutral-900 dark:bg-neutral-950 border-neutral-800'}`}>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`p-2 rounded-lg shadow-lg hidden md:block ${isAdmin ? 'bg-amber-500 shadow-amber-900/50' : 'bg-indigo-600 shadow-indigo-900/50'}`}>
                <BrandLogo size={24} className="text-white" isAdmin={isAdmin} />
            </div>
            <div className="flex-1">
                {isAdmin ? (
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Instructor Grading Mode</h2>
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wide">
                            Admin Access • Read Only
                        </div>
                    </div>
                ) : (
                    <>
                        <input 
                            type="text" 
                            value={collectionTitle}
                            onChange={(e) => setCollectionTitle(e.target.value)}
                            className="bg-transparent text-xl md:text-2xl font-sans font-bold tracking-tight text-white border-b border-transparent hover:border-neutral-600 focus:border-indigo-500 outline-none w-full md:w-[400px] transition-colors placeholder-neutral-500"
                            placeholder="Collection Title"
                        />
                        <div className="flex items-center gap-2 mt-1">
                            <User size={12} className="text-neutral-400" />
                            <span className="text-neutral-400 text-xs font-mono tracking-wide uppercase">{currentUser.fullName} ({currentUser.studentId})</span>
                        </div>
                    </>
                )}
            </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
             <div className="flex items-center gap-2">
                 {isAdmin ? (
                     <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition flex items-center gap-2 border border-slate-600">
                        <Upload size={16} /> Load Student File (.json)
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                 ) : (
                    <>
                    <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium shadow transition flex items-center gap-2 border border-neutral-700" title="Restore from a previously saved JSON file">
                        <Upload size={14} /> <span className="hidden md:inline">Load Backup</span>
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                    <button 
                        onClick={handleExport}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition flex items-center gap-2"
                        title="Download assignment file to save progress"
                    >
                        <Download size={16} /> Save Progress
                    </button>
                    </>
                 )}
             </div>

             <div className="h-6 w-px bg-neutral-700 mx-2 hidden md:block"></div>
             
             {/* Progress / Theme */}
             {!isAdmin && (
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs text-neutral-400 uppercase font-bold">Total Specimens</span>
                    <span className={`text-sm font-mono font-bold text-neutral-200`}>
                        {insects.length}
                    </span>
                </div>
             )}
             
             <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Toggle Dark Mode"
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
                onClick={handleLogout}
                className="ml-2 flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-900/20 px-3 py-2 rounded transition border border-rose-900/50 hover:border-rose-800"
            >
                <LogOut size={14} /> <span className="hidden md:inline">Save & Logout</span>
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full p-4 md:p-12 flex flex-col items-center gap-8 bg-grid-pattern pb-32">
        
        {drawers.map((drawer) => (
            <div key={drawer.id} className="w-full max-w-7xl bg-white dark:bg-neutral-900 rounded-xl drawer-shadow border border-neutral-200 dark:border-neutral-800 relative transition-all duration-300">
              
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 opacity-50"></div>
              
              {/* Drawer Header */}
              <div 
                className="p-6 md:p-8 md:pb-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center group cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                onClick={() => handleToggleDrawer(drawer.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleDrawer(drawer.id); }}
                        className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                        {drawer.isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                    </button>
                    
                    {isAdmin ? (
                        <h2 className="text-neutral-700 dark:text-neutral-200 font-serif text-2xl italic">{drawer.title}</h2>
                    ) : (
                        <input 
                            type="text" 
                            value={drawer.title}
                            onChange={(e) => handleUpdateDrawerTitle(drawer.id, e.target.value)}
                            className="text-neutral-700 dark:text-neutral-200 font-serif text-2xl italic bg-transparent border-none focus:ring-0 focus:outline-none placeholder-neutral-400 w-full md:w-1/2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded transition px-1"
                            placeholder="Drawer Name"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>

                {!isAdmin && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteDrawer(drawer.id); }}
                            className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition"
                            title="Delete Drawer"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
              </div>

              {/* Drawer Content */}
              {!drawer.isCollapsed && (
                  <div className="p-8 md:p-12 pt-4">
                      <div className="flex justify-end mb-6 border-b border-dashed border-neutral-200 dark:border-neutral-800 pb-2">
                          <span className="text-neutral-400 dark:text-neutral-500 text-xs uppercase tracking-widest font-mono">Taxonomic Classification</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 relative z-0">
                        {Array.from({ length: drawer.slotCount }).map((_, index) => {
                          const insect = getInsectAtSlot(drawer.id, index);
                          const labelName = insect 
                            ? (insect.genus && insect.species 
                                ? `${insect.genus} ${insect.species}` 
                                : (insect.order || "Unidentified")) 
                            : "";

                          return (
                            <div 
                              key={`${drawer.id}-${index}`}
                              onClick={() => handleSlotClick(drawer.id, index)}
                              className={`
                                aspect-[4/5] relative rounded-lg border-2 transition-all duration-300 group overflow-hidden
                                ${isAdmin ? (insect ? 'cursor-pointer' : 'cursor-not-allowed opacity-50') : 'cursor-pointer'}
                                ${insect 
                                    ? 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1' 
                                    : 'bg-neutral-50 dark:bg-neutral-900 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20'
                                }
                              `}
                            >
                              {insect ? (
                                <div className="w-full h-full p-3 flex flex-col items-center">
                                    {/* Specimen */}
                                    <div className="flex-1 w-full flex items-center justify-center relative p-2">
                                        {insect.imageUrl && (
                                            <img 
                                                src={insect.imageUrl} 
                                                alt="Specimen" 
                                                className="max-w-full max-h-full object-contain drop-shadow-md opacity-90 transition-opacity group-hover:opacity-100"
                                            />
                                        )}
                                        {/* The Pin Head */}
                                        {insect.pinPosition && (
                                            <div 
                                                className="absolute w-3 h-3 bg-neutral-900 dark:bg-white rounded-full border-2 border-neutral-400 dark:border-neutral-600 shadow-xl z-10"
                                                style={{ 
                                                    left: `calc(${insect.pinPosition.x}% - 6px)`, 
                                                    top: `calc(${insect.pinPosition.y}% - 6px)` 
                                                }}
                                            >
                                                <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white dark:bg-neutral-900 rounded-full opacity-40"></div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Modern Label */}
                                    <div className="w-full mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700 text-center">
                                        <p className="font-serif text-sm italic font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                            {labelName}
                                        </p>
                                        <p className="font-mono text-[9px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide truncate mt-0.5">
                                            {insect.dateCaught} • {insect.family || insect.order || "Unknown"}
                                        </p>
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-indigo-900/5 dark:bg-indigo-400/5 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                                        <div className="bg-white dark:bg-neutral-800 p-2 rounded-full shadow-lg text-indigo-700 dark:text-indigo-400 transform scale-75 group-hover:scale-100 transition">
                                            {isAdmin ? <Eye size={20} /> : <Maximize2 size={20} />}
                                        </div>
                                    </div>
                                </div>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 dark:text-neutral-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                                    <Plus size={32} strokeWidth={1.5} />
                                    <span className="text-[10px] font-mono mt-3 uppercase tracking-widest font-medium">Slot {index + 1}</span>
                                </div>
                              )}
                              
                              {/* Slot Number Badge */}
                              <div className="absolute top-2 left-2 text-[9px] font-mono text-neutral-300 dark:text-neutral-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400">
                                {String(index + 1).padStart(2, '0')}
                              </div>
                            </div>
                          );
                        })}

                        {/* Add/Remove Slot Controls */}
                        {!isAdmin && (
                            <div className="flex flex-col justify-center gap-4 py-8">
                                <button 
                                    onClick={() => handleAddSlot(drawer.id)}
                                    className="aspect-square rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 text-neutral-400 hover:text-indigo-500 transition flex flex-col items-center justify-center gap-2 group"
                                    title="Add Slot"
                                >
                                    <Plus size={24} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Slot</span>
                                </button>
                                <button 
                                    onClick={() => handleRemoveSlot(drawer.id)}
                                    className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-neutral-400 hover:text-rose-500 transition flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide"
                                    title="Remove Last Slot"
                                >
                                    <Minus size={14} /> Remove
                                </button>
                            </div>
                        )}
                      </div>
                  </div>
              )}
            </div>
        ))}

        {/* Add Drawer Button */}
        {!isAdmin && (
            <button 
                onClick={handleAddDrawer}
                className="w-full max-w-7xl py-6 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-indigo-500 dark:hover:border-indigo-400 text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex flex-col items-center justify-center gap-2 group hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
            >
                <div className="p-3 bg-neutral-200 dark:bg-neutral-800 rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition">
                    <Plus size={24} />
                </div>
                <span className="font-serif font-bold text-lg">Add New Specimen Drawer</span>
            </button>
        )}
      </main>

      {/* Editor Modal */}
      {editingSlot !== null && (
        <Editor 
            drawerId={editingSlot.drawerId}
            slotIndex={editingSlot.index}
            initialData={getInsectAtSlot(editingSlot.drawerId, editingSlot.index)}
            onSave={handleSaveInsect}
            onClose={() => setEditingSlot(null)}
            onDelete={handleDeleteInsect}
            readOnly={isAdmin}
        />
      )}
    </div>
  );
}