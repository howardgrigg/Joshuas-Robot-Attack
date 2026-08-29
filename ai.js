// AI and Movement System Module
// Handles enemy AI, pathfinding, movement, gravity, and jumping mechanics

// Enemy movement with obstacle avoidance and jumping
function moveEnemyWithAvoidance(enemy, camera) {
    const currentTime = Date.now();
    const desiredDirection = camera.position.subtract(enemy.position).normalize();
    const currentPos = enemy.position;
    
    // Check if robot is stuck (hasn't moved much in the last second)
    if (enemy.lastPosition && currentTime - (enemy.lastPositionCheck || 0) > 1000) {
        const distanceMoved = BABYLON.Vector3.Distance(enemy.position, enemy.lastPosition);
        if (distanceMoved < 0.5) {
            enemy.stuckTimer += 1000;
        } else {
            enemy.stuckTimer = 0;
        }
        enemy.lastPosition = enemy.position.clone();
        enemy.lastPositionCheck = currentTime;
    }
    
    // Check for obstacles in front at robot height (not just ground level)
    const robotHeight = enemy.isBoss ? 4.5 : 2;
    const rayStartPos = currentPos.clone();
    rayStartPos.y = robotHeight; // Cast ray at robot's height
    
    const frontRay = new BABYLON.Ray(rayStartPos, desiredDirection);
    const hit = enemy.getScene().pickWithRay(frontRay, (mesh) => {
        return mesh.name.includes('rock') || mesh.name.includes('trunk') || 
               mesh.name.includes('hill') || mesh.name.includes('dune');
    });
    
    // Also check for terrain obstacles by looking ahead on the ground
    const groundCheckPos = currentPos.add(desiredDirection.scale(3));
    const groundCheckRay = new BABYLON.Ray(
        new BABYLON.Vector3(groundCheckPos.x, robotHeight + 2, groundCheckPos.z), 
        new BABYLON.Vector3(0, -1, 0)
    );
    const groundHit = enemy.getScene().pickWithRay(groundCheckRay, (mesh) => {
        return mesh.name.includes('hill') || mesh.name.includes('dune');
    });
    
    let moveDirection = desiredDirection;
    let shouldJump = false;
    let shouldAvoid = false;
    
    // Check if there's a steep terrain obstacle ahead
    if (groundHit.hit) {
        const heightDifference = groundHit.pickedPoint.y - currentPos.y;
        // If the terrain ahead is significantly higher, treat it as an obstacle
        if (heightDifference > 2) {
            shouldAvoid = true;
        }
    }
    
    // If stuck for more than 3 seconds, try to jump (reduced jump frequency for dunes)
    if (enemy.stuckTimer > 3000 && enemy.canJump && currentTime - enemy.lastJump > 5000) {
        shouldJump = true;
        enemy.lastJump = currentTime;
        enemy.stuckTimer = 0;
    } else if ((hit.hit && hit.distance < 4) || shouldAvoid) {
        // Obstacle detected, try to go around it (prefer going around dunes)
        const leftDirection = new BABYLON.Vector3(
            desiredDirection.z, 0, -desiredDirection.x
        ).normalize();
        const rightDirection = new BABYLON.Vector3(
            -desiredDirection.z, 0, desiredDirection.x
        ).normalize();
        
        // Test both left and right directions to see which is clearer
        const leftTestPos = currentPos.add(leftDirection.scale(3));
        const rightTestPos = currentPos.add(rightDirection.scale(3));
        
        const leftRay = new BABYLON.Ray(
            new BABYLON.Vector3(leftTestPos.x, robotHeight + 2, leftTestPos.z), 
            new BABYLON.Vector3(0, -1, 0)
        );
        const rightRay = new BABYLON.Ray(
            new BABYLON.Vector3(rightTestPos.x, robotHeight + 2, rightTestPos.z), 
            new BABYLON.Vector3(0, -1, 0)
        );
        
        const leftHit = enemy.getScene().pickWithRay(leftRay, (mesh) => {
            return mesh.name.includes('hill') || mesh.name.includes('dune');
        });
        const rightHit = enemy.getScene().pickWithRay(rightRay, (mesh) => {
            return mesh.name.includes('hill') || mesh.name.includes('dune');
        });
        
        // Choose the direction with lower terrain
        if (!leftHit.hit || (rightHit.hit && leftHit.pickedPoint.y > rightHit.pickedPoint.y)) {
            moveDirection = rightDirection;
        } else {
            moveDirection = leftDirection;
        }
        
        // Add some forward momentum to avoid getting stuck going sideways
        moveDirection = moveDirection.scale(0.7).add(desiredDirection.scale(0.3)).normalize();
    }
    
    // Rotate enemy to face movement direction
    rotateEnemyTowards(enemy, moveDirection);
    
    // Set moving state for animation
    enemy.isMoving = true;
    enemy.lastDirection = moveDirection;
    
    // Perform jump if needed
    if (shouldJump) {
        const jumpHeight = enemy.isBoss ? 8 : 6;
        const jumpDistance = enemy.isBoss ? 2.0 : 1.5;
        
        enemy.position.y += jumpHeight;
        enemy.position.addInPlace(moveDirection.scale(jumpDistance));
        
        createJumpEffect(enemy.getScene(), enemy.position);
        
        enemy.isJumping = true;
        enemy.jumpStartTime = currentTime;
    } else {
        // Regular movement
        enemy.position.addInPlace(moveDirection.scale(enemy.speed));
    }
    
    // Apply gravity and ground collision for all robots
    applyRobotGravity(enemy);
    
    // Animate walking
    animateRobotWalking(enemy);
    
    // Play footstep sound based on distance to player
    const distanceToPlayer = BABYLON.Vector3.Distance(enemy.position, camera.position);
    if (distanceToPlayer < 20) {
        playRobotFootstep(enemy, camera, distanceToPlayer);
    }
}

// Apply gravity and ground collision to robots
function applyRobotGravity(enemy) {
    const scene = enemy.getScene();
    
    // Create a downward ray from the robot's position
    const rayStart = enemy.position.clone();
    rayStart.y += 0.5;
    const rayDirection = new BABYLON.Vector3(0, -1, 0);
    const downRay = new BABYLON.Ray(rayStart, rayDirection);
    
    // Cast ray to find ground
    const groundHit = scene.pickWithRay(downRay, (mesh) => {
        return mesh.name.includes('Ground') || mesh.name.includes('ground') || 
               mesh.name.includes('hill') || mesh.name.includes('platform') ||
               mesh.name === 'mainGround';
    });
    
    if (groundHit.hit) {
        const robotHeight = enemy.isBoss ? 4.5 : 2;
        const targetY = groundHit.pickedPoint.y + robotHeight;
        
        if (enemy.isJumping) {
            // During jump, allow falling back to ground
            const jumpDuration = Date.now() - (enemy.jumpStartTime || 0);
            if (jumpDuration > 500) {
                if (enemy.position.y > targetY) {
                    enemy.position.y = Math.max(targetY, enemy.position.y - 0.3);
                } else {
                    enemy.position.y = targetY;
                    enemy.isJumping = false;
                }
            }
        } else {
            // When not jumping, stick to ground
            enemy.position.y = targetY;
        }
    } else {
        // No ground found, use default height
        const defaultGroundY = enemy.isBoss ? 4.5 : 2;
        if (!enemy.isJumping) {
            enemy.position.y = defaultGroundY;
        }
    }
}

// Create dust cloud effect when robot jumps
function createJumpEffect(scene, position) {
    const dustCloud = BABYLON.MeshBuilder.CreateSphere("jumpDust", {diameter: 2}, scene);
    dustCloud.position = position.clone();
    dustCloud.position.y = 1;
    
    const dustMaterial = new BABYLON.StandardMaterial("dustMaterial", scene);
    dustMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.4);
    dustMaterial.alpha = 0.5;
    dustCloud.material = dustMaterial;
    
    // Animate the dust cloud
    let scale = 0.1;
    const dustAnimation = setInterval(() => {
        scale += 0.1;
        dustCloud.scaling = new BABYLON.Vector3(scale, scale, scale);
        dustMaterial.alpha -= 0.05;
        
        if (dustMaterial.alpha <= 0) {
            dustCloud.dispose();
            clearInterval(dustAnimation);
        }
    }, 50);
}

// Check collision at specific position
function checkCollisionAtPosition(scene, position) {
    const meshes = scene.meshes;
    for (let mesh of meshes) {
        if (mesh.name.includes('rock') || mesh.name.includes('trunk')) {
            const distance = BABYLON.Vector3.Distance(position, mesh.position);
            const collisionRadius = mesh.scaling.x + 1.5;
            if (distance < collisionRadius) {
                return true;
            }
        }
    }
    return false;
}