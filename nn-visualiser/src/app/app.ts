import { Component } from '@angular/core';
import {  CanvasNodesComponent } from './components/canvas/canvas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CanvasNodesComponent],
  templateUrl:"./app.html"
})
export class App {
  title = 'paper-shape-editor';
}
