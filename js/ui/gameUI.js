/**
 * Game UI Manager - Handles user interface interactions and updates
 */
class GameUI {
    constructor(game) {
        this.game = game;
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.hoveredTower = null;
        this.isPlacingTower = false;
        this.showGrid = false;
        
        // UI Elements
        this.elements = {
            goldAmount: document.getElementById('goldAmount'),
            livesAmount: document.getElementById('livesAmount'),
            waveNumber: document.getElementById('waveNumber'),
            startWaveBtn: document.getElementById('startWaveBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            gameOverTitle: document.getElementById('gameOverTitle'),
            gameOverMessage: document.getElementById('gameOverMessage'),
            finalWaves: document.getElementById('finalWaves'),
            finalKills: document.getElementById('finalKills'),
            restartBtn: document.getElementById('restartBtn'),
            canvas: document.getElementById('gameCanvas')
        };
        
        // Tower buttons
        this.towerButtons = document.querySelectorAll('.tower-btn');
        
        this.initializeEventListeners();
        this.updateUI();
    }
    
    initializeEventListeners() {
        // Tower selection buttons
        this.towerButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const towerType = button.dataset.towerType;
                const cost = parseInt(button.dataset.cost);
                
                if (this.game.resourceManager.canAfford(cost)) {
                    this.selectTowerType(towerType);
                } else {
                    this.showInsufficientFunds();
                }
            });
        });
        
        // Game control buttons
        this.elements.startWaveBtn.addEventListener('click', () => {
            this.startNextWave();
        });
        
        this.elements.pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });
        
        this.elements.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
        
        // Canvas events
        this.elements.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        this.elements.canvas.addEventListener('mousemove', (e) => {
            this.handleCanvasMouseMove(e);
        });
        
        this.elements.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleCanvasRightClick(e);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    selectTowerType(towerType) {
        // Deselect previous tower type
        this.towerButtons.forEach(btn => btn.classList.remove('selected'));
        
        if (this.selectedTowerType === towerType) {
            // Deselect if same type clicked
            this.selectedTowerType = null;
            this.isPlacingTower = false;
            this.elements.canvas.classList.remove('placing-tower');
        } else {
            // Select new tower type
            this.selectedTowerType = towerType;
            this.isPlacingTower = true;
            this.elements.canvas.classList.add('placing-tower');
            
            // Highlight selected button
            const selectedButton = document.querySelector(`[data-tower-type="${towerType}"]`);
            if (selectedButton) {
                selectedButton.classList.add('selected');
            }
        }
        
        this.selectedTower = null;
    }
    
    handleCanvasClick(e) {
        const rect = this.elements.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isPlacingTower && this.selectedTowerType) {
            this.placeTower(x, y);
        } else {
            this.selectTower(x, y);
        }
    }
    
    handleCanvasRightClick(e) {
        const rect = this.elements.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isPlacingTower) {
            // Cancel tower placement
            this.cancelTowerPlacement();
        } else {
            // Try to sell tower
            this.sellTower(x, y);
        }
    }
    
    handleCanvasMouseMove(e) {
        const rect = this.elements.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update hover state for towers
        this.hoveredTower = this.game.gridSystem.getTowerAt(x, y);
        
        // Update cursor based on placement validity
        if (this.isPlacingTower) {
            if (this.game.gridSystem.canPlaceTower(x, y)) {
                this.elements.canvas.classList.remove('invalid-placement');
            } else {
                this.elements.canvas.classList.add('invalid-placement');
            }
        }
    }
    
    placeTower(x, y) {
        if (!this.selectedTowerType) return;
        
        const cost = TowerCosts[this.selectedTowerType];
        if (!this.game.resourceManager.canAfford(cost)) {
            this.showInsufficientFunds();
            return;
        }
        
        if (this.game.gridSystem.canPlaceTower(x, y)) {
            const tower = new Tower(this.selectedTowerType, x, y);
            
            if (this.game.gridSystem.placeTower(x, y, tower)) {
                this.game.resourceManager.spendGold(cost);
                this.game.resourceManager.recordTowerBuilt(cost);
                this.game.towers.push(tower);
                
                this.cancelTowerPlacement();
                this.updateUI();
            }
        } else {
            this.showInvalidPlacement();
        }
    }
    
    selectTower(x, y) {
        const tower = this.game.gridSystem.getTowerAt(x, y);
        if (tower) {
            this.selectedTower = tower;
            this.showTowerInfo(tower);
        } else {
            this.selectedTower = null;
            this.hideTowerInfo();
        }
    }
    
    sellTower(x, y) {
        const tower = this.game.gridSystem.getTowerAt(x, y);
        if (tower) {
            const sellPrice = Math.floor(tower.cost * 0.7); // 70% refund
            this.game.resourceManager.addGold(sellPrice);
            
            // Remove tower from game
            this.game.gridSystem.removeTower(x, y);
            const towerIndex = this.game.towers.indexOf(tower);
            if (towerIndex > -1) {
                this.game.towers.splice(towerIndex, 1);
            }
            
            this.selectedTower = null;
            this.updateUI();
        }
    }
    
    cancelTowerPlacement() {
        this.selectedTowerType = null;
        this.isPlacingTower = false;
        this.elements.canvas.classList.remove('placing-tower', 'invalid-placement');
        this.towerButtons.forEach(btn => btn.classList.remove('selected'));
    }
    
    startNextWave() {
        if (!this.game.waveManager.isWaveInProgress()) {
            this.game.waveManager.startNextWave();
            this.updateUI();
        }
    }
    
    togglePause() {
        this.game.togglePause();
        this.elements.pauseBtn.textContent = this.game.isPaused ? 'Resume' : 'Pause';
    }
    
    restartGame() {
        this.hideGameOverScreen();
        this.game.restart();
        this.updateUI();
    }
    
    handleKeyPress(e) {
        switch(e.key.toLowerCase()) {
            case 'escape':
                this.cancelTowerPlacement();
                break;
            case ' ':
                e.preventDefault();
                if (this.game.waveManager.isWaveInProgress()) {
                    this.togglePause();
                } else {
                    this.startNextWave();
                }
                break;
            case '1':
                this.selectTowerType('basic');
                break;
            case '2':
                this.selectTowerType('slow');
                break;
            case '3':
                this.selectTowerType('aoe');
                break;
            case 'g':
                this.showGrid = !this.showGrid;
                break;
            case 'u':
                if (this.selectedTower) {
                    this.upgradeTower(this.selectedTower);
                }
                break;
        }
    }
    
    handleResize() {
        // Handle responsive design changes
        const canvas = this.elements.canvas;
        const container = canvas.parentElement;
        
        if (window.innerWidth <= 600) {
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
        }
    }
    
    upgradeTower(tower) {
        if (!tower) return;
        
        const upgradeCost = tower.getUpgradeCost();
        if (this.game.resourceManager.canAfford(upgradeCost)) {
            this.game.resourceManager.spendGold(upgradeCost);
            this.game.resourceManager.recordTowerUpgraded(upgradeCost);
            tower.upgrade();
            this.updateUI();
            this.showTowerInfo(tower); // Refresh tower info
        } else {
            this.showInsufficientFunds();
        }
    }
    
    showTowerInfo(tower) {
        // Create and show tower info panel (could be expanded)
        console.log('Tower Info:', tower.getStats());
    }
    
    hideTowerInfo() {
        // Hide tower info panel
    }
    
    showInsufficientFunds() {
        // Show insufficient funds message
        this.showMessage('Insufficient funds!', 'error');
    }
    
    showInvalidPlacement() {
        // Show invalid placement message
        this.showMessage('Cannot place tower here!', 'warning');
    }
    
    showMessage(text, type = 'info') {
        // Create temporary message display
        const message = document.createElement('div');
        message.className = `game-message ${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            z-index: 1000;
            font-weight: bold;
        `;
        
        if (type === 'error') {
            message.style.borderLeft = '4px solid #ff4444';
        } else if (type === 'warning') {
            message.style.borderLeft = '4px solid #ffaa00';
        }
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            document.body.removeChild(message);
        }, 2000);
    }
    
    updateUI() {
        const resources = this.game.resourceManager.getResourceSummary();
        const waveInfo = this.game.waveManager.getCurrentWaveInfo();
        
        // Update resource displays
        this.elements.goldAmount.textContent = resources.gold;
        this.elements.livesAmount.textContent = resources.lives;
        this.elements.waveNumber.textContent = waveInfo ? waveInfo.waveNumber : this.game.waveManager.getCurrentWave();
        
        // Update tower button states
        this.towerButtons.forEach(button => {
            const cost = parseInt(button.dataset.cost);
            if (resources.gold >= cost) {
                button.classList.remove('disabled');
            } else {
                button.classList.add('disabled');
            }
        });
        
        // Update wave button
        if (this.game.waveManager.isWaveInProgress()) {
            this.elements.startWaveBtn.textContent = 'Wave in Progress';
            this.elements.startWaveBtn.disabled = true;
        } else {
            this.elements.startWaveBtn.textContent = 'Start Wave';
            this.elements.startWaveBtn.disabled = false;
        }
        
        // Update pause button
        this.elements.pauseBtn.textContent = this.game.isPaused ? 'Resume' : 'Pause';
    }
    
    showGameOverScreen(stats) {
        this.elements.gameOverTitle.textContent = 'Game Over';
        this.elements.gameOverMessage.textContent = 'Your base has been destroyed!';
        this.elements.finalWaves.textContent = stats.wavesCompleted;
        this.elements.finalKills.textContent = stats.enemiesKilled;
        this.elements.gameOverScreen.classList.remove('hidden');
    }
    
    hideGameOverScreen() {
        this.elements.gameOverScreen.classList.add('hidden');
    }
    
    showVictoryScreen(stats) {
        this.elements.gameOverTitle.textContent = 'Victory!';
        this.elements.gameOverMessage.textContent = 'You have defended your base successfully!';
        this.elements.finalWaves.textContent = stats.wavesCompleted;
        this.elements.finalKills.textContent = stats.enemiesKilled;
        this.elements.gameOverScreen.classList.remove('hidden');
    }
    
    renderUI(ctx) {
        // Render in-game UI elements on canvas
        if (this.showGrid) {
            this.game.gridSystem.render(ctx, true);
        }
        
        // Show tower ranges when placing or selecting
        if (this.isPlacingTower || this.selectedTower) {
            const tower = this.selectedTower || 
                         (this.selectedTowerType ? { range: this.getTowerRange(this.selectedTowerType) } : null);
            
            if (tower && this.hoveredTower) {
                // Show range for hovered tower
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(this.hoveredTower.x, this.hoveredTower.y, this.hoveredTower.range, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.restore();
            }
        }
        
        // Render tower placement preview
        if (this.isPlacingTower && this.selectedTowerType) {
            this.renderTowerPlacementPreview(ctx);
        }
    }
    
    getTowerRange(towerType) {
        switch(towerType) {
            case 'basic': return 100;
            case 'slow': return 80;
            case 'aoe': return 90;
            default: return 100;
        }
    }
    
    renderTowerPlacementPreview(ctx) {
        // This would show a preview of the tower being placed
        // Implementation would depend on mouse position tracking
    }
    
    getSelectedTowerType() {
        return this.selectedTowerType;
    }
    
    getSelectedTower() {
        return this.selectedTower;
    }
    
    isShowingGrid() {
        return this.showGrid;
    }
}