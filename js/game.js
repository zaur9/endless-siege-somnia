/**
 * Main Game Engine - Endless Siege Tower Defense
 */
class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        
        // Game systems
        this.gridSystem = new GridSystem(this.canvas.width, this.canvas.height);
        this.waveManager = new WaveManager(this.gridSystem);
        this.resourceManager = new ResourceManager();
        this.ui = new GameUI(this);
        
        // Game entities
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        
        // Performance tracking
        this.lastFpsUpdate = 0;
        this.frameTimeHistory = [];
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Set up resource manager callbacks
        this.resourceManager.setResourceChangeCallback(() => {
            this.ui.updateUI();
        });
        
        this.resourceManager.setGameOverCallback((stats) => {
            this.handleGameOver(stats);
        });
        
        // Start game loop
        this.isRunning = true;
        this.gameLoop();
        
        console.log('Endless Siege initialized successfully!');
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Update FPS counter
        this.updateFPS(currentTime, deltaTime);
        
        // Only update game logic if not paused
        if (!this.isPaused && !this.gameOver) {
            this.update(currentTime, deltaTime);
        }
        
        // Always render
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(currentTime, deltaTime) {
        // Spawn new enemies from wave manager
        const newEnemies = this.waveManager.update(currentTime, this.enemies);
        this.enemies.push(...newEnemies);
        
        // Update enemies
        this.updateEnemies();
        
        // Update towers
        this.updateTowers(currentTime);
        
        // Update projectiles
        this.updateProjectiles();
        
        // Check for wave completion
        if (this.waveManager.isWaveJustCompleted()) {
            const bonus = this.waveManager.getWaveBonus();
            this.resourceManager.recordWaveCompletion(this.waveManager.getCurrentWave(), bonus);
        }
        
        // Clean up dead entities
        this.cleanupEntities();
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (enemy.alive && !enemy.reachedEnd) {
                enemy.update();
                
                // Check if enemy reached the end
                if (enemy.reachedEnd) {
                    this.resourceManager.loseLife(1);
                    this.enemies.splice(i, 1);
                }
            } else if (!enemy.alive) {
                // Enemy was killed
                this.resourceManager.recordEnemyKill(enemy);
                this.enemies.splice(i, 1);
            }
        }
    }
    
    updateTowers(currentTime) {
        for (let tower of this.towers) {
            tower.update(this.enemies, currentTime, this.projectiles);
        }
    }
    
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (projectile.alive) {
                projectile.update();
                
                // Check collisions with enemies
                const hitEnemies = projectile.checkCollision(this.enemies);
                
                if (hitEnemies.length > 0) {
                    // Apply damage and effects
                    for (let enemy of hitEnemies) {
                        const killed = projectile.applyEffects(enemy);
                        this.resourceManager.recordDamage(projectile.damage);
                        this.resourceManager.recordShot(true);
                    }
                } else if (projectile.hasHit || !projectile.alive) {
                    this.resourceManager.recordShot(false);
                }
                
                // Remove projectile if it's no longer alive or off-screen
                if (!projectile.alive || projectile.isOffScreen(this.canvas.width, this.canvas.height)) {
                    this.projectiles.splice(i, 1);
                }
            } else {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    cleanupEntities() {
        // Remove dead enemies
        this.enemies = this.enemies.filter(enemy => enemy.alive || enemy.reachedEnd);
        
        // Remove dead projectiles
        this.projectiles = this.projectiles.filter(projectile => projectile.alive);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render background
        this.renderBackground();
        
        // Render path
        this.gridSystem.renderPath(this.ctx);
        
        // Render UI elements (grid, ranges)
        this.ui.renderUI(this.ctx);
        
        // Render entities
        this.renderEnemies();
        this.renderTowers();
        this.renderProjectiles();
        
        // Render game info
        this.renderGameInfo();
        
        // Render debug info if needed
        if (this.showDebugInfo) {
            this.renderDebugInfo();
        }
    }
    
    renderBackground() {
        // Grass background
        this.ctx.fillStyle = '#2d5016';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add subtle texture
        this.ctx.fillStyle = 'rgba(45, 80, 22, 0.3)';
        for (let x = 0; x < this.canvas.width; x += 40) {
            for (let y = 0; y < this.canvas.height; y += 40) {
                if ((x + y) % 80 === 0) {
                    this.ctx.fillRect(x, y, 40, 40);
                }
            }
        }
    }
    
    renderEnemies() {
        for (let enemy of this.enemies) {
            if (enemy.alive) {
                enemy.render(this.ctx);
            }
        }
    }
    
    renderTowers() {
        for (let tower of this.towers) {
            const showRange = tower === this.ui.getSelectedTower() || tower === this.ui.hoveredTower;
            tower.render(this.ctx, showRange);
        }
    }
    
    renderProjectiles() {
        for (let projectile of this.projectiles) {
            projectile.render(this.ctx);
        }
    }
    
    renderGameInfo() {
        // Wave progress bar
        if (this.waveManager.isWaveInProgress()) {
            this.renderWaveProgress();
        }
        
        // Next wave preview
        if (!this.waveManager.isWaveInProgress()) {
            this.renderNextWaveInfo();
        }
    }
    
    renderWaveProgress() {
        const progress = this.waveManager.getWaveProgress();
        const barWidth = 200;
        const barHeight = 10;
        const x = this.canvas.width - barWidth - 20;
        const y = 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 5, y - 5, barWidth + 10, barHeight + 10);
        
        // Progress bar background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Progress bar fill
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Wave Progress', x + barWidth / 2, y - 8);
    }
    
    renderNextWaveInfo() {
        const nextWaveInfo = this.waveManager.getNextWaveInfo();
        if (!nextWaveInfo) return;
        
        const x = this.canvas.width - 200;
        const y = 50;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 10, y - 10, 190, 80);
        
        // Text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`Next Wave: ${nextWaveInfo.waveNumber}`, x, y);
        this.ctx.fillText(`Enemies: ${nextWaveInfo.enemyCount}`, x, y + 20);
        this.ctx.fillText(`Bonus: ${nextWaveInfo.bonus} gold`, x, y + 40);
        
        // Enemy type indicators
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Types:', x, y + 60);
        
        let typeX = x + 50;
        for (let type of nextWaveInfo.enemyTypes) {
            this.ctx.fillStyle = this.getEnemyTypeColor(type);
            this.ctx.fillText(type.toUpperCase(), typeX, y + 60);
            typeX += 40;
        }
    }
    
    getEnemyTypeColor(type) {
        switch(type) {
            case 'basic': return '#FF6B6B';
            case 'fast': return '#4ECDC4';
            case 'armored': return '#45B7D1';
            case 'boss': return '#8B008B';
            default: return '#fff';
        }
    }
    
    renderDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 200, 120);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        let y = 25;
        this.ctx.fillText(`FPS: ${this.fps}`, 15, y);
        y += 15;
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 15, y);
        y += 15;
        this.ctx.fillText(`Towers: ${this.towers.length}`, 15, y);
        y += 15;
        this.ctx.fillText(`Projectiles: ${this.projectiles.length}`, 15, y);
        y += 15;
        this.ctx.fillText(`Wave: ${this.waveManager.getCurrentWave()}`, 15, y);
        y += 15;
        this.ctx.fillText(`Gold: ${this.resourceManager.getGold()}`, 15, y);
        y += 15;
        this.ctx.fillText(`Lives: ${this.resourceManager.getLives()}`, 15, y);
    }
    
    updateFPS(currentTime, deltaTime) {
        this.frameTimeHistory.push(deltaTime);
        if (this.frameTimeHistory.length > 60) {
            this.frameTimeHistory.shift();
        }
        
        if (currentTime - this.lastFpsUpdate >= 1000) {
            const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
            this.fps = Math.round(1000 / avgFrameTime);
            this.lastFpsUpdate = currentTime;
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    handleGameOver(stats) {
        this.gameOver = true;
        this.ui.showGameOverScreen(stats);
    }
    
    restart() {
        // Reset all game systems
        this.gameOver = false;
        this.isPaused = false;
        
        // Clear entities
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        
        // Reset systems
        this.waveManager.reset();
        this.resourceManager.reset();
        this.gridSystem = new GridSystem(this.canvas.width, this.canvas.height);
        this.waveManager = new WaveManager(this.gridSystem);
        
        // Update UI
        this.ui.cancelTowerPlacement();
        this.ui.updateUI();
        
        console.log('Game restarted');
    }
    
    // Public methods for external control
    startWave() {
        return this.waveManager.startNextWave();
    }
    
    getGameState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            gameOver: this.gameOver,
            currentWave: this.waveManager.getCurrentWave(),
            resources: this.resourceManager.getResourceSummary(),
            enemyCount: this.enemies.length,
            towerCount: this.towers.length,
            projectileCount: this.projectiles.length,
            fps: this.fps
        };
    }
    
    toggleDebugInfo() {
        this.showDebugInfo = !this.showDebugInfo;
    }
    
    // Save/Load functionality for future use
    saveGame() {
        return {
            resources: this.resourceManager.saveState(),
            waveNumber: this.waveManager.getCurrentWave(),
            towers: this.towers.map(tower => ({
                type: tower.type,
                x: tower.x,
                y: tower.y,
                level: tower.level
            }))
        };
    }
    
    loadGame(saveData) {
        this.restart();
        
        // Load resources
        this.resourceManager.loadState(saveData.resources);
        
        // Load towers
        if (saveData.towers) {
            for (let towerData of saveData.towers) {
                const tower = new Tower(towerData.type, towerData.x, towerData.y);
                
                // Upgrade tower to saved level
                for (let i = 1; i < towerData.level; i++) {
                    tower.upgrade();
                }
                
                this.gridSystem.placeTower(tower.x, tower.y, tower);
                this.towers.push(tower);
            }
        }
        
        // Set wave number (waves will need to be started manually)
        // this.waveManager.currentWave = saveData.waveNumber || 0;
        
        this.ui.updateUI();
    }
}

// Initialize game when page loads
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    
    // Expose game instance for debugging
    window.game = game;
    
    console.log('Endless Siege loaded successfully!');
    console.log('Press G to toggle grid, Space to start wave, ESC to cancel tower placement');
    console.log('Use number keys 1-3 to select tower types');
});