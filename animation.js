// Animation and Visual Effects Module
// Handles robot animations, visual effects, and death sequences

// Rotate enemy to face a specific direction
function rotateEnemyTowards(enemy, direction) {
    const angle = Math.atan2(direction.x, direction.z);
    enemy.rotation.y = angle;
}

// Animate robot walking movement
function animateRobotWalking(enemy) {
    if (!enemy.robotParts) return;
    
    enemy.animationTime += 0.15;
    
    // Animate legs walking
    const legSwing = Math.sin(enemy.animationTime) * 0.3;
    const armSwing = Math.sin(enemy.animationTime + Math.PI) * 0.2;
    
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

// Animate robot in shooting stance
function animateRobotShooting(enemy) {
    if (!enemy.robotParts) return;
    
    // Shooting stance - raise arms and point toward target
    if (enemy.robotParts.rightArm) {
        enemy.robotParts.rightArm.rotation.x = -0.5;
        enemy.robotParts.rightArm.rotation.z = -0.2;
    }
    if (enemy.robotParts.leftArm) {
        enemy.robotParts.leftArm.rotation.x = -0.3;
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

// Animate robot in idle state
function animateRobotIdle(enemy) {
    if (!enemy.robotParts) return;
    
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

// Animate robot taking damage
function animateRobotHit(enemy) {
    if (!enemy.robotParts || enemy.isAnimating) return;
    
    enemy.isAnimating = true;
    
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

// Animate robot death with explosion and parts flying
function animateRobotDeath(scene, enemy, callback) {
    if (!enemy.robotParts || enemy.isDying) return;
    
    enemy.isDying = true;
    enemy.speed = 0;
    
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
                part.position.addInPlace(flyDirection.scale(0.2));
                flyDirection.y -= 0.03; // Gravity
                
                part.rotation.addInPlace(rotationSpeed);
                
                if (part.material) {
                    part.material.alpha = Math.max(0, 1 - animationTime / 30);
                }
                
                animationTime++;
            } else {
                clearInterval(partInterval);
                if (index === 0) {
                    setTimeout(callback, 100);
                }
            }
        }, 50);
    });
    
    playExplosionSound();
}