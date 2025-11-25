
import React, { useState, useRef, useMemo } from 'react';
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
  
  // State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  
  // Dragging Node State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Linking State
  const [tempLink, setTempLink] = useState<{ sourceId: string; endX: number; endY: number } | null>(null);

  // Refs
  const boardRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Helpers
  const getNodePos = (id: string) => {
    return layout[id] || { x: 100, y: 100, connections: [] };
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    // Convert screen coordinates to canvas coordinates accounting for Pan and Zoom
    // For now we keep zoom at 1 for simplicity, but math is ready
    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom
    };
  };

  // --- Event Handlers ---

  const handleMouseDownBoard = (e: React.MouseEvent) => {
    if (e.target === boardRef.current) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  // 1. Start Dragging Node
  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const pos = getNodePos(id);
    const mouseCanvas = getCanvasCoordinates(e.clientX, e.clientY);
    
    setDraggingNodeId(id);
    setDragOffset({
      x: mouseCanvas.x - pos.x,
      y: mouseCanvas.y - pos.y
    });
  };

  // 2. Start Dragging Link (Handle Click)
  const handleMouseDownHandle = (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    const pos = getNodePos(sourceId);
    
    // Start the temp link from the handle position (Right side of node)
    const startX = pos.x + NODE_WIDTH;
    const startY = pos.y + (NODE_HEIGHT / 2);

    setTempLink({
      sourceId,
      endX: startX, // Initially ends at start
      endY: startY
    });
  };

  // 3. Global Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    // A. Panning Board
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const mouseCanvas = getCanvasCoordinates(e.clientX, e.clientY);

    // B. Dragging Node
    if (draggingNodeId) {
      const newX = mouseCanvas.x - dragOffset.x;
      const newY = mouseCanvas.y - dragOffset.y;
      
      onUpdateLayout({
        ...layout,
        [draggingNodeId]: {
            ...getNodePos(draggingNodeId),
            x: newX,
            y: newY
        }
      });
      return;
    }

    // C. Dragging Connection Wire
    if (tempLink) {
      setTempLink(prev => prev ? { ...prev, endX: mouseCanvas.x, endY: mouseCanvas.y } : null);
    }
  };

  // 4. Global Mouse Up
  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);
    setDraggingNodeId(null);

    // If we were dragging a link, check if we dropped it on a node
    if (tempLink) {
      // Logic handled in handleMouseUpNode, but if we drop here (on empty space), cancel it
      setTempLink(null);
    }
  };

  // 5. Drop Link on Target Node
  const handleMouseUpNode = (e: React.MouseEvent, targetId: string) => {
    if (tempLink && tempLink.sourceId !== targetId) {
       e.stopPropagation();
       const sourceNode = getNodePos(tempLink.sourceId);
       
       // Avoid duplicates
       if (!sourceNode.connections.includes(targetId)) {
          const newLayout = {
             ...layout,
             [tempLink.sourceId]: {
                ...sourceNode,
                connections: [...sourceNode.connections, targetId]
             }
          };
          onUpdateLayout(newLayout);
       }
       setTempLink(null);
    }
  };

  // --- Sidebar Logic ---
  const unmappedSessions = completedSessions.filter(s => !layout[s.id]);

  const addNodeToBoard = (sessionId: string) => {
    const boardW = boardRef.current?.clientWidth || 800;
    const boardH = boardRef.current?.clientHeight || 600;
    // Center in current view
    const centerX = (-pan.x + boardW / 2) - (NODE_WIDTH / 2);
    const centerY = (-pan.y + boardH / 2) - (NODE_HEIGHT / 2);

    onUpdateLayout({
        ...layout,
        [sessionId]: { x: centerX, y: centerY, connections: [] }
    });
  };

  const removeNodeFromBoard = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLayout = { ...layout };
    delete newLayout[sessionId];
    // Remove connections TO this node
    Object.keys(newLayout).forEach(key => {
        newLayout[key].connections = newLayout[key].connections.filter(cid => cid !== sessionId);
    });
    onUpdateLayout(newLayout);
  };

  // --- Render Helpers ---

  // Generate a bezier curve path
  const getPath = (x1: number, y1: number, x2: number, y2: number) => {
    // Control points: extended horizontally from the source and target
    // Source comes out of Right, Target enters from Left usually, 
    // but in a canvas it enters closest side. For simplicity, we assume Right-to-Left flow usually
    // or just maintain horizontal curvature.
    
    const dist = Math.abs(x2 - x1);
    const controlOffset = Math.max(dist * 0.5, 50);

    const cp1x = x1 + controlOffset;
    const cp1y = y1;
    const cp2x = x2 - controlOffset;
    const cp2y = y2;

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
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
                           <span>+ Add to canvas</span>
                        </div>
                    </div>
                ))
            )}
        </div>
        <div className="p-3 border-t border-white/5 bg-zinc-950/50">
            <div className="text-[10px] text-gray-600">
                Tip: Drag the <strong>dot</strong> on the right of a card to link it to another.
            </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={boardRef}
        className={`flex-1 relative bg-[#0e0e0e] overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDownBoard}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Dot Grid Pattern */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
                backgroundImage: 'radial-gradient(#555 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                transform: `translate(${pan.x}px, ${pan.y}px)`
            }}
        />

        {/* --- CANVAS CONTENT --- */}
        <div 
            className="absolute inset-0 origin-top-left pointer-events-none"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
            
            {/* 1. Connections Layer (SVG) */}
            <svg className="absolute top-0 left-0 w-[50000px] h-[50000px] pointer-events-none -translate-x-[25000px] -translate-y-[25000px] overflow-visible">
                <defs>
                   <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                     <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                   </marker>
                </defs>

                {/* Existing Connections */}
                {Object.keys(layout).map(sourceId => {
                    const source = layout[sourceId];
                    // Output point (Right Center)
                    const sx = source.x + NODE_WIDTH;
                    const sy = source.y + (NODE_HEIGHT / 2);

                    return source.connections.map(targetId => {
                        const target = layout[targetId];
                        if (!target) return null;
                        
                        // Input point (Left Center)
                        const tx = target.x;
                        const ty = target.y + (NODE_HEIGHT / 2);

                        return (
                            <path
                                key={`${sourceId}-${targetId}`}
                                d={getPath(sx, sy, tx, ty)}
                                stroke="#555"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    });
                })}

                {/* Temporary Link (While dragging) */}
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

            {/* 2. Nodes Layer */}
            {Object.keys(layout).map(id => {
                const session = completedSessions.find(s => s.id === id);
                if (!session) return null;

                const pos = getNodePos(id);
                const isDragging = draggingNodeId === id;

                return (
                    <div
                        id={`node-${id}`}
                        key={id}
                        className={`absolute flex flex-col pointer-events-auto transition-shadow
                            ${isDragging ? 'z-50 cursor-grabbing' : 'z-10 cursor-grab'}
                        `}
                        style={{ 
                            left: pos.x, 
                            top: pos.y,
                            width: NODE_WIDTH,
                            height: NODE_HEIGHT
                        }}
                        onMouseDown={(e) => handleMouseDownNode(e, id)}
                        onMouseUp={(e) => handleMouseUpNode(e, id)}
                    >
                        {/* Card Body */}
                        <div className={`
                             w-full h-full bg-[#1a1a1a] border rounded-lg p-3 shadow-xl flex flex-col justify-between
                             ${isDragging ? 'border-indigo-500 shadow-indigo-500/20 scale-105 transition-transform' : 'border-white/10 hover:border-white/30'}
                        `}>
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                                    {new Date(session.startTime).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                </span>
                                <button 
                                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
                                    onClick={(e) => removeNodeFromBoard(id, e)}
                                    className="text-gray-700 hover:text-red-500 -mt-1 -mr-1 px-1 transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            
                            {/* Content */}
                            <div className="text-xs font-medium text-gray-200 line-clamp-2 leading-snug">
                                {session.task}
                            </div>
                            
                            {/* Footer */}
                            <div className="flex justify-between items-end mt-1">
                                <div className={`text-[9px] px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`}>
                                    {session.durationMinutes}m
                                </div>
                            </div>
                        </div>

                        {/* CONNECTION HANDLE (Right Side) */}
                        <div 
                            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair group/handle"
                            onMouseDown={(e) => handleMouseDownHandle(e, id)}
                        >
                            <div className="w-3 h-3 bg-gray-600 rounded-full border-2 border-[#0e0e0e] group-hover/handle:bg-indigo-500 group-hover/handle:scale-125 transition-all"></div>
                        </div>

                    </div>
                );
            })}

        </div>

        {/* Floating Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPan({x:0, y:0})}>Recenter</Button>
        </div>

      </div>
    </div>
  );
};
