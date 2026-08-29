// User Interface and Controls Module
// Handles keyboard/mouse controls, mobile controls, and chest interface

// Setup keyboard and mouse controls
function setupControls(scene, camera) {
    window.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        gameState.keys[key] = true;
        
        // Map arrow keys to WASD
        if (key === 'arrowup') gameState.keys['w'] = true;
        if (key === 'arrowdown') gameState.keys['s'] = true;
        if (key === 'arrowleft') gameState.keys['a'] = true;
        if (key === 'arrowright') gameState.keys['d'] = true;
        
        if (['1', '2', '3', '4', '5'].includes(key)) {
            selectWeaponSlot(parseInt(key) - 1);
        }

        if (key === 'b' && typeof toggleShop === 'function') {
            toggleShop();
        }

        if (key === 'q' && typeof activateInvisibility === 'function') {
            activateInvisibility();
        }

        if (key === 'e' && !event.repeat && typeof toggleInventory === 'function') {
            toggleInventory();
        }
        
        if (key === ' ' && gameState.player.isOnGround) {
            gameState.player.velocity.y = gameState.player.jumpPower;
            gameState.player.isOnGround = false;
        }
    });
    
    window.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        gameState.keys[key] = false;
        
        // Map arrow keys to WASD for keyup too
        if (key === 'arrowup') gameState.keys['w'] = false;
        if (key === 'arrowdown') gameState.keys['s'] = false;
        if (key === 'arrowleft') gameState.keys['a'] = false;
        if (key === 'arrowright') gameState.keys['d'] = false;
    });
    
    scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN && gameState.gameStarted) {
            shoot(scene, camera);
        }
    });
    
    canvas.addEventListener('click', () => {
        canvas.requestPointerLock();
    });
    
    setupMobileControls(scene, camera);
}

// Setup mobile touch controls
function setupMobileControls(scene, camera) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (isMobile) {
        document.getElementById('mobileControls').style.display = 'block';
    }
    
    // Virtual joystick variables
    let joystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    let joystickKnob = document.getElementById('joystickKnob');
    let joystick = document.getElementById('joystick');
    
    // Touch camera control variables  
    let lastTouch = { x: 0, y: 0 };
    let touchLookActive = false;
    
    gameState.mobileMovement = { x: 0, y: 0 };
    
    // Virtual joystick touch handlers
    joystick.addEventListener('touchstart', function(e) {
        e.preventDefault();
        joystickActive = true;
        const rect = joystick.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    });
    
    joystick.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!joystickActive) return;
        
        const touch = e.touches[0];
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 40;
        
        if (distance <= maxDistance) {
            joystickKnob.style.left = (50 + (dx / maxDistance) * 50) + '%';
            joystickKnob.style.top = (50 + (dy / maxDistance) * 50) + '%';
            gameState.mobileMovement.x = dx / maxDistance;
            gameState.mobileMovement.y = dy / maxDistance;
        } else {
            const angle = Math.atan2(dy, dx);
            const limitedX = Math.cos(angle) * maxDistance;
            const limitedY = Math.sin(angle) * maxDistance;
            joystickKnob.style.left = (50 + (limitedX / maxDistance) * 50) + '%';
            joystickKnob.style.top = (50 + (limitedY / maxDistance) * 50) + '%';
            gameState.mobileMovement.x = limitedX / maxDistance;
            gameState.mobileMovement.y = limitedY / maxDistance;
        }
    });
    
    joystick.addEventListener('touchend', function(e) {
        e.preventDefault();
        joystickActive = false;
        joystickKnob.style.left = '50%';
        joystickKnob.style.top = '50%';
        gameState.mobileMovement.x = 0;
        gameState.mobileMovement.y = 0;
    });
    
    // Action buttons
    document.getElementById('shootButton').addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (gameState.gameStarted) {
            shoot(scene, camera);
        }
    });
    
    document.getElementById('jumpButton').addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (gameState.player.isOnGround) {
            gameState.player.velocity.y = gameState.player.jumpPower;
            gameState.player.isOnGround = false;
        }
    });
    
    
    document.getElementById('chestButton').addEventListener('touchstart', function(e) {
        e.preventDefault();
        gameState.chestInteract = true;
    });
    
    // Touch look controls
    canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            touchLookActive = true;
            lastTouch.x = e.touches[0].clientX;
            lastTouch.y = e.touches[0].clientY;
        }
    });
    
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!touchLookActive || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        
        const sensitivity = 0.005;
        camera.rotation.y += deltaX * sensitivity;
        camera.rotation.x += deltaY * sensitivity;
        
        camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
        
        lastTouch.x = touch.clientX;
        lastTouch.y = touch.clientY;
    });
    
    canvas.addEventListener('touchend', function(e) {
        touchLookActive = false;
    });
}

// Chest interaction functions
function showChestPrompt(chest) {
    let prompt = document.getElementById('chestPrompt');
    if (!prompt) {
        prompt = document.createElement('div');
        prompt.id = 'chestPrompt';
        prompt.style.position = 'fixed';
        prompt.style.top = '40%';
        prompt.style.left = '50%';
        prompt.style.transform = 'translate(-50%, -50%)';
        prompt.style.background = 'rgba(0,0,0,0.8)';
        prompt.style.color = 'white';
        prompt.style.padding = '15px 20px';
        prompt.style.borderRadius = '10px';
        prompt.style.fontSize = '18px';
        prompt.style.zIndex = '999';
        prompt.style.textAlign = 'center';
        prompt.style.border = '2px solid #4ecdc4';
        document.body.appendChild(prompt);
    }
    
    const weaponCount = chest.storedWeapons.length;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    prompt.innerHTML = `
        <div>💎 Weapon Chest</div>
        <div style="font-size: 14px; margin-top: 5px;">
            ${weaponCount} weapon${weaponCount !== 1 ? 's' : ''} stored
        </div>
        <div style="font-size: 14px; margin-top: 10px;">
            ${isMobile ? 'Tap chest button to interact' : 'Press [E] to interact'}
        </div>
    `;
    prompt.style.display = 'block';
    
    if (isMobile) {
        document.getElementById('chestInteractButton').style.display = 'block';
    }
}

function hideChestPrompt() {
    const prompt = document.getElementById('chestPrompt');
    if (prompt) {
        prompt.style.display = 'none';
    }
    
    document.getElementById('chestInteractButton').style.display = 'none';
}

function openChestInterface(chest) {
    gameState.activeChest = chest;
    
    let chestUI = document.getElementById('chestInterface');
    if (!chestUI) {
        chestUI = document.createElement('div');
        chestUI.id = 'chestInterface';
        chestUI.style.position = 'fixed';
        chestUI.style.top = '50%';
        chestUI.style.left = '50%';
        chestUI.style.transform = 'translate(-50%, -50%)';
        chestUI.style.background = 'rgba(0,0,0,0.95)';
        chestUI.style.color = 'white';
        chestUI.style.padding = '20px';
        chestUI.style.borderRadius = '15px';
        chestUI.style.fontSize = '16px';
        chestUI.style.zIndex = '1001';
        chestUI.style.minWidth = '400px';
        chestUI.style.maxWidth = '600px';
        chestUI.style.border = '3px solid #4ecdc4';
        chestUI.style.boxShadow = '0 0 20px rgba(78, 205, 196, 0.5)';
        document.body.appendChild(chestUI);
    }
    
    updateChestInterface(chest);
    chestUI.style.display = 'block';
    
    gameState.gameStarted = false;
}

function updateChestInterface(chest) {
    const chestUI = document.getElementById('chestInterface');
    if (!chestUI) return;
    
    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #4ecdc4;">💎 Weapon Chest ${chest.id + 1}</h2>
        </div>
        
        <div style="display: flex; gap: 20px;">
            <div style="flex: 1;">
                <h3 style="color: #ffd700; margin-bottom: 10px;">Your Weapons:</h3>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">
    `;
    
    for (let i = 0; i < gameState.player.weapons.length; i++) {
        const weapon = gameState.player.weapons[i];
        const isCurrentWeapon = i === gameState.player.currentWeapon;
        html += `
            <div style="margin: 5px 0; padding: 8px; background: ${isCurrentWeapon ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255,255,255,0.1)'}; border-radius: 5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="storeWeapon(${i})">
                <span>${weapon} ${isCurrentWeapon ? '(equipped)' : ''}</span>
                <button style="background: #ff6b6b; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Store</button>
            </div>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <div style="flex: 1;">
                <h3 style="color: #90EE90; margin-bottom: 10px;">Stored Weapons:</h3>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">
    `;
    
    if (chest.storedWeapons.length === 0) {
        html += '<div style="text-align: center; color: #888;">No weapons stored</div>';
    } else {
        for (let i = 0; i < chest.storedWeapons.length; i++) {
            const weapon = chest.storedWeapons[i];
            html += `
                <div style="margin: 5px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 5px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="retrieveWeapon(${i})">
                    <span>${weapon}</span>
                    <button style="background: #4ecdc4; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Take</button>
                </div>
            `;
        }
    }
    
    html += `
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="closeChestInterface()" style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px;">Close Chest</button>
        </div>
    `;
    
    chestUI.innerHTML = html;
}

function storeWeapon(weaponIndex) {
    const chest = gameState.activeChest;
    if (!chest || weaponIndex === gameState.player.currentWeapon) {
        return;
    }
    
    const weapon = gameState.player.weapons[weaponIndex];
    
    chest.storedWeapons.push(weapon);
    gameState.player.weapons.splice(weaponIndex, 1);
    gameState.player.weaponsCollected--;
    
    if (gameState.player.currentWeapon > weaponIndex) {
        gameState.player.currentWeapon--;
    } else if (gameState.player.currentWeapon === weaponIndex) {
        gameState.player.currentWeapon = 0;
    }
    
    const currentWeaponName = gameState.player.weapons[gameState.player.currentWeapon];
    document.getElementById('currentWeapon').textContent = currentWeaponName;
    document.getElementById('weaponDescription').textContent = getWeaponDescription(currentWeaponName);
    document.getElementById('weaponCount').textContent = gameState.player.weaponsCollected + '/50';
    
    updateChestIndicator(chest);
    updateChestInterface(chest);
}

function retrieveWeapon(weaponIndex) {
    const chest = gameState.activeChest;
    if (!chest) return;
    
    const weapon = chest.storedWeapons[weaponIndex];
    
    if (gameState.player.weapons.includes(weapon)) {
        return;
    }
    
    gameState.player.weapons.push(weapon);
    gameState.player.weaponsCollected++;
    chest.storedWeapons.splice(weaponIndex, 1);
    
    document.getElementById('weaponCount').textContent = gameState.player.weaponsCollected + '/50';
    
    updateChestIndicator(chest);
    updateChestInterface(chest);
}

function closeChestInterface() {
    const chestUI = document.getElementById('chestInterface');
    if (chestUI) {
        chestUI.style.display = 'none';
    }
    
    gameState.activeChest = null;
    gameState.gameStarted = true;
}

function updateChestIndicator(chest) {
    if (chest.indicator) {
        const weaponCount = chest.storedWeapons.length;
        chest.indicator.textContent = weaponCount.toString();
        
        if (weaponCount > 0) {
            chest.indicator.material.diffuseColor = new BABYLON.Color3(1, 1, 0);
            chest.indicator.material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
        } else {
            chest.indicator.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            chest.indicator.material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        }
    }
}

// Modal system to replace JavaScript alerts
function showModal(title, message, buttons = []) {
    // Remove any existing modal
    hideModal();
    
    // Release pointer lock so user can click modal buttons
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
    
    const modal = document.createElement('div');
    modal.id = 'gameModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '2000';
    
    const modalContent = document.createElement('div');
    modalContent.style.background = 'linear-gradient(135deg, #2c3e50, #34495e)';
    modalContent.style.color = 'white';
    modalContent.style.padding = '30px';
    modalContent.style.borderRadius = '15px';
    modalContent.style.maxWidth = '500px';
    modalContent.style.minWidth = '300px';
    modalContent.style.textAlign = 'center';
    modalContent.style.border = '3px solid #4ecdc4';
    modalContent.style.boxShadow = '0 0 30px rgba(78, 205, 196, 0.6)';
    
    let html = `<h2 style="margin: 0 0 20px 0; color: #4ecdc4;">${title}</h2>`;
    html += `<div style="margin: 20px 0; font-size: 16px; line-height: 1.5;">${message}</div>`;
    
    if (buttons.length === 0) {
        buttons = [{ text: 'OK', action: hideModal }];
    }
    
    html += '<div style="margin-top: 25px; display: flex; gap: 15px; justify-content: center;">';
    buttons.forEach((button, index) => {
        const bgColor = index === 0 ? '#4ecdc4' : '#e74c3c';
        html += `<button onclick="handleModalButton(${index})" style="background: ${bgColor}; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; transition: all 0.2s;">${button.text}</button>`;
    });
    html += '</div>';
    
    modalContent.innerHTML = html;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Store button actions globally for access
    window.modalButtonActions = buttons.map(btn => btn.action);
}

function hideModal(relockPointer = true) {
    const modal = document.getElementById('gameModal');
    if (modal) {
        modal.remove();
    }
    window.modalButtonActions = null;
    
    // Re-lock pointer if game is active and requested
    if (relockPointer && gameState.gameStarted && !document.pointerLockElement) {
        // Small delay to ensure modal is fully removed before re-locking
        setTimeout(() => {
            if (gameState.gameStarted) {
                canvas.requestPointerLock();
            }
        }, 100);
    }
}

function handleModalButton(index) {
    if (window.modalButtonActions && window.modalButtonActions[index]) {
        window.modalButtonActions[index]();
    }
}

// Game over modal with restart functionality
let _runEnded = false;
function showGameOver() {
    let msg = 'Your journey ends here, but you can try again!';
    if (!_runEnded && typeof recordRunEnd === 'function') {
        _runEnded = true;
        const beat = recordRunEnd();
        msg += recordsSummaryHTML(beat);
    }
    showModal('Game Over!', msg, [
        { 
            text: 'Restart Game', 
            action: () => {
                hideModal(false); // Don't re-lock pointer since we're reloading
                location.reload();
            }
        },
        { 
            text: 'Close', 
            action: () => hideModal(false) // Don't re-lock pointer for game over
        }
    ]);
}

// Boss alert modal
function showBossAlert(message) {
    showModal('⚠️ BOSS ALERT! ⚠️', message, [
        { 
            text: 'Ready for Battle!', 
            action: hideModal 
        }
    ]);
}

// Level completion modal
function showLevelComplete(message) {
    showModal('🎉 Level Complete! 🎉', message, [
        { 
            text: 'Continue', 
            action: hideModal 
        }
    ]);
}

// Victory modal
function showVictory(message) {
    if (!_runEnded && typeof recordRunEnd === 'function') {
        _runEnded = true;
        const beat = recordRunEnd();
        message += recordsSummaryHTML(beat);
    }
    showModal('🏆 VICTORY! 🏆', message, [
        { 
            text: 'Play Again', 
            action: () => {
                hideModal(false); // Don't re-lock pointer since we're reloading
                location.reload();
            }
        },
        { 
            text: 'Close', 
            action: () => hideModal(false) // Don't re-lock pointer for victory
        }
    ]);
}

// Weapon HUD system
function createWeaponHUD() {
    // Remove existing HUD if present
    const existingHUD = document.getElementById('weaponHUD');
    if (existingHUD) {
        existingHUD.remove();
    }
    
    const hud = document.createElement('div');
    hud.id = 'weaponHUD';
    hud.style.position = 'fixed';
    hud.style.left = '50%';
    hud.style.transform = 'translateX(-50%)';
    hud.style.display = 'flex';
    hud.style.gap = '10px';
    hud.style.zIndex = '100';
    hud.style.padding = '15px';
    hud.style.background = 'rgba(0, 0, 0, 0.7)';
    hud.style.borderRadius = '15px';
    hud.style.border = '2px solid #4ecdc4';
    hud.style.backdropFilter = 'blur(5px)';
    
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (isMobile) {
        hud.style.top = '20px';
        hud.style.bottom = 'auto';
    } else {
        hud.style.bottom = '20px';
        hud.style.top = 'auto';
    }
    
    // Create 5 weapon slots
    for (let i = 0; i < 5; i++) {
        const slot = document.createElement('div');
        slot.id = `weaponSlot${i}`;
        slot.className = 'weapon-slot';
        slot.style.width = '60px';
        slot.style.height = '60px';
        slot.style.border = '2px solid #666';
        slot.style.borderRadius = '8px';
        slot.style.background = 'rgba(40, 40, 40, 0.9)';
        slot.style.display = 'flex';
        slot.style.alignItems = 'center';
        slot.style.justifyContent = 'center';
        slot.style.position = 'relative';
        slot.style.cursor = 'pointer';
        slot.style.transition = 'all 0.2s ease';
        
        // Add key number indicator
        const keyNumber = document.createElement('div');
        keyNumber.textContent = (i + 1).toString();
        keyNumber.style.position = 'absolute';
        keyNumber.style.top = '-8px';
        keyNumber.style.left = '-8px';
        keyNumber.style.width = '20px';
        keyNumber.style.height = '20px';
        keyNumber.style.background = '#4ecdc4';
        keyNumber.style.color = 'black';
        keyNumber.style.borderRadius = '50%';
        keyNumber.style.display = 'flex';
        keyNumber.style.alignItems = 'center';
        keyNumber.style.justifyContent = 'center';
        keyNumber.style.fontSize = '12px';
        keyNumber.style.fontWeight = 'bold';
        keyNumber.style.border = '2px solid #333';
        
        // Add weapon image container
        const imageContainer = document.createElement('div');
        imageContainer.id = `weaponImage${i}`;
        imageContainer.style.width = '50px';
        imageContainer.style.height = '50px';
        imageContainer.style.backgroundSize = 'cover';
        imageContainer.style.backgroundPosition = 'center';
        imageContainer.style.borderRadius = '4px';
        imageContainer.style.display = 'none'; // Hidden until weapon is assigned
        
        // Add empty slot text
        const emptyText = document.createElement('div');
        emptyText.id = `emptyText${i}`;
        emptyText.textContent = 'Empty';
        emptyText.style.color = '#888';
        emptyText.style.fontSize = '10px';
        emptyText.style.textAlign = 'center';
        
        // Add click handler for weapon selection
        slot.addEventListener('click', () => selectWeaponSlot(i));
        
        slot.appendChild(keyNumber);
        slot.appendChild(imageContainer);
        slot.appendChild(emptyText);
        hud.appendChild(slot);
    }
    
    document.body.appendChild(hud);
    
    // Initialize with current weapon
    updateWeaponHUD();
}

function selectWeaponSlot(slotIndex) {
    // Only allow selection if there's a weapon in that slot
    if (slotIndex < gameState.player.hudWeapons.length) {
        gameState.player.currentWeapon = slotIndex;
        updateWeaponDisplay();
        updateWeaponHUD();
    }
}

function updateWeaponHUD() {
    // Ensure hudWeapons array exists and is properly sized
    if (!gameState.player.hudWeapons) {
        gameState.player.hudWeapons = gameState.player.weapons.slice(0, 5);
    }
    
    for (let i = 0; i < 5; i++) {
        const slot = document.getElementById(`weaponSlot${i}`);
        const imageContainer = document.getElementById(`weaponImage${i}`);
        const emptyText = document.getElementById(`emptyText${i}`);
        
        if (!slot || !imageContainer || !emptyText) continue;
        
        // Reset slot styling
        slot.style.border = '2px solid #666';
        slot.style.background = 'rgba(40, 40, 40, 0.9)';
        
        if (i < gameState.player.hudWeapons.length) {
            // Slot has a weapon - show a spinning render of its model
            const weaponName = gameState.player.hudWeapons[i];
            if (typeof applyWeaponIcon === 'function') {
                applyWeaponIcon(imageContainer, weaponName);
            } else {
                const weaponImage = getWeaponImage(weaponName);
                if (weaponImage) imageContainer.style.backgroundImage = `url('${weaponImage}')`;
            }
            imageContainer.style.display = 'block';
            emptyText.style.display = 'none';

            // Highlight current weapon
            if (i === gameState.player.currentWeapon) {
                slot.style.border = '2px solid #4ecdc4';
                slot.style.background = 'rgba(78, 205, 196, 0.2)';
                slot.style.boxShadow = '0 0 10px rgba(78, 205, 196, 0.6)';
            } else {
                slot.style.boxShadow = 'none';
            }
        } else {
            // Empty slot
            imageContainer.style.display = 'none';
            emptyText.style.display = 'block';
            slot.style.boxShadow = 'none';
        }
    }
}

function updateWeaponDisplay() {
    const currentWeaponName = gameState.player.hudWeapons[gameState.player.currentWeapon];
    if (currentWeaponName) {
        document.getElementById('currentWeapon').textContent = currentWeaponName;
        document.getElementById('weaponDescription').textContent = getWeaponDescription(currentWeaponName);
        if (typeof viewmodelSetWeapon === 'function') viewmodelSetWeapon(currentWeaponName);
    }
}

// Add a weapon to the player's arsenal with HUD management
function addWeaponToHUD(weaponName) {
    // Don't add if already have this weapon
    if (gameState.player.weapons.includes(weaponName)) {
        return false;
    }
    
    // Add to full weapons list
    gameState.player.weapons.push(weaponName);
    gameState.player.weaponsCollected++;
    
    // Add to HUD weapons (max 5)
    if (gameState.player.hudWeapons.length < 5) {
        // If HUD has space, add it
        gameState.player.hudWeapons.push(weaponName);
        gameState.player.currentWeapon = gameState.player.hudWeapons.length - 1;
    } else {
        // If HUD is full, replace the currently selected weapon
        gameState.player.hudWeapons[gameState.player.currentWeapon] = weaponName;
        // Stay on the same slot (currentWeapon doesn't change)
    }
    
    // Update displays
    updateWeaponDisplay();
    updateWeaponHUD();
    document.getElementById('weaponCount').textContent = gameState.player.weaponsCollected + '/50';
    
    return true;
}