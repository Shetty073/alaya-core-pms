import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrapper">
      <!-- Top header / legend -->
      <div class="chart-header" *ngIf="showLegend">
        <div class="legend-list">
          <div class="legend-item" *ngFor="let item of data">
            <span class="legend-dot" [style.background-color]="item.color || defaultColor"></span>
            <span class="legend-text">{{ item.label }}: {{ formatValue(item.value) }}</span>
          </div>
        </div>
      </div>

      <!-- Render Bar Chart -->
      <div *ngIf="type === 'bar'" class="bar-chart-container">
        <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="bar-chart-svg">
          <!-- Grid lines -->
          <g class="grid-lines">
            <line *ngFor="let y of gridYValues()" 
              [attr.x1]="paddingLeft" 
              [attr.y1]="y" 
              [attr.x2]="width - paddingRight" 
              [attr.y2]="y" 
              stroke="var(--border-muted)" 
              stroke-width="1" />
          </g>

          <!-- Bars -->
          <g *ngFor="let item of data; let i = index">
            <!-- Rect -->
            <rect 
              [attr.x]="barX(i)" 
              [attr.y]="barY(item.value)" 
              [attr.width]="barWidth()" 
              [attr.height]="barHeight(item.value)" 
              [attr.fill]="item.color || defaultColor" 
              rx="3"
              class="chart-rect" />
              
            <!-- Value Label on Hover/Always -->
            <text 
              [attr.x]="barX(i) + barWidth() / 2" 
              [attr.y]="barY(item.value) - 6" 
              text-anchor="middle" 
              class="bar-value-text"
              fill="var(--fg-secondary)">
              {{ formatValue(item.value) }}
            </text>

            <!-- Bottom X label -->
            <text 
              [attr.x]="barX(i) + barWidth() / 2" 
              [attr.y]="height - 8" 
              text-anchor="middle" 
              class="bar-label-text"
              fill="var(--fg-muted)">
              {{ item.label }}
            </text>
          </g>

          <!-- Axes -->
          <line [attr.x1]="paddingLeft" [attr.y1]="height - paddingBottom" [attr.x2]="width - paddingRight" [attr.y2]="height - paddingBottom" stroke="var(--border-color)" stroke-width="1.5" />
          <line [attr.x1]="paddingLeft" [attr.y1]="paddingTop" [attr.x2]="paddingLeft" [attr.y2]="height - paddingBottom" stroke="var(--border-color)" stroke-width="1.5" />
        </svg>
      </div>

      <!-- Render Horizontal Progress Bars (Good for mini break downs) -->
      <div *ngIf="type === 'progress'" class="progress-chart-container">
        <div class="progress-item" *ngFor="let item of data">
          <div class="progress-label-row">
            <span class="progress-label">{{ item.label }}</span>
            <span class="progress-val">{{ formatValue(item.value) }} ({{ getPercentage(item.value) | number:'1.0-0' }}%)</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar" [style.width.%]="getPercentage(item.value)" [style.background-color]="item.color || defaultColor"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      width: 100%;
    }
    
    .chart-header {
      margin-bottom: 12px;
    }
    
    .legend-list {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .legend-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .legend-text {
      color: var(--fg-secondary);
    }
    
    .bar-chart-container {
      width: 100%;
      height: 100%;
    }
    
    .bar-chart-svg {
      width: 100%;
      height: auto;
      overflow: visible;
    }
    
    .chart-rect {
      transition: height 0.3s ease, y 0.3s ease;
      cursor: pointer;
    }
    
    .chart-rect:hover {
      opacity: 0.85;
    }
    
    .bar-value-text {
      font-size: 10px;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    
    .bar-chart-svg g:hover .bar-value-text {
      opacity: 1;
    }
    
    .bar-label-text {
      font-size: 10px;
    }
    
    /* Progress bars styling */
    .progress-chart-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .progress-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .progress-label-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 500;
    }
    
    .progress-label {
      color: var(--fg-primary);
    }
    
    .progress-val {
      color: var(--fg-secondary);
    }
    
    .progress-track {
      height: 8px;
      background-color: var(--bg-tertiary);
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid var(--border-muted);
    }
    
    .progress-bar {
      height: 100%;
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 4px;
    }
  `]
})
export class ChartComponent {
  @Input() data: ChartDataPoint[] = [];
  @Input() type: 'bar' | 'progress' = 'bar';
  @Input() showLegend: boolean = true;
  @Input() defaultColor: string = 'var(--primary-color)';
  @Input() valuePrefix: string = '';
  @Input() valueSuffix: string = '';

  // Width & height dimensions of SVG viewport
  width = 600;
  height = 240;

  // Viewport padding coordinates
  paddingLeft = 40;
  paddingRight = 20;
  paddingTop = 20;
  paddingBottom = 30;

  // Calculations for graph scales
  maxValue = computed(() => {
    if (this.data.length === 0) return 100;
    const values = this.data.map(d => d.value);
    const max = Math.max(...values);
    return max > 0 ? max * 1.15 : 100; // Provide buffer at top
  });

  totalValue = computed(() => {
    return this.data.reduce((sum, d) => sum + d.value, 0);
  });

  // Calculate coordinates for bar elements
  barWidth(): number {
    if (this.data.length === 0) return 0;
    const availWidth = this.width - this.paddingLeft - this.paddingRight;
    const spacing = 16;
    return (availWidth - (spacing * (this.data.length - 1))) / this.data.length;
  }

  barX(index: number): number {
    const spacing = 16;
    return this.paddingLeft + index * (this.barWidth() + spacing);
  }

  barY(val: number): number {
    const availHeight = this.height - this.paddingTop - this.paddingBottom;
    const scale = availHeight / this.maxValue();
    return this.height - this.paddingBottom - (val * scale);
  }

  barHeight(val: number): number {
    const availHeight = this.height - this.paddingTop - this.paddingBottom;
    const scale = availHeight / this.maxValue();
    return Math.max(0, val * scale);
  }

  gridYValues(): number[] {
    const lines = 4;
    const list: number[] = [];
    const availHeight = this.height - this.paddingTop - this.paddingBottom;
    const interval = availHeight / lines;
    for (let i = 0; i <= lines; i++) {
      list.push(this.paddingTop + i * interval);
    }
    return list;
  }

  getPercentage(val: number): number {
    const total = this.totalValue();
    if (total === 0) return 0;
    return (val / total) * 100;
  }

  formatValue(val: number): string {
    return `${this.valuePrefix}${val.toLocaleString()}${this.valueSuffix}`;
  }
}
