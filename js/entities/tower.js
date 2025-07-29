/**
 * Tower Class - Represents defensive towers that shoot at enemies
 */
class Tower {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.level = 1;
        this.target = null;
        this.lastShotTime = 0;
        this.angle = 0;
        
        // Set tower properties based on type
        this.setProperties(type);
        
        // Visual properties
        this.radius = 15;
        this.color = this.getColor();
        this.barrelLength = 20;
    }
    
    setProperties(type) {
        switch(type) {
            case 'basic':
                this.damage = 20;
                this.range = 100;
                this.fireRate = 1000; // milliseconds between shots
                this.cost = 25;
                this.upgradeCost = 15;
                this.projectileSpeed = 5;
                this.projectileType = 'bullet';
                break;
            case 'slow':
                this.damage = 10;
                this.range = 80;
                this.fireRate = 800;
                this.cost = 40;
                this.upgradeCost = 25;
                this.projectileSpeed = 4;
                this.projectileType = 'ice';
                this.slowDuration = 120; // frames
                this.slowMultiplier = 0.5;
                break;
            case 'aoe':
                this.damage = 15;
                this.range = 90;
                this.fireRate = 1500;
                this.cost = 60;
                this.upgradeCost = 35;
                this.projectileSpeed = 3;
                this.projectileType = 'explosive';
                this.explosionRadius = 40;
                break;
            default:
                this.damage = 20;
                this.range = 100;
                this.fireRate = 1000;
                this.cost = 25;
                this.upgradeCost = 15;
                this.projectileSpeed = 5;
                this.projectileType = 'bullet';
        }
    }
    
    getColor() {
        switch(this.type) {
            case 'basic': return '#8B4513';
            case 'slow': return '#4169E1';
            case 'aoe': return '#DC143C';
            default: return '#8B4513';
        }
    }
    
    update(enemies, currentTime, projectiles) {
        // Find target if we don't have one or current target is invalid
        if (!this.target || !this.target.alive || this.getDistanceToTarget() > this.range) {
            this.findTarget(enemies);
        }
        
        // Shoot at target if we have one and enough time has passed
        if (this.target && currentTime - this.lastShotTime >= this.fireRate) {
            this.shoot(projectiles, currentTime);
        }
        
        // Update angle to face target
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.angle = Math.atan2(dy, dx);
        }
    }
    
    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (let enemy of enemies) {
            if (!enemy.alive) continue;
            
            const distance = this.getDistanceToEnemy(enemy);
            if (distance <= this.range) {
                // Prioritize enemies that are further along the path
                const priority = enemy.pathIndex + (1 - distance / this.range);
                if (priority > closestDistance || closestEnemy === null) {
                    closestEnemy = enemy;
                    closestDistance = priority;
                }
            }
        }
        
        this.target = closestEnemy;
    }
    
    shoot(projectiles, currentTime) {
        if (!this.target) return;
        
        // Create projectile
        const projectile = new Projectile(
            this.x, this.y,
            this.target.x, this.target.y,
            this.projectileSpeed,
            this.damage,
            this.projectileType,
            this
        );
        
        projectiles.push(projectile);
        this.lastShotTime = currentTime;
    }
    
    getDistanceToEnemy(enemy) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getDistanceToTarget() {
        if (!this.target) return Infinity;
        return this.getDistanceToEnemy(this.target);
    }
    
    upgrade() {
        this.level++;
        
        // Increase stats based on tower type
        switch(this.type) {
            case 'basic':
                this.damage += 10;
                this.range += 10;
                this.fireRate = Math.max(this.fireRate - 100, 300);
                break;
            case 'slow':
                this.damage += 5;
                this.range += 8;
                this.slowDuration += 30;
                this.slowMultiplier = Math.max(this.slowMultiplier - 0.1, 0.2);
                break;
            case 'aoe':
                this.damage += 8;
                this.explosionRadius += 5;
                this.range += 5;
                break;
        }
        
        // Increase upgrade cost
        this.upgradeCost = Math.floor(this.upgradeCost * 1.5);
    }
    
    canUpgrade(resources) {
        return resources >= this.upgradeCost;
    }
    
    getUpgradeCost() {
        return this.upgradeCost;
    }
    
    getStats() {
        return {
            damage: this.damage,
            range: this.range,
            fireRate: this.fireRate,
            level: this.level,
            upgradeCost: this.upgradeCost
        };
    }
    
    render(ctx, showRange = false) {
        // Draw range circle if requested
        if (showRange) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw tower base
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Draw tower details based on type
        this.renderTowerDetails(ctx);
        
        // Draw barrel pointing at target
        if (this.target) {
            ctx.rotate(this.angle);
            ctx.fillStyle = '#333';
            ctx.fillRect(this.radius - 5, -3, this.barrelLength, 6);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.radius - 5, -3, this.barrelLength, 6);
        }
        
        ctx.restore();
        
        // Draw level indicator
        this.renderLevelIndicator(ctx);
    }
    
    renderTowerDetails(ctx) {
        switch(this.type) {
            case 'basic':
                // Simple cross pattern
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-6, 0);
                ctx.lineTo(6, 0);
                ctx.moveTo(0, -6);
                ctx.lineTo(0, 6);
                ctx.stroke();
                break;
                
            case 'slow':
                // Snowflake pattern
                ctx.strokeStyle = '#87CEEB';
                ctx.lineWidth = 2;
                for (let i = 0; i < 6; i++) {
                    ctx.save();
                    ctx.rotate((i * Math.PI) / 3);
                    ctx.beginPath();
                    ctx.moveTo(0, -8);
                    ctx.lineTo(0, 8);
                    ctx.moveTo(-3, -5);
                    ctx.lineTo(3, -5);
                    ctx.moveTo(-3, 5);
                    ctx.lineTo(3, 5);
                    ctx.stroke();
                    ctx.restore();
                }
                break;
                
            case 'aoe':
                // Explosion pattern
                ctx.fillStyle = '#FFD700';
                for (let i = 0; i < 8; i++) {
                    ctx.save();
                    ctx.rotate((i * Math.PI) / 4);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(0, -10);
                    ctx.lineTo(-2, -8);
                    ctx.lineTo(2, -8);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                break;
        }
    }
    
    renderLevelIndicator(ctx) {
        if (this.level > 1) {
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            
            // Draw background circle
            ctx.beginPath();
            ctx.arc(this.x + this.radius - 5, this.y - this.radius + 5, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Draw level number
            ctx.fillStyle = '#000';
            ctx.fillText(this.level.toString(), this.x + this.radius - 5, this.y - this.radius + 9);
        }
    }
    
    isPointInRange(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.radius;
    }
}

// Tower type definitions for easy reference
const TowerTypes = {
    BASIC: 'basic',
    SLOW: 'slow',
    AOE: 'aoe'
};

// Tower costs for reference
const TowerCosts = {
    basic: 25,
    slow: 40,
    aoe: 60
};