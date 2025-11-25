
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FocusSession, NodeLayout } from '../types';
import { Button } from './Button';

interface MindMapBoardProps {
  sessions: FocusSession[];
  layout: Record<string, NodeLayout>;
  onUpdateLayout: (newLayout: Record<string, NodeLayout>) => void;
  onClose: () => void;
}

export const MindMapBoard: React.FC<MindMapBoardProps> = ({
  sessions,
  layout,
  onUpdateLayout,
  onClose
}) => {
  // Filter only completed sessions
  const completedSessions = useMemo(() => sessions.filter(s => s.status !== 'planned'), [sessions]);
  
  // State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [linkMode, setLinkMode] = useState<{ active: boolean, sourceId: string | null }>({ active: false, sourceId: null });

  // Refs
  const boardRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Helpers
  const getNodePos = (id: string) => {
    return layout[id] || { x: 100, y: 100, connections: [] };
  };

  // --- Event Handlers ---

  const handleMouseDownBoard = (e: React.MouseEvent) => {
    // If clicking directly on board, start pan
    if (e.target === boardRef.current) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    // Link Mode Logic
    if (linkMode.active) {
      if (linkMode.sourceId === null) {
        setLinkMode({ ...linkMode, sourceId: id });
      } else if (linkMode.sourceId !== id) {
        // Create link
        const sourceLayout = getNodePos(linkMode.sourceId);
        // Avoid duplicates
        if (!sourceLayout.connections.includes(id)) {
            const newLayout = {
                ...layout,
                [linkMode.sourceId]: {
                    ...sourceLayout,
                    connections: [...sourceLayout.connections, id]
                }
            };
            onUpdateLayout(newLayout);
        }
        setLinkMode({ active: false, sourceId: null });
      }
      return;
    }

    // Drag Logic
    const pos = getNodePos(id);
    setDraggingNode(id);
    // Calculate offset from top-left of node to mouse
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    } else if (draggingNode) {
      // Calculate new node position
      // Node position is absolute within the pan-space
      // Mouse clientX - dragOffset gives the screen coord of the node
      // But we need to subtract PAN to get the "absolute" coord relative to origin
      // Wait, simpler: 
      // The node renders at (layout.x + pan.x). 
      // e.clientX is screen space.
      // layout.x = e.clientX - pan.x - offset.x (where offset was click relative to node)
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      onUpdateLayout({
        ...layout,
        [draggingNode]: {
            ...getNodePos(draggingNode),
            x: newX,
            y: newY
        }
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
  };

  // --- Sidebar Logic ---
  const unmappedSessions = completedSessions.filter(s => !layout[s.id]);

  const addNodeToBoard = (sessionId: string) => {
    // Add to center of view
    const boardW = boardRef.current?.clientWidth || 800;
    const boardH = boardRef.current?.clientHeight || 600;
    const centerX = -pan.x + (boardW / 2) - 100; // -100 for half node width approx
    const centerY = -pan.y + (boardH / 2) - 40;

    onUpdateLayout({
        ...layout,
        [sessionId]: { x: centerX, y: centerY, connections: [] }
    });
  };

  const removeNodeFromBoard = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLayout = { ...layout };
    delete newLayout[sessionId];
    // Also remove connections TO this node
    Object.keys(newLayout).forEach(key => {
        newLayout[key].connections = newLayout[key].connections.filter(cid => cid !== sessionId);
    });
    onUpdateLayout(newLayout);
  };

  // --- Rendering ---

  return (
    <div className="fixed inset-0 z-50 bg-black flex text-white overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-white/10 flex flex-col z-20 shadow-xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-gray-300">Unmapped Tasks</h3>
            <Button size="sm" variant="ghost" onClick={onClose}>Exit</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {unmappedSessions.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">All tasks mapped!</div>
            ) : (
                unmappedSessions.map(s => (
                    <div 
                        key={s.id} 
                        className="p-3 bg-zinc-800 border border-white/5 rounded text-xs cursor-pointer hover:bg-zinc-700 hover:border-indigo-500 transition-all"
                        onClick={() => addNodeToBoard(s.id)}
                    >
                        {s.task}
                    </div>
                ))
            )}
        </div>
        <div className="p-4 border-t border-white/5 bg-zinc-950">
            <div className="text-[10px] text-gray-500 mb-2">CONTROLS</div>
            <div className="space-y-2">
                <Button 
                    size="sm" 
                    variant={linkMode.active ? 'primary' : 'secondary'} 
                    className="w-full text-xs"
                    onClick={() => setLinkMode(p => ({ active: !p.active, sourceId: null }))}
                >
                    {linkMode.active ? (linkMode.sourceId ? 'Click Target Node' : 'Select Source Node') : 'Link Nodes 🔗'}
                </Button>
                <div className="text-[10px] text-gray-600 leading-tight">
                    • Drag tasks from list to board.<br/>
                    • Drag nodes to arrange.<br/>
                    • Drag background to pan.
                </div>
            </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={boardRef}
        className={`flex-1 relative bg-[#0a0a0a] overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} ${linkMode.active ? 'cursor-crosshair' : ''}`}
        onMouseDown={handleMouseDownBoard}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid Pattern */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
                backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                transform: `translate(${pan.x}px, ${pan.y}px)`
            }}
        />

        {/* Content Container with Pan Transform */}
        <div 
            className="absolute inset-0 origin-top-left pointer-events-none"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
            
            {/* 1. Connections Layer (SVG) */}
            <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none -translate-x-[2500px] -translate-y-[2500px] overflow-visible">
                {/* We render lines based on node centers */}
                {Object.keys(layout).map(sourceId => {
                    const source = layout[sourceId];
                    const sourceEl = document.getElementById(`node-${sourceId}`);
                    // Fallback width/height if not rendered yet
                    const w = 200; 
                    const h = 60;
                    const sx = source.x + (w/2);
                    const sy = source.y + (h/2);

                    return source.connections.map(targetId => {
                        const target = layout[targetId];
                        if (!target) return null;
                        const tx = target.x + (w/2);
                        const ty = target.y + (h/2);

                        return (
                            <line 
                                key={`${sourceId}-${targetId}`}
                                x1={sx} y1={sy} x2={tx} y2={ty}
                                stroke="#4b5563"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                        );
                    });
                })}
            </svg>

            {/* 2. Nodes Layer */}
            {Object.keys(layout).map(id => {
                const session = completedSessions.find(s => s.id === id);
                if (!session) return null; // Should clean up layout if session deleted, but for safety

                const pos = getNodePos(id);
                const isSource = linkMode.active && linkMode.sourceId === id;

                return (
                    <div
                        id={`node-${id}`}
                        key={id}
                        className={`absolute w-[200px] bg-zinc-900 border rounded-lg p-3 shadow-lg pointer-events-auto select-none transition-shadow
                            ${isSource ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-white/10 hover:border-white/30'}
                        `}
                        style={{ 
                            left: pos.x, 
                            top: pos.y,
                            zIndex: draggingNode === id ? 50 : 10
                        }}
                        onMouseDown={(e) => handleMouseDownNode(e, id)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] text-gray-500 font-mono">
                                {new Date(session.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </span>
                            <button 
                                onClick={(e) => removeNodeFromBoard(id, e)}
                                className="text-gray-600 hover:text-red-400 -mt-1 -mr-1 px-1"
                            >
                                ×
                            </button>
                        </div>
                        <div className="text-sm font-bold text-gray-200 leading-tight">
                            {session.task}
                        </div>
                        <div className="mt-2 text-[10px] text-emerald-500">
                            {session.durationMinutes}m focus
                        </div>

                        {/* Connection Dot (Visual only) */}
                        <div className="absolute -right-1 top-1/2 w-2 h-2 bg-gray-600 rounded-full"></div>
                        <div className="absolute -left-1 top-1/2 w-2 h-2 bg-gray-600 rounded-full"></div>
                    </div>
                );
            })}

        </div>

        {/* HUD */}
        <div className="absolute bottom-6 right-6 flex gap-2">
            <div className="bg-black/50 backdrop-blur text-xs text-gray-500 px-3 py-1 rounded border border-white/10">
                {linkMode.active 
                    ? (linkMode.sourceId ? 'Select target...' : 'Select source...') 
                    : 'Drag mode'}
            </div>
            <Button size="sm" variant="secondary" onClick={() => setPan({x:0, y:0})}>Recenter</Button>
        </div>

      </div>
    </div>
  );
};
