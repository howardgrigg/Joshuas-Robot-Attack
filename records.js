// Records Module
// Persists best runs + lifetime totals in localStorage, shows them on the
// landing page and the game-over screen.

const RECORDS_KEY = 'jra_records_v1';

let Records = {
    bestLevel: 0,
    bestWave: 0,
    bestKillsRun: 0,
    lifetimeKills: 0,
    lifetimeCoins: 0,
    runs: 0
};

function recordsLoad() {
    try {
        const raw = localStorage.getItem(RECORDS_KEY);
        if (raw) Object.assign(Records, JSON.parse(raw));
    } catch (e) { /* private mode / disabled - just use defaults */ }
}

function recordsSave() {
    try { localStorage.setItem(RECORDS_KEY, JSON.stringify(Records)); }
    catch (e) { /* ignore */ }
}

// Call once when a run ends (death, victory). Returns which records were beaten.
function recordRunEnd() {
    const mode = gameState.mode || 'campaign';
    const kills = gameState.runKills || 0;
    const level = gameState.currentLevel || 1;
    const wave = (typeof Horde === 'object' && Horde.wave) ? Horde.wave : 0;

    const beat = { level: false, wave: false, kills: false };

    if (mode === 'horde' && wave > Records.bestWave) { Records.bestWave = wave; beat.wave = true; }
    if (mode !== 'horde' && level > Records.bestLevel) { Records.bestLevel = level; beat.level = true; }
    if (kills > Records.bestKillsRun) { Records.bestKillsRun = kills; beat.kills = true; }

    Records.lifetimeKills += kills;
    Records.lifetimeCoins += (gameState.coins || 0);
    Records.runs += 1;
    recordsSave();

    return beat;
}

function _fmt(n) { return (n || 0).toLocaleString(); }

// HTML block for the game-over / victory modal
function recordsSummaryHTML(beat) {
    beat = beat || {};
    const mode = gameState.mode || 'campaign';
    const rows = [];

    if (mode === 'horde') {
        rows.push(row('This run', 'Wave ' + (Horde.wave || 0) + ' &nbsp;·&nbsp; ' + _fmt(gameState.runKills) + ' robots'));
        rows.push(row('Best wave', 'Wave ' + _fmt(Records.bestWave), beat.wave));
    } else {
        rows.push(row('This run', 'Level ' + (gameState.currentLevel || 1) + ' &nbsp;·&nbsp; ' + _fmt(gameState.runKills) + ' robots'));
        rows.push(row('Furthest level', 'Level ' + _fmt(Records.bestLevel), beat.level));
    }
    rows.push(row('Best single run', _fmt(Records.bestKillsRun) + ' robots', beat.kills));
    rows.push(row('Robots scrapped (all time)', _fmt(Records.lifetimeKills)));

    return '<div style="margin-top:18px;text-align:left;font-size:14px;' +
        'background:rgba(0,0,0,0.25);border-radius:10px;padding:12px 14px;">' +
        rows.join('') + '</div>';

    function row(label, value, isNew) {
        return '<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0;">' +
            '<span style="color:#9fb0c3;">' + label + '</span>' +
            '<b>' + value + (isNew ? ' <span style="color:#ffd166;">NEW!</span>' : '') + '</b></div>';
    }
}

// One-line summary injected into the landing page
function recordsLandingHTML() {
    if (!Records.runs) return '';
    const bits = [];
    if (Records.bestLevel) bits.push('Level ' + Records.bestLevel);
    if (Records.bestWave) bits.push('Wave ' + Records.bestWave);
    if (Records.bestKillsRun) bits.push(_fmt(Records.bestKillsRun) + ' robots in one run');
    if (!bits.length) return '';
    return '🏆 Best &nbsp; ' + bits.join(' &nbsp;·&nbsp; ');
}

function recordsInjectLanding() {
    const inner = document.querySelector('#welcomeScreen .ws-inner');
    if (!inner) return;
    const html = recordsLandingHTML();
    if (!html) return;
    let el = document.getElementById('wsRecords');
    if (!el) {
        el = document.createElement('div');
        el.id = 'wsRecords';
        el.style.cssText = 'font-size:0.8rem;color:#8ea0b6;letter-spacing:0.03em;margin-top:2px;';
        const controls = inner.querySelector('.ws-controls');
        inner.insertBefore(el, controls || null);
    }
    el.innerHTML = html;
}

recordsLoad();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', recordsInjectLanding);
} else {
    recordsInjectLanding();
}
