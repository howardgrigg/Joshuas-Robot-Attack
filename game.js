// Get canvas and create engine
const canvas = document.getElementById('gameCanvas');
const engine = new BABYLON.Engine(canvas, true);

// Game state
let gameState = {
    keys: {},
    player: {
        health: 100,
        currentWeapon: 0,
        weapons: ['Blaster', 'Rocket Launcher', 'Lightning Gun', 'Ice Cannon', 'Fire Staff']
    },
    enemies: [],
    projectiles: []
};

// Create scene
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.2, 0.6, 0.9);
    scene.collisionsEnabled = true;
    
    // Create camera
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, 0), scene);
    camera.setTarget(new BABYLON.Vector3(0, 5, 10));
    camera.attachControl(canvas, true);
    camera.checkCollisions = true;
    camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
    camera.speed = 0.5;
    
    // Create light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.0;
    
    // Create large ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 100, height: 100}, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.2);
    ground.material = groundMaterial;
    ground.checkCollisions = true;
    
    // Create rocks
    for (let i = 0; i < 20; i++) {
        const rock = BABYLON.MeshBuilder.CreateSphere("rock" + i, {diameter: Math.random() * 3 + 1}, scene);
        rock.position.x = Math.random() * 80 - 40;
        rock.position.z = Math.random() * 80 - 40;
        rock.position.y = rock.scaling.y / 2;
        
        const rockMaterial = new BABYLON.StandardMaterial("rockMaterial" + i, scene);
        rockMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        rock.material = rockMaterial;
        rock.checkCollisions = true;
    }
    
    // Create trees
    for (let i = 0; i < 30; i++) {
        createTree(scene, Math.random() * 80 - 40, Math.random() * 80 - 40);
    }
    
    // Create enemies
    for (let i = 0; i < 8; i++) {
        createEnemy(scene);
    }
    
    // Setup controls
    setupControls(scene, camera);
    
    return scene;
};

function createTree(scene, x, z) {
    // Tree trunk
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {height: 6, diameter: 0.8}, scene);
    trunk.position = new BABYLON.Vector3(x, 3, z);
    
    const trunkMaterial = new BABYLON.StandardMaterial("trunkMaterial", scene);
    trunkMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
    trunk.material = trunkMaterial;
    trunk.checkCollisions = true;
    
    // Tree leaves
    const leaves = BABYLON.MeshBuilder.CreateSphere("leaves", {diameter: 4}, scene);
    leaves.position = new BABYLON.Vector3(x, 7, z);
    
    const leavesMaterial = new BABYLON.StandardMaterial("leavesMaterial", scene);
    leavesMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1);
    leaves.material = leavesMaterial;
    leaves.checkCollisions = true;
}

function createEnemy(scene) {
    const enemy = BABYLON.MeshBuilder.CreateBox("enemy", {size: 2}, scene);
    enemy.position.x = Math.random() * 60 - 30;
    enemy.position.z = Math.random() * 60 - 30;
    enemy.position.y = 2;
    
    const material = new BABYLON.StandardMaterial("enemyMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    material.emissiveColor = new BABYLON.Color3(0.2, 0, 0);
    enemy.material = material;
    
    enemy.health = 60;
    enemy.speed = 0.02;
    enemy.lastAttack = 0;
    enemy.checkCollisions = true;
    
    gameState.enemies.push(enemy);
}

function setupControls(scene, camera) {
    // Simple keyboard events
    window.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        gameState.keys[key] = true;
        
        if (['1', '2', '3', '4', '5'].includes(key)) {
            switchWeapon(parseInt(key) - 1);
        }
    });
    
    window.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        gameState.keys[key] = false;
    });
    
    // Mouse shooting
    scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.pickInfo.hit && pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            shoot(scene, camera);
        }
    });
    
    // Lock pointer on click
    canvas.addEventListener('click', () => {
        canvas.requestPointerLock();
    });
}

function switchWeapon(weaponIndex) {
    if (weaponIndex < gameState.player.weapons.length) {
        gameState.player.currentWeapon = weaponIndex;
        document.getElementById('currentWeapon').textContent = gameState.player.weapons[weaponIndex];
    }
}

function shoot(scene, camera) {
    const weapon = gameState.player.weapons[gameState.player.currentWeapon];
    const projectile = createProjectile(scene, camera, weapon);
    gameState.projectiles.push(projectile);
}

function createProjectile(scene, camera, weaponType) {
    const projectile = BABYLON.MeshBuilder.CreateSphere("projectile", {diameter: 0.5}, scene);
    projectile.position = camera.position.clone();
    projectile.position.y -= 0.5;
    
    const weaponConfig = getWeaponConfig(weaponType);
    projectile.direction = camera.getForwardRay().direction.normalize();
    projectile.speed = weaponConfig.speed;
    projectile.damage = weaponConfig.damage;
    
    const material = new BABYLON.StandardMaterial("projectileMaterial", scene);
    material.diffuseColor = weaponConfig.color;
    material.emissiveColor = weaponConfig.color;
    projectile.material = material;
    
    return projectile;
}

function getWeaponConfig(weaponType) {
    const configs = {
        'Blaster': { speed: 2, damage: 20, color: new BABYLON.Color3(0, 1, 1) },
        'Rocket Launcher': { speed: 1.5, damage: 50, color: new BABYLON.Color3(1, 0.5, 0) },
        'Lightning Gun': { speed: 3, damage: 30, color: new BABYLON.Color3(1, 1, 0) },
        'Ice Cannon': { speed: 1.8, damage: 25, color: new BABYLON.Color3(0.5, 0.8, 1) },
        'Fire Staff': { speed: 2.2, damage: 35, color: new BABYLON.Color3(1, 0, 0) }
    };
    return configs[weaponType] || configs['Blaster'];
}

function updateGame(scene, camera) {
    // Movement
    const speed = 0.5;
    if (gameState.keys['w']) camera.position.addInPlace(camera.getDirection(BABYLON.Vector3.Forward()).scale(speed));
    if (gameState.keys['s']) camera.position.addInPlace(camera.getDirection(BABYLON.Vector3.Backward()).scale(speed));
    if (gameState.keys['a']) camera.position.addInPlace(camera.getDirection(BABYLON.Vector3.Left()).scale(speed));
    if (gameState.keys['d']) camera.position.addInPlace(camera.getDirection(BABYLON.Vector3.Right()).scale(speed));
    
    // Keep camera above ground
    if (camera.position.y < 2) camera.position.y = 2;
    
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
    
    // Update enemies
    const currentTime = Date.now();
    gameState.enemies.forEach(enemy => {
        // Move towards player
        const direction = camera.position.subtract(enemy.position).normalize();
        enemy.position.addInPlace(direction.scale(enemy.speed));
        
        // Attack player if close
        const distance = BABYLON.Vector3.Distance(enemy.position, camera.position);
        if (distance < 3 && currentTime - enemy.lastAttack > 2000) {
            gameState.player.health -= 10;
            enemy.lastAttack = currentTime;
            document.getElementById('health').textContent = gameState.player.health;
            
            if (gameState.player.health <= 0) {
                alert('Game Over! Refresh to play again.');
            }
        }
    });
    
    // Check collisions
    checkCollisions(scene);
    
    // Update UI
    document.getElementById('enemyCount').textContent = gameState.enemies.length;
}

function checkCollisions(scene) {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            const distance = BABYLON.Vector3.Distance(projectile.position, enemy.position);
            
            if (distance < 1.5) {
                // Hit enemy
                enemy.health -= projectile.damage;
                
                // Create hit effect
                createHitEffect(scene, enemy.position);
                
                // Remove projectile
                projectile.dispose();
                gameState.projectiles.splice(i, 1);
                
                // Remove enemy if dead
                if (enemy.health <= 0) {
                    enemy.dispose();
                    gameState.enemies.splice(j, 1);
                    
                    // Spawn new enemy after delay
                    setTimeout(() => createEnemy(scene), 3000);
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

// Create the scene
const scene = createScene();

// Render loop
engine.runRenderLoop(function () {
    updateGame(scene, scene.activeCamera);
    scene.render();
});

// Handle window resize
window.addEventListener("resize", function () {
    engine.resize();
});