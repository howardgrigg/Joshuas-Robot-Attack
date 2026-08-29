// Combat System Module
// Handles shooting, projectiles, collisions, damage, and status effects

// Player shooting function
function shoot(scene, camera) {
    const currentTime = Date.now();
    const weapon = gameState.player.hudWeapons[gameState.player.currentWeapon];
    const weaponConfig = getWeaponConfig(weapon);
    const fireRate = weaponConfig ? weaponConfig.fireRate : 100;
    
    // Check fire rate cooldown
    if (currentTime - gameState.player.lastShot < fireRate) {
        return;
    }
    
    createProjectile(scene, camera, weapon);
    if (typeof spawnMuzzleFlash === 'function') spawnMuzzleFlash(scene, camera);
    playWeaponSound(weapon);
    gameState.player.lastShot = currentTime;
    
    updateReloadStatus(weaponConfig);
}

// Create projectile from camera position
function createProjectile(scene, camera, weaponType) {
    const weapon = getWeaponConfig(weaponType);
    const startPosition = camera.position.clone();
    startPosition.y -= 0.5;
    const direction = camera.getForwardRay().direction.normalize();
    
    const projectiles = weapon.createProjectile(scene, startPosition, direction);
    
    projectiles.forEach(projectile => {
        gameState.projectiles.push(projectile);
    });
    
    return projectiles[0];
}

// Enemy shooting function
function enemyShoot(scene, enemy, camera) {
    const diameter = enemy.isBoss ? 0.8 : 0.4;
    const projectile = BABYLON.MeshBuilder.CreateSphere("enemyProjectile", {diameter: diameter}, scene);
    projectile.position = enemy.position.clone();
    projectile.position.y += enemy.isBoss ? 3 : 1;
    
    projectile.direction = camera.position.subtract(enemy.position).normalize();
    projectile.speed = enemy.isBoss ? 2.5 : 1.5;
    projectile.damage = enemy.isBoss ? 25 : 8;
    
    const material = new BABYLON.StandardMaterial("enemyProjectileMaterial", scene);
    if (enemy.isBoss) {
        material.diffuseColor = new BABYLON.Color3(1, 0, 1);
        material.emissiveColor = new BABYLON.Color3(1, 0, 1);
    } else {
        material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
        material.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
    }
    projectile.material = material;
    
    gameState.enemyProjectiles.push(projectile);
}

// Check all collision types
function checkCollisions(scene) {
    // Player projectiles hitting enemies
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            
            if (!enemy || !enemy.position || enemy.health <= 0) continue;
            
            const distance = BABYLON.Vector3.Distance(projectile.position, enemy.position);
            const hitRadius = enemy.isBoss ? 4.0 : 1.5;
            
            if (distance < hitRadius) {
                createHitEffect(scene, enemy.position);
                playHitSound();
                
                projectile.dispose();
                gameState.projectiles.splice(i, 1);
                
                // Apply weapon effects
                if (projectile.weaponType === 'Freeze Gun') {
                    freezeEnemy(enemy);
                } else if (projectile.special === 'poison') {
                    enemy.health -= projectile.damage;
                    poisonEnemy(enemy, projectile.damage);
                    
                    if (enemy.health <= 0) {
                        enemy.health = 0; // Ensure health shows 0
                        updateHealthBar(enemy);
                        handleEnemyDeath(scene, enemy);
                    } else {
                        updateHealthBar(enemy);
                        animateRobotHit(enemy);
                    }
                } else {
                    enemy.health -= projectile.damage;
                    
                    if (enemy.health <= 0) {
                        enemy.health = 0; // Ensure health shows 0
                        updateHealthBar(enemy);
                        handleEnemyDeath(scene, enemy);
                    } else {
                        updateHealthBar(enemy);
                        animateRobotHit(enemy);
                    }
                }
                break;
            }
        }
    }
    
    // Buddy projectiles hitting enemies
    for (let i = gameState.buddyProjectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.buddyProjectiles[i];
        
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
                
                if (enemy.health <= 0) {
                    enemy.health = 0; // Ensure health shows 0
                    updateHealthBar(enemy);
                    handleEnemyDeath(scene, enemy);
                } else {
                    updateHealthBar(enemy);
                    animateRobotHit(enemy);
                }
                break;
            }
        }
    }
    
    // Enemy projectiles hitting player
    for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.enemyProjectiles[i];
        const distance = BABYLON.Vector3.Distance(projectile.position, scene.activeCamera.position);
        
        if (distance < 2) {
            projectile.dispose();
            gameState.enemyProjectiles.splice(i, 1);
            
            // Check invulnerability
            if (Date.now() < gameState.player.invulnerableUntil) {
                continue;
            }
            
            gameState.player.health -= projectile.damage;
            document.getElementById('health').textContent = gameState.player.health;
            
            flashDamageScreen();
            createHitEffect(scene, scene.activeCamera.position);
            
            if (gameState.player.health <= 0) {
                showGameOver();
            }
        }
    }
}

// Handle enemy death
function handleEnemyDeath(scene, enemy) {
    dropWeapon(scene, enemy.position);
    if (typeof maybeDropCoins === 'function') maybeDropCoins(scene, enemy);
    
    animateRobotDeath(scene, enemy, () => {
        enemy.dispose();
        const index = gameState.enemies.indexOf(enemy);
        if (index > -1) {
            gameState.enemies.splice(index, 1);
        }
        
        if (enemy.isBoss) {
            // Stop boss fight music when boss dies
            stopBossFightMusic();
            
            if (gameState.currentLevel >= 5) {
                showGameComplete();
                gameState.gameStarted = false;
            } else {
                // Boss defeated, advance to next level
                setTimeout(() => {
                    completeLevel();
                }, 1000);
            }
        } else {
            gameState.killCount++;
        }
    });
}

// Create hit effect at position
function createHitEffect(scene, position) {
    const effect = BABYLON.MeshBuilder.CreateSphere("effect", {diameter: 2}, scene);
    effect.position = position.clone();

    const material = new BABYLON.StandardMaterial("effectMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(1, 1, 0);
    material.emissiveColor = new BABYLON.Color3(1, 1, 0);
    effect.material = material;

    setTimeout(() => effect.dispose(), 200);

    if (typeof spawnHitSparks === 'function') spawnHitSparks(scene, position);
}

// Visual damage feedback
function flashDamageScreen() {
    const overlay = document.getElementById('damageOverlay');
    if (overlay) {
        overlay.classList.add('flash');

        setTimeout(() => {
            overlay.classList.remove('flash');
        }, 300);
    }
    if (typeof addScreenShake === 'function') addScreenShake(0.045);
}

// Update reload status UI
function updateReloadStatus(weaponConfig) {
    const reloadElement = document.getElementById('reloadStatus');
    const fireRate = weaponConfig ? weaponConfig.fireRate : 100;
    
    reloadElement.textContent = 'Reloading...';
    reloadElement.classList.add('reloading');
    
    setTimeout(() => {
        reloadElement.textContent = 'Ready';
        reloadElement.classList.remove('reloading');
    }, fireRate);
}

// Freeze enemy status effect
function freezeEnemy(enemy) {
    if (enemy.isFrozen) return;
    
    enemy.isFrozen = true;
    enemy.freezeTime = Date.now();
    enemy.speed = 0;
    
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

// Unfreeze enemy
function unfreezeEnemy(enemy) {
    enemy.isFrozen = false;
    enemy.speed = enemy.originalSpeed;
    
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
    
    if (enemy.iceCrystals) {
        enemy.iceCrystals.dispose();
        enemy.iceCrystals = null;
    }
    
    createMeltEffect(enemy.getScene(), enemy.position);
}

// Create melt effect when unfreezing
function createMeltEffect(scene, position) {
    const melt = BABYLON.MeshBuilder.CreateSphere("melt", {diameter: 3}, scene);
    melt.position = position.clone();
    melt.position.y += 1;
    
    const meltMaterial = new BABYLON.StandardMaterial("meltMaterial", scene);
    meltMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
    meltMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.5, 0.8);
    melt.material = meltMaterial;
    
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

// Apply poison status effect
function poisonEnemy(enemy, baseDamage) {
    if (enemy.isPoisoned) return;
    
    enemy.isPoisoned = true;
    enemy.poisonTime = Date.now();
    enemy.poisonDamage = Math.floor(baseDamage * 0.3);
    enemy.lastPoisonTick = Date.now();
    
    const poisonMaterial = new BABYLON.StandardMaterial("poisonMaterial", enemy.getScene());
    poisonMaterial.diffuseColor = new BABYLON.Color3(0.6, 1, 0.2);
    poisonMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.1);
    
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

// Cure poison status effect
function curePoison(enemy) {
    enemy.isPoisoned = false;
    enemy.poisonDamage = 0;
    enemy.poisonTime = 0;
    enemy.lastPoisonTick = 0;
    
    if (enemy.originalMaterials) {
        enemy.material = enemy.originalMaterials.body;
        enemy.robotParts.head.material = enemy.originalMaterials.head;
        enemy.robotParts.leftArm.material = enemy.originalMaterials.leftArm;
        enemy.robotParts.rightArm.material = enemy.originalMaterials.rightArm;
    }
    
    if (enemy.poisonCloud) {
        enemy.poisonCloud.dispose();
        enemy.poisonCloud = null;
    }
    
    createCureEffect(enemy.getScene(), enemy.position);
}

// Create poison effect visual
function createPoisonEffect(scene, position) {
    const effect = BABYLON.MeshBuilder.CreateSphere("poisonEffect", {diameter: 1}, scene);
    effect.position = position.clone();
    effect.position.y += 2;
    
    const material = new BABYLON.StandardMaterial("poisonEffectMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0.4, 0.8, 0.2);
    material.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.1);
    material.alpha = 0.7;
    effect.material = material;
    
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

// Create cure effect visual
function createCureEffect(scene, position) {
    const cure = BABYLON.MeshBuilder.CreateSphere("cure", {diameter: 2}, scene);
    cure.position = position.clone();
    cure.position.y += 1;
    
    const cureMaterial = new BABYLON.StandardMaterial("cureMaterial", scene);
    cureMaterial.diffuseColor = new BABYLON.Color3(0.8, 1, 0.8);
    cureMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.6, 0.4);
    cureMaterial.alpha = 0.8;
    cure.material = cureMaterial;
    
    let scale = 0.2;
    const cureInterval = setInterval(() => {
        scale += 0.1;
        cure.scaling = new BABYLON.Vector3(scale, scale, scale);
        cureMaterial.alpha = Math.max(0, 0.8 - scale * 0.3);
        
        if (scale > 1.5) {
            clearInterval(cureInterval);
            cure.dispose();
        }
    }, 80);
}

// Check collision at specific position using obstacle array (for enemies)
function checkCollisionAtPosition(scene, position) {
    // Check against tracked obstacles (more reliable)
    for (const obstacle of gameState.obstacles) {
        const distance = BABYLON.Vector3.Distance(obstacle.position, new BABYLON.Vector3(position.x, 0, position.z));
        if (distance < obstacle.radius) {
            return true;
        }
    }
    
    // Also check ground level to prevent going underground
    if (position.y < 1) {
        return true;
    }
    
    return false;
}

// Check if movement is blocked using ray casting (for player)
function isMovementBlocked(scene, currentPosition, movementVector) {
    const rayStart = currentPosition.clone();
    const rayDirection = movementVector.clone().normalize(); // Clone before normalizing!
    const rayLength = movementVector.length() + 1; // Add buffer
    
    const ray = new BABYLON.Ray(rayStart, rayDirection, rayLength);
    
    const hit = scene.pickWithRay(ray, (mesh) => {
        return mesh.checkCollisions && (
            mesh.name.includes('rock') ||
            mesh.name.includes('trunk') ||
            mesh.name.includes('platform') ||
            mesh.name.includes('cactus') ||
            mesh.name.includes('log') ||
            mesh.name.includes('panel') ||
            mesh.name.includes('dune') ||
            mesh.name.includes('hill')
        );
    });
    
    return hit.hit;
}