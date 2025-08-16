// Asset Loader for Horror FPS Game
class AssetLoader {
    constructor() {
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.gltfLoader = new THREE.GLTFLoader(this.loadingManager);
        this.fbxLoader = new THREE.FBXLoader(this.loadingManager);
        this.audioLoader = new THREE.AudioLoader(this.loadingManager);
        
        // Asset paths - Update these when user provides assets
    this.assetPaths = {
            gun: './assets/models/gun.gltf', // User will provide 3D gun model
            enemyFace: './assets/models/enemies.jpg', // Enemy texture
            gunfireSound: './assets/audio/firing.mp3', // Gunfire sound
            enemyDeathSound: './assets/audio/enemy%20dies.mp3', // Enemy death sound (URL encoded)
            reloadSound: './assets/audio/realoding.mp3', // Reload sound
            weaponSwitchSound: './assets/audio/gun%20switch.mp3', // Weapon switch sound (URL encoded)
            ambientMusic: './assets/audio/background%20sound.mp3' // Background music (looped, low volume)
        };
    console.log('Audio/Texture asset paths configured:', this.assetPaths);
        
        this.loadedAssets = {};
        this.loadingCallbacks = [];
        
        this.setupLoadingManager();
    }
    
    setupLoadingManager() {
        this.loadingManager.onLoad = () => {
            console.log('All assets loaded successfully!');
            this.loadingCallbacks.forEach(callback => callback());
        };
        
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal * 100);
            console.log(`Loading progress: ${progress.toFixed(2)}%`);
            this.updateLoadingProgress(progress);
        };
        
        this.loadingManager.onError = (url) => {
            console.warn(`Failed to load asset: ${url}`);
        };
    }
    
    updateLoadingProgress(progress) {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            const progressText = loadingScreen.querySelector('div:first-child');
            if (progressText) {
                progressText.textContent = `Loading Nightmare... ${progress.toFixed(0)}%`;
            }
        }
    }
    
    async loadAllAssets() {
        const promises = [];
        
        // Load gun model
        promises.push(this.loadGunModel());
        
        // Load enemy texture
        promises.push(this.loadEnemyTexture());
        
        // Load audio files
        promises.push(this.loadAudioAssets());
        
        try {
            await Promise.all(promises);
            return this.loadedAssets;
        } catch (error) {
            console.warn('Some assets failed to load:', error);
            return this.loadedAssets;
        }
    }
    
    async loadGunModel() {
        return new Promise((resolve, reject) => {
            // Try to load GLTF first, then FBX as fallback
            this.gltfLoader.load(
                this.assetPaths.gun,
                (gltf) => {
                    this.loadedAssets.gun = gltf.scene;
                    console.log('Gun model loaded successfully');
                    resolve(gltf.scene);
                },
                (progress) => {
                    // Loading progress
                },
                (error) => {
                    console.warn('Failed to load gun model as GLTF, trying alternative formats...');
                    // Try FBX format
                    this.tryLoadGunFBX(resolve, reject);
                }
            );
        });
    }
    
    tryLoadGunFBX(resolve, reject) {
        const fbxPath = this.assetPaths.gun.replace('.gltf', '.fbx');
        this.fbxLoader.load(
            fbxPath,
            (fbx) => {
                this.loadedAssets.gun = fbx;
                console.log('Gun model loaded successfully (FBX)');
                resolve(fbx);
            },
            (progress) => {
                // Loading progress
            },
            (error) => {
                console.warn('Failed to load gun model in any format, using placeholder');
                this.createPlaceholderGun();
                resolve(this.loadedAssets.gun);
            }
        );
    }
    
    createPlaceholderGun() {
        // Create a simple gun placeholder
        const gunGroup = new THREE.Group();
        
        // Gun barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(1, 0, 0);
        gunGroup.add(barrel);
        
        // Gun handle
        const handleGeometry = new THREE.BoxGeometry(0.3, 1, 0.2);
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(-0.2, -0.5, 0);
        gunGroup.add(handle);
        
        // Gun body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.3);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0.2, 0, 0);
        gunGroup.add(body);
        
        gunGroup.scale.set(0.5, 0.5, 0.5);
        gunGroup.position.set(0.5, -0.3, -0.5);
        
        this.loadedAssets.gun = gunGroup;
        console.log('Created placeholder gun model');
    }
    
    async loadEnemyTexture() {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                this.assetPaths.enemyFace,
                (texture) => {
                    this.loadedAssets.enemyTexture = texture;
                    console.log('Enemy texture loaded successfully');
                    resolve(texture);
                },
                (progress) => {
                    // Loading progress
                },
                (error) => {
                    console.warn('Failed to load enemy texture, using placeholder');
                    this.createPlaceholderEnemyTexture();
                    resolve(this.loadedAssets.enemyTexture);
                }
            );
        });
    }
    
    createPlaceholderEnemyTexture() {
        // Create a procedural scary face texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Dark background
        ctx.fillStyle = '#220000';
        ctx.fillRect(0, 0, 256, 256);
        
        // Red eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(80, 100, 15, 0, Math.PI * 2);
        ctx.arc(176, 100, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(128, 150, 30, 0, Math.PI);
        ctx.stroke();
        
        const texture = new THREE.CanvasTexture(canvas);
        this.loadedAssets.enemyTexture = texture;
        console.log('Created placeholder enemy texture');
    }
    
    async loadAudioAssets() {
        const audioPromises = [];
        
        // Load each audio file
        Object.keys(this.assetPaths).forEach(key => {
            if (key.includes('Sound') || key.includes('Music')) {
                audioPromises.push(this.loadAudioFile(key, this.assetPaths[key]));
            }
        });
        
        return Promise.all(audioPromises);
    }
    
    async loadAudioFile(key, path) {
        return new Promise((resolve, reject) => {
            console.log(`Attempting to load audio: ${key} from ${path}`);
            this.audioLoader.load(
                path,
                (buffer) => {
                    this.loadedAssets[key] = buffer;
                    console.log(`Audio ${key} loaded successfully from ${path}`);
                    resolve(buffer);
                },
                (progress) => {
                    // Loading progress
                },
                (error) => {
                    console.warn(`Failed to load audio: ${key} from ${path}`, error);
                    resolve(null); // Don't reject, just resolve with null
                }
            );
        });
    }
    
    getAsset(assetName) {
        return this.loadedAssets[assetName] || null;
    }
    
    onLoadComplete(callback) {
        this.loadingCallbacks.push(callback);
    }
    
    // Method to update asset paths when user provides new files
    updateAssetPaths(newPaths) {
        Object.assign(this.assetPaths, newPaths);
        console.log('Asset paths updated:', this.assetPaths);
    }
    
    // Method to dynamically load a single asset
    async loadSingleAsset(assetName, assetPath, assetType = 'auto') {
        return new Promise((resolve, reject) => {
            switch (assetType) {
                case 'texture':
                    this.textureLoader.load(assetPath, 
                        (texture) => {
                            this.loadedAssets[assetName] = texture;
                            resolve(texture);
                        },
                        null,
                        reject
                    );
                    break;
                    
                case 'audio':
                    this.audioLoader.load(assetPath,
                        (buffer) => {
                            this.loadedAssets[assetName] = buffer;
                            resolve(buffer);
                        },
                        null,
                        reject
                    );
                    break;
                    
                case 'model':
                    this.gltfLoader.load(assetPath,
                        (gltf) => {
                            this.loadedAssets[assetName] = gltf.scene;
                            resolve(gltf.scene);
                        },
                        null,
                        reject
                    );
                    break;
                    
                default:
                    // Auto-detect based on file extension
                    const extension = assetPath.split('.').pop().toLowerCase();
                    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
                        this.loadSingleAsset(assetName, assetPath, 'texture').then(resolve).catch(reject);
                    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
                        this.loadSingleAsset(assetName, assetPath, 'audio').then(resolve).catch(reject);
                    } else if (['gltf', 'glb', 'fbx'].includes(extension)) {
                        this.loadSingleAsset(assetName, assetPath, 'model').then(resolve).catch(reject);
                    } else {
                        reject(new Error('Unsupported file type: ' + extension));
                    }
            }
        });
    }
}

// Export for use in main game
window.AssetLoader = AssetLoader;
