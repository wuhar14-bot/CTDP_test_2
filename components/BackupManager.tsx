import React, { useRef, useState, useEffect } from 'react';
import { SacredSeatData } from '../types';
import { Button } from './Button';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';

interface BackupManagerProps {
  data: SacredSeatData;
  onImport: (data: SacredSeatData) => void;
}

const SQL_SNIPPET = `-- 1. Go to Supabase > SQL Editor
-- 2. Run this script to create the table
create table if not exists user_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

alter table user_data enable row level security;

create policy "Users can manage their own data" 
on user_data 
for all 
using (auth.uid() = user_id);`;

export const BackupManager: React.FC<BackupManagerProps> = ({ data, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  // Config State (for manual entry)
  const [configUrl, setConfigUrl] = useState('');
  // Pre-filled with the key provided by the user
  const [configKey, setConfigKey] = useState('sb_publishable_zT2QCektJ4NR-G405EL5Ow_jtS1G15B');

  // Initialize Supabase Auth Listener
  useEffect(() => {
    if (supabase) {
      setIsClientReady(true);
      // Check active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      // Listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Helper to show temporary status messages
  const flashMsg = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  // --- CLOUD SYNC METHODS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Redirect back to the current page after login
        emailRedirectTo: window.location.href,
      }
    });

    if (error) {
      flashMsg(error.message, 'error');
    } else {
      flashMsg('Check your email for the login link!', 'info');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    flashMsg('Logged out successfully');
  };

  const handlePushToCloud = async () => {
    if (!supabase || !user) return;
    setLoading(true);

    try {
      // Upsert data linked to the user's ID
      const { error } = await supabase
        .from('user_data')
        .upsert({ 
          user_id: user.id, 
          content: data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      flashMsg('Data saved to cloud successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('relation "user_data" does not exist')) {
          flashMsg('Table missing. Check Help (?) for SQL setup.', 'error');
          setShowHelp(true);
      } else {
          flashMsg(err.message || 'Failed to sync to cloud', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!supabase || !user) return;
    setLoading(true);

    try {
      const { data: rows, error } = await supabase
        .from('user_data')
        .select('content')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (rows && rows.content) {
         if (confirm('This will overwrite your local data with the version from the cloud. Are you sure?')) {
             validateAndImport(rows.content);
         }
      } else {
        flashMsg('No data found in cloud.', 'info');
      }
    } catch (err: any) {
      console.error(err);
       if (err.message?.includes('relation "user_data" does not exist')) {
          flashMsg('Table missing. Check Help (?) for SQL setup.', 'error');
          setShowHelp(true);
      } else {
          flashMsg(err.message || 'Failed to fetch from cloud', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- CONFIG METHODS ---

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configUrl.trim() || !configKey.trim()) {
       flashMsg('Please provide both URL and Key', 'error');
       return;
    }
    localStorage.setItem('sb_url', configUrl.trim());
    localStorage.setItem('sb_key', configKey.trim());
    window.location.reload();
  };

  const handleClearConfig = () => {
    if (confirm('Disconnect Supabase? This will remove your keys from local storage.')) {
        localStorage.removeItem('sb_url');
        localStorage.removeItem('sb_key');
        window.location.reload();
    }
  };

  // --- LOCAL METHODS ---

  const handleCopyToClipboard = async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      flashMsg("Data copied to clipboard!");
    } catch (err) {
      flashMsg("Failed to copy to clipboard", 'error');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      try {
        const json = JSON.parse(text);
        validateAndImport(json);
      } catch (e) {
        flashMsg("Clipboard content is not valid JSON", 'error');
      }
    } catch (err) {
      flashMsg("Failed to read clipboard", 'error');
    }
  };

  const fallbackExport = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focus_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    flashMsg("Export downloaded!");
  };

  const handleLegacyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        validateAndImport(json);
      } catch (err) {
        flashMsg("Failed to parse JSON file", 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateAndImport = (json: any) => {
    if (json && Array.isArray(json.history) && typeof json.chainCount === 'number') {
      onImport(json);
      flashMsg("Data imported successfully!");
    } else {
      flashMsg("Invalid data format", 'error');
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-white/5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* INFO COLUMN */}
        <div className="lg:col-span-4 text-gray-500 text-sm">
          <h4 className="text-white font-medium mb-1 flex items-center gap-2">
            <span>💾</span> Data Management
          </h4>
          <p className="mb-2">
            By default, data lives in <strong>LocalStorage</strong>. Clear your cache, and it's gone.
          </p>
          <p className="text-xs text-indigo-400 mb-4">
             Use Cloud Sync to persist data across devices.
          </p>
          
          {msg && (
            <div className={`
                mt-2 text-xs font-bold px-3 py-2 rounded border
                ${msg.type === 'success' ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' : ''}
                ${msg.type === 'error' ? 'bg-red-900/20 border-red-500/50 text-red-400' : ''}
                ${msg.type === 'info' ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : ''}
            `}>
              {msg.text}
            </div>
          )}
        </div>

        {/* LOCAL ACTIONS */}
        <div className="lg:col-span-4 flex flex-col gap-3">
             <div className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-900 border border-white/5 h-full">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Local File / Clipboard</span>
                
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <Button variant="secondary" size="sm" onClick={handleCopyToClipboard}>Copy JSON</Button>
                  <Button variant="secondary" size="sm" onClick={handlePasteFromClipboard}>Paste JSON</Button>
                  <Button variant="secondary" size="sm" onClick={fallbackExport}>Download</Button>
                  <div className="relative">
                    <input type="file" ref={fileInputRef} onChange={handleLegacyFileChange} accept=".json" className="hidden" />
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>Import File</Button>
                  </div>
                </div>
             </div>
        </div>

        {/* CLOUD ACTIONS */}
        <div className="lg:col-span-4">
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-900 border border-indigo-500/20 h-full relative overflow-hidden group/card">
                 {/* Decorative background */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>
                 
                 <div className="flex justify-between items-center relative z-10">
                    <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">☁️ Cloud Sync (Supabase)</span>
                    <div className="flex items-center gap-2">
                       {user && <span className="text-[9px] text-gray-500">{user.email}</span>}
                       {isClientReady && (
                           <button 
                             onClick={() => setShowHelp(!showHelp)} 
                             className="text-gray-500 hover:text-white text-xs w-5 h-5 rounded border border-white/10 flex items-center justify-center"
                             title="Database Setup / Help"
                           >
                             ?
                           </button>
                       )}
                    </div>
                 </div>
                 
                 {/* Disconnect / Clear Config Button */}
                 {isClientReady && !showHelp && (
                   <button 
                      onClick={handleClearConfig}
                      className="absolute top-4 right-10 text-gray-600 hover:text-red-400 opacity-0 group-hover/card:opacity-100 transition-opacity z-20 mr-2"
                      title="Disconnect / Clear API Keys"
                   >
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                 )}

                 {showHelp ? (
                    <div className="mt-2 flex flex-col h-full z-20">
                        <p className="text-[10px] text-gray-400 mb-1">Database Setup (Run in SQL Editor):</p>
                        <pre className="flex-1 bg-black p-2 rounded text-[8px] text-gray-300 overflow-auto font-mono border border-white/10 select-all">
                            {SQL_SNIPPET}
                        </pre>
                        <Button size="sm" variant="secondary" className="mt-2" onClick={() => setShowHelp(false)}>Back</Button>
                    </div>
                 ) : !isClientReady ? (
                    <div className="mt-auto flex flex-col gap-2">
                        <div className="text-xs text-gray-500 mb-1">
                            Configure Supabase credentials to enable cloud sync.
                        </div>
                        <form onSubmit={handleSaveConfig} className="flex flex-col gap-2">
                             <div className="flex flex-col gap-1">
                               <input 
                                  type="text"
                                  placeholder="Project URL (https://xyz.supabase.co)"
                                  value={configUrl}
                                  onChange={e => setConfigUrl(e.target.value)}
                                  className="bg-black/50 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white focus:border-indigo-500 outline-none w-full"
                               />
                               <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-400 hover:underline text-right px-1">
                                  Find your Project URL &rarr;
                               </a>
                             </div>
                             <input 
                                type="password"
                                placeholder="Anon Key / API Key"
                                value={configKey}
                                onChange={e => setConfigKey(e.target.value)}
                                className="bg-black/50 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white focus:border-indigo-500 outline-none"
                             />
                             <Button type="submit" size="sm" variant="secondary" className="w-full">
                                Connect
                             </Button>
                        </form>
                    </div>
                 ) : !user ? (
                    <div className="mt-auto flex flex-col gap-2">
                        <div className="text-xs text-gray-500 leading-tight">
                            Enter your email to receive a magic login link.
                        </div>
                        <form onSubmit={handleLogin} className="flex gap-2">
                            <input 
                                type="email" 
                                placeholder="email@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="flex-1 bg-black border border-white/10 rounded px-3 py-1 text-xs text-white focus:border-indigo-500 outline-none"
                                required
                            />
                            <Button type="submit" size="sm" variant="primary" disabled={loading}>
                                {loading ? '...' : 'Login'}
                            </Button>
                        </form>
                    </div>
                 ) : (
                     <div className="mt-auto grid grid-cols-2 gap-2">
                        <Button variant="primary" size="sm" onClick={handlePushToCloud} disabled={loading}>
                            ⬆ Push
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handlePullFromCloud} disabled={loading}>
                            ⬇ Pull
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="col-span-2 text-xs">
                            Sign Out
                        </Button>
                     </div>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};