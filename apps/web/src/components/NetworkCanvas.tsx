import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { computeShapeChain, formatShape, getConnectionMatrixSpec } from '@nnviz/nn-math';
import { useNetworkStore } from '@/store/networkStore';
import { LayerNode, type LayerNodeData } from './nodes/LayerNode';
import { ParamMatrixEdge } from './edges/ParamMatrixEdge';
import { getLayerDisplayName, getNeuronCount } from '@/lib/layerIcons';
import { useEditorKeyboard } from '@/hooks/useEditorKeyboard';

const nodeTypes: NodeTypes = {
  layerNode: LayerNode,
};

const edgeTypes: EdgeTypes = {
  paramMatrix: ParamMatrixEdge,
};

export function NetworkCanvas() {
  useEditorKeyboard();

  const architecture = useNetworkStore((s) => s.getActiveArchitecture());
  const selectedLayerId = useNetworkStore((s) => s.selectedLayerId);
  const connectMode = useNetworkStore((s) => s.connectMode);
  const viewMode = useNetworkStore((s) => s.viewMode);
  const showParamMatrices = useNetworkStore((s) => s.showParamMatrices);
  const setSelectedLayerId = useNetworkStore((s) => s.setSelectedLayerId);
  const moveLayer = useNetworkStore((s) => s.moveLayer);
  const handleConnectClick = useNetworkStore((s) => s.handleConnectClick);

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

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (connectMode) {
        handleConnectClick(node.id);
      } else {
        setSelectedLayerId(node.id);
      }
    },
    [connectMode, handleConnectClick, setSelectedLayerId],
  );

  const onPaneClick = useCallback(() => {
    if (!connectMode) setSelectedLayerId(null);
  }, [connectMode, setSelectedLayerId]);

  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      moveLayer(node.id, node.position);
    },
    [moveLayer],
  );

  if (!architecture) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Create or select a project to begin
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--color-border)" />
        <Controls className="!border-border !bg-card !shadow-lg [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground [&>button:hover]:!bg-accent" />
        <MiniMap
          nodeColor={() => 'var(--color-primary)'}
          className="!border-border !bg-card"
        />
      </ReactFlow>
    </div>
  );
}
