# Endless Siege - Tower Defense Game

A browser-based tower defense game built with HTML5 Canvas and vanilla JavaScript, designed for future integration with Somnia Network.

## 🎮 Game Features

### Core Gameplay
- **Tower Defense Mechanics**: Build and upgrade towers to defend your base
- **Enemy Waves**: Face increasingly difficult waves of enemies
- **Resource Management**: Earn gold by defeating enemies, spend on towers
- **Multiple Tower Types**: Basic, Slow, and AoE towers with unique abilities
- **Enemy Variety**: Basic, Fast, Armored, and Boss enemies with different stats

### Tower Types
1. **Basic Tower** (25 gold)
   - Balanced damage and range
   - Good all-around choice
   - Upgradeable for increased damage and fire rate

2. **Slow Tower** (40 gold)
   - Applies slowing effect to enemies
   - Lower damage but great crowd control
   - Essential against fast enemies

3. **AoE Tower** (60 gold)
   - Explosive projectiles with area damage
   - Effective against grouped enemies
   - Higher cost but devastating impact

### Enemy Types
1. **Basic Enemies**: Standard health and speed
2. **Fast Enemies**: Low health but high speed
3. **Armored Enemies**: High health but slow
4. **Boss Enemies**: Massive health, appears every 5th wave

## 🚀 Getting Started

### Prerequisites
- Modern web browser with HTML5 Canvas support
- No additional installations required

### How to Play
1. Open `index.html` in your web browser
2. Click "Start Wave" to begin
3. Select tower types from the right panel
4. Click on the game field to place towers
5. Towers automatically target and shoot enemies
6. Earn gold by defeating enemies
7. Upgrade towers by selecting them and pressing 'U'

### Controls
- **Mouse**: Select towers, place towers, interact with UI
- **1, 2, 3**: Quick-select tower types
- **Space**: Start next wave or pause/resume
- **G**: Toggle grid display
- **U**: Upgrade selected tower
- **ESC**: Cancel tower placement
- **Right-click**: Sell tower (70% refund)

## 🏗️ Project Structure

```
/
├── index.html              # Main game page
├── css/
│   └── style.css          # Game styling and responsive design
├── js/
│   ├── game.js            # Main game engine and loop
│   ├── entities/
│   │   ├── enemy.js       # Enemy class with movement and types
│   │   ├── tower.js       # Tower class with targeting and shooting
│   │   └── projectile.js  # Projectile class with collision detection
│   ├── systems/
│   │   ├── gridSystem.js  # Grid-based tower placement system
│   │   ├── waveManager.js # Wave spawning and progression
│   │   └── resourceManager.js # Gold, lives, and scoring system
│   └── ui/
│       └── gameUI.js      # User interface management
├── assets/                # Future: images and sounds
└── README.md              # This file
```

## 🛠️ Technical Implementation

### Architecture
- **Modular Design**: Each system is self-contained and easily extensible
- **Entity-Component Pattern**: Clear separation of game objects and logic
- **Canvas Rendering**: Smooth 60fps gameplay with efficient rendering
- **Event-Driven UI**: Responsive interface with keyboard and mouse support

### Key Systems

#### Grid System
- 40x40 pixel grid for precise tower placement
- Pathfinding for enemy movement
- Collision detection for valid placement

#### Wave Management
- Procedurally generated waves with increasing difficulty
- Balanced enemy composition based on wave number
- Configurable spawn timing and enemy types

#### Resource Management
- Gold economy with enemy rewards
- Life system with base defense
- Statistics tracking for performance analysis

#### Combat System
- Real-time targeting and projectile physics
- Special effects (slowing, area damage)
- Damage calculation and enemy health management

## 🎯 Future Somnia Network Integration

This game is designed with blockchain integration in mind:

### Planned Features
- **NFT Towers**: Unique towers with special abilities
- **Token Rewards**: Earn tokens based on performance
- **Leaderboards**: Global scoring with blockchain verification
- **Player vs Player**: Competitive tower defense modes
- **Asset Marketplace**: Trade towers and upgrades

### Architecture Considerations
- Modular resource system ready for token integration
- Event-driven design for blockchain transaction triggers
- Save/load system compatible with decentralized storage
- Statistics tracking for reward calculations

## 🔧 Development

### Adding New Features
The modular architecture makes it easy to extend:

1. **New Enemy Types**: Add to `enemy.js` and update wave patterns
2. **New Tower Types**: Extend `tower.js` and add UI buttons
3. **New Mechanics**: Create new systems in the `systems/` folder
4. **Visual Effects**: Enhance rendering in entity classes

### Performance Optimization
- Efficient entity cleanup prevents memory leaks
- Object pooling can be added for high-frequency objects
- Canvas optimization techniques for smooth rendering

## 📱 Browser Compatibility

- **Chrome**: Fully supported
- **Firefox**: Fully supported  
- **Safari**: Fully supported
- **Edge**: Fully supported
- **Mobile**: Responsive design works on mobile devices

## 🐛 Known Issues

- Audio system not yet implemented
- Visual effects could be enhanced
- Save/load functionality is prepared but not fully implemented

## 🤝 Contributing

This project is designed for future blockchain integration. Current focus areas:
- Performance optimization
- Visual enhancements  
- Additional game mechanics
- Mobile experience improvements

## 📄 License

This project is part of the Somnia Network ecosystem and follows their licensing terms.

---

**Ready to defend your base? Open `index.html` and start playing!**