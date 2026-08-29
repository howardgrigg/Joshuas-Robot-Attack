// Coins & Upgrades Module
// Swift robots drop coins. Collect them, then press B to open the upgrade shop.

const COIN_CONFIG = {
    dropChance: 1.0,       // swift robots always drop
    valueMin: 1,
    valueMax: 3,
    pickupRange: 3.5,
    magnetRange: 9         // coins drift toward the player within this range
};

const SHOP_ITEMS = {
    invis: {
        name: "Invisibility Charge",
        desc: "Press Q to vanish for 8s. Robots lose track of you.",
        cost: 8,
        buy: () => { gameState.player.invisibleCharges++; }
    },
    heal: {
        name: "Full Repair",
        desc: "Restore health to full.",
        cost: 5,
        buy: () => {
            gameState.player.health = getPlayerMaxHealth();
            document.getElementById('health').textContent = gameState.player.health;
        }
    },
    health: {
        name: "Reinforced Plating (+50 max HP)",
        desc: "Permanently raise max health and heal 50.",
        get cost() { return 10 + gameState.upgrades.healthLevel * 6; },
        buy: () => {
            gameState.upgrades.healthLevel++;
            gameState.player.maxHealth += 50;
            gameState.player.health += 50;
            document.getElementById('health').textContent = gameState.player.health;
        }
    },
    speed: {
        name: "Servo Boost (+15% speed)",
        desc: "Permanently move faster. Max 3.",
        get cost() { return 8 + gameState.upgrades.speedLevel * 5; },
        get soldOut() { return gameState.upgrades.speedLevel >= 3; },
        buy: () => {
            gameState.upgrades.speedLevel++;
            gameState.player.speedMult = 1 + gameState.upgrades.speedLevel * 0.15;
        }
    }
};

function getPlayerMaxHealth() {
    return gameState.player.maxHealth || 200;
}

// --- Pause (freezes time so the day/night sun and cooldowns don't jump) ----

let _pauseStartedAt = 0;

function pauseGame() {
    if (gameState.paused) return;
    gameState.paused = true;
    _pauseStartedAt = Date.now();
}

function resumeGame() {
    if (!gameState.paused) return;
    gameState.paused = false;
    const dt = Date.now() - _pauseStartedAt;
    if (dt <= 0) return;

    // Push every time-based marker forward by the paused duration
    if (typeof DayNight === 'object' && DayNight.startTime) DayNight.startTime += dt;

    const p = gameState.player;
    p.invulnerableUntil = (p.invulnerableUntil || 0) + dt;
    p.invisibleUntil = (p.invisibleUntil || 0) + dt;
    p.lastShot = (p.lastShot || 0) + dt;

    (gameState.enemies || []).forEach(e => {
        ['lastShot', 'lastAttack', 'lastJump', 'freezeTime', 'lastPoisonTick', 'poisonTime'].forEach(k => {
            if (e[k]) e[k] += dt;
        });
    });

    const b = gameState.buddy;
    if (b) {
        if (b.lastShot) b.lastShot += dt;
        if (b.lastHeal) b.lastHeal += dt;
    }

    (gameState.coinDrops || []).forEach(c => { if (c.spawnedAt) c.spawnedAt += dt; });
    gameState.lastEnemySpawn = (gameState.lastEnemySpawn || 0) + dt;
}

function isPlayerInvisible() {
    return Date.now() < gameState.player.invisibleUntil;
}

// --- Coin drops -------------------------------------------------------------

function maybeDropCoins(scene, enemy) {
    // Every robot drops coins, on every level. Bosses are handled separately.
    if (!enemy || enemy.isBoss) return;

    // Swift robots are the "coin" type and pay a little extra; heavy robots too
    let count = 1 + (Math.random() < 0.4 ? 1 : 0);
    if (enemy.variant === 'swift') count += 1;
    if (enemy.variant === 'heavy') count += 1;

    for (let i = 0; i < count; i++) {
        const value = COIN_CONFIG.valueMin +
            Math.floor(Math.random() * (COIN_CONFIG.valueMax - COIN_CONFIG.valueMin + 1));
        spawnCoin(scene, enemy.position, value);
    }
}

function spawnCoin(scene, position, value) {
    const coin = BABYLON.MeshBuilder.CreateCylinder("coin", {
        diameter: 1.1, height: 0.22, tessellation: 14
    }, scene);
    coin.position = new BABYLON.Vector3(
        position.x + (Math.random() - 0.5) * 3,
        1.2,
        position.z + (Math.random() - 0.5) * 3
    );
    coin.rotation.x = Math.PI / 2;

    const mat = new BABYLON.StandardMaterial("coinMat", scene);
    mat.diffuseColor = new BABYLON.Color3(1, 0.82, 0.2);
    mat.emissiveColor = new BABYLON.Color3(0.55, 0.4, 0.05);
    mat.specularColor = new BABYLON.Color3(1, 1, 0.7);
    coin.material = mat;

    coin.isPickable = false;
    coin.coinValue = value;
    coin.spawnedAt = Date.now();
    coin.bobPhase = Math.random() * Math.PI * 2;
    gameState.coinDrops.push(coin);
}

function updateCoins(scene, camera) {
    const now = Date.now();
    for (let i = gameState.coinDrops.length - 1; i >= 0; i--) {
        const coin = gameState.coinDrops[i];
        if (!coin || coin.isDisposed()) { gameState.coinDrops.splice(i, 1); continue; }

        // Spin and bob
        coin.rotation.y += 0.12;
        coin.position.y = 1.2 + Math.sin(now / 250 + coin.bobPhase) * 0.15;

        const toPlayer = camera.position.subtract(coin.position);
        toPlayer.y = 0;
        const dist = toPlayer.length();

        // Magnet effect
        if (dist < COIN_CONFIG.magnetRange && dist > COIN_CONFIG.pickupRange) {
            coin.position.addInPlace(toPlayer.normalize().scale(0.35));
        }

        // Pickup
        if (dist < COIN_CONFIG.pickupRange) {
            gameState.coins += coin.coinValue;
            updateCoinHUD();
            playCoinSound();
            if (typeof spawnHitSparks === 'function') {
                spawnHitSparks(scene, coin.position, new BABYLON.Color3(1, 0.85, 0.25));
            }
            coin.dispose(false, true);
            gameState.coinDrops.splice(i, 1);
            continue;
        }

        // Despawn after 25s
        if (now - coin.spawnedAt > 25000) {
            coin.dispose(false, true);
            gameState.coinDrops.splice(i, 1);
        }
    }
}

function clearCoinDrops() {
    gameState.coinDrops.forEach(c => { if (c && !c.isDisposed()) c.dispose(false, true); });
    gameState.coinDrops = [];
}

function playCoinSound() {
    try {
        const ctx = gameState.audioContext;
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
    } catch (e) { /* audio optional */ }
}

// --- Invisibility ---------------------------------------------------------

function activateInvisibility() {
    if (!gameState.gameStarted) return;
    if (isPlayerInvisible()) return;
    if (gameState.player.invisibleCharges <= 0) {
        showCoinToast("No invisibility charges - buy one in the shop (B)");
        return;
    }
    gameState.player.invisibleCharges--;
    gameState.player.invisibleUntil = Date.now() + 8000;
    document.body.classList.add('invisible-active');
    updateCoinHUD();
}

function updateInvisibility() {
    if (!isPlayerInvisible() && document.body.classList.contains('invisible-active')) {
        document.body.classList.remove('invisible-active');
    }
    // Keep the charge count / countdown fresh
    updateCoinHUD();
}

// --- HUD -----------------------------------------------------------------

function updateCoinHUD() {
    const el = document.getElementById('coinCount');
    if (el) el.textContent = gameState.coins;

    const inv = document.getElementById('invisStatus');
    if (inv) {
        if (isPlayerInvisible()) {
            const left = Math.ceil((gameState.player.invisibleUntil - Date.now()) / 1000);
            inv.textContent = `ACTIVE ${left}s`;
        } else {
            inv.textContent = `${gameState.player.invisibleCharges} charge(s) [Q]`;
        }
    }
}

function showCoinToast(msg) {
    let toast = document.getElementById('coinToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'coinToast';
        toast.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);' +
            'background:rgba(0,0,0,0.85);color:#ffd700;padding:10px 18px;border-radius:8px;' +
            'font-size:16px;z-index:1002;border:2px solid #ffd700;pointer-events:none;transition:opacity .3s;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 1800);
}

// --- Shop --------------------------------------------------------------

function toggleShop() {
    const existing = document.getElementById('shopInterface');
    if (existing && existing.style.display === 'block') {
        closeShop();
        return;
    }
    if (gameState.paused) return; // something else (inventory) is open
    openShop();
}

function openShop() {
    let shop = document.getElementById('shopInterface');
    if (!shop) {
        shop = document.createElement('div');
        shop.id = 'shopInterface';
        shop.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
            'background:rgba(0,0,0,0.95);color:white;padding:24px;border-radius:15px;font-size:16px;' +
            'z-index:1001;min-width:420px;max-width:560px;border:3px solid #ffd700;' +
            'box-shadow:0 0 20px rgba(255,215,0,0.5);';
        document.body.appendChild(shop);
    }
    renderShop();
    shop.style.display = 'block';
    gameState.gameStarted = false;
    pauseGame();
    if (document.pointerLockElement) document.exitPointerLock();
}

function closeShop() {
    const shop = document.getElementById('shopInterface');
    if (shop) shop.style.display = 'none';
    gameState.gameStarted = true;
    resumeGame();
}

function renderShop() {
    const shop = document.getElementById('shopInterface');
    if (!shop) return;

    let html = `<div style="text-align:center;margin-bottom:16px;">
        <h2 style="margin:0;color:#ffd700;">🪙 Upgrade Shop</h2>
        <div style="color:#4ecdc4;margin-top:4px;">Coins: <b>${gameState.coins}</b></div>
    </div>`;

    for (const key of Object.keys(SHOP_ITEMS)) {
        const item = SHOP_ITEMS[key];
        const soldOut = item.soldOut === true;
        const afford = gameState.coins >= item.cost && !soldOut;
        const extra = key === 'invis'
            ? ` <span style="color:#aaa;">(have ${gameState.player.invisibleCharges})</span>` : '';
        html += `<div style="margin:8px 0;padding:12px;background:rgba(255,255,255,0.08);border-radius:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-weight:bold;">${item.name}${extra}</div>
                    <div style="font-size:13px;color:#bbb;">${item.desc}</div>
                </div>
                <button onclick="buyUpgrade('${key}')" ${afford ? '' : 'disabled'}
                    style="background:${afford ? '#ffd700' : '#555'};color:${afford ? '#000' : '#999'};
                    border:none;padding:8px 14px;border-radius:5px;font-weight:bold;
                    cursor:${afford ? 'pointer' : 'default'};white-space:nowrap;margin-left:12px;">
                    ${soldOut ? 'MAX' : '🪙 ' + item.cost}
                </button>
            </div>
        </div>`;
    }

    html += `<div style="text-align:center;margin-top:16px;">
        <button onclick="closeShop()" style="background:#ff6b6b;color:white;border:none;
        padding:10px 20px;border-radius:5px;cursor:pointer;font-size:16px;">Close (B)</button>
    </div>`;

    shop.innerHTML = html;
}

function buyUpgrade(key) {
    const item = SHOP_ITEMS[key];
    if (!item || item.soldOut === true) return;
    if (gameState.coins < item.cost) return;
    gameState.coins -= item.cost;
    item.buy();
    updateCoinHUD();
    renderShop();
}
