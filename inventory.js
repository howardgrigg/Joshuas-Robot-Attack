// Gun Inventory Module
// Press E to open a book of every gun you've collected. Each one has a blurb.
// Picking up a gun box always adds the gun to your pack, but it only auto-swaps
// your weapon if the new gun hits harder - so you never get stuck with a worse one.

function weaponDamageOf(name) {
    try {
        const cfg = getWeaponConfig(name);
        return cfg ? (cfg.damage || 0) : 0;
    } catch (e) {
        return 0;
    }
}

// Called when the player walks over a dropped gun box.
function collectWeapon(weaponName) {
    const p = gameState.player;
    if (p.weapons.includes(weaponName)) return false; // already have it

    p.weapons.push(weaponName);
    p.weaponsCollected++;

    const currentName = p.hudWeapons[p.currentWeapon];
    const isUpgrade = weaponDamageOf(weaponName) > weaponDamageOf(currentName);

    if (p.hudWeapons.length < 5) {
        // Free quick-slot: park it there, only jump to it if it's better
        p.hudWeapons.push(weaponName);
        if (isUpgrade) p.currentWeapon = p.hudWeapons.length - 1;
    } else if (isUpgrade) {
        // Quick-slots full, but this one is stronger - swap it into the active slot
        p.hudWeapons[p.currentWeapon] = weaponName;
    }
    // else: stays in the pack only, reachable from the inventory (E)

    if (typeof updateWeaponHUD === 'function') updateWeaponHUD();
    if (typeof updateWeaponDisplay === 'function') updateWeaponDisplay();
    const wc = document.getElementById('weaponCount');
    if (wc) wc.textContent = p.weaponsCollected + '/50';

    showPickupToast(weaponName, isUpgrade);
    return true;
}

function showPickupToast(weaponName, isUpgrade) {
    let toast = document.getElementById('pickupToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pickupToast';
        toast.style.cssText = 'position:fixed;top:16%;left:50%;transform:translateX(-50%);' +
            'background:rgba(0,0,0,0.85);color:#fff;padding:12px 20px;border-radius:10px;' +
            'font-size:17px;font-weight:bold;z-index:1002;border:2px solid #4ecdc4;' +
            'pointer-events:none;transition:opacity .3s;text-align:center;';
        document.body.appendChild(toast);
    }
    toast.style.borderColor = isUpgrade ? '#7CFC66' : '#4ecdc4';
    toast.innerHTML = isUpgrade
        ? `🔫 UPGRADE! Now blasting with<br><span style="color:#7CFC66;">${weaponName}</span>`
        : `🔫 New gun for your pack:<br><span style="color:#4ecdc4;">${weaponName}</span><br>` +
          `<span style="font-size:13px;font-weight:normal;color:#bbb;">Press E to check it out</span>`;
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2600);
}

// --- Inventory overlay --------------------------------------------------

function toggleInventory() {
    const el = document.getElementById('inventoryInterface');
    if (el && el.style.display === 'block') {
        closeInventory();
        return;
    }
    if (gameState.paused) return; // something else (shop) is open
    openInventory();
}

function openInventory() {
    let inv = document.getElementById('inventoryInterface');
    if (!inv) {
        inv = document.createElement('div');
        inv.id = 'inventoryInterface';
        inv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
            'background:rgba(0,0,0,0.96);color:white;padding:22px;border-radius:16px;' +
            'z-index:1001;width:min(760px,92vw);max-height:86vh;overflow-y:auto;' +
            'border:3px solid #4ecdc4;box-shadow:0 0 24px rgba(78,205,196,0.5);' +
            "font-family:inherit;";
        document.body.appendChild(inv);
    }
    renderInventory();
    inv.style.display = 'block';
    if (typeof pauseGame === 'function') pauseGame(); else gameState.paused = true;
    gameState.gameStarted = false;
    if (document.pointerLockElement) document.exitPointerLock();
}

function closeInventory() {
    const inv = document.getElementById('inventoryInterface');
    if (inv) inv.style.display = 'none';
    gameState.gameStarted = true;
    if (typeof resumeGame === 'function') resumeGame(); else gameState.paused = false;
}

function renderInventory() {
    const inv = document.getElementById('inventoryInterface');
    if (!inv) return;

    const p = gameState.player;
    const equippedName = p.hudWeapons[p.currentWeapon];

    let html = `<div style="text-align:center;margin-bottom:14px;">
        <h2 style="margin:0;color:#4ecdc4;">🎒 Your Gun Collection</h2>
        <div style="color:#bbb;font-size:14px;margin-top:4px;">
            ${p.weapons.length} gun${p.weapons.length === 1 ? '' : 's'} collected &nbsp;·&nbsp; tap one to grab it
        </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">`;

    for (const name of p.weapons) {
        const isEquipped = name === equippedName;
        const inQuickSlot = p.hudWeapons.includes(name);
        const img = (typeof getWeaponImage === 'function') ? getWeaponImage(name) : null;
        const blurb = (typeof getWeaponDescription === 'function')
            ? getWeaponDescription(name) : '';

        html += `<div onclick="equipFromInventory('${name.replace(/'/g, "\\'")}')"
            style="cursor:pointer;background:${isEquipped ? 'rgba(78,205,196,0.18)' : 'rgba(255,255,255,0.06)'};
            border:2px solid ${isEquipped ? '#4ecdc4' : 'rgba(255,255,255,0.12)'};border-radius:12px;
            padding:12px;display:flex;flex-direction:column;gap:8px;transition:transform .1s;"
            onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:52px;height:52px;flex:none;border-radius:8px;background:#1a1a1a
                    ${img ? `;background-image:url('${img}');background-size:cover;background-position:center` : ''};"></div>
                <div style="font-weight:bold;font-size:15px;line-height:1.15;">${name}
                    ${isEquipped ? '<div style="color:#4ecdc4;font-size:12px;">● EQUIPPED</div>'
                        : (inQuickSlot ? '<div style="color:#888;font-size:12px;">in quick-slots</div>' : '')}
                </div>
            </div>
            <div style="font-size:12.5px;color:#cfcfcf;line-height:1.3;">${blurb}</div>
        </div>`;
    }

    html += `</div>
    <div style="text-align:center;margin-top:16px;">
        <button onclick="closeInventory()" style="background:#4ecdc4;color:#003;border:none;
        padding:10px 22px;border-radius:6px;cursor:pointer;font-size:16px;font-weight:bold;">
        Back to Battle (E)</button>
    </div>`;

    inv.innerHTML = html;
}

function equipFromInventory(weaponName) {
    const p = gameState.player;
    if (!p.weapons.includes(weaponName)) return;

    let slot = p.hudWeapons.indexOf(weaponName);
    if (slot === -1) {
        if (p.hudWeapons.length < 5) {
            p.hudWeapons.push(weaponName);
            slot = p.hudWeapons.length - 1;
        } else {
            slot = p.currentWeapon;             // replace the active quick-slot
            p.hudWeapons[slot] = weaponName;
        }
    }
    p.currentWeapon = slot;

    if (typeof updateWeaponHUD === 'function') updateWeaponHUD();
    if (typeof updateWeaponDisplay === 'function') updateWeaponDisplay();
    closeInventory();
}
