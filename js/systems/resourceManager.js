/**
 * Resource Manager - Handles game resources like gold, lives, and scoring
 */
class ResourceManager {
    constructor() {
        this.gold = 100; // Starting gold
        this.lives = 20; // Starting lives
        this.score = 0;
        this.enemiesKilled = 0;
        this.wavesCompleted = 0;
        
        // Resource gain multipliers
        this.goldMultiplier = 1.0;
        this.scoreMultiplier = 1.0;
        
        // Statistics tracking
        this.stats = {
            totalGoldEarned: 0,
            totalGoldSpent: 0,
            towersBuilt: 0,
            towersUpgraded: 0,
            damageDone: 0,
            shotsFired: 0,
            accuracyHits: 0
        };
        
        // Event callbacks
        this.onResourceChange = null;
        this.onGameOver = null;
    }
    
    // Gold management
    addGold(amount) {
        const actualAmount = Math.floor(amount * this.goldMultiplier);
        this.gold += actualAmount;
        this.stats.totalGoldEarned += actualAmount;
        this.notifyResourceChange();
        return actualAmount;
    }
    
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.stats.totalGoldSpent += amount;
            this.notifyResourceChange();
            return true;
        }
        return false;
    }
    
    getGold() {
        return this.gold;
    }
    
    canAfford(amount) {
        return this.gold >= amount;
    }
    
    // Lives management
    loseLife(amount = 1) {
        this.lives -= amount;
        this.notifyResourceChange();
        
        if (this.lives <= 0) {
            this.lives = 0;
            this.gameOver();
        }
        
        return this.lives;
    }
    
    addLife(amount = 1) {
        this.lives += amount;
        this.notifyResourceChange();
        return this.lives;
    }
    
    getLives() {
        return this.lives;
    }
    
    isGameOver() {
        return this.lives <= 0;
    }
    
    // Score management
    addScore(amount) {
        const actualAmount = Math.floor(amount * this.scoreMultiplier);
        this.score += actualAmount;
        this.notifyResourceChange();
        return actualAmount;
    }
    
    getScore() {
        return this.score;
    }
    
    // Enemy kill tracking
    recordEnemyKill(enemy) {
        this.enemiesKilled++;
        this.addGold(enemy.reward);
        this.addScore(enemy.reward * 10); // Score is 10x gold reward
        
        // Bonus for different enemy types
        let bonus = 0;
        switch(enemy.type) {
            case EnemyTypes.FAST:
                bonus = 5;
                break;
            case EnemyTypes.ARMORED:
                bonus = 10;
                break;
            case EnemyTypes.BOSS:
                bonus = 25;
                break;
        }
        
        if (bonus > 0) {
            this.addGold(bonus);
            this.addScore(bonus * 10);
        }
    }
    
    // Wave completion
    recordWaveCompletion(waveNumber, bonus) {
        this.wavesCompleted++;
        
        if (bonus > 0) {
            this.addGold(bonus);
            this.addScore(bonus * 5);
        }
        
        // Additional wave completion bonus
        const completionBonus = Math.floor(waveNumber * 2);
        this.addGold(completionBonus);
        this.addScore(completionBonus * 5);
    }
    
    // Tower management
    recordTowerBuilt(towerCost) {
        this.stats.towersBuilt++;
        // Cost already deducted by spendGold
    }
    
    recordTowerUpgraded(upgradeCost) {
        this.stats.towersUpgraded++;
        // Cost already deducted by spendGold
    }
    
    // Combat statistics
    recordDamage(damage) {
        this.stats.damageDone += damage;
    }
    
    recordShot(hit = false) {
        this.stats.shotsFired++;
        if (hit) {
            this.stats.accuracyHits++;
        }
    }
    
    getAccuracy() {
        if (this.stats.shotsFired === 0) return 0;
        return (this.stats.accuracyHits / this.stats.shotsFired) * 100;
    }
    
    // Multiplier management
    setGoldMultiplier(multiplier) {
        this.goldMultiplier = Math.max(0.1, multiplier);
    }
    
    setScoreMultiplier(multiplier) {
        this.scoreMultiplier = Math.max(0.1, multiplier);
    }
    
    addGoldMultiplier(bonus) {
        this.goldMultiplier += bonus;
    }
    
    addScoreMultiplier(bonus) {
        this.scoreMultiplier += bonus;
    }
    
    // Temporary bonuses (could be used for power-ups)
    applyTemporaryGoldBonus(multiplier, duration) {
        const originalMultiplier = this.goldMultiplier;
        this.goldMultiplier *= multiplier;
        
        setTimeout(() => {
            this.goldMultiplier = originalMultiplier;
        }, duration);
    }
    
    // Game state
    gameOver() {
        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                gold: this.gold,
                enemiesKilled: this.enemiesKilled,
                wavesCompleted: this.wavesCompleted,
                stats: this.getDetailedStats()
            });
        }
    }
    
    reset() {
        this.gold = 100;
        this.lives = 20;
        this.score = 0;
        this.enemiesKilled = 0;
        this.wavesCompleted = 0;
        this.goldMultiplier = 1.0;
        this.scoreMultiplier = 1.0;
        
        // Reset statistics
        this.stats = {
            totalGoldEarned: 0,
            totalGoldSpent: 0,
            towersBuilt: 0,
            towersUpgraded: 0,
            damageDone: 0,
            shotsFired: 0,
            accuracyHits: 0
        };
        
        this.notifyResourceChange();
    }
    
    // Statistics and information
    getDetailedStats() {
        return {
            ...this.stats,
            currentGold: this.gold,
            currentLives: this.lives,
            currentScore: this.score,
            enemiesKilled: this.enemiesKilled,
            wavesCompleted: this.wavesCompleted,
            goldMultiplier: this.goldMultiplier,
            scoreMultiplier: this.scoreMultiplier,
            accuracy: this.getAccuracy(),
            goldPerEnemy: this.enemiesKilled > 0 ? this.stats.totalGoldEarned / this.enemiesKilled : 0,
            damagePerShot: this.stats.shotsFired > 0 ? this.stats.damageDone / this.stats.shotsFired : 0
        };
    }
    
    getResourceSummary() {
        return {
            gold: this.gold,
            lives: this.lives,
            score: this.score,
            enemiesKilled: this.enemiesKilled,
            wavesCompleted: this.wavesCompleted,
            goldMultiplier: this.goldMultiplier,
            scoreMultiplier: this.scoreMultiplier
        };
    }
    
    // Event system
    setResourceChangeCallback(callback) {
        this.onResourceChange = callback;
    }
    
    setGameOverCallback(callback) {
        this.onGameOver = callback;
    }
    
    notifyResourceChange() {
        if (this.onResourceChange) {
            this.onResourceChange(this.getResourceSummary());
        }
    }
    
    // Save/Load functionality (for future use)
    saveState() {
        return {
            gold: this.gold,
            lives: this.lives,
            score: this.score,
            enemiesKilled: this.enemiesKilled,
            wavesCompleted: this.wavesCompleted,
            goldMultiplier: this.goldMultiplier,
            scoreMultiplier: this.scoreMultiplier,
            stats: this.stats
        };
    }
    
    loadState(state) {
        this.gold = state.gold || 100;
        this.lives = state.lives || 20;
        this.score = state.score || 0;
        this.enemiesKilled = state.enemiesKilled || 0;
        this.wavesCompleted = state.wavesCompleted || 0;
        this.goldMultiplier = state.goldMultiplier || 1.0;
        this.scoreMultiplier = state.scoreMultiplier || 1.0;
        this.stats = state.stats || {
            totalGoldEarned: 0,
            totalGoldSpent: 0,
            towersBuilt: 0,
            towersUpgraded: 0,
            damageDone: 0,
            shotsFired: 0,
            accuracyHits: 0
        };
        
        this.notifyResourceChange();
    }
    
    // Utility methods
    formatGold() {
        return this.gold.toLocaleString();
    }
    
    formatScore() {
        return this.score.toLocaleString();
    }
    
    canAffordTower(towerType) {
        const cost = TowerCosts[towerType];
        return cost ? this.canAfford(cost) : false;
    }
    
    canAffordUpgrade(tower) {
        return tower && this.canAfford(tower.getUpgradeCost());
    }
}