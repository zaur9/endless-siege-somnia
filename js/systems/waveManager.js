class WaveManager {
    constructor(gridSystem) {
        this.gridSystem = gridSystem;
        this.currentWave = 1;
        this.waveInProgress = false;
        this.timeBetweenWaves = 30000; // 30 seconds
        this.timeBetweenEnemies = 1000; // 1 second between enemy spawns
        this.lastWaveEndTime = 0;
        this.lastEnemySpawnTime = 0;
        this.enemiesSpawnedInWave = 0;
        this.enemiesToSpawnInWave = 0;
        this.currentWaveEnemies = [];
        
        // Wave configuration
        this.waveConfigs = this.generateWaveConfigs();
        
        // Auto-start first wave after delay
        this.scheduleNextWave();
        
        this.updateUI();
    }
    
    generateWaveConfigs() {
        const configs = [];
        
        for (let wave = 1; wave <= 50; wave++) {
            const config = {
                wave: wave,
                enemies: this.calculateEnemiesForWave(wave),
                spawnDelay: Math.max(500, 1500 - (wave * 20)), // Enemies spawn faster in later waves
                bonusGold: Math.floor(wave * 2) // Bonus gold for completing wave
            };
            configs.push(config);
        }
        
        return configs;
    }
    
    calculateEnemiesForWave(waveNumber) {
        const enemies = [];
        const baseEnemyCount = 5;
        const totalEnemies = baseEnemyCount + Math.floor(waveNumber * 1.5);
        
        // Calculate enemy distribution based on wave number
        const scoutPercentage = Math.max(0.3, 0.7 - (waveNumber * 0.02));
        const runnerPercentage = Math.min(0.4, 0.1 + (waveNumber * 0.015));
        const tankPercentage = Math.min(0.4, 0.1 + (waveNumber * 0.01));
        
        let scoutCount = Math.floor(totalEnemies * scoutPercentage);
        let runnerCount = Math.floor(totalEnemies * runnerPercentage);
        let tankCount = Math.floor(totalEnemies * tankPercentage);
        
        // Ensure we have the right total
        const assigned = scoutCount + runnerCount + tankCount;
        if (assigned < totalEnemies) {
            scoutCount += totalEnemies - assigned;
        }
        
        // Add enemies to array in mixed order
        const enemyTypes = [];
        for (let i = 0; i < scoutCount; i++) enemyTypes.push('scout');
        for (let i = 0; i < runnerCount; i++) enemyTypes.push('runner');
        for (let i = 0; i < tankCount; i++) enemyTypes.push('tank');
        
        // Shuffle the array for random enemy order
        for (let i = enemyTypes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [enemyTypes[i], enemyTypes[j]] = [enemyTypes[j], enemyTypes[i]];
        }
        
        return enemyTypes;
    }
    
    update() {
        const currentTime = Date.now();
        
        if (!this.waveInProgress) {
            // Check if it's time for the next wave
            if (currentTime - this.lastWaveEndTime >= this.timeBetweenWaves) {
                this.startWave();
            } else {
                // Update countdown timer
                this.updateWaveTimer();
            }
        } else {
            // Spawn enemies during wave
            this.spawnEnemies();
            
            // Check if wave is complete
            if (this.isWaveComplete()) {
                this.endWave();
            }
        }
    }
    
    startWave() {
        if (this.waveInProgress) return;
        
        this.waveInProgress = true;
        this.enemiesSpawnedInWave = 0;
        this.lastEnemySpawnTime = Date.now();
        
        // Get wave config
        const waveConfig = this.getWaveConfig(this.currentWave);
        this.currentWaveEnemies = [...waveConfig.enemies];
        this.enemiesToSpawnInWave = this.currentWaveEnemies.length;
        this.timeBetweenEnemies = waveConfig.spawnDelay;
        
        console.log(`Starting wave ${this.currentWave} with ${this.enemiesToSpawnInWave} enemies`);
        this.updateUI();
    }
    
    spawnEnemies() {
        const currentTime = Date.now();
        
        if (currentTime - this.lastEnemySpawnTime >= this.timeBetweenEnemies && 
            this.enemiesSpawnedInWave < this.enemiesToSpawnInWave) {
            
            const enemyType = this.currentWaveEnemies[this.enemiesSpawnedInWave];
            this.spawnEnemy(enemyType);
            
            this.enemiesSpawnedInWave++;
            this.lastEnemySpawnTime = currentTime;
        }
    }
    
    spawnEnemy(type) {
        const spawnPoint = this.gridSystem.getSpawnPoint();
        const path = this.gridSystem.getEnemyPath();
        
        const enemy = new Enemy(spawnPoint.x, spawnPoint.y, path, type);
        window.game.enemies.push(enemy);
        
        // Create spawn effect
        window.game.effects.push(new SpawnEffect(spawnPoint.x, spawnPoint.y));
    }
    
    isWaveComplete() {
        // Wave is complete when all enemies are spawned and none are active
        const allEnemiesSpawned = this.enemiesSpawnedInWave >= this.enemiesToSpawnInWave;
        const noActiveEnemies = window.game.enemies.every(enemy => !enemy.active);
        
        return allEnemiesSpawned && noActiveEnemies;
    }
    
    endWave() {
        if (!this.waveInProgress) return;
        
        this.waveInProgress = false;
        this.lastWaveEndTime = Date.now();
        
        // Give bonus gold for completing wave
        const waveConfig = this.getWaveConfig(this.currentWave);
        if (waveConfig.bonusGold > 0) {
            window.game.resourceManager.addGold(waveConfig.bonusGold);
            
            // Show wave complete message
            this.showWaveCompleteMessage(waveConfig.bonusGold);
        }
        
        this.currentWave++;
        console.log(`Wave ${this.currentWave - 1} completed! Next wave in ${this.timeBetweenWaves / 1000} seconds`);
        
        this.updateUI();
        this.scheduleNextWave();
    }
    
    showWaveCompleteMessage(bonusGold) {
        window.game.effects.push(new WaveCompleteEffect(400, 100, this.currentWave - 1, bonusGold));
    }
    
    scheduleNextWave() {
        // This is handled in the update loop, but we can add preview information here
        this.updateEnemyPreview();
    }
    
    forceStartWave() {
        if (!this.waveInProgress) {
            this.lastWaveEndTime = Date.now() - this.timeBetweenWaves;
        }
    }
    
    getWaveConfig(waveNumber) {
        if (waveNumber <= this.waveConfigs.length) {
            return this.waveConfigs[waveNumber - 1];
        } else {
            // Generate config for waves beyond predefined ones
            return {
                wave: waveNumber,
                enemies: this.calculateEnemiesForWave(waveNumber),
                spawnDelay: 300,
                bonusGold: Math.floor(waveNumber * 2)
            };
        }
    }
    
    updateUI() {
        const waveElement = document.getElementById('wave-number');
        const waveStatusElement = document.getElementById('wave-status');
        const startWaveButton = document.getElementById('start-wave-btn');
        
        if (waveElement) {
            waveElement.textContent = this.currentWave;
        }
        
        if (waveStatusElement) {
            if (this.waveInProgress) {
                const remaining = this.enemiesToSpawnInWave - this.enemiesSpawnedInWave;
                waveStatusElement.textContent = `Враги: ${remaining} осталось`;
            } else {
                waveStatusElement.textContent = 'Готов к следующей волне';
            }
        }
        
        if (startWaveButton) {
            startWaveButton.disabled = this.waveInProgress;
            startWaveButton.textContent = this.waveInProgress ? 'Волна идет' : 'Начать волну';
        }
    }
    
    updateWaveTimer() {
        const timerElement = document.getElementById('wave-timer');
        const progressElement = document.getElementById('wave-progress');
        
        if (!timerElement || !progressElement) return;
        
        const currentTime = Date.now();
        const timeRemaining = this.timeBetweenWaves - (currentTime - this.lastWaveEndTime);
        const seconds = Math.max(0, Math.ceil(timeRemaining / 1000));
        
        timerElement.textContent = `${seconds}s`;
        
        const progress = Math.max(0, 1 - (timeRemaining / this.timeBetweenWaves));
        progressElement.style.width = `${progress * 100}%`;
    }
    
    updateEnemyPreview() {
        const enemyTypesElement = document.getElementById('enemy-types');
        if (!enemyTypesElement) return;
        
        const nextWaveConfig = this.getWaveConfig(this.currentWave);
        const enemyCounts = {};
        
        // Count each enemy type
        nextWaveConfig.enemies.forEach(enemyType => {
            enemyCounts[enemyType] = (enemyCounts[enemyType] || 0) + 1;
        });
        
        // Clear and rebuild enemy preview
        enemyTypesElement.innerHTML = '';
        
        Object.entries(enemyCounts).forEach(([type, count]) => {
            for (let i = 0; i < Math.min(count, 5); i++) { // Show max 5 icons per type
                const icon = document.createElement('div');
                icon.className = `enemy-icon enemy-${type}`;
                icon.title = `${type}: ${count}`;
                enemyTypesElement.appendChild(icon);
            }
            
            if (count > 5) {
                const moreIndicator = document.createElement('div');
                moreIndicator.className = 'enemy-icon';
                moreIndicator.style.cssText = `
                    background: #666;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    color: white;
                `;
                moreIndicator.textContent = `+${count - 5}`;
                enemyTypesElement.appendChild(moreIndicator);
            }
        });
    }
    
    // Get current wave info for display
    getCurrentWaveInfo() {
        return {
            wave: this.currentWave,
            inProgress: this.waveInProgress,
            enemiesToSpawn: this.enemiesToSpawnInWave,
            enemiesSpawned: this.enemiesSpawnedInWave,
            timeUntilNext: this.timeBetweenWaves - (Date.now() - this.lastWaveEndTime)
        };
    }
    
    // Reset for new game
    reset() {
        this.currentWave = 1;
        this.waveInProgress = false;
        this.lastWaveEndTime = Date.now();
        this.enemiesSpawnedInWave = 0;
        this.enemiesToSpawnInWave = 0;
        this.currentWaveEnemies = [];
        this.updateUI();
        this.scheduleNextWave();
    }
}

class SpawnEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.startTime = Date.now();
        this.duration = 500;
        this.active = true;
        this.maxRadius = 25;
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        const alpha = 1 - progress;
        const radius = this.maxRadius * progress;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#00b894';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner glow
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = '#00b894';
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class WaveCompleteEffect {
    constructor(x, y, waveNumber, bonusGold) {
        this.x = x;
        this.y = y;
        this.waveNumber = waveNumber;
        this.bonusGold = bonusGold;
        this.startTime = Date.now();
        this.duration = 2000;
        this.active = true;
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        const alpha = progress < 0.1 ? progress * 10 : 
                     progress > 0.8 ? (1 - progress) * 5 : 1;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#4a9eff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        
        const yOffset = Math.sin(progress * Math.PI) * 20;
        
        ctx.fillText(`Волна ${this.waveNumber} завершена!`, this.x, this.y - yOffset);
        
        if (this.bonusGold > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`+${this.bonusGold} золота`, this.x, this.y + 30 - yOffset);
        }
        
        ctx.restore();
    }
}