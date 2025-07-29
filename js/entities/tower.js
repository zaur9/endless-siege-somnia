class Tower {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
        this.target = null;
        this.lastShotTime = 0;
        this.active = true;
        this.level = 1;
        
        this.setupTypeProperties();
    }
    
    setupTypeProperties() {
        switch (this.type) {
            case 'basic':
                this.damage = 20;
                this.range = 80;
                this.fireRate = 1000; // milliseconds between shots
                this.cost = 50;
                this.color = '#ff6b6b';
                this.projectileType = 'basic';
                break;
            case 'frost':
                this.damage = 15;
                this.range = 70;
                this.fireRate = 1200;
                this.cost = 75;
                this.color = '#74b9ff';
                this.projectileType = 'frost';
                break;
            case 'cannon':
                this.damage = 35;
                this.range = 90;
                this.fireRate = 2000;
                this.cost = 100;
                this.color = '#a29bfe';
                this.projectileType = 'cannon';
                break;
        }
    }
    
    update() {
        if (!this.active) return;
        
        // Find target if we don't have one or current target is invalid
        if (!this.target || !this.target.active || this.getDistanceToTarget() > this.range) {
            this.findTarget();
        }
        
        // Shoot at target if we have one and enough time has passed
        if (this.target && Date.now() - this.lastShotTime >= this.fireRate) {
            this.shoot();
        }
    }
    
    findTarget() {
        this.target = null;
        let closestDistance = this.range;
        
        // Find the closest enemy within range
        for (let enemy of window.game.enemies) {
            if (!enemy.active) continue;
            
            const distance = this.getDistanceFrom(enemy.x, enemy.y);
            if (distance <= this.range && distance < closestDistance) {
                this.target = enemy;
                closestDistance = distance;
            }
        }
    }
    
    shoot() {
        if (!this.target) return;
        
        // Create projectile
        const projectile = new Projectile(
            this.x, 
            this.y, 
            this.target, 
            this.damage, 
            5, 
            this.projectileType
        );
        
        window.game.projectiles.push(projectile);
        this.lastShotTime = Date.now();
        
        // Create muzzle flash effect
        window.game.effects.push(new MuzzleFlash(this.x, this.y, this.color));
    }
    
    getDistanceFrom(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getDistanceToTarget() {
        if (!this.target) return Infinity;
        return this.getDistanceFrom(this.target.x, this.target.y);
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Draw range indicator if selected
        if (window.game.selectedTower === this) {
            this.renderRange(ctx);
        }
        
        // Draw tower base
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw tower details based on type
        this.renderTowerDetails(ctx);
        
        // Draw target line if tower has a target
        if (this.target && this.target.active) {
            this.renderTargetLine(ctx);
        }
        
        ctx.restore();
    }
    
    renderTowerDetails(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        
        switch (this.type) {
            case 'basic':
                // Draw crosshairs
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x - 8, this.y);
                ctx.lineTo(this.x + 8, this.y);
                ctx.moveTo(this.x, this.y - 8);
                ctx.lineTo(this.x, this.y + 8);
                ctx.stroke();
                break;
            case 'frost':
                // Draw snowflake pattern
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const x1 = this.x + Math.cos(angle) * 6;
                    const y1 = this.y + Math.sin(angle) * 6;
                    const x2 = this.x + Math.cos(angle) * 12;
                    const y2 = this.y + Math.sin(angle) * 12;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
                break;
            case 'cannon':
                // Draw cannon barrel
                if (this.target) {
                    const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                    const barrelLength = 15;
                    const barrelX = this.x + Math.cos(angle) * barrelLength;
                    const barrelY = this.y + Math.sin(angle) * barrelLength;
                    
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(barrelX, barrelY);
                    ctx.stroke();
                }
                
                // Draw cannon symbol
                ctx.fillStyle = '#ffffff';
                ctx.fillText('C', this.x, this.y + 4);
                break;
        }
    }
    
    renderRange(ctx) {
        ctx.strokeStyle = 'rgba(74, 158, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    renderTargetLine(ctx) {
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.target.x, this.target.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Check if a point is within the tower's area
    containsPoint(x, y) {
        const distance = this.getDistanceFrom(x, y);
        return distance <= this.size;
    }
    
    // Get tower information for UI
    getInfo() {
        return {
            type: this.type,
            damage: this.damage,
            range: this.range,
            fireRate: this.fireRate,
            cost: this.cost,
            level: this.level
        };
    }
    
    // Upgrade tower (future feature)
    upgrade() {
        if (this.level >= 3) return false;
        
        this.level++;
        this.damage = Math.floor(this.damage * 1.5);
        this.range = Math.floor(this.range * 1.1);
        this.fireRate = Math.floor(this.fireRate * 0.9);
        
        return true;
    }
}

class MuzzleFlash {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.startTime = Date.now();
        this.duration = 100;
        this.active = true;
        this.maxSize = 15;
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
        const size = this.maxSize * (1 - progress);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Tower factory for creating towers
class TowerFactory {
    static createTower(x, y, type) {
        return new Tower(x, y, type);
    }
    
    static getTowerCost(type) {
        switch (type) {
            case 'basic': return 50;
            case 'frost': return 75;
            case 'cannon': return 100;
            default: return 0;
        }
    }
    
    static getTowerInfo(type) {
        const tower = new Tower(0, 0, type);
        return {
            type: type,
            damage: tower.damage,
            range: tower.range,
            fireRate: tower.fireRate,
            cost: tower.cost,
            description: this.getTowerDescription(type)
        };
    }
    
    static getTowerDescription(type) {
        switch (type) {
            case 'basic':
                return 'Базовая башня с хорошим балансом урона и скорости стрельбы';
            case 'frost':
                return 'Ледяная башня замедляет врагов и наносит урон льдом';
            case 'cannon':
                return 'Пушка наносит большой урон по области взрывом';
            default:
                return 'Неизвестный тип башни';
        }
    }
}