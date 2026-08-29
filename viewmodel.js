// Weapon Models & Viewmodel
// One gun builder is used three ways: the first-person viewmodel parented to
// the camera, the physical model robots drop on the ground, and a spinning
// turntable render used as the HUD / inventory icon.

const Viewmodel = {
    root: null,
    parts: [],
    bodyMat: null,
    metalMat: null,
    darkMat: null,
    accentMat: null,
    camera: null,
    scene: null,
    rest: new BABYLON.Vector3(0.38, -0.32, 0.80),
    restRot: new BABYLON.Vector3(0.05, -0.22, 0.06),
    bob: new BABYLON.Vector2(0, 0),
    recoil: 0,
    phase: 0,
    initialized: false
};

function initViewmodel(scene, camera) {
    if (Viewmodel.initialized) return;
    Viewmodel.camera = camera;
    Viewmodel.scene = scene;

    camera.minZ = 0.3; // let the gun sit closer than the default near plane

    const root = new BABYLON.TransformNode("vmRoot", scene);
    root.parent = camera;
    root.position.copyFrom(Viewmodel.rest);
    root.rotation.copyFrom(Viewmodel.restRot);
    root.scaling.setAll(0.68);
    Viewmodel.root = root;

    const b = new BABYLON.StandardMaterial("vmBody", scene);
    b.diffuseColor = new BABYLON.Color3(0.17, 0.18, 0.21);
    b.specularColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    b.emissiveColor = new BABYLON.Color3(0.03, 0.03, 0.04);
    Viewmodel.bodyMat = b;

    const m = new BABYLON.StandardMaterial("vmMetal", scene);
    m.diffuseColor = new BABYLON.Color3(0.34, 0.36, 0.4);
    m.specularColor = new BABYLON.Color3(0.85, 0.85, 0.95);
    m.specularPower = 64;
    Viewmodel.metalMat = m;

    const d = new BABYLON.StandardMaterial("vmDark", scene);
    d.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.09);
    d.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    Viewmodel.darkMat = d;

    Viewmodel.initialized = true;
    const start = gameState.player.hudWeapons[gameState.player.currentWeapon];
    viewmodelSetWeapon(start);
    prewarmWeaponIcon(start);
}

// --- Primitive helpers (scene-parameterised) --------------------------------

function _box(sc, name, w, h, dp) {
    return BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: dp }, sc);
}
function _cyl(sc, name, dTop, dBot, h) {
    return BABYLON.MeshBuilder.CreateCylinder(name,
        { diameterTop: dTop, diameterBottom: dBot, height: h, tessellation: 12 }, sc);
}
function _sph(sc, name, dia) {
    return BABYLON.MeshBuilder.CreateSphere(name, { diameter: dia, segments: 10 }, sc);
}
function _tor(sc, name, dia, thick) {
    return BABYLON.MeshBuilder.CreateTorus(name,
        { diameter: dia, thickness: thick, tessellation: 16 }, sc);
}
function _poly(sc, name, ptype, sz) {
    return BABYLON.MeshBuilder.CreatePolyhedron(name, { type: ptype, size: sz }, sc);
}

// --- Per-weapon look ------------------------------------------------------

// Map a weapon to an archetype + accent colour, from its name then its config.
function weaponSpec(name) {
    let cfg = null;
    try { cfg = getWeaponConfig(name); } catch (e) {}
    const color = (cfg && cfg.color) ? cfg.color.clone() : new BABYLON.Color3(0.2, 0.9, 1);
    const type = cfg ? cfg.projectileType : 'energy';
    const size = cfg ? (cfg.size || 0.5) : 0.5;
    const multi = cfg ? (cfg.projectileCount || 1) : 1;
    const spread = !!(cfg && cfg.spread > 0);
    const fast = !!(cfg && cfg.speed >= 3.3);
    const slowFire = !!(cfg && cfg.fireRate >= 700);
    const poison = !!(cfg && cfg.special === 'poison');
    const n = (name || '').toLowerCase();

    let archetype;
    if (/sword|blade/.test(n)) archetype = 'sword';
    else if (/unicorn/.test(n)) archetype = 'horn';
    else if (/black hole|void|gravity|time warp|quantum/.test(n)) archetype = 'orb';
    else if (/dragon|phoenix/.test(n)) archetype = 'maw';
    else if (/crystal|diamond|ruby|emerald|sapphire/.test(n)) archetype = 'gem';
    else if (/lightning|thunder|zapper|tesla|storm caller/.test(n)) archetype = 'tesla';
    else if (/sonic/.test(n)) archetype = 'sonic';
    else if (/wand|fairy/.test(n)) archetype = 'wand';
    else if (/cyber|code cannon|data stream|robot/.test(n)) archetype = 'cyberpistol';
    else if (/sun beam|light ray|space ripper|sniper/.test(n)) archetype = 'sniper';
    else if (multi >= 4 || (spread && multi >= 3)) archetype = 'gatling';
    else if (spread) archetype = 'scatter';
    else if (fast && slowFire) archetype = 'sniper';
    else if (type === 'beam') archetype = 'beam';
    else if (type === 'laser') archetype = 'laser';
    else if (type === 'rocket') archetype = 'cannon';
    else if (type === 'elemental') archetype = 'elemental';
    else if (type === 'magic') archetype = 'staff';
    else if (type === 'arrow') archetype = 'bow';
    else archetype = 'blaster';

    if (poison) { color.r *= 0.6; color.g = Math.min(1, color.g + 0.3); color.b *= 0.5; }
    return { archetype, color, size, multi, poison };
}

// Build the gun parts for `spec` into scene `sc`. `add(mesh, key)` receives each
// part with a material key: A accent, B body, M metal, D dark. Returns nothing.
function _assembleGun(sc, spec, add) {
    const muzzleW = 0.09 + spec.size * 0.12 + (spec.multi > 1 ? 0.06 : 0);
    const grip = (back) => {
        const g = add(_box(sc, "g_grip", 0.1, 0.22, 0.12), 'B');
        g.position.set(0, -0.17, back); g.rotation.x = -0.35;
        const t = add(_box(sc, "g_trig", 0.04, 0.07, 0.03), 'M');
        t.position.set(0, -0.1, back + 0.09);
    };

    switch (spec.archetype) {
        case 'beam': {
            const body = add(_box(sc, "g_b", 0.12, 0.13, 0.5), 'B'); body.position.z = 0.02;
            const rt = add(_box(sc, "g_rt", 0.05, 0.04, 0.44), 'M'); rt.position.set(0, 0.09, 0.04);
            const rb = add(_box(sc, "g_rb", 0.05, 0.04, 0.44), 'M'); rb.position.set(0, -0.09, 0.04);
            const em = add(_tor(sc, "g_e", 0.16, 0.05), 'A');
            em.rotation.x = Math.PI / 2; em.position.set(0, 0, 0.32);
            const core = add(_cyl(sc, "g_c", 0.05, 0.05, 0.5), 'A');
            core.rotation.x = Math.PI / 2; core.position.z = 0.05;
            grip(-0.12); break;
        }
        case 'laser': {
            const body = add(_box(sc, "g_b", 0.1, 0.11, 0.34), 'B'); body.position.z = -0.04;
            const barrel = add(_cyl(sc, "g_br", 0.04, 0.05, 0.6), 'M');
            barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.28;
            const crystal = add(_poly(sc, "g_x", 1, 0.09), 'A'); crystal.position.set(0, 0.01, 0.58);
            const fin = add(_box(sc, "g_f", 0.02, 0.14, 0.16), 'A'); fin.position.set(0, 0.08, -0.02);
            grip(-0.1); break;
        }
        case 'cannon': {
            const tube = add(_cyl(sc, "g_t", 0.26 + spec.size * 0.06, 0.24, 0.5), 'B');
            tube.rotation.x = Math.PI / 2; tube.position.z = 0.16;
            const back = add(_box(sc, "g_bk", 0.22, 0.22, 0.18), 'D'); back.position.z = -0.14;
            const ring = add(_tor(sc, "g_rg", 0.3, 0.05), 'A');
            ring.rotation.x = Math.PI / 2; ring.position.z = 0.4;
            const tip = add(_sph(sc, "g_tip", 0.18), 'A'); tip.position.z = 0.44; tip.scaling.z = 0.6;
            const sight = add(_box(sc, "g_s", 0.05, 0.08, 0.1), 'M'); sight.position.set(0, 0.16, -0.05);
            grip(-0.12); break;
        }
        case 'gatling': {
            const drum = add(_box(sc, "g_dr", 0.24, 0.24, 0.22), 'B'); drum.position.z = -0.05;
            const back = add(_box(sc, "g_gb", 0.18, 0.18, 0.06), 'D'); back.position.z = -0.19;
            const hub = add(_cyl(sc, "g_hub", 0.1, 0.1, 0.44), 'M');
            hub.rotation.x = Math.PI / 2; hub.position.z = 0.26;
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2;
                const bar = add(_cyl(sc, "g_gbar" + i, 0.055, 0.055, 0.46), 'M');
                bar.rotation.x = Math.PI / 2;
                bar.position.set(Math.cos(a) * 0.085, Math.sin(a) * 0.085, 0.3);
            }
            const ring = add(_tor(sc, "g_gr", 0.26, 0.045), 'A');
            ring.rotation.x = Math.PI / 2; ring.position.z = 0.46;
            grip(-0.12); break;
        }
        case 'scatter': {
            const body = add(_box(sc, "g_b", 0.16, 0.15, 0.32), 'B'); body.position.z = -0.02;
            const flare = add(_cyl(sc, "g_fl", 0.34, 0.12, 0.24), 'A');
            flare.rotation.x = Math.PI / 2; flare.position.z = 0.28;
            const under = add(_cyl(sc, "g_un", 0.09, 0.09, 0.22), 'M');
            under.rotation.x = Math.PI / 2; under.position.set(0, -0.09, 0.2);
            const pump = add(_box(sc, "g_pu", 0.11, 0.08, 0.14), 'M'); pump.position.set(0, -0.1, 0.06);
            grip(-0.1); break;
        }
        case 'sniper': {
            const body = add(_box(sc, "g_b", 0.11, 0.12, 0.34), 'B'); body.position.z = -0.06;
            const barrel = add(_cyl(sc, "g_br", 0.05, 0.055, 0.88), 'M');
            barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.44;
            const brake = add(_cyl(sc, "g_bk", 0.1, 0.07, 0.1), 'A');
            brake.rotation.x = Math.PI / 2; brake.position.z = 0.86;
            const scope = add(_cyl(sc, "g_sc", 0.09, 0.09, 0.3), 'D');
            scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.15, 0.04);
            const lens = add(_cyl(sc, "g_ln", 0.08, 0.08, 0.02), 'A');
            lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.15, 0.19);
            const stock = add(_box(sc, "g_st", 0.08, 0.14, 0.22), 'B'); stock.position.z = -0.3;
            [-1, 1].forEach(s => {
                const leg = add(_box(sc, "g_lg" + s, 0.02, 0.18, 0.02), 'M');
                leg.position.set(s * 0.06, -0.12, 0.32); leg.rotation.z = s * 0.35;
            });
            grip(-0.12); break;
        }
        case 'tesla': {
            const body = add(_box(sc, "g_b", 0.13, 0.14, 0.4), 'B'); body.position.z = 0;
            [0.06, 0.2].forEach((z, i) => {
                const coil = add(_tor(sc, "g_co" + i, 0.17, 0.035), 'A');
                coil.rotation.x = Math.PI / 2; coil.position.z = z;
            });
            [-1, 0, 1].forEach(s => {
                const prong = add(_box(sc, "g_pr" + s, 0.03, 0.03, 0.26), 'A');
                prong.position.set(s * 0.06, s === 0 ? 0.04 : 0.0, 0.42);
                prong.rotation.y = s * 0.32; prong.rotation.x = s === 0 ? -0.15 : 0;
            });
            grip(-0.12); break;
        }
        case 'wand': {
            const rod = add(_cyl(sc, "g_rod", 0.04, 0.045, 0.5), 'M');
            rod.rotation.x = 1.2; rod.position.set(0, -0.02, 0.05);
            const wrap = add(_cyl(sc, "g_wr", 0.06, 0.06, 0.1), 'B');
            wrap.rotation.x = 1.2; wrap.position.set(0, -0.13, -0.12);
            const star = add(_poly(sc, "g_star", 0, 0.08), 'A'); star.position.set(0, 0.16, 0.3);
            const spark = add(_sph(sc, "g_spk", 0.05), 'A'); spark.position.set(0.07, 0.22, 0.34);
            break;
        }
        case 'gem': {
            const handle = add(_box(sc, "g_hd", 0.07, 0.16, 0.1), 'B'); handle.position.set(0, -0.05, -0.14);
            const guard = add(_box(sc, "g_gd", 0.2, 0.05, 0.06), 'M'); guard.position.z = -0.04;
            const big = add(_poly(sc, "g_big", 2, 0.16), 'A'); big.position.z = 0.2;
            const s1 = add(_poly(sc, "g_s1", 1, 0.07), 'A'); s1.position.set(0.07, 0.08, 0.08);
            const s2 = add(_poly(sc, "g_s2", 1, 0.06), 'A'); s2.position.set(-0.06, -0.03, 0.12);
            break;
        }
        case 'orb': {
            const body = add(_box(sc, "g_b", 0.12, 0.13, 0.24), 'B'); body.position.z = -0.08;
            [0.12, 0.4].forEach((z, i) => {
                const ring = add(_tor(sc, "g_or" + i, 0.3, 0.04), 'M');
                ring.rotation.x = Math.PI / 2; ring.position.z = z;
            });
            [0, 1, 2].forEach(i => {
                const a = (i / 3) * Math.PI * 2;
                const strut = add(_box(sc, "g_str" + i, 0.02, 0.02, 0.3), 'M');
                strut.position.set(Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0.26);
            });
            const core = add(_sph(sc, "g_core", 0.2), 'A'); core.position.z = 0.26;
            grip(-0.1); break;
        }
        case 'maw': {
            const body = add(_box(sc, "g_b", 0.15, 0.16, 0.36), 'B'); body.position.z = -0.02;
            const jt = add(_cyl(sc, "g_jt", 0.24, 0.06, 0.22), 'D');
            jt.rotation.x = Math.PI / 2 - 0.22; jt.position.set(0, 0.06, 0.3);
            const jb = add(_cyl(sc, "g_jb", 0.24, 0.06, 0.22), 'D');
            jb.rotation.x = Math.PI / 2 + 0.22; jb.position.set(0, -0.06, 0.3);
            const throat = add(_sph(sc, "g_th", 0.15), 'A'); throat.position.z = 0.28;
            [-1, 1].forEach(s => {
                const horn = add(_cyl(sc, "g_hn" + s, 0.0, 0.05, 0.16), 'M');
                horn.position.set(s * 0.08, 0.12, 0.06); horn.rotation.x = -0.4;
            });
            grip(-0.12); break;
        }
        case 'cyberpistol': {
            const body = add(_box(sc, "g_b", 0.13, 0.16, 0.34), 'B'); body.position.z = 0;
            const top = add(_box(sc, "g_tp", 0.1, 0.05, 0.22), 'M'); top.position.set(0, 0.1, 0.03);
            const barrel = add(_box(sc, "g_br", 0.06, 0.06, 0.3), 'M'); barrel.position.z = 0.3;
            const muzzle = add(_box(sc, "g_mz", 0.09, 0.09, 0.06), 'A'); muzzle.position.z = 0.46;
            const screen = add(_box(sc, "g_scr", 0.02, 0.09, 0.13), 'A'); screen.position.set(0.075, 0.0, -0.02);
            const ant = add(_cyl(sc, "g_ant", 0.018, 0.018, 0.16), 'M'); ant.position.set(-0.04, 0.18, -0.12);
            const at = add(_sph(sc, "g_at", 0.035), 'A'); at.position.set(-0.04, 0.27, -0.12);
            grip(-0.12); break;
        }
        case 'sonic': {
            const body = add(_box(sc, "g_b", 0.14, 0.15, 0.28), 'B'); body.position.z = -0.04;
            const co = add(_cyl(sc, "g_cn", 0.36, 0.1, 0.26), 'B');
            co.rotation.x = Math.PI / 2; co.position.z = 0.3;
            const ci = add(_cyl(sc, "g_ci", 0.28, 0.06, 0.2), 'A');
            ci.rotation.x = Math.PI / 2; ci.position.z = 0.3;
            [-1, 1].forEach(s => {
                const vent = add(_box(sc, "g_vt" + s, 0.04, 0.1, 0.14), 'M');
                vent.position.set(s * 0.09, 0, 0);
            });
            grip(-0.1); break;
        }
        case 'bow': {
            const riser = add(_box(sc, "g_ri", 0.06, 0.34, 0.08), 'B'); riser.position.z = 0.0;
            [-1, 1].forEach(s => {
                const limb = add(_box(sc, "g_lm" + s, 0.04, 0.24, 0.05), 'M');
                limb.position.set(0, s * 0.26, 0.02); limb.rotation.x = s * -0.5;
            });
            const bolt = add(_cyl(sc, "g_bo", 0.02, 0.03, 0.5), 'A');
            bolt.rotation.x = Math.PI / 2; bolt.position.z = 0.2;
            const bt = add(_cyl(sc, "g_bt", 0.0, 0.06, 0.1), 'A');
            bt.rotation.x = Math.PI / 2; bt.position.z = 0.46;
            grip(-0.1); break;
        }
        case 'elemental': {
            const body = add(_box(sc, "g_b", 0.14, 0.15, 0.4), 'B'); body.position.z = 0.0;
            const tank = add(_cyl(sc, "g_tk", 0.13, 0.13, 0.3), 'A');
            tank.rotation.z = Math.PI / 2; tank.position.set(0, 0.13, -0.02);
            const hose = add(_cyl(sc, "g_h", 0.03, 0.03, 0.18), 'D');
            hose.rotation.x = 0.5; hose.position.set(0.02, 0.06, 0.12);
            const nozzle = add(_cyl(sc, "g_n", muzzleW + 0.04, 0.08, 0.14), 'A');
            nozzle.rotation.x = Math.PI / 2; nozzle.position.set(0, 0, 0.3);
            grip(-0.1); break;
        }
        case 'staff': {
            const shaft = add(_cyl(sc, "g_sh", 0.045, 0.05, 0.95), 'M');
            shaft.rotation.x = 1.15; shaft.position.set(0, -0.02, 0.06);
            const wrap = add(_cyl(sc, "g_w", 0.07, 0.07, 0.14), 'B');
            wrap.rotation.x = 1.15; wrap.position.set(0, -0.08, -0.08);
            const orb = add(_sph(sc, "g_o", 0.17 + spec.size * 0.06), 'A'); orb.position.set(0, 0.24, 0.42);
            const claw = add(_tor(sc, "g_cl", 0.22, 0.03), 'M');
            claw.rotation.x = Math.PI / 2 + 0.3; claw.position.set(0, 0.22, 0.42);
            break;
        }
        case 'horn': {
            const shaft = add(_cyl(sc, "g_sh", 0.045, 0.05, 0.9), 'M');
            shaft.rotation.x = 1.15; shaft.position.set(0, -0.02, 0.06);
            const spiral = add(_cyl(sc, "g_hn", 0.0, 0.13, 0.5), 'A');
            spiral.rotation.x = -0.45; spiral.position.set(0, 0.26, 0.5);
            break;
        }
        case 'sword': {
            const hilt = add(_box(sc, "g_hl", 0.07, 0.07, 0.22), 'B'); hilt.position.z = -0.16;
            const guard = add(_box(sc, "g_gd", 0.26, 0.06, 0.06), 'M'); guard.position.z = -0.02;
            const blade = add(_box(sc, "g_bl", 0.05, 0.12, 0.85), 'A'); blade.position.z = 0.42;
            const bt = add(_cyl(sc, "g_bt", 0.0, 0.13, 0.16), 'A');
            bt.rotation.x = Math.PI / 2; bt.position.z = 0.9;
            break;
        }
        default: { // blaster
            const rec = add(_box(sc, "g_r", 0.15, 0.17, 0.44), 'B'); rec.position.z = 0.0;
            const barrel = add(_cyl(sc, "g_br", 0.075, 0.08, 0.42), 'M');
            barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.02, 0.36);
            const muzzle = add(_cyl(sc, "g_mz", muzzleW + 0.04, muzzleW, 0.08), 'A');
            muzzle.rotation.x = Math.PI / 2; muzzle.position.set(0, 0.02, 0.58);
            const strip = add(_box(sc, "g_sp", 0.165, 0.05, 0.26), 'A'); strip.position.set(0, -0.02, 0.0);
            const rail = add(_box(sc, "g_rl", 0.05, 0.045, 0.3), 'M'); rail.position.set(0, 0.11, 0.02);
            const sight = add(_box(sc, "g_s", 0.04, 0.06, 0.04), 'M'); sight.position.set(0, 0.16, -0.08);
            grip(-0.12);
        }
    }
}

// --- Viewmodel (camera-parented) --------------------------------------

function viewmodelSetWeapon(weaponName) {
    if (!Viewmodel.initialized || !weaponName) return;
    const spec = weaponSpec(weaponName);

    if (Viewmodel.accentMat) { try { Viewmodel.accentMat.dispose(); } catch (e) {} }
    const acc = new BABYLON.StandardMaterial("vmAccent", Viewmodel.scene);
    acc.diffuseColor = spec.color.clone();
    acc.emissiveColor = spec.color.scale(0.6);
    acc.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    Viewmodel.accentMat = acc;

    for (const p of Viewmodel.parts) { try { p.dispose(); } catch (e) {} }
    Viewmodel.parts = [];

    const mats = { A: acc, B: Viewmodel.bodyMat, M: Viewmodel.metalMat, D: Viewmodel.darkMat };
    _assembleGun(Viewmodel.scene, spec, (mesh, key) => {
        mesh.parent = Viewmodel.root;
        mesh.material = mats[key];
        mesh.isPickable = false;
        mesh.renderingGroupId = 1;   // always drawn on top of the world
        mesh.applyFog = false;
        Viewmodel.parts.push(mesh);
        return mesh;
    });
}

function viewmodelRecoil() {
    if (!Viewmodel.initialized) return;
    Viewmodel.recoil = Math.min(1.4, Viewmodel.recoil + 1);
}

function updateViewmodel(camera, moving) {
    if (!Viewmodel.initialized || !Viewmodel.root) return;
    const r = Viewmodel.root;

    Viewmodel.phase += moving ? 0.28 : 0.05;
    const p = Viewmodel.phase;

    const tx = moving ? Math.sin(p) * 0.016 : Math.sin(p) * 0.004;
    const ty = moving ? -Math.abs(Math.sin(p)) * 0.022 : Math.sin(p * 0.6) * 0.004;
    Viewmodel.bob.x += (tx - Viewmodel.bob.x) * 0.15;
    Viewmodel.bob.y += (ty - Viewmodel.bob.y) * 0.15;

    const kick = Viewmodel.recoil;
    Viewmodel.recoil *= 0.80;
    if (Viewmodel.recoil < 0.001) Viewmodel.recoil = 0;

    r.position.set(
        Viewmodel.rest.x + Viewmodel.bob.x,
        Viewmodel.rest.y + Viewmodel.bob.y,
        Viewmodel.rest.z - kick * 0.13
    );
    r.rotation.set(
        Viewmodel.restRot.x - kick * 0.26,
        Viewmodel.restRot.y,
        Viewmodel.restRot.z + Math.sin(p * 2) * (moving ? 0.01 : 0.003)
    );
}

// --- Standalone gun model (world drops, turntable) ---------------------

function _newGunMats(sc, color) {
    const B = new BABYLON.StandardMaterial("gmBody", sc);
    B.diffuseColor = new BABYLON.Color3(0.18, 0.19, 0.22);
    B.specularColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    B.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.05);
    const M = new BABYLON.StandardMaterial("gmMetal", sc);
    M.diffuseColor = new BABYLON.Color3(0.35, 0.37, 0.42);
    M.specularColor = new BABYLON.Color3(0.9, 0.9, 1.0); M.specularPower = 64;
    const D = new BABYLON.StandardMaterial("gmDark", sc);
    D.diffuseColor = new BABYLON.Color3(0.09, 0.09, 0.1);
    const A = new BABYLON.StandardMaterial("gmAccent", sc);
    A.diffuseColor = color.clone();
    A.emissiveColor = color.scale(0.4);
    return { A, B, M, D, _all: [A, B, M, D] };
}

// Returns a TransformNode with the gun built under it. opts.renderingGroupId
// optionally forces a rendering group on every part.
function createWeaponModel(scene, name, opts) {
    opts = opts || {};
    const spec = weaponSpec(name);
    const root = new BABYLON.TransformNode("weaponModel", scene);
    const mats = _newGunMats(scene, spec.color);
    root._gunMats = mats;
    _assembleGun(scene, spec, (mesh, key) => {
        mesh.parent = root;
        mesh.material = mats[key];
        mesh.isPickable = false;
        if (opts.renderingGroupId != null) mesh.renderingGroupId = opts.renderingGroupId;
        return mesh;
    });
    return root;
}

function disposeWeaponModel(node) {
    if (!node) return;
    const m = node._gunMats;
    if (m) m._all.forEach(x => { try { x.dispose(); } catch (e) {} });
    try { node.dispose(); } catch (e) {}
}

// --- Turntable icon (HUD / inventory) --------------------------------
//
// Each weapon's gun model is rendered spinning through 16 frames into one
// horizontal sprite sheet (a data URL). The HUD / inventory show it as a
// CSS-stepped background, which reads as a rotating 3D model.
//
// Rendering uses a throwaway offscreen WebGL context. It's async (waits for
// shader compilation) and serialised so only one context is ever alive.

const _iconCache = {};   // name -> {url,frames} | Promise<{url,frames}> | null
let _ttQueue = Promise.resolve();

const _TT_FRAMES = 12, _TT_SIZE = 76;

// One persistent offscreen WebGL context is reused for every turntable render.
// (Creating/disposing an Engine per weapon leaks GL contexts and tanks the fps.)
let _ttEngine = null, _ttScene = null, _ttOff = null;

function _ensureTTScene() {
    if (_ttScene) return;
    _ttOff = document.createElement('canvas');
    _ttOff.width = _TT_SIZE; _ttOff.height = _TT_SIZE;
    _ttEngine = new BABYLON.Engine(_ttOff, true,
        { preserveDrawingBuffer: true, alpha: true }, false);
    _ttScene = new BABYLON.Scene(_ttEngine);
    _ttScene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    const cam = new BABYLON.ArcRotateCamera("ic",
        -Math.PI / 2 + 0.5, Math.PI / 2 - 0.38, 1.35,
        new BABYLON.Vector3(0, 0.02, 0.16), _ttScene);
    cam.fov = 0.9;
    _ttScene.activeCamera = cam;

    const hemi = new BABYLON.HemisphericLight("ih", new BABYLON.Vector3(0.4, 1, 0.35), _ttScene);
    hemi.intensity = 1.25; hemi.groundColor = new BABYLON.Color3(0.4, 0.4, 0.48);
    const dir = new BABYLON.DirectionalLight("id", new BABYLON.Vector3(-0.5, -0.8, 0.4), _ttScene);
    dir.intensity = 1.0;
}

async function _renderTurntable(name) {
    _ensureTTScene();
    const model = createWeaponModel(_ttScene, name, { renderingGroupId: 0 });
    try {
        await _ttScene.whenReadyAsync();  // wait for shaders / meshes

        const sheet = document.createElement('canvas');
        sheet.width = _TT_SIZE * _TT_FRAMES; sheet.height = _TT_SIZE;
        const sctx = sheet.getContext('2d');
        for (let i = 0; i < _TT_FRAMES; i++) {
            model.rotation.y = (i / _TT_FRAMES) * Math.PI * 2;
            _ttScene.render();
            sctx.drawImage(_ttOff, i * _TT_SIZE, 0);
        }
        return { url: sheet.toDataURL('image/png'), frames: _TT_FRAMES };
    } finally {
        disposeWeaponModel(model);
    }
}

// Returns a resolved {url,frames} if cached, otherwise a Promise for it.
function weaponIconSheet(name) {
    if (name in _iconCache) {
        const v = _iconCache[name];
        return (v && typeof v.then === 'function') ? v : Promise.resolve(v);
    }
    const p = _ttQueue.then(() => _renderTurntable(name));
    _iconCache[name] = p;
    _ttQueue = p.then(() => {}, () => {}); // keep the chain alive on failure
    p.then(
        res => { _iconCache[name] = res; },
        err => { console.warn('weapon icon render failed for', name, err); _iconCache[name] = null; }
    );
    return p;
}

function prewarmWeaponIcon(name) {
    try { weaponIconSheet(name); } catch (e) {}
}

// Show a spinning turntable of `name`'s gun inside DOM element `el`.
// Uses an inner <img> animated with translateX (GPU-composited - animating
// background-position on a 16x-wide image was a heavy repaint).
function applyWeaponIcon(el, name) {
    if (!el || !el.dataset) return;
    if (el.dataset.vmWeapon === name && el.dataset.vmReady === '1') return;
    el.dataset.vmWeapon = name;

    // one-time structural setup
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    let img = el.querySelector('img.vm-spin');
    if (!img) {
        img = document.createElement('img');
        img.className = 'vm-spin';
        img.style.cssText = `position:absolute;top:0;left:0;height:100%;width:${_TT_FRAMES * 100}%;` +
            'max-width:none;pointer-events:none;will-change:transform;';
        el.appendChild(img);
    }

    const setSheet = (sheet) => {
        if (!sheet || !sheet.url || el.dataset.vmWeapon !== name) return;
        const n = sheet.frames;
        img.style.width = `${n * 100}%`;
        img.src = sheet.url;
        img.style.setProperty('--vm-shift', `-${((n - 1) / n * 100).toFixed(4)}%`);
        img.style.animation = `vm-spin-x 3s steps(${n - 1}) infinite`;
        el.dataset.vmReady = '1';
    };

    const cached = _iconCache[name];
    if (cached && cached.url) { setSheet(cached); return; }

    // static placeholder while the render runs
    el.dataset.vmReady = '0';
    const flat = (typeof getWeaponImage === 'function') ? getWeaponImage(name) : null;
    if (flat) {
        img.src = flat;
        img.style.width = '100%';
        img.style.animation = 'none';
    }
    Promise.resolve(weaponIconSheet(name)).then(setSheet).catch(() => {});
}
