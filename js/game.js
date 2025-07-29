class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.running = false;
        this.paused = false;
        this.gameOver = false;
        this.lastFrameTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        
        // Game entities
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        
        // Game systems
        this.gridSystem = new GridSystem(800, 600, 40);
        this.resourceManager = new ResourceManager(200, 100);
        this.waveManager = new WaveManager(this.gridSystem);
        this.gameUI = new GameUI(this);
        
        // Input state
        this.mousePos = null;
        this.selectedTower = null;
        this.selectedTowerType = null;
        this.placingTower = false;
        
        // Performance tracking
        this.performanceStats = {
            lastRenderTime: 0,
            renderTimes: [],
            averageRenderTime: 0
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('Initializing Endless Siege...');
        
        // Set up canvas
        this.setupCanvas();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start the game loop
        this.start();
        
        console.log('Game initialized successfully!');
    }
    
    setupCanvas() {
        // Ensure canvas has correct size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Set up canvas context properties
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Visibility change handler (pause when tab is not active)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.running && !this.paused) {
                this.togglePause();
            }
        });
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    start() {
        if (this.running) return;
        
        this.running = true;
        this.lastFrameTime = performance.now();
        console.log('Game started!');
        
        // Start the main game loop
        this.gameLoop();
    }
    
    stop() {
        this.running = false;
        console.log('Game stopped!');
    }
    
    pause() {
        this.paused = true;
    }
    
    resume() {
        this.paused = false;
        this.lastFrameTime = performance.now();
    }
    
    togglePause() {
        if (this.paused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    gameLoop() {
        if (!this.running) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Calculate FPS
        this.updateFPS(currentTime);
        
        // Only update game logic if not paused
        if (!this.paused && !this.gameOver) {
            this.update(deltaTime);
        }
        
        // Always render (so we can see the paused state)
        const renderStart = performance.now();
        this.render();
        const renderEnd = performance.now();
        
        // Track render performance
        this.updatePerformanceStats(renderEnd - renderStart);
        
        // Continue the game loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        // Update game systems
        this.waveManager.update();
        this.resourceManager.updateUI();
        this.gameUI.update();
        
        // Update towers
        for (let i = this.towers.length - 1; i >= 0; i--) {
            const tower = this.towers[i];
            tower.update();
            
            if (!tower.active) {
                this.towers.splice(i, 1);
            }
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update();
            
            if (!enemy.active) {
                if (enemy.reachedBase) {
                    // Enemy reached the base, damage it
                    this.resourceManager.takeDamage(10);
                    this.gameUI.showMessage('База получила урон!', '#e17055');
                }
                this.enemies.splice(i, 1);
            }
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update();
            
            if (!projectile.active) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update();
            
            if (!effect.active) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render grid and path
        this.gridSystem.render(this.ctx, false);
        
        // Render enemies
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // Render towers
        this.towers.forEach(tower => tower.render(this.ctx));
        
        // Render projectiles
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        
        // Render effects
        this.effects.forEach(effect => effect.render(this.ctx));
        
        // Render UI overlays
        this.renderUIOverlays();
        
        // Render debug info if enabled
        if (this.showDebugInfo) {
            this.renderDebugInfo();
        }
    }
    
    renderUIOverlays() {
        // Render pause overlay
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ПАУЗА', this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Нажмите P или Пробел для продолжения', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
        
        // Render game over overlay
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#e17055';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ИГРА ОКОНЧЕНА', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('База разрушена!', this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }
    
    renderDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 120);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        let y = 25;
        const lineHeight = 15;
        
        this.ctx.fillText(`FPS: ${this.fps}`, 15, y);
        y += lineHeight;
        this.ctx.fillText(`Towers: ${this.towers.length}`, 15, y);
        y += lineHeight;
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 15, y);
        y += lineHeight;
        this.ctx.fillText(`Projectiles: ${this.projectiles.length}`, 15, y);
        y += lineHeight;
        this.ctx.fillText(`Effects: ${this.effects.length}`, 15, y);
        y += lineHeight;
        this.ctx.fillText(`Render: ${this.performanceStats.averageRenderTime.toFixed(2)}ms`, 15, y);
        y += lineHeight;
        this.ctx.fillText(`Wave: ${this.waveManager.currentWave}`, 15, y);
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.fpsUpdateTime));
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
    }
    
    updatePerformanceStats(renderTime) {
        this.performanceStats.renderTimes.push(renderTime);
        
        // Keep only last 60 frames for average calculation
        if (this.performanceStats.renderTimes.length > 60) {
            this.performanceStats.renderTimes.shift();
        }
        
        // Calculate average render time
        const sum = this.performanceStats.renderTimes.reduce((a, b) => a + b, 0);
        this.performanceStats.averageRenderTime = sum / this.performanceStats.renderTimes.length;
    }
    
    handleResize() {
        // Handle window resize if needed
        // For now, keep canvas size fixed
    }
    
    // Game management methods
    restart() {
        console.log('Restarting game...');
        
        // Clear all game entities
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        
        // Reset game state
        this.gameOver = false;
        this.paused = false;
        this.selectedTower = null;
        this.selectedTowerType = null;
        this.placingTower = false;
        
        // Reset systems
        this.gridSystem = new GridSystem(800, 600, 40);
        this.resourceManager = new ResourceManager(200, 100);
        this.waveManager = new WaveManager(this.gridSystem);
        
        // Update UI
        this.gameUI.cancelTowerPlacement();
        this.gameUI.updateSelectedTowerInfo();
        
        console.log('Game restarted!');
    }
    
    // Utility methods for game entities
    addTower(x, y, type) {
        if (this.gridSystem.canPlaceTower(x, y) && this.resourceManager.canAffordTower(type)) {
            const snapped = this.gridSystem.snapToGrid(x, y);
            const tower = TowerFactory.createTower(snapped.x, snapped.y, type);
            
            if (this.resourceManager.purchaseTower(type)) {
                this.towers.push(tower);
                this.gridSystem.placeTower(x, y);
                return tower;
            }
        }
        return null;
    }
    
    removeTower(tower) {
        const index = this.towers.indexOf(tower);
        if (index > -1) {
            this.towers.splice(index, 1);
            this.gridSystem.removeTower(tower.x, tower.y);
            return true;
        }
        return false;
    }
    
    addEnemy(type, path) {
        const spawnPoint = this.gridSystem.getSpawnPoint();
        const enemy = new Enemy(spawnPoint.x, spawnPoint.y, path || this.gridSystem.getEnemyPath(), type);
        this.enemies.push(enemy);
        return enemy;
    }
    
    addEffect(effect) {
        this.effects.push(effect);
    }
    
    // Debug and cheat methods (for development/testing)
    toggleDebugInfo() {
        this.showDebugInfo = !this.showDebugInfo;
    }
    
    addGold(amount) {
        this.resourceManager.addGold(amount);
    }
    
    healBase(amount) {
        this.resourceManager.healBase(amount);
    }
    
    // Get game statistics
    getGameStats() {
        return {
            wave: this.waveManager.currentWave,
            gold: this.resourceManager.getGold(),
            baseHealth: this.resourceManager.getBaseHealth(),
            score: this.resourceManager.getScore(),
            towersBuilt: this.towers.length,
            enemiesKilled: this.resourceManager.getTotalEnemiesKilled(),
            gameTime: performance.now() // Could be improved with actual game time tracking
        };
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting Endless Siege...');
    
    // Create global game instance
    window.game = new Game();
    
    // Add keyboard shortcut for debug info
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F3' || (e.ctrlKey && e.key === 'd')) {
            e.preventDefault();
            window.game.toggleDebugInfo();
        }
        
        // Cheat codes for testing
        if (e.ctrlKey && e.shiftKey) {
            switch (e.key) {
                case 'G':
                    window.game.addGold(1000);
                    console.log('Cheat: Added 1000 gold');
                    break;
                case 'H':
                    window.game.healBase(50);
                    console.log('Cheat: Healed base');
                    break;
                case 'W':
                    window.game.waveManager.forceStartWave();
                    console.log('Cheat: Started next wave');
                    break;
            }
        }
    });
    
    console.log('Endless Siege started successfully!');
    console.log('Controls:');
    console.log('- Click towers to select and place them');
    console.log('- P or Space: Pause/Resume');
    console.log('- ESC: Cancel tower placement');
    console.log('- 1/2/3: Select tower types');
    console.log('- Enter: Start next wave');
    console.log('- F3: Toggle debug info');
});