class ResourceManager {
    constructor(startingGold = 200, startingHealth = 100) {
        this.gold = startingGold;
        this.baseHealth = startingHealth;
        this.maxBaseHealth = startingHealth;
        this.score = 0;
        this.totalEnemiesKilled = 0;
        this.totalGoldEarned = 0;
        
        // Event listeners for UI updates
        this.goldChangeListeners = [];
        this.healthChangeListeners = [];
        this.scoreChangeListeners = [];
        
        this.updateUI();
    }
    
    // Gold management
    addGold(amount) {
        this.gold += amount;
        this.totalGoldEarned += amount;
        this.score += Math.floor(amount * 10); // 10 points per gold
        this.notifyGoldChange();
        this.updateUI();
    }
    
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.notifyGoldChange();
            this.updateUI();
            return true;
        }
        return false;
    }
    
    hasEnoughGold(amount) {
        return this.gold >= amount;
    }
    
    getGold() {
        return this.gold;
    }
    
    // Base health management
    takeDamage(amount) {
        this.baseHealth -= amount;
        if (this.baseHealth < 0) {
            this.baseHealth = 0;
        }
        this.notifyHealthChange();
        this.updateUI();
        
        // Check for game over
        if (this.baseHealth <= 0) {
            this.triggerGameOver();
        }
        
        return this.baseHealth > 0;
    }
    
    healBase(amount) {
        this.baseHealth += amount;
        if (this.baseHealth > this.maxBaseHealth) {
            this.baseHealth = this.maxBaseHealth;
        }
        this.notifyHealthChange();
        this.updateUI();
    }
    
    getBaseHealth() {
        return this.baseHealth;
    }
    
    getMaxBaseHealth() {
        return this.maxBaseHealth;
    }
    
    getHealthPercentage() {
        return this.baseHealth / this.maxBaseHealth;
    }
    
    // Score management
    addScore(points) {
        this.score += points;
        this.notifyScoreChange();
    }
    
    getScore() {
        return this.score;
    }
    
    // Statistics
    enemyKilled(enemy) {
        this.totalEnemiesKilled++;
        this.addGold(enemy.reward);
        this.addScore(enemy.reward * 5); // 5 points per gold from kills
    }
    
    getTotalEnemiesKilled() {
        return this.totalEnemiesKilled;
    }
    
    getTotalGoldEarned() {
        return this.totalGoldEarned;
    }
    
    // Tower purchase
    canAffordTower(towerType) {
        const cost = TowerFactory.getTowerCost(towerType);
        return this.hasEnoughGold(cost);
    }
    
    purchaseTower(towerType) {
        const cost = TowerFactory.getTowerCost(towerType);
        if (this.spendGold(cost)) {
            return true;
        }
        return false;
    }
    
    // Event system for UI updates
    addGoldChangeListener(callback) {
        this.goldChangeListeners.push(callback);
    }
    
    addHealthChangeListener(callback) {
        this.healthChangeListeners.push(callback);
    }
    
    addScoreChangeListener(callback) {
        this.scoreChangeListeners.push(callback);
    }
    
    notifyGoldChange() {
        this.goldChangeListeners.forEach(callback => callback(this.gold));
    }
    
    notifyHealthChange() {
        this.healthChangeListeners.forEach(callback => callback(this.baseHealth, this.maxBaseHealth));
    }
    
    notifyScoreChange() {
        this.scoreChangeListeners.forEach(callback => callback(this.score));
    }
    
    // UI Updates
    updateUI() {
        const goldElement = document.getElementById('gold');
        const healthElement = document.getElementById('base-health');
        
        if (goldElement) {
            goldElement.textContent = this.gold;
            goldElement.style.color = this.gold < 50 ? '#e17055' : '#4a9eff';
        }
        
        if (healthElement) {
            healthElement.textContent = this.baseHealth;
            const healthPercent = this.getHealthPercentage();
            healthElement.style.color = healthPercent > 0.6 ? '#00b894' : 
                                       healthPercent > 0.3 ? '#fdcb6e' : '#e17055';
        }
        
        // Update tower button states
        this.updateTowerButtons();
    }
    
    updateTowerButtons() {
        const towerButtons = document.querySelectorAll('.tower-button');
        towerButtons.forEach(button => {
            const towerType = button.getAttribute('data-tower');
            const cost = TowerFactory.getTowerCost(towerType);
            const canAfford = this.hasEnoughGold(cost);
            
            if (canAfford) {
                button.classList.remove('disabled');
            } else {
                button.classList.add('disabled');
            }
        });
    }
    
    // Game over handling
    triggerGameOver() {
        if (window.game) {
            window.game.gameOver = true;
            window.game.paused = true;
            this.showGameOverScreen();
        }
    }
    
    showGameOverScreen() {
        // Create game over overlay
        const overlay = document.createElement('div');
        overlay.id = 'game-over-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 3px solid #4a9eff;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            color: white;
            font-family: Arial, sans-serif;
            box-shadow: 0 0 30px rgba(74, 158, 255, 0.5);
        `;
        
        modal.innerHTML = `
            <h2 style="color: #e17055; margin-bottom: 20px; font-size: 2.5em;">ИГРА ОКОНЧЕНА</h2>
            <div style="margin-bottom: 25px;">
                <div style="font-size: 1.2em; margin-bottom: 10px;">Финальный счет: <span style="color: #4a9eff;">${this.score}</span></div>
                <div style="margin-bottom: 5px;">Врагов убито: <span style="color: #00b894;">${this.totalEnemiesKilled}</span></div>
                <div style="margin-bottom: 5px;">Золота заработано: <span style="color: #ffd700;">${this.totalGoldEarned}</span></div>
                <div>Волна достигнута: <span style="color: #a29bfe;">${window.game ? window.game.waveManager.currentWave : 1}</span></div>
            </div>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="restart-button" style="
                    padding: 12px 25px;
                    background: #4a9eff;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Играть снова</button>
                <button id="menu-button" style="
                    padding: 12px 25px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Главное меню</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add button event listeners
        document.getElementById('restart-button').addEventListener('click', () => {
            document.body.removeChild(overlay);
            this.restartGame();
        });
        
        document.getElementById('menu-button').addEventListener('click', () => {
            document.body.removeChild(overlay);
            location.reload();
        });
        
        // Add hover effects
        const buttons = modal.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            });
        });
    }
    
    restartGame() {
        // Reset all values
        this.gold = 200;
        this.baseHealth = 100;
        this.score = 0;
        this.totalEnemiesKilled = 0;
        this.totalGoldEarned = 0;
        
        // Restart the game
        if (window.game) {
            window.game.restart();
        }
        
        this.updateUI();
    }
    
    // Save/Load game state (for future features)
    saveState() {
        const state = {
            gold: this.gold,
            baseHealth: this.baseHealth,
            score: this.score,
            totalEnemiesKilled: this.totalEnemiesKilled,
            totalGoldEarned: this.totalGoldEarned
        };
        localStorage.setItem('endlessSiegeResources', JSON.stringify(state));
    }
    
    loadState() {
        const saved = localStorage.getItem('endlessSiegeResources');
        if (saved) {
            const state = JSON.parse(saved);
            this.gold = state.gold || 200;
            this.baseHealth = state.baseHealth || 100;
            this.score = state.score || 0;
            this.totalEnemiesKilled = state.totalEnemiesKilled || 0;
            this.totalGoldEarned = state.totalGoldEarned || 0;
            this.updateUI();
        }
    }
    
    // Get resource summary for display
    getResourceSummary() {
        return {
            gold: this.gold,
            baseHealth: this.baseHealth,
            maxBaseHealth: this.maxBaseHealth,
            healthPercentage: this.getHealthPercentage(),
            score: this.score,
            enemiesKilled: this.totalEnemiesKilled,
            goldEarned: this.totalGoldEarned
        };
    }
}