# Horror FPS - Nightmare Asylum 🎮👹

A fully interactive 3D horror first-person shooter game that runs in web browsers using Three.js.

## 🎯 Game Features

- **First-Person Perspective**: WASD movement, mouse look, spacebar jump
- **Weapon System**: 3D gun model with realistic firing mechanics
- **Enemy AI**: Aggressive enemies that hunt the player
- **Horror Atmosphere**: Dark environment with fog, flickering lights, and jump scares
- **Audio System**: Gunfire sounds, enemy death sounds, ambient horror music
- **UI Elements**: Health bar, ammo counter, crosshair, game over screen
- **Performance Optimized**: Runs smoothly in modern web browsers

## 🎮 Controls

- **WASD** - Move around
- **Mouse** - Look around
- **Left Click** - Shoot
- **Space** - Jump
- **ESC** - Unlock cursor

## 📁 File Structure

```
horror-fps/
├── index.html          # Main HTML file
├── game.js             # Core game logic
├── assetLoader.js      # Asset management system
├── assets/
│   ├── models/         # 3D models (gun, etc.)
│   ├── audio/          # Sound effects and music
│   └── textures/       # Images and textures
└── README.md           # This file
```

## 🔧 Setting Up Your Assets

To fully customize the game with your own assets, place the following files in the `assets` folder:

### 1. 3D Gun Model
- **Location**: `assets/models/gun.gltf` (or gun.fbx)
- **Format**: GLTF/GLB (recommended) or FBX
- **Requirements**: Properly scaled and oriented
- **Fallback**: If no model is provided, a placeholder gun will be generated

### 2. Enemy Face Image
- **Location**: `assets/textures/enemy_face.jpg`
- **Format**: JPG, PNG, or GIF
- **Size**: 256x256 pixels recommended
- **Fallback**: If no image is provided, a procedural scary face will be generated

### 3. Audio Files
Place these audio files in the `assets/audio/` folder:

- **Gunfire Sound**: `gunfire.mp3` - Played when shooting
- **Enemy Death Sound**: `enemy_death.mp3` - Played when enemies die
- **Ambient Horror Music**: `ambient_horror.mp3` - Background music (should loop)

**Supported Formats**: MP3, WAV, OGG

## 🚀 How to Run

1. **Local Development**:
   ```bash
   # Use a local web server (required for loading assets)
   python -m http.server 8000
   # or
   npx serve .
   ```

2. **Open in Browser**:
   Navigate to `http://localhost:8000`

3. **Click to Start**:
   Click anywhere on the loading screen to enter the game

## 🌐 Web Hosting

To share your game online, you can host it on:

- **GitHub Pages**: Upload to a GitHub repository and enable Pages
- **Netlify**: Drag and drop the folder to Netlify
- **Vercel**: Deploy directly from GitHub
- **Firebase Hosting**: Use Firebase CLI to deploy

### Example GitHub Pages Setup:
1. Create a new repository on GitHub
2. Upload all game files
3. Go to Settings → Pages
4. Select source branch (usually `main`)
5. Your game will be available at `https://username.github.io/repository-name`

## 🎨 Customization Options

### Modifying Game Settings

You can adjust various game parameters by editing `game.js`:

```javascript
// Health and ammunition
this.maxHealth = 100;
this.maxAmmo = 30;

// Enemy spawn settings
this.enemySpawnRate = 3000; // milliseconds
this.maxEnemies = 15;

// Movement settings
this.moveSpeed = 10;
this.jumpSpeed = 15;

// Weapon settings
this.fireRate = 100; // milliseconds between shots
this.bulletSpeed = 50;
```

### Adding New Asset Types

To add new assets dynamically:

```javascript
// Load a new texture
assetLoader.loadSingleAsset('newTexture', 'path/to/texture.jpg', 'texture');

// Load a new audio file
assetLoader.loadSingleAsset('newSound', 'path/to/sound.mp3', 'audio');

// Load a new 3D model
assetLoader.loadSingleAsset('newModel', 'path/to/model.gltf', 'model');
```

## 🛠️ Technical Requirements

- **Modern Web Browser** with WebGL support
- **JavaScript enabled**
- **Local web server** for development (due to CORS restrictions)

### Browser Compatibility:
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 🎪 Horror Effects

The game includes several atmospheric horror effects:

- **Dynamic Fog**: Density increases with enemy count
- **Flickering Lights**: Randomly fluctuating light intensity
- **Jump Scares**: Enemies can spawn suddenly near the player
- **Procedural Audio**: Random creepy sounds using Web Audio API
- **Camera Shake**: On shooting and taking damage
- **Atmospheric Particles**: Fog particles for immersion

## 🐛 Troubleshooting

### Common Issues:

1. **Assets not loading**:
   - Make sure you're running a local web server
   - Check file paths and names match exactly
   - Check browser console for error messages

2. **No sound**:
   - Browser may require user interaction before playing audio
   - Check audio file formats are supported
   - Ensure volume is turned up

3. **Poor performance**:
   - Reduce max enemies in game.js
   - Lower shadow quality in renderer settings
   - Close other browser tabs

4. **Controls not working**:
   - Click to lock cursor/pointer
   - Check if another application is capturing input

## 📈 Performance Optimization

The game is optimized for web performance:

- **Efficient 3D rendering** with Three.js
- **Shadow mapping** for realistic lighting
- **Frustum culling** for off-screen objects
- **Automatic asset fallbacks** for missing files
- **Optimized particle systems** for atmosphere

## 🎯 Future Enhancements

Potential additions for advanced users:

- **Multiple weapon types**
- **Power-ups and health packs**
- **Multiple levels/environments**
- **Multiplayer support**
- **VR compatibility**
- **Mobile touch controls**

## 📝 License

This project is open-source and available for modification and redistribution. Feel free to customize and share your own horror game variants!

## 🆘 Support

If you encounter any issues or need help customizing the game:

1. Check the browser console for error messages
2. Verify all asset files are in the correct locations
3. Test with a simple local web server
4. Make sure your browser supports WebGL

---

**Ready to enter the nightmare? Load your assets and start the horror! 👻🔫**
