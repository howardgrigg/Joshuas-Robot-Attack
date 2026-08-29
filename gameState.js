// Game State Management and Initialization
// This module handles the core game state, engine setup, and scene initialization

// Get canvas and create engine
const canvas = document.getElementById('gameCanvas');
const engine = new BABYLON.Engine(canvas, true);

// Core game state object
let gameState = {
    keys: {},
    gameStarted: false,
    paused: false,
    currentLevel: 1,
    player: {
        health: 200,
        currentWeapon: 0,
        weapons: ['Basic Blaster'],
        hudWeapons: ['Basic Blaster'], // Visual HUD weapons (max 5)
        velocity: new BABYLON.Vector3(0, 0, 0),
        isOnGround: true,
        jumpPower: 15,
        weaponsCollected: 1,
        invulnerableUntil: 0,
        lastShot: 0,
        maxHealth: 200,
        speedMult: 1,
        invisibleUntil: 0,
        invisibleCharges: 0
    },
    coins: 0,
    upgrades: { speedLevel: 0, healthLevel: 0 },
    coinDrops: [],
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    buddyProjectiles: [],
    weaponDrops: [],
    weaponChests: [],
    chestPromptShown: false,
    chestInteract: false,
    activeChest: null,
    obstacles: [],
    buddy: null,
    killCount: 0,
    bossSpawned: false,
    sounds: {
        robotStep: null,
        robotShoot: null,
        weaponShoot: null,
        hitSound: null,
        explosionSound: null
    },
    audioContext: null,
    lastEnemySpawn: 0,
    enemiesSpawned: 0
};

// Scene creation function
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.2, 0.6, 0.9);
    scene.collisionsEnabled = true;
    
    // Create camera with proper collision setup
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 2.5, 0), scene);
    camera.setTarget(new BABYLON.Vector3(0, 2.5, 10));
    camera.attachControl(canvas, true); // Enable controls for mouse look
    camera.checkCollisions = false; // Disable Babylon collision system
    camera.ellipsoid = new BABYLON.Vector3(0.8, 1.2, 0.8); // Player collision box
    camera.speed = 0; // Disable Babylon.js built-in movement
    scene.gravity = new BABYLON.Vector3(0, 0, 0); // Disable Babylon gravity
    camera.applyGravity = false; // Disable Babylon gravity
    
    // Disable default WASD keys so we can handle them manually
    camera.keysUp = [];
    camera.keysDown = [];
    camera.keysLeft = [];
    camera.keysRight = [];
    
    // Create light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.0;
    
    return { scene, camera };
};

// Initialize welcome screen
function initializeWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.addEventListener('click', startGame);
        console.log('Welcome screen click handler added');
    } else {
        console.error('Welcome screen element not found');
    }
}

// Game start function
function startGame() {
    console.log('startGame function called');
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    document.getElementById('crosshair').style.display = 'block';
    document.getElementById('ui').style.display = 'block';
    document.getElementById('instructions').style.display = 'block';
    
    // Show mobile controls on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.getElementById('mobileControls').style.display = 'block';
    }
    
    // Initialize weapon description
    document.getElementById('weaponDescription').textContent = getWeaponDescription(gameState.player.weapons[0]);
    
    // Initialize weapon HUD
    createWeaponHUD();
    
    gameState.gameStarted = true;
    gameState.player.invulnerableUntil = Date.now() + 10000;
    
    // Resume audio context when game starts
    if (gameState.audioContext && gameState.audioContext.state === 'suspended') {
        gameState.audioContext.resume();
    }
    gameState.obstacles = [];
    
    // Create and initialize the scene
    const { scene, camera } = createScene();
    
    // Initialize all game systems
    initializeSounds(scene);
    initializeLevelSystem();
    createLevel(1);
    initDayNightCycle(scene);
    createBuddy(scene);
    setupControls(scene, camera);
    setupMobileControls(scene, camera);
    
    // Start game loop
    engine.runRenderLoop(() => {
        updateGame(scene, camera);
        scene.render();
    });
    
    // Handle window resize
    window.addEventListener("resize", () => {
        engine.resize();
    });
}

// Try to initialize immediately and also on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWelcomeScreen);
} else {
    initializeWelcomeScreen();
}