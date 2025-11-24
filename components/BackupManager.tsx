import React, { useRef, useState } from 'react';
import { SacredSeatData } from '../types';
import { Button } from './Button';

interface BackupManagerProps {
  data: SacredSeatData;
  onImport: (data: SacredSeatData) => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ data, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Helper to show temporary status messages
  const flashMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  // --- Clipboard Methods ---

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

  // --- File System API (Modern Browsers) ---

  const handleNativeSave = async () => {
    if ('showSaveFilePicker' in window) {
      try {
        // @ts-ignore - File System Access API
        const handle = await window.showSaveFilePicker({
          suggestedName: `focus_backup_${new Date().toISOString().split('T')[0]}.json`,
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        flashMsg("Saved to file successfully!");
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
          // If native save fails (e.g. not supported), use fallback
          fallbackExport();
        } else {
            return; // User cancelled
        }
      }
    } else {
      // Fallback
      fallbackExport();
    }
  };

  const handleNativeOpen = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        // @ts-ignore
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const file = await handle.getFile();
        const text = await file.text();
        const json = JSON.parse(text);
        validateAndImport(json);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
          flashMsg("Failed to open file", 'error');
        }
        return;
      }
    }
    // Fallback
    fileInputRef.current?.click();
  };

  // --- Legacy Fallbacks ---

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

  // --- Validation ---

  const validateAndImport = (json: any) => {
    if (json && Array.isArray(json.history) && typeof json.chainCount === 'number') {
      if (confirm('This will overwrite your current data with the imported version. Continue?')) {
        onImport(json);
        flashMsg("Data imported successfully!");
      }
    } else {
      flashMsg("Invalid data format", 'error');
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        {/* Left: Info */}
        <div className="text-gray-500 text-sm max-w-xs">
          <h4 className="text-white font-medium mb-1 flex items-center gap-2">
            <span>💾</span> Data Sync
          </h4>
          <p className="mb-2">
            Data is stored in browser <strong>LocalStorage</strong>. It will be lost if you clear browser data.
          </p>
          <p className="text-xs text-indigo-400">
             To survive cache clearing, please download a backup file regularly.
          </p>
          {msg && (
            <div className={`mt-2 text-xs font-bold ${msg.type === 'success' ? 'text-emerald-400' : 'text-red-400'} animate-pulse`}>
              {msg.text}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-4 w-full md:w-auto">
          
          <div className="flex flex-col sm:flex-row gap-3">
             {/* Clipboard */}
             <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-900 border border-white/5 flex-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-1">Quick Sync</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCopyToClipboard} className="flex-1 whitespace-nowrap">
                    Copy
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handlePasteFromClipboard} className="flex-1 whitespace-nowrap">
                    Paste
                  </Button>
                </div>
              </div>

              {/* File System */}
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-zinc-900 border border-white/5 flex-1">
                 <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-1">Backup File</span>
                 <div className="flex gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleLegacyFileChange} 
                      accept=".json" 
                      className="hidden" 
                    />
                    <Button variant="secondary" size="sm" onClick={handleNativeOpen} className="whitespace-nowrap">
                      Open
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleNativeSave} className="whitespace-nowrap">
                      Save / Sync
                    </Button>
                    {/* Explicit Download for safety */}
                    <Button variant="secondary" size="sm" onClick={fallbackExport} className="whitespace-nowrap" title="Force Download">
                      ⬇
                    </Button>
                 </div>
              </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};