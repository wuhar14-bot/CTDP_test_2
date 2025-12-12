
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { FocusSession, NodeLayout } from '../types';
import { Button } from './Button';

interface MindMapBoardProps {
  sessions: FocusSession[];
  layout: Record<string, NodeLayout>;
  onUpdateLayout: (newLayout: Record<string, NodeLayout>) => void;
  onClose: () => void;
}

// Visual Constants
const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;

export const MindMapBoard: React.FC<MindMapBoardProps> = ({
  sessions,
  layout,
  onUpdateLayout,
  onClose
}) => {
  // Filter only completed sessions
  const completedSessions = useMemo(() => sessions.filter(s => s.status !== 'planned'), [sessions]);

  // --- REFS FOR STABLE STATE ACCESS IN LISTENERS ---
  const interactionRef = useRef<{
    mode: 'IDLE' | 'PAN' | 'DRAG_NODE' | 'LINK';
    activeId: string | null;
    startMouse: { x: number, y: number }; // Screen coordinates
    dragOffset: { x: number, y: number }; // Canvas coordinates offset
  }>({
    mode: 'IDLE',
    activeId: null,
    startMouse: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 }
  });

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const layoutRef = useRef(layout);

  // --- REACT STATE FOR RENDERING ---
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [tempLink, setTempLink] = useState<{ sourceId: string; endX: number; endY: number } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);

  // Sync refs with state
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  // Helpers
  const getNodePos = (id: string, currentLayout = layout) => {
    return currentLayout[id] || { x: 100, y: 100, connections: [] };
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    return {
      x: (clientX - panRef.current.x) / zoomRef.current,
      y: (clientY - panRef.current.y) / zoomRef.current
    };
  };

  // --- MOUSE HANDLERS (INITIATORS) ---

  const handleMouseDownBoard = (e: React.MouseEvent) => {
    // Allow panning with left click (0) or middle click (1)
    if (e.button !== 0 && e.button !== 1) return;

    // Prevent default browser behavior for middle click (scroll)
    if (e.button === 1) {
      e.preventDefault();
    }

    interactionRef.current = {
      mode: 'PAN',
      activeId: null,
      startMouse: { x: e.clientX, y: e.clientY },
      dragOffset: { x: 0, y: 0 }
    };
    setIsPanning(true);
  };

  // Handle double-click to create new node
  const handleDoubleClickBoard = (e: React.MouseEvent) => {
    // Only handle direct clicks on the board (not on nodes)
    const target = e.target as HTMLElement;
    if (target.closest('[id^="node-"]')) return;

    // Find a session from backlog to add, or create placeholder
    if (unmappedSessions.length > 0) {
      const sessionToAdd = unmappedSessions[0];
      const mouseCanvas = getCanvasCoordinates(e.clientX, e.clientY);

      onUpdateLayout({
        ...layout,
        [sessionToAdd.id]: {
          x: mouseCanvas.x - NODE_WIDTH / 2,
          y: mouseCanvas.y - NODE_HEIGHT / 2,
          connections: []
        }
      });
    }
  };

  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // Stop board pan

    const pos = getNodePos(id);
    const mouseCanvas = getCanvasCoordinates(e.clientX, e.clientY);

    interactionRef.current = {
      mode: 'DRAG_NODE',
      activeId: id,
      startMouse: { x: e.clientX, y: e.clientY },
      dragOffset: {
        x: mouseCanvas.x - pos.x,
        y: mouseCanvas.y - pos.y
      }
    };
    setDraggingNodeId(id);
  };

  const handleMouseDownHandle = (e: React.MouseEvent, sourceId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // Stop node drag
    e.preventDefault();  // Prevent text selection

    const mouseCanvas = getCanvasCoordinates(e.clientX, e.clientY);

    // Initialize visual line
    setTempLink({
      sourceId,
      endX: mouseCanvas.x,
      endY: mouseCanvas.y
    });

    interactionRef.current = {
      mode: 'LINK',
      activeId: sourceId,
      startMouse: { x: e.clientX, y: e.clientY },
      dragOffset: { x: 0, y: 0 }
    };
  };

  // --- GLOBAL LISTENERS ---

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      const { mode, activeId, startMouse, dragOffset } = interactionRef.current;

      if (mode === 'IDLE') return;

      if (mode === 'PAN') {
        const dx = e.clientX - startMouse.x;
        const dy = e.clientY - startMouse.y;
        
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        interactionRef.current.startMouse = { x: e.clientX, y: e.clientY };
      }
      else {
        const mouseCanvas = getCanvasCoordinates(e.clientX, e.clientY);

        if (mode === 'DRAG_NODE' && activeId) {
            const newX = mouseCanvas.x - dragOffset.x;
            const newY = mouseCanvas.y - dragOffset.y;
            
            // Optimistic update
            const currentPos = getNodePos(activeId, layoutRef.current);
            onUpdateLayout({
                ...layoutRef.current,
                [activeId]: {
                    ...currentPos,
                    x: newX,
                    y: newY
                }
            });
        }

        if (mode === 'LINK' && activeId) {
            // Directly update tempLink with latest coordinates and activeId
            setTempLink({
                sourceId: activeId,
                endX: mouseCanvas.x,
                endY: mouseCanvas.y
            });
        }
      }
    };

    const handleGlobalUp = () => {
      const { mode } = interactionRef.current;
      
      if (mode !== 'IDLE') {
        interactionRef.current.mode = 'IDLE';
        interactionRef.current.activeId = null;

        setIsPanning(false);
        setDraggingNodeId(null);
        setTempLink(null);
      }
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, []); // Empty deps = stable listeners

  // --- DROPPING LINK ON NODE ---

  const handleMouseUpNode = (targetId: string) => {
     // We check interactionRef directly to avoid stale state issues with tempLink
     if (interactionRef.current.mode === 'LINK' && interactionRef.current.activeId) {
         const sourceId = interactionRef.current.activeId;
         
         // Prevent self-linking and duplicates
         if (sourceId !== targetId) {
             const sourceNode = getNodePos(sourceId, layoutRef.current);
             
             if (!sourceNode.connections.includes(targetId)) {
                onUpdateLayout({
                    ...layoutRef.current,
                    [sourceId]: {
                        ...sourceNode,
                        connections: [...sourceNode.connections, targetId]
                    }
                });
             }
         }
     }
  };

  // --- CANVAS HELPERS ---

  const unmappedSessions = completedSessions.filter(s => !layout[s.id]);

  const addNodeToBoard = (sessionId: string) => {
    const boardW = boardRef.current?.clientWidth || 800;
    const boardH = boardRef.current?.clientHeight || 600;
    const centerX = (-panRef.current.x + boardW / 2) - (NODE_WIDTH / 2);
    const centerY = (-panRef.current.y + boardH / 2) - (NODE_HEIGHT / 2);

    onUpdateLayout({
        ...layout,
        [sessionId]: { x: centerX, y: centerY, connections: [] }
    });
  };

  const removeNodeFromBoard = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLayout = { ...layout };
    delete newLayout[sessionId];
    // Remove connections to this node
    Object.keys(newLayout).forEach(key => {
        newLayout[key].connections = newLayout[key].connections.filter(cid => cid !== sessionId);
    });
    onUpdateLayout(newLayout);
  };

  const getPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dist = Math.abs(x2 - x1);
    const controlOffset = Math.max(dist * 0.5, 80);
    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111] flex text-white overflow-hidden font-sans select-none">
      
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-white/5 flex flex-col z-20 shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-950">
            <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wider">Backlog</h3>
            <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0 text-gray-400">✕</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {unmappedSessions.length === 0 ? (
                <div className="text-xs text-gray-600 text-center py-8 italic">Canvas is up to date.</div>
            ) : (
                unmappedSessions.map(s => (
                    <div 
                        key={s.id} 
                        className="p-3 bg-zinc-800/50 border border-white/5 rounded text-xs cursor-pointer hover:bg-zinc-800 hover:border-indigo-500 transition-all group"
                        onClick={() => addNodeToBoard(s.id)}
                    >
                        <div className="font-medium text-gray-300 group-hover:text-white truncate">{s.task}</div>
                        <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                           <span>{s.durationMinutes}m</span>
                           <span>+ Add</span>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={boardRef}
        className={`flex-1 relative bg-[#0e0e0e] overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDownBoard}
        onDoubleClick={handleDoubleClickBoard}
        onAuxClick={(e) => e.preventDefault()}
      >
        {/* Background Grid */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
                backgroundImage: 'radial-gradient(#555 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                transform: `translate(${pan.x}px, ${pan.y}px)`
            }}
        />

        <div 
            className="absolute inset-0 origin-top-left pointer-events-none"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
            
            {/* SVG Connections Layer */}
            <svg className="absolute top-0 left-0 w-[50000px] h-[50000px] pointer-events-none -translate-x-[25000px] -translate-y-[25000px] overflow-visible z-0">
                <defs>
                   <marker id="arrowhead" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                     <path d="M2,2 L10,6 L2,10 L2,2" fill="#666" />
                   </marker>
                </defs>

                {Object.keys(layout).map(sourceId => {
                    const source = layout[sourceId];
                    const sx = source.x + NODE_WIDTH;
                    const sy = source.y + (NODE_HEIGHT / 2);

                    return source.connections.map(targetId => {
                        const target = layout[targetId];
                        if (!target) return null;
                        return (
                            <path
                                key={`${sourceId}-${targetId}`}
                                d={getPath(sx, sy, target.x, target.y + NODE_HEIGHT/2)}
                                stroke="#555"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                className="opacity-60"
                            />
                        );
                    });
                })}

                {/* Temporary Link (While Dragging) */}
                {tempLink && (
                    <path 
                        d={getPath(getNodePos(tempLink.sourceId).x + NODE_WIDTH, getNodePos(tempLink.sourceId).y + NODE_HEIGHT/2, tempLink.endX, tempLink.endY)}
                        stroke="#7c3aed"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="5,5"
                        className="animate-pulse"
                    />
                )}
            </svg>

            {/* Nodes Layer */}
            {Object.keys(layout).map(id => {
                const session = completedSessions.find(s => s.id === id);
                if (!session) return null;

                const pos = getNodePos(id);
                const isDragging = draggingNodeId === id;

                return (
                    <div
                        id={`node-${id}`}
                        key={id}
                        className={`absolute flex flex-col pointer-events-auto transition-all duration-300 ease-out group/node
                            ${isDragging ? 'z-50 cursor-grabbing' : 'z-10 hover:z-[60] cursor-default'}
                        `}
                        style={{ 
                            left: pos.x, 
                            top: pos.y,
                            width: NODE_WIDTH,
                            height: NODE_HEIGHT
                        }}
                        onMouseDown={(e) => handleMouseDownNode(e, id)}
                        onMouseUp={() => handleMouseUpNode(id)}
                    >
                        <div className={`
                             w-full h-full bg-[#1a1a1a] border rounded-lg p-3 shadow-xl flex flex-col justify-between relative z-10 overflow-hidden
                             transition-all duration-300
                             ${isDragging ? 'border-indigo-500 shadow-indigo-500/20 scale-105' : 'border-white/10 group-hover/node:border-indigo-500/50 group-hover/node:w-[400px] group-hover/node:-translate-x-[90px] group-hover/node:h-auto group-hover/node:bg-zinc-900 group-hover/node:shadow-2xl'}
                        `}>
                            <div className="flex justify-between items-start pointer-events-auto shrink-0">
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                                    {new Date(session.startTime).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                </span>
                                <button 
                                    onMouseDown={(e) => e.stopPropagation()} 
                                    onClick={(e) => removeNodeFromBoard(id, e)}
                                    className="text-gray-700 hover:text-red-500 -mt-1 -mr-1 px-1 z-20"
                                >
                                    ×
                                </button>
                            </div>
                            
                            {/* Content Expansion on Hover */}
                            <div className="flex flex-col gap-2 mt-4 transition-all">
                                <div className={`text-xs font-medium text-gray-200 leading-snug group-hover/node:whitespace-normal ${isDragging ? 'line-clamp-2' : 'line-clamp-2 group-hover/node:line-clamp-none'}`}>
                                    {session.task}
                                </div>
                                
                                {/* Full Details shown only on hover */}
                                <div className="hidden group-hover/node:block text-[10px] text-gray-400 mt-2 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                                     {session.steps && session.steps.length > 0 ? (
                                         <ul className="space-y-1 list-disc list-inside">
                                             {session.steps.slice(0, 5).map((step, idx) => (
                                                 <li key={idx} className="truncate">{step}</li>
                                             ))}
                                             {session.steps.length > 5 && <li className="italic text-gray-600">+{session.steps.length - 5} more...</li>}
                                         </ul>
                                     ) : (
                                         <span className="italic text-gray-600">No logs recorded.</span>
                                     )}
                                </div>
                            </div>

                            <div className="flex justify-between items-end mt-2 shrink-0">
                                <div className={`text-[9px] px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`}>
                                    {session.durationMinutes}m
                                </div>
                            </div>
                        </div>

                        {/* CONNECTION HANDLE (RIGHT EDGE STRIP) */}
                        {/* We use a large hit area (w-8) centered on the right edge */}
                        <div 
                            className="absolute top-0 right-0 bottom-0 w-8 translate-x-1/2 z-50 flex items-center justify-center cursor-crosshair group/handle"
                            onMouseDown={(e) => handleMouseDownHandle(e, id)}
                        >
                            {/* Visual Dot (Visible on Hover) */}
                            <div className={`
                                w-3 h-3 rounded-full border-2 border-[#111] transition-all duration-200
                                ${isDragging ? 'opacity-0' : 'opacity-100'}
                                bg-gray-600 
                                group-hover/node:bg-gray-400 
                                group-hover/handle:bg-indigo-500 group-hover/handle:scale-125
                                shadow-[0_0_5px_rgba(0,0,0,0.8)]
                            `}></div>
                        </div>

                    </div>
                );
            })}
        </div>

        {/* HUD */}
        <div className="absolute top-4 right-4 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPan({x:0, y:0})}>Recenter</Button>
        </div>
      </div>
    </div>
  );
};
