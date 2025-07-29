class GameUI {
    constructor(game) {
        this.game = game;
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.tooltipElement = null;
        
        this.initializeEventListeners();
        this.createTooltip();
    }
    
    initializeEventListeners() {
        // Tower selection buttons
        const towerButtons = document.querySelectorAll('.tower-button');
        towerButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const towerType = button.getAttribute('data-tower');
                this.selectTowerType(towerType);
            });
            
            // Hover effects for tower info
            button.addEventListener('mouseenter', (e) => {
                const towerType = button.getAttribute('data-tower');
                this.showTowerTooltip(e, towerType);
            });
            
            button.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
        
        // Game controls
        const pauseBtn = document.getElementById('pause-btn');
        const startWaveBtn = document.getElementById('start-wave-btn');
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }
        
        if (startWaveBtn) {
            startWaveBtn.addEventListener('click', () => {
                this.game.waveManager.forceStartWave();
            });
        }
        
        // Canvas events
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('click', (e) => {
                this.handleCanvasClick(e);
            });
            
            canvas.addEventListener('mousemove', (e) => {
                this.handleCanvasMouseMove(e);
            });
            
            canvas.addEventListener('mouseleave', () => {
                this.game.mousePos = null;
                this.selectedTower = null;
                this.updateSelectedTowerInfo();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }
    
    createTooltip() {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'tooltip';
        this.tooltipElement.style.display = 'none';
        document.body.appendChild(this.tooltipElement);
    }
    
    selectTowerType(towerType) {
        // Check if player can afford the tower
        if (!this.game.resourceManager.canAffordTower(towerType)) {
            this.showMessage('Недостаточно золота!', '#e17055');
            return;
        }
        
        // Toggle selection
        if (this.selectedTowerType === towerType) {
            this.selectedTowerType = null;
            this.game.placingTower = false;
        } else {
            this.selectedTowerType = towerType;
            this.game.selectedTowerType = towerType;
            this.game.placingTower = true;
        }
        
        this.updateTowerButtonStates();
        this.updateSelectedTowerInfo();
        this.updateCursor();
    }
    
    updateTowerButtonStates() {
        const towerButtons = document.querySelectorAll('.tower-button');
        towerButtons.forEach(button => {
            const towerType = button.getAttribute('data-tower');
            
            // Remove previous selection
            button.classList.remove('selected');
            
            // Add selection if this is the selected tower
            if (this.selectedTowerType === towerType) {
                button.classList.add('selected');
            }
        });
    }
    
    updateSelectedTowerInfo() {
        const infoElement = document.getElementById('selected-tower-details');
        if (!infoElement) return;
        
        if (this.selectedTower) {
            // Show info for selected placed tower
            const info = this.selectedTower.getInfo();
            infoElement.innerHTML = `
                <div><strong>${this.getTowerDisplayName(info.type)}</strong></div>
                <div>Урон: ${info.damage}</div>
                <div>Дальность: ${info.range}px</div>
                <div>Скорость: ${(1000 / info.fireRate).toFixed(1)}/с</div>
                <div>Уровень: ${info.level}</div>
            `;
        } else if (this.selectedTowerType) {
            // Show info for tower being placed
            const info = TowerFactory.getTowerInfo(this.selectedTowerType);
            infoElement.innerHTML = `
                <div><strong>${this.getTowerDisplayName(info.type)}</strong></div>
                <div>Урон: ${info.damage}</div>
                <div>Дальность: ${info.range}px</div>
                <div>Стоимость: ${info.cost} золота</div>
                <div style="font-size: 0.9em; color: #cccccc; margin-top: 5px;">
                    ${info.description}
                </div>
            `;
        } else {
            infoElement.innerHTML = 'Выберите башню для размещения';
        }
    }
    
    getTowerDisplayName(type) {
        switch (type) {
            case 'basic': return 'Базовая башня';
            case 'frost': return 'Ледяная башня';
            case 'cannon': return 'Пушка';
            default: return 'Неизвестная башня';
        }
    }
    
    handleCanvasClick(e) {
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.game.placingTower && this.selectedTowerType) {
            this.placeTower(x, y);
        } else {
            this.selectTowerAtPosition(x, y);
        }
    }
    
    handleCanvasMouseMove(e) {
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.game.mousePos = { x, y };
        
        // Show tower info on hover
        if (!this.game.placingTower) {
            const tower = this.findTowerAtPosition(x, y);
            if (tower && tower !== this.selectedTower) {
                this.showTowerInfoTooltip(e, tower);
            } else if (!tower) {
                this.hideTooltip();
            }
        }
    }
    
    placeTower(x, y) {
        if (!this.selectedTowerType) return;
        
        const snapped = this.game.gridSystem.snapToGrid(x, y);
        
        if (this.game.gridSystem.canPlaceTower(x, y)) {
            // Purchase the tower
            if (this.game.resourceManager.purchaseTower(this.selectedTowerType)) {
                // Create and place the tower
                const tower = TowerFactory.createTower(snapped.x, snapped.y, this.selectedTowerType);
                this.game.towers.push(tower);
                this.game.gridSystem.placeTower(x, y);
                
                this.showMessage(`${this.getTowerDisplayName(this.selectedTowerType)} размещена!`, '#00b894');
                
                // Continue placing if player has enough gold
                if (!this.game.resourceManager.canAffordTower(this.selectedTowerType)) {
                    this.selectedTowerType = null;
                    this.game.placingTower = false;
                    this.game.selectedTowerType = null;
                    this.updateTowerButtonStates();
                    this.updateSelectedTowerInfo();
                    this.updateCursor();
                }
            } else {
                this.showMessage('Недостаточно золота!', '#e17055');
            }
        } else {
            this.showMessage('Нельзя разместить башню здесь!', '#e17055');
        }
    }
    
    selectTowerAtPosition(x, y) {
        const tower = this.findTowerAtPosition(x, y);
        
        if (tower) {
            this.selectedTower = tower;
            this.game.selectedTower = tower;
        } else {
            this.selectedTower = null;
            this.game.selectedTower = null;
        }
        
        this.updateSelectedTowerInfo();
    }
    
    findTowerAtPosition(x, y) {
        for (let tower of this.game.towers) {
            if (tower.containsPoint(x, y)) {
                return tower;
            }
        }
        return null;
    }
    
    handleKeyPress(e) {
        switch (e.key.toLowerCase()) {
            case ' ':
            case 'p':
                e.preventDefault();
                this.togglePause();
                break;
            case 'escape':
                this.cancelTowerPlacement();
                break;
            case '1':
                this.selectTowerType('basic');
                break;
            case '2':
                this.selectTowerType('frost');
                break;
            case '3':
                this.selectTowerType('cannon');
                break;
            case 'enter':
                this.game.waveManager.forceStartWave();
                break;
        }
    }
    
    cancelTowerPlacement() {
        this.selectedTowerType = null;
        this.game.placingTower = false;
        this.game.selectedTowerType = null;
        this.updateTowerButtonStates();
        this.updateSelectedTowerInfo();
        this.updateCursor();
    }
    
    togglePause() {
        this.game.paused = !this.game.paused;
        
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = this.game.paused ? 'Продолжить' : 'Пауза';
        }
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            if (this.game.paused) {
                gameContainer.classList.add('game-paused');
            } else {
                gameContainer.classList.remove('game-paused');
            }
        }
        
        this.showMessage(this.game.paused ? 'Игра на паузе' : 'Игра продолжена', '#4a9eff');
    }
    
    updateCursor() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        if (this.game.placingTower) {
            canvas.style.cursor = 'crosshair';
            document.body.classList.add('placing-tower');
        } else {
            canvas.style.cursor = 'default';
            document.body.classList.remove('placing-tower');
        }
    }
    
    showTowerTooltip(e, towerType) {
        const info = TowerFactory.getTowerInfo(towerType);
        const canAfford = this.game.resourceManager.canAffordTower(towerType);
        
        this.tooltipElement.innerHTML = `
            <div><strong>${this.getTowerDisplayName(towerType)}</strong></div>
            <div>Урон: ${info.damage}</div>
            <div>Дальность: ${info.range}px</div>
            <div style="color: ${canAfford ? '#ffd700' : '#e17055'}">
                Стоимость: ${info.cost} золота
            </div>
            ${!canAfford ? '<div style="color: #e17055;">Недостаточно золота</div>' : ''}
        `;
        
        this.showTooltipAtEvent(e);
    }
    
    showTowerInfoTooltip(e, tower) {
        const info = tower.getInfo();
        
        this.tooltipElement.innerHTML = `
            <div><strong>${this.getTowerDisplayName(info.type)}</strong></div>
            <div>Урон: ${info.damage}</div>
            <div>Дальность: ${info.range}px</div>
            <div>Скорость: ${(1000 / info.fireRate).toFixed(1)}/с</div>
            <div>Уровень: ${info.level}</div>
            <div style="font-size: 0.8em; color: #cccccc;">Нажмите для выбора</div>
        `;
        
        this.showTooltipAtEvent(e, true);
    }
    
    showTooltipAtEvent(e, followMouse = false) {
        if (!this.tooltipElement) return;
        
        this.tooltipElement.style.display = 'block';
        
        const x = e.clientX + 10;
        const y = e.clientY - 10;
        
        this.tooltipElement.style.left = x + 'px';
        this.tooltipElement.style.top = y + 'px';
        
        if (followMouse) {
            const onMouseMove = (moveEvent) => {
                this.tooltipElement.style.left = (moveEvent.clientX + 10) + 'px';
                this.tooltipElement.style.top = (moveEvent.clientY - 10) + 'px';
            };
            
            document.addEventListener('mousemove', onMouseMove);
            
            const cleanup = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseout', cleanup);
            };
            
            document.addEventListener('mouseout', cleanup);
        }
    }
    
    hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.style.display = 'none';
        }
    }
    
    showMessage(text, color = '#4a9eff') {
        // Create message element
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: ${color};
            padding: 10px 20px;
            border-radius: 5px;
            border: 2px solid ${color};
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        message.textContent = text;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(message);
        
        // Remove message after delay
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 300);
        }, 3000);
    }
    
    // Update UI elements based on game state
    update() {
        // This can be expanded to update any dynamic UI elements
        this.updateTowerButtonStates();
    }
    
    // Cleanup when game ends
    cleanup() {
        if (this.tooltipElement && this.tooltipElement.parentNode) {
            this.tooltipElement.parentNode.removeChild(this.tooltipElement);
        }
        
        // Remove any remaining message elements
        const messages = document.querySelectorAll('.game-message');
        messages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }
}