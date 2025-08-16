# Asset Placement Instructions

## 🎯 Place Your Assets Here

This folder is where you should place your custom game assets.

### 📁 Required Asset Structure:

```
assets/
├── models/
│   └── gun.gltf (or gun.fbx)     # Your 3D gun model
├── audio/
│   ├── gunfire.mp3               # Gunshot sound effect
│   ├── enemy_death.mp3           # Enemy death sound
│   └── ambient_horror.mp3        # Background horror music
└── textures/
    └── enemy_face.jpg            # Enemy face image
```

### 🔧 Asset Requirements:

**3D Gun Model:**
- Format: GLTF (.gltf/.glb) preferred, FBX also supported
- Should be properly scaled and oriented
- Recommended size: Small enough for web loading

**Audio Files:**
- Format: MP3, WAV, or OGG
- Gunfire: Short, punchy sound (< 1 second)
- Death sound: Memorable death effect (1-3 seconds)
- Ambient music: Looping horror atmosphere (30+ seconds)

**Enemy Face Texture:**
- Format: JPG, PNG, or GIF
- Size: 256x256 pixels recommended
- Should be a creepy/scary face or character

### 🚀 After Adding Assets:

1. Make sure file names match exactly (case-sensitive)
2. Restart the game server
3. Refresh your browser
4. Your custom assets will be loaded automatically!

### 🛠️ If Assets Don't Load:

The game includes fallback systems:
- Missing gun model → Procedural gun generated
- Missing enemy texture → Procedural scary face created
- Missing audio → Game continues silently

Check the browser console (F12) for any loading errors.
