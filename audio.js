// Audio System Module
// Handles all sound effects and audio management using Web Audio API

// Initialize audio context and sound system
function initializeSounds(scene) {
    try {
        gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log("Web Audio API not supported");
        return;
    }
}

// Create beep sound with specified frequency and duration
function createBeepSound(frequency, duration, volume = 0.1) {
    if (!gameState.audioContext) return;
    
    // Resume audio context if suspended (common browser requirement)
    if (gameState.audioContext.state === 'suspended') {
        gameState.audioContext.resume();
    }
    
    const oscillator = gameState.audioContext.createOscillator();
    const gainNode = gameState.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(gameState.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, gameState.audioContext.currentTime);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, gameState.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, gameState.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, gameState.audioContext.currentTime + duration);
    
    oscillator.start(gameState.audioContext.currentTime);
    oscillator.stop(gameState.audioContext.currentTime + duration);
}

// Play robot footstep sound with distance-based volume
function playRobotFootstep(enemy, camera, distance) {
    const currentTime = Date.now();
    if (!enemy.lastFootstep || currentTime - enemy.lastFootstep > 500) {
        enemy.lastFootstep = currentTime;
        
        const volume = Math.max(0.02, 0.2 - (distance / 100));
        const pitch = 80 + (enemy.position.x % 20);
        
        createBeepSound(pitch, 0.1, volume);
    }
}

// Play robot shooting sound
function playRobotShootSound(enemy, camera) {
    const distance = BABYLON.Vector3.Distance(enemy.position, camera.position);
    const volume = Math.max(0.05, 0.3 - (distance / 50));
    
    createBeepSound(400, 0.2, volume);
}

// Play weapon sound based on weapon type
function playWeaponSound(weaponName) {
    let frequency = 300;
    let duration = 0.15;
    
    if (weaponName.includes('Laser')) {
        frequency = 800;
        duration = 0.3;
    } else if (weaponName.includes('Rocket')) {
        frequency = 150;
        duration = 0.4;
    } else if (weaponName.includes('Magic')) {
        frequency = 600;
        duration = 0.25;
    }
    
    createBeepSound(frequency, duration, 0.15);
}

// Play buddy weapon sound (higher pitched)
function playBuddyWeaponSound(weaponName) {
    let frequency = 300;
    let duration = 0.15;
    
    if (weaponName.includes('Laser')) {
        frequency = 800;
        duration = 0.3;
    } else if (weaponName.includes('Rocket')) {
        frequency = 150;
        duration = 0.4;
    } else if (weaponName.includes('Magic')) {
        frequency = 600;
        duration = 0.25;
    }
    
    frequency = Math.floor(frequency * 1.5);
    createBeepSound(frequency, duration, 0.1);
}

// Play hit sound effect
function playHitSound() {
    createBeepSound(200, 0.1, 0.1);
}

// Play explosion sound effect
function playExplosionSound() {
    createBeepSound(100, 0.5, 0.2);
}

// Boss fight music system
let bossMusicInterval = null;
let bossMusicActive = false;

// Start intense boss fight music
function startBossFightMusic() {
    console.log("🎵 Attempting to start boss fight music...");
    
    if (bossMusicActive) {
        console.log("🎵 Boss music already active");
        return;
    }
    
    if (!gameState.audioContext) {
        console.log("🎵 No audio context available, initializing...");
        try {
            gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("🎵 Failed to create audio context:", e);
            return;
        }
    }
    
    bossMusicActive = true;
    console.log("🎵 Boss fight music started!");
    
    // Resume audio context if suspended
    if (gameState.audioContext.state === 'suspended') {
        console.log("🎵 Resuming suspended audio context...");
        gameState.audioContext.resume().then(() => {
            console.log("🎵 Audio context resumed successfully");
            playBossMusicLoop();
        }).catch(e => {
            console.error("🎵 Failed to resume audio context:", e);
        });
    } else {
        // Create intense, fast-paced boss music
        playBossMusicLoop();
    }
}

// Stop boss fight music
function stopBossFightMusic() {
    if (!bossMusicActive) return;
    
    bossMusicActive = false;
    console.log("🎵 Boss fight music stopped!");
    
    if (bossMusicInterval) {
        clearInterval(bossMusicInterval);
        bossMusicInterval = null;
    }
}

// Play the boss music loop
function playBossMusicLoop() {
    if (!bossMusicActive || !gameState.audioContext) {
        console.log("🎵 Cannot play boss music loop - inactive or no audio context");
        return;
    }
    
    console.log("🎵 Starting boss music loop...");
    
    // Fast, intense drumbeat pattern
    const playDrumbeat = (delay) => {
        setTimeout(() => {
            if (bossMusicActive) {
                console.log("🥁 Playing bass drum");
                createBeepSound(80, 0.1, 0.1);  // Bass drum (increased volume)
            }
        }, delay);
        setTimeout(() => {
            if (bossMusicActive) {
                console.log("🥁 Playing snare");
                createBeepSound(200, 0.05, 0.08);  // Snare (increased volume)
            }
        }, delay + 150);
        setTimeout(() => {
            if (bossMusicActive) {
                console.log("🥁 Playing bass drum 2");
                createBeepSound(80, 0.1, 0.1);   // Bass drum (increased volume)
            }
        }, delay + 300);
        setTimeout(() => {
            if (bossMusicActive) {
                console.log("🥁 Playing snare 2");
                createBeepSound(200, 0.05, 0.08);  // Snare (increased volume)
            }
        }, delay + 450);
    };
    
    // Dramatic melody line
    const playMelody = (delay) => {
        const melodyNotes = [440, 330, 392, 294, 349, 262, 329, 247]; // A, E, G, D, F#, C, E, B
        melodyNotes.forEach((freq, index) => {
            setTimeout(() => {
                if (bossMusicActive) createBeepSound(freq, 0.2, 0.04);
            }, delay + index * 200);
        });
    };
    
    // Ominous bass line
    const playBassLine = (delay) => {
        const bassNotes = [110, 123, 131, 147]; // Low A, B, C, D
        bassNotes.forEach((freq, index) => {
            setTimeout(() => {
                if (bossMusicActive) createBeepSound(freq, 0.3, 0.06);
            }, delay + index * 400);
        });
    };
    
    // Start the musical pattern
    const playMusicPattern = () => {
        if (!bossMusicActive) return;
        
        // Layer different musical elements
        playDrumbeat(0);
        playMelody(100);
        playBassLine(50);
        
        // Add some dramatic high notes
        setTimeout(() => {
            if (bossMusicActive) createBeepSound(880, 0.15, 0.03); // High A
        }, 800);
        setTimeout(() => {
            if (bossMusicActive) createBeepSound(1108, 0.15, 0.03); // High C#
        }, 1200);
    };
    
    // Play immediately, then repeat every 1.6 seconds
    playMusicPattern();
    bossMusicInterval = setInterval(playMusicPattern, 1600);
}

// Check if any boss is currently alive
function isBossAlive() {
    const bosses = gameState.enemies.filter(enemy => enemy.isBoss);
    const aliveBosses = bosses.filter(enemy => !enemy.isDisposed);
    
    console.log(`🎵 Boss check: ${bosses.length} total bosses, ${aliveBosses.length} alive bosses`);
    
    return aliveBosses.length > 0;
}

// Update boss music based on current game state (call this regularly)
function updateBossMusic() {
    const bossAlive = isBossAlive();
    
    if (bossAlive && !bossMusicActive) {
        // Boss is alive but music isn't playing - start it
        console.log("🎵 Boss detected, starting music...");
        startBossFightMusic();
    } else if (!bossAlive && bossMusicActive) {
        // No boss alive but music is playing - stop it
        console.log("🎵 No boss detected, stopping music...");
        stopBossFightMusic();
    }
}

// Test function to manually trigger boss music (for debugging)
function testBossMusic() {
    console.log("🧪 Testing boss music manually...");
    console.log("🎵 Current bossMusicActive state:", bossMusicActive);
    console.log("🎵 Current gameState.audioContext:", gameState.audioContext);
    
    if (bossMusicActive) {
        stopBossFightMusic();
    } else {
        startBossFightMusic();
    }
}

// Make it globally accessible
window.testBossMusic = testBossMusic;

// Also create a simple beep test
function testBeep() {
    console.log("🧪 Testing simple beep...");
    createBeepSound(440, 0.5, 0.2);
}
window.testBeep = testBeep;

// Force start boss music (ignore boss checking)
function forceStartBossMusic() {
    console.log("🧪 Force starting boss music...");
    startBossFightMusic();
}
window.forceStartBossMusic = forceStartBossMusic;

// Force stop boss music
function forceStopBossMusic() {
    console.log("🧪 Force stopping boss music...");
    stopBossFightMusic();
}
window.forceStopBossMusic = forceStopBossMusic;