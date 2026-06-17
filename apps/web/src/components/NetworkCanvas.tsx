import { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { computeShapeChain, formatShape, getConnectionMatrixSpec } from '@nnviz/nn-math';
import type { LayerType } from '@nnviz/shared';
import { useNetworkStore } from '@/store/networkStore';
import { LayerNode, type LayerNodeData } from './nodes/LayerNode';
import { ParamMatrixEdge } from './edges/ParamMatrixEdge';
import { getLayerDisplayName, getNeuronCount } from '@/lib/layerIcons';
import { useEditorKeyboard } from '@/hooks/useEditorKeyboard';
import {
  CanvasContextMenu,
  type ContextMenuState,
} from '@/components/editor/CanvasContextMenu';

const nodeTypes: NodeTypes = {
  layerNode: LayerNode,
};

const edgeTypes: EdgeTypes = {
  paramMatrix: ParamMatrixEdge,
};

const SNAP_GRID: [number, number] = [20, 20];

function NetworkCanvasInner() {
  useEditorKeyboard();

  const { screenToFlowPosition, fitView } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const architecture = useNetworkStore((s) => s.getActiveArchitecture());
  const selectedLayerId = useNetworkStore((s) => s.selectedLayerId);
  const connectMode = useNetworkStore((s) => s.connectMode);
  const viewMode = useNetworkStore((s) => s.viewMode);
  const showParamMatrices = useNetworkStore((s) => s.showParamMatrices);
  const clipboardLayer = useNetworkStore((s) => s.clipboardLayer);
  const setSelectedLayerId = useNetworkStore((s) => s.setSelectedLayerId);
  const moveLayer = useNetworkStore((s) => s.moveLayer);
  const handleConnectClick = useNetworkStore((s) => s.handleConnectClick);
  const addLayerAt = useNetworkStore((s) => s.addLayerAt);
  const removeLayer = useNetworkStore((s) => s.removeLayer);
  const copySelectedLayer = useNetworkStore((s) => s.copySelectedLayer);
  const pasteLayer = useNetworkStore((s) => s.pasteLayer);
  const toggleConnectMode = useNetworkStore((s) => s.toggleConnectMode);
  const autoLayout = useNetworkStore((s) => s.autoLayout);

  const shapes = useMemo(
    () => (architecture ? computeShapeChain(architecture) : []),
    [architecture],
  );

  const flowNodes: Node[] = useMemo(() => {
    if (!architecture) return [];
    return architecture.layers.map((layer) => {
      const shape = shapes.find((s) => s.layerId === layer.id);
      const neuronCount = getNeuronCount(
        layer.type,
        layer.params,
        layer.nodeCount,
        layer.type === 'input' ? architecture.inputShape : undefined,
      );
      return {
        id: layer.id,
        type: 'layerNode',
        position: layer.position,
        data: {
          layerType: layer.type,
          layerId: layer.id,
          displayName: getLayerDisplayName(layer.type, layer.name),
          nodeCount: layer.nodeCount,
          selected: layer.id === selectedLayerId,
          outputShape: shape ? formatShape(shape.outputShape) : undefined,
          viewMode,
          neuronCount,
        } satisfies LayerNodeData,
      };
    });
  }, [architecture, shapes, selectedLayerId, viewMode]);

  const flowEdges: Edge[] = useMemo(() => {
    if (!architecture) return [];
    return architecture.edges.map((edge, i) => {
      const spec = getConnectionMatrixSpec(edge.from, edge.to, shapes);
      const dimLabel = spec ? `${spec.rows}×${spec.cols}` : undefined;
      return {
        id: `${edge.from}-${edge.to}-${i}`,
        type: 'paramMatrix',
        source: edge.from,
        target: edge.to,
        label: showParamMatrices ? undefined : dimLabel ?? (edge.weight !== undefined ? `w=${edge.weight.toFixed(2)}` : undefined),
        animated: connectMode,
        style: { stroke: 'var(--color-primary)', strokeWidth: showParamMatrices ? 2 : 1.5 },
        data: {
          matrixRows: spec?.rows ?? 0,
          matrixCols: spec?.cols ?? 0,
          matrixLabel: spec?.label ?? '',
          showMatrix: showParamMatrices && !!spec,
          seed: `${edge.from}-${edge.to}`,
        },
      };
    });
  }, [architecture, shapes, connectMode, showParamMatrices]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      closeContextMenu();
      if (connectMode) {
        handleConnectClick(node.id);
      } else {
        setSelectedLayerId(node.id);
      }
    },
    [closeContextMenu, connectMode, handleConnectClick, setSelectedLayerId],
  );

  const onPaneClick = useCallback(() => {
    closeContextMenu();
    if (!connectMode) setSelectedLayerId(null);
  }, [closeContextMenu, connectMode, setSelectedLayerId]);

  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      moveLayer(node.id, node.position);
    },
    [moveLayer],
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        target: 'pane',
        flowX: flowPosition.x,
        flowY: flowPosition.y,
      });
    },
    [screenToFlowPosition],
  );

  const onNodeContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent, node: Node) => {
      event.preventDefault();
      setSelectedLayerId(node.id);
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        target: 'node',
        layerId: node.id,
        flowX: node.position.x,
        flowY: node.position.y,
      });
    },
    [setSelectedLayerId],
  );

  const handleAddLayer = useCallback(
    (type: LayerType, position: { x: number; y: number }) => {
      addLayerAt(type, position);
    },
    [addLayerAt],
  );

  const handleConnect = useCallback(() => {
    if (!connectMode) toggleConnectMode();
  }, [connectMode, toggleConnectMode]);

  const handleDelete = useCallback(() => {
    if (contextMenu?.layerId) removeLayer(contextMenu.layerId);
    else if (selectedLayerId) removeLayer(selectedLayerId);
  }, [contextMenu?.layerId, removeLayer, selectedLayerId]);

  if (!architecture) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Create or select a project to begin
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {connectMode && (
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
          Connect mode — click two layers to link them
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.3}
        maxZoom={2}
        snapToGrid
        snapGrid={SNAP_GRID}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Lines} gap={SNAP_GRID[0]} size={1} color="var(--color-border)" />
        <Controls className="!border-border !bg-card !shadow-lg [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground [&>button:hover]:!bg-accent" />
        <MiniMap
          nodeColor={() => 'var(--color-primary)'}
          className="!border-border !bg-card"
        />
      </ReactFlow>

      <CanvasContextMenu
        menu={contextMenu}
        onClose={closeContextMenu}
        onAddLayer={handleAddLayer}
        onCopy={copySelectedLayer}
        onPaste={pasteLayer}
        onDelete={handleDelete}
        onConnect={handleConnect}
        onAutoLayout={autoLayout}
        onFitView={() => fitView({ padding: 0.2, duration: 300 })}
        canCopy={!!selectedLayerId}
        canPaste={!!clipboardLayer}
        canDelete={!!(contextMenu?.layerId ?? selectedLayerId)}
      />
    </div>
  );
}

export function NetworkCanvas() {
  return (
    <ReactFlowProvider>
      <NetworkCanvasInner />
    </ReactFlowProvider>
  );
}
