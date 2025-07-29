/**
 * Wave Manager - Handles enemy spawning and wave progression
 */
class WaveManager {
    constructor(gridSystem) {
        this.gridSystem = gridSystem;
        this.currentWave = 0;
        this.isWaveActive = false;
        this.waveStartTime = 0;
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 0;
        this.spawnDelay = 1000; // milliseconds between spawns
        this.lastSpawnTime = 0;
        this.waveCompleted = false;
        this.waveInProgress = false;
        
        // Enemy spawn patterns for different waves
        this.wavePatterns = this.generateWavePatterns();
        
        // Spawn point
        this.spawnPoint = this.gridSystem.getSpawnPoint();
        this.enemyPath = this.gridSystem.getEnemyPath();
    }
    
    generateWavePatterns() {
        const patterns = [];
        
        // Generate 50 waves with increasing difficulty
        for (let wave = 1; wave <= 50; wave++) {
            const pattern = this.createWavePattern(wave);
            patterns.push(pattern);
        }
        
        return patterns;
    }
    
    createWavePattern(waveNumber) {
        const pattern = {
            enemies: [],
            spawnDelay: Math.max(1000 - (waveNumber * 20), 300), // Faster spawning over time
            waveBonus: Math.floor(waveNumber * 5) // Bonus gold for completing wave
        };
        
        // Base enemy count increases with wave number
        const baseEnemyCount = Math.min(5 + Math.floor(waveNumber * 1.2), 30);
        
        if (waveNumber <= 3) {
            // Early waves: only basic enemies
            for (let i = 0; i < baseEnemyCount; i++) {
                pattern.enemies.push({
                    type: EnemyTypes.BASIC,
                    spawnTime: i * pattern.spawnDelay
                });
            }
        } else if (waveNumber <= 7) {
            // Introduce fast enemies
            const fastCount = Math.floor(baseEnemyCount * 0.3);
            const basicCount = baseEnemyCount - fastCount;
            
            for (let i = 0; i < basicCount; i++) {
                pattern.enemies.push({
                    type: EnemyTypes.BASIC,
                    spawnTime: i * pattern.spawnDelay
                });
            }
            
            for (let i = 0; i < fastCount; i++) {
                pattern.enemies.push({
                    type: EnemyTypes.FAST,
                    spawnTime: (basicCount + i) * pattern.spawnDelay
                });
            }
        } else if (waveNumber <= 15) {
            // Introduce armored enemies
            const armoredCount = Math.floor(baseEnemyCount * 0.2);
            const fastCount = Math.floor(baseEnemyCount * 0.3);
            const basicCount = baseEnemyCount - armoredCount - fastCount;
            
            let spawnIndex = 0;
            
            for (let i = 0; i < basicCount; i++) {
                pattern.enemies.push({
                    type: EnemyTypes.BASIC,
                    spawnTime: spawnIndex * pattern.spawnDelay
                });
                spawnIndex++;
            }
            
            for (let i = 0; i < fastCount; i++) {
                pattern.enemies.push({
                    type: EnemyTypes.FAST,
                    spawnTime: spawnIndex * pattern.spawnDelay
                });
                spawnIndex++;
            }
            
            for (let i = 0; i < armoredCount; i++) {
                pattern.enemies.push({
                    type: EnemyTypes.ARMORED,
                    spawnTime: spawnIndex * pattern.spawnDelay
                });
                spawnIndex++;
            }
        } else {
            // Later waves: all enemy types including boss
            const bossCount = waveNumber % 5 === 0 ? Math.floor(waveNumber / 10) : 0; // Boss every 5th wave
            const armoredCount = Math.floor(baseEnemyCount * 0.25);
            const fastCount = Math.floor(baseEnemyCount * 0.35);
            const basicCount = baseEnemyCount - armoredCount - fastCount - bossCount;
            
            let spawnIndex = 0;
            
            for (let i = 0; i < basicCount; i++) {
                pattern.enemies.push({
                    type: EnemyTypes.BASIC,
                    spawnTime: spawnIndex * pattern.spawnDelay
                });
                spawnIndex++;
            }
            
            for (let i = 0; i < fastCount; i++) {
                pattern.enemies.push({
                    type: EnemyTypes.FAST,
                    spawnTime: spawnIndex * pattern.spawnDelay
                });
                spawnIndex++;
            }
            
            for (let i = 0; i < armoredCount; i++) {
                pattern.enemies.push({
                    type: EnemyTypes.ARMORED,
                    spawnTime: spawnIndex * pattern.spawnDelay
                });
                spawnIndex++;
            }
            
            for (let i = 0; i < bossCount; i++) {
                pattern.enemies.push({
                    type: EnemyTypes.BOSS,
                    spawnTime: spawnIndex * pattern.spawnDelay
                });
                spawnIndex++;
            }
        }
        
        return pattern;
    }
    
    startNextWave() {
        if (this.isWaveActive) return false;
        
        this.currentWave++;
        if (this.currentWave > this.wavePatterns.length) {
            // Generate more waves if needed
            const newPattern = this.createWavePattern(this.currentWave);
            this.wavePatterns.push(newPattern);
        }
        
        const currentPattern = this.wavePatterns[this.currentWave - 1];
        
        this.isWaveActive = true;
        this.waveInProgress = true;
        this.waveCompleted = false;
        this.waveStartTime = Date.now();
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = currentPattern.enemies.length;
        this.spawnDelay = currentPattern.spawnDelay;
        this.lastSpawnTime = 0;
        
        return true;
    }
    
    update(currentTime, enemies) {
        if (!this.isWaveActive) return [];
        
        const newEnemies = [];
        const currentPattern = this.wavePatterns[this.currentWave - 1];
        const waveElapsedTime = currentTime - this.waveStartTime;
        
        // Spawn enemies based on their scheduled spawn time
        for (let i = this.enemiesSpawned; i < currentPattern.enemies.length; i++) {
            const enemyData = currentPattern.enemies[i];
            
            if (waveElapsedTime >= enemyData.spawnTime) {
                const enemy = new Enemy(
                    enemyData.type,
                    this.spawnPoint.x,
                    this.spawnPoint.y,
                    this.enemyPath
                );
                
                newEnemies.push(enemy);
                this.enemiesSpawned++;
            } else {
                break; // Enemies are sorted by spawn time, so we can break here
            }
        }
        
        // Check if all enemies have been spawned and all enemies are gone
        if (this.enemiesSpawned >= this.enemiesToSpawn) {
            const livingEnemies = enemies.filter(enemy => enemy.alive && !enemy.reachedEnd);
            
            if (livingEnemies.length === 0) {
                this.completeWave();
            }
        }
        
        return newEnemies;
    }
    
    completeWave() {
        this.isWaveActive = false;
        this.waveInProgress = false;
        this.waveCompleted = true;
    }
    
    getWaveBonus() {
        if (!this.waveCompleted || this.currentWave === 0) return 0;
        
        const pattern = this.wavePatterns[this.currentWave - 1];
        return pattern.waveBonus || 0;
    }
    
    isWaveInProgress() {
        return this.waveInProgress;
    }
    
    isWaveJustCompleted() {
        const result = this.waveCompleted;
        if (result) {
            this.waveCompleted = false; // Reset flag after checking
        }
        return result;
    }
    
    getCurrentWave() {
        return this.currentWave;
    }
    
    getNextWaveInfo() {
        const nextWaveNumber = this.currentWave + 1;
        if (nextWaveNumber > this.wavePatterns.length) {
            const pattern = this.createWavePattern(nextWaveNumber);
            return {
                waveNumber: nextWaveNumber,
                enemyCount: pattern.enemies.length,
                enemyTypes: this.getUniqueEnemyTypes(pattern.enemies),
                bonus: pattern.waveBonus
            };
        }
        
        const pattern = this.wavePatterns[nextWaveNumber - 1];
        return {
            waveNumber: nextWaveNumber,
            enemyCount: pattern.enemies.length,
            enemyTypes: this.getUniqueEnemyTypes(pattern.enemies),
            bonus: pattern.waveBonus
        };
    }
    
    getCurrentWaveInfo() {
        if (this.currentWave === 0) return null;
        
        const pattern = this.wavePatterns[this.currentWave - 1];
        return {
            waveNumber: this.currentWave,
            enemyCount: pattern.enemies.length,
            enemiesSpawned: this.enemiesSpawned,
            enemyTypes: this.getUniqueEnemyTypes(pattern.enemies),
            bonus: pattern.waveBonus,
            progress: this.enemiesSpawned / pattern.enemies.length
        };
    }
    
    getUniqueEnemyTypes(enemies) {
        const types = new Set();
        enemies.forEach(enemy => types.add(enemy.type));
        return Array.from(types);
    }
    
    getWaveProgress() {
        if (!this.isWaveActive || this.enemiesToSpawn === 0) return 0;
        return this.enemiesSpawned / this.enemiesToSpawn;
    }
    
    getTimeUntilNextSpawn() {
        if (!this.isWaveActive || this.enemiesSpawned >= this.enemiesToSpawn) return 0;
        
        const currentTime = Date.now();
        const waveElapsedTime = currentTime - this.waveStartTime;
        const nextEnemyData = this.wavePatterns[this.currentWave - 1].enemies[this.enemiesSpawned];
        
        return Math.max(0, nextEnemyData.spawnTime - waveElapsedTime);
    }
    
    // Skip to next enemy (for testing or power-ups)
    skipToNextEnemy() {
        if (!this.isWaveActive || this.enemiesSpawned >= this.enemiesToSpawn) return false;
        
        const currentPattern = this.wavePatterns[this.currentWave - 1];
        const nextEnemyData = currentPattern.enemies[this.enemiesSpawned];
        const currentTime = Date.now();
        const waveElapsedTime = currentTime - this.waveStartTime;
        
        // Adjust wave start time to make next enemy spawn immediately
        if (nextEnemyData.spawnTime > waveElapsedTime) {
            this.waveStartTime -= (nextEnemyData.spawnTime - waveElapsedTime);
        }
        
        return true;
    }
    
    reset() {
        this.currentWave = 0;
        this.isWaveActive = false;
        this.waveStartTime = 0;
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 0;
        this.lastSpawnTime = 0;
        this.waveCompleted = false;
        this.waveInProgress = false;
    }
}