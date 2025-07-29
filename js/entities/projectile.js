class Projectile {
    constructor(x, y, target, damage, speed = 5, type = 'basic') {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.type = type;
        this.size = 4;
        this.active = true;
        
        // Calculate direction to target
        const dx = target.x - x;
        const dy = target.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.velocityX = (dx / distance) * speed;
        this.velocityY = (dy / distance) * speed;
        
        // Special properties for different projectile types
        this.setupTypeProperties();
    }
    
    setupTypeProperties() {
        switch (this.type) {
            case 'basic':
                this.color = '#ff6b6b';
                this.glowColor = '#ff9999';
                break;
            case 'frost':
                this.color = '#74b9ff';
                this.glowColor = '#a8d4ff';
                this.freezeEffect = true;
                this.freezeDuration = 2000; // 2 seconds
                this.slowAmount = 0.5; // 50% speed reduction
                break;
            case 'cannon':
                this.color = '#a29bfe';
                this.glowColor = '#c8c2ff';
                this.explosionRadius = 40;
                this.size = 6;
                break;
        }
    }
    
    update() {
        if (!this.active) return;
        
        // Move projectile
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Check if projectile reached target or is close enough
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.speed + this.target.size) {
            this.hit();
        }
        
        // Remove projectile if it goes off screen
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.active = false;
        }
    }
    
    hit() {
        if (!this.active) return;
        
        this.active = false;
        
        switch (this.type) {
            case 'basic':
                this.target.takeDamage(this.damage);
                break;
            case 'frost':
                this.target.takeDamage(this.damage);
                this.target.applyFreeze(this.slowAmount, this.freezeDuration);
                break;
            case 'cannon':
                this.explode();
                break;
        }
    }
    
    explode() {
        // Find all enemies within explosion radius
        const enemies = window.game.enemies;
        for (let enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.explosionRadius) {
                // Damage decreases with distance
                const damageMultiplier = 1 - (distance / this.explosionRadius);
                const actualDamage = Math.floor(this.damage * damageMultiplier);
                enemy.takeDamage(actualDamage);
            }
        }
        
        // Create explosion effect
        window.game.effects.push(new ExplosionEffect(this.x, this.y, this.explosionRadius));
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Draw glow effect
        ctx.save();
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 10;
        
        // Draw projectile
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw trail for cannon projectiles
        if (this.type === 'cannon') {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x - this.velocityX, this.y - this.velocityY, this.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class ExplosionEffect {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.currentRadius = 0;
        this.duration = 300; // milliseconds
        this.startTime = Date.now();
        this.active = true;
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        if (progress >= 1) {
            this.active = false;
            return;
        }
        
        // Expand explosion
        this.currentRadius = this.maxRadius * progress;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Draw explosion ring
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner glow
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = '#ff9999';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.currentRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}