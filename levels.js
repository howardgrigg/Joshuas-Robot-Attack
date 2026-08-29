// Level System Module
// Manages 5 distinct levels with unique themes, enemies, and progression

// Level definitions with themes and difficulty
const LEVEL_CONFIGS = {
    1: {
        name: "Grasslands Outpost",
        theme: "grasslands",
        description: "Your first encounter with the robot invasion",
        killsRequired: 10,
        enemyType: "scout",
        skyColor: new BABYLON.Color3(0.2, 0.6, 0.9),
        lightIntensity: 1.0,
        enemySpawnRate: 4000, // 4 seconds between spawns
        maxEnemies: 3
    },
    2: {
        name: "Desert Wasteland", 
        theme: "desert",
        description: "Robots adapted to harsh desert conditions",
        killsRequired: 15,
        enemyType: "warrior",
        skyColor: new BABYLON.Color3(0.8, 0.6, 0.3),
        lightIntensity: 1.2,
        enemySpawnRate: 3500,
        maxEnemies: 4
    },
    3: {
        name: "Dark Forest",
        theme: "forest", 
        description: "Camouflaged robots lurk in the shadows",
        killsRequired: 20,
        enemyType: "hunter",
        skyColor: new BABYLON.Color3(0.1, 0.3, 0.1),
        lightIntensity: 0.7,
        enemySpawnRate: 3000,
        maxEnemies: 5
    },
    4: {
        name: "Volcanic Hellscape",
        theme: "volcanic",
        description: "Fire-resistant robots emerge from the lava",
        killsRequired: 25, 
        enemyType: "elite",
        skyColor: new BABYLON.Color3(0.4, 0.1, 0.05),
        lightIntensity: 0.8,
        enemySpawnRate: 2500,
        maxEnemies: 6
    },
    5: {
        name: "Space Station Omega",
        theme: "space",
        description: "Final battle against the robot mothership",
        killsRequired: 30,
        enemyType: "cyber", 
        skyColor: new BABYLON.Color3(0.05, 0.05, 0.2),
        lightIntensity: 0.9,
        enemySpawnRate: 2000,
        maxEnemies: 8
    }
};

// Enemy type configurations for each level
const ENEMY_TYPES = {
    scout: {
        style: 'cartoon',
        health: 50,
        speed: 0.06,
        shootCooldown: 2500,
        attackDamage: 5,
        size: 2,
        colors: {
            body: new BABYLON.Color3(0.6, 0.6, 0.7),
            emissive: new BABYLON.Color3(0.1, 0.1, 0.15)
        },
        abilities: []
    },
    warrior: {
        style: 'cartoon',
        health: 90,
        speed: 0.12,
        shootCooldown: 1800,
        attackDamage: 8,
        size: 2.2,
        colors: {
            body: new BABYLON.Color3(0.8, 0.6, 0.3),
            emissive: new BABYLON.Color3(0.2, 0.15, 0.05)
        },
        abilities: ['dodge']
    },
    hunter: {
        style: 'mech',
        health: 140,
        speed: 0.16, 
        shootCooldown: 1200,
        attackDamage: 12,
        size: 2.4,
        colors: {
            body: new BABYLON.Color3(0.2, 0.5, 0.2),
            emissive: new BABYLON.Color3(0.05, 0.15, 0.05)
        },
        abilities: ['jump', 'stealth']
    },
    elite: {
        style: 'mech',
        health: 200,
        speed: 0.20,
        shootCooldown: 1000,
        attackDamage: 18,
        size: 2.6,
        colors: {
            body: new BABYLON.Color3(0.7, 0.2, 0.1),
            emissive: new BABYLON.Color3(0.3, 0.1, 0.05)
        },
        abilities: ['jump', 'shield', 'fire_resist']
    },
    cyber: {
        style: 'mech',
        health: 300,
        speed: 0.25,
        shootCooldown: 800,
        attackDamage: 25,
        size: 2.8,
        colors: {
            body: new BABYLON.Color3(0.8, 0.8, 0.9),
            emissive: new BABYLON.Color3(0.3, 0.3, 0.4)
        },
        abilities: ['jump', 'shield', 'teleport', 'coordinated_attack']
    }
};

// Robot variants - from level 2 onwards each robot spawns as one of these two types.
// "swift" robots rush the player but go down fast; "heavy" robots are slow but soak damage.
const ENEMY_VARIANTS = {
    swift: {
        name: "Swift",
        healthMult: 0.45,
        speedMult: 1.9,
        sizeMult: 0.8,
        colors: {
            body: new BABYLON.Color3(0.2, 0.85, 1.0),
            emissive: new BABYLON.Color3(0.1, 0.4, 0.55)
        }
    },
    heavy: {
        name: "Heavy",
        healthMult: 2.4,
        speedMult: 0.5,
        sizeMult: 1.3,
        colors: {
            body: new BABYLON.Color3(0.55, 0.35, 0.9),
            emissive: new BABYLON.Color3(0.2, 0.1, 0.35)
        }
    }
};

// Pick a variant for a newly spawned robot. Returns null before level 2 (default robots).
function pickEnemyVariant() {
    if (gameState.currentLevel < 2) return null;
    return Math.random() < 0.5 ? 'swift' : 'heavy';
}

// Get current level configuration
function getCurrentLevelConfig() {
    return LEVEL_CONFIGS[gameState.currentLevel] || LEVEL_CONFIGS[1];
}

// Get enemy type for current level
function getCurrentEnemyType() {
    const levelConfig = getCurrentLevelConfig();
    return ENEMY_TYPES[levelConfig.enemyType];
}

// Check if level is complete
function checkLevelComplete() {
    const levelConfig = getCurrentLevelConfig();
    const regularEnemies = gameState.enemies.filter(e => !e.isBoss);
    
    console.log(`Level ${gameState.currentLevel}: ${gameState.killCount}/${levelConfig.killsRequired} killed, ${regularEnemies.length} enemies left, boss spawned: ${gameState.bossSpawned}`);
    
    // Check if all required enemies have been killed and no regular enemies remain
    if (gameState.killCount >= levelConfig.killsRequired && regularEnemies.length === 0) {
        // Spawn boss if not already spawned
        if (!gameState.bossSpawned) {
            spawnLevelBoss();
            return false;
        }
    }
    
    // Level completion is now handled directly when boss is killed in combat.js
    return false;
}

// Spawn boss for current level
function spawnLevelBoss() {
    gameState.bossSpawned = true;
    const scene = engine.scenes[0];
    
    setTimeout(() => {
        createLevelBoss(scene, gameState.currentLevel);
        showBossAlert(`Level ${gameState.currentLevel} Boss is approaching!\n\nDefeat it to advance to the next level!`);
        
        // Start boss fight music
        startBossFightMusic();
    }, 2000);
}

// Complete current level and advance
function completeLevel() {
    // Ensure boss music is stopped when level completes
    stopBossFightMusic();
    const currentLevel = gameState.currentLevel;
    const nextLevel = currentLevel + 1;
    
    // Show level complete message
    showLevelComplete(currentLevel, nextLevel);
    
    // Advance to next level after delay
    setTimeout(() => {
        advanceToLevel(nextLevel);
    }, 3000);
}

// Advance to specified level
function advanceToLevel(levelNumber) {
    gameState.currentLevel = levelNumber;
    gameState.killCount = 0;
    gameState.bossSpawned = false;
    gameState.enemiesSpawned = 0; // Reset enemy spawn count
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.enemyProjectiles = [];
    gameState.buddyProjectiles = [];
    gameState.weaponDrops = [];
    gameState.obstacles = [];
    
    // Clear existing scene objects
    clearLevelObjects();
    if (typeof clearCoinDrops === 'function') clearCoinDrops();

    // Create new level
    createLevel(levelNumber);
    
    // Update UI
    updateLevelUI();
    
    // Give player health boost between levels
    const cap = (typeof getPlayerMaxHealth === 'function') ? getPlayerMaxHealth() : 200;
    gameState.player.health = Math.min(cap, gameState.player.health + 50);
    document.getElementById('health').textContent = gameState.player.health;
}

// Create level with specific theme and setup
function createLevel(levelNumber) {
    const levelConfig = LEVEL_CONFIGS[levelNumber];
    const scene = engine.scenes[0]; // Get current scene
    
    // Update scene lighting and atmosphere
    scene.clearColor = levelConfig.skyColor;
    const light = scene.getLightByName("light");
    if (light) {
        light.intensity = levelConfig.lightIntensity;
    }
    
    // Create level-specific terrain
    createLevelTerrain(scene, levelConfig.theme);

    // Wire new terrain into the shadow system
    if (typeof refreshSceneGraphics === 'function') refreshSceneGraphics(scene);

    // Spawn initial enemies for this level (counted toward level requirement)
    const initialEnemyCount = Math.min(levelConfig.maxEnemies, 2); // Start with 2 enemies
    gameState.enemiesSpawned += initialEnemyCount; // Count them immediately
    for (let i = 0; i < initialEnemyCount; i++) {
        setTimeout(() => {
            createLevelEnemy(scene, levelConfig.enemyType);
        }, i * 1000);
    }
}

// Clear objects from previous level
function clearLevelObjects() {
    const scene = engine.scenes[0];
    
    // Dispose of enemies
    gameState.enemies.forEach(enemy => {
        if (enemy && enemy.dispose) {
            enemy.dispose();
        }
    });
    
    // Dispose of projectiles
    [...gameState.projectiles, ...gameState.enemyProjectiles, ...gameState.buddyProjectiles].forEach(proj => {
        if (proj && proj.dispose) {
            proj.dispose();
        }
    });
    
    // Dispose of weapon drops
    gameState.weaponDrops.forEach(drop => {
        if (drop && drop.dispose) {
            drop.dispose();
        }
    });
    
    // Clear terrain objects (except buddy and camera)
    scene.meshes.forEach(mesh => {
        if (mesh.name.includes('rock') || mesh.name.includes('trunk') || 
            mesh.name.includes('Ground') || mesh.name.includes('hill') ||
            mesh.name.includes('sand') || mesh.name.includes('platform')) {
            mesh.dispose();
        }
    });
}

// Show level complete screen
function showLevelComplete(currentLevel, nextLevel) {
    const levelConfig = LEVEL_CONFIGS[currentLevel];
    const nextConfig = LEVEL_CONFIGS[nextLevel];
    
    showLevelComplete(`Level ${currentLevel} Complete!\n\n"${levelConfig.name}" cleared!\n\nAdvancing to Level ${nextLevel}: "${nextConfig.name}"\n\n${nextConfig.description}`);
}

// Show game complete screen
function showGameComplete() {
    showVictory(`You have defeated the robot invasion!\n\nAll 5 levels completed:\n✅ Grasslands Outpost\n✅ Desert Wasteland\n✅ Dark Forest\n✅ Volcanic Hellscape\n✅ Space Station Omega\n\nYou are the ultimate robot destroyer!`);
    gameState.gameStarted = false;
}

// Update UI with level information
function updateLevelUI() {
    const levelConfig = getCurrentLevelConfig();
    const progressText = `${gameState.killCount}/${levelConfig.killsRequired}`;
    
    // Update existing UI elements
    document.getElementById('killCount').textContent = progressText;
    
    // Add level display if not exists
    let levelDisplay = document.getElementById('levelDisplay');
    if (!levelDisplay) {
        levelDisplay = document.createElement('div');
        levelDisplay.id = 'levelDisplay';
        levelDisplay.style.fontSize = '16px';
        levelDisplay.style.color = '#4ecdc4';
        levelDisplay.style.fontWeight = 'bold';
        document.getElementById('ui').appendChild(levelDisplay);
    }
    
    levelDisplay.textContent = `Level ${gameState.currentLevel}: ${levelConfig.name}`;
}

// Initialize level system
function initializeLevelSystem() {
    // Start at level 1
    gameState.currentLevel = 1;
    gameState.killCount = 0;
    
    updateLevelUI();
}