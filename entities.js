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

// ============================================================
// Robot visual style helpers - shared by enemies, bosses, buddy
// ============================================================

// Glossy body panel material. style: 'mech' (sharp, high spec) or 'cartoon' (soft)
function makeRobotMaterial(scene, name, baseColor, emissive, style) {
    const m = new BABYLON.StandardMaterial(name, scene);
    m.diffuseColor = baseColor;
    m.emissiveColor = emissive || baseColor.scale(0.12);
    if (style === 'mech') {
        m.specularColor = new BABYLON.Color3(0.95, 0.97, 1);
        m.specularPower = 96;
    } else {
        m.specularColor = new BABYLON.Color3(0.35, 0.35, 0.4);
        m.specularPower = 24;
    }
    return m;
}

// Self-lit material for eyes, cores and accent lights
function makeGlowMaterial(scene, name, color) {
    const m = new BABYLON.StandardMaterial(name, scene);
    m.diffuseColor = new BABYLON.Color3(0.04, 0.04, 0.04);
    m.emissiveColor = color;
    m.specularColor = new BABYLON.Color3(0, 0, 0);
    return m;
}

// Metallic trim material for plating, joints and detail
function makeTrimMaterial(scene, name, style) {
    const m = new BABYLON.StandardMaterial(name, scene);
    m.diffuseColor = style === 'mech'
        ? new BABYLON.Color3(0.16, 0.17, 0.2)
        : new BABYLON.Color3(0.82, 0.83, 0.88);
    m.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    m.specularPower = 80;
    return m;
}

// Build a detailed robot around an existing root mesh (the torso).
// Returns a robotParts object with the keys animation.js / combat.js expect:
//   head, leftEye, rightEye, mouth, antenna,
//   leftArm, rightArm, leftLeg, rightLeg, leftFoot, rightFoot
// opts: { tag, style, s, bodyColor, emissive, eyeColor, coreColor, legs, face }
function assembleRobot(scene, root, opts) {
    const style = opts.style || 'cartoon';
    const s = opts.s || 1;
    const tag = opts.tag || 'robot';
    const bodyColor = opts.bodyColor || new BABYLON.Color3(0.6, 0.6, 0.7);
    const eyeColor = opts.eyeColor || new BABYLON.Color3(1, 0.12, 0.08);
    const coreColor = opts.coreColor || (style === 'mech'
        ? new BABYLON.Color3(0.2, 0.9, 1)
        : new BABYLON.Color3(1, 0.85, 0.2));
    const wantLegs = opts.legs !== false;
    const wantFace = opts.face !== false;

    // Shared materials (kept few so combat.js freeze/poison swaps stay cheap)
    const bodyMat = makeRobotMaterial(scene, tag + 'Body', bodyColor, opts.emissive, style);
    root.material = bodyMat;
    const trimMat = makeTrimMaterial(scene, tag + 'Trim', style);
    const darkMat = new BABYLON.StandardMaterial(tag + 'Dark', scene);
    darkMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.14);
    const glowMat = makeGlowMaterial(scene, tag + 'Eye', eyeColor);
    const coreMat = makeGlowMaterial(scene, tag + 'Core', coreColor);

    const parts = {};

    // ---- Head ----
    let head;
    if (style === 'mech') {
        head = BABYLON.MeshBuilder.CreateBox(tag + 'Head',
            {width: 1.02 * s, height: 0.82 * s, depth: 0.96 * s}, scene);
    } else {
        head = BABYLON.MeshBuilder.CreateSphere(tag + 'Head', {diameter: 1.18 * s, segments: 12}, scene);
        head.scaling.y = 0.9;
    }
    head.position = new BABYLON.Vector3(0, 1.5 * s, 0);
    head.parent = root;
    const headMat = makeRobotMaterial(scene, tag + 'HeadMat',
        style === 'mech' ? bodyColor.scale(0.9) : new BABYLON.Color3(0.86, 0.87, 0.93),
        opts.emissive, style);
    head.material = headMat;
    head._baseColor = headMat.diffuseColor.clone();  // animation.js hit-flash restore
    head._baseY = head.position.y;                    // animation.js head bob baseline
    parts.head = head;

    // ---- Eyes ----
    const eyeZ = (style === 'mech' ? 0.5 : 0.46) * s;
    const eyeY = 1.6 * s;
    const eyeGap = 0.28 * s;
    ['left', 'right'].forEach(side => {
        const eye = BABYLON.MeshBuilder.CreateSphere(tag + side + 'Eye', {diameter: 0.24 * s, segments: 8}, scene);
        eye.position = new BABYLON.Vector3((side === 'left' ? -1 : 1) * eyeGap, eyeY, eyeZ);
        eye.parent = root;
        eye.material = glowMat;
        eye._glowColor = eyeColor.clone();  // animation.js keeps per-robot eye colour
        parts[side + 'Eye'] = eye;
    });

    if (style === 'mech') {
        const visor = BABYLON.MeshBuilder.CreateBox(tag + 'Visor',
            {width: 0.82 * s, height: 0.2 * s, depth: 0.12 * s}, scene);
        visor.position = new BABYLON.Vector3(0, eyeY, eyeZ - 0.03 * s);
        visor.parent = root;
        visor.material = glowMat;
        const brow = BABYLON.MeshBuilder.CreateBox(tag + 'Brow',
            {width: 1.06 * s, height: 0.16 * s, depth: 1.02 * s}, scene);
        brow.position = new BABYLON.Vector3(0, 1.88 * s, 0);
        brow.parent = root;
        brow.material = trimMat;
    } else {
        [-eyeGap, eyeGap].forEach((x, i) => {
            const hi = BABYLON.MeshBuilder.CreateSphere(tag + 'EyeHi' + i, {diameter: 0.08 * s, segments: 6}, scene);
            hi.position = new BABYLON.Vector3(x + 0.05 * s, eyeY + 0.05 * s, eyeZ + 0.09 * s);
            hi.parent = root;
            const hiMat = new BABYLON.StandardMaterial(tag + 'EyeHiMat' + i, scene);
            hiMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
            hi.material = hiMat;
        });
    }

    // ---- Mouth grille + antenna (regular robots only) ----
    if (wantFace) {
        const mouth = BABYLON.MeshBuilder.CreateBox(tag + 'Mouth',
            {width: 0.46 * s, height: 0.14 * s, depth: 0.06 * s}, scene);
        mouth.position = new BABYLON.Vector3(0, 1.32 * s, eyeZ);
        mouth.parent = root;
        mouth.material = darkMat;
        parts.mouth = mouth;

        const antenna = BABYLON.MeshBuilder.CreateCylinder(tag + 'Antenna',
            {height: 0.5 * s, diameter: 0.08 * s}, scene);
        antenna.position = new BABYLON.Vector3(style === 'mech' ? 0.32 * s : 0, 2.1 * s,
            style === 'mech' ? -0.2 * s : 0);
        antenna.parent = root;
        antenna.material = trimMat;
        const tip = BABYLON.MeshBuilder.CreateSphere(tag + 'AntennaTip', {diameter: 0.16 * s, segments: 8}, scene);
        tip.position = new BABYLON.Vector3(0, 0.3 * s, 0);
        tip.parent = antenna;
        tip.material = makeGlowMaterial(scene, tag + 'AntennaTipMat', eyeColor);
        parts.antenna = antenna;
    }

    // ---- Chest plate + power core ----
    const chest = BABYLON.MeshBuilder.CreateBox(tag + 'Chest',
        {width: 0.92 * s, height: 0.86 * s, depth: 0.16 * s}, scene);
    chest.position = new BABYLON.Vector3(0, 0.3 * s, 0.42 * s);
    chest.parent = root;
    chest.material = trimMat;
    const core = BABYLON.MeshBuilder.CreateCylinder(tag + 'CoreLight',
        {height: 0.12 * s, diameter: 0.34 * s, tessellation: 16}, scene);
    core.rotation.x = Math.PI / 2;
    core.position = new BABYLON.Vector3(0, 0.32 * s, 0.52 * s);
    core.parent = root;
    core.material = coreMat;

    // ---- Shoulder pads ----
    [-1, 1].forEach(side => {
        const pad = BABYLON.MeshBuilder.CreateBox(tag + 'Pauldron' + side,
            {width: 0.5 * s, height: 0.42 * s, depth: 0.62 * s}, scene);
        pad.position = new BABYLON.Vector3(side * 0.95 * s, 0.72 * s, 0);
        pad.parent = root;
        pad.material = style === 'mech' ? trimMat : headMat;
    });

    // ---- Backpack + exhausts (mech only) ----
    if (style === 'mech') {
        const pack = BABYLON.MeshBuilder.CreateBox(tag + 'Pack',
            {width: 0.7 * s, height: 0.8 * s, depth: 0.3 * s}, scene);
        pack.position = new BABYLON.Vector3(0, 0.35 * s, -0.5 * s);
        pack.parent = root;
        pack.material = trimMat;
        [-0.2, 0.2].forEach((x, i) => {
            const ex = BABYLON.MeshBuilder.CreateCylinder(tag + 'Exhaust' + i,
                {height: 0.3 * s, diameter: 0.16 * s}, scene);
            ex.position = new BABYLON.Vector3(x * s, 0.78 * s, -0.6 * s);
            ex.parent = root;
            ex.material = darkMat;
        });
    }

    // ---- Arms ----
    function makeArm(side, name) {
        const arm = BABYLON.MeshBuilder.CreateCapsule(name, {radius: 0.2 * s, height: 1.25 * s}, scene);
        arm.position = new BABYLON.Vector3(side * 1.0 * s, 0.2 * s, 0);
        arm.parent = root;
        arm.material = bodyMat;
        const hand = BABYLON.MeshBuilder.CreateSphere(name + 'Hand', {diameter: 0.34 * s, segments: 8}, scene);
        hand.position = new BABYLON.Vector3(0, -0.62 * s, 0);
        hand.parent = arm;
        hand.material = style === 'mech' ? darkMat : trimMat;
        if (style === 'mech') {
            const elbow = BABYLON.MeshBuilder.CreateSphere(name + 'Elbow', {diameter: 0.26 * s, segments: 8}, scene);
            elbow.parent = arm;
            elbow.material = trimMat;
        }
        return arm;
    }
    parts.leftArm = makeArm(-1, tag + 'LeftArm');
    parts.rightArm = makeArm(1, tag + 'RightArm');

    if (style === 'mech') {
        const cannon = BABYLON.MeshBuilder.CreateCylinder(tag + 'Cannon', {height: 0.5 * s, diameter: 0.28 * s}, scene);
        cannon.rotation.x = Math.PI / 2;
        cannon.position = new BABYLON.Vector3(0, -0.5 * s, 0.3 * s);
        cannon.parent = parts.rightArm;
        cannon.material = darkMat;
    }

    // ---- Legs ----
    if (wantLegs) {
        function makeLeg(side, name) {
            const leg = BABYLON.MeshBuilder.CreateCapsule(name, {radius: 0.23 * s, height: 1.2 * s}, scene);
            leg.position = new BABYLON.Vector3(side * 0.4 * s, -1.0 * s, 0);
            leg.parent = root;
            leg.material = bodyMat;
            const foot = BABYLON.MeshBuilder.CreateBox(name + 'Foot',
                {width: 0.6 * s, height: 0.24 * s, depth: 0.86 * s}, scene);
            foot.position = new BABYLON.Vector3(0, -0.66 * s, 0.16 * s);
            foot.parent = leg;
            foot.material = style === 'mech' ? darkMat : trimMat;
            if (style === 'mech') {
                const knee = BABYLON.MeshBuilder.CreateSphere(name + 'Knee', {diameter: 0.28 * s, segments: 8}, scene);
                knee.parent = leg;
                knee.material = trimMat;
            }
            return {leg, foot};
        }
        const l = makeLeg(-1, tag + 'LeftLeg');
        const r = makeLeg(1, tag + 'RightLeg');
        parts.leftLeg = l.leg;
        parts.leftFoot = l.foot;
        parts.rightLeg = r.leg;
        parts.rightFoot = r.foot;
    }

    return parts;
}

// Create level-specific enemy robot
function createLevelEnemy(scene, enemyType) {
    const enemyConfig = ENEMY_TYPES[enemyType];
    // Torso is shaped like a chest (cosmetic only - hit detection is distance based)
    const enemy = BABYLON.MeshBuilder.CreateBox("enemy",
        {width: 1.55, height: 1.9, depth: 0.9}, scene);

    const playerPosition = scene.activeCamera ? scene.activeCamera.position : new BABYLON.Vector3(0, 0, 0);
    const safePosition = findSafeSpawnPosition(playerPosition);
    enemy.position = safePosition;

    const style = enemyConfig.style || 'cartoon';
    enemy.robotParts = assembleRobot(scene, enemy, {
        tag: "enemy_" + enemyType,
        style: style,
        s: 1,
        bodyColor: enemyConfig.colors.body,
        emissive: enemyConfig.colors.emissive,
        eyeColor: style === 'mech'
            ? new BABYLON.Color3(1, 0.1, 0.05)
            : new BABYLON.Color3(1, 0.35, 0.1),
        coreColor: style === 'mech'
            ? new BABYLON.Color3(0.2, 0.9, 1)
            : new BABYLON.Color3(1, 0.85, 0.2),
        legs: true,
        face: true
    });
    
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
    // Boss colors based on level
    const bossColors = {
        1: { body: new BABYLON.Color3(0.8, 0.4, 0.4), emissive: new BABYLON.Color3(0.2, 0.1, 0.1) },
        2: { body: new BABYLON.Color3(0.9, 0.6, 0.2), emissive: new BABYLON.Color3(0.3, 0.2, 0.05) },
        3: { body: new BABYLON.Color3(0.3, 0.7, 0.3), emissive: new BABYLON.Color3(0.1, 0.2, 0.1) },
        4: { body: new BABYLON.Color3(0.9, 0.2, 0.1), emissive: new BABYLON.Color3(0.4, 0.1, 0.05) },
        5: { body: new BABYLON.Color3(0.9, 0.9, 1), emissive: new BABYLON.Color3(0.4, 0.4, 0.5) }
    };
    const colors = bossColors[level] || bossColors[1];

    const s = (4 + level) / 3;  // scales the whole robot with level
    const boss = BABYLON.MeshBuilder.CreateBox("boss",
        {width: 1.7 * s, height: 2.0 * s, depth: 0.95 * s}, scene);

    const playerPosition = scene.activeCamera ? scene.activeCamera.position : new BABYLON.Vector3(0, 0, 0);
    const safePosition = findSafeSpawnPosition(playerPosition);
    boss.position = safePosition;

    boss.robotParts = assembleRobot(scene, boss, {
        tag: "lboss" + level,
        style: 'mech',
        s: s,
        bodyColor: colors.body,
        emissive: colors.emissive,
        eyeColor: new BABYLON.Color3(1, 0.1, 0.05),
        coreColor: new BABYLON.Color3(1, 0.3, 0.1),
        legs: true,
        face: false
    });
    
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
    const buddy = BABYLON.MeshBuilder.CreateBox("buddy",
        {width: 1.4, height: 1.7, depth: 0.82}, scene);
    buddy.position = new BABYLON.Vector3(-3, 2, 3);

    // Friendly chunky companion - cartoon style, no antenna/legs
    const parts = assembleRobot(scene, buddy, {
        tag: "buddy",
        style: 'cartoon',
        s: 0.9,
        bodyColor: new BABYLON.Color3(0.2, 0.5, 1),
        emissive: new BABYLON.Color3(0.1, 0.2, 0.4),
        eyeColor: new BABYLON.Color3(0.2, 1, 0.4),
        coreColor: new BABYLON.Color3(0.3, 0.7, 1),
        legs: false,
        face: false
    });

    // Protective shield strapped to the left arm
    const shield = BABYLON.MeshBuilder.CreateCylinder("buddyShield", {height: 0.1, diameter: 1}, scene);
    shield.position = new BABYLON.Vector3(0, 0.5, 0.3);
    shield.parent = parts.leftArm;
    shield.rotation.x = Math.PI / 2;

    const shieldMaterial = new BABYLON.StandardMaterial("shieldMaterial", scene);
    shieldMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    shieldMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    shield.material = shieldMaterial;

    // Store references to buddy parts
    parts.shield = shield;
    buddy.robotParts = parts;
    
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
    const s = 2.4;
    const boss = BABYLON.MeshBuilder.CreateBox("boss",
        {width: 1.7 * s, height: 2.0 * s, depth: 0.95 * s}, scene);

    const playerPosition = scene.activeCamera ? scene.activeCamera.position : new BABYLON.Vector3(0, 0, 0);
    const safePosition = findSafeSpawnPosition(playerPosition);
    boss.position = safePosition;

    boss.robotParts = assembleRobot(scene, boss, {
        tag: "gboss",
        style: 'mech',
        s: s,
        bodyColor: new BABYLON.Color3(1, 0.2, 0.2),
        emissive: new BABYLON.Color3(0.3, 0.1, 0.1),
        eyeColor: new BABYLON.Color3(1, 0, 0),
        coreColor: new BABYLON.Color3(1, 0.2, 0.1),
        legs: true,
        face: false
    });
    
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