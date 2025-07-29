/**
 * Projectile Class - Represents projectiles fired by towers
 */
class Projectile {
    constructor(x, y, targetX, targetY, speed, damage, type, tower) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.damage = damage;
        this.type = type;
        this.tower = tower;
        this.alive = true;
        this.hasHit = false;
        
        // Calculate direction
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.velocityX = (dx / distance) * speed;
        this.velocityY = (dy / distance) * speed;
        this.angle = Math.atan2(dy, dx);
        
        // Visual properties based on type
        this.setVisualProperties();
        
        // Travel distance tracking
        this.travelDistance = 0;
        this.maxDistance = distance + 50; // Allow some overshoot
    }
    
    setVisualProperties() {
        switch(this.type) {
            case 'bullet':
                this.radius = 3;
                this.color = '#FFD700';
                this.trailColor = '#FFA500';
                break;
            case 'ice':
                this.radius = 4;
                this.color = '#87CEEB';
                this.trailColor = '#4169E1';
                break;
            case 'explosive':
                this.radius = 5;
                this.color = '#FF4444';
                this.trailColor = '#FF6666';
                break;
            default:
                this.radius = 3;
                this.color = '#FFD700';
                this.trailColor = '#FFA500';
        }
    }
    
    update() {
        if (!this.alive) return;
        
        // Move projectile
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Track travel distance
        this.travelDistance += this.speed;
        
        // Remove if traveled too far
        if (this.travelDistance > this.maxDistance) {
            this.alive = false;
        }
    }
    
    checkCollision(enemies) {
        if (!this.alive || this.hasHit) return [];
        
        const hitEnemies = [];
        
        for (let enemy of enemies) {
            if (!enemy.alive) continue;
            
            const distance = this.getDistanceToEnemy(enemy);
            if (distance <= this.radius + enemy.radius) {
                hitEnemies.push(enemy);
                
                // For non-AoE projectiles, stop after first hit
                if (this.type !== 'explosive') {
                    this.hasHit = true;
                    this.alive = false;
                    break;
                }
            }
        }
        
        // Handle AoE explosion
        if (hitEnemies.length > 0 && this.type === 'explosive') {
            this.explode(enemies, hitEnemies[0]);
            return this.getEnemiesInExplosion(enemies, hitEnemies[0]);
        }
        
        return hitEnemies;
    }
    
    explode(enemies, epicenter) {
        this.hasHit = true;
        this.alive = false;
        
        // Create explosion visual effect
        this.createExplosionEffect();
    }
    
    getEnemiesInExplosion(enemies, epicenter) {
        const hitEnemies = [];
        const explosionRadius = this.tower.explosionRadius || 40;
        
        for (let enemy of enemies) {
            if (!enemy.alive) continue;
            
            const distance = this.getDistanceToPoint(epicenter.x, epicenter.y, enemy.x, enemy.y);
            if (distance <= explosionRadius) {
                hitEnemies.push(enemy);
            }
        }
        
        return hitEnemies;
    }
    
    createExplosionEffect() {
        // This could be expanded to create visual explosion effects
        // For now, we'll just mark it for the game engine to handle
        this.explosionX = this.x;
        this.explosionY = this.y;
        this.explosionRadius = this.tower.explosionRadius || 40;
        this.showExplosion = true;
        this.explosionTimer = 30; // frames to show explosion
    }
    
    applyEffects(enemy) {
        // Apply damage
        const killed = enemy.takeDamage(this.damage);
        
        // Apply special effects based on projectile type
        switch(this.type) {
            case 'ice':
                if (this.tower.slowDuration && this.tower.slowMultiplier) {
                    enemy.applySlow(this.tower.slowDuration, this.tower.slowMultiplier);
                }
                break;
        }
        
        return killed;
    }
    
    getDistanceToEnemy(enemy) {
        return this.getDistanceToPoint(this.x, this.y, enemy.x, enemy.y);
    }
    
    getDistanceToPoint(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw projectile trail
        this.renderTrail(ctx);
        
        // Draw projectile body
        this.renderBody(ctx);
        
        ctx.restore();
        
        // Render explosion effect if needed
        if (this.showExplosion) {
            this.renderExplosion(ctx);
        }
    }
    
    renderTrail(ctx) {
        const trailLength = this.speed * 3;
        
        ctx.strokeStyle = this.trailColor;
        ctx.lineWidth = this.radius;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.6;
        
        ctx.beginPath();
        ctx.moveTo(-trailLength, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
    
    renderBody(ctx) {
        switch(this.type) {
            case 'bullet':
                // Simple circle
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
                ctx.fill();
                
                // Add glow effect
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 5;
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
                
            case 'ice':
                // Crystalline shape
                ctx.fillStyle = this.color;
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 1;
                
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const x = Math.cos(angle) * this.radius;
                    const y = Math.sin(angle) * this.radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
                
            case 'explosive':
                // Flaming projectile
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
                ctx.fill();
                
                // Add fire effect
                ctx.fillStyle = '#FF8800';
                ctx.beginPath();
                ctx.arc(-2, 0, this.radius * 0.7, 0, 2 * Math.PI);
                ctx.fill();
                
                ctx.fillStyle = '#FFAA00';
                ctx.beginPath();
                ctx.arc(-3, 0, this.radius * 0.4, 0, 2 * Math.PI);
                ctx.fill();
                break;
        }
    }
    
    renderExplosion(ctx) {
        if (!this.showExplosion || this.explosionTimer <= 0) {
            this.showExplosion = false;
            return;
        }
        
        ctx.save();
        
        const progress = 1 - (this.explosionTimer / 30);
        const currentRadius = this.explosionRadius * progress;
        const alpha = 1 - progress;
        
        // Outer explosion ring
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(this.explosionX, this.explosionY, currentRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Inner explosion ring
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFAA00';
        ctx.beginPath();
        ctx.arc(this.explosionX, this.explosionY, currentRadius * 0.6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Core explosion
        ctx.globalAlpha = alpha * 1.2;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.explosionX, this.explosionY, currentRadius * 0.3, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.restore();
        
        this.explosionTimer--;
    }
    
    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < -50 || this.x > canvasWidth + 50 || 
               this.y < -50 || this.y > canvasHeight + 50;
    }
}

// Projectile type definitions for easy reference
const ProjectileTypes = {
    BULLET: 'bullet',
    ICE: 'ice',
    EXPLOSIVE: 'explosive'
};