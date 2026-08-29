// Combat Feedback Module
// Floating damage numbers, kill-streak popups + a small combo bonus.

const Feedback = {
    STREAK_WINDOW: 2600,       // ms since last kill before the streak resets
    _layer: null,
    _live: 0,
    initialized: false
};

const STREAK_TIERS = [
    { n: 3,  text: 'TRIPLE!',           color: '#7CFC66' },
    { n: 5,  text: 'KILLING SPREE!',    color: '#4ecdc4' },
    { n: 8,  text: 'RAMPAGE!',          color: '#ffd166' },
    { n: 12, text: 'UNSTOPPABLE!',      color: '#ff8c42' },
    { n: 16, text: 'ROBO-APOCALYPSE!',  color: '#ff5d5d' },
    { n: 22, text: 'LEGENDARY!!',       color: '#c77dff' }
];

function initFeedback() {
    if (Feedback.initialized) return;
    let layer = document.getElementById('fbLayer');
    if (!layer) {
        layer = document.createElement('div');
        layer.id = 'fbLayer';
        layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1500;overflow:hidden;';
        document.body.appendChild(layer);
    }
    Feedback._layer = layer;
    Feedback.initialized = true;
}

// --- Floating damage numbers -------------------------------------------

function showDamageNumber(scene, worldPos, amount, kill) {
    if (!Feedback.initialized) initFeedback();
    if (Feedback._live > 26) return;              // don't flood the screen
    const camera = scene.activeCamera;
    if (!camera) return;

    let coords;
    try {
        coords = BABYLON.Vector3.Project(
            worldPos.add(new BABYLON.Vector3(0, 1.4, 0)),
            BABYLON.Matrix.Identity(),
            scene.getTransformMatrix(),
            camera.viewport.toGlobal(scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight())
        );
    } catch (e) { return; }
    if (!coords || coords.z < 0 || coords.z > 1) return;

    const el = document.createElement('div');
    el.className = 'fb-dmg' + (kill ? ' fb-kill' : '');
    el.textContent = kill ? '💥' : Math.max(1, Math.round(amount));
    const jitter = (Math.random() - 0.5) * 26;
    el.style.left = (coords.x + jitter) + 'px';
    el.style.top = coords.y + 'px';
    Feedback._layer.appendChild(el);
    Feedback._live++;
    setTimeout(() => { el.remove(); Feedback._live--; }, 850);
}

// --- Kill streaks -----------------------------------------------------

function registerKill(scene) {
    const now = Date.now();
    const p = gameState.player;

    if (now - (gameState.lastKillAt || 0) > Feedback.STREAK_WINDOW) {
        gameState.streak = 0;
    }
    gameState.streak = (gameState.streak || 0) + 1;
    gameState.lastKillAt = now;
    gameState.runKills = (gameState.runKills || 0) + 1;
    if (gameState.streak > (gameState.streakBest || 0)) gameState.streakBest = gameState.streak;

    // Small escalating damage bonus while the streak is hot
    p.streakDamageMult = 1 + Math.min(gameState.streak, 15) * 0.03;

    // Milestone popup
    const tier = STREAK_TIERS.find(t => t.n === gameState.streak);
    if (tier) {
        showStreakBanner(tier.text, tier.color);
        if (typeof addScreenShake === 'function') addScreenShake(0.03);
        if (typeof gameState.coins === 'number') {
            gameState.coins += 3;
            if (typeof updateCoinHUD === 'function') updateCoinHUD();
        }
    }
    updateComboCounter();
}

function updateFeedback() {
    if (!gameState.streak) return;
    if (Date.now() - (gameState.lastKillAt || 0) > Feedback.STREAK_WINDOW) {
        gameState.streak = 0;
        gameState.player.streakDamageMult = 1;
        updateComboCounter();
    }
}

function updateComboCounter() {
    let el = document.getElementById('comboCounter');
    if (!el) {
        el = document.createElement('div');
        el.id = 'comboCounter';
        document.body.appendChild(el);
    }
    if (gameState.streak >= 2) {
        el.textContent = 'x' + gameState.streak + ' COMBO';
        el.style.opacity = '1';
        el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    } else {
        el.style.opacity = '0';
    }
}

function showStreakBanner(text, color) {
    if (!Feedback.initialized) initFeedback();
    const b = document.createElement('div');
    b.className = 'fb-streak';
    b.textContent = text;
    b.style.color = color || '#4ecdc4';
    Feedback._layer.appendChild(b);
    setTimeout(() => b.remove(), 1300);
}
