import React, { useCallback, useState, memo, useEffect, useRef, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  Panel,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
  NodeChange,
  useReactFlow,
  SelectionMode,
  PanOnScrollMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toSvg } from 'html-to-image';

// Custom CSS for better contrast on controls
const customStyles = `
  .react-flow-controls-custom button {
    background: #2a2a30 !important;
    border: 1px solid rgba(255,255,255,0.15) !important;
    color: #e4e4e7 !important;
    border-radius: 6px !important;
    margin: 2px !important;
  }
  .react-flow-controls-custom button:hover {
    background: #3a3a42 !important;
    border-color: rgba(147,197,253,0.4) !important;
  }
  .react-flow-controls-custom button svg {
    fill: #e4e4e7 !important;
  }
  .react-flow-controls-custom button:hover svg {
    fill: #93c5fd !important;
  }
`;

// Formity-inspired color palette - adjusted for better contrast
const colors = {
  bg: '#0f0f11',
  bgSecondary: '#1a1a1e',
  bgTertiary: '#222228',
  border: 'rgba(255,255,255,0.12)',
  borderHover: 'rgba(147,197,253,0.4)',
  accent: '#93c5fd', // blue-300
  accentDim: '#60a5fa', // blue-400
  accentGlow: 'rgba(147,197,253,0.2)',
  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
};

// Custom node with Formity styling
const CustomNode = memo(({ data, selected }: NodeProps) => {
  const handleStyle = {
    background: colors.accent,
    width: 10,
    height: 10,
    border: `2px solid ${colors.bgSecondary}`,
    transition: 'all 0.2s ease',
  };

  const nodeType = data.nodeType as string || 'leaf';

  // Different styles based on node type
  const getNodeStyle = () => {
    const nodeColor = data.categoryColor as string || null;

    const baseStyle: React.CSSProperties = {
      background: colors.bgSecondary,
      border: `1px solid ${selected ? colors.accent : 'rgba(255,255,255,0.18)'}`,
      borderRadius: '12px',
      padding: nodeType === 'root' ? '20px 32px' : nodeType === 'category' ? '14px 20px' : '10px 16px',
      fontSize: nodeType === 'root' ? '18px' : nodeType === 'category' ? '15px' : '14px',
      fontWeight: nodeType === 'root' ? 700 : nodeType === 'category' ? 600 : 400,
      color: colors.text,
      boxShadow: selected
        ? `0 0 0 2px ${colors.accent}, 0 0 20px ${colors.accentGlow}, 0 8px 32px rgba(0,0,0,0.4)`
        : '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)',
      transition: 'all 0.2s ease',
      backdropFilter: 'blur(8px)',
    };

    if (nodeType === 'root') {
      const rootColor = nodeColor || 'rgba(147,197,253,0.35)';
      return {
        ...baseStyle,
        background: `linear-gradient(135deg, ${colors.bgSecondary} 0%, ${colors.bgTertiary} 100%)`,
        border: `2px solid ${selected ? colors.accent : rootColor}`,
        boxShadow: selected
          ? `0 0 0 2px ${colors.accent}, 0 0 20px ${colors.accentGlow}, 0 8px 32px rgba(0,0,0,0.4)`
          : `0 2px 8px rgba(0,0,0,0.3), 0 0 15px ${rootColor}40`,
      };
    }

    if (nodeType === 'category') {
      const catColor = nodeColor || colors.accent;
      return {
        ...baseStyle,
        background: colors.bgSecondary,
        border: `1px solid rgba(255,255,255,0.15)`,
        borderLeft: `3px solid ${catColor}`,
        borderRadius: '4px 12px 12px 4px',
      };
    }

    // Leaf nodes with color
    if (nodeColor) {
      return {
        ...baseStyle,
        borderLeft: `3px solid ${nodeColor}`,
        borderRadius: '4px 12px 12px 4px',
      };
    }

    return baseStyle;
  };

  return (
    <div style={getNodeStyle()}>
      {/* Top handles */}
      <Handle type="target" position={Position.Top} id="top-target" style={handleStyle} />
      <Handle type="source" position={Position.Top} id="top-source" style={{ ...handleStyle, opacity: 0 }} />

      {/* Left handles */}
      <Handle type="target" position={Position.Left} id="left-target" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="left-source" style={{ ...handleStyle, opacity: 0 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {data.icon ? <span style={{ fontSize: nodeType === 'root' ? '24px' : '16px' }}>{String(data.icon)}</span> : null}
        <span>{String(data.label)}</span>
      </div>

      {/* Bottom handles */}
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ ...handleStyle, opacity: 0 }} />

      {/* Right handles */}
      <Handle type="source" position={Position.Right} id="right-source" style={handleStyle} />
      <Handle type="target" position={Position.Right} id="right-target" style={{ ...handleStyle, opacity: 0 }} />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

// Types for our data
interface LifeSystemData {
  nodes: Node[];
  edges: Edge[];
}

interface LifeSystemMapProps {
  initialData?: LifeSystemData;
  onSave: (data: LifeSystemData) => void;
  onClose: () => void;
}

// Category colors
const categoryColors = {
  health: '#34d399', // emerald-400
  work: '#60a5fa',   // blue-400
  growth: '#fbbf24', // amber-400
  life: '#f472b6',   // pink-400
};

// Common emoji icons for picker
const emojiPalette = [
  '🧠', '💡', '⭐', '🎯', '🚀', '💪', '❤️', '🔥',
  '📚', '📖', '🔬', '💻', '📁', '📊', '📝', '✅',
  '🏃', '🧗', '🏋️', '🚴', '⚽', '🏀', '🎾', '🏊',
  '😴', '🍽️', '☕', '🥗', '💊', '🧘', '🌙', '☀️',
  '💼', '🗓️', '📞', '✉️', '🤝', '💰', '📈', '🎓',
  '🎨', '🎵', '🎬', '📷', '✈️', '🏠', '🌳', '🐕',
];

// Node type options
const nodeTypeOptions = [
  { value: 'root', label: '根节点', desc: '中心节点' },
  { value: 'category', label: '分类', desc: '一级分类' },
  { value: 'leaf', label: '叶子', desc: '具体事项' },
];

// Available color palette for node customization
const colorPalette = [
  { name: '蓝', value: '#60a5fa' },
  { name: '绿', value: '#34d399' },
  { name: '黄', value: '#fbbf24' },
  { name: '粉', value: '#f472b6' },
  { name: '紫', value: '#a78bfa' },
  { name: '橙', value: '#fb923c' },
  { name: '红', value: '#f87171' },
  { name: '青', value: '#22d3d8' },
  { name: '灰', value: '#71717a' },
];

// Default life system structure with Formity styling
const DEFAULT_NODES: Node[] = [
  {
    id: 'root',
    type: 'custom',
    position: { x: 400, y: 300 },
    data: { label: '我的生活系统', icon: '🧠', nodeType: 'root' },
  },
  // 健康 branch (睡眠 + 食物摄入)
  {
    id: 'health',
    type: 'custom',
    position: { x: 750, y: 80 },
    data: { label: '健康', icon: '💪', nodeType: 'category', categoryColor: categoryColors.health },
  },
  {
    id: 'health_sleep',
    type: 'custom',
    position: { x: 950, y: 50 },
    data: { label: '睡眠', icon: '😴', nodeType: 'leaf', categoryColor: categoryColors.health },
  },
  {
    id: 'health_nutrition',
    type: 'custom',
    position: { x: 950, y: 110 },
    data: { label: '食物摄入', icon: '🍽️', nodeType: 'leaf', categoryColor: categoryColors.health },
  },
  // 学习/Research branch
  {
    id: 'learning',
    type: 'custom',
    position: { x: 750, y: 280 },
    data: { label: '学习', icon: '📚', nodeType: 'category', categoryColor: categoryColors.growth },
  },
  {
    id: 'learning_research',
    type: 'custom',
    position: { x: 950, y: 250 },
    data: { label: 'Research', icon: '🔬', nodeType: 'leaf', categoryColor: categoryColors.growth },
  },
  {
    id: 'learning_reading',
    type: 'custom',
    position: { x: 950, y: 310 },
    data: { label: '阅读', icon: '📖', nodeType: 'leaf', categoryColor: categoryColors.growth },
  },
  // 工作 branch
  {
    id: 'work',
    type: 'custom',
    position: { x: 50, y: 80 },
    data: { label: '工作', icon: '💼', nodeType: 'category', categoryColor: categoryColors.work },
  },
  {
    id: 'work_projects',
    type: 'custom',
    position: { x: -150, y: 50 },
    data: { label: '项目', icon: '📁', nodeType: 'leaf', categoryColor: categoryColors.work },
  },
  {
    id: 'work_meetings',
    type: 'custom',
    position: { x: -150, y: 110 },
    data: { label: '会议', icon: '🗓️', nodeType: 'leaf', categoryColor: categoryColors.work },
  },
  // 运动 branch
  {
    id: 'exercise',
    type: 'custom',
    position: { x: 50, y: 520 },
    data: { label: '运动', icon: '🏃', nodeType: 'category', categoryColor: categoryColors.life },
  },
  {
    id: 'exercise_climbing',
    type: 'custom',
    position: { x: -150, y: 490 },
    data: { label: '攀岩', icon: '🧗', nodeType: 'leaf', categoryColor: categoryColors.life },
  },
  {
    id: 'exercise_gym',
    type: 'custom',
    position: { x: -150, y: 550 },
    data: { label: '健身', icon: '🏋️', nodeType: 'leaf', categoryColor: categoryColors.life },
  },
];

const DEFAULT_EDGES: Edge[] = [
  // Root to categories
  { id: 'e-root-health', source: 'root', target: 'health', style: { stroke: categoryColors.health, strokeWidth: 2 }, animated: true },
  { id: 'e-root-learning', source: 'root', target: 'learning', style: { stroke: categoryColors.growth, strokeWidth: 2 }, animated: true },
  { id: 'e-root-work', source: 'root', target: 'work', style: { stroke: categoryColors.work, strokeWidth: 2 }, animated: true },
  { id: 'e-root-exercise', source: 'root', target: 'exercise', style: { stroke: categoryColors.life, strokeWidth: 2 }, animated: true },
  // 健康 -> 睡眠, 食物摄入
  { id: 'e-health-sleep', source: 'health', target: 'health_sleep', style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 } },
  { id: 'e-health-nutrition', source: 'health', target: 'health_nutrition', style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 } },
  // 学习 -> Research, 阅读
  { id: 'e-learning-research', source: 'learning', target: 'learning_research', style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 } },
  { id: 'e-learning-reading', source: 'learning', target: 'learning_reading', style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 } },
  // 工作 -> 项目, 会议
  { id: 'e-work-projects', source: 'work', target: 'work_projects', style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 } },
  { id: 'e-work-meetings', source: 'work', target: 'work_meetings', style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 } },
  // 运动 -> 攀岩, 健身
  { id: 'e-exercise-climbing', source: 'exercise', target: 'exercise_climbing', style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 } },
  { id: 'e-exercise-gym', source: 'exercise', target: 'exercise_gym', style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 } },
];

// History for undo/redo
interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

// Snap threshold in pixels
const SNAP_THRESHOLD = 8;

// Helper to get node dimensions from measured or estimate from type
function getNodeDimensions(node: Node): { width: number; height: number } {
  // Use measured dimensions if available (from React Flow)
  if (node.measured?.width && node.measured?.height) {
    return { width: node.measured.width, height: node.measured.height };
  }
  // Fallback: estimate based on node type
  const nodeType = node.data?.nodeType as string || 'leaf';
  switch (nodeType) {
    case 'root':
      return { width: 180, height: 60 };
    case 'category':
      return { width: 120, height: 48 };
    default:
      return { width: 100, height: 40 };
  }
}

// Result type for helper lines
interface HelperLinesResult {
  horizontal: number | null;
  vertical: number | null;
  snapX: number | null;
  snapY: number | null;
  alignType: 'center' | 'top' | 'bottom' | 'left' | 'right' | null;
}

// Function to get helper lines when dragging a node
function getHelperLines(
  draggingNode: Node,
  nodes: Node[]
): HelperLinesResult {
  const draggingDim = getNodeDimensions(draggingNode);
  const draggingNodeCenterX = draggingNode.position.x + draggingDim.width / 2;
  const draggingNodeCenterY = draggingNode.position.y + draggingDim.height / 2;
  const draggingNodeLeft = draggingNode.position.x;
  const draggingNodeRight = draggingNode.position.x + draggingDim.width;
  const draggingNodeTop = draggingNode.position.y;
  const draggingNodeBottom = draggingNode.position.y + draggingDim.height;

  let closestHorizontal: number | null = null;
  let closestVertical: number | null = null;
  let snapX: number | null = null;
  let snapY: number | null = null;
  let alignType: HelperLinesResult['alignType'] = null;
  let minHorizontalDistance = SNAP_THRESHOLD;
  let minVerticalDistance = SNAP_THRESHOLD;

  for (const node of nodes) {
    if (node.id === draggingNode.id) continue;

    const nodeDim = getNodeDimensions(node);
    const nodeCenterX = node.position.x + nodeDim.width / 2;
    const nodeCenterY = node.position.y + nodeDim.height / 2;
    const nodeLeft = node.position.x;
    const nodeRight = node.position.x + nodeDim.width;
    const nodeTop = node.position.y;
    const nodeBottom = node.position.y + nodeDim.height;

    // Check vertical alignment (for horizontal line)
    // Center to center (Y axis)
    const centerYDist = Math.abs(draggingNodeCenterY - nodeCenterY);
    if (centerYDist < minHorizontalDistance) {
      minHorizontalDistance = centerYDist;
      closestHorizontal = nodeCenterY;
      // Snap so that centers align
      snapY = nodeCenterY - draggingDim.height / 2;
    }
    // Top to top
    const topDist = Math.abs(draggingNodeTop - nodeTop);
    if (topDist < minHorizontalDistance) {
      minHorizontalDistance = topDist;
      closestHorizontal = nodeTop;
      snapY = nodeTop;
    }
    // Bottom to bottom
    const bottomDist = Math.abs(draggingNodeBottom - nodeBottom);
    if (bottomDist < minHorizontalDistance) {
      minHorizontalDistance = bottomDist;
      closestHorizontal = nodeBottom;
      snapY = nodeBottom - draggingDim.height;
    }

    // Check horizontal alignment (for vertical line)
    // Center to center (X axis)
    const centerXDist = Math.abs(draggingNodeCenterX - nodeCenterX);
    if (centerXDist < minVerticalDistance) {
      minVerticalDistance = centerXDist;
      closestVertical = nodeCenterX;
      // Snap so that centers align
      snapX = nodeCenterX - draggingDim.width / 2;
    }
    // Left to left
    const leftDist = Math.abs(draggingNodeLeft - nodeLeft);
    if (leftDist < minVerticalDistance) {
      minVerticalDistance = leftDist;
      closestVertical = nodeLeft;
      snapX = nodeLeft;
    }
    // Right to right
    const rightDist = Math.abs(draggingNodeRight - nodeRight);
    if (rightDist < minVerticalDistance) {
      minVerticalDistance = rightDist;
      closestVertical = nodeRight;
      snapX = nodeRight - draggingDim.width;
    }
  }

  return { horizontal: closestHorizontal, vertical: closestVertical, snapX, snapY, alignType };
}

// Helper Lines Component that renders inside ReactFlow
const HelperLinesRenderer: React.FC<{
  horizontal: number | null;
  vertical: number | null;
}> = ({ horizontal, vertical }) => {
  const { getViewport } = useReactFlow();
  const viewport = getViewport();

  // Transform flow coordinates to screen coordinates
  const transformX = (x: number) => x * viewport.zoom + viewport.x;
  const transformY = (y: number) => y * viewport.zoom + viewport.y;

  return (
    <svg
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'visible',
      }}
    >
      {horizontal !== null && (
        <line
          x1="-10000"
          y1={transformY(horizontal)}
          x2="10000"
          y2={transformY(horizontal)}
          stroke={colors.accent}
          strokeWidth="1"
          strokeDasharray="6,4"
          opacity="0.8"
        />
      )}
      {vertical !== null && (
        <line
          x1={transformX(vertical)}
          y1="-10000"
          x2={transformX(vertical)}
          y2="10000"
          stroke={colors.accent}
          strokeWidth="1"
          strokeDasharray="6,4"
          opacity="0.8"
        />
      )}
    </svg>
  );
};

const LifeSystemMapInner: React.FC<LifeSystemMapProps> = ({
  initialData,
  onSave,
  onClose
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || DEFAULT_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNodeTypePicker, setShowNodeTypePicker] = useState(false);

  // Helper lines for alignment
  const [helperLineHorizontal, setHelperLineHorizontal] = useState<number | null>(null);
  const [helperLineVertical, setHelperLineVertical] = useState<number | null>(null);

  // Undo/Redo history
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);

  // Save to history
  const saveToHistory = useCallback(() => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }
    const newState = { nodes: [...nodes], edges: [...edges] };
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newState].slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [nodes, edges, historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    isUndoRedo.current = true;
    const prevState = history[historyIndex - 1];
    setNodes(prevState.nodes);
    setEdges(prevState.edges);
    setHistoryIndex(prev => prev - 1);
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    isUndoRedo.current = true;
    const nextState = history[historyIndex + 1];
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setHistoryIndex(prev => prev + 1);
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [history, historyIndex, setNodes, setEdges]);

  // Export to PNG
  const handleExportPng = useCallback(() => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;

    toPng(flowElement, {
      backgroundColor: colors.bg,
      width: 1920,
      height: 1080,
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `life-system-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    });
  }, []);

  // Export to SVG
  const handleExportSvg = useCallback(() => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;

    toSvg(flowElement, {
      backgroundColor: colors.bg,
    }).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `life-system-${new Date().toISOString().split('T')[0]}.svg`;
      link.href = dataUrl;
      link.click();
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave({ nodes, edges });
      }
      // Ctrl+Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z or Ctrl+Y to redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Delete key to delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode && selectedNode.id !== 'root' && !isEditing) {
          e.preventDefault();
          setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
          setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
          setSelectedNode(null);
        } else if (selectedEdge) {
          e.preventDefault();
          setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
          setSelectedEdge(null);
        }
      }
      // Escape to close pickers
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setShowNodeTypePicker(false);
        setIsEditing(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, selectedNode, selectedEdge, isEditing, onSave, handleUndo, handleRedo, setNodes, setEdges]);

  // Save history on changes
  useEffect(() => {
    saveToHistory();
  }, [nodes.length, edges.length]); // Only save on structural changes

  // Custom onNodesChange with snap functionality
  const customOnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Check if any node is being dragged
      const dragChange = changes.find(
        (change) => change.type === 'position' && change.dragging
      );

      if (dragChange && dragChange.type === 'position' && dragChange.position) {
        const draggingNode = nodes.find((n) => n.id === dragChange.id);
        if (draggingNode) {
          // Create a temporary node with the new position for calculation
          const tempNode = {
            ...draggingNode,
            position: dragChange.position,
          };

          const { horizontal, vertical, snapX, snapY } = getHelperLines(tempNode, nodes);

          setHelperLineHorizontal(horizontal);
          setHelperLineVertical(vertical);

          // Apply snap if close enough
          if (snapX !== null || snapY !== null) {
            const snappedChanges = changes.map((change) => {
              if (change.type === 'position' && change.id === dragChange.id && change.position) {
                return {
                  ...change,
                  position: {
                    x: snapX !== null ? snapX : change.position.x,
                    y: snapY !== null ? snapY : change.position.y,
                  },
                };
              }
              return change;
            });
            onNodesChange(snappedChanges as NodeChange[]);
            return;
          }
        }
      } else {
        // Clear helper lines when not dragging
        const isDragging = changes.some(
          (change) => change.type === 'position' && change.dragging
        );
        if (!isDragging) {
          setHelperLineHorizontal(null);
          setHelperLineVertical(null);
        }
      }

      onNodesChange(changes);
    },
    [nodes, onNodesChange]
  );

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: colors.accent, strokeWidth: 2 }
    }, eds)),
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setEditLabel(node.data.label as string);
    setIsEditing(false);
  }, []);

  // Handle edge selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setIsEditing(false);
  }, []);

  // Handle double-click on empty canvas to create new node
  const onPaneDoubleClick = useCallback((event: React.MouseEvent) => {
    // Get the position in flow coordinates
    const reactFlowBounds = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
    if (!reactFlowBounds) return;

    const position = {
      x: event.clientX - reactFlowBounds.left - 50,
      y: event.clientY - reactFlowBounds.top - 20,
    };

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position,
      data: {
        label: '新节点',
        icon: '📌',
        nodeType: 'leaf'
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
  }, [setNodes]);

  // Delete selected edge
  const handleDeleteEdge = useCallback(() => {
    if (!selectedEdge) return;
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
    setSelectedEdge(null);
  }, [selectedEdge, setEdges]);

  // Change edge color
  const handleChangeEdgeColor = useCallback((color: string) => {
    if (!selectedEdge) return;
    setEdges((eds) =>
      eds.map((e) =>
        e.id === selectedEdge.id
          ? { ...e, style: { ...e.style, stroke: color, strokeWidth: 2 } }
          : e
      )
    );
    // Update selectedEdge state to reflect the change
    setSelectedEdge((prev) => prev ? { ...prev, style: { ...prev.style, stroke: color, strokeWidth: 2 } } : null);
  }, [selectedEdge, setEdges]);

  // Compute edges with highlight for selected edge
  const highlightedEdges = useMemo(() => {
    return edges.map((edge) => {
      if (selectedEdge && edge.id === selectedEdge.id) {
        // Highlight selected edge
        const currentStroke = (edge.style?.stroke as string) || 'rgba(255,255,255,0.15)';
        return {
          ...edge,
          style: {
            ...edge.style,
            strokeWidth: 4,
            filter: `drop-shadow(0 0 6px ${currentStroke})`,
          },
          animated: true,
        };
      }
      return edge;
    });
  }, [edges, selectedEdge]);

  // Add new node
  const handleAddNode = useCallback(() => {
    if (!newNodeLabel.trim()) return;

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: {
        x: selectedNode ? selectedNode.position.x + 200 : 400,
        y: selectedNode ? selectedNode.position.y : 300
      },
      data: {
        label: newNodeLabel,
        nodeType: 'leaf'
      },
    };

    setNodes((nds) => [...nds, newNode]);

    if (selectedNode) {
      const newEdge: Edge = {
        id: `e-${selectedNode.id}-${newNode.id}`,
        source: selectedNode.id,
        target: newNode.id,
        style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 },
      };
      setEdges((eds) => [...eds, newEdge]);
    }

    setNewNodeLabel('');
  }, [newNodeLabel, selectedNode, setNodes, setEdges]);

  // Delete selected node
  const handleDeleteNode = useCallback(() => {
    if (!selectedNode || selectedNode.id === 'root') return;

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  // Edit node label
  const handleEditNode = useCallback(() => {
    if (!selectedNode || !editLabel.trim()) return;

    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, label: editLabel } }
          : n
      )
    );
    setIsEditing(false);
  }, [selectedNode, editLabel, setNodes]);

  // Change node color
  const handleChangeColor = useCallback((color: string) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, categoryColor: color } }
          : n
      )
    );
  }, [selectedNode, setNodes]);

  // Change node icon
  const handleChangeIcon = useCallback((icon: string) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, icon } }
          : n
      )
    );
    setShowEmojiPicker(false);
  }, [selectedNode, setNodes]);

  // Change node type
  const handleChangeNodeType = useCallback((nodeType: string) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, nodeType } }
          : n
      )
    );
    setShowNodeTypePicker(false);
  }, [selectedNode, setNodes]);

  // Save data
  const handleSave = useCallback(() => {
    onSave({ nodes, edges });
  }, [nodes, edges, onSave]);

  // Reset to default
  const handleReset = useCallback(() => {
    if (confirm('确定要重置为默认布局吗？')) {
      setNodes(DEFAULT_NODES);
      setEdges(DEFAULT_EDGES);
      setSelectedNode(null);
    }
  }, [setNodes, setEdges]);

  // Button component with Formity styling
  const Button = ({
    children,
    onClick,
    variant = 'secondary',
    className = ''
  }: {
    children: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    className?: string;
  }) => {
    const baseStyle = "px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5";
    const variants = {
      primary: `bg-[${colors.accent}]/10 text-[${colors.accent}] border border-[${colors.accent}]/20 hover:bg-[${colors.accent}]/20 hover:border-[${colors.accent}]/40`,
      secondary: `bg-white/5 text-[${colors.textSecondary}] border border-white/10 hover:bg-white/10 hover:text-white`,
      ghost: `text-[${colors.textMuted}] hover:text-[${colors.textSecondary}] hover:bg-white/5`,
    };
    return (
      <button className={`${baseStyle} ${variants[variant]} ${className}`} onClick={onClick}>
        {children}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: colors.bg,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <style>{customStyles}</style>
      {/* Header - Formity style */}
      <div
        className="flex items-center justify-between px-5 py-4 z-10"
        style={{
          background: colors.bgSecondary,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.accentGlow} 0%, transparent 100%)`,
                border: `1px solid ${colors.borderHover}`,
              }}
            >
              🧠
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: colors.text }}>Life System</h2>
              <p className="text-xs" style={{ color: colors.textMuted }}>Mind Map Editor</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mr-2 pr-2" style={{ borderRight: `1px solid ${colors.border}` }}>
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ color: colors.textMuted }}
              title="撤销 (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ color: colors.textMuted }}
              title="重做 (Ctrl+Y)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>

          {/* Export dropdown */}
          <div className="relative group">
            <Button variant="ghost" onClick={() => {}}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              导出
            </Button>
            <div
              className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
              style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}`, minWidth: '120px' }}
            >
              <button
                onClick={handleExportPng}
                className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors"
                style={{ color: colors.text }}
              >
                导出 PNG
              </button>
              <button
                onClick={handleExportSvg}
                className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors"
                style={{ color: colors.text }}
              >
                导出 SVG
              </button>
            </div>
          </div>

          <Button variant="ghost" onClick={handleReset}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重置
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            保存
          </Button>
          <button
            onClick={onClose}
            className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              color: colors.textMuted,
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = colors.textMuted;
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-4 px-5 py-3 z-10"
        style={{
          background: colors.bg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newNodeLabel}
            onChange={(e) => setNewNodeLabel(e.target.value)}
            placeholder="新节点名称..."
            className="px-3 py-2 text-sm rounded-lg w-44 transition-all duration-200 outline-none"
            style={{
              background: colors.bgSecondary,
              border: `1px solid ${colors.border}`,
              color: colors.text,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accentGlow}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddNode();
            }}
          />
          <Button variant="secondary" onClick={handleAddNode}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加
          </Button>
        </div>

        <div className="w-px h-6" style={{ background: colors.border }} />

        {selectedNode ? (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg w-36 outline-none"
                  style={{
                    background: colors.bgSecondary,
                    border: `1px solid ${colors.accent}`,
                    color: colors.text,
                    boxShadow: `0 0 0 3px ${colors.accentGlow}`,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditNode();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  autoFocus
                />
                <Button variant="primary" onClick={handleEditNode}>确认</Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>取消</Button>
              </>
            ) : (
              <>
                <div
                  className="px-3 py-1.5 rounded-lg text-sm"
                  style={{
                    background: colors.accentGlow,
                    border: `1px solid ${colors.borderHover}`,
                    color: colors.accent,
                  }}
                >
                  {selectedNode.data.icon as string} {selectedNode.data.label as string}
                </div>
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  编辑
                </Button>

                {/* Emoji picker */}
                <div className="relative ml-2 pl-2" style={{ borderLeft: `1px solid ${colors.border}` }}>
                  <button
                    onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowNodeTypePicker(false); }}
                    className="px-2 py-1 rounded-lg text-sm transition-all hover:bg-white/5"
                    style={{ color: colors.text, border: `1px solid ${colors.border}` }}
                    title="更换图标"
                  >
                    {selectedNode.data.icon ? String(selectedNode.data.icon) : '📌'} ▼
                  </button>
                  {showEmojiPicker && (
                    <div
                      className="absolute left-0 top-full mt-1 p-2 rounded-lg shadow-xl z-50 grid grid-cols-8 gap-1"
                      style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}`, width: '280px' }}
                    >
                      {emojiPalette.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleChangeIcon(emoji)}
                          className="w-8 h-8 rounded hover:bg-white/10 transition-colors text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Node type picker */}
                <div className="relative">
                  <button
                    onClick={() => { setShowNodeTypePicker(!showNodeTypePicker); setShowEmojiPicker(false); }}
                    className="px-2 py-1 rounded-lg text-xs transition-all hover:bg-white/5"
                    style={{ color: colors.textSecondary, border: `1px solid ${colors.border}` }}
                    title="更换节点类型"
                  >
                    {nodeTypeOptions.find(t => t.value === selectedNode.data.nodeType)?.label || '叶子'} ▼
                  </button>
                  {showNodeTypePicker && (
                    <div
                      className="absolute left-0 top-full mt-1 py-1 rounded-lg shadow-xl z-50"
                      style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}`, minWidth: '120px' }}
                    >
                      {nodeTypeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleChangeNodeType(opt.value)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors flex items-center justify-between"
                          style={{
                            color: selectedNode.data.nodeType === opt.value ? colors.accent : colors.text,
                          }}
                        >
                          <span>{opt.label}</span>
                          <span className="text-xs" style={{ color: colors.textMuted }}>{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Color picker */}
                <div className="flex items-center gap-1 ml-2 pl-2" style={{ borderLeft: `1px solid ${colors.border}` }}>
                  {colorPalette.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleChangeColor(c.value)}
                      title={c.name}
                      className="w-5 h-5 rounded-full transition-all hover:scale-110"
                      style={{
                        background: c.value,
                        border: selectedNode.data.categoryColor === c.value
                          ? '2px solid white'
                          : '2px solid transparent',
                        boxShadow: selectedNode.data.categoryColor === c.value
                          ? `0 0 8px ${c.value}`
                          : 'none',
                      }}
                    />
                  ))}
                </div>

                {selectedNode.id !== 'root' && (
                  <Button
                    variant="ghost"
                    onClick={handleDeleteNode}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    删除
                  </Button>
                )}
              </>
            )}
          </div>
        ) : selectedEdge ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: colors.bgTertiary }}>
              <div
                className="w-4 h-1 rounded-full"
                style={{ background: (selectedEdge.style?.stroke as string) || 'rgba(255,255,255,0.15)' }}
              />
              <span style={{ color: colors.textSecondary }}>连接线已选中</span>
            </div>

            {/* Edge color picker */}
            <div className="flex items-center gap-1 pl-2" style={{ borderLeft: `1px solid ${colors.border}` }}>
              <span className="text-xs mr-1" style={{ color: colors.textMuted }}>颜色:</span>
              {colorPalette.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleChangeEdgeColor(c.value)}
                  title={c.name}
                  className="w-5 h-5 rounded-full transition-all hover:scale-110"
                  style={{
                    background: c.value,
                    border: (selectedEdge.style?.stroke as string) === c.value
                      ? '2px solid white'
                      : '2px solid transparent',
                    boxShadow: (selectedEdge.style?.stroke as string) === c.value
                      ? `0 0 8px ${c.value}`
                      : 'none',
                  }}
                />
              ))}
              {/* Default/subtle color option */}
              <button
                onClick={() => handleChangeEdgeColor('rgba(255,255,255,0.15)')}
                title="默认"
                className="w-5 h-5 rounded-full transition-all hover:scale-110"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: (selectedEdge.style?.stroke as string) === 'rgba(255,255,255,0.15)'
                    ? '2px solid white'
                    : '2px solid transparent',
                }}
              />
            </div>

            <Button
              variant="ghost"
              onClick={handleDeleteEdge}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              删除连线
            </Button>
          </div>
        ) : (
          <span className="text-sm" style={{ color: colors.textMuted }}>
            点击节点选择，从边缘拖出创建连线
          </span>
        )}
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={highlightedEdges}
          onNodesChange={customOnNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
          onDoubleClick={onPaneDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          style={{ background: colors.bg }}
          defaultEdgeOptions={{
            style: { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1.5 },
            type: 'smoothstep',
          }}
          proOptions={{ hideAttribution: true }}
          // Pan with scroll wheel or middle mouse button
          panOnScroll={true}
          panOnScrollMode={PanOnScrollMode.Free}
          panOnDrag={[1, 2]}
          // Selection box with left mouse drag on empty space
          selectionOnDrag={true}
          selectionMode={SelectionMode.Partial}
          // Zoom with Ctrl+scroll or pinch
          zoomOnScroll={false}
          zoomOnPinch={true}
          // Default cursor style (arrow instead of grab)
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          className="cursor-default"
        >
          {/* Helper Lines for alignment */}
          <HelperLinesRenderer
            horizontal={helperLineHorizontal}
            vertical={helperLineVertical}
          />
          <Controls
            style={{
              background: colors.bgTertiary,
              border: `1px solid rgba(255,255,255,0.2)`,
              borderRadius: '10px',
              padding: '4px',
            }}
            className="react-flow-controls-custom"
          />
          <MiniMap
            style={{
              background: colors.bgSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
            }}
            nodeColor={(node) => {
              if (node.id === 'root') return colors.accent;
              if (node.id.startsWith('health')) return categoryColors.health;
              if (node.id.startsWith('learning')) return categoryColors.growth;
              if (node.id.startsWith('work')) return categoryColors.work;
              if (node.id.startsWith('exercise')) return categoryColors.life;
              return colors.textMuted;
            }}
            maskColor="rgba(0,0,0,0.7)"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255,255,255,0.08)"
          />

          <Panel position="bottom-right" className="text-xs p-3" style={{ color: colors.textMuted }}>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}` }}>滚轮</kbd>
                平移
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}` }}>Ctrl+滚轮</kbd>
                缩放
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}` }}>拖拽空白</kbd>
                框选
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}` }}>Del</kbd>
                删除
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: colors.bgSecondary, border: `1px solid ${colors.border}` }}>Ctrl+Z</kbd>
                撤销
              </span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

// Wrapper component with ReactFlowProvider
export const LifeSystemMap: React.FC<LifeSystemMapProps> = (props) => {
  return (
    <ReactFlowProvider>
      <LifeSystemMapInner {...props} />
    </ReactFlowProvider>
  );
};
