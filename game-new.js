// Main Game Module - Orchestrates all other modules
// This file coordinates the game systems and runs the main game loop

// Note: All dependencies are loaded via HTML script tags in order:
// gameState.js, entities.js, weapons.js, combat.js, ui.js, terrain.js, audio.js, animation.js, ai.js

// Main game update loop
function updateGame(scene, camera) {
    // Freeze all game logic while paused (e.g. upgrade shop open); scene still renders
    if (gameState.paused) return;

    const baseSpeed = 20.0 * (gameState.player.speedMult || 1); // Units per second (frame rate independent)
    // Clamp dt so a long pause / hitch doesn't cause a huge movement step on resume
    const deltaTime = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.1); // Convert to seconds
    const speed = baseSpeed * deltaTime; // Actual movement per frame
    
    // Note: Boss music is controlled by spawn/death events, not continuous checking
    
    // Simple movement with ray-based collision detection
    if (gameState.keys['w']) {
        const forward = camera.getDirection(BABYLON.Vector3.Forward()).scale(speed);
        if (!isMovementBlocked(scene, camera.position, forward)) {
            camera.position.addInPlace(forward);
        }
    }
    if (gameState.keys['s']) {
        const backward = camera.getDirection(BABYLON.Vector3.Backward()).scale(speed);
        if (!isMovementBlocked(scene, camera.position, backward)) {
            camera.position.addInPlace(backward);
        }
    }
    if (gameState.keys['a']) {
        const left = camera.getDirection(BABYLON.Vector3.Left()).scale(speed);
        if (!isMovementBlocked(scene, camera.position, left)) {
            camera.position.addInPlace(left);
        }
    }
    if (gameState.keys['d']) {
        const right = camera.getDirection(BABYLON.Vector3.Right()).scale(speed);
        if (!isMovementBlocked(scene, camera.position, right)) {
            camera.position.addInPlace(right);
        }
    }
    
    // Update player height based on terrain
    updatePlayerTerrainHeight(scene, camera);

    // Advance the day/night cycle (sun/moon position, lighting, sky colour)
    updateDayNightCycle(scene, camera);

    // Graphics upkeep (shadow casters, etc.)
    if (typeof graphicsUpdate === 'function') graphicsUpdate(scene, camera);

    // Coins & upgrades
    updateCoins(scene, camera);
    updateInvisibility();

    // First-person weapon viewmodel (bob when moving, kick when shooting)
    if (typeof updateViewmodel === 'function') {
        const mm = gameState.mobileMovement;
        const moving = gameState.keys['w'] || gameState.keys['a'] ||
            gameState.keys['s'] || gameState.keys['d'] ||
            (mm && (Math.abs(mm.x) > 0.1 || Math.abs(mm.y) > 0.1));
        updateViewmodel(camera, !!moving);
    }

    // Mobile joystick movement
    if (gameState.mobileMovement) {
        const moveX = gameState.mobileMovement.x * speed;
        const moveY = -gameState.mobileMovement.y * speed;
        
        if (Math.abs(moveY) > 0.1) {
            const direction = moveY > 0 ? camera.getDirection(BABYLON.Vector3.Forward()) : camera.getDirection(BABYLON.Vector3.Backward());
            const movement = direction.scale(Math.abs(moveY));
            if (!isMovementBlocked(scene, camera.position, movement)) {
                camera.position.addInPlace(movement);
            }
        }
        
        if (Math.abs(moveX) > 0.1) {
            const direction = moveX > 0 ? camera.getDirection(BABYLON.Vector3.Right()) : camera.getDirection(BABYLON.Vector3.Left());
            const movement = direction.scale(Math.abs(moveX));
            if (!isMovementBlocked(scene, camera.position, movement)) {
                camera.position.addInPlace(movement);
            }
        }
    }
    
    // Simple jump mechanics
    if (gameState.keys[' '] && gameState.player.isOnGround) {
        gameState.player.velocity.y = gameState.player.jumpPower;
        gameState.player.isOnGround = false;
    }
    
    // Apply gravity (but let terrain following handle the ground collision)
    const gravity = -0.8;
    gameState.player.velocity.y += gravity;
    
    // Apply vertical velocity  
    camera.position.y += gameState.player.velocity.y * 0.1;
    
    // Ground collision will be handled by updatePlayerTerrainHeight()
    // This allows for proper terrain following instead of fixed ground height
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        projectile.position.addInPlace(projectile.direction.scale(projectile.speed));
        
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
        // Fix broken enemy properties
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
                enemy.speed = 0.25;
                enemy.originalSpeed = 0.25;
            } else {
                enemy.speed = 0.10;
                enemy.originalSpeed = 0.10;
            }
        }
        if (enemy.isFrozen === undefined) {
            enemy.isFrozen = false;
        }
        if (enemy.isPoisoned === undefined) {
            enemy.isPoisoned = false;
        }
        if (enemy.canJump === undefined) {
            enemy.canJump = true;
            enemy.lastJump = 0;
            enemy.stuckTimer = 0;
            enemy.lastPosition = enemy.position.clone();
            enemy.isJumping = false;
        }
        
        // Check if enemy should unfreeze
        if (enemy.isFrozen && currentTime - enemy.freezeTime > 10000) {
            unfreezeEnemy(enemy);
        }
        
        // Handle poison damage over time
        if (enemy.isPoisoned) {
            if (currentTime - enemy.lastPoisonTick > 1000) {
                enemy.health -= enemy.poisonDamage;
                enemy.lastPoisonTick = currentTime;
                updateHealthBar(enemy);
                
                createPoisonEffect(scene, enemy.position);
                
                if (enemy.health <= 0) {
                    handleEnemyDeath(scene, enemy);
                    return;
                }
            }
        }
        
        // Apply gravity to all robots
        applyRobotGravity(enemy);
        
        // Skip AI if frozen
        if (enemy.isFrozen) return;

        // Player is invisible: robots lose track and just mill about
        if (typeof isPlayerInvisible === 'function' && isPlayerInvisible() && !enemy.isBoss) {
            enemy.isMoving = false;
            animateRobotIdle(enemy);
            return;
        }

        const distance = BABYLON.Vector3.Distance(enemy.position, camera.position);
        
        // Robot AI: shoot if in range, otherwise move closer
        const shootCooldown = enemy.shootCooldown || 1500;
        if (distance < 15 && distance > 3 && currentTime - enemy.lastShot > shootCooldown) {
            const shootDirection = camera.position.subtract(enemy.position).normalize();
            rotateEnemyTowards(enemy, shootDirection);
            
            animateRobotShooting(enemy);
            
            enemyShoot(scene, enemy, camera);
            playRobotShootSound(enemy, camera);
            enemy.lastShot = currentTime;
            enemy.isMoving = false;
        } else if (distance > 3) {
            moveEnemyWithAvoidance(enemy, camera);
        } else {
            const faceDirection = camera.position.subtract(enemy.position).normalize();
            rotateEnemyTowards(enemy, faceDirection);
            enemy.isMoving = false;
            
            animateRobotIdle(enemy);
        }
        
        // Melee attack if very close
        if (distance < 3 && currentTime - enemy.lastAttack > 2000 && currentTime > gameState.player.invulnerableUntil) {
            gameState.player.health -= 15;
            enemy.lastAttack = currentTime;
            document.getElementById('health').textContent = gameState.player.health;
            
            flashDamageScreen();
            
            if (gameState.player.health <= 0) {
                showGameOver();
            }
        }
    });
    
    // Update buddy projectiles
    for (let i = gameState.buddyProjectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.buddyProjectiles[i];
        projectile.position.addInPlace(projectile.direction.scale(projectile.speed));
        
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            
            if (!enemy || !enemy.position || enemy.health <= 0) continue;
            
            const distance = BABYLON.Vector3.Distance(projectile.position, enemy.position);
            const hitRadius = enemy.isBoss ? 4.0 : 1.5;
            
            if (distance < hitRadius) {
                createHitEffect(scene, enemy.position);
                playHitSound();
                
                projectile.dispose();
                gameState.buddyProjectiles.splice(i, 1);
                
                enemy.health -= projectile.damage;
                updateHealthBar(enemy);
                animateRobotHit(enemy);
                
                if (enemy.health <= 0) {
                    handleEnemyDeath(scene, enemy);
                }
                break;
            }
        }
        
        if (BABYLON.Vector3.Distance(projectile.position, camera.position) > 100) {
            projectile.dispose();
            gameState.buddyProjectiles.splice(i, 1);
        }
    }
    
    // Update enemy projectiles
    for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.enemyProjectiles[i];
        projectile.position.addInPlace(projectile.direction.scale(projectile.speed));
        
        const distance = BABYLON.Vector3.Distance(projectile.position, camera.position);
        if (distance < 2) {
            projectile.dispose();
            gameState.enemyProjectiles.splice(i, 1);
            
            if (Date.now() < gameState.player.invulnerableUntil) {
                continue;
            }
            
            gameState.player.health -= projectile.damage;
            document.getElementById('health').textContent = gameState.player.health;
            
            flashDamageScreen();
            createHitEffect(scene, camera.position);
            
            if (gameState.player.health <= 0) {
                showGameOver();
            }
        }
        
        if (distance > 100) {
            projectile.dispose();
            gameState.enemyProjectiles.splice(i, 1);
        }
    }
    
    // Update weapon drops - float, spin, and vacuum up on contact
    for (let i = gameState.weaponDrops.length - 1; i >= 0; i--) {
        const drop = gameState.weaponDrops[i];
        if (!drop) { gameState.weaponDrops.splice(i, 1); continue; }

        drop.rotation.y += 0.03;
        if (drop._baseY != null) {
            drop.position.y = drop._baseY + Math.sin(currentTime / 380 + i) * 0.18;
        }

        // Despawn uncollected drops so gun models don't pile up
        if (drop.spawnedAt && currentTime - drop.spawnedAt > 30000) {
            if (typeof disposeWeaponModel === 'function') disposeWeaponModel(drop);
            else drop.dispose();
            gameState.weaponDrops.splice(i, 1);
            continue;
        }

        const distance = BABYLON.Vector3.Distance(drop.position, camera.position);
        if (distance < 3) {
            // collectWeapon returns false if we already own it; either way, take it
            if (typeof collectWeapon === 'function') {
                collectWeapon(drop.weaponName);
            } else {
                addWeaponToHUD(drop.weaponName);
            }
            if (typeof disposeWeaponModel === 'function') disposeWeaponModel(drop);
            else drop.dispose();
            gameState.weaponDrops.splice(i, 1);
        }
    }
    
    // Check chest interactions
    if (gameState.keys['e'] || gameState.chestInteract) {
        gameState.chestInteract = false;
        
        for (const chest of gameState.weaponChests) {
            const distance = BABYLON.Vector3.Distance(chest.position, camera.position);
            if (distance < 8) {
                openChestInterface(chest);
                break;
            }
        }
    }
    
    // Show chest prompts
    let nearChest = false;
    for (const chest of gameState.weaponChests) {
        const distance = BABYLON.Vector3.Distance(chest.position, camera.position);
        if (distance < 8) {
            if (!gameState.chestPromptShown) {
                showChestPrompt(chest);
                gameState.chestPromptShown = true;
            }
            nearChest = true;
            break;
        }
    }
    
    if (!nearChest && gameState.chestPromptShown) {
        hideChestPrompt();
        gameState.chestPromptShown = false;
    }
    
    // Check collisions
    checkCollisions(scene);

    // Streak decay
    if (typeof updateFeedback === 'function') updateFeedback();

    if (gameState.mode === 'horde') {
        if (typeof updateHorde === 'function') updateHorde(scene);
    } else {
        // Check for level completion
        checkLevelComplete();

        // Spawn enemies until we've spawned the required amount for this level
        const levelConfig = getCurrentLevelConfig();
        if (gameState.enemiesSpawned < levelConfig.killsRequired && gameState.enemies.length < levelConfig.maxEnemies) {
            const timeSinceLastSpawn = currentTime - (gameState.lastEnemySpawn || 0);
            if (timeSinceLastSpawn > levelConfig.enemySpawnRate) {
                createLevelEnemy(scene, levelConfig.enemyType);
                gameState.lastEnemySpawn = currentTime;
                gameState.enemiesSpawned++;
            }
        }
        updateLevelUI();
    }

    // Update UI
    document.getElementById('enemyCount').textContent = gameState.enemies.length;
    
    // Update reload status based on current cooldown
    const now = Date.now();
    const weapon = gameState.player.hudWeapons[gameState.player.currentWeapon];
    const weaponConfig = getWeaponConfig(weapon);
    const fireRate = weaponConfig ? weaponConfig.fireRate : 100;
    const timeLeft = Math.max(0, fireRate - (now - gameState.player.lastShot));
    
    if (timeLeft > 0) {
        const reloadElement = document.getElementById('reloadStatus');
        reloadElement.textContent = `${Math.ceil(timeLeft / 100) / 10}s`;
        reloadElement.classList.add('reloading');
    }
}

// Update player camera height to follow terrain
function updatePlayerTerrainHeight(scene, camera) {
    // Hard boundary: the ground is 240x240 (centered on origin), so keep the
    // player inside its edges with a small margin. Clamping instead of teleporting
    // means you simply can't walk off the landscape.
    const mapLimit = 116; // half of 240 minus a margin
    if (camera.position.x > mapLimit) camera.position.x = mapLimit;
    if (camera.position.x < -mapLimit) camera.position.x = -mapLimit;
    if (camera.position.z > mapLimit) camera.position.z = mapLimit;
    if (camera.position.z < -mapLimit) camera.position.z = -mapLimit;

    // Create a downward ray from the camera's position
    const rayStart = camera.position.clone();
    rayStart.y += 1; // Start ray slightly above camera
    const rayDirection = new BABYLON.Vector3(0, -1, 0);
    const downRay = new BABYLON.Ray(rayStart, rayDirection);
    
    // Cast ray to find ground/terrain
    const groundHit = scene.pickWithRay(downRay, (mesh) => {
        return mesh.name.includes('Ground') || mesh.name.includes('ground') || 
               mesh.name.includes('hill') || mesh.name.includes('platform') ||
               mesh.name.includes('dune') || mesh.name === 'mainGround';
    });
    
    if (groundHit.hit) {
        const playerHeight = 2.5; // Standard player eye height
        const targetY = groundHit.pickedPoint.y + playerHeight;
        
        // Handle ground collision and terrain following
        if (camera.position.y <= targetY) {
            // On or below ground - snap to terrain height and stop falling
            camera.position.y = targetY;
            gameState.player.velocity.y = 0;
            gameState.player.isOnGround = true;
        } else if (gameState.player.velocity.y <= 0) {
            // Falling but still above ground - allow smooth terrain following
            const currentY = camera.position.y;
            const heightDifference = targetY - currentY;
            
            if (Math.abs(heightDifference) > 0.05) {
                // Smooth interpolation for gradual height changes when walking
                camera.position.y += heightDifference * 0.15; // Slightly faster for responsiveness
            }
        }
    } else {
        // No ground found - check if we're falling too far
        if (camera.position.y < -10) {
            // Fallen too far - teleport to safe position
            camera.position.x = 0;
            camera.position.z = 0;
            camera.position.y = 2.5;
            gameState.player.velocity.y = 0;
            gameState.player.isOnGround = true;
            
            // Apply damage and visual feedback
            gameState.player.health -= 50;
            document.getElementById('health').textContent = gameState.player.health;
            flashDamageScreen();
            
            if (gameState.player.health <= 0) {
                showGameOver();
            }
        } else {
            // Still within reasonable bounds, maintain default height if not jumping
            const defaultGroundY = 2.5;
            if (!gameState.player.velocity || gameState.player.velocity.y <= 0) {
                if (Math.abs(camera.position.y - defaultGroundY) > 0.1) {
                    camera.position.y += (defaultGroundY - camera.position.y) * 0.2;
                } else {
                    camera.position.y = defaultGroundY;
                }
            }
        }
    }
}