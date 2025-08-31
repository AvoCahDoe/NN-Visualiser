# NeuralNetwork-visualizer

An Angular application for designing, describing, and visualizing neural network architectures.  
Displays each layer with its type, dimensions, parameters, and connections using interactive diagrams powered by D3.js. Supports JSON model import, layer details on click, and dynamic updates.

---

## Features

- Define neural network architecture via JSON or form input
- Interactive visualization of layers with input/output dimensions
- Displays layer parameters and activation functions
- Dynamic updates reflect changes in architecture instantly
- Calculates output shapes for common layer types (Conv2D, Pooling, Dense, etc.)

---

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- Angular CLI

### Installation

```bash
git clone https://github.com/AvoCahDoe/NN-Visualiser.git
cd nn-visualize
 npm install
 ng serve
```

> Open your browser at http://localhost:4200

### Usage

- Use the Architecture Input panel to define your neural network architecture.

- Visualize the architecture dynamically in the diagram.

- Click any layer to see detailed information like parameters and output shape.

- Load example architectures from the mock data folder.


### Technologies Used

- Angular 15+

- TypeScript

- D3.js for visualization

- SCSS for styling
