class GridSystem {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.floor(width / cellSize);
        this.rows = Math.floor(height / cellSize);
        
        // Grid to track tower placement
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        
        // Path cells that cannot have towers
        this.pathCells = new Set();
        
        // Define the enemy path
        this.enemyPath = this.generatePath();
        this.markPathCells();
    }
    
    generatePath() {
        // Create a path from left to right with some turns
        const path = [];
        
        // Start from left edge
        const startY = Math.floor(this.rows / 2) * this.cellSize + this.cellSize / 2;
        path.push({ x: 0, y: startY });
        
        // First segment - move right
        let currentX = this.cellSize * 3;
        path.push({ x: currentX, y: startY });
        
        // Turn down
        let currentY = startY + this.cellSize * 4;
        path.push({ x: currentX, y: currentY });
        
        // Turn right
        currentX = this.cellSize * 8;
        path.push({ x: currentX, y: currentY });
        
        // Turn up
        currentY = startY - this.cellSize * 3;
        path.push({ x: currentX, y: currentY });
        
        // Turn right
        currentX = this.cellSize * 12;
        path.push({ x: currentX, y: currentY });
        
        // Turn down and go to bottom
        currentY = startY + this.cellSize * 6;
        path.push({ x: currentX, y: currentY });
        
        // Final segment to right edge
        path.push({ x: this.width, y: currentY });
        
        return path;
    }
    
    markPathCells() {
        // Mark all cells that are part of the path as non-buildable
        for (let i = 0; i < this.enemyPath.length - 1; i++) {
            const start = this.enemyPath[i];
            const end = this.enemyPath[i + 1];
            
            this.markLineAsBusy(start.x, start.y, end.x, end.y);
        }
    }
    
    markLineAsBusy(x1, y1, x2, y2) {
        // Use Bresenham's line algorithm to mark all cells along the path
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            // Mark current cell and surrounding cells as busy
            this.markCellAsBusy(x, y);
            this.markCellAsBusy(x - this.cellSize, y);
            this.markCellAsBusy(x + this.cellSize, y);
            this.markCellAsBusy(x, y - this.cellSize);
            this.markCellAsBusy(x, y + this.cellSize);
            
            if (x === x2 && y === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx * this.cellSize;
            }
            if (e2 < dx) {
                err += dx;
                y += sy * this.cellSize;
            }
        }
    }
    
    markCellAsBusy(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            this.grid[row][col] = true;
            this.pathCells.add(`${col},${row}`);
        }
    }
    
    // Check if a position is valid for tower placement
    canPlaceTower(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // Check bounds
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return false;
        }
        
        // Check if cell is already occupied
        return !this.grid[row][col];
    }
    
    // Place a tower and mark the cell as occupied
    placeTower(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (this.canPlaceTower(x, y)) {
            this.grid[row][col] = true;
            return true;
        }
        return false;
    }
    
    // Remove a tower and mark the cell as free
    removeTower(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            // Don't allow removing path cells
            if (!this.pathCells.has(`${col},${row}`)) {
                this.grid[row][col] = false;
                return true;
            }
        }
        return false;
    }
    
    // Snap coordinates to grid
    snapToGrid(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        return {
            x: col * this.cellSize + this.cellSize / 2,
            y: row * this.cellSize + this.cellSize / 2,
            col: col,
            row: row
        };
    }
    
    // Get the center coordinates of a grid cell
    getCellCenter(col, row) {
        return {
            x: col * this.cellSize + this.cellSize / 2,
            y: row * this.cellSize + this.cellSize / 2
        };
    }
    
    // Render the grid
    render(ctx, showGrid = false) {
        ctx.save();
        
        // Draw the enemy path
        this.renderPath(ctx);
        
        // Draw grid lines if requested
        if (showGrid) {
            this.renderGridLines(ctx);
        }
        
        // Draw placement indicators
        this.renderPlacementIndicators(ctx);
        
        ctx.restore();
    }
    
    renderPath(ctx) {
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw path background
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(this.enemyPath[0].x, this.enemyPath[0].y);
        for (let i = 1; i < this.enemyPath.length; i++) {
            ctx.lineTo(this.enemyPath[i].x, this.enemyPath[i].y);
        }
        ctx.stroke();
        
        // Draw path border
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#74b9ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.globalAlpha = 1;
        
        // Draw start and end markers
        this.renderPathMarkers(ctx);
    }
    
    renderPathMarkers(ctx) {
        const start = this.enemyPath[0];
        const end = this.enemyPath[this.enemyPath.length - 1];
        
        // Start marker (spawn point)
        ctx.fillStyle = '#00b894';
        ctx.beginPath();
        ctx.arc(start.x, start.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('S', start.x, start.y + 4);
        
        // End marker (base)
        ctx.fillStyle = '#e17055';
        ctx.beginPath();
        ctx.arc(end.x - 20, end.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('B', end.x - 20, end.y + 4);
    }
    
    renderGridLines(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= this.cols; i++) {
            const x = i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= this.rows; i++) {
            const y = i * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }
    
    renderPlacementIndicators(ctx) {
        if (!window.game || !window.game.placingTower) return;
        
        const mousePos = window.game.mousePos;
        if (!mousePos) return;
        
        const snapped = this.snapToGrid(mousePos.x, mousePos.y);
        const canPlace = this.canPlaceTower(mousePos.x, mousePos.y);
        
        // Draw placement indicator
        ctx.fillStyle = canPlace ? 'rgba(0, 184, 148, 0.3)' : 'rgba(225, 112, 85, 0.3)';
        ctx.strokeStyle = canPlace ? '#00b894' : '#e17055';
        ctx.lineWidth = 2;
        
        const cellX = snapped.col * this.cellSize;
        const cellY = snapped.row * this.cellSize;
        
        ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
        ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
        
        // Draw range preview if placing tower
        if (canPlace && window.game.selectedTowerType) {
            const towerInfo = TowerFactory.getTowerInfo(window.game.selectedTowerType);
            ctx.strokeStyle = 'rgba(74, 158, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(snapped.x, snapped.y, towerInfo.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    // Get all valid placement positions
    getValidPlacements() {
        const positions = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.grid[row][col]) {
                    const center = this.getCellCenter(col, row);
                    positions.push({ x: center.x, y: center.y, col, row });
                }
            }
        }
        return positions;
    }
    
    // Get enemy spawn point
    getSpawnPoint() {
        return { ...this.enemyPath[0] };
    }
    
    // Get enemy path
    getEnemyPath() {
        return [...this.enemyPath];
    }
}