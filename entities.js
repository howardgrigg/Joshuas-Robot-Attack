// Entity Management Module
// Handles creation and management of enemies, buddy, and boss entities

// Safe spawning system to avoid obstacles and player
function findSafeSpawnPosition(playerPosition = new BABYLON.Vector3(0, 0, 0)) {
    let attempts = 0;
    let position;
    
    while (attempts < 50) {
        const distance = 30 + Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        
        position = new BABYLON.Vector3(
            playerPosition.x + Math.cos(angle) * distance,
            2,
            playerPosition.z + Math.sin(angle) * distance
        );
        
        // Check if position is safe (no obstacles nearby)
        let isSafe = true;
        for (const obstacle of gameState.obstacles) {
            const obstacleDistance = BABYLON.Vector3.Distance(position, obstacle.position);
            if (obstacleDistance < obstacle.radius + 3) {
                isSafe = false;
                break;
            }
        }
        
        if (isSafe) break;
        attempts++;
    }
    
    return position || new BABYLON.Vector3(50, 2, 50);
}

// Create level-specific enemy robot
function createLevelEnemy(scene, enemyType) {
    const enemyConfig = ENEMY_TYPES[enemyType];
    const enemy = BABYLON.MeshBuilder.CreateBox("enemy", {size: enemyConfig.size}, scene);
    
    const playerPosition = scene.activeCamera ? scene.activeCamera.position : new BABYLON.Vector3(0, 0, 0);
    const safePosition = findSafeSpawnPosition(playerPosition);
    enemy.position = safePosition;
    
    const material = new BABYLON.StandardMaterial("enemyMaterial", scene);
    material.diffuseColor = enemyConfig.colors.body;
    material.emissiveColor = enemyConfig.colors.emissive;
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
    
    // Robot mouth/face plate
    const mouth = BABYLON.MeshBuilder.CreateBox("mouth", {width: 0.4, height: 0.1, depth: 0.05}, scene);
    mouth.position = new BABYLON.Vector3(0, 1.4, 0.45);
    mouth.parent = enemy;
    
    const mouthMaterial = new BABYLON.StandardMaterial("mouthMaterial", scene);
    mouthMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    mouth.material = mouthMaterial;
    
    // Robot antenna/sensor
    const antenna = BABYLON.MeshBuilder.CreateCylinder("antenna", {height: 0.5, diameter: 0.1}, scene);
    antenna.position = new BABYLON.Vector3(0, 2.2, 0);
    antenna.parent = enemy;
    
    const antennaMaterial = new BABYLON.StandardMaterial("antennaMaterial", scene);
    antennaMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    antennaMaterial.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
    antenna.material = antennaMaterial;
    
    // Robot arms
    const leftArm = BABYLON.MeshBuilder.CreateBox("leftArm", {width: 0.4, height: 1.2, depth: 0.4}, scene);
    leftArm.position = new BABYLON.Vector3(-1, 0.2, 0);
    leftArm.parent = enemy;
    leftArm.material = material;
    
    const rightArm = BABYLON.MeshBuilder.CreateBox("rightArm", {width: 0.4, height: 1.2, depth: 0.4}, scene);
    rightArm.position = new BABYLON.Vector3(1, 0.2, 0);
    rightArm.parent = enemy;
    rightArm.material = material;
    
    // Robot legs
    const leftLeg = BABYLON.MeshBuilder.CreateBox("leftLeg", {width: 0.4, height: 1.2, depth: 0.4}, scene);
    leftLeg.position = new BABYLON.Vector3(-0.4, -1, 0);
    leftLeg.parent = enemy;
    leftLeg.material = material;
    
    const rightLeg = BABYLON.MeshBuilder.CreateBox("rightLeg", {width: 0.4, height: 1.2, depth: 0.4}, scene);
    rightLeg.position = new BABYLON.Vector3(0.4, -1, 0);
    rightLeg.parent = enemy;
    rightLeg.material = material;
    
    // Robot feet
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
    
    // Set enemy properties based on level configuration
    enemy.health = enemyConfig.health;
    enemy.maxHealth = enemyConfig.health;
    enemy.speed = enemyConfig.speed;
    enemy.originalSpeed = enemyConfig.speed;
    enemy.attackDamage = enemyConfig.attackDamage;
    enemy.shootCooldown = enemyConfig.shootCooldown;
    enemy.abilities = enemyConfig.abilities;
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
    enemy.canJump = enemyConfig.abilities.includes('jump');
    enemy.lastJump = 0;
    enemy.stuckTimer = 0;
    enemy.lastPosition = enemy.position.clone();
    
    // Animation properties
    enemy.animationTime = 0;
    enemy.isMoving = false;
    enemy.lastDirection = new BABYLON.Vector3(0, 0, 1);
    
    createHealthBar(scene, enemy);
    gameState.enemies.push(enemy);
}

// Legacy createEnemy function for backward compatibility
function createEnemy(scene) {
    return createLevelEnemy(scene, "scout");
}

// Create level-specific boss with progressive difficulty
function createLevelBoss(scene, level) {
    const boss = BABYLON.MeshBuilder.CreateBox("boss", {size: 4 + level}, scene);
    
    const playerPosition = scene.activeCamera ? scene.activeCamera.position : new BABYLON.Vector3(0, 0, 0);
    const safePosition = findSafeSpawnPosition(playerPosition);
    boss.position = safePosition;
    
    // Boss colors based on level
    const bossColors = {
        1: { body: new BABYLON.Color3(0.8, 0.4, 0.4), emissive: new BABYLON.Color3(0.2, 0.1, 0.1) },
        2: { body: new BABYLON.Color3(0.9, 0.6, 0.2), emissive: new BABYLON.Color3(0.3, 0.2, 0.05) },
        3: { body: new BABYLON.Color3(0.3, 0.7, 0.3), emissive: new BABYLON.Color3(0.1, 0.2, 0.1) },
        4: { body: new BABYLON.Color3(0.9, 0.2, 0.1), emissive: new BABYLON.Color3(0.4, 0.1, 0.05) },
        5: { body: new BABYLON.Color3(0.9, 0.9, 1), emissive: new BABYLON.Color3(0.4, 0.4, 0.5) }
    };
    
    const colors = bossColors[level] || bossColors[1];
    const material = new BABYLON.StandardMaterial("bossMaterial", scene);
    material.diffuseColor = colors.body;
    material.emissiveColor = colors.emissive;
    boss.material = material;
    
    // Boss head scaled with level
    const headSize = 2 + level * 0.5;
    const head = BABYLON.MeshBuilder.CreateBox("bossHead", {size: headSize}, scene);
    head.position = new BABYLON.Vector3(0, (4 + level) * 0.75, 0);
    head.parent = boss;
    
    const headMaterial = new BABYLON.StandardMaterial("bossHeadMaterial", scene);
    headMaterial.diffuseColor = colors.body;
    head.material = headMaterial;
    
    // Giant glowing eyes
    const eyeSize = 0.4 + level * 0.1;
    const leftEye = BABYLON.MeshBuilder.CreateSphere("bossLeftEye", {diameter: eyeSize}, scene);
    leftEye.position = new BABYLON.Vector3(-headSize * 0.3, head.position.y + 0.3, headSize * 0.4);
    leftEye.parent = boss;
    
    const rightEye = BABYLON.MeshBuilder.CreateSphere("bossRightEye", {diameter: eyeSize}, scene);
    rightEye.position = new BABYLON.Vector3(headSize * 0.3, head.position.y + 0.3, headSize * 0.4);
    rightEye.parent = boss;
    
    const eyeMaterial = new BABYLON.StandardMaterial("bossEyeMaterial", scene);
    eyeMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    eyeMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
    leftEye.material = eyeMaterial;
    rightEye.material = eyeMaterial;
    
    // Arms scaled with level
    const armSize = 1 + level * 0.2;
    const leftArm = BABYLON.MeshBuilder.CreateBox("bossLeftArm", {width: armSize, height: armSize * 3, depth: armSize}, scene);
    leftArm.position = new BABYLON.Vector3(-(2.5 + level * 0.3), 0.6, 0);
    leftArm.parent = boss;
    leftArm.material = material;
    
    const rightArm = BABYLON.MeshBuilder.CreateBox("bossRightArm", {width: armSize, height: armSize * 3, depth: armSize}, scene);
    rightArm.position = new BABYLON.Vector3((2.5 + level * 0.3), 0.6, 0);
    rightArm.parent = boss;
    rightArm.material = material;
    
    // Store references to robot parts for animation
    boss.robotParts = {
        head, leftEye, rightEye,
        leftArm, rightArm
    };
    
    // Progressive boss stats based on level
    const baseHealth = 200;
    const baseSpeed = 0.15;
    const baseDamage = 20;
    const baseCooldown = 1200;
    
    boss.health = baseHealth + (level * 150);
    boss.maxHealth = boss.health;
    boss.speed = baseSpeed + (level * 0.05);
    boss.originalSpeed = boss.speed;
    boss.attackDamage = baseDamage + (level * 10);
    boss.shootCooldown = Math.max(400, baseCooldown - (level * 200));
    boss.lastAttack = 0;
    boss.lastShot = 0;
    boss.checkCollisions = true;
    boss.obstacles = [];
    boss.isBoss = true;
    boss.level = level;
    boss.canJump = level >= 3;
    boss.lastJump = 0;
    boss.stuckTimer = 0;
    boss.lastPosition = boss.position.clone();
    
    // Animation properties
    boss.animationTime = 0;
    boss.isMoving = false;
    boss.lastDirection = new BABYLON.Vector3(0, 0, 1);
    
    createHealthBar(scene, boss);
    gameState.enemies.push(boss);
    
    // Resume audio context in case it got suspended
    if (gameState.audioContext && gameState.audioContext.state === 'suspended') {
        gameState.audioContext.resume();
    }
}

// Create buddy companion robot
function createBuddy(scene) {
    const buddy = BABYLON.MeshBuilder.CreateBox("buddy", {size: 1.8}, scene);
    buddy.position = new BABYLON.Vector3(-3, 2, 3);
    
    // Friendly blue color scheme
    const material = new BABYLON.StandardMaterial("buddyMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);
    material.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.4);
    buddy.material = material;
    
    // Buddy head
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
    
    // Protective shield
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
    
    // Set buddy properties
    buddy.health = 80;
    buddy.maxHealth = 80;
    buddy.speed = 0.10;
    buddy.lastAttack = 0;
    buddy.lastShot = 0;
    buddy.lastHeal = 0;
    buddy.target = null;
    buddy.followDistance = 4;
    buddy.attackRange = 15;
    buddy.healRange = 2;
    buddy.checkCollisions = true;
    
    // Buddy weapon system
    buddy.weapons = ["Pistol"];
    buddy.currentWeapon = 0;
    buddy.weaponsCollected = 1;
    
    createHealthBar(scene, buddy);
    gameState.buddy = buddy;
}

// Create giant boss enemy
function createBossEnemy(scene) {
    const boss = BABYLON.MeshBuilder.CreateBox("boss", {size: 6}, scene);
    
    const playerPosition = scene.activeCamera ? scene.activeCamera.position : new BABYLON.Vector3(0, 0, 0);
    const safePosition = findSafeSpawnPosition(playerPosition);
    boss.position = safePosition;
    
    const material = new BABYLON.StandardMaterial("bossMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
    material.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.1);
    boss.material = material;
    
    // Giant robot head
    const head = BABYLON.MeshBuilder.CreateBox("bossHead", {size: 3}, scene);
    head.position = new BABYLON.Vector3(0, 4.5, 0);
    head.parent = boss;
    
    const headMaterial = new BABYLON.StandardMaterial("bossHeadMaterial", scene);
    headMaterial.diffuseColor = new BABYLON.Color3(1, 0.1, 0.1);
    head.material = headMaterial;
    
    // Giant glowing red eyes
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
    
    // Giant arms
    const leftArm = BABYLON.MeshBuilder.CreateBox("bossLeftArm", {width: 1.2, height: 3.6, depth: 1.2}, scene);
    leftArm.position = new BABYLON.Vector3(-3.75, 0.6, 0);
    leftArm.parent = boss;
    leftArm.material = material;
    
    const rightArm = BABYLON.MeshBuilder.CreateBox("bossRightArm", {width: 1.2, height: 3.6, depth: 1.2}, scene);
    rightArm.position = new BABYLON.Vector3(3.75, 0.6, 0);
    rightArm.parent = boss;
    rightArm.material = material;
    
    // Giant legs
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
    
    // Set boss properties
    boss.health = 1000;
    boss.maxHealth = 1000;
    boss.speed = 0.25;
    boss.originalSpeed = 0.25;
    boss.lastAttack = 0;
    boss.lastShot = 0;
    boss.checkCollisions = true;
    boss.obstacles = [];
    boss.isBoss = true;
    boss.attackDamage = 50;
    boss.shootCooldown = 1000;
    boss.canJump = true;
    boss.lastJump = 0;
    boss.stuckTimer = 0;
    boss.lastPosition = boss.position.clone();
    
    // Animation properties
    boss.animationTime = 0;
    boss.isMoving = false;
    boss.lastDirection = new BABYLON.Vector3(0, 0, 1);
    
    createHealthBar(scene, boss);
    gameState.enemies.push(boss);
    
    // Resume audio context in case it got suspended
    if (gameState.audioContext && gameState.audioContext.state === 'suspended') {
        gameState.audioContext.resume();
    }
    
    showBossAlert("GIANT BOSS ROBOT APPEARED! Defeat it to win!");
}

// Buddy update and AI functions
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
        healPlayer(scene, buddy, currentTime);
    }
    // Priority 2: Attack enemies
    else if (closestEnemy && currentTime - buddy.lastShot > 800) {
        buddyShoot(scene, buddy, closestEnemy);
        buddy.lastShot = currentTime;
    }
    // Priority 3: Follow player if too far away
    else if (distanceToPlayer > buddy.followDistance) {
        moveBuddyTowardsPlayer(buddy, playerPosition);
    }
    // Priority 4: Move to defensive position around player
    else if (distanceToPlayer < 1.5) {
        const angle = Math.atan2(buddy.position.z - playerPosition.z, buddy.position.x - playerPosition.x);
        const targetX = playerPosition.x + Math.cos(angle) * buddy.followDistance;
        const targetZ = playerPosition.z + Math.sin(angle) * buddy.followDistance;
        const targetPosition = new BABYLON.Vector3(targetX, buddy.position.y, targetZ);
        
        const direction = targetPosition.subtract(buddy.position).normalize();
        buddy.position.addInPlace(direction.scale(buddy.speed));
    }
    
    updateHealthBar(buddy);
}

function moveBuddyTowardsPlayer(buddy, playerPosition) {
    const direction = playerPosition.subtract(buddy.position).normalize();
    buddy.position.addInPlace(direction.scale(buddy.speed));
}

function healPlayer(scene, buddy, currentTime) {
    gameState.player.health = Math.min(200, gameState.player.health + 30);
    document.getElementById('health').textContent = gameState.player.health;
    buddy.lastHeal = currentTime;
    
    createHealingEffect(scene, buddy);
    
    // Update buddy status
    document.getElementById('buddyStatus').textContent = 'Healing!';
    setTimeout(() => {
        document.getElementById('buddyStatus').textContent = 'Ready';
    }, 1000);
}

function createHealingEffect(scene, target) {
    const healEffect = BABYLON.MeshBuilder.CreateSphere("healEffect", {diameter: 2}, scene);
    healEffect.position = target.position.clone();
    healEffect.position.y += 2;
    
    const healMaterial = new BABYLON.StandardMaterial("healMaterial", scene);
    healMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    healMaterial.emissiveColor = new BABYLON.Color3(0, 0.8, 0);
    healMaterial.alpha = 0.6;
    healEffect.material = healMaterial;
    
    // Animate the healing effect
    let scale = 0.1;
    const healAnimation = setInterval(() => {
        scale += 0.1;
        healEffect.scaling = new BABYLON.Vector3(scale, scale, scale);
        healMaterial.alpha -= 0.05;
        
        if (healMaterial.alpha <= 0) {
            healEffect.dispose();
            clearInterval(healAnimation);
        }
    }, 50);
}

function buddyShoot(scene, buddy, targetEnemy) {
    const weapon = buddy.weapons[buddy.currentWeapon];
    const weaponConfig = getWeaponConfig(weapon);
    
    // Create projectile from buddy to enemy
    const direction = targetEnemy.position.subtract(buddy.position).normalize();
    const projectile = BABYLON.MeshBuilder.CreateSphere("buddyProjectile", {diameter: 0.3}, scene);
    projectile.position = buddy.position.clone();
    projectile.position.y += 1;
    
    const material = new BABYLON.StandardMaterial("buddyProjectileMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0, 1, 0.5);
    material.emissiveColor = new BABYLON.Color3(0, 0.8, 0.3);
    projectile.material = material;
    
    projectile.direction = direction;
    projectile.speed = weaponConfig ? weaponConfig.speed : 2;
    projectile.damage = weaponConfig ? weaponConfig.damage : 20;
    projectile.weapon = weapon;
    
    gameState.buddyProjectiles.push(projectile);
    playBuddyWeaponSound(weapon);
    
    // Animate buddy shooting
    animateRobotShooting(buddy);
}

// Create health bar above entity
function createHealthBar(scene, enemy) {
    const healthBarContainer = BABYLON.MeshBuilder.CreatePlane("healthBarContainer", {width: 3, height: 0.3}, scene);
    healthBarContainer.position = new BABYLON.Vector3(0, enemy.isBoss ? 8 : 3, 0);
    healthBarContainer.parent = enemy;
    healthBarContainer.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    
    const containerMaterial = new BABYLON.StandardMaterial("healthBarContainerMaterial", scene);
    containerMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    containerMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    healthBarContainer.material = containerMaterial;
    
    const healthBar = BABYLON.MeshBuilder.CreatePlane("healthBar", {width: 2.8, height: 0.2}, scene);
    healthBar.position = new BABYLON.Vector3(0, 0, -0.01);
    healthBar.parent = healthBarContainer;
    
    const healthMaterial = new BABYLON.StandardMaterial("healthBarMaterial", scene);
    healthMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    healthMaterial.emissiveColor = new BABYLON.Color3(0, 0.5, 0);
    healthBar.material = healthMaterial;
    
    enemy.healthBar = healthBar;
    enemy.healthBarContainer = healthBarContainer;
}

// Update health bar display
function updateHealthBar(enemy) {
    if (enemy.healthBar && enemy.health > 0) {
        const healthPercentage = enemy.health / enemy.maxHealth;
        enemy.healthBar.scaling.x = healthPercentage;
        
        // Change color based on health
        const material = enemy.healthBar.material;
        if (healthPercentage > 0.6) {
            material.diffuseColor = new BABYLON.Color3(0, 1, 0);
            material.emissiveColor = new BABYLON.Color3(0, 0.5, 0);
        } else if (healthPercentage > 0.3) {
            material.diffuseColor = new BABYLON.Color3(1, 1, 0);
            material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
        } else {
            material.diffuseColor = new BABYLON.Color3(1, 0, 0);
            material.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
        }
    }
}