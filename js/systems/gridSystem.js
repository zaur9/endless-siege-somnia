/**
 * Grid System - Manages the game grid for tower placement and pathfinding
 */
class GridSystem {
    constructor(canvasWidth, canvasHeight, cellSize = 40) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.cellSize = cellSize;
        this.cols = Math.floor(canvasWidth / cellSize);
        this.rows = Math.floor(canvasHeight / cellSize);
        
        // Initialize grid - 0: empty, 1: path, 2: tower, 3: blocked
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = 0;
            }
        }
        
        // Define the enemy path
        this.enemyPath = [];
        this.createPath();
        
        // Track tower positions
        this.towers = new Map(); // key: "row,col", value: tower reference
    }
    
    createPath() {
        // Create a winding path from left to right
        const pathPoints = [
            { row: Math.floor(this.rows * 0.7), col: 0 }, // Start at left edge
            { row: Math.floor(this.rows * 0.7), col: Math.floor(this.cols * 0.25) },
            { row: Math.floor(this.rows * 0.3), col: Math.floor(this.cols * 0.25) },
            { row: Math.floor(this.rows * 0.3), col: Math.floor(this.cols * 0.6) },
            { row: Math.floor(this.rows * 0.8), col: Math.floor(this.cols * 0.6) },
            { row: Math.floor(this.rows * 0.8), col: Math.floor(this.cols * 0.85) },
            { row: Math.floor(this.rows * 0.4), col: Math.floor(this.cols * 0.85) },
            { row: Math.floor(this.rows * 0.4), col: this.cols - 1 } // End at right edge
        ];
        
        // Convert path points to world coordinates and mark grid cells
        this.enemyPath = [];
        for (let i = 0; i < pathPoints.length; i++) {
            const point = pathPoints[i];
            const worldX = point.col * this.cellSize + this.cellSize / 2;
            const worldY = point.row * this.cellSize + this.cellSize / 2;
            
            this.enemyPath.push({ x: worldX, y: worldY });
            
            // Mark path cells in grid
            if (i < pathPoints.length - 1) {
                this.markPathBetweenPoints(point, pathPoints[i + 1]);
            }
        }
    }
    
    markPathBetweenPoints(start, end) {
        const startRow = Math.min(start.row, end.row);
        const endRow = Math.max(start.row, end.row);
        const startCol = Math.min(start.col, end.col);
        const endCol = Math.max(start.col, end.col);
        
        // Mark all cells between start and end as path
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (this.isValidGridPosition(row, col)) {
                    this.grid[row][col] = 1; // Path
                }
            }
        }
    }
    
    getSpawnPoint() {
        return { x: this.enemyPath[0].x, y: this.enemyPath[0].y };
    }
    
    getEndPoint() {
        return this.enemyPath[this.enemyPath.length - 1];
    }
    
    getEnemyPath() {
        return [...this.enemyPath]; // Return copy to prevent modification
    }
    
    canPlaceTower(worldX, worldY) {
        const gridPos = this.worldToGrid(worldX, worldY);
        if (!gridPos) return false;
        
        const { row, col } = gridPos;
        
        // Check if position is valid and empty
        return this.isValidGridPosition(row, col) && 
               this.grid[row][col] === 0 && 
               !this.towers.has(`${row},${col}`);
    }
    
    placeTower(worldX, worldY, tower) {
        const gridPos = this.worldToGrid(worldX, worldY);
        if (!gridPos || !this.canPlaceTower(worldX, worldY)) {
            return false;
        }
        
        const { row, col } = gridPos;
        const key = `${row},${col}`;
        
        // Snap tower to grid center
        const centerX = col * this.cellSize + this.cellSize / 2;
        const centerY = row * this.cellSize + this.cellSize / 2;
        tower.x = centerX;
        tower.y = centerY;
        
        // Mark grid cell as occupied
        this.grid[row][col] = 2; // Tower
        this.towers.set(key, tower);
        
        return true;
    }
    
    removeTower(worldX, worldY) {
        const gridPos = this.worldToGrid(worldX, worldY);
        if (!gridPos) return null;
        
        const { row, col } = gridPos;
        const key = `${row},${col}`;
        
        if (this.towers.has(key)) {
            const tower = this.towers.get(key);
            this.towers.delete(key);
            this.grid[row][col] = 0; // Empty
            return tower;
        }
        
        return null;
    }
    
    getTowerAt(worldX, worldY) {
        const gridPos = this.worldToGrid(worldX, worldY);
        if (!gridPos) return null;
        
        const { row, col } = gridPos;
        const key = `${row},${col}`;
        
        return this.towers.get(key) || null;
    }
    
    worldToGrid(worldX, worldY) {
        const col = Math.floor(worldX / this.cellSize);
        const row = Math.floor(worldY / this.cellSize);
        
        if (this.isValidGridPosition(row, col)) {
            return { row, col };
        }
        
        return null;
    }
    
    gridToWorld(row, col) {
        if (!this.isValidGridPosition(row, col)) return null;
        
        return {
            x: col * this.cellSize + this.cellSize / 2,
            y: row * this.cellSize + this.cellSize / 2
        };
    }
    
    isValidGridPosition(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    getGridCellType(row, col) {
        if (!this.isValidGridPosition(row, col)) return -1;
        return this.grid[row][col];
    }
    
    snapToGrid(worldX, worldY) {
        const gridPos = this.worldToGrid(worldX, worldY);
        if (!gridPos) return { x: worldX, y: worldY };
        
        const worldPos = this.gridToWorld(gridPos.row, gridPos.col);
        return worldPos || { x: worldX, y: worldY };
    }
    
    render(ctx, showGrid = false) {
        if (!showGrid) return;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let col = 0; col <= this.cols; col++) {
            const x = col * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvasHeight);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let row = 0; row <= this.rows; row++) {
            const y = row * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvasWidth, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    renderPath(ctx) {
        if (this.enemyPath.length < 2) return;
        
        ctx.save();
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw path background
        ctx.beginPath();
        ctx.moveTo(this.enemyPath[0].x, this.enemyPath[0].y);
        for (let i = 1; i < this.enemyPath.length; i++) {
            ctx.lineTo(this.enemyPath[i].x, this.enemyPath[i].y);
        }
        ctx.stroke();
        
        // Draw path border
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 24;
        ctx.globalCompositeOperation = 'destination-over';
        ctx.beginPath();
        ctx.moveTo(this.enemyPath[0].x, this.enemyPath[0].y);
        for (let i = 1; i < this.enemyPath.length; i++) {
            ctx.lineTo(this.enemyPath[i].x, this.enemyPath[i].y);
        }
        ctx.stroke();
        
        ctx.globalCompositeOperation = 'source-over';
        
        // Draw spawn point
        ctx.fillStyle = '#00FF00';
        ctx.strokeStyle = '#006600';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.enemyPath[0].x, this.enemyPath[0].y, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Draw end point
        ctx.fillStyle = '#FF0000';
        ctx.strokeStyle = '#660000';
        ctx.lineWidth = 3;
        const endPoint = this.enemyPath[this.enemyPath.length - 1];
        ctx.beginPath();
        ctx.arc(endPoint.x, endPoint.y, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    getAllTowers() {
        return Array.from(this.towers.values());
    }
    
    getPathLength() {
        return this.enemyPath.length;
    }
    
    // Get path progress percentage for an enemy
    getPathProgress(enemy) {
        if (!enemy || enemy.pathIndex >= this.enemyPath.length) return 1;
        return enemy.pathIndex / (this.enemyPath.length - 1);
    }
}

// Grid cell type constants
const GridCellTypes = {
    EMPTY: 0,
    PATH: 1,
    TOWER: 2,
    BLOCKED: 3
};