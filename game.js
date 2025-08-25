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

// Game state
let gameState = {
    keys: {},
    gameStarted: false,
    player: {
        health: 100,
        currentWeapon: 0,
        weapons: ['Basic Blaster'],
        velocity: new BABYLON.Vector3(0, 0, 0),
        isOnGround: true,
        jumpPower: 15,
        weaponsCollected: 1
    },
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    weaponDrops: []
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
    
    // Create large ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 100, height: 100}, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.2);
    ground.material = groundMaterial;
    ground.checkCollisions = true;
    
    // Create bigger rocks for cover
    for (let i = 0; i < 15; i++) {
        const rock = BABYLON.MeshBuilder.CreateSphere("rock" + i, {diameter: Math.random() * 4 + 4}, scene);
        rock.position.x = Math.random() * 80 - 40;
        rock.position.z = Math.random() * 80 - 40;
        rock.position.y = rock.scaling.y / 2;
        rock.scaling.y = Math.random() * 0.4 + 0.6;
        
        const rockMaterial = new BABYLON.StandardMaterial("rockMaterial" + i, scene);
        rockMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
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

function createEnemy(scene) {
    // Create robot body (main box)
    const enemy = BABYLON.MeshBuilder.CreateBox("enemy", {size: 2}, scene);
    enemy.position.x = Math.random() * 60 - 30;
    enemy.position.z = Math.random() * 60 - 30;
    enemy.position.y = 2;
    
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
    
    // Robot arms
    const leftArm = BABYLON.MeshBuilder.CreateBox("leftArm", {width: 0.5, height: 1.5, depth: 0.5}, scene);
    leftArm.position = new BABYLON.Vector3(-1.2, 0, 0);
    leftArm.parent = enemy;
    leftArm.material = material;
    
    const rightArm = BABYLON.MeshBuilder.CreateBox("rightArm", {width: 0.5, height: 1.5, depth: 0.5}, scene);
    rightArm.position = new BABYLON.Vector3(1.2, 0, 0);
    rightArm.parent = enemy;
    rightArm.material = material;
    
    // Store references to robot parts
    enemy.robotParts = {head, leftEye, rightEye, leftArm, rightArm};
    
    enemy.health = 60;
    enemy.speed = 0.02;
    enemy.originalSpeed = 0.02;
    enemy.lastAttack = 0;
    enemy.lastShot = 0;
    enemy.checkCollisions = true;
    enemy.obstacles = [];
    enemy.isFrozen = false;
    enemy.freezeTime = 0;
    
    gameState.enemies.push(enemy);
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
    projectile.weaponType = weaponType;
    
    const material = new BABYLON.StandardMaterial("projectileMaterial", scene);
    material.diffuseColor = weaponConfig.color;
    material.emissiveColor = weaponConfig.color;
    projectile.material = material;
    
    return projectile;
}

function getWeaponConfig(weaponType) {
    const configs = {
        'Basic Blaster': { speed: 2, damage: 20, color: new BABYLON.Color3(0, 1, 1) },
        'Plasma Rifle': { speed: 2.5, damage: 25, color: new BABYLON.Color3(0, 1, 0.5) },
        'Lightning Gun': { speed: 3, damage: 30, color: new BABYLON.Color3(1, 1, 0) },
        'Fire Staff': { speed: 2.2, damage: 35, color: new BABYLON.Color3(1, 0, 0) },
        'Ice Cannon': { speed: 1.8, damage: 25, color: new BABYLON.Color3(0.5, 0.8, 1) },
        'Freeze Gun': { speed: 2.5, damage: 0, color: new BABYLON.Color3(0.7, 0.9, 1) },
        'Rocket Launcher': { speed: 1.5, damage: 50, color: new BABYLON.Color3(1, 0.5, 0) },
        'Grenade Launcher': { speed: 1.2, damage: 60, color: new BABYLON.Color3(0.8, 0.4, 0) },
        'Laser Cannon': { speed: 4, damage: 40, color: new BABYLON.Color3(1, 0, 0) },
        'Photon Beam': { speed: 3.5, damage: 35, color: new BABYLON.Color3(1, 1, 1) },
        'Quantum Blaster': { speed: 3, damage: 45, color: new BABYLON.Color3(0.5, 0, 1) },
        'Sonic Boom': { speed: 2.8, damage: 32, color: new BABYLON.Color3(0.7, 0.7, 0.7) },
        'Gravity Gun': { speed: 2, damage: 38, color: new BABYLON.Color3(0.4, 0.2, 0.8) },
        'Energy Sword': { speed: 1.5, damage: 55, color: new BABYLON.Color3(0, 1, 0) },
        'Fusion Rifle': { speed: 2.3, damage: 42, color: new BABYLON.Color3(1, 0.8, 0) },
        'Particle Beam': { speed: 3.2, damage: 36, color: new BABYLON.Color3(0.8, 0, 0.8) },
        'Void Blaster': { speed: 2.1, damage: 48, color: new BABYLON.Color3(0.1, 0.1, 0.1) },
        'Storm Caller': { speed: 2.7, damage: 33, color: new BABYLON.Color3(0.3, 0.3, 0.8) },
        'Sun Beam': { speed: 3.8, damage: 44, color: new BABYLON.Color3(1, 1, 0.3) },
        'Moon Ray': { speed: 2.9, damage: 29, color: new BABYLON.Color3(0.7, 0.7, 0.9) },
        'Star Shooter': { speed: 3.1, damage: 41, color: new BABYLON.Color3(1, 1, 0.8) },
        'Dragon Breath': { speed: 2.4, damage: 52, color: new BABYLON.Color3(1, 0.3, 0) },
        'Phoenix Fire': { speed: 2.6, damage: 46, color: new BABYLON.Color3(1, 0.6, 0.1) },
        'Ice Storm': { speed: 2.2, damage: 28, color: new BABYLON.Color3(0.6, 0.9, 1) },
        'Thunder Strike': { speed: 3.4, damage: 39, color: new BABYLON.Color3(0.9, 0.9, 0.2) },
        'Wind Blade': { speed: 3.6, damage: 31, color: new BABYLON.Color3(0.8, 1, 0.8) },
        'Earth Shaker': { speed: 1.8, damage: 58, color: new BABYLON.Color3(0.6, 0.4, 0.2) },
        'Water Cannon': { speed: 2.5, damage: 26, color: new BABYLON.Color3(0.2, 0.6, 1) },
        'Poison Dart': { speed: 2.8, damage: 22, color: new BABYLON.Color3(0.4, 0.8, 0.2) },
        'Acid Sprayer': { speed: 2.1, damage: 34, color: new BABYLON.Color3(0.6, 1, 0.2) },
        'Venom Shot': { speed: 2.7, damage: 27, color: new BABYLON.Color3(0.5, 0.2, 0.8) },
        'Crystal Gun': { speed: 2.4, damage: 37, color: new BABYLON.Color3(0.9, 0.5, 0.9) },
        'Diamond Shooter': { speed: 3.3, damage: 43, color: new BABYLON.Color3(1, 1, 1) },
        'Ruby Laser': { speed: 2.9, damage: 40, color: new BABYLON.Color3(1, 0.2, 0.2) },
        'Emerald Beam': { speed: 2.6, damage: 35, color: new BABYLON.Color3(0.2, 1, 0.2) },
        'Sapphire Blast': { speed: 2.8, damage: 38, color: new BABYLON.Color3(0.2, 0.2, 1) },
        'Shadow Gun': { speed: 3.2, damage: 41, color: new BABYLON.Color3(0.2, 0.2, 0.2) },
        'Light Ray': { speed: 4.2, damage: 36, color: new BABYLON.Color3(1, 1, 0.9) },
        'Time Warp': { speed: 1.9, damage: 49, color: new BABYLON.Color3(0.7, 0.3, 0.9) },
        'Space Ripper': { speed: 3.5, damage: 47, color: new BABYLON.Color3(0.1, 0.1, 0.9) },
        'Black Hole': { speed: 1.3, damage: 65, color: new BABYLON.Color3(0.1, 0.1, 0.1) },
        'Rainbow Beam': { speed: 2.7, damage: 33, color: new BABYLON.Color3(1, 0.5, 1) },
        'Unicorn Horn': { speed: 2.9, damage: 44, color: new BABYLON.Color3(1, 0.8, 1) },
        'Magic Wand': { speed: 2.2, damage: 39, color: new BABYLON.Color3(0.8, 0.4, 1) },
        'Wizard Staff': { speed: 2.1, damage: 51, color: new BABYLON.Color3(0.5, 0.2, 0.8) },
        'Fairy Dust': { speed: 3.7, damage: 24, color: new BABYLON.Color3(1, 0.9, 0.7) },
        'Robot Zapper': { speed: 2.8, damage: 42, color: new BABYLON.Color3(0.2, 0.8, 0.8) },
        'Mech Buster': { speed: 2.3, damage: 56, color: new BABYLON.Color3(0.7, 0.2, 0.2) },
        'Cyber Shot': { speed: 3.1, damage: 34, color: new BABYLON.Color3(0.3, 1, 0.3) },
        'Data Stream': { speed: 3.9, damage: 28, color: new BABYLON.Color3(0, 0.8, 1) },
        'Code Cannon': { speed: 2.4, damage: 46, color: new BABYLON.Color3(0.5, 0.5, 1) }
    };
    return configs[weaponType] || configs['Basic Blaster'];
}

function updateGame(scene, camera) {
    // Movement with collision detection
    const speed = 0.3;
    
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
    
    // Update enemies
    const currentTime = Date.now();
    gameState.enemies.forEach(enemy => {
        // Check if enemy should unfreeze
        if (enemy.isFrozen && currentTime - enemy.freezeTime > 10000) {
            unfreezeEnemy(enemy);
        }
        
        // Skip AI if frozen
        if (enemy.isFrozen) return;
        
        const distance = BABYLON.Vector3.Distance(enemy.position, camera.position);
        
        // Robot AI: shoot if in range, otherwise move closer
        if (distance < 15 && distance > 3 && currentTime - enemy.lastShot > 1500) {
            // Shoot at player
            enemyShoot(scene, enemy, camera);
            enemy.lastShot = currentTime;
        } else if (distance > 3) {
            // Move towards player with obstacle avoidance
            moveEnemyWithAvoidance(enemy, camera);
        }
        
        // Melee attack if very close
        if (distance < 3 && currentTime - enemy.lastAttack > 2000) {
            gameState.player.health -= 15;
            enemy.lastAttack = currentTime;
            document.getElementById('health').textContent = gameState.player.health;
            
            if (gameState.player.health <= 0) {
                alert('Game Over! Refresh to play again.');
            }
        }
    });
    
    // Update enemy projectiles
    for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.enemyProjectiles[i];
        projectile.position.addInPlace(projectile.direction.scale(projectile.speed));
        
        // Check if hit player
        const distanceToPlayer = BABYLON.Vector3.Distance(projectile.position, camera.position);
        if (distanceToPlayer < 1) {
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
            }
            
            // Remove pickup
            drop.dispose();
            gameState.weaponDrops.splice(i, 1);
        }
    }
    
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
                // Create hit effect
                createHitEffect(scene, enemy.position);
                
                // Remove projectile
                projectile.dispose();
                gameState.projectiles.splice(i, 1);
                
                // Hit enemy
                if (projectile.weaponType === 'Freeze Gun') {
                    // Freeze the enemy (doesn't damage)
                    freezeEnemy(enemy);
                } else {
                    enemy.health -= projectile.damage;
                    // Add hit animation
                    animateRobotHit(enemy);
                    
                    // Remove enemy if dead
                    if (enemy.health <= 0) {
                        // Drop weapon before death animation
                        dropWeapon(scene, enemy.position);
                        
                        animateRobotDeath(scene, enemy, () => {
                            // Clean up enemy after death animation
                            enemy.dispose();
                            gameState.enemies.splice(j, 1);
                            
                            // Spawn new enemy after delay
                            setTimeout(() => createEnemy(scene), 3000);
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
    const projectile = BABYLON.MeshBuilder.CreateSphere("enemyProjectile", {diameter: 0.4}, scene);
    projectile.position = enemy.position.clone();
    projectile.position.y += 1;
    
    // Calculate direction to player
    projectile.direction = camera.position.subtract(enemy.position).normalize();
    projectile.speed = 1.5;
    projectile.damage = 8;
    
    // Red enemy projectiles
    const material = new BABYLON.StandardMaterial("enemyProjectileMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
    material.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
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
    
    // Move the enemy
    enemy.position.addInPlace(moveDirection.scale(enemy.speed));
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
        rightArm: enemy.robotParts.rightArm.material
    };
    
    // Apply ice material to all parts
    enemy.material = iceMaterial;
    enemy.robotParts.head.material = iceMaterial;
    enemy.robotParts.leftArm.material = iceMaterial;
    enemy.robotParts.rightArm.material = iceMaterial;
    
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
    
    gameState.gameStarted = true;
    
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