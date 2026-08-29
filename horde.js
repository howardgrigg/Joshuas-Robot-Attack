// Horde / Survival Mode
// Endless escalating waves in a single arena. No level progression - you play
// until you die, then your best wave is saved.

const Horde = {
    wave: 0,
    active: false,
    toSpawn: 0,
    spawnedThisWave: 0,
    nextSpawnAt: 0,
    breatherUntil: 0,
    bossWave: false,
    running: false
};

function initHorde(scene) {
    Horde.wave = 0;
    Horde.active = false;
    Horde.spawnedThisWave = 0;
    Horde.toSpawn = 0;
    Horde.breatherUntil = 0;
    Horde.running = true;

    // Clear the campaign's starter enemies
    (gameState.enemies || []).forEach(e => { try { e.dispose(); } catch (_) {} });
    gameState.enemies = [];
    gameState.enemiesSpawned = 0;
    gameState.bossSpawned = false;

    setTimeout(() => startHordeWave(1), 1500);
}

function hordeWaveCount(w) {
    return Math.min(26, 3 + Math.floor(w * 1.6));
}

function hordeEnemyType(w) {
    const ramp = ['scout', 'scout', 'warrior', 'warrior', 'hunter', 'hunter', 'elite', 'cyber'];
    return ramp[Math.min(ramp.length - 1, Math.floor((w - 1) / 2))];
}

function hordeHealthMult(w) { return Math.min(4.5, 1 + (w - 1) * 0.09); }
function hordeSpeedMult(w)  { return Math.min(1.7, 1 + (w - 1) * 0.03); }

function startHordeWave(w) {
    Horde.wave = w;
    Horde.toSpawn = hordeWaveCount(w);
    Horde.spawnedThisWave = 0;
    Horde.nextSpawnAt = Date.now();
    Horde.active = true;
    Horde.breatherUntil = 0;
    Horde.bossWave = (w % 5 === 0);

    if (typeof showStreakBanner === 'function') {
        showStreakBanner('WAVE ' + w, w % 5 === 0 ? '#ff5d5d' : '#4ecdc4');
    }

    if (Horde.bossWave) {
        const scene = engine.scenes[0];
        const bossLevel = Math.min(5, Math.ceil(w / 5));
        setTimeout(() => {
            try {
                createLevelBoss(scene, bossLevel);
                if (typeof showBossAlert === 'function') {
                    showBossAlert('A boss joins wave ' + w + '! Take it down to keep going.');
                }
                if (typeof startBossFightMusic === 'function') startBossFightMusic();
            } catch (e) {}
        }, 1200);
    }
}

function updateHorde(scene) {
    if (!Horde.running) return;
    const now = Date.now();

    // Between waves - count down to the next one
    if (!Horde.active) {
        if (Horde.breatherUntil && now >= Horde.breatherUntil) {
            startHordeWave(Horde.wave + 1);
        }
        updateHordeHUD(true);
        return;
    }

    // Spawn the wave in over time
    if (Horde.spawnedThisWave < Horde.toSpawn &&
        gameState.enemies.filter(e => !e.isBoss).length < 10 &&
        now >= Horde.nextSpawnAt) {
        try {
            createLevelEnemy(scene, hordeEnemyType(Horde.wave));
            const e = gameState.enemies[gameState.enemies.length - 1];
            if (e) {
                const hm = hordeHealthMult(Horde.wave), sm = hordeSpeedMult(Horde.wave);
                e.health *= hm; e.maxHealth = e.health;
                e.speed *= sm; e.originalSpeed = e.speed;
                e._horde = true;
                if (typeof updateHealthBar === 'function') updateHealthBar(e);
            }
        } catch (err) {}
        Horde.spawnedThisWave++;
        Horde.nextSpawnAt = now + 650;
    }

    // Wave cleared?
    const bossAlive = gameState.enemies.some(e => e.isBoss);
    const regularLeft = gameState.enemies.filter(e => !e.isBoss).length;
    if (Horde.spawnedThisWave >= Horde.toSpawn && regularLeft === 0 && !bossAlive) {
        const bonus = 8 + Horde.wave * 2;
        if (typeof gameState.coins === 'number') {
            gameState.coins += bonus;
            if (typeof updateCoinHUD === 'function') updateCoinHUD();
        }
        if (typeof stopBossFightMusic === 'function') stopBossFightMusic();
        if (typeof showStreakBanner === 'function') {
            showStreakBanner('WAVE ' + Horde.wave + ' CLEARED  +' + bonus + ' 🪙', '#7CFC66');
        }
        gameState.player.health = Math.min(
            (typeof getPlayerMaxHealth === 'function') ? getPlayerMaxHealth() : 200,
            gameState.player.health + 25);
        document.getElementById('health').textContent = gameState.player.health;

        Horde.active = false;
        Horde.breatherUntil = now + 4500;
    }

    updateHordeHUD(false);
}

function updateHordeHUD(betweenWaves) {
    const lvl = document.getElementById('levelDisplay');
    if (lvl) {
        lvl.textContent = betweenWaves
            ? 'Horde - Wave ' + (Horde.wave + 1) + ' incoming...'
            : 'Horde - Wave ' + Horde.wave;
    }
    const kc = document.getElementById('killCount');
    if (kc) {
        const left = betweenWaves ? 0
            : (Horde.toSpawn - Horde.spawnedThisWave) + gameState.enemies.filter(e => !e.isBoss).length;
        kc.textContent = betweenWaves ? 'get ready' : (left + ' robots left');
    }
}
