// Horror FPS Game - Main Game Logic
class HorrorFPS {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.assetLoader = new AssetLoader();
        
        // Game state
        this.gameStarted = false;
        this.gameOver = false;
        this.health = 100;
        this.maxHealth = 100;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.score = 0;
        
        // Player movement
        this.moveSpeed = 10;
        this.jumpSpeed = 15;
        this.velocity = new THREE.Vector3();
        this.isGrounded = false;
        this.canJump = true;
        
        // Weapons
        this.gun = null;
        this.muzzleFlash = null;
        this.lastShotTime = 0;
        this.fireRate = 50; // milliseconds between shots (faster firing)
        
        // Weapon System
        this.currentWeapon = 1;
        this.weapons = {
            1: { name: "Pistol", fireRate: 200, damage: 25, ammo: 15, maxAmmo: 15, bulletColor: 0xffffff, bulletCount: 1, spread: 0 },
            2: { name: "Shotgun", fireRate: 800, damage: 80, ammo: 8, maxAmmo: 8, bulletColor: 0xff8800, bulletCount: 5, spread: 0.3 },
            3: { name: "Assault Rifle", fireRate: 100, damage: 35, ammo: 30, maxAmmo: 30, bulletColor: 0xffff00, bulletCount: 1, spread: 0.1 },
            4: { name: "Plasma Gun", fireRate: 1500, damage: 150, ammo: 5, maxAmmo: 5, bulletColor: 0x00ffff, bulletCount: 1, spread: 0 }
        };
        
        // Pickups
        this.pickups = [];
        
        // Enemies
        this.enemies = [];
        this.enemySpawnRate = 3000; // milliseconds between spawns
        this.lastEnemySpawn = 0;
        this.maxEnemies = 15;
        
        // Environment
        this.environment = null;
        this.fog = null;
        this.lights = [];
        
        // Audio
        this.audioLoader = new THREE.AudioLoader();
        this.listener = new THREE.AudioListener();
        this.sounds = {
            gunfire: null,
            enemyDeath: null,
            ambient: null,
            reload: null,
            weaponSwitch: null,
            playerHurt: null,
            enemyGrowl: null
        };
        
        // Input handling
        this.keys = {};
        this.mousePressed = false;
        
        // Raycaster for shooting
        this.raycaster = new THREE.Raycaster();
        
        // Bullets
        this.bullets = [];
        this.bulletSpeed = 50;
        
        // Horror atmosphere
        this.horrorEffects = {
            jumpScareTimer: 0,
            lastJumpScare: 0,
            flickerIntensity: 1,
            fogDensity: 0.02
        };
        
    // Keep references to transient one-shot sounds to avoid GC stopping playback
    this.activeOneShots = [];
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLighting();
        this.setupEnvironment();
        this.setupEventListeners();
        this.setupUI();
        
        // Load assets before starting
        this.loadGameAssets();
    }
    
    async loadGameAssets() {
        try {
            console.log('Loading game assets...');
            
            // Start loading assets but don't wait for them to complete
            this.assetLoader.loadAllAssets().then(() => {
                console.log('All assets loaded successfully!');
                this.setupAudio();
                this.setupGun();
                // Start ambient if the game already started and ambient is ready
                if (this.gameStarted && this.sounds.ambient) {
                    try { this.sounds.ambient.play(); } catch(e) { console.warn('Ambient play (post-load) failed:', e); }
                }
            }).catch((error) => {
                console.warn('Some assets failed to load, continuing with placeholders:', error);
                this.setupAudio();
                this.setupGun();
            });
            
            // Show the game immediately with loading screen
            setTimeout(() => {
                console.log('Making game interactive...');
                document.getElementById('loadingScreen').querySelector('div:last-child').textContent = 'Click anywhere to enter the asylum';
                document.getElementById('loadingScreen').style.cursor = 'pointer';
            }, 2000);
            
        } catch (error) {
            console.error('Failed to initialize asset loading:', error);
        }
        
        // Start the game loop immediately
        this.animate();
    }
    
    setupGun() {
        const gunModel = this.assetLoader.getAsset('gun');
        if (gunModel) {
            this.gun = gunModel.clone();
            this.gun.scale.set(0.3, 0.3, 0.3);
            this.gun.position.set(0.5, -0.3, -0.5);
            this.gun.rotation.y = Math.PI;
            this.camera.add(this.gun);
            console.log('Gun model attached to camera');
        }
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        // Bright daylight sky color
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        // Light fog for distant atmosphere
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 0);
        this.camera.add(this.listener);
    }
    
    setupRenderer() {
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }
    
    setupControls() {
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        this.scene.add(this.controls.getObject());
        
        // Add pointer lock functionality with better error handling
        const canvas = document.getElementById('gameCanvas');
        const loadingScreen = document.getElementById('loadingScreen');
        
        const handleClick = () => {
            console.log('Click detected!');
            
            // Hide loading screen first
            if (loadingScreen.style.display !== 'none') {
                loadingScreen.style.display = 'none';
                console.log('Loading screen hidden');
            }
            
            // Start game if not started
            if (!this.gameStarted) {
                console.log('Starting game...');
                this.startGame();
            }
            
            // Request pointer lock
            if (this.controls.isLocked === false) {
                console.log('Requesting pointer lock...');
                this.controls.lock();
            }
        };
        
        // Add click listeners to multiple elements
        document.addEventListener('click', handleClick);
        canvas.addEventListener('click', handleClick);
        loadingScreen.addEventListener('click', handleClick);
        
        this.controls.addEventListener('lock', () => {
            console.log('Pointer locked successfully');
            document.getElementById('instructions').style.display = 'none';
            document.body.style.cursor = 'none';
        });
        
        this.controls.addEventListener('unlock', () => {
            console.log('Pointer unlocked');
            document.body.style.cursor = 'default';
            if (this.gameStarted && !this.gameOver) {
                document.getElementById('instructions').style.display = 'block';
            }
        });
    }
    
    setupLighting() {
        // Bright ambient light for daylight
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Sun light (directional light)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);
        
        // Additional fill light to reduce shadows
        const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
        fillLight.position.set(-50, 50, -50);
        this.scene.add(fillLight);
    }
    
    
    setupEnvironment() {
        // Create grass ground
        const groundGeometry = new THREE.PlaneGeometry(300, 300);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22 // Forest green
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create city environment with houses and trees
        this.createCityEnvironment();
        
        // Add roads
        this.createRoads();
        
        // Add trees
        this.createTrees();
    }
    
    createCityEnvironment() {
        // Create houses
        const houseMaterials = [
            new THREE.MeshLambertMaterial({ color: 0xDC143C }), // Crimson
            new THREE.MeshLambertMaterial({ color: 0x4682B4 }), // Steel blue
            new THREE.MeshLambertMaterial({ color: 0xDAA520 }), // Goldenrod
            new THREE.MeshLambertMaterial({ color: 0x8B4513 }), // Saddle brown
            new THREE.MeshLambertMaterial({ color: 0x2E8B57 })  // Sea green
        ];
        
        // Create residential houses
        for (let i = 0; i < 25; i++) {
            const houseWidth = 8 + Math.random() * 4;
            const houseHeight = 6 + Math.random() * 4;
            const houseDepth = 8 + Math.random() * 4;
            
            // House body
            const houseGeometry = new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth);
            const houseMaterial = houseMaterials[Math.floor(Math.random() * houseMaterials.length)];
            const house = new THREE.Mesh(houseGeometry, houseMaterial);
            
            // Position houses in a grid-like pattern with some randomness
            const gridX = (i % 5) * 25 - 50;
            const gridZ = Math.floor(i / 5) * 25 - 50;
            house.position.set(
                gridX + (Math.random() - 0.5) * 8,
                houseHeight / 2,
                gridZ + (Math.random() - 0.5) * 8
            );
            
            house.castShadow = true;
            house.receiveShadow = true;
            this.scene.add(house);
            
            // Create roof
            const roofGeometry = new THREE.ConeGeometry(Math.max(houseWidth, houseDepth) * 0.7, 3, 4);
            const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown roof
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(house.position.x, house.position.y + houseHeight / 2 + 1.5, house.position.z);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            this.scene.add(roof);
            
            // Add windows
            const windowGeometry = new THREE.BoxGeometry(1, 1.5, 0.1);
            const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB }); // Light blue windows
            
            for (let w = 0; w < 2; w++) {
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(
                    house.position.x + (w === 0 ? -houseWidth/3 : houseWidth/3),
                    house.position.y + 1,
                    house.position.z + houseDepth/2 + 0.05
                );
                this.scene.add(window);
            }
        }
        
        // Create some taller buildings
        for (let i = 0; i < 8; i++) {
            const buildingWidth = 12 + Math.random() * 8;
            const buildingHeight = 15 + Math.random() * 10;
            const buildingDepth = 12 + Math.random() * 8;
            
            const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
            const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 }); // Gray buildings
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            
            building.position.set(
                (Math.random() - 0.5) * 200,
                buildingHeight / 2,
                (Math.random() - 0.5) * 200
            );
            
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);
        }
    }
    
    createRoads() {
        // Create main roads
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F }); // Dark slate gray
        
        // Horizontal road
        const roadH = new THREE.Mesh(new THREE.PlaneGeometry(300, 8), roadMaterial);
        roadH.rotation.x = -Math.PI / 2;
        roadH.position.y = 0.01; // Slightly above ground
        this.scene.add(roadH);
        
        // Vertical road
        const roadV = new THREE.Mesh(new THREE.PlaneGeometry(8, 300), roadMaterial);
        roadV.rotation.x = -Math.PI / 2;
        roadV.position.y = 0.01;
        this.scene.add(roadV);
        
        // Road markings
        const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // White
        
        // Horizontal road lines
        for (let i = -140; i <= 140; i += 20) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.5), lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(i, 0.02, 0);
            this.scene.add(line);
        }
        
        // Vertical road lines
        for (let i = -140; i <= 140; i += 20) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 10), lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.02, i);
            this.scene.add(line);
        }
    }
    
    createTrees() {
        // Create trees around the environment
        for (let i = 0; i < 50; i++) {
            // Tree trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 6);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            
            // Tree leaves
            const leavesGeometry = new THREE.SphereGeometry(4, 8, 8);
            const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            
            // Position trees randomly but avoid roads and houses
            let x, z;
            do {
                x = (Math.random() - 0.5) * 280;
                z = (Math.random() - 0.5) * 280;
            } while ((Math.abs(x) < 15 && Math.abs(z) < 15) || // Avoid center intersection
                     (Math.abs(x) < 4) || Math.abs(z) < 4); // Avoid roads
            
            trunk.position.set(x, 3, z);
            leaves.position.set(x, 8, z);
            
            trunk.castShadow = true;
            leaves.castShadow = true;
            leaves.receiveShadow = true;
            
            this.scene.add(trunk);
            this.scene.add(leaves);
        }
    }
    
    setupAudio() {
        console.log('Setting up audio...');
        // Ensure listener is attached to camera
        if (!this.camera.children.includes(this.listener)) {
            this.camera.add(this.listener);
            console.log('Audio listener attached to camera');
        }
        // Setup audio with loaded assets
        const gunshotBuffer = this.assetLoader.getAsset('gunfireSound');
        if (gunshotBuffer) {
            this.sounds.gunfire = new THREE.Audio(this.listener);
            this.sounds.gunfire.setBuffer(gunshotBuffer);
            this.sounds.gunfire.setVolume(0.8);
            console.log('Gunfire sound setup complete');
        } else {
            console.warn('Gunfire sound buffer not found');
        }
        
        const deathBuffer = this.assetLoader.getAsset('enemyDeathSound');
        if (deathBuffer) {
            this.sounds.enemyDeath = new THREE.Audio(this.listener);
            this.sounds.enemyDeath.setBuffer(deathBuffer);
            this.sounds.enemyDeath.setVolume(0.8); // Increased volume for better audibility
            console.log('Enemy death sound setup complete');
        } else {
            console.warn('Enemy death sound buffer not found');
        }
        
        const reloadBuffer = this.assetLoader.getAsset('reloadSound');
        if (reloadBuffer) {
            this.sounds.reload = new THREE.Audio(this.listener);
            this.sounds.reload.setBuffer(reloadBuffer);
            this.sounds.reload.setVolume(0.7);
            console.log('Reload sound setup complete');
        } else {
            console.warn('Reload sound buffer not found');
        }
        
        const weaponSwitchBuffer = this.assetLoader.getAsset('weaponSwitchSound');
        if (weaponSwitchBuffer) {
            this.sounds.weaponSwitch = new THREE.Audio(this.listener);
            this.sounds.weaponSwitch.setBuffer(weaponSwitchBuffer);
            this.sounds.weaponSwitch.setVolume(0.5);
            console.log('Weapon switch sound setup complete');
        } else {
            console.warn('Weapon switch sound buffer not found');
        }
        
        const ambientBuffer = this.assetLoader.getAsset('ambientMusic');
        if (ambientBuffer) {
            this.sounds.ambient = new THREE.Audio(this.listener);
            this.sounds.ambient.setBuffer(ambientBuffer);
            this.sounds.ambient.setLoop(true);
            this.sounds.ambient.setVolume(0.15); // lower volume per your request
            console.log('Ambient music setup complete');
            // If game already started, begin playback immediately
            if (this.gameStarted) {
                try { this.sounds.ambient.play(); } catch(e) { console.warn('Ambient play failed:', e); }
            }
        } else {
            console.warn('Ambient music buffer not found');
        }
        
        // Setup procedural horror sounds
        this.setupProceduralAudio();
    }

    // Play a one-shot non-positional sound safely with overlap support
    playOneShot(buffer, volume = 0.8, maxLifeMs = 3000) {
        try {
            if (!buffer) return;
            const audio = new THREE.Audio(this.listener);
            audio.setBuffer(buffer);
            audio.setVolume(volume);
            audio.play();
            this.activeOneShots.push(audio);
            // Cleanup after a short while to avoid memory growth
            setTimeout(() => {
                const idx = this.activeOneShots.indexOf(audio);
                if (idx !== -1) this.activeOneShots.splice(idx, 1);
                try { audio.stop(); } catch (_) {}
            }, maxLifeMs);
        } catch (e) {
            console.warn('playOneShot failed:', e);
        }
    }
    
    setupProceduralAudio() {
        // Create procedural horror atmosphere sounds
        this.createHorrorAmbience();
    }
    
    createHorrorAmbience() {
        // Create eerie wind sound using Web Audio API
        const audioContext = THREE.AudioContext.getContext();
        if (audioContext) {
            const windNoise = this.createWindNoise(audioContext);
            const windSound = new THREE.Audio(this.listener);
            windSound.setNodeSource(windNoise);
            windSound.setVolume(0.2);
            windSound.play();
        }
    }
    
    createWindNoise(audioContext) {
        const bufferSize = audioContext.sampleRate * 2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.1;
        }
        
        const whiteNoise = audioContext.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;
        
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioContext.currentTime);
        
        whiteNoise.connect(filter);
        whiteNoise.start();
        
        return filter;
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Mouse events
        document.addEventListener('mousedown', (event) => this.onMouseDown(event));
        document.addEventListener('mouseup', (event) => this.onMouseUp(event));
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Game restart
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
    }
    
    setupUI() {
        this.updateHealthBar();
        this.updateAmmoCount();
    }
    
    onKeyDown(event) {
        if (!this.gameStarted || this.gameOver) return;
        
        this.keys[event.code] = true;
        
        if (event.code === 'Space') {
            event.preventDefault();
            this.jump();
        }
        
        // Weapon switching
        if (event.code === 'Digit1') this.switchWeapon(1);
        if (event.code === 'Digit2') this.switchWeapon(2);
        if (event.code === 'Digit3') this.switchWeapon(3);
        if (event.code === 'Digit4') this.switchWeapon(4);
        
        // Reload
        if (event.code === 'KeyR') this.reload();
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    onMouseDown(event) {
        if (!this.gameStarted || this.gameOver) return;
        
        if (event.button === 0) { // Left mouse button
            this.mousePressed = true;
            this.shoot();
        }
    }
    
    onMouseUp(event) {
        if (event.button === 0) {
            this.mousePressed = false;
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    startGame() {
        if (this.gameStarted) {
            console.log('Game already started, ignoring start request');
            return;
        }
        
        console.log('Starting game - spawning enemies and setting up audio...');
        this.gameStarted = true;
        
        // Resume audio context for modern browsers
        const audioContext = THREE.AudioContext.getContext();
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Audio context resumed');
            });
        }
        
        // Test audio capabilities
        console.log('Audio Context State:', audioContext ? audioContext.state : 'null');
        console.log('Available sounds:', Object.keys(this.sounds).filter(key => this.sounds[key] !== null));
        
        this.spawnInitialEnemies();
        
        // Start ambient music
        if (this.sounds.ambient) {
            console.log('Playing ambient music...');
            this.sounds.ambient.play();
        } else {
            console.log('No ambient music loaded');
        }
        
        // Hide loading screen
        document.getElementById('loadingScreen').style.display = 'none';
        
        console.log('Game started successfully! Welcome to the nightmare...');
    }
    
    restartGame() {
        // Reset game state
        this.gameOver = false;
        this.health = this.maxHealth;
        this.ammo = this.maxAmmo;
        this.score = 0;
        
        // Clear enemies
        this.enemies.forEach(enemy => {
            this.scene.remove(enemy.mesh);
        });
        this.enemies = [];
        
        // Clear bullets
        this.bullets.forEach(bullet => {
            this.scene.remove(bullet.mesh);
        });
        this.bullets = [];
        
        // Reset camera position
        this.controls.getObject().position.set(0, 5, 0);
        
        // Update UI
        this.updateHealthBar();
        this.updateAmmoCount();
        document.getElementById('gameOver').style.display = 'none';
        
        // Restart enemy spawning
        this.spawnInitialEnemies();
    }
    
    jump() {
        if (this.isGrounded && this.canJump) {
            this.velocity.y = this.jumpSpeed;
            this.canJump = false;
            setTimeout(() => { this.canJump = true; }, 500);
        }
    }
    
    shoot() {
        const weapon = this.weapons[this.currentWeapon];
        const currentTime = Date.now();
        
        if (currentTime - this.lastShotTime < weapon.fireRate || weapon.ammo <= 0) {
            return;
        }
        
        this.lastShotTime = currentTime;
        weapon.ammo--;
        this.updateAmmoCount();
        
        // Create muzzle flash effect
        this.createMuzzleFlash();
        
        // Create bullets based on weapon type
        for (let i = 0; i < weapon.bulletCount; i++) {
            this.createBullet(weapon);
        }
        
        // Play gunfire sound (when provided by user)
        this.playGunshotSound();
        
        // Camera shake effect
        this.cameraShake();
    }
    
    createMuzzleFlash() {
        const flashElement = document.createElement('div');
        flashElement.className = 'muzzleFlash';
        document.getElementById('ui').appendChild(flashElement);
        
        setTimeout(() => {
            if (flashElement.parentNode) {
                flashElement.parentNode.removeChild(flashElement);
            }
        }, 100);
    }
    
    createBullet(weapon) {
        const bulletGeometry = new THREE.SphereGeometry(0.15);
        const bulletMaterial = new THREE.MeshBasicMaterial({ 
            color: weapon.bulletColor,
            transparent: true,
            opacity: 0.8
        });
        const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        // Position bullet at camera position
        bulletMesh.position.copy(this.camera.position);
        
        // Set bullet direction with spread
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Add spread for shotguns
        if (weapon.spread > 0) {
            direction.x += (Math.random() - 0.5) * weapon.spread;
            direction.y += (Math.random() - 0.5) * weapon.spread;
            direction.z += (Math.random() - 0.5) * weapon.spread;
            direction.normalize();
        }
        
        const bullet = {
            mesh: bulletMesh,
            direction: direction.clone(),
            speed: this.bulletSpeed,
            life: 100, // frames
            damage: weapon.damage
        };
        
        this.bullets.push(bullet);
        this.scene.add(bulletMesh);
    }
    
    playGunshotSound() {
        console.log('Attempting to play gunshot sound');
        const buffer = this.assetLoader.getAsset('gunfireSound');
        if (buffer) {
            this.playOneShot(buffer, 0.8, 2000);
            console.log('Gunshot sound played');
        } else {
            console.warn('Gunfire sound not available, using procedural sound');
            this.createProceduralGunshot();
        }
    }
    
    createProceduralGunshot() {
        const audioContext = THREE.AudioContext.getContext();
        if (!audioContext) return;
        
        // Create a quick gunshot sound using oscillators
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Quick pop sound
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    cameraShake() {
        const originalPosition = this.camera.position.clone();
        const shakeIntensity = 0.1;
        const shakeDuration = 100;
        
        const shake = () => {
            this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity;
            this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity;
            this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeIntensity;
        };
        
        const shakeInterval = setInterval(shake, 16);
        setTimeout(() => {
            clearInterval(shakeInterval);
            this.camera.position.copy(originalPosition);
        }, shakeDuration);
    }
    
    switchWeapon(weaponNumber) {
        if (this.weapons[weaponNumber]) {
            this.currentWeapon = weaponNumber;
            this.updateAmmoCount();
            console.log(`Switched to ${this.weapons[weaponNumber].name}`);
            
            // Play weapon switch sound
            const switchBuffer = this.assetLoader.getAsset('weaponSwitchSound');
            if (switchBuffer) {
                const switchSound = new THREE.Audio(this.listener);
                switchSound.setBuffer(switchBuffer);
                switchSound.setVolume(0.6);
                switchSound.play();
            }
        }
    }
    
    reload() {
        const weapon = this.weapons[this.currentWeapon];
        if (weapon.ammo < weapon.maxAmmo) {
            weapon.ammo = weapon.maxAmmo;
            this.updateAmmoCount();
            console.log(`${weapon.name} reloaded!`);
            
            // Play reload sound
            const reloadBuffer = this.assetLoader.getAsset('reloadSound');
            if (reloadBuffer) {
                const reloadSound = new THREE.Audio(this.listener);
                reloadSound.setBuffer(reloadBuffer);
                reloadSound.setVolume(0.7);
                reloadSound.play();
            }
        }
    }
    
    createPickup(type, position) {
        const pickupGeometry = new THREE.BoxGeometry(1, 1, 1);
        let pickupMaterial;
        let pickupType;
        
        if (type === 'health') {
            pickupMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Red for health
            pickupType = 'health';
        } else {
            pickupMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 }); // Green for ammo
            pickupType = 'ammo';
        }
        
        const pickupMesh = new THREE.Mesh(pickupGeometry, pickupMaterial);
        pickupMesh.position.copy(position);
        pickupMesh.position.y = 1;
        
        // Add rotation animation
        const pickup = {
            mesh: pickupMesh,
            type: pickupType,
            rotationSpeed: 0.02
        };
        
        this.pickups.push(pickup);
        this.scene.add(pickupMesh);
    }
    
    checkPickupCollisions() {
        const playerPosition = this.controls.getObject().position;
        
        this.pickups.forEach((pickup, index) => {
            const distance = pickup.mesh.position.distanceTo(playerPosition);
            if (distance < 3) {
                // Collect pickup
                if (pickup.type === 'health') {
                    this.health = Math.min(this.maxHealth, this.health + 25);
                    this.updateHealthBar();
                    console.log('Health restored!');
                } else if (pickup.type === 'ammo') {
                    const weapon = this.weapons[this.currentWeapon];
                    weapon.ammo = weapon.maxAmmo;
                    this.updateAmmoCount();
                    console.log('Ammo refilled!');
                }
                
                // Remove pickup
                this.scene.remove(pickup.mesh);
                this.pickups.splice(index, 1);
            }
        });
    }
    
    updatePickups(deltaTime) {
        // Rotate pickups for visual effect
        this.pickups.forEach(pickup => {
            pickup.mesh.rotation.y += pickup.rotationSpeed;
        });
        
        // Check collisions
        this.checkPickupCollisions();
    }
    
    spawnInitialEnemies() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.spawnEnemy();
            }, i * 1000);
        }
    }
    
    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;
        
        // Create enemy geometry
        const enemyGeometry = new THREE.BoxGeometry(2, 4, 1);
        const enemyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x660000,
            transparent: true,
            opacity: 0.8
        });
        
        const enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
        
        // Random spawn position (away from player)
        const spawnDistance = 30 + Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        const spawnX = Math.cos(angle) * spawnDistance;
        const spawnZ = Math.sin(angle) * spawnDistance;
        
        enemyMesh.position.set(spawnX, 2, spawnZ);
        enemyMesh.castShadow = true;
        
        const enemy = {
            mesh: enemyMesh,
            health: 100,
            speed: 2 + Math.random(),
            damage: 10,
            lastAttack: 0,
            attackRate: 1000,
            isDead: false
        };
        
        this.enemies.push(enemy);
        this.scene.add(enemyMesh);
        
        // Add enemy texture when user provides image
        this.applyEnemyTexture(enemy);
    }
    
    applyEnemyTexture(enemy) {
        const enemyTexture = this.assetLoader.getAsset('enemyTexture');
        if (enemyTexture) {
            const faceMaterial = new THREE.MeshLambertMaterial({ 
                map: enemyTexture,
                transparent: true,
                opacity: 0.9
            });
            
            // Apply texture to the front face
            const materials = [
                enemy.mesh.material, // right
                enemy.mesh.material, // left
                enemy.mesh.material, // top
                enemy.mesh.material, // bottom
                faceMaterial,        // front (face)
                enemy.mesh.material  // back
            ];
            
            enemy.mesh.material = materials;
        }
    }
    
    updateEnemies(deltaTime) {
        const playerPosition = this.controls.getObject().position;
        
        this.enemies.forEach((enemy, index) => {
            if (enemy.isDead) return;
            
            // Move enemy towards player
            const direction = new THREE.Vector3()
                .subVectors(playerPosition, enemy.mesh.position)
                .normalize();
            
            enemy.mesh.position.addScaledVector(direction, enemy.speed * deltaTime);
            
            // Rotate enemy to face player
            enemy.mesh.lookAt(playerPosition);
            
            // Check if enemy is close enough to attack
            const distance = enemy.mesh.position.distanceTo(playerPosition);
            if (distance < 3) {
                this.enemyAttack(enemy);
            }
        });
        
        // Spawn new enemies periodically
        const currentTime = Date.now();
        if (currentTime - this.lastEnemySpawn > this.enemySpawnRate) {
            this.spawnEnemy();
            this.lastEnemySpawn = currentTime;
        }
    }
    
    enemyAttack(enemy) {
        const currentTime = Date.now();
        if (currentTime - enemy.lastAttack < enemy.attackRate) return;
        
        enemy.lastAttack = currentTime;
        this.takeDamage(enemy.damage);
        
        // Visual attack effect
        this.createDamageEffect();
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.gameOver = true;
            this.showGameOver();
        }
        
        // Red flash effect
        this.damageFlash();
    }
    
    damageFlash() {
        document.body.style.background = 'rgba(255, 0, 0, 0.3)';
        setTimeout(() => {
            document.body.style.background = '#000';
        }, 200);
    }
    
    createDamageEffect() {
        // Screen shake when taking damage
        this.cameraShake();
    }
    
    showGameOver() {
        document.getElementById('gameOver').style.display = 'flex';
        this.controls.unlock();
    }
    
    updateBullets(deltaTime) {
        this.bullets.forEach((bullet, bulletIndex) => {
            // Move bullet
            bullet.mesh.position.addScaledVector(bullet.direction, bullet.speed * deltaTime);
            bullet.life--;
            
            // Check collision with enemies
            this.enemies.forEach((enemy, enemyIndex) => {
                if (enemy.isDead) return;
                
                const distance = bullet.mesh.position.distanceTo(enemy.mesh.position);
                if (distance < 2) {
                    // Hit enemy with bullet damage
                    this.hitEnemy(enemy, enemyIndex, bullet.damage);
                    
                    // Remove bullet
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(bulletIndex, 1);
                }
            });
            
            // Remove bullet if life expired
            if (bullet.life <= 0) {
                this.scene.remove(bullet.mesh);
                this.bullets.splice(bulletIndex, 1);
            }
        });
    }
    
    hitEnemy(enemy, index, damage) {
        enemy.health -= damage;
        
        if (enemy.health <= 0) {
            this.killEnemy(enemy, index);
        }
    }
    
    killEnemy(enemy, index) {
        enemy.isDead = true;
        this.score += 100;
        
        // Create pickups with chance
        if (Math.random() < 0.4) { // 40% chance for health
            this.createPickup('health', enemy.mesh.position);
        } else if (Math.random() < 0.6) { // 60% chance for ammo
            this.createPickup('ammo', enemy.mesh.position);
        }
        
        // Death animation
        this.enemyDeathAnimation(enemy, () => {
            this.scene.remove(enemy.mesh);
            this.enemies.splice(index, 1);
        });
        
        // Play death sound (when provided by user)
        this.playEnemyDeathSound();
    }
    
    enemyDeathAnimation(enemy, callback) {
        const startY = enemy.mesh.position.y;
        const animationDuration = 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / animationDuration;
            
            if (progress < 1) {
                // Falling animation
                enemy.mesh.position.y = startY - (progress * startY);
                enemy.mesh.rotation.x = progress * Math.PI / 2;
                enemy.mesh.material.opacity = 1 - progress;
                
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        };
        
        animate();
    }
    
    playEnemyDeathSound() {
        console.log('Attempting to play enemy death sound');
        const buffer = this.assetLoader.getAsset('enemyDeathSound');
        if (buffer) {
            this.playOneShot(buffer, 0.85, 3000);
            console.log('Enemy death sound played');
        } else {
            console.warn('Enemy death sound not available, using procedural sound');
            this.createProceduralDeathSound();
        }
    }
    
    createProceduralDeathSound() {
        const audioContext = THREE.AudioContext.getContext();
        if (!audioContext) return;
        
        // Create a death scream sound using oscillators
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Descending scream sound
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    updateMovement(deltaTime) {
        if (!this.gameStarted || this.gameOver) return;
        
        const direction = new THREE.Vector3();
        
        if (this.keys['KeyW']) direction.z -= 1;
        if (this.keys['KeyS']) direction.z += 1;
        if (this.keys['KeyA']) direction.x -= 1;
        if (this.keys['KeyD']) direction.x += 1;
        
        direction.normalize();
        
        if (direction.length() > 0) {
            // Apply movement relative to camera direction
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();
            
            const right = new THREE.Vector3();
            right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
            
            const moveVector = new THREE.Vector3();
            moveVector.addScaledVector(forward, -direction.z);
            moveVector.addScaledVector(right, direction.x);
            
            this.controls.getObject().position.addScaledVector(moveVector, this.moveSpeed * deltaTime);
        }
        
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y -= 30 * deltaTime; // gravity
        }
        
        this.controls.getObject().position.y += this.velocity.y * deltaTime;
        
        // Ground collision
        if (this.controls.getObject().position.y <= 5) {
            this.controls.getObject().position.y = 5;
            this.velocity.y = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
    }
    
    
    updateHealthBar() {
        const healthPercentage = (this.health / this.maxHealth) * 100;
        document.getElementById('healthFill').style.width = healthPercentage + '%';
    }
    
    updateAmmoCount() {
        const weapon = this.weapons[this.currentWeapon];
        document.getElementById('ammoCount').textContent = `${weapon.name}: ${weapon.ammo}/${weapon.maxAmmo}`;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        if (this.gameStarted && !this.gameOver) {
            this.updateMovement(deltaTime);
            this.updateEnemies(deltaTime);
            this.updateBullets(deltaTime);
            this.updatePickups(deltaTime);
            this.updateHorrorEffects(deltaTime);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateHorrorEffects(deltaTime) {
        const currentTime = Date.now();
        
        // Random enemy spawns (less frequent than jump scares)
        this.horrorEffects.jumpScareTimer += deltaTime * 1000;
        if (this.horrorEffects.jumpScareTimer > 20000 && // Every 20 seconds minimum
            currentTime - this.horrorEffects.lastJumpScare > 45000 && // 45 second cooldown
            Math.random() < 0.05) { // 5% chance per check (reduced from 10%)
            
            this.triggerJumpScare();
            this.horrorEffects.lastJumpScare = currentTime;
            this.horrorEffects.jumpScareTimer = 0;
        }
        
        // Keep fog light and distant
        const baseFogIntensity = 0.005; // Much lighter base fog
        const fogIntensity = baseFogIntensity + (this.enemies.length * 0.001);
        if (this.scene.fog.density !== undefined) {
            this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, fogIntensity, deltaTime);
        }
    }
    
    triggerJumpScare() {
        console.log('JUMP SCARE!');
        
        // Screen flash
        document.body.style.background = 'rgba(255, 255, 255, 1)';
        setTimeout(() => {
            document.body.style.background = '#000';
        }, 50);
        
        // Spawn enemy very close to player
        const playerPos = this.controls.getObject().position;
        const angle = Math.random() * Math.PI * 2;
        const distance = 8; // Very close
        
        const enemyGeometry = new THREE.BoxGeometry(2, 4, 1);
        const enemyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.9
        });
        
        const jumpScareEnemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
        jumpScareEnemy.position.set(
            playerPos.x + Math.cos(angle) * distance,
            2,
            playerPos.z + Math.sin(angle) * distance
        );
        
        const enemy = {
            mesh: jumpScareEnemy,
            health: 50, // Weaker for jump scare
            speed: 3,
            damage: 15,
            lastAttack: 0,
            attackRate: 800,
            isDead: false,
            isJumpScare: true
        };
        
        this.enemies.push(enemy);
        this.scene.add(jumpScareEnemy);
        this.applyEnemyTexture(enemy);
        
        // Intense camera shake
        this.intenseCameraShake();
    }
    
    intenseCameraShake() {
        const originalPosition = this.camera.position.clone();
        const shakeIntensity = 0.3;
        const shakeDuration = 300;
        
        const shake = () => {
            this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity;
            this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity;
            this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeIntensity;
        };
        
        const shakeInterval = setInterval(shake, 16);
        setTimeout(() => {
            clearInterval(shakeInterval);
            this.camera.position.copy(originalPosition);
        }, shakeDuration);
    }
    
    playRandomCreepySound() {
        // Create procedural creepy sound using Web Audio API
        const audioContext = THREE.AudioContext.getContext();
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Random creepy frequency
        const frequency = 50 + Math.random() * 200;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sawtooth';
        
        // Volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 2);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking Three.js...');
    
    if (typeof THREE === 'undefined') {
        console.error('Three.js failed to load! Check your internet connection.');
        document.getElementById('loadingScreen').innerHTML = `
            <div>Failed to load Three.js</div>
            <div style="font-size: 16px; margin-top: 20px;">Check your internet connection and refresh</div>
        `;
        return;
    }
    
    console.log('Three.js available, initializing game...');
    
    try {
        const game = new HorrorFPS();
        console.log('Game instance created successfully');
        
        // Make game globally accessible for debugging
        window.game = game;
        
    } catch (error) {
        console.error('Failed to create game instance:', error);
        document.getElementById('loadingScreen').innerHTML = `
            <div>Game initialization failed</div>
            <div style="font-size: 16px; margin-top: 20px;">Check console for details</div>
        `;
    }
});
