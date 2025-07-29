class Enemy {
    constructor(x, y, path, type = 'scout') {
        this.x = x;
        this.y = y;
        this.path = path;
        this.pathIndex = 0;
        this.type = type;
        this.size = 15;
        this.active = true;
        this.reachedBase = false;
        
        // Freeze/slow effects
        this.frozen = false;
        this.freezeEndTime = 0;
        this.normalSpeed = this.speed;
        this.slowMultiplier = 1;
        
        this.setupTypeProperties();
        
        // Calculate initial direction
        this.updateDirection();
    }
    
    setupTypeProperties() {
        switch (this.type) {
            case 'scout':
                this.maxHealth = 50;
                this.health = 50;
                this.speed = 2;
                this.reward = 10;
                this.color = '#00b894';
                this.size = 12;
                break;
            case 'tank':
                this.maxHealth = 150;
                this.health = 150;
                this.speed = 1;
                this.reward = 25;
                this.color = '#e17055';
                this.size = 18;
                break;
            case 'runner':
                this.maxHealth = 30;
                this.health = 30;
                this.speed = 3;
                this.reward = 15;
                this.color = '#fdcb6e';
                this.size = 10;
                break;
        }
        this.normalSpeed = this.speed;
    }
    
    updateDirection() {
        if (this.pathIndex >= this.path.length - 1) {
            return;
        }
        
        const target = this.path[this.pathIndex + 1];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.directionX = dx / distance;
            this.directionY = dy / distance;
        }
    }
    
    update() {
        if (!this.active) return;
        
        // Update freeze effect
        this.updateFreezeEffect();
        
        // Move towards next path point
        this.moveAlongPath();
        
        // Check if reached the end of path (base)
        if (this.pathIndex >= this.path.length - 1) {
            this.reachedBase = true;
            this.active = false;
        }
    }
    
    updateFreezeEffect() {
        if (this.frozen && Date.now() > this.freezeEndTime) {
            this.frozen = false;
            this.speed = this.normalSpeed;
            this.slowMultiplier = 1;
        }
    }
    
    moveAlongPath() {
        if (this.pathIndex >= this.path.length - 1) return;
        
        const currentSpeed = this.speed * this.slowMultiplier;
        const target = this.path[this.pathIndex + 1];
        
        // Move towards target
        this.x += this.directionX * currentSpeed;
        this.y += this.directionY * currentSpeed;
        
        // Check if reached current target
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= currentSpeed + 5) {
            this.pathIndex++;
            this.x = target.x;
            this.y = target.y;
            this.updateDirection();
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        // Create damage number effect
        window.game.effects.push(new DamageNumber(this.x, this.y - 20, damage));
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    applyFreeze(slowAmount, duration) {
        this.frozen = true;
        this.freezeEndTime = Date.now() + duration;
        this.slowMultiplier = slowAmount;
        this.speed = this.normalSpeed * slowAmount;
    }
    
    die() {
        this.active = false;
        
        // Give player gold reward
        window.game.resourceManager.addGold(this.reward);
        
        // Create death effect
        window.game.effects.push(new DeathEffect(this.x, this.y, this.color));
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Draw enemy
        ctx.save();
        
        // Draw health bar
        this.renderHealthBar(ctx);
        
        // Draw freeze effect
        if (this.frozen) {
            ctx.shadowColor = '#74b9ff';
            ctx.shadowBlur = 8;
        }
        
        // Draw enemy body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw type indicator
        this.renderTypeIndicator(ctx);
        
        // Draw freeze overlay
        if (this.frozen) {
            ctx.fillStyle = 'rgba(116, 185, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    renderHealthBar(ctx) {
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 8;
        
        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.6 ? '#00b894' : 
                           healthPercent > 0.3 ? '#fdcb6e' : '#e17055';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    renderTypeIndicator(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        
        let indicator = '';
        switch (this.type) {
            case 'scout': indicator = 'S'; break;
            case 'tank': indicator = 'T'; break;
            case 'runner': indicator = 'R'; break;
        }
        
        ctx.fillText(indicator, this.x, this.y + 3);
    }
    
    getDistanceFrom(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class DamageNumber {
    constructor(x, y, damage) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.startTime = Date.now();
        this.duration = 1000;
        this.active = true;
        this.velocity = -2; // Move upward
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.active = false;
            return;
        }
        
        this.y += this.velocity;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`-${this.damage}`, this.x, this.y);
        ctx.restore();
    }
}

class DeathEffect {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.particles = [];
        this.startTime = Date.now();
        this.duration = 800;
        this.active = true;
        
        // Create particles
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.active = false;
            return;
        }
        
        // Update particles
        for (let particle of this.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        
        for (let particle of this.particles) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * (1 - progress), 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}