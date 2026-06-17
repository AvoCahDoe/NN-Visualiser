import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { LayerConfig, LayerType, NetworkArchitecture } from '@nnviz/shared';
import { createEmptyArchitecture, createLayer, generateId } from '@nnviz/shared';

export type CanvasViewMode = 'compact' | 'nodes';

export interface ProjectEntry {
  id: string;
  name: string;
  architecture: NetworkArchitecture;
  updatedAt: string;
}

interface NetworkState {
  projects: ProjectEntry[];
  activeProjectId: string | null;
  selectedLayerId: string | null;
  connectMode: boolean;
  connectFirstLayerId: string | null;
  fullyConnectedMode: boolean;
  viewMode: CanvasViewMode;
  showParamMatrices: boolean;
  clipboardLayer: LayerConfig | null;

  getActiveArchitecture: () => NetworkArchitecture | null;
  createProject: (name?: string) => void;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  importProject: (architecture: NetworkArchitecture) => void;
  updateArchitecture: (updater: (arch: NetworkArchitecture) => void) => void;

  addLayer: (type: LayerType) => void;
  removeLayer: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<LayerConfig>) => void;
  moveLayer: (layerId: string, position: { x: number; y: number }) => void;
  addEdge: (from: string, to: string, weight?: number) => void;
  removeEdge: (from: string, to: string) => void;
  fullyConnectLayers: () => void;
  autoLayout: () => void;
  setInputShape: (shape: number[]) => void;

  setViewMode: (mode: CanvasViewMode) => void;
  toggleShowParamMatrices: () => void;
  copySelectedLayer: () => void;
  pasteLayer: () => void;

  setSelectedLayerId: (id: string | null) => void;
  toggleConnectMode: () => void;
  handleConnectClick: (layerId: string) => void;
  toggleFullyConnectedMode: () => void;
}

function touchMetadata(arch: NetworkArchitecture) {
  arch.metadata.updatedAt = new Date().toISOString();
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    immer((set, get) => ({
      projects: [],
      activeProjectId: null,
      selectedLayerId: null,
      connectMode: false,
      connectFirstLayerId: null,
      fullyConnectedMode: false,
      viewMode: 'compact' as CanvasViewMode,
      showParamMatrices: false,
      clipboardLayer: null,

      getActiveArchitecture: () => {
        const { projects, activeProjectId } = get();
        return projects.find((p) => p.id === activeProjectId)?.architecture ?? null;
      },

      createProject: (name) => {
        const arch = createEmptyArchitecture(name);
        const entry: ProjectEntry = {
          id: arch.id,
          name: arch.name,
          architecture: arch,
          updatedAt: arch.metadata.updatedAt,
        };
        set((state) => {
          state.projects.push(entry);
          state.activeProjectId = entry.id;
          state.selectedLayerId = arch.layers[0]?.id ?? null;
        });
      },

      switchProject: (id) => {
        set((state) => {
          state.activeProjectId = id;
          const arch = state.projects.find((p) => p.id === id)?.architecture;
          state.selectedLayerId = arch?.layers[0]?.id ?? null;
        });
      },

      deleteProject: (id) => {
        set((state) => {
          state.projects = state.projects.filter((p) => p.id !== id);
          if (state.activeProjectId === id) {
            state.activeProjectId = state.projects[0]?.id ?? null;
          }
        });
      },

      renameProject: (id, name) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === id);
          if (project) {
            project.name = name;
            project.architecture.name = name;
            touchMetadata(project.architecture);
            project.updatedAt = project.architecture.metadata.updatedAt;
          }
        });
      },

      importProject: (architecture) => {
        const entry: ProjectEntry = {
          id: architecture.id,
          name: architecture.name,
          architecture,
          updatedAt: architecture.metadata.updatedAt,
        };
        set((state) => {
          const existing = state.projects.findIndex((p) => p.id === architecture.id);
          if (existing >= 0) {
            state.projects[existing] = entry;
          } else {
            state.projects.push(entry);
          }
          state.activeProjectId = entry.id;
          state.selectedLayerId = architecture.layers[0]?.id ?? null;
        });
      },

      updateArchitecture: (updater) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === state.activeProjectId);
          if (!project) return;
          updater(project.architecture);
          touchMetadata(project.architecture);
          project.updatedAt = project.architecture.metadata.updatedAt;
        });
      },

      addLayer: (type) => {
        get().updateArchitecture((arch) => {
          const x = arch.layers.length * 220 + 50;
          const layer = createLayer(type, { x, y: 150 });
          if (type === 'dense' || type === 'output') {
            layer.nodeCount = Number(layer.params.units ?? 64);
          }
          arch.layers.push(layer);

          const prev = arch.layers[arch.layers.length - 2];
          if (prev) {
            arch.edges.push({ from: prev.id, to: layer.id, weight: Math.random() * 2 - 1 });
          }
        });
      },

      removeLayer: (layerId) => {
        get().updateArchitecture((arch) => {
          arch.layers = arch.layers.filter((l) => l.id !== layerId);
          arch.edges = arch.edges.filter((e) => e.from !== layerId && e.to !== layerId);
        });
        if (get().selectedLayerId === layerId) {
          set({ selectedLayerId: null });
        }
      },

      updateLayer: (layerId, updates) => {
        get().updateArchitecture((arch) => {
          const layer = arch.layers.find((l) => l.id === layerId);
          if (layer) Object.assign(layer, updates);
        });
      },

      moveLayer: (layerId, position) => {
        get().updateArchitecture((arch) => {
          const layer = arch.layers.find((l) => l.id === layerId);
          if (layer) layer.position = position;
        });
      },

      addEdge: (from, to, weight) => {
        get().updateArchitecture((arch) => {
          const exists = arch.edges.some((e) => e.from === from && e.to === to);
          if (!exists) {
            arch.edges.push({ from, to, weight: weight ?? Math.random() * 2 - 1 });
          }
        });
      },

      removeEdge: (from, to) => {
        get().updateArchitecture((arch) => {
          arch.edges = arch.edges.filter((e) => !(e.from === from && e.to === to));
        });
      },

      fullyConnectLayers: () => {
        get().updateArchitecture((arch) => {
          for (let i = 0; i < arch.layers.length - 1; i++) {
            const from = arch.layers[i].id;
            const to = arch.layers[i + 1].id;
            const exists = arch.edges.some((e) => e.from === from && e.to === to);
            if (!exists) {
              arch.edges.push({ from, to, weight: Math.floor(Math.random() * 10) + 1 });
            }
          }
        });
      },

      autoLayout: () => {
        get().updateArchitecture((arch) => {
          arch.layers.forEach((layer, i) => {
            layer.position = { x: i * 220 + 50, y: 150 };
          });
        });
      },

      setInputShape: (shape) => {
        get().updateArchitecture((arch) => {
          arch.inputShape = shape;
        });
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      toggleShowParamMatrices: () =>
        set((state) => {
          state.showParamMatrices = !state.showParamMatrices;
        }),

      copySelectedLayer: () => {
        const { selectedLayerId, getActiveArchitecture } = get();
        const arch = getActiveArchitecture();
        if (!selectedLayerId || !arch) return;
        const layer = arch.layers.find((l) => l.id === selectedLayerId);
        if (layer) {
          set({ clipboardLayer: JSON.parse(JSON.stringify(layer)) as LayerConfig });
        }
      },

      pasteLayer: () => {
        const { clipboardLayer, selectedLayerId } = get();
        if (!clipboardLayer) return;

        get().updateArchitecture((arch) => {
          const source = clipboardLayer;
          const newLayer: LayerConfig = {
            ...JSON.parse(JSON.stringify(source)),
            id: generateId(),
            name: source.name ? `${source.name} (copy)` : undefined,
            position: {
              x: source.position.x + 40,
              y: source.position.y + 40,
            },
          };
          arch.layers.push(newLayer);

          if (selectedLayerId) {
            const exists = arch.edges.some((e) => e.from === selectedLayerId && e.to === newLayer.id);
            if (!exists) {
              arch.edges.push({ from: selectedLayerId, to: newLayer.id, weight: Math.random() * 2 - 1 });
            }
          }
        });

        const arch = get().getActiveArchitecture();
        const pasted = arch?.layers[arch.layers.length - 1];
        if (pasted) set({ selectedLayerId: pasted.id });
      },

      setSelectedLayerId: (id) => set({ selectedLayerId: id }),

      toggleConnectMode: () =>
        set((state) => {
          state.connectMode = !state.connectMode;
          state.connectFirstLayerId = null;
          state.fullyConnectedMode = false;
        }),

      handleConnectClick: (layerId) => {
        const { connectMode, connectFirstLayerId, addEdge } = get();
        if (!connectMode) return;

        if (!connectFirstLayerId) {
          set({ connectFirstLayerId: layerId });
          return;
        }

        if (connectFirstLayerId !== layerId) {
          const weightStr = prompt('Edge weight (optional):');
          const weight = weightStr ? parseFloat(weightStr) : undefined;
          addEdge(connectFirstLayerId, layerId, weight);
        }
        set({ connectFirstLayerId: null, connectMode: false });
      },

      toggleFullyConnectedMode: () =>
        set((state) => {
          state.fullyConnectedMode = !state.fullyConnectedMode;
          state.connectMode = false;
        }),
    })),
    {
      name: 'nn-visualizer-architectures',
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    },
  ),
);
