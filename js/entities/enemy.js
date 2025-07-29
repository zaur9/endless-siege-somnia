/**
 * Enemy Class - Represents enemies that move along the path
 */
class Enemy {
    constructor(type, x, y, path) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.path = path;
        this.pathIndex = 0;
        this.alive = true;
        this.reachedEnd = false;
        this.slowEffect = 0; // Slow effect duration
        this.slowMultiplier = 1; // Speed multiplier when slowed
        
        // Set enemy properties based on type
        this.setProperties(type);
        
        // Movement properties
        this.targetX = this.path[0].x;
        this.targetY = this.path[0].y;
        this.angle = 0;
        
        // Visual properties
        this.radius = 12;
        this.color = this.getColor();
    }
    
    setProperties(type) {
        switch(type) {
            case 'basic':
                this.maxHealth = 50;
                this.health = 50;
                this.speed = 1;
                this.reward = 10;
                break;
            case 'fast':
                this.maxHealth = 30;
                this.health = 30;
                this.speed = 2;
                this.reward = 15;
                break;
            case 'armored':
                this.maxHealth = 120;
                this.health = 120;
                this.speed = 0.5;
                this.reward = 25;
                break;
            case 'boss':
                this.maxHealth = 300;
                this.health = 300;
                this.speed = 0.7;
                this.reward = 50;
                this.radius = 20;
                break;
            default:
                this.maxHealth = 50;
                this.health = 50;
                this.speed = 1;
                this.reward = 10;
        }
    }
    
    getColor() {
        switch(this.type) {
            case 'basic': return '#FF6B6B';
            case 'fast': return '#4ECDC4';
            case 'armored': return '#45B7D1';
            case 'boss': return '#8B008B';
            default: return '#FF6B6B';
        }
    }
    
    update() {
        if (!this.alive || this.reachedEnd) return;
        
        // Update slow effect
        if (this.slowEffect > 0) {
            this.slowEffect--;
            if (this.slowEffect <= 0) {
                this.slowMultiplier = 1;
            }
        }
        
        // Calculate movement
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If close to target, move to next waypoint
        if (distance < 5) {
            this.pathIndex++;
            if (this.pathIndex >= this.path.length) {
                this.reachedEnd = true;
                return;
            }
            this.targetX = this.path[this.pathIndex].x;
            this.targetY = this.path[this.pathIndex].y;
        } else {
            // Move towards target
            const moveSpeed = this.speed * this.slowMultiplier;
            this.x += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed;
            
            // Update angle for rotation
            this.angle = Math.atan2(dy, dx);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
        }
        return !this.alive; // Return true if enemy died
    }
    
    applySlow(duration, multiplier) {
        this.slowEffect = Math.max(this.slowEffect, duration);
        this.slowMultiplier = Math.min(this.slowMultiplier, multiplier);
    }
    
    getDistanceToPoint(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw enemy body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw enemy border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw direction indicator
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.moveTo(this.radius - 5, 0);
        ctx.lineTo(this.radius - 10, -3);
        ctx.lineTo(this.radius - 10, 3);
        ctx.closePath();
        ctx.fill();
        
        // Draw slow effect
        if (this.slowEffect > 0) {
            ctx.strokeStyle = '#00BFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Draw health bar
        this.renderHealthBar(ctx);
        
        // Draw type indicator for special enemies
        if (this.type !== 'basic') {
            this.renderTypeIndicator(ctx);
        }
    }
    
    renderHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const x = this.x - barWidth / 2;
        const y = this.y - this.radius - 10;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.6 ? '#4CAF50' : 
                           healthPercent > 0.3 ? '#FFC107' : '#F44336';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
    
    renderTypeIndicator(ctx) {
        let symbol = '';
        let symbolColor = '#FFF';
        
        switch(this.type) {
            case 'fast':
                symbol = '⚡';
                break;
            case 'armored':
                symbol = '🛡';
                break;
            case 'boss':
                symbol = '👑';
                symbolColor = '#FFD700';
                break;
        }
        
        if (symbol) {
            ctx.font = '16px Arial';
            ctx.fillStyle = symbolColor;
            ctx.textAlign = 'center';
            ctx.fillText(symbol, this.x, this.y + 5);
        }
    }
}

// Enemy type definitions for easy reference
const EnemyTypes = {
    BASIC: 'basic',
    FAST: 'fast',
    ARMORED: 'armored',
    BOSS: 'boss'
};