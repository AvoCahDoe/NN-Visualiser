import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Node {
  id: string;
  layerId: string;
  x: number;
  y: number;
  radius: number;
  selected?: boolean;
}

interface Edge {
  from: Node;
  to: Node;
  weight: number;
  selected?: boolean;
}

@Component({
  selector: 'app-canvas-nodes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './canvas.html',
  styleUrls: ['./canvas.scss'],
})
export class CanvasNodesComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  nodes: Node[] = [];
  edges: Edge[] = [];
  layers: Node[][] = []; // Store layers for fully connected functionality

  private draggingNodeIndex: number | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  private isGroupDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  private isSelecting = false;
  private selectionStartX = 0;
  private selectionStartY = 0;
  private selectionCurrentX = 0;
  private selectionCurrentY = 0;

  private decalage: number = 0;

  // Connect mode state
  connectMode = false;
  private connectFirstNode: Node | null = null;

  // Edge selection tolerance (pixels)
  private edgeSelectTolerance = 6;

  // Modal states
  showLayerModal = false;
  showNodeModal = false;
  showFullyConnectedModal = false;

  layerParams = {
    count: 5,
    spacing: 50,
    startX: 50,
    startY: 50
  };

  nodeParams = {
    id: '',
    layerId: '',
    x: 50,
    y: 50
  };

  // Fully connected mode
  fullyConnectedMode = false;
  private selectedLayers: Node[][] = [];

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    this.draw();
  }

  openNodeModal() {
    // Set default position
    this.nodeParams.id = '';
    this.nodeParams.layerId = '';
    this.nodeParams.x = 50;
    this.nodeParams.y = 50 + this.decalage;
    this.showNodeModal = true;
  }

  closeNodeModal() {
    this.showNodeModal = false;
  }

  addNode() {
    const { id, layerId, x, y } = this.nodeParams;

    if (!id || !layerId) {
      alert('Please enter both ID and Layer ID');
      return;
    }

    // Check if ID already exists
    if (this.nodes.some(node => node.id === id)) {
      alert('Node ID already exists');
      return;
    }

    const radius = 20;
    const newNode: Node = { id, layerId, x, y, radius, selected: false };
    this.nodes.push(newNode);

    // Add to layers array if layer exists, otherwise create new layer
    let layer = this.layers.find(l => l[0]?.layerId === layerId);
    if (layer) {
      layer.push(newNode);
    } else {
      this.layers.push([newNode]);
    }

    this.decalage += 50;
    this.closeNodeModal();
    this.draw();
  }

  openLayerModal() {
    // Set default startX based on current decalage
    this.layerParams.startX = 50 + this.decalage;
    this.layerParams.startY = 50;
    this.layerParams.count = 5;
    this.layerParams.spacing = 50;
    this.showLayerModal = true;
  }

  closeLayerModal() {
    this.showLayerModal = false;
  }

  addLayer() {
    const { count, spacing, startX, startY } = this.layerParams;

    if (count <= 0) {
      alert('Please enter a valid number of nodes (> 0)');
      return;
    }

    const radius = 20;
    const layerId = `layer_${this.layers.length + 1}`;
    const newLayer: Node[] = [];

    for (let i = 0; i < count; i++) {
      const nodeId = `${layerId}_node_${i + 1}`;
      const newNode: Node = {
        id: nodeId,
        layerId,
        x: startX,
        y: startY + i * spacing,
        radius,
        selected: false
      };
      this.nodes.push(newNode);
      newLayer.push(newNode);
    }

    // Store layer reference
    this.layers.push(newLayer);

    // Update decalage for next group
    this.decalage += 100;

    this.closeLayerModal();
    this.draw();
  }

  toggleFullyConnectedMode() {
    this.fullyConnectedMode = !this.fullyConnectedMode;
    if (this.fullyConnectedMode) {
      this.clearSelection();
      this.clearEdgeSelection();
      this.selectedLayers = [];
    }
    this.draw();
  }

  createFullyConnected() {
    // Get selected nodes
    const selectedNodes = this.nodes.filter(node => node.selected);

    if (selectedNodes.length === 0) {
      alert('Please select nodes first');
      return;
    }

    // Identify which layers have selected nodes
    const layersWithSelection: Node[][] = [];

    this.layers.forEach(layer => {
      const selectedInLayer = layer.filter(node => node.selected);
      if (selectedInLayer.length > 0) {
        layersWithSelection.push(selectedInLayer);
      }
    });

    if (layersWithSelection.length < 2) {
      alert('Please select nodes from at least 2 layers');
      return;
    }

    // Create fully connected network between consecutive layer pairs
    for (let i = 0; i < layersWithSelection.length - 1; i++) {
      const layer1 = layersWithSelection[i];
      const layer2 = layersWithSelection[i + 1];

      layer1.forEach(node1 => {
        layer2.forEach(node2 => {
          // Check if edge already exists
          const edgeExists = this.edges.some(edge =>
            (edge.from === node1 && edge.to === node2) ||
            (edge.from === node2 && edge.to === node1)
          );

          if (!edgeExists) {
            const weight = Math.floor(Math.random() * 10) + 1; // Random weight 1-10
            this.edges.push({ from: node1, to: node2, weight, selected: false });
          }
        });
      });
    }

    this.fullyConnectedMode = false;
    this.draw();
  }

  toggleConnectMode() {
    this.connectMode = !this.connectMode;
    this.connectFirstNode = null;
    if (this.connectMode) {
      this.clearSelection();
      this.clearEdgeSelection();
    }
    this.draw();
  }

  deleteSelectedNodes() {
    // Remove edges connected to selected nodes
    this.edges = this.edges.filter(
      (edge) => !edge.from.selected && !edge.to.selected
    );

    // Remove selected nodes
    this.nodes = this.nodes.filter((node) => !node.selected);

    // Update layers array
    this.layers = this.layers.map(layer =>
      layer.filter(node => !node.selected)
    ).filter(layer => layer.length > 0);

    this.draw();
  }

  deleteSelectedEdges() {
    this.edges = this.edges.filter((edge) => !edge.selected);
    this.draw();
  }

  private onMouseDown(event: MouseEvent) {
    const { mouseX, mouseY } = this.getMousePos(event);

    if (this.connectMode) {
      for (let i = this.nodes.length - 1; i >= 0; i--) {
        const node = this.nodes[i];
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        if (dx * dx + dy * dy <= node.radius * node.radius) {
          this.handleConnectNodeClick(node);
          return;
        }
      }
      return;
    }

    if (this.fullyConnectedMode) {
      // Check if clicked on node
      for (let i = this.nodes.length - 1; i >= 0; i--) {
        const node = this.nodes[i];
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        if (dx * dx + dy * dy <= node.radius * node.radius) {
          // Toggle node selection
          node.selected = !node.selected;
          this.draw();
          return;
        }
      }
      return;
    }

    // Check if clicked on node
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      if (dx * dx + dy * dy <= node.radius * node.radius) {
        if (node.selected) {
          this.isGroupDragging = true;
          this.lastMouseX = mouseX;
          this.lastMouseY = mouseY;
        } else {
          this.clearSelection();
          this.clearEdgeSelection();
          node.selected = true;
          this.isGroupDragging = true;
          this.lastMouseX = mouseX;
          this.lastMouseY = mouseY;
        }
        this.draggingNodeIndex = i;
        this.draw();
        return;
      }
    }

    // Check if clicked on edge (for selection)
    const clickedEdge = this.findEdgeNear(mouseX, mouseY);
    if (clickedEdge) {
      // Toggle edge selection
      clickedEdge.selected = !clickedEdge.selected;
      // Clear node selection when selecting edges
      if (clickedEdge.selected) {
        this.clearSelection();
      }
      this.draw();
      return;
    }

    // Empty space: start selection rect
    this.isSelecting = true;
    this.selectionStartX = mouseX;
    this.selectionStartY = mouseY;
    this.selectionCurrentX = mouseX;
    this.selectionCurrentY = mouseY;

    this.clearSelection();
    this.clearEdgeSelection();
    this.draw();
  }

  private onMouseMove(event: MouseEvent) {
    const { mouseX, mouseY } = this.getMousePos(event);

    if (this.isGroupDragging && this.draggingNodeIndex !== null) {
      const dx = mouseX - this.lastMouseX;
      const dy = mouseY - this.lastMouseY;

      this.nodes.forEach((node) => {
        if (node.selected) {
          node.x += dx;
          node.y += dy;
        }
      });

      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
      this.draw();
      return;
    }

    if (this.isSelecting) {
      this.selectionCurrentX = mouseX;
      this.selectionCurrentY = mouseY;

      this.updateSelectionRect();
      this.draw();
      this.drawSelectionRect();
      return;
    }
  }

  private onMouseUp() {
    if (this.isSelecting) {
      this.isSelecting = false;
      this.selectionCurrentX = 0;
      this.selectionCurrentY = 0;
      this.draw();
    }
    this.isGroupDragging = false;
    this.draggingNodeIndex = null;
  }

  private getMousePos(event: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      mouseX: event.clientX - rect.left,
      mouseY: event.clientY - rect.top,
    };
  }

  private clearSelection() {
    this.nodes.forEach((node) => (node.selected = false));
  }

  private clearEdgeSelection() {
    this.edges.forEach((edge) => (edge.selected = false));
  }

  private updateSelectionRect() {
    const x1 = Math.min(this.selectionStartX, this.selectionCurrentX);
    const y1 = Math.min(this.selectionStartY, this.selectionCurrentY);
    const x2 = Math.max(this.selectionStartX, this.selectionCurrentX);
    const y2 = Math.max(this.selectionStartY, this.selectionCurrentY);

    this.nodes.forEach((node) => {
      if (node.x >= x1 && node.x <= x2 && node.y >= y1 && node.y <= y2) {
        node.selected = true;
      } else {
        node.selected = false;
      }
    });
  }

  private findEdgeNear(x: number, y: number): Edge | null {
    // Return the first edge where point (x,y) is near the line from from->to within tolerance
    for (const edge of this.edges) {
      if (this.isPointNearLine(x, y, edge.from.x, edge.from.y, edge.to.x, edge.to.y, this.edgeSelectTolerance)) {
        return edge;
      }
    }
    return null;
  }

  private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, tolerance: number): boolean {
    // Calculate distance from point to line segment
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return dx * dx + dy * dy <= tolerance * tolerance;
  }

  private handleConnectNodeClick(node: Node) {
    if (!this.connectFirstNode) {
      this.connectFirstNode = node;
      this.draw();
      return;
    }

    if (node === this.connectFirstNode) {
      this.connectFirstNode = null;
      this.draw();
      return;
    }

    const weightStr = prompt('Enter weight for this connection:', '1');
    if (weightStr === null) {
      this.connectFirstNode = null;
      this.draw();
      return;
    }

    const weight = parseInt(weightStr);
    if (isNaN(weight)) {
      alert('Invalid weight. Connection cancelled.');
      this.connectFirstNode = null;
      this.draw();
      return;
    }

    this.edges.push({ from: this.connectFirstNode, to: node, weight, selected: false });
    this.connectFirstNode = null;
    this.draw();
  }

  private formatWeightLabel(weight: number): string {
    // convert weight number to uppercase hex string or letters w12, wAB etc.
    // If weight < 10, pad with 0, else hex uppercase
    if (weight < 10) {
      return 'w0' + weight.toString();
    } else {
      return 'w' + weight.toString(16).toUpperCase();
    }
  }

  private drawSelectionRect() {
    const x = Math.min(this.selectionStartX, this.selectionCurrentX);
    const y = Math.min(this.selectionStartY, this.selectionCurrentY);
    const width = Math.abs(this.selectionCurrentX - this.selectionStartX);
    const height = Math.abs(this.selectionCurrentY - this.selectionStartY);

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
    this.ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([6]);
    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.restore();
  }

  private drawEdge(edge: Edge) {
    const { from, to, weight, selected } = edge;

    this.ctx.save();

    this.ctx.strokeStyle = selected ? '#f57c00' : '#555';
    this.ctx.lineWidth = selected ? 4 : 2;
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    this.ctx.fillStyle = selected ? '#f57c00' : 'black';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.formatWeightLabel(weight), midX, midY - 10);

    this.ctx.restore();
  }

  draw() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges first
    this.edges.forEach((edge) => {
      this.drawEdge(edge);
    });

    // Draw nodes
    this.nodes.forEach((node) => {
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

      this.ctx.fillStyle = node.selected ? '#1e88e5' : '#3f51b5';
      this.ctx.fill();

      this.ctx.strokeStyle = '#283593';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      this.ctx.fillStyle = 'white';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Display ID and Layer ID
      const displayText = `${node.id}`;
      this.ctx.fillText(displayText, node.x, node.y);
    });

    // Highlight first node in connect mode (optional)
    if (this.connectMode && this.connectFirstNode) {
      this.ctx.save();
      this.ctx.strokeStyle = 'orange';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(this.connectFirstNode.x, this.connectFirstNode.y, this.connectFirstNode.radius + 5, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Highlight fully connected mode
    if (this.fullyConnectedMode) {
      this.ctx.save();
      this.ctx.font = '16px Arial';
      this.ctx.fillStyle = '#f57c00';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('Fully Connected Mode: Select nodes from 2+ layers', 10, 30);
      this.ctx.restore();
    }
  }
}
