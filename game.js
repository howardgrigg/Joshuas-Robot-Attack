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
    projectiles: [],
    enemyProjectiles: []
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
    enemy.lastAttack = 0;
    enemy.lastShot = 0;
    enemy.checkCollisions = true;
    enemy.obstacles = []; // Will store nearby obstacles
    
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
                
                // Add hit animation
                animateRobotHit(enemy);
                
                // Remove projectile
                projectile.dispose();
                gameState.projectiles.splice(i, 1);
                
                // Remove enemy if dead
                if (enemy.health <= 0) {
                    animateRobotDeath(scene, enemy, () => {
                        // Clean up enemy after death animation
                        enemy.dispose();
                        gameState.enemies.splice(j, 1);
                        
                        // Spawn new enemy after delay
                        setTimeout(() => createEnemy(scene), 3000);
                    });
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