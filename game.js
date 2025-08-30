// Get canvas and create engine
const canvas = document.getElementById('gameCanvas');
const engine = new BABYLON.Engine(canvas, true);

// All 50 weapons
const ALL_WEAPONS = [
    'Basic Blaster', 'Plasma Rifle', 'Lightning Gun', 'Fire Staff', 'Ice Cannon', 'Freeze Gun',
    'Rocket Launcher', 'Grenade Launcher', 'Laser Cannon', 'Photon Beam', 'Quantum Blaster',
    'Sonic Boom', 'Gravity Gun', 'Energy Sword', 'Fusion Rifle', 'Particle Beam',
    'Void Blaster', 'Storm Caller', 'Sun Beam', 'Moon Ray', 'Star Shooter',
    'Dragon Breath', 'Phoenix Fire', 'Ice Storm', 'Thunder Strike', 'Wind Blade',
    'Earth Shaker', 'Water Cannon', 'Poison Dart', 'Acid Sprayer', 'Venom Shot',
    'Crystal Gun', 'Diamond Shooter', 'Ruby Laser', 'Emerald Beam', 'Sapphire Blast',
    'Shadow Gun', 'Light Ray', 'Time Warp', 'Space Ripper', 'Black Hole',
    'Rainbow Beam', 'Unicorn Horn', 'Magic Wand', 'Wizard Staff', 'Fairy Dust',
    'Robot Zapper', 'Mech Buster', 'Cyber Shot', 'Data Stream', 'Code Cannon'
];

// Function to get weapon description with damage info
function getWeaponDescription(weaponName) {
    const baseDescriptions = {
        'Basic Blaster': 'Your trusty starting blaster - reliable and ready for robot battles!',
        'Plasma Rifle': 'Shoots super-hot plasma bolts that melt through robot armor like butter!',
        'Lightning Gun': 'Harness the power of thunder to zap robots with electric fury!',
        'Fire Staff': 'A magical staff that launches blazing fireballs of dragon-breath power!',
        'Ice Cannon': 'Freeze your enemies solid with icy blasts from the frozen lands!',
        'Freeze Gun': 'Turn robots into ice sculptures with this arctic weapon of wonder!',
        'Rocket Launcher': 'BOOM! Giant explosive rockets that send robots flying to the moon!',
        'Grenade Launcher': 'Lob bouncing bombs that explode in spectacular robot-destroying glory!',
        'Laser Cannon': 'Pew pew! A sci-fi laser that cuts through metal like a hot knife!',
        'Photon Beam': 'Pure light energy focused into a devastating beam of justice!',
        'Quantum Blaster': 'Uses quantum physics to make robots disappear into another dimension!',
        'Sonic Boom': 'Sound waves so powerful they shatter robot circuits with musical mayhem!',
        'Gravity Gun': 'Control gravity itself to crush robots with the force of planets!',
        'Energy Sword': 'A glowing blade of pure energy that slices through anything!',
        'Fusion Rifle': 'Harnesses the power of the sun to blast robots into stardust!',
        'Particle Beam': 'Tiny particles moving at light speed pack a universe-sized punch!',
        'Void Blaster': 'Shoots holes in reality that swallow robots into the dark void!',
        'Storm Caller': 'Summon lightning storms to rain electric destruction on enemies!',
        'Sun Beam': 'Channel the burning power of our solar system\'s mighty star!',
        'Moon Ray': 'Mysterious lunar energy that makes robots howl at the moon!',
        'Star Shooter': 'Fire miniature stars that burn brighter than a thousand suns!',
        'Dragon Breath': 'Breathe fire like an ancient dragon protecting its treasure hoard!',
        'Phoenix Fire': 'Flames that rise from ashes to burn robots with immortal power!',
        'Ice Storm': 'Summon blizzards of frozen doom to bury your robot enemies!',
        'Thunder Strike': 'Call down mighty thunderbolts from the storm clouds above!',
        'Wind Blade': 'Sharp gusts of wind that slice through metal like invisible swords!',
        'Earth Shaker': 'Make the ground tremble and crack with earthquake-powered shots!',
        'Water Cannon': 'Tsunami-force water blasts that wash robots away like toy boats!',
        'Poison Dart': 'Sneaky jungle darts tipped with toxic venom that weakens robot systems!',
        'Acid Sprayer': 'Corrosive green acid that dissolves robot armor on contact!',
        'Venom Shot': 'Purple poison bolts that make robots sick with digital plague!',
        'Crystal Gun': 'Magical crystals that shatter into rainbow shards of destruction!',
        'Diamond Shooter': 'The hardest substance on Earth fired at incredible speed!',
        'Ruby Laser': 'Red gemstone power focused into a beam of royal destruction!',
        'Emerald Beam': 'Green gem energy that cuts through robots like jungle vines!',
        'Sapphire Blast': 'Blue crystal power that freezes and shatters robot dreams!',
        'Shadow Gun': 'Dark energy from the shadow realm that makes robots vanish!',
        'Light Ray': 'Pure brightness that blinds robots and fills heroes with courage!',
        'Time Warp': 'Bend time itself to age robots into rusty scrap metal!',
        'Space Ripper': 'Tear holes in space-time that transport robots to distant galaxies!',
        'Black Hole': 'Create mini black holes that suck robots into cosmic oblivion!',
        'Rainbow Beam': 'All the colors of the rainbow united in one spectacular blast!',
        'Unicorn Horn': 'Magical unicorn power that turns robots into harmless butterflies!',
        'Magic Wand': 'Wave this wand to cast spells that make robots disappear in sparkles!',
        'Wizard Staff': 'Ancient wizard magic that turns robots into cute forest animals!',
        'Fairy Dust': 'Sprinkle magical fairy dust to make robots fall asleep peacefully!',
        'Robot Zapper': 'Specially designed to short-circuit robot brains with electric zaps!',
        'Mech Buster': 'The ultimate anti-robot weapon that knows all their weaknesses!',
        'Cyber Shot': 'Digital bullets that hack into robot systems and scramble their code!',
        'Data Stream': 'Information overload that makes robot computers crash and reboot!',
        'Code Cannon': 'Fire programming commands that reprogram robots to be friendly!'
    };
    
    const baseDescription = baseDescriptions[weaponName] || 'A mysterious weapon of unknown power!';
    
    // Get damage info from weapon config
    try {
        const weaponConfig = getWeaponConfig(weaponName);
        if (weaponConfig) {
            const damage = weaponConfig.damage;
            let damageText = `Damage: ${damage}`;
            
            // Add special effects info
            if (weaponConfig.special === 'poison') {
                const poisonDamage = Math.floor(damage * 0.3);
                damageText += ` + ${poisonDamage} poison per second!`;
            } else if (weaponName === 'Freeze Gun') {
                damageText = 'Freezes robots for 10 seconds - no damage!';
            } else {
                damageText += ' damage!';
            }
            
            return `${baseDescription} ${damageText}`;
        }
    } catch (e) {
        // If there's an error getting weapon config, just return base description
        console.log('Error getting weapon config for', weaponName, e);
    }
    
    return baseDescription;
}

// Game state
let gameState = {
    keys: {},
    gameStarted: false,
    player: {
        health: 200,
        currentWeapon: 0,
        weapons: ['Basic Blaster'],
        velocity: new BABYLON.Vector3(0, 0, 0),
        isOnGround: true,
        jumpPower: 15,
        weaponsCollected: 1,
        invulnerableUntil: 0,
        lastShot: 0
    },
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    buddyProjectiles: [],
    weaponDrops: [],
    weaponChests: [], // Weapon storage chests
    chestPromptShown: false,
    chestInteract: false,
    activeChest: null, // Currently open chest
    obstacles: [], // Track obstacle positions for better enemy spawning
    buddy: null, // Player's protective companion
    killCount: 0, // Track robot kills
    bossSpawned: false, // Track if boss has been spawned
    sounds: {
        robotStep: null,
        robotShoot: null,
        weaponShoot: null,
        hitSound: null,
        explosionSound: null
    }
};

// Create scene
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.2, 0.6, 0.9);
    scene.collisionsEnabled = true;
    
    // Create camera
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 6, 0), scene);
    camera.setTarget(new BABYLON.Vector3(0, 6, 10));
    camera.attachControl(canvas, true);
    camera.checkCollisions = true;
    camera.ellipsoid = new BABYLON.Vector3(1, 3, 1);
    camera.speed = 0;
    scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
    camera.applyGravity = true;
    
    // Create light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.0;
    
    // Initialize sound system
    initializeSounds(scene);
    
    // Create diverse terrain
    createTerrain(scene);
    
    // Create bigger rocks for cover
    for (let i = 0; i < 35; i++) {
        const diameter = Math.random() * 4 + 4;
        const rock = BABYLON.MeshBuilder.CreateSphere("rock" + i, {diameter: diameter}, scene);
        rock.position.x = Math.random() * 200 - 100;
        rock.position.z = Math.random() * 200 - 100;
        rock.position.y = rock.scaling.y / 2;
        rock.scaling.y = Math.random() * 0.4 + 0.6;
        
        // Track obstacle position and size for enemy spawning
        gameState.obstacles.push({
            position: new BABYLON.Vector3(rock.position.x, 0, rock.position.z),
            radius: diameter / 2 + 1 // Add 1 unit buffer
        });
        
        const rockMaterial = new BABYLON.StandardMaterial("rockMaterial" + i, scene);
        rockMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        rock.material = rockMaterial;
        rock.checkCollisions = true;
    }
    
    // Create trees
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        createTree(scene, x, z);
        
        // Track tree position for enemy spawning
        gameState.obstacles.push({
            position: new BABYLON.Vector3(x, 0, z),
            radius: 3 // Tree trunk radius plus buffer
        });
    }
    
    // Create weapon chests
    for (let i = 0; i < 3; i++) {
        createWeaponChest(scene);
    }
    
    // Create protective buddy
    createBuddy(scene);
    
    // Create enemies
    for (let i = 0; i < 8; i++) {
        createEnemy(scene);
    }
    
    // Setup controls
    setupControls(scene, camera);
    
    return scene;
};

function createTerrain(scene) {
    // Main grass ground
    const mainGround = BABYLON.MeshBuilder.CreateGround("mainGround", {width: 240, height: 240}, scene);
    const grassMaterial = new BABYLON.StandardMaterial("grassMaterial", scene);
    grassMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.2);
    mainGround.material = grassMaterial;
    mainGround.checkCollisions = true;
    
    // Add rolling hills
    for (let i = 0; i < 8; i++) {
        const hill = BABYLON.MeshBuilder.CreateSphere("hill" + i, {diameter: Math.random() * 20 + 15}, scene);
        hill.position.x = Math.random() * 100 - 50;
        hill.position.z = Math.random() * 100 - 50;
        hill.position.y = -(Math.random() * 8 + 5); // Partially buried
        hill.scaling.y = Math.random() * 0.3 + 0.2;
        
        const hillMaterial = new BABYLON.StandardMaterial("hillMaterial" + i, scene);
        hillMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.6, 0.18);
        hill.material = hillMaterial;
        hill.checkCollisions = true;
    }
    
    // Sandy patches
    for (let i = 0; i < 6; i++) {
        const sandPatch = BABYLON.MeshBuilder.CreateGround("sand" + i, {width: Math.random() * 15 + 10, height: Math.random() * 15 + 10}, scene);
        sandPatch.position.x = Math.random() * 80 - 40;
        sandPatch.position.z = Math.random() * 80 - 40;
        sandPatch.position.y = 0.05;
        
        const sandMaterial = new BABYLON.StandardMaterial("sandMaterial" + i, scene);
        sandMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.7, 0.4);
        sandPatch.material = sandMaterial;
    }
    
    // Rocky areas
    for (let i = 0; i < 4; i++) {
        const rockArea = BABYLON.MeshBuilder.CreateGround("rockArea" + i, {width: Math.random() * 12 + 8, height: Math.random() * 12 + 8}, scene);
        rockArea.position.x = Math.random() * 70 - 35;
        rockArea.position.z = Math.random() * 70 - 35;
        rockArea.position.y = 0.02;
        
        const rockMaterial = new BABYLON.StandardMaterial("rockAreaMaterial" + i, scene);
        rockMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        rockArea.material = rockMaterial;
    }
    
    // Add some elevation platforms
    for (let i = 0; i < 5; i++) {
        const platform = BABYLON.MeshBuilder.CreateCylinder("platform" + i, {height: Math.random() * 3 + 2, diameter: Math.random() * 8 + 6}, scene);
        platform.position.x = Math.random() * 60 - 30;
        platform.position.z = Math.random() * 60 - 30;
        platform.position.y = platform.scaling.y / 2;
        
        const platformMaterial = new BABYLON.StandardMaterial("platformMaterial" + i, scene);
        platformMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
        platform.material = platformMaterial;
        platform.checkCollisions = true;
        
        // Track platforms as obstacles
        gameState.obstacles.push({
            position: new BABYLON.Vector3(platform.position.x, 0, platform.position.z),
            radius: (platform.scaling.x * 6) / 2 + 1
        });
    }
    
    // Small ponds/water features
    for (let i = 0; i < 3; i++) {
        const pond = BABYLON.MeshBuilder.CreateGround("pond" + i, {width: Math.random() * 8 + 5, height: Math.random() * 8 + 5}, scene);
        pond.position.x = Math.random() * 50 - 25;
        pond.position.z = Math.random() * 50 - 25;
        pond.position.y = -0.1;
        
        const waterMaterial = new BABYLON.StandardMaterial("waterMaterial" + i, scene);
        waterMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
        waterMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 1);
        pond.material = waterMaterial;
    }
}

function createTree(scene, x, z) {
    // Bigger tree trunk for cover
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {height: 12, diameter: 2.5}, scene);
    trunk.position = new BABYLON.Vector3(x, 6, z);
    
    const trunkMaterial = new BABYLON.StandardMaterial("trunkMaterial", scene);
    trunkMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
    trunk.material = trunkMaterial;
    trunk.checkCollisions = true;
    
    // Bigger tree leaves
    const leaves = BABYLON.MeshBuilder.CreateSphere("leaves", {diameter: 8}, scene);
    leaves.position = new BABYLON.Vector3(x, 14, z);
    
    const leavesMaterial = new BABYLON.StandardMaterial("leavesMaterial", scene);
    leavesMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1);
    leaves.material = leavesMaterial;
    leaves.checkCollisions = true;
}

function createWeaponChest(scene) {
    // Find a safe position for the chest
    let chestPosition;
    for (let attempts = 0; attempts < 50; attempts++) {
        const x = Math.random() * 180 - 90; // Wider range for chests
        const z = Math.random() * 180 - 90;
        chestPosition = new BABYLON.Vector3(x, 7, z);
        
        // Check distance from other chests (minimum 30 units apart)
        let validPosition = true;
        for (const existingChest of gameState.weaponChests) {
            const distance = BABYLON.Vector3.Distance(chestPosition, existingChest.position);
            if (distance < 30) {
                validPosition = false;
                break;
            }
        }
        
        // Check distance from obstacles
        for (const obstacle of gameState.obstacles) {
            const distance = BABYLON.Vector3.Distance(chestPosition, obstacle.position);
            if (distance < 8) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) break;
    }
    
    // Create chest base
    const chest = BABYLON.MeshBuilder.CreateBox("weaponChest", {width: 3, height: 2, depth: 2}, scene);
    chest.position = chestPosition;
    
    // Chest material - wooden look
    const chestMaterial = new BABYLON.StandardMaterial("chestMaterial", scene);
    chestMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1);
    chestMaterial.specularColor = new BABYLON.Color3(0.2, 0.1, 0.05);
    chest.material = chestMaterial;
    
    // Metal bands on chest
    const band1 = BABYLON.MeshBuilder.CreateBox("band1", {width: 3.1, height: 0.2, depth: 2.1}, scene);
    band1.position = new BABYLON.Vector3(chestPosition.x, chestPosition.y + 0.3, chestPosition.z);
    const band2 = BABYLON.MeshBuilder.CreateBox("band2", {width: 3.1, height: 0.2, depth: 2.1}, scene);
    band2.position = new BABYLON.Vector3(chestPosition.x, chestPosition.y - 0.3, chestPosition.z);
    
    const metalMaterial = new BABYLON.StandardMaterial("metalMaterial", scene);
    metalMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    metalMaterial.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    band1.material = metalMaterial;
    band2.material = metalMaterial;
    
    // Glowing indicator when chest has items
    const indicator = BABYLON.MeshBuilder.CreateSphere("indicator", {diameter: 0.5}, scene);
    indicator.position = new BABYLON.Vector3(chestPosition.x, chestPosition.y + 1.5, chestPosition.z);
    
    const indicatorMaterial = new BABYLON.StandardMaterial("indicatorMaterial", scene);
    indicatorMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    indicatorMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.1);
    indicator.material = indicatorMaterial;
    
    // Store chest data
    const chestData = {
        mesh: chest,
        indicator: indicator,
        bands: [band1, band2],
        position: chestPosition,
        storedWeapons: [], // Array of weapon names stored in this chest
        isOpen: false,
        id: gameState.weaponChests.length
    };
    
    chest.checkCollisions = true;
    gameState.weaponChests.push(chestData);
    
    // Add to obstacles so enemies don't spawn too close
    gameState.obstacles.push({
        position: chestPosition,
        radius: 4
    });
}

function findSafeSpawnPosition(playerPosition = new BABYLON.Vector3(0, 0, 0)) {
    // Try to find a safe position up to 50 times
    for (let attempts = 0; attempts < 50; attempts++) {
        const x = Math.random() * 60 - 30;
        const z = Math.random() * 60 - 30;
        const position = new BABYLON.Vector3(x, 7, z);
        
        // Check distance from player (minimum 10 units away)
        const distanceFromPlayer = BABYLON.Vector3.Distance(position, playerPosition);
        if (distanceFromPlayer < 10) continue;
        
        // Check if position conflicts with any obstacles
        let isSafe = true;
        for (const obstacle of gameState.obstacles) {
            const distance = BABYLON.Vector3.Distance(position, obstacle.position);
            if (distance < obstacle.radius + 2) { // 2 unit buffer for enemy size
                isSafe = false;
                break;
            }
        }
        
        if (isSafe) {
            
            return position;
        }
    }
    
    // Fallback: spawn far from center if no safe position found
    const angle = Math.random() * Math.PI * 2;
    const distance = 25 + Math.random() * 10;
    const groundHeight = getGroundHeight(scene, Math.cos(angle) * distance, Math.sin(angle) * distance);
    return new BABYLON.Vector3(
        Math.cos(angle) * distance,
        7, // 1 unit above ground for robot feet
        Math.sin(angle) * distance
    );
}


function createEnemy(scene) {
    // Create robot body (main box)
    const enemy = BABYLON.MeshBuilder.CreateBox("enemy", {size: 2}, scene);
    
    // Use safe spawning system to avoid obstacles and player
    const playerPosition = scene.activeCamera ? scene.activeCamera.position : new BABYLON.Vector3(0, 0, 0);
    const safePosition = findSafeSpawnPosition(playerPosition);
    enemy.position = safePosition;
    
    const material = new BABYLON.StandardMaterial("enemyMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.8);
    material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
    enemy.material = material;
    
    // Robot head
    const head = BABYLON.MeshBuilder.CreateBox("head", {size: 1}, scene);
    head.position = new BABYLON.Vector3(0, 1.5, 0);
    head.parent = enemy;
    
    const headMaterial = new BABYLON.StandardMaterial("headMaterial", scene);
    headMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    head.material = headMaterial;
    
    // Robot eyes (glowing red)
    const leftEye = BABYLON.MeshBuilder.CreateSphere("leftEye", {diameter: 0.2}, scene);
    leftEye.position = new BABYLON.Vector3(-0.3, 1.7, 0.4);
    leftEye.parent = enemy;
    
    const rightEye = BABYLON.MeshBuilder.CreateSphere("rightEye", {diameter: 0.2}, scene);
    rightEye.position = new BABYLON.Vector3(0.3, 1.7, 0.4);
    rightEye.parent = enemy;
    
    const eyeMaterial = new BABYLON.StandardMaterial("eyeMaterial", scene);
    eyeMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    eyeMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
    leftEye.material = eyeMaterial;
    rightEye.material = eyeMaterial;
    
    // Add a mouth/face plate
    const mouth = BABYLON.MeshBuilder.CreateBox("mouth", {width: 0.4, height: 0.1, depth: 0.05}, scene);
    mouth.position = new BABYLON.Vector3(0, 1.4, 0.45);
    mouth.parent = enemy;
    
    const mouthMaterial = new BABYLON.StandardMaterial("mouthMaterial", scene);
    mouthMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    mouth.material = mouthMaterial;
    
    // Add antenna/sensor
    const antenna = BABYLON.MeshBuilder.CreateCylinder("antenna", {height: 0.5, diameter: 0.1}, scene);
    antenna.position = new BABYLON.Vector3(0, 2.2, 0);
    antenna.parent = enemy;
    
    const antennaMaterial = new BABYLON.StandardMaterial("antennaMaterial", scene);
    antennaMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    antennaMaterial.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
    antenna.material = antennaMaterial;
    
    // Robot arms (positioned for animation)
    const leftArm = BABYLON.MeshBuilder.CreateBox("leftArm", {width: 0.4, height: 1.2, depth: 0.4}, scene);
    leftArm.position = new BABYLON.Vector3(-1, 0.2, 0);
    leftArm.parent = enemy;
    leftArm.material = material;
    
    const rightArm = BABYLON.MeshBuilder.CreateBox("rightArm", {width: 0.4, height: 1.2, depth: 0.4}, scene);
    rightArm.position = new BABYLON.Vector3(1, 0.2, 0);
    rightArm.parent = enemy;
    rightArm.material = material;
    
    // Robot legs for walking animation
    const leftLeg = BABYLON.MeshBuilder.CreateBox("leftLeg", {width: 0.4, height: 1.2, depth: 0.4}, scene);
    leftLeg.position = new BABYLON.Vector3(-0.4, -1, 0);
    leftLeg.parent = enemy;
    leftLeg.material = material;
    
    const rightLeg = BABYLON.MeshBuilder.CreateBox("rightLeg", {width: 0.4, height: 1.2, depth: 0.4}, scene);
    rightLeg.position = new BABYLON.Vector3(0.4, -1, 0);
    rightLeg.parent = enemy;
    rightLeg.material = material;
    
    // Add feet
    const leftFoot = BABYLON.MeshBuilder.CreateBox("leftFoot", {width: 0.6, height: 0.2, depth: 0.8}, scene);
    leftFoot.position = new BABYLON.Vector3(0, -0.7, 0.2);
    leftFoot.parent = leftLeg;
    leftFoot.material = material;
    
    const rightFoot = BABYLON.MeshBuilder.CreateBox("rightFoot", {width: 0.6, height: 0.2, depth: 0.8}, scene);
    rightFoot.position = new BABYLON.Vector3(0, -0.7, 0.2);
    rightFoot.parent = rightLeg;
    rightFoot.material = material;
    
    // Store references to robot parts for animation
    enemy.robotParts = {
        head, leftEye, rightEye, mouth, antenna,
        leftArm, rightArm, leftLeg, rightLeg, 
        leftFoot, rightFoot
    };
    
    enemy.health = 60;
    enemy.maxHealth = 60;
    enemy.speed = 0.02;
    enemy.originalSpeed = 0.02;
    enemy.lastAttack = 0;
    enemy.lastShot = 0;
    enemy.checkCollisions = true;
    enemy.obstacles = [];
    enemy.isFrozen = false;
    enemy.freezeTime = 0;
    enemy.isPoisoned = false;
    enemy.poisonTime = 0;
    enemy.poisonDamage = 0;
    enemy.lastPoisonTick = 0;
    
    // Animation properties
    enemy.animationTime = 0;
    enemy.isMoving = false;
    enemy.lastDirection = new BABYLON.Vector3(0, 0, 1);
    
    // Create health bar above robot
    createHealthBar(scene, enemy);
    
    gameState.enemies.push(enemy);
}

function createBuddy(scene) {
    // Create buddy robot (friendly design)
    const buddy = BABYLON.MeshBuilder.CreateBox("buddy", {size: 1.8}, scene);
    buddy.position = new BABYLON.Vector3(-3, 2, 3); // Start near player
    
    // Friendly blue color scheme
    const material = new BABYLON.StandardMaterial("buddyMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
    material.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
    buddy.material = material;
    
    // Buddy head (smaller than enemy)
    const head = BABYLON.MeshBuilder.CreateBox("buddyHead", {size: 0.8}, scene);
    head.position = new BABYLON.Vector3(0, 1.3, 0);
    head.parent = buddy;
    
    const headMaterial = new BABYLON.StandardMaterial("buddyHeadMaterial", scene);
    headMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.6, 1);
    head.material = headMaterial;
    
    // Friendly green eyes
    const leftEye = BABYLON.MeshBuilder.CreateSphere("buddyLeftEye", {diameter: 0.15}, scene);
    leftEye.position = new BABYLON.Vector3(-0.25, 1.4, 0.35);
    leftEye.parent = buddy;
    
    const rightEye = BABYLON.MeshBuilder.CreateSphere("buddyRightEye", {diameter: 0.15}, scene);
    rightEye.position = new BABYLON.Vector3(0.25, 1.4, 0.35);
    rightEye.parent = buddy;
    
    const eyeMaterial = new BABYLON.StandardMaterial("buddyEyeMaterial", scene);
    eyeMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0.2);
    eyeMaterial.emissiveColor = new BABYLON.Color3(0, 0.8, 0.1);
    leftEye.material = eyeMaterial;
    rightEye.material = eyeMaterial;
    
    // Buddy arms
    const leftArm = BABYLON.MeshBuilder.CreateBox("buddyLeftArm", {width: 0.4, height: 1.2, depth: 0.4}, scene);
    leftArm.position = new BABYLON.Vector3(-1, 0, 0);
    leftArm.parent = buddy;
    leftArm.material = material;
    
    const rightArm = BABYLON.MeshBuilder.CreateBox("buddyRightArm", {width: 0.4, height: 1.2, depth: 0.4}, scene);
    rightArm.position = new BABYLON.Vector3(1, 0, 0);
    rightArm.parent = buddy;
    rightArm.material = material;
    
    // Add a protective shield on the arm
    const shield = BABYLON.MeshBuilder.CreateCylinder("buddyShield", {height: 0.1, diameter: 1}, scene);
    shield.position = new BABYLON.Vector3(0, 0.5, 0.3);
    shield.parent = leftArm;
    shield.rotation.x = Math.PI / 2;
    
    const shieldMaterial = new BABYLON.StandardMaterial("shieldMaterial", scene);
    shieldMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    shieldMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    shield.material = shieldMaterial;
    
    // Store references to buddy parts
    buddy.robotParts = {head, leftEye, rightEye, leftArm, rightArm, shield};
    
    buddy.health = 80;
    buddy.maxHealth = 80;
    buddy.speed = 0.05; // Faster movement
    buddy.lastAttack = 0;
    buddy.lastShot = 0;
    buddy.lastHeal = 0;
    buddy.target = null;
    buddy.followDistance = 4; // Stay within 4 units of player
    buddy.attackRange = 15; // Increased attack range
    buddy.healRange = 2; // Heal when within 2 units of player
    buddy.checkCollisions = true;
    
    // Buddy weapon system
    buddy.weapons = ["Pistol"]; // Start with basic pistol
    buddy.currentWeapon = 0;
    buddy.weaponsCollected = 1;
    
    // Create health bar for buddy
    createHealthBar(scene, buddy);
    
    gameState.buddy = buddy;
}

function createBossEnemy(scene) {
    // Create giant boss robot body (50% bigger than before)
    const boss = BABYLON.MeshBuilder.CreateBox("boss", {size: 6}, scene);
    
    // Spawn boss at a safe distance from player
    const playerPosition = scene.activeCamera ? scene.activeCamera.position : new BABYLON.Vector3(0, 0, 0);
    const safePosition = findSafeSpawnPosition(playerPosition); // Use default spawn distance
    boss.position = safePosition;
    
    const material = new BABYLON.StandardMaterial("bossMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2); // Dark red color
    material.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.1);
    boss.material = material;
    
    // Giant robot head (scaled up proportionally)
    const head = BABYLON.MeshBuilder.CreateBox("bossHead", {size: 3}, scene);
    head.position = new BABYLON.Vector3(0, 4.5, 0);
    head.parent = boss;
    
    const headMaterial = new BABYLON.StandardMaterial("bossHeadMaterial", scene);
    headMaterial.diffuseColor = new BABYLON.Color3(1, 0.1, 0.1);
    head.material = headMaterial;
    
    // Giant glowing red eyes (scaled up)
    const leftEye = BABYLON.MeshBuilder.CreateSphere("bossLeftEye", {diameter: 0.6}, scene);
    leftEye.position = new BABYLON.Vector3(-0.9, 5.1, 1.2);
    leftEye.parent = boss;
    
    const rightEye = BABYLON.MeshBuilder.CreateSphere("bossRightEye", {diameter: 0.6}, scene);
    rightEye.position = new BABYLON.Vector3(0.9, 5.1, 1.2);
    rightEye.parent = boss;
    
    const eyeMaterial = new BABYLON.StandardMaterial("bossEyeMaterial", scene);
    eyeMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    eyeMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
    leftEye.material = eyeMaterial;
    rightEye.material = eyeMaterial;
    
    // Giant arms with weapons (scaled up)
    const leftArm = BABYLON.MeshBuilder.CreateBox("bossLeftArm", {width: 1.2, height: 3.6, depth: 1.2}, scene);
    leftArm.position = new BABYLON.Vector3(-3.75, 0.6, 0);
    leftArm.parent = boss;
    leftArm.material = material;
    
    const rightArm = BABYLON.MeshBuilder.CreateBox("bossRightArm", {width: 1.2, height: 3.6, depth: 1.2}, scene);
    rightArm.position = new BABYLON.Vector3(3.75, 0.6, 0);
    rightArm.parent = boss;
    rightArm.material = material;
    
    // Giant legs (scaled up)
    const leftLeg = BABYLON.MeshBuilder.CreateBox("bossLeftLeg", {width: 1.2, height: 3.6, depth: 1.2}, scene);
    leftLeg.position = new BABYLON.Vector3(-1.2, -3, 0);
    leftLeg.parent = boss;
    leftLeg.material = material;
    
    const rightLeg = BABYLON.MeshBuilder.CreateBox("bossRightLeg", {width: 1.2, height: 3.6, depth: 1.2}, scene);
    rightLeg.position = new BABYLON.Vector3(1.2, -3, 0);
    rightLeg.parent = boss;
    rightLeg.material = material;
    
    // Store references to robot parts for animation
    boss.robotParts = {
        head, leftEye, rightEye,
        leftArm, rightArm, leftLeg, rightLeg
    };
    
    boss.health = 1000;
    boss.maxHealth = 1000;
    boss.speed = 0.01; // Slower than regular enemies
    boss.originalSpeed = 0.01;
    boss.lastAttack = 0;
    boss.lastShot = 0;
    boss.checkCollisions = true;
    boss.obstacles = [];
    boss.isBoss = true; // Mark as boss enemy
    boss.attackDamage = 50; // Much stronger attacks
    boss.shootCooldown = 1000; // Faster shooting
    
    // Animation properties
    boss.animationTime = 0;
    boss.isMoving = false;
    boss.lastDirection = new BABYLON.Vector3(0, 0, 1);
    
    // Create health bar above boss
    createHealthBar(scene, boss);
    
    gameState.enemies.push(boss);
    
    // Show boss arrival message
    alert("GIANT BOSS ROBOT APPEARED! Defeat it to win!");
}

function updateBuddy(scene, camera, currentTime) {
    const buddy = gameState.buddy;
    const playerPosition = camera.position;
    const distanceToPlayer = BABYLON.Vector3.Distance(buddy.position, playerPosition);
    
    // Find the closest enemy
    let closestEnemy = null;
    let closestDistance = Infinity;
    
    gameState.enemies.forEach(enemy => {
        const distance = BABYLON.Vector3.Distance(buddy.position, enemy.position);
        if (distance < closestDistance && distance < buddy.attackRange) {
            closestEnemy = enemy;
            closestDistance = distance;
        }
    });
    
    // Priority 1: Heal player if close and player needs healing
    if (distanceToPlayer <= buddy.healRange && gameState.player.health < 200 && currentTime - buddy.lastHeal > 3000) {
        healPlayer(buddy, currentTime);
    }
    // Priority 2: Attack enemies more aggressively
    else if (closestEnemy && currentTime - buddy.lastShot > 800) { // Faster shooting
        buddyShoot(scene, buddy, closestEnemy);
        buddy.lastShot = currentTime;
    }
    // Priority 3: Follow player if too far away
    else if (distanceToPlayer > buddy.followDistance) {
        moveBuddyTowardsPlayer(buddy, playerPosition);
    }
    // Priority 4: Move to defensive position around player
    else if (distanceToPlayer < 1.5) {
        // Move to a good defensive position
        const angle = Math.atan2(buddy.position.z - playerPosition.z, buddy.position.x - playerPosition.x);
        const targetX = playerPosition.x + Math.cos(angle) * buddy.followDistance;
        const targetZ = playerPosition.z + Math.sin(angle) * buddy.followDistance;
        const targetPosition = new BABYLON.Vector3(targetX, buddy.position.y, targetZ);
        
        const direction = targetPosition.subtract(buddy.position).normalize();
        buddy.position.addInPlace(direction.scale(buddy.speed));
    }
    
    // Priority 5: Check for weapon pickups
    for (let i = gameState.weaponDrops.length - 1; i >= 0; i--) {
        const drop = gameState.weaponDrops[i];
        const distance = BABYLON.Vector3.Distance(buddy.position, drop.position);
        
        if (distance < 2.5) { // Slightly larger pickup range than player
            // Pick up weapon if buddy doesn't have it
            if (!buddy.weapons.includes(drop.weaponName)) {
                buddy.weapons.push(drop.weaponName);
                buddy.weaponsCollected++;
                
                // Switch to new weapon
                buddy.currentWeapon = buddy.weapons.length - 1;
                
                // Remove pickup
                drop.dispose();
                gameState.weaponDrops.splice(i, 1);
                break; // Only pick up one weapon per frame
            }
        }
    }
}

function moveBuddyTowardsPlayer(buddy, playerPosition) {
    const direction = playerPosition.subtract(buddy.position).normalize();
    // Move faster when following to catch up
    buddy.position.addInPlace(direction.scale(buddy.speed * 1.5));
}

function healPlayer(buddy, currentTime) {
    const healAmount = 15; // Heal 15 HP
    gameState.player.health = Math.min(200, gameState.player.health + healAmount);
    document.getElementById('health').textContent = gameState.player.health;
    buddy.lastHeal = currentTime;
    
    // Create healing visual effect
    createHealingEffect(buddy.getScene(), gameState.player);
    
    // Play healing sound
    createBeepSound(800, 0.3, 0.12); // Higher pitch healing sound
}

function createHealingEffect(scene, target) {
    // Create green healing particles around player
    for (let i = 0; i < 8; i++) {
        const particle = BABYLON.MeshBuilder.CreateSphere("healParticle", {diameter: 0.2}, scene);
        const angle = (i / 8) * Math.PI * 2;
        const radius = 1.5;
        
        particle.position = new BABYLON.Vector3(
            target.position ? target.position.x + Math.cos(angle) * radius : Math.cos(angle) * radius,
            (target.position ? target.position.y : 6) + Math.random() * 2,
            target.position ? target.position.z + Math.sin(angle) * radius : Math.sin(angle) * radius
        );
        
        const material = new BABYLON.StandardMaterial("healMaterial", scene);
        material.diffuseColor = new BABYLON.Color3(0, 1, 0.3);
        material.emissiveColor = new BABYLON.Color3(0, 0.8, 0.2);
        particle.material = material;
        
        // Animate particles floating upward
        const startY = particle.position.y;
        let animationTime = 0;
        const animateParticle = () => {
            animationTime += 0.05;
            particle.position.y = startY + Math.sin(animationTime) * 0.5 + animationTime;
            particle.scaling = particle.scaling.scale(0.95); // Shrink over time
            
            if (animationTime < 2) {
                requestAnimationFrame(animateParticle);
            } else {
                particle.dispose();
            }
        };
        animateParticle();
    }
}

function buddyShoot(scene, buddy, targetEnemy) {
    // Get buddy's current weapon (same system as player)
    const weaponType = buddy.weapons[buddy.currentWeapon];
    const weapon = getWeaponConfig(weaponType);
    
    // Calculate direction to enemy
    const startPosition = buddy.position.clone();
    startPosition.y += 1;
    const direction = targetEnemy.position.subtract(buddy.position).normalize();
    
    // Create projectiles using the weapon's system
    const projectiles = weapon.createProjectile(scene, startPosition, direction);
    
    // Add all projectiles to buddy projectiles array
    projectiles.forEach(projectile => {
        // Reduce buddy damage by 20% to keep them helpful but not overpowered
        if (projectile.damage) {
            projectile.damage = Math.floor(projectile.damage * 0.8);
        }
        gameState.buddyProjectiles.push(projectile);
    });
    
    // Play weapon-specific sound (slightly higher pitched for buddy)
    playBuddyWeaponSound(weaponType);
}

function createHealthBar(scene, enemy) {
    // Health bar background (grey)
    const healthBarBg = BABYLON.MeshBuilder.CreatePlane("healthBarBg", {width: 2, height: 0.3}, scene);
    healthBarBg.position = new BABYLON.Vector3(0, 4, 0);
    healthBarBg.parent = enemy;
    healthBarBg.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL; // Always face camera
    
    const bgMaterial = new BABYLON.StandardMaterial("healthBarBgMaterial", scene);
    bgMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    bgMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    healthBarBg.material = bgMaterial;
    
    // Health bar foreground (green/red)
    const healthBar = BABYLON.MeshBuilder.CreatePlane("healthBar", {width: 1.8, height: 0.2}, scene);
    healthBar.position = new BABYLON.Vector3(0, 4, 0.01);
    healthBar.parent = enemy;
    healthBar.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    
    const healthMaterial = new BABYLON.StandardMaterial("healthBarMaterial", scene);
    healthMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0); // Start green
    healthMaterial.emissiveColor = new BABYLON.Color3(0, 0.5, 0);
    healthBar.material = healthMaterial;
    
    // Store references for updates
    enemy.healthBar = healthBar;
    enemy.healthBarBg = healthBarBg;
}

function updateHealthBar(enemy) {
    if (!enemy.healthBar) return;
    
    const healthPercentage = enemy.health / enemy.maxHealth;
    
    // Update width based on health
    enemy.healthBar.scaling.x = healthPercentage;
    
    // Update color based on health (green -> yellow -> red)
    if (healthPercentage > 0.6) {
        enemy.healthBar.material.diffuseColor = new BABYLON.Color3(0, 1, 0); // Green
        enemy.healthBar.material.emissiveColor = new BABYLON.Color3(0, 0.5, 0);
    } else if (healthPercentage > 0.3) {
        enemy.healthBar.material.diffuseColor = new BABYLON.Color3(1, 1, 0); // Yellow
        enemy.healthBar.material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
    } else {
        enemy.healthBar.material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
        enemy.healthBar.material.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
    }
    
    // Position adjustment for scaling from left
    enemy.healthBar.position.x = -(1.8 - (1.8 * healthPercentage)) / 2;
}

function setupControls(scene, camera) {
    // Simple keyboard events
    window.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        gameState.keys[key] = true;
        
        if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
            switchWeapon(parseInt(key) - 1);
        }
        
        // Jump with space
        if (key === ' ' && gameState.player.isOnGround) {
            gameState.player.velocity.y = gameState.player.jumpPower;
            gameState.player.isOnGround = false;
        }
    });
    
    window.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        gameState.keys[key] = false;
    });
    
    // Mouse shooting
    scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN && gameState.gameStarted) {
            shoot(scene, camera);
        }
    });
    
    // Lock pointer on click
    canvas.addEventListener('click', () => {
        canvas.requestPointerLock();
    });
    
    // Setup mobile controls
    setupMobileControls(scene, camera);
}

function setupMobileControls(scene, camera) {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (isMobile) {
        // Show mobile controls
        document.getElementById('mobileControls').style.display = 'block';
    }
    
    // Virtual joystick variables
    let joystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    let joystickKnob = document.getElementById('joystickKnob');
    let joystick = document.getElementById('joystick');
    
    // Touch camera control variables  
    let lastTouch = { x: 0, y: 0 };
    let touchLookActive = false;
    
    // Movement state for virtual joystick
    gameState.mobileMovement = { x: 0, y: 0 };
    
    // Virtual joystick touch handlers
    joystick.addEventListener('touchstart', function(e) {
        e.preventDefault();
        joystickActive = true;
        const rect = joystick.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    });
    
    joystick.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!joystickActive) return;
        
        const touch = e.touches[0];
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 40; // Half of joystick radius
        
        if (distance <= maxDistance) {
            joystickKnob.style.left = (50 + (dx / maxDistance) * 50) + '%';
            joystickKnob.style.top = (50 + (dy / maxDistance) * 50) + '%';
            gameState.mobileMovement.x = dx / maxDistance;
            gameState.mobileMovement.y = dy / maxDistance;
        } else {
            const angle = Math.atan2(dy, dx);
            const limitedX = Math.cos(angle) * maxDistance;
            const limitedY = Math.sin(angle) * maxDistance;
            joystickKnob.style.left = (50 + (limitedX / maxDistance) * 50) + '%';
            joystickKnob.style.top = (50 + (limitedY / maxDistance) * 50) + '%';
            gameState.mobileMovement.x = limitedX / maxDistance;
            gameState.mobileMovement.y = limitedY / maxDistance;
        }
    });
    
    joystick.addEventListener('touchend', function(e) {
        e.preventDefault();
        joystickActive = false;
        joystickKnob.style.left = '50%';
        joystickKnob.style.top = '50%';
        gameState.mobileMovement.x = 0;
        gameState.mobileMovement.y = 0;
    });
    
    // Action buttons
    document.getElementById('shootButton').addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (gameState.gameStarted) {
            shoot(scene, camera);
        }
    });
    
    document.getElementById('jumpButton').addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (gameState.player.isOnGround) {
            gameState.player.velocity.y = gameState.player.jumpPower;
            gameState.player.isOnGround = false;
        }
    });
    
    // Weapon switch buttons
    document.getElementById('prevWeapon').addEventListener('touchstart', function(e) {
        e.preventDefault();
        const currentIndex = gameState.player.currentWeapon;
        const newIndex = currentIndex > 0 ? currentIndex - 1 : gameState.player.weapons.length - 1;
        switchWeapon(newIndex);
    });
    
    document.getElementById('nextWeapon').addEventListener('touchstart', function(e) {
        e.preventDefault();
        const currentIndex = gameState.player.currentWeapon;
        const newIndex = currentIndex < gameState.player.weapons.length - 1 ? currentIndex + 1 : 0;
        switchWeapon(newIndex);
    });
    
    // Chest interaction button
    document.getElementById('chestButton').addEventListener('touchstart', function(e) {
        e.preventDefault();
        gameState.chestInteract = true;
    });
    
    // Touch look controls (anywhere on screen except UI elements)
    canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            touchLookActive = true;
            lastTouch.x = e.touches[0].clientX;
            lastTouch.y = e.touches[0].clientY;
        }
    });
    
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!touchLookActive || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        
        // Sensitivity adjustment for mobile
        const sensitivity = 0.005;
        camera.rotation.y += deltaX * sensitivity;
        camera.rotation.x += deltaY * sensitivity;
        
        // Clamp vertical rotation
        camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        
        lastTouch.x = touch.clientX;
        lastTouch.y = touch.clientY;
    });
    
    canvas.addEventListener('touchend', function(e) {
        touchLookActive = false;
    });
}

function switchWeapon(weaponIndex) {
    if (weaponIndex < gameState.player.weapons.length) {
        gameState.player.currentWeapon = weaponIndex;
        const weaponName = gameState.player.weapons[weaponIndex];
        document.getElementById('currentWeapon').textContent = weaponName;
        document.getElementById('weaponDescription').textContent = getWeaponDescription(weaponName);
    }
}

function shoot(scene, camera) {
    const currentTime = Date.now();
    const weapon = gameState.player.weapons[gameState.player.currentWeapon];
    const weaponConfig = getWeaponConfig(weapon);
    const fireRate = weaponConfig ? weaponConfig.fireRate : 100; // Default 100ms cooldown (faster)
    
    // Check fire rate cooldown
    if (currentTime - gameState.player.lastShot < fireRate) {
        return; // Still on cooldown
    }
    
    createProjectile(scene, camera, weapon);
    playWeaponSound(weapon);
    gameState.player.lastShot = currentTime;
}

function createProjectile(scene, camera, weaponType) {
    const weapon = getWeaponConfig(weaponType);
    const startPosition = camera.position.clone();
    startPosition.y -= 0.5;
    const direction = camera.getForwardRay().direction.normalize();
    
    const projectiles = weapon.createProjectile(scene, startPosition, direction);
    
    // Add all projectiles to the game state
    projectiles.forEach(projectile => {
        gameState.projectiles.push(projectile);
    });
    
    return projectiles[0]; // Return first projectile for compatibility
}

// Weapon class system
class Weapon {
    constructor(name, config) {
        this.name = name;
        this.speed = config.speed;
        this.damage = config.damage;
        this.color = config.color;
        this.projectileType = config.projectileType;
        this.fireRate = config.fireRate || 100;
        this.spread = config.spread || 0;
        this.projectileCount = config.projectileCount || 1;
        this.special = config.special || null;
        this.trail = config.trail || false;
        this.size = config.size || 0.5;
    }
    
    createProjectile(scene, position, direction) {
        const projectiles = [];
        
        for (let i = 0; i < this.projectileCount; i++) {
            let projectile;
            let projectileDirection = direction.clone();
            
            // Add spread for shotgun-like weapons
            if (this.spread > 0) {
                const spreadAngle = (Math.random() - 0.5) * this.spread;
                const rotationMatrix = BABYLON.Matrix.RotationY(spreadAngle);
                projectileDirection = BABYLON.Vector3.TransformCoordinates(projectileDirection, rotationMatrix);
            }
            
            switch (this.projectileType) {
                case 'laser':
                    projectile = this.createLaser(scene, position, projectileDirection);
                    break;
                case 'arrow':
                    projectile = this.createArrow(scene, position, projectileDirection);
                    break;
                case 'rocket':
                    projectile = this.createRocket(scene, position, projectileDirection);
                    break;
                case 'energy':
                    projectile = this.createEnergyBlast(scene, position, projectileDirection);
                    break;
                case 'beam':
                    projectile = this.createBeam(scene, position, projectileDirection);
                    break;
                case 'bullet':
                    projectile = this.createBullet(scene, position, projectileDirection);
                    break;
                case 'magic':
                    projectile = this.createMagicOrb(scene, position, projectileDirection);
                    break;
                case 'elemental':
                    projectile = this.createElemental(scene, position, projectileDirection);
                    break;
                default:
                    projectile = this.createBasic(scene, position, projectileDirection);
            }
            
            projectile.weaponType = this.name;
            projectile.direction = projectileDirection;
            projectile.speed = this.speed;
            projectile.damage = this.damage;
            projectile.special = this.special;
            
            // Add trail effect
            if (this.trail) {
                this.addTrail(projectile);
            }
            
            projectiles.push(projectile);
        }
        
        return projectiles;
    }
    
    createLaser(scene, position, direction) {
        const laser = BABYLON.MeshBuilder.CreateCylinder("laser", 
            {height: 2, diameterTop: 0.1, diameterBottom: 0.1}, scene);
        laser.position = position.clone();
        laser.lookAt(position.add(direction));
        laser.rotation.x += Math.PI / 2;
        
        const material = new BABYLON.StandardMaterial("laserMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color.scale(0.8);
        material.disableLighting = true;
        laser.material = material;
        
        return laser;
    }
    
    createArrow(scene, position, direction) {
        const arrow = BABYLON.MeshBuilder.CreateCylinder("arrow", 
            {height: 1.5, diameterTop: 0.05, diameterBottom: 0.15}, scene);
        arrow.position = position.clone();
        
        // Set rotation based on direction instead of using lookAt
        const forward = direction.normalize();
        const up = new BABYLON.Vector3(0, 1, 0);
        const right = BABYLON.Vector3.Cross(up, forward);
        const correctedUp = BABYLON.Vector3.Cross(forward, right);
        arrow.rotation = BABYLON.Vector3.RotationFromAxis(right, correctedUp, forward);
        
        const material = new BABYLON.StandardMaterial("arrowMaterial", scene);
        material.diffuseColor = this.color || new BABYLON.Color3(0.6, 0.4, 0.2);
        arrow.material = material;
        
        // Add arrowhead
        const tip = BABYLON.MeshBuilder.CreateCone("arrowTip", 
            {height: 0.3, diameterBottom: 0.2}, scene);
        tip.position.y = 0.75;
        tip.parent = arrow;
        tip.material = material;
        
        return arrow;
    }
    
    createRocket(scene, position, direction) {
        const rocket = BABYLON.MeshBuilder.CreateCylinder("rocket", 
            {height: 1.2, diameterTop: 0.2, diameterBottom: 0.3}, scene);
        rocket.position = position.clone();
        rocket.lookAt(position.add(direction));
        rocket.rotation.x += Math.PI / 2;
        
        const material = new BABYLON.StandardMaterial("rocketMaterial", scene);
        material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        rocket.material = material;
        
        // Add flame trail
        const flame = BABYLON.MeshBuilder.CreateSphere("flame", {diameter: 0.4}, scene);
        flame.position.y = -0.8;
        flame.parent = rocket;
        
        const flameMaterial = new BABYLON.StandardMaterial("flameMaterial", scene);
        flameMaterial.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
        flameMaterial.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
        flame.material = flameMaterial;
        
        return rocket;
    }
    
    createEnergyBlast(scene, position, direction) {
        const energy = BABYLON.MeshBuilder.CreateSphere("energy", {diameter: this.size}, scene);
        energy.position = position.clone();
        
        const material = new BABYLON.StandardMaterial("energyMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color.scale(0.7);
        material.specularColor = new BABYLON.Color3(1, 1, 1);
        energy.material = material;
        
        return energy;
    }
    
    createBeam(scene, position, direction) {
        const beam = BABYLON.MeshBuilder.CreateCylinder("beam", 
            {height: 3, diameterTop: 0.05, diameterBottom: 0.05}, scene);
        beam.position = position.clone();
        beam.lookAt(position.add(direction));
        beam.rotation.x += Math.PI / 2;
        
        const material = new BABYLON.StandardMaterial("beamMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color;
        material.alpha = 0.8;
        material.disableLighting = true;
        beam.material = material;
        
        return beam;
    }
    
    createBullet(scene, position, direction) {
        const bullet = BABYLON.MeshBuilder.CreateSphere("bullet", {diameter: 0.3}, scene);
        bullet.position = position.clone();
        
        const material = new BABYLON.StandardMaterial("bulletMaterial", scene);
        material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.6);
        material.specularColor = new BABYLON.Color3(1, 1, 1);
        bullet.material = material;
        
        return bullet;
    }
    
    createMagicOrb(scene, position, direction) {
        const orb = BABYLON.MeshBuilder.CreateSphere("magicOrb", {diameter: this.size}, scene);
        orb.position = position.clone();
        
        const material = new BABYLON.StandardMaterial("magicMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color.scale(0.6);
        material.alpha = 0.9;
        orb.material = material;
        
        // Add sparkle effect
        for (let i = 0; i < 5; i++) {
            const sparkle = BABYLON.MeshBuilder.CreateSphere("sparkle", {diameter: 0.1}, scene);
            sparkle.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            sparkle.parent = orb;
            
            const sparkleMaterial = new BABYLON.StandardMaterial("sparkleMaterial", scene);
            sparkleMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
            sparkle.material = sparkleMaterial;
        }
        
        return orb;
    }
    
    createElemental(scene, position, direction) {
        const elemental = BABYLON.MeshBuilder.CreateSphere("elemental", {diameter: this.size}, scene);
        elemental.position = position.clone();
        
        const material = new BABYLON.StandardMaterial("elementalMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color.scale(0.5);
        elemental.material = material;
        
        // Add elemental particles
        for (let i = 0; i < 3; i++) {
            const particle = BABYLON.MeshBuilder.CreateSphere("particle", {diameter: 0.15}, scene);
            particle.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            );
            particle.parent = elemental;
            particle.material = material;
        }
        
        return elemental;
    }
    
    createBasic(scene, position, direction) {
        const basic = BABYLON.MeshBuilder.CreateSphere("basic", {diameter: this.size}, scene);
        basic.position = position.clone();
        
        const material = new BABYLON.StandardMaterial("basicMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color.scale(0.3);
        basic.material = material;
        
        return basic;
    }
    
    addTrail(projectile) {
        // Simple trail effect
        const trail = BABYLON.MeshBuilder.CreateSphere("trail", {diameter: 0.2}, projectile.getScene());
        trail.position = projectile.position.clone();
        trail.position.y -= 0.5;
        
        const trailMaterial = new BABYLON.StandardMaterial("trailMaterial", projectile.getScene());
        trailMaterial.diffuseColor = this.color.scale(0.5);
        trailMaterial.emissiveColor = this.color.scale(0.3);
        trailMaterial.alpha = 0.6;
        trail.material = trailMaterial;
        
        setTimeout(() => trail.dispose(), 500);
    }
}

function getWeaponConfig(weaponType) {
    const configs = {
        'Basic Blaster': new Weapon('Basic Blaster', { 
            speed: 2, damage: 20, color: new BABYLON.Color3(0, 1, 1), 
            projectileType: 'energy', size: 0.5 
        }),
        'Plasma Rifle': new Weapon('Plasma Rifle', { 
            speed: 2.5, damage: 25, color: new BABYLON.Color3(0, 1, 0.5), 
            projectileType: 'energy', size: 0.6, trail: true 
        }),
        'Lightning Gun': new Weapon('Lightning Gun', { 
            speed: 3, damage: 30, color: new BABYLON.Color3(1, 1, 0), 
            projectileType: 'beam', trail: true 
        }),
        'Fire Staff': new Weapon('Fire Staff', { 
            speed: 2.2, damage: 35, color: new BABYLON.Color3(1, 0, 0), 
            projectileType: 'elemental', size: 0.7 
        }),
        'Ice Cannon': new Weapon('Ice Cannon', { 
            speed: 1.8, damage: 25, color: new BABYLON.Color3(0.5, 0.8, 1), 
            projectileType: 'elemental', size: 0.8 
        }),
        'Freeze Gun': new Weapon('Freeze Gun', { 
            speed: 2.5, damage: 0, color: new BABYLON.Color3(0.7, 0.9, 1), 
            projectileType: 'elemental', size: 0.6 
        }),
        'Rocket Launcher': new Weapon('Rocket Launcher', { 
            speed: 1.5, damage: 50, color: new BABYLON.Color3(1, 0.5, 0), 
            projectileType: 'rocket', trail: true 
        }),
        'Grenade Launcher': new Weapon('Grenade Launcher', { 
            speed: 1.2, damage: 60, color: new BABYLON.Color3(0.8, 0.4, 0), 
            projectileType: 'rocket', spread: 0.2 
        }),
        'Laser Cannon': new Weapon('Laser Cannon', { 
            speed: 4, damage: 40, color: new BABYLON.Color3(1, 0, 0), 
            projectileType: 'laser', trail: true 
        }),
        'Photon Beam': new Weapon('Photon Beam', { 
            speed: 3.5, damage: 35, color: new BABYLON.Color3(1, 1, 1), 
            projectileType: 'beam' 
        }),
        'Quantum Blaster': new Weapon('Quantum Blaster', { 
            speed: 3, damage: 45, color: new BABYLON.Color3(0.5, 0, 1), 
            projectileType: 'energy', size: 0.8, trail: true 
        }),
        'Sonic Boom': new Weapon('Sonic Boom', { 
            speed: 2.8, damage: 32, color: new BABYLON.Color3(0.7, 0.7, 0.7), 
            projectileType: 'energy', spread: 0.3, projectileCount: 3 
        }),
        'Gravity Gun': new Weapon('Gravity Gun', { 
            speed: 2, damage: 38, color: new BABYLON.Color3(0.4, 0.2, 0.8), 
            projectileType: 'energy', size: 1.0 
        }),
        'Energy Sword': new Weapon('Energy Sword', { 
            speed: 1.5, damage: 55, color: new BABYLON.Color3(0, 1, 0), 
            projectileType: 'beam', size: 0.3 
        }),
        'Fusion Rifle': new Weapon('Fusion Rifle', { 
            speed: 2.3, damage: 42, color: new BABYLON.Color3(1, 0.8, 0), 
            projectileType: 'energy', trail: true 
        }),
        'Particle Beam': new Weapon('Particle Beam', { 
            speed: 3.2, damage: 36, color: new BABYLON.Color3(0.8, 0, 0.8), 
            projectileType: 'beam', trail: true 
        }),
        'Void Blaster': new Weapon('Void Blaster', { 
            speed: 2.1, damage: 48, color: new BABYLON.Color3(0.1, 0.1, 0.1), 
            projectileType: 'energy', size: 0.9 
        }),
        'Storm Caller': new Weapon('Storm Caller', { 
            speed: 2.7, damage: 33, color: new BABYLON.Color3(0.3, 0.3, 0.8), 
            projectileType: 'elemental', spread: 0.1, projectileCount: 2 
        }),
        'Sun Beam': new Weapon('Sun Beam', { 
            speed: 3.8, damage: 44, color: new BABYLON.Color3(1, 1, 0.3), 
            projectileType: 'laser', trail: true 
        }),
        'Moon Ray': new Weapon('Moon Ray', { 
            speed: 2.9, damage: 29, color: new BABYLON.Color3(0.7, 0.7, 0.9), 
            projectileType: 'beam' 
        }),
        'Star Shooter': new Weapon('Star Shooter', { 
            speed: 3.1, damage: 41, color: new BABYLON.Color3(1, 1, 0.8), 
            projectileType: 'energy', size: 0.4, projectileCount: 5, spread: 0.4 
        }),
        'Dragon Breath': new Weapon('Dragon Breath', { 
            speed: 2.4, damage: 52, color: new BABYLON.Color3(1, 0.3, 0), 
            projectileType: 'elemental', spread: 0.3, projectileCount: 3 
        }),
        'Phoenix Fire': new Weapon('Phoenix Fire', { 
            speed: 2.6, damage: 46, color: new BABYLON.Color3(1, 0.6, 0.1), 
            projectileType: 'elemental', trail: true 
        }),
        'Ice Storm': new Weapon('Ice Storm', { 
            speed: 2.2, damage: 28, color: new BABYLON.Color3(0.6, 0.9, 1), 
            projectileType: 'elemental', spread: 0.5, projectileCount: 4 
        }),
        'Thunder Strike': new Weapon('Thunder Strike', { 
            speed: 3.4, damage: 39, color: new BABYLON.Color3(0.9, 0.9, 0.2), 
            projectileType: 'beam', trail: true 
        }),
        'Wind Blade': new Weapon('Wind Blade', { 
            speed: 3.6, damage: 31, color: new BABYLON.Color3(0.8, 1, 0.8), 
            projectileType: 'beam', size: 0.2 
        }),
        'Earth Shaker': new Weapon('Earth Shaker', { 
            speed: 1.8, damage: 58, color: new BABYLON.Color3(0.6, 0.4, 0.2), 
            projectileType: 'rocket', size: 1.2 
        }),
        'Water Cannon': new Weapon('Water Cannon', { 
            speed: 2.5, damage: 26, color: new BABYLON.Color3(0.2, 0.6, 1), 
            projectileType: 'elemental', spread: 0.2 
        }),
        'Poison Dart': new Weapon('Poison Dart', { 
            speed: 2.8, damage: 22, color: new BABYLON.Color3(0.4, 0.8, 0.2), 
            projectileType: 'arrow', special: 'poison' 
        }),
        'Acid Sprayer': new Weapon('Acid Sprayer', { 
            speed: 2.1, damage: 34, color: new BABYLON.Color3(0.6, 1, 0.2), 
            projectileType: 'elemental', spread: 0.4, projectileCount: 3, special: 'poison' 
        }),
        'Venom Shot': new Weapon('Venom Shot', { 
            speed: 2.7, damage: 27, color: new BABYLON.Color3(0.5, 0.2, 0.8), 
            projectileType: 'energy', trail: true, special: 'poison' 
        }),
        'Crystal Gun': new Weapon('Crystal Gun', { 
            speed: 2.4, damage: 37, color: new BABYLON.Color3(0.9, 0.5, 0.9), 
            projectileType: 'energy', size: 0.4, projectileCount: 3, spread: 0.2 
        }),
        'Diamond Shooter': new Weapon('Diamond Shooter', { 
            speed: 3.3, damage: 43, color: new BABYLON.Color3(1, 1, 1), 
            projectileType: 'energy', trail: true 
        }),
        'Ruby Laser': new Weapon('Ruby Laser', { 
            speed: 2.9, damage: 40, color: new BABYLON.Color3(1, 0.2, 0.2), 
            projectileType: 'laser' 
        }),
        'Emerald Beam': new Weapon('Emerald Beam', { 
            speed: 2.6, damage: 35, color: new BABYLON.Color3(0.2, 1, 0.2), 
            projectileType: 'beam' 
        }),
        'Sapphire Blast': new Weapon('Sapphire Blast', { 
            speed: 2.8, damage: 38, color: new BABYLON.Color3(0.2, 0.2, 1), 
            projectileType: 'energy', size: 0.7 
        }),
        'Shadow Gun': new Weapon('Shadow Gun', { 
            speed: 3.2, damage: 41, color: new BABYLON.Color3(0.2, 0.2, 0.2), 
            projectileType: 'energy', trail: true 
        }),
        'Light Ray': new Weapon('Light Ray', { 
            speed: 4.2, damage: 36, color: new BABYLON.Color3(1, 1, 0.9), 
            projectileType: 'laser', trail: true 
        }),
        'Time Warp': new Weapon('Time Warp', { 
            speed: 1.9, damage: 49, color: new BABYLON.Color3(0.7, 0.3, 0.9), 
            projectileType: 'energy', size: 1.0 
        }),
        'Space Ripper': new Weapon('Space Ripper', { 
            speed: 3.5, damage: 47, color: new BABYLON.Color3(0.1, 0.1, 0.9), 
            projectileType: 'beam', trail: true 
        }),
        'Black Hole': new Weapon('Black Hole', { 
            speed: 1.3, damage: 65, color: new BABYLON.Color3(0.1, 0.1, 0.1), 
            projectileType: 'energy', size: 1.5 
        }),
        'Rainbow Beam': new Weapon('Rainbow Beam', { 
            speed: 2.7, damage: 33, color: new BABYLON.Color3(1, 0.5, 1), 
            projectileType: 'beam', trail: true 
        }),
        'Unicorn Horn': new Weapon('Unicorn Horn', { 
            speed: 2.9, damage: 44, color: new BABYLON.Color3(1, 0.8, 1), 
            projectileType: 'magic', trail: true 
        }),
        'Magic Wand': new Weapon('Magic Wand', { 
            speed: 2.2, damage: 39, color: new BABYLON.Color3(0.8, 0.4, 1), 
            projectileType: 'magic' 
        }),
        'Wizard Staff': new Weapon('Wizard Staff', { 
            speed: 2.1, damage: 51, color: new BABYLON.Color3(0.5, 0.2, 0.8), 
            projectileType: 'magic', size: 0.8 
        }),
        'Fairy Dust': new Weapon('Fairy Dust', { 
            speed: 3.7, damage: 24, color: new BABYLON.Color3(1, 0.9, 0.7), 
            projectileType: 'magic', spread: 0.6, projectileCount: 7 
        }),
        'Robot Zapper': new Weapon('Robot Zapper', { 
            speed: 2.8, damage: 42, color: new BABYLON.Color3(0.2, 0.8, 0.8), 
            projectileType: 'beam', trail: true 
        }),
        'Mech Buster': new Weapon('Mech Buster', { 
            speed: 2.3, damage: 56, color: new BABYLON.Color3(0.7, 0.2, 0.2), 
            projectileType: 'rocket', trail: true 
        }),
        'Cyber Shot': new Weapon('Cyber Shot', { 
            speed: 3.1, damage: 34, color: new BABYLON.Color3(0.3, 1, 0.3), 
            projectileType: 'energy', trail: true 
        }),
        'Data Stream': new Weapon('Data Stream', { 
            speed: 3.9, damage: 28, color: new BABYLON.Color3(0, 0.8, 1), 
            projectileType: 'beam', spread: 0.1, projectileCount: 3 
        }),
        'Code Cannon': new Weapon('Code Cannon', { 
            speed: 2.4, damage: 46, color: new BABYLON.Color3(0.5, 0.5, 1), 
            projectileType: 'energy', size: 0.6 
        })
    };
    return configs[weaponType] || configs['Basic Blaster'];
}

function updateGame(scene, camera) {
    // Movement with collision detection
    const speed = 0.3;
    
    // Keyboard movement
    if (gameState.keys['w']) {
        const forward = camera.getDirection(BABYLON.Vector3.Forward()).scale(speed);
        const newPosition = camera.position.add(forward);
        if (!checkCollisionAtPosition(scene, newPosition)) {
            camera.position.addInPlace(forward);
        }
    }
    if (gameState.keys['s']) {
        const backward = camera.getDirection(BABYLON.Vector3.Backward()).scale(speed);
        const newPosition = camera.position.add(backward);
        if (!checkCollisionAtPosition(scene, newPosition)) {
            camera.position.addInPlace(backward);
        }
    }
    if (gameState.keys['a']) {
        const left = camera.getDirection(BABYLON.Vector3.Left()).scale(speed);
        const newPosition = camera.position.add(left);
        if (!checkCollisionAtPosition(scene, newPosition)) {
            camera.position.addInPlace(left);
        }
    }
    if (gameState.keys['d']) {
        const right = camera.getDirection(BABYLON.Vector3.Right()).scale(speed);
        const newPosition = camera.position.add(right);
        if (!checkCollisionAtPosition(scene, newPosition)) {
            camera.position.addInPlace(right);
        }
    }
    
    // Mobile joystick movement
    if (gameState.mobileMovement) {
        const moveX = gameState.mobileMovement.x * speed;
        const moveY = -gameState.mobileMovement.y * speed; // Invert Y axis
        
        if (Math.abs(moveY) > 0.1) {
            const direction = moveY > 0 ? camera.getDirection(BABYLON.Vector3.Forward()) : camera.getDirection(BABYLON.Vector3.Backward());
            const movement = direction.scale(Math.abs(moveY));
            const newPosition = camera.position.add(movement);
            if (!checkCollisionAtPosition(scene, newPosition)) {
                camera.position.addInPlace(movement);
            }
        }
        
        if (Math.abs(moveX) > 0.1) {
            const direction = moveX > 0 ? camera.getDirection(BABYLON.Vector3.Right()) : camera.getDirection(BABYLON.Vector3.Left());
            const movement = direction.scale(Math.abs(moveX));
            const newPosition = camera.position.add(movement);
            if (!checkCollisionAtPosition(scene, newPosition)) {
                camera.position.addInPlace(movement);
            }
        }
    }
    
    // Jump mechanics
    if (gameState.keys[' '] && gameState.player.isOnGround) {
        gameState.player.velocity.y = gameState.player.jumpPower;
        gameState.player.isOnGround = false;
    }
    
    // Apply gravity
    const gravity = -0.8;
    gameState.player.velocity.y += gravity;
    
    // Apply vertical velocity
    camera.position.y += gameState.player.velocity.y * 0.1;
    
    // Ground collision
    const groundHeight = 6;
    if (camera.position.y <= groundHeight) {
        camera.position.y = groundHeight;
        gameState.player.velocity.y = 0;
        gameState.player.isOnGround = true;
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        projectile.position.addInPlace(projectile.direction.scale(projectile.speed));
        
        // Remove distant projectiles
        if (BABYLON.Vector3.Distance(projectile.position, camera.position) > 100) {
            projectile.dispose();
            gameState.projectiles.splice(i, 1);
        }
    }
    
    // Update buddy AI
    const currentTime = Date.now();
    if (gameState.buddy) {
        updateBuddy(scene, camera, currentTime);
    }
    
    // Update enemies  
    gameState.enemies.forEach(enemy => {
        // Fix broken enemies that might be missing properties
        if (typeof enemy.health !== 'number' || enemy.health <= 0) {
            if (enemy.isBoss) {
                enemy.health = 1000;
                enemy.maxHealth = 1000;
            } else {
                enemy.health = 60;
                enemy.maxHealth = 60;
            }
        }
        if (typeof enemy.speed !== 'number') {
            if (enemy.isBoss) {
                enemy.speed = 0.01;
                enemy.originalSpeed = 0.01;
            } else {
                enemy.speed = 0.02;
                enemy.originalSpeed = 0.02;
            }
        }
        if (enemy.isFrozen === undefined) {
            enemy.isFrozen = false;
        }
        if (enemy.isPoisoned === undefined) {
            enemy.isPoisoned = false;
        }
        
        // Check if enemy should unfreeze
        if (enemy.isFrozen && currentTime - enemy.freezeTime > 10000) {
            unfreezeEnemy(enemy);
        }
        
        // Handle poison damage over time
        if (enemy.isPoisoned) {
            if (currentTime - enemy.lastPoisonTick > 1000) { // Poison tick every second
                enemy.health -= enemy.poisonDamage;
                enemy.lastPoisonTick = currentTime;
                updateHealthBar(enemy);
                
                // Create poison damage effect
                createPoisonEffect(scene, enemy.position);
                
                // Check if enemy died from poison
                if (enemy.health <= 0) {
                    // Drop weapon before death animation
                    dropWeapon(scene, enemy.position);
                    
                    animateRobotDeath(scene, enemy, () => {
                        // Clean up enemy after death animation
                        enemy.dispose();
                        const index = gameState.enemies.indexOf(enemy);
                        if (index > -1) {
                            gameState.enemies.splice(index, 1);
                        }
                        
                        // Check if this was the boss
                        if (enemy.isBoss) {
                            alert("YOU WIN! You defeated the Giant Boss Robot!");
                            gameState.gameStarted = false; // End the game
                        } else {
                            // Increment kill counter only for regular enemies
                            gameState.killCount++;
                            
                            // Check for boss spawn
                            if (gameState.killCount >= 20 && !gameState.bossSpawned) {
                                gameState.bossSpawned = true;
                                setTimeout(() => createBossEnemy(scene), 2000);
                            } else {
                                // Spawn new enemy after delay
                                setTimeout(() => createEnemy(scene), 3000);
                            }
                        }
                    });
                    return;
                }
            }
        }
        
        // Skip AI if frozen
        if (enemy.isFrozen) return;
        
        const distance = BABYLON.Vector3.Distance(enemy.position, camera.position);
        
        // Robot AI: shoot if in range, otherwise move closer
        const shootCooldown = enemy.shootCooldown || 1500;
        if (distance < 15 && distance > 3 && currentTime - enemy.lastShot > shootCooldown) {
            // Face the player when shooting
            const shootDirection = camera.position.subtract(enemy.position).normalize();
            rotateEnemyTowards(enemy, shootDirection);
            
            // Shooting stance animation
            animateRobotShooting(enemy);
            
            // Shoot at player
            enemyShoot(scene, enemy, camera);
            playRobotShootSound(enemy, camera);
            enemy.lastShot = currentTime;
            enemy.isMoving = false;
        } else if (distance > 3) {
            // Move towards player with obstacle avoidance
            moveEnemyWithAvoidance(enemy, camera);
            // Play footstep sounds when moving
            playRobotFootstep(enemy, camera, distance);
        } else {
            // Close range - face player but don't move
            const faceDirection = camera.position.subtract(enemy.position).normalize();
            rotateEnemyTowards(enemy, faceDirection);
            enemy.isMoving = false;
            
            // Idle animation
            animateRobotIdle(enemy);
        }
        
        // Melee attack if very close
        if (distance < 3 && currentTime - enemy.lastAttack > 2000 && currentTime > gameState.player.invulnerableUntil) {
            gameState.player.health -= 15;
            enemy.lastAttack = currentTime;
            document.getElementById('health').textContent = gameState.player.health;
            
            if (gameState.player.health <= 0) {
                alert('Game Over! Refresh to play again.');
            }
        }
    });
    
    // Update buddy projectiles
    for (let i = gameState.buddyProjectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.buddyProjectiles[i];
        projectile.position.addInPlace(projectile.direction.scale(projectile.speed));
        
        // Check if hit enemies
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            
            // Skip if enemy is invalid or already being destroyed
            if (!enemy || !enemy.position || enemy.health <= 0) continue;
            
            const distance = BABYLON.Vector3.Distance(projectile.position, enemy.position);
            
            if (distance < 1.5) {
                // Buddy hit enemy
                createHitEffect(scene, enemy.position);
                playHitSound();
                
                // Remove projectile
                projectile.dispose();
                gameState.buddyProjectiles.splice(i, 1);
                
                // Damage enemy
                enemy.health -= projectile.damage;
                updateHealthBar(enemy);
                animateRobotHit(enemy);
                
                // Remove enemy if dead
                if (enemy.health <= 0) {
                    dropWeapon(scene, enemy.position);
                    animateRobotDeath(scene, enemy, () => {
                        enemy.dispose();
                        const index = gameState.enemies.indexOf(enemy);
                        if (index > -1) {
                            gameState.enemies.splice(index, 1);
                        }
                        
                        // Increment kill counter
                        gameState.killCount++;
                        
                        // Check for boss spawn
                        if (gameState.killCount >= 20 && !gameState.bossSpawned) {
                            gameState.bossSpawned = true;
                            setTimeout(() => createBossEnemy(scene), 2000);
                        } else {
                            setTimeout(() => createEnemy(scene), 3000);
                        }
                    });
                }
                break;
            }
        }
        
        // Remove distant projectiles
        if (BABYLON.Vector3.Distance(projectile.position, camera.position) > 100) {
            projectile.dispose();
            gameState.buddyProjectiles.splice(i, 1);
        }
    }
    
    // Update enemy projectiles
    for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.enemyProjectiles[i];
        projectile.position.addInPlace(projectile.direction.scale(projectile.speed));
        
        // Check if hit player
        const distanceToPlayer = BABYLON.Vector3.Distance(projectile.position, camera.position);
        if (distanceToPlayer < 1 && Date.now() > gameState.player.invulnerableUntil) {
            gameState.player.health -= projectile.damage;
            document.getElementById('health').textContent = gameState.player.health;
            
            // Create hit effect
            createHitEffect(scene, camera.position);
            
            // Remove projectile
            projectile.dispose();
            gameState.enemyProjectiles.splice(i, 1);
            
            if (gameState.player.health <= 0) {
                alert('Game Over! Refresh to play again.');
            }
        }
        // Check if hit buddy
        else if (gameState.buddy) {
            const distanceToBuddy = BABYLON.Vector3.Distance(projectile.position, gameState.buddy.position);
            if (distanceToBuddy < 1) {
                gameState.buddy.health -= projectile.damage;
                updateHealthBar(gameState.buddy);
                
                // Create hit effect
                createHitEffect(scene, gameState.buddy.position);
                playHitSound();
                
                // Remove projectile
                projectile.dispose();
                gameState.enemyProjectiles.splice(i, 1);
                
                // Check if buddy died
                if (gameState.buddy.health <= 0) {
                    animateRobotDeath(scene, gameState.buddy, () => {
                        gameState.buddy.dispose();
                        gameState.buddy = null;
                        document.getElementById('buddyStatus').textContent = 'Respawning...';
                        
                        // Respawn buddy after 10 seconds
                        setTimeout(() => {
                            if (gameState.gameStarted) {
                                createBuddy(scene);
                                document.getElementById('buddyStatus').textContent = 'Ready';
                            }
                        }, 10000);
                    });
                }
            }
        }
        // Remove distant projectiles
        else if (BABYLON.Vector3.Distance(projectile.position, camera.position) > 100) {
            projectile.dispose();
            gameState.enemyProjectiles.splice(i, 1);
        }
    }
    
    // Check collisions
    checkCollisions(scene);
    
    // Check weapon pickups
    for (let i = gameState.weaponDrops.length - 1; i >= 0; i--) {
        const drop = gameState.weaponDrops[i];
        const distance = BABYLON.Vector3.Distance(camera.position, drop.position);
        
        if (distance < 2) {
            // Pick up weapon
            if (!gameState.player.weapons.includes(drop.weaponName)) {
                gameState.player.weapons.push(drop.weaponName);
                gameState.player.weaponsCollected++;
                
                // Update UI
                document.getElementById('weaponCount').textContent = 
                    gameState.player.weaponsCollected + '/50';
                
                // Switch to new weapon
                gameState.player.currentWeapon = gameState.player.weapons.length - 1;
                document.getElementById('currentWeapon').textContent = drop.weaponName;
                document.getElementById('weaponDescription').textContent = getWeaponDescription(drop.weaponName);
            }
            
            // Remove pickup
            drop.dispose();
            gameState.weaponDrops.splice(i, 1);
        }
    }
    
    // Check chest interactions
    for (let i = 0; i < gameState.weaponChests.length; i++) {
        const chest = gameState.weaponChests[i];
        const distance = BABYLON.Vector3.Distance(camera.position, chest.position);
        
        if (distance < 4) {
            // Show interaction prompt
            if (!gameState.chestPromptShown) {
                showChestPrompt(chest);
                gameState.chestPromptShown = true;
            }
            
            // Handle interaction (press E key or mobile button)
            if (gameState.keys['e'] || gameState.chestInteract) {
                openChestInterface(chest);
                gameState.keys['e'] = false;
                gameState.chestInteract = false;
            }
        } else {
            hideChestPrompt();
            gameState.chestPromptShown = false;
        }
    }
    
    // Update UI
    document.getElementById('enemyCount').textContent = gameState.enemies.length;
    document.getElementById('killCount').textContent = gameState.killCount;
}

function showChestPrompt(chest) {
    // Show interaction hint
    let prompt = document.getElementById('chestPrompt');
    if (!prompt) {
        prompt = document.createElement('div');
        prompt.id = 'chestPrompt';
        prompt.style.position = 'fixed';
        prompt.style.top = '40%';
        prompt.style.left = '50%';
        prompt.style.transform = 'translate(-50%, -50%)';
        prompt.style.background = 'rgba(0,0,0,0.8)';
        prompt.style.color = 'white';
        prompt.style.padding = '15px 20px';
        prompt.style.borderRadius = '10px';
        prompt.style.fontSize = '18px';
        prompt.style.zIndex = '999';
        prompt.style.textAlign = 'center';
        prompt.style.border = '2px solid #4ecdc4';
        document.body.appendChild(prompt);
    }
    
    const weaponCount = chest.storedWeapons.length;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    prompt.innerHTML = `
        <div>💎 Weapon Chest</div>
        <div style="font-size: 14px; margin-top: 5px;">
            ${weaponCount} weapon${weaponCount !== 1 ? 's' : ''} stored
        </div>
        <div style="font-size: 14px; margin-top: 10px;">
            ${isMobile ? 'Tap chest button to interact' : 'Press [E] to interact'}
        </div>
    `;
    prompt.style.display = 'block';
    
    // Show mobile chest button
    if (isMobile) {
        document.getElementById('chestInteractButton').style.display = 'block';
    }
}

function hideChestPrompt() {
    const prompt = document.getElementById('chestPrompt');
    if (prompt) {
        prompt.style.display = 'none';
    }
    
    // Hide mobile chest button
    document.getElementById('chestInteractButton').style.display = 'none';
}

function openChestInterface(chest) {
    gameState.activeChest = chest;
    
    // Create chest interface
    let chestUI = document.getElementById('chestInterface');
    if (!chestUI) {
        chestUI = document.createElement('div');
        chestUI.id = 'chestInterface';
        chestUI.style.position = 'fixed';
        chestUI.style.top = '50%';
        chestUI.style.left = '50%';
        chestUI.style.transform = 'translate(-50%, -50%)';
        chestUI.style.background = 'rgba(0,0,0,0.95)';
        chestUI.style.color = 'white';
        chestUI.style.padding = '20px';
        chestUI.style.borderRadius = '15px';
        chestUI.style.fontSize = '16px';
        chestUI.style.zIndex = '1001';
        chestUI.style.minWidth = '400px';
        chestUI.style.maxWidth = '600px';
        chestUI.style.border = '3px solid #4ecdc4';
        chestUI.style.boxShadow = '0 0 20px rgba(78, 205, 196, 0.5)';
        document.body.appendChild(chestUI);
    }
    
    updateChestInterface(chest);
    chestUI.style.display = 'block';
    
    // Pause game while chest is open
    gameState.gameStarted = false;
}

function updateChestInterface(chest) {
    const chestUI = document.getElementById('chestInterface');
    if (!chestUI) return;
    
    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #4ecdc4;">💎 Weapon Chest ${chest.id + 1}</h2>
        </div>
        
        <div style="display: flex; gap: 20px;">
            <!-- Your Weapons -->
            <div style="flex: 1;">
                <h3 style="color: #ffd700; margin-bottom: 10px;">Your Weapons:</h3>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">
    `;
    
    for (let i = 0; i < gameState.player.weapons.length; i++) {
        const weapon = gameState.player.weapons[i];
        const isCurrentWeapon = i === gameState.player.currentWeapon;
        html += `
            <div style="margin: 5px 0; padding: 8px; background: ${isCurrentWeapon ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255,255,255,0.1)'}; border-radius: 5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="storeWeapon(${i})">
                <span>${weapon} ${isCurrentWeapon ? '(equipped)' : ''}</span>
                <button style="background: #ff6b6b; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Store</button>
            </div>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <!-- Stored Weapons -->
            <div style="flex: 1;">
                <h3 style="color: #90EE90; margin-bottom: 10px;">Stored Weapons:</h3>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">
    `;
    
    if (chest.storedWeapons.length === 0) {
        html += '<div style="text-align: center; color: #888;">No weapons stored</div>';
    } else {
        for (let i = 0; i < chest.storedWeapons.length; i++) {
            const weapon = chest.storedWeapons[i];
            html += `
                <div style="margin: 5px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="retrieveWeapon(${i})">
                    <span>${weapon}</span>
                    <button style="background: #4ecdc4; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Take</button>
                </div>
            `;
        }
    }
    
    html += `
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="closeChestInterface()" style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px;">Close Chest</button>
        </div>
    `;
    
    chestUI.innerHTML = html;
}

function storeWeapon(weaponIndex) {
    const chest = gameState.activeChest;
    if (!chest || weaponIndex === gameState.player.currentWeapon) {
        // Can't store currently equipped weapon
        return;
    }
    
    const weapon = gameState.player.weapons[weaponIndex];
    
    // Move weapon from player to chest
    chest.storedWeapons.push(weapon);
    gameState.player.weapons.splice(weaponIndex, 1);
    gameState.player.weaponsCollected--;
    
    // Adjust current weapon index if needed
    if (gameState.player.currentWeapon > weaponIndex) {
        gameState.player.currentWeapon--;
    } else if (gameState.player.currentWeapon === weaponIndex) {
        gameState.player.currentWeapon = 0; // Default to first weapon
    }
    
    // Update UI
    const currentWeaponName = gameState.player.weapons[gameState.player.currentWeapon];
    document.getElementById('currentWeapon').textContent = currentWeaponName;
    document.getElementById('weaponDescription').textContent = getWeaponDescription(currentWeaponName);
    document.getElementById('weaponCount').textContent = gameState.player.weaponsCollected + '/50';
    
    // Update chest indicator
    updateChestIndicator(chest);
    updateChestInterface(chest);
}

function retrieveWeapon(weaponIndex) {
    const chest = gameState.activeChest;
    if (!chest) return;
    
    const weapon = chest.storedWeapons[weaponIndex];
    
    // Check if player already has this weapon
    if (gameState.player.weapons.includes(weapon)) {
        return; // Player already has this weapon
    }
    
    // Move weapon from chest to player
    gameState.player.weapons.push(weapon);
    gameState.player.weaponsCollected++;
    chest.storedWeapons.splice(weaponIndex, 1);
    
    // Update UI
    document.getElementById('weaponCount').textContent = gameState.player.weaponsCollected + '/50';
    
    // Update chest indicator
    updateChestIndicator(chest);
    updateChestInterface(chest);
}

function closeChestInterface() {
    const chestUI = document.getElementById('chestInterface');
    if (chestUI) {
        chestUI.style.display = 'none';
    }
    
    gameState.activeChest = null;
    gameState.gameStarted = true; // Resume game
}

function updateChestIndicator(chest) {
    if (chest.storedWeapons.length > 0) {
        // Green glow when chest has items
        chest.indicator.material.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.1);
        chest.indicator.material.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    } else {
        // Dim when empty
        chest.indicator.material.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        chest.indicator.material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    }
}

function checkCollisions(scene) {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            
            // Skip if enemy is invalid or already being destroyed
            if (!enemy || !enemy.position || enemy.health <= 0) continue;
            
            const distance = BABYLON.Vector3.Distance(projectile.position, enemy.position);
            
            if (distance < 1.5) {
                // Create hit effect
                createHitEffect(scene, enemy.position);
                playHitSound();
                
                // Remove projectile
                projectile.dispose();
                gameState.projectiles.splice(i, 1);
                
                // Hit enemy
                if (projectile.weaponType === 'Freeze Gun') {
                    // Freeze the enemy (doesn't damage)
                    freezeEnemy(enemy);
                } else if (projectile.special === 'poison') {
                    // Apply poison effect
                    enemy.health -= projectile.damage; // Initial damage
                    updateHealthBar(enemy);
                    poisonEnemy(enemy, projectile.damage);
                    // Add hit animation
                    animateRobotHit(enemy);
                    
                    // Remove enemy if dead
                    if (enemy.health <= 0) {
                        // Drop weapon before death animation
                        dropWeapon(scene, enemy.position);
                        
                        animateRobotDeath(scene, enemy, () => {
                            // Clean up enemy after death animation
                            enemy.dispose();
                            const index = gameState.enemies.indexOf(enemy);
                            if (index > -1) {
                                gameState.enemies.splice(index, 1);
                            }
                            
                            // Check if this was the boss
                            if (enemy.isBoss) {
                                alert("YOU WIN! You defeated the Giant Boss Robot!");
                                gameState.gameStarted = false; // End the game
                            } else {
                                // Increment kill counter only for regular enemies
                                gameState.killCount++;
                                
                                // Check for boss spawn
                                if (gameState.killCount >= 20 && !gameState.bossSpawned) {
                                    gameState.bossSpawned = true;
                                    setTimeout(() => createBossEnemy(scene), 2000);
                                } else {
                                    // Spawn new enemy after delay
                                    setTimeout(() => createEnemy(scene), 3000);
                                }
                            }
                        });
                    }
                } else {
                    enemy.health -= projectile.damage;
                    updateHealthBar(enemy);
                    // Add hit animation
                    animateRobotHit(enemy);
                    
                    // Remove enemy if dead
                    if (enemy.health <= 0) {
                        // Drop weapon before death animation
                        dropWeapon(scene, enemy.position);
                        
                        animateRobotDeath(scene, enemy, () => {
                            // Clean up enemy after death animation
                            enemy.dispose();
                            const index = gameState.enemies.indexOf(enemy);
                            if (index > -1) {
                                gameState.enemies.splice(index, 1);
                            }
                            
                            // Check if this was the boss
                            if (enemy.isBoss) {
                                alert("YOU WIN! You defeated the Giant Boss Robot!");
                                gameState.gameStarted = false; // End the game
                            } else {
                                // Increment kill counter only for regular enemies
                                gameState.killCount++;
                                
                                // Check for boss spawn
                                if (gameState.killCount >= 20 && !gameState.bossSpawned) {
                                    gameState.bossSpawned = true;
                                    setTimeout(() => createBossEnemy(scene), 2000);
                                } else {
                                    // Spawn new enemy after delay
                                    setTimeout(() => createEnemy(scene), 3000);
                                }
                            }
                        });
                    }
                }
                break;
            }
        }
    }
}

function createHitEffect(scene, position) {
    const effect = BABYLON.MeshBuilder.CreateSphere("effect", {diameter: 2}, scene);
    effect.position = position.clone();
    
    const material = new BABYLON.StandardMaterial("effectMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(1, 1, 0);
    material.emissiveColor = new BABYLON.Color3(1, 1, 0);
    effect.material = material;
    
    setTimeout(() => effect.dispose(), 200);
}

function enemyShoot(scene, enemy, camera) {
    const diameter = enemy.isBoss ? 0.8 : 0.4; // Bigger projectiles for boss
    const projectile = BABYLON.MeshBuilder.CreateSphere("enemyProjectile", {diameter: diameter}, scene);
    projectile.position = enemy.position.clone();
    projectile.position.y += enemy.isBoss ? 3 : 1; // Higher spawn point for bigger boss
    
    // Calculate direction to player
    projectile.direction = camera.position.subtract(enemy.position).normalize();
    projectile.speed = enemy.isBoss ? 2.5 : 1.5; // Faster projectiles for boss
    projectile.damage = enemy.isBoss ? 25 : 8; // Much more damage for boss
    
    // Different colors for boss vs regular enemy projectiles
    const material = new BABYLON.StandardMaterial("enemyProjectileMaterial", scene);
    if (enemy.isBoss) {
        material.diffuseColor = new BABYLON.Color3(1, 0, 1); // Purple for boss
        material.emissiveColor = new BABYLON.Color3(1, 0, 1);
    } else {
        material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2); // Red for regular enemies
        material.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
    }
    projectile.material = material;
    
    gameState.enemyProjectiles.push(projectile);
}

function moveEnemyWithAvoidance(enemy, camera) {
    // Simple obstacle avoidance - cast rays to detect obstacles
    const desiredDirection = camera.position.subtract(enemy.position).normalize();
    const currentPos = enemy.position;
    
    // Check for obstacles in front
    const frontRay = new BABYLON.Ray(currentPos, desiredDirection);
    const hit = enemy.getScene().pickWithRay(frontRay, (mesh) => {
        return mesh.name.includes('rock') || mesh.name.includes('trunk');
    });
    
    let moveDirection = desiredDirection;
    
    if (hit.hit && hit.distance < 4) {
        // Obstacle detected, try to go around it
        const avoidanceAngle = Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2;
        const avoidDirection = new BABYLON.Vector3(
            desiredDirection.x * Math.cos(avoidanceAngle) - desiredDirection.z * Math.sin(avoidanceAngle),
            0,
            desiredDirection.x * Math.sin(avoidanceAngle) + desiredDirection.z * Math.cos(avoidanceAngle)
        ).normalize();
        
        moveDirection = avoidDirection;
    }
    
    // Rotate enemy to face movement direction
    rotateEnemyTowards(enemy, moveDirection);
    
    // Set moving state for animation
    enemy.isMoving = true;
    enemy.lastDirection = moveDirection;
    
    // Move the enemy
    enemy.position.addInPlace(moveDirection.scale(enemy.speed));
    
    // Animate walking
    animateRobotWalking(enemy);
    
    // Play footstep sound based on distance to player
    const distanceToPlayer = BABYLON.Vector3.Distance(enemy.position, camera.position);
    if (distanceToPlayer < 20) { // Only play if close enough to hear
        playRobotFootstep(enemy, camera, distanceToPlayer);
    }
}

function rotateEnemyTowards(enemy, direction) {
    // Calculate the angle to face the direction
    const angle = Math.atan2(direction.x, direction.z);
    enemy.rotation.y = angle;
}

function animateRobotWalking(enemy) {
    if (!enemy.robotParts) return;
    
    // Increment animation time
    enemy.animationTime += 0.15;
    
    // Animate legs walking
    const legSwing = Math.sin(enemy.animationTime) * 0.3;
    const armSwing = Math.sin(enemy.animationTime + Math.PI) * 0.2; // Arms opposite to legs
    
    if (enemy.robotParts.leftLeg) {
        enemy.robotParts.leftLeg.rotation.x = legSwing;
    }
    if (enemy.robotParts.rightLeg) {
        enemy.robotParts.rightLeg.rotation.x = -legSwing;
    }
    if (enemy.robotParts.leftArm) {
        enemy.robotParts.leftArm.rotation.x = armSwing;
    }
    if (enemy.robotParts.rightArm) {
        enemy.robotParts.rightArm.rotation.x = -armSwing;
    }
    
    // Slight head bob while walking
    if (enemy.robotParts.head) {
        enemy.robotParts.head.position.y = 1.5 + Math.sin(enemy.animationTime * 2) * 0.05;
    }
    
    // Make antenna wiggle
    if (enemy.robotParts.antenna) {
        enemy.robotParts.antenna.rotation.z = Math.sin(enemy.animationTime * 1.5) * 0.1;
    }
}

function animateRobotShooting(enemy) {
    if (!enemy.robotParts) return;
    
    // Shooting stance - raise arms and point toward target
    if (enemy.robotParts.rightArm) {
        enemy.robotParts.rightArm.rotation.x = -0.5; // Point arm forward
        enemy.robotParts.rightArm.rotation.z = -0.2;
    }
    if (enemy.robotParts.leftArm) {
        enemy.robotParts.leftArm.rotation.x = -0.3; // Support arm
    }
    
    // Eyes flash more intensely when shooting
    enemy.animationTime += 0.3;
    if (enemy.robotParts.leftEye && enemy.robotParts.rightEye) {
        const intensity = 1 + Math.sin(enemy.animationTime * 5) * 0.5;
        enemy.robotParts.leftEye.material.emissiveColor = new BABYLON.Color3(intensity, 0, 0);
        enemy.robotParts.rightEye.material.emissiveColor = new BABYLON.Color3(intensity, 0, 0);
    }
    
    // Reset legs to standing position
    if (enemy.robotParts.leftLeg) {
        enemy.robotParts.leftLeg.rotation.x = 0;
    }
    if (enemy.robotParts.rightLeg) {
        enemy.robotParts.rightLeg.rotation.x = 0;
    }
}

function animateRobotIdle(enemy) {
    if (!enemy.robotParts) return;
    
    // Gentle idle animation
    enemy.animationTime += 0.05;
    
    // Subtle breathing-like motion
    const breathe = Math.sin(enemy.animationTime) * 0.02;
    if (enemy.robotParts.head) {
        enemy.robotParts.head.position.y = 1.5 + breathe;
    }
    
    // Arms relaxed at sides
    if (enemy.robotParts.leftArm) {
        enemy.robotParts.leftArm.rotation.x = breathe * 0.5;
        enemy.robotParts.leftArm.rotation.z = 0;
    }
    if (enemy.robotParts.rightArm) {
        enemy.robotParts.rightArm.rotation.x = -breathe * 0.5;
        enemy.robotParts.rightArm.rotation.z = 0;
    }
    
    // Legs stable
    if (enemy.robotParts.leftLeg) {
        enemy.robotParts.leftLeg.rotation.x = 0;
    }
    if (enemy.robotParts.rightLeg) {
        enemy.robotParts.rightLeg.rotation.x = 0;
    }
    
    // Antenna slowly rotates
    if (enemy.robotParts.antenna) {
        enemy.robotParts.antenna.rotation.y = enemy.animationTime * 0.5;
    }
    
    // Eyes dim and brighten slowly
    if (enemy.robotParts.leftEye && enemy.robotParts.rightEye) {
        const eyeGlow = 0.8 + Math.sin(enemy.animationTime * 0.7) * 0.2;
        enemy.robotParts.leftEye.material.emissiveColor = new BABYLON.Color3(eyeGlow, 0, 0);
        enemy.robotParts.rightEye.material.emissiveColor = new BABYLON.Color3(eyeGlow, 0, 0);
    }
}

function animateRobotHit(enemy) {
    if (!enemy.robotParts || enemy.isAnimating) return;
    
    enemy.isAnimating = true;
    
    // Flash red and shake
    const originalColor = enemy.material.diffuseColor.clone();
    const hitColor = new BABYLON.Color3(1, 0.3, 0.3);
    
    // Change to hit color
    enemy.material.diffuseColor = hitColor;
    if (enemy.robotParts.head) {
        enemy.robotParts.head.material.diffuseColor = hitColor;
    }
    
    // Shake animation
    const originalPosition = enemy.position.clone();
    let shakeCount = 0;
    const shakeInterval = setInterval(() => {
        if (shakeCount < 6) {
            enemy.position.x = originalPosition.x + (Math.random() - 0.5) * 0.4;
            enemy.position.z = originalPosition.z + (Math.random() - 0.5) * 0.4;
            shakeCount++;
        } else {
            clearInterval(shakeInterval);
            enemy.position = originalPosition;
            
            // Restore original color
            enemy.material.diffuseColor = originalColor;
            if (enemy.robotParts.head) {
                enemy.robotParts.head.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
            }
            
            enemy.isAnimating = false;
        }
    }, 50);
}

function animateRobotDeath(scene, enemy, callback) {
    if (!enemy.robotParts || enemy.isDying) return;
    
    enemy.isDying = true;
    enemy.speed = 0; // Stop moving
    
    // Create explosion effect
    const explosion = BABYLON.MeshBuilder.CreateSphere("explosion", {diameter: 6}, scene);
    explosion.position = enemy.position.clone();
    explosion.position.y += 1;
    
    const explosionMaterial = new BABYLON.StandardMaterial("explosionMaterial", scene);
    explosionMaterial.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    explosionMaterial.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
    explosion.material = explosionMaterial;
    
    // Animate explosion growing and fading
    let explosionScale = 0.1;
    const explosionInterval = setInterval(() => {
        explosionScale += 0.3;
        explosion.scaling = new BABYLON.Vector3(explosionScale, explosionScale, explosionScale);
        
        // Fade out
        explosionMaterial.alpha = Math.max(0, 1 - explosionScale / 4);
        
        if (explosionScale > 4) {
            clearInterval(explosionInterval);
            explosion.dispose();
        }
    }, 50);
    
    // Animate robot parts flying away
    const parts = [enemy, enemy.robotParts.head, enemy.robotParts.leftArm, enemy.robotParts.rightArm];
    
    parts.forEach((part, index) => {
        if (!part) return;
        
        // Random direction and rotation for each part
        const flyDirection = new BABYLON.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() + 0.5,
            (Math.random() - 0.5) * 2
        );
        
        const rotationSpeed = new BABYLON.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        
        let animationTime = 0;
        const partInterval = setInterval(() => {
            if (animationTime < 30) {
                // Fly away and spin
                part.position.addInPlace(flyDirection.scale(0.2));
                flyDirection.y -= 0.03; // Gravity
                
                part.rotation.addInPlace(rotationSpeed);
                
                // Fade out
                if (part.material) {
                    part.material.alpha = Math.max(0, 1 - animationTime / 30);
                }
                
                animationTime++;
            } else {
                clearInterval(partInterval);
                if (index === 0) {
                    // Main body is last, trigger callback
                    setTimeout(callback, 100);
                }
            }
        }, 50);
    });
}

function checkCollisionAtPosition(scene, position) {
    // Check collision with rocks and trees
    const meshes = scene.meshes;
    for (let mesh of meshes) {
        if (mesh.name.includes('rock') || mesh.name.includes('trunk')) {
            const distance = BABYLON.Vector3.Distance(position, mesh.position);
            const collisionRadius = mesh.scaling.x + 1.5; // Add player radius
            if (distance < collisionRadius) {
                return true; // Collision detected
            }
        }
    }
    return false; // No collision
}

function freezeEnemy(enemy) {
    if (enemy.isFrozen) return;
    
    enemy.isFrozen = true;
    enemy.freezeTime = Date.now();
    enemy.speed = 0; // Stop moving
    
    // Change appearance to ice blue
    const iceMaterial = new BABYLON.StandardMaterial("iceMaterial", enemy.getScene());
    iceMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.9, 1);
    iceMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.3, 0.5);
    iceMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    
    // Store original materials
    enemy.originalMaterials = {
        body: enemy.material,
        head: enemy.robotParts.head.material,
        leftArm: enemy.robotParts.leftArm.material,
        rightArm: enemy.robotParts.rightArm.material,
        leftLeg: enemy.robotParts.leftLeg ? enemy.robotParts.leftLeg.material : null,
        rightLeg: enemy.robotParts.rightLeg ? enemy.robotParts.rightLeg.material : null,
        leftFoot: enemy.robotParts.leftFoot ? enemy.robotParts.leftFoot.material : null,
        rightFoot: enemy.robotParts.rightFoot ? enemy.robotParts.rightFoot.material : null
    };
    
    // Apply ice material to all parts
    enemy.material = iceMaterial;
    enemy.robotParts.head.material = iceMaterial;
    enemy.robotParts.leftArm.material = iceMaterial;
    enemy.robotParts.rightArm.material = iceMaterial;
    if (enemy.robotParts.leftLeg) enemy.robotParts.leftLeg.material = iceMaterial;
    if (enemy.robotParts.rightLeg) enemy.robotParts.rightLeg.material = iceMaterial;
    if (enemy.robotParts.leftFoot) enemy.robotParts.leftFoot.material = iceMaterial;
    if (enemy.robotParts.rightFoot) enemy.robotParts.rightFoot.material = iceMaterial;
    
    // Create ice crystals effect
    const crystals = BABYLON.MeshBuilder.CreateBox("crystals", {size: 3}, enemy.getScene());
    crystals.position = enemy.position.clone();
    crystals.position.y += 1;
    crystals.material = iceMaterial;
    crystals.scaling = new BABYLON.Vector3(1.2, 1.5, 1.2);
    crystals.parent = enemy;
    enemy.iceCrystals = crystals;
}

function unfreezeEnemy(enemy) {
    enemy.isFrozen = false;
    enemy.speed = enemy.originalSpeed;
    
    // Restore original materials
    if (enemy.originalMaterials) {
        enemy.material = enemy.originalMaterials.body;
        enemy.robotParts.head.material = enemy.originalMaterials.head;
        enemy.robotParts.leftArm.material = enemy.originalMaterials.leftArm;
        enemy.robotParts.rightArm.material = enemy.originalMaterials.rightArm;
        if (enemy.originalMaterials.leftLeg && enemy.robotParts.leftLeg) {
            enemy.robotParts.leftLeg.material = enemy.originalMaterials.leftLeg;
        }
        if (enemy.originalMaterials.rightLeg && enemy.robotParts.rightLeg) {
            enemy.robotParts.rightLeg.material = enemy.originalMaterials.rightLeg;
        }
        if (enemy.originalMaterials.leftFoot && enemy.robotParts.leftFoot) {
            enemy.robotParts.leftFoot.material = enemy.originalMaterials.leftFoot;
        }
        if (enemy.originalMaterials.rightFoot && enemy.robotParts.rightFoot) {
            enemy.robotParts.rightFoot.material = enemy.originalMaterials.rightFoot;
        }
    }
    
    // Remove ice crystals
    if (enemy.iceCrystals) {
        enemy.iceCrystals.dispose();
        enemy.iceCrystals = null;
    }
    
    // Melt effect
    createMeltEffect(enemy.getScene(), enemy.position);
}

function createMeltEffect(scene, position) {
    const melt = BABYLON.MeshBuilder.CreateSphere("melt", {diameter: 3}, scene);
    melt.position = position.clone();
    melt.position.y += 1;
    
    const meltMaterial = new BABYLON.StandardMaterial("meltMaterial", scene);
    meltMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
    meltMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.5, 0.8);
    melt.material = meltMaterial;
    
    // Animate melting
    let scale = 1;
    const meltInterval = setInterval(() => {
        scale -= 0.1;
        melt.scaling = new BABYLON.Vector3(scale, scale, scale);
        meltMaterial.alpha = scale;
        
        if (scale <= 0) {
            clearInterval(meltInterval);
            melt.dispose();
        }
    }, 100);
}

function poisonEnemy(enemy, baseDamage) {
    if (enemy.isPoisoned) return; // Already poisoned
    
    enemy.isPoisoned = true;
    enemy.poisonTime = Date.now();
    enemy.poisonDamage = Math.floor(baseDamage * 0.3); // 30% of initial damage per second
    enemy.lastPoisonTick = Date.now();
    
    // Poison lasts forever - no auto-cure
    
    // Change appearance to show poisoned state
    const poisonMaterial = new BABYLON.StandardMaterial("poisonMaterial", enemy.getScene());
    poisonMaterial.diffuseColor = new BABYLON.Color3(0.6, 1, 0.2);
    poisonMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.1);
    
    // Store original materials if not already stored
    if (!enemy.originalMaterials) {
        enemy.originalMaterials = {
            body: enemy.material,
            head: enemy.robotParts.head.material,
            leftArm: enemy.robotParts.leftArm.material,
            rightArm: enemy.robotParts.rightArm.material
        };
    }
    
    // Apply poison material to all parts
    enemy.material = poisonMaterial;
    enemy.robotParts.head.material = poisonMaterial;
    enemy.robotParts.leftArm.material = poisonMaterial;
    enemy.robotParts.rightArm.material = poisonMaterial;
    
    // Create poison cloud effect
    const poisonCloud = BABYLON.MeshBuilder.CreateSphere("poisonCloud", {diameter: 3}, enemy.getScene());
    poisonCloud.position = enemy.position.clone();
    poisonCloud.position.y += 2;
    poisonCloud.material = poisonMaterial;
    poisonCloud.material.alpha = 0.3;
    poisonCloud.parent = enemy;
    enemy.poisonCloud = poisonCloud;
}

function curePoison(enemy) {
    enemy.isPoisoned = false;
    enemy.poisonDamage = 0;
    enemy.poisonTime = 0;
    enemy.lastPoisonTick = 0;
    
    // Restore original materials
    if (enemy.originalMaterials) {
        enemy.material = enemy.originalMaterials.body;
        enemy.robotParts.head.material = enemy.originalMaterials.head;
        enemy.robotParts.leftArm.material = enemy.originalMaterials.leftArm;
        enemy.robotParts.rightArm.material = enemy.originalMaterials.rightArm;
    }
    
    // Remove poison cloud
    if (enemy.poisonCloud) {
        enemy.poisonCloud.dispose();
        enemy.poisonCloud = null;
    }
    
    // Create cure effect
    createCureEffect(enemy.getScene(), enemy.position);
}

function createPoisonEffect(scene, position) {
    const effect = BABYLON.MeshBuilder.CreateSphere("poisonEffect", {diameter: 1}, scene);
    effect.position = position.clone();
    effect.position.y += 2;
    
    const material = new BABYLON.StandardMaterial("poisonEffectMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0.4, 0.8, 0.2);
    material.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.1);
    material.alpha = 0.7;
    effect.material = material;
    
    // Animate expanding and fading
    let scale = 0.5;
    const effectInterval = setInterval(() => {
        scale += 0.1;
        effect.scaling = new BABYLON.Vector3(scale, scale, scale);
        material.alpha = Math.max(0, 0.7 - scale * 0.3);
        
        if (scale > 2) {
            clearInterval(effectInterval);
            effect.dispose();
        }
    }, 50);
}

function createCureEffect(scene, position) {
    const cure = BABYLON.MeshBuilder.CreateSphere("cure", {diameter: 2}, scene);
    cure.position = position.clone();
    cure.position.y += 1;
    
    const cureMaterial = new BABYLON.StandardMaterial("cureMaterial", scene);
    cureMaterial.diffuseColor = new BABYLON.Color3(0.8, 1, 0.8);
    cureMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.6, 0.4);
    cure.material = cureMaterial;
    
    // Animate shrinking and fading
    let scale = 1;
    const cureInterval = setInterval(() => {
        scale -= 0.1;
        cure.scaling = new BABYLON.Vector3(scale, scale, scale);
        cureMaterial.alpha = scale;
        
        if (scale <= 0) {
            clearInterval(cureInterval);
            cure.dispose();
        }
    }, 100);
}

function initializeSounds(scene) {
    // Create audio context for sound effects (using Web Audio API)
    try {
        gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log("Web Audio API not supported");
        return;
    }
}

function createBeepSound(frequency, duration, volume = 0.1) {
    if (!gameState.audioContext) return;
    
    const oscillator = gameState.audioContext.createOscillator();
    const gainNode = gameState.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(gameState.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, gameState.audioContext.currentTime);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, gameState.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, gameState.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, gameState.audioContext.currentTime + duration);
    
    oscillator.start(gameState.audioContext.currentTime);
    oscillator.stop(gameState.audioContext.currentTime + duration);
}

function playRobotFootstep(enemy, camera, distance) {
    // Only play footstep every 500ms to avoid spam
    const currentTime = Date.now();
    if (!enemy.lastFootstep || currentTime - enemy.lastFootstep > 500) {
        enemy.lastFootstep = currentTime;
        
        // Volume based on distance (closer = louder)
        const volume = Math.max(0.02, 0.2 - (distance / 100));
        
        // Different pitch based on robot (slight variation)
        const pitch = 80 + (enemy.position.x % 20);
        
        createBeepSound(pitch, 0.1, volume);
    }
}

function playRobotShootSound(enemy, camera) {
    const distance = BABYLON.Vector3.Distance(enemy.position, camera.position);
    const volume = Math.max(0.05, 0.3 - (distance / 50));
    
    // Robot shoot sound - higher pitched beep
    createBeepSound(400, 0.2, volume);
}

function playWeaponSound(weaponName) {
    // Different sounds for different weapon types
    let frequency = 300;
    let duration = 0.15;
    
    if (weaponName.includes('Laser')) {
        frequency = 800;
        duration = 0.3;
    } else if (weaponName.includes('Rocket')) {
        frequency = 150;
        duration = 0.4;
    } else if (weaponName.includes('Magic')) {
        frequency = 600;
        duration = 0.25;
    }
    
    createBeepSound(frequency, duration, 0.15);
}

function playBuddyWeaponSound(weaponName) {
    // Same weapon sounds as player but 50% higher pitched for buddy
    let frequency = 300;
    let duration = 0.15;
    
    if (weaponName.includes('Laser')) {
        frequency = 800;
        duration = 0.3;
    } else if (weaponName.includes('Rocket')) {
        frequency = 150;
        duration = 0.4;
    } else if (weaponName.includes('Magic')) {
        frequency = 600;
        duration = 0.25;
    }
    
    // Make it 50% higher pitched for buddy
    frequency = Math.floor(frequency * 1.5);
    
    createBeepSound(frequency, duration, 0.1); // Slightly quieter than player
}

function playHitSound() {
    // Short hit sound
    createBeepSound(200, 0.1, 0.1);
}

function playExplosionSound() {
    // Low frequency explosion
    createBeepSound(100, 0.5, 0.2);
}

function dropWeapon(scene, position) {
    // Get a random weapon that player doesn't have
    const availableWeapons = ALL_WEAPONS.filter(weapon => 
        !gameState.player.weapons.includes(weapon)
    );
    
    if (availableWeapons.length === 0) return; // Player has all weapons
    
    const randomWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
    
    // Create weapon pickup
    const weaponDrop = BABYLON.MeshBuilder.CreateBox("weaponDrop", {size: 1}, scene);
    weaponDrop.position = position.clone();
    weaponDrop.position.y += 2;
    
    // Get weapon color
    const weaponConfig = getWeaponConfig(randomWeapon);
    const material = new BABYLON.StandardMaterial("weaponDropMaterial", scene);
    material.diffuseColor = weaponConfig.color;
    material.emissiveColor = weaponConfig.color.scale(0.3);
    weaponDrop.material = material;
    
    // Add spinning animation
    weaponDrop.weaponName = randomWeapon;
    weaponDrop.rotationSpeed = 0.05;
    
    // Animate floating and spinning
    const originalY = weaponDrop.position.y;
    let time = 0;
    const floatInterval = setInterval(() => {
        time += 0.1;
        weaponDrop.position.y = originalY + Math.sin(time) * 0.5;
        weaponDrop.rotation.y += weaponDrop.rotationSpeed;
        
        // Remove after 30 seconds if not picked up
        if (time > 30) {
            clearInterval(floatInterval);
            const index = gameState.weaponDrops.indexOf(weaponDrop);
            if (index > -1) {
                gameState.weaponDrops.splice(index, 1);
                weaponDrop.dispose();
            }
        }
    }, 50);
    
    gameState.weaponDrops.push(weaponDrop);
}

// Initialize welcome screen
document.getElementById('welcomeScreen').addEventListener('click', startGame);

function startGame() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    document.getElementById('crosshair').style.display = 'block';
    document.getElementById('ui').style.display = 'block';
    document.getElementById('instructions').style.display = 'block';
    
    // Show/hide mobile controls based on device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    const mobileControlsElement = document.getElementById('mobileControls');
    if (mobileControlsElement) {
        mobileControlsElement.style.display = isMobile ? 'block' : 'none';
    }
    
    gameState.gameStarted = true;
    gameState.player.invulnerableUntil = Date.now() + 10000; // 10 seconds invulnerability
    gameState.obstacles = []; // Clear obstacles array for fresh start
    
    // Create the scene
    const scene = createScene();
    
    // Start render loop
    engine.runRenderLoop(function () {
        updateGame(scene, scene.activeCamera);
        scene.render();
    });
    
    // Handle window resize
    window.addEventListener("resize", function () {
        engine.resize();
    });
}

// Game will start when welcome screen is clicked