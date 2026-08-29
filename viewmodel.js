// First-person Weapon Viewmodel
// A stylised gun parented to the camera so you can see what you're holding.
// It bobs when you walk, kicks when you shoot, and is rebuilt with a
// different silhouette + colour to match each weapon's type and flavour.

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
    viewmodelSetWeapon(gameState.player.hudWeapons[gameState.player.currentWeapon]);
}

// --- Build helpers -------------------------------------------------------

function _vmClear() {
    for (const p of Viewmodel.parts) { try { p.dispose(); } catch (e) {} }
    Viewmodel.parts = [];
}

function _vmAdd(mesh, mat) {
    mesh.parent = Viewmodel.root;
    mesh.material = mat;
    mesh.isPickable = false;
    mesh.renderingGroupId = 1; // always drawn on top of the world, never clips
    mesh.applyFog = false;
    Viewmodel.parts.push(mesh);
    return mesh;
}

function _box(name, w, h, dp) {
    return BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: dp }, Viewmodel.scene);
}
function _cyl(name, dTop, dBot, h) {
    return BABYLON.MeshBuilder.CreateCylinder(name,
        { diameterTop: dTop, diameterBottom: dBot, height: h, tessellation: 12 }, Viewmodel.scene);
}
function _sph(name, dia) {
    return BABYLON.MeshBuilder.CreateSphere(name, { diameter: dia, segments: 10 }, Viewmodel.scene);
}
function _tor(name, dia, thick) {
    return BABYLON.MeshBuilder.CreateTorus(name,
        { diameter: dia, thickness: thick, tessellation: 16 }, Viewmodel.scene);
}
function _poly(name, ptype, sz) {
    return BABYLON.MeshBuilder.CreatePolyhedron(name, { type: ptype, size: sz }, Viewmodel.scene);
}

// A pistol grip most archetypes share
function _addGrip(back) {
    const grip = _vmAdd(_box("vmGrip", 0.1, 0.22, 0.12), Viewmodel.bodyMat);
    grip.position.set(0, -0.17, back);
    grip.rotation.x = -0.35;
    const trig = _vmAdd(_box("vmTrig", 0.04, 0.07, 0.03), Viewmodel.metalMat);
    trig.position.set(0, -0.1, back + 0.09);
}

// --- Per-weapon look ---------------------------------------------------

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
    // 1. Named silhouettes - the iconic ones get their own shape
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
    // 2. Derived from stats
    else if (multi >= 4 || (spread && multi >= 3)) archetype = 'gatling';
    else if (spread) archetype = 'scatter';
    else if (fast && slowFire) archetype = 'sniper';
    // 3. Fall back to projectile type
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

function viewmodelSetWeapon(weaponName) {
    if (!Viewmodel.initialized || !weaponName) return;
    const spec = weaponSpec(weaponName);

    if (Viewmodel.accentMat) { try { Viewmodel.accentMat.dispose(); } catch (e) {} }
    const acc = new BABYLON.StandardMaterial("vmAccent", Viewmodel.scene);
    acc.diffuseColor = spec.color.clone();
    acc.emissiveColor = spec.color.scale(0.6);
    acc.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    Viewmodel.accentMat = acc;

    _vmClear();
    const A = Viewmodel.accentMat, B = Viewmodel.bodyMat, M = Viewmodel.metalMat, D = Viewmodel.darkMat;
    const muzzleW = 0.09 + spec.size * 0.12 + (spec.multi > 1 ? 0.06 : 0);

    switch (spec.archetype) {
        case 'beam': {
            const body = _vmAdd(_box("vmB", 0.12, 0.13, 0.5), B); body.position.z = 0.02;
            const railT = _vmAdd(_box("vmRT", 0.05, 0.04, 0.44), M); railT.position.set(0, 0.09, 0.04);
            const railB = _vmAdd(_box("vmRB", 0.05, 0.04, 0.44), M); railB.position.set(0, -0.09, 0.04);
            const emitter = _vmAdd(BABYLON.MeshBuilder.CreateTorus("vmE",
                { diameter: 0.16, thickness: 0.05, tessellation: 16 }, Viewmodel.scene), A);
            emitter.rotation.x = Math.PI / 2; emitter.position.set(0, 0, 0.32);
            const core = _vmAdd(_cyl("vmC", 0.05, 0.05, 0.5), A); core.rotation.x = Math.PI / 2; core.position.z = 0.05;
            _addGrip(-0.12);
            break;
        }
        case 'laser': {
            const body = _vmAdd(_box("vmB", 0.1, 0.11, 0.34), B); body.position.z = -0.04;
            const barrel = _vmAdd(_cyl("vmBr", 0.04, 0.05, 0.6), M);
            barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.28;
            const crystal = _vmAdd(BABYLON.MeshBuilder.CreatePolyhedron("vmX",
                { type: 1, size: 0.09 }, Viewmodel.scene), A);
            crystal.position.set(0, 0.01, 0.58);
            const fin = _vmAdd(_box("vmF", 0.02, 0.14, 0.16), A); fin.position.set(0, 0.08, -0.02);
            _addGrip(-0.1);
            break;
        }
        case 'cannon': {
            const tube = _vmAdd(_cyl("vmT", 0.26 + spec.size * 0.06, 0.24, 0.5), B);
            tube.rotation.x = Math.PI / 2; tube.position.z = 0.16;
            const back = _vmAdd(_box("vmBk", 0.22, 0.22, 0.18), D); back.position.z = -0.14;
            const ring = _vmAdd(_tor("vmRg", 0.3, 0.05), A);
            ring.rotation.x = Math.PI / 2; ring.position.z = 0.4;
            const tip = _vmAdd(_sph("vmTip", 0.18), A);
            tip.position.z = 0.44; tip.scaling.z = 0.6;
            const sight = _vmAdd(_box("vmS", 0.05, 0.08, 0.1), M); sight.position.set(0, 0.16, -0.05);
            _addGrip(-0.12);
            break;
        }
        case 'gatling': {
            const drum = _vmAdd(_box("vmDr", 0.24, 0.24, 0.22), B); drum.position.z = -0.05;
            const back = _vmAdd(_box("vmGb", 0.18, 0.18, 0.06), D); back.position.z = -0.19;
            const hub = _vmAdd(_cyl("vmHub", 0.1, 0.1, 0.44), M);
            hub.rotation.x = Math.PI / 2; hub.position.z = 0.26;
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2;
                const bar = _vmAdd(_cyl("vmGB" + i, 0.055, 0.055, 0.46), M);
                bar.rotation.x = Math.PI / 2;
                bar.position.set(Math.cos(a) * 0.085, Math.sin(a) * 0.085, 0.3);
            }
            const ring = _vmAdd(_tor("vmGR", 0.26, 0.045), A);
            ring.rotation.x = Math.PI / 2; ring.position.z = 0.46;
            _addGrip(-0.12);
            break;
        }
        case 'scatter': {
            const body = _vmAdd(_box("vmB", 0.16, 0.15, 0.32), B); body.position.z = -0.02;
            const flare = _vmAdd(_cyl("vmFl", 0.34, 0.12, 0.24), A);
            flare.rotation.x = Math.PI / 2; flare.position.z = 0.28;
            const under = _vmAdd(_cyl("vmUn", 0.09, 0.09, 0.22), M);
            under.rotation.x = Math.PI / 2; under.position.set(0, -0.09, 0.2);
            const pump = _vmAdd(_box("vmPu", 0.11, 0.08, 0.14), M); pump.position.set(0, -0.1, 0.06);
            _addGrip(-0.1);
            break;
        }
        case 'sniper': {
            const body = _vmAdd(_box("vmB", 0.11, 0.12, 0.34), B); body.position.z = -0.06;
            const barrel = _vmAdd(_cyl("vmBr", 0.05, 0.055, 0.88), M);
            barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.44;
            const brake = _vmAdd(_cyl("vmBk", 0.1, 0.07, 0.1), A);
            brake.rotation.x = Math.PI / 2; brake.position.z = 0.86;
            const scope = _vmAdd(_cyl("vmSc", 0.09, 0.09, 0.3), D);
            scope.rotation.x = Math.PI / 2; scope.position.set(0, 0.15, 0.04);
            const lens = _vmAdd(_cyl("vmLn", 0.08, 0.08, 0.02), A);
            lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.15, 0.19);
            const stock = _vmAdd(_box("vmSt", 0.08, 0.14, 0.22), B); stock.position.z = -0.3;
            [-1, 1].forEach(s => {
                const leg = _vmAdd(_box("vmLg" + s, 0.02, 0.18, 0.02), M);
                leg.position.set(s * 0.06, -0.12, 0.32); leg.rotation.z = s * 0.35;
            });
            _addGrip(-0.12);
            break;
        }
        case 'tesla': {
            const body = _vmAdd(_box("vmB", 0.13, 0.14, 0.4), B); body.position.z = 0;
            [0.06, 0.2].forEach((z, i) => {
                const coil = _vmAdd(_tor("vmCo" + i, 0.17, 0.035), A);
                coil.rotation.x = Math.PI / 2; coil.position.z = z;
            });
            [-1, 0, 1].forEach(s => {
                const prong = _vmAdd(_box("vmPr" + s, 0.03, 0.03, 0.26), A);
                prong.position.set(s * 0.06, s === 0 ? 0.04 : 0.0, 0.42);
                prong.rotation.y = s * 0.32;
                prong.rotation.x = s === 0 ? -0.15 : 0;
            });
            _addGrip(-0.12);
            break;
        }
        case 'wand': {
            const rod = _vmAdd(_cyl("vmRod", 0.04, 0.045, 0.5), M);
            rod.rotation.x = 1.2; rod.position.set(0, -0.02, 0.05);
            const wrap = _vmAdd(_cyl("vmWr", 0.06, 0.06, 0.1), B);
            wrap.rotation.x = 1.2; wrap.position.set(0, -0.13, -0.12);
            const star = _vmAdd(_poly("vmStar", 0, 0.08), A);
            star.position.set(0, 0.16, 0.3);
            const spark = _vmAdd(_sph("vmSpk", 0.05), A);
            spark.position.set(0.07, 0.22, 0.34);
            break;
        }
        case 'gem': {
            const handle = _vmAdd(_box("vmHd", 0.07, 0.16, 0.1), B); handle.position.set(0, -0.05, -0.14);
            const guard = _vmAdd(_box("vmGd", 0.2, 0.05, 0.06), M); guard.position.z = -0.04;
            const big = _vmAdd(_poly("vmBig", 2, 0.16), A); big.position.z = 0.2;
            const s1 = _vmAdd(_poly("vmS1", 1, 0.07), A); s1.position.set(0.07, 0.08, 0.08);
            const s2 = _vmAdd(_poly("vmS2", 1, 0.06), A); s2.position.set(-0.06, -0.03, 0.12);
            break;
        }
        case 'orb': {
            const body = _vmAdd(_box("vmB", 0.12, 0.13, 0.24), B); body.position.z = -0.08;
            [0.12, 0.4].forEach((z, i) => {
                const ring = _vmAdd(_tor("vmOr" + i, 0.3, 0.04), M);
                ring.rotation.x = Math.PI / 2; ring.position.z = z;
            });
            [0, 1, 2].forEach(i => {
                const a = (i / 3) * Math.PI * 2;
                const strut = _vmAdd(_box("vmSt" + i, 0.02, 0.02, 0.3), M);
                strut.position.set(Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0.26);
            });
            const core = _vmAdd(_sph("vmCore", 0.2), A); core.position.z = 0.26;
            _addGrip(-0.1);
            break;
        }
        case 'maw': {
            const body = _vmAdd(_box("vmB", 0.15, 0.16, 0.36), B); body.position.z = -0.02;
            const jawT = _vmAdd(_cyl("vmJT", 0.24, 0.06, 0.22), D);
            jawT.rotation.x = Math.PI / 2 - 0.22; jawT.position.set(0, 0.06, 0.3);
            const jawB = _vmAdd(_cyl("vmJB", 0.24, 0.06, 0.22), D);
            jawB.rotation.x = Math.PI / 2 + 0.22; jawB.position.set(0, -0.06, 0.3);
            const throat = _vmAdd(_sph("vmTh", 0.15), A); throat.position.z = 0.28;
            [-1, 1].forEach(s => {
                const horn = _vmAdd(_cyl("vmHn" + s, 0.0, 0.05, 0.16), M);
                horn.position.set(s * 0.08, 0.12, 0.06); horn.rotation.x = -0.4;
            });
            _addGrip(-0.12);
            break;
        }
        case 'cyberpistol': {
            const body = _vmAdd(_box("vmB", 0.13, 0.16, 0.34), B); body.position.z = 0;
            const top = _vmAdd(_box("vmTp", 0.1, 0.05, 0.22), M); top.position.set(0, 0.1, 0.03);
            const barrel = _vmAdd(_box("vmBr", 0.06, 0.06, 0.3), M); barrel.position.z = 0.3;
            const muzzle = _vmAdd(_box("vmMz", 0.09, 0.09, 0.06), A); muzzle.position.z = 0.46;
            const screen = _vmAdd(_box("vmScr", 0.02, 0.09, 0.13), A); screen.position.set(0.075, 0.0, -0.02);
            const ant = _vmAdd(_cyl("vmAnt", 0.018, 0.018, 0.16), M);
            ant.position.set(-0.04, 0.18, -0.12);
            const antTip = _vmAdd(_sph("vmAT", 0.035), A); antTip.position.set(-0.04, 0.27, -0.12);
            _addGrip(-0.12);
            break;
        }
        case 'sonic': {
            const body = _vmAdd(_box("vmB", 0.14, 0.15, 0.28), B); body.position.z = -0.04;
            const coneOut = _vmAdd(_cyl("vmCn", 0.36, 0.1, 0.26), B);
            coneOut.rotation.x = Math.PI / 2; coneOut.position.z = 0.3;
            const coneIn = _vmAdd(_cyl("vmCi", 0.28, 0.06, 0.2), A);
            coneIn.rotation.x = Math.PI / 2; coneIn.position.z = 0.3;
            [-1, 1].forEach(s => {
                const vent = _vmAdd(_box("vmVt" + s, 0.04, 0.1, 0.14), M);
                vent.position.set(s * 0.09, 0, 0);
            });
            _addGrip(-0.1);
            break;
        }
        case 'bow': {
            const riser = _vmAdd(_box("vmRi", 0.06, 0.34, 0.08), B); riser.position.z = 0.0;
            [-1, 1].forEach(s => {
                const limb = _vmAdd(_box("vmLm" + s, 0.04, 0.24, 0.05), M);
                limb.position.set(0, s * 0.26, 0.02); limb.rotation.x = s * -0.5;
            });
            const bolt = _vmAdd(_cyl("vmBo", 0.02, 0.03, 0.5), A);
            bolt.rotation.x = Math.PI / 2; bolt.position.z = 0.2;
            const tip = _vmAdd(_cyl("vmBt", 0.0, 0.06, 0.1), A);
            tip.rotation.x = Math.PI / 2; tip.position.z = 0.46;
            _addGrip(-0.1);
            break;
        }
        case 'elemental': {
            const body = _vmAdd(_box("vmB", 0.14, 0.15, 0.4), B); body.position.z = 0.0;
            const tank = _vmAdd(_cyl("vmTk", 0.13, 0.13, 0.3), A);
            tank.rotation.z = Math.PI / 2; tank.position.set(0, 0.13, -0.02);
            const hose = _vmAdd(_cyl("vmH", 0.03, 0.03, 0.18), D);
            hose.rotation.x = 0.5; hose.position.set(0.02, 0.06, 0.12);
            const nozzle = _vmAdd(_cyl("vmN", muzzleW + 0.04, 0.08, 0.14), A);
            nozzle.rotation.x = Math.PI / 2; nozzle.position.set(0, 0, 0.3);
            _addGrip(-0.1);
            break;
        }
        case 'staff': {
            const shaft = _vmAdd(_cyl("vmSh", 0.045, 0.05, 0.95), M);
            shaft.rotation.x = 1.15; shaft.position.set(0, -0.02, 0.06);
            const wrap = _vmAdd(_cyl("vmW", 0.07, 0.07, 0.14), B);
            wrap.rotation.x = 1.15; wrap.position.set(0, -0.08, -0.08);
            const orb = _vmAdd(_sph("vmO", 0.17 + spec.size * 0.06), A);
            orb.position.set(0, 0.24, 0.42);
            const claw = _vmAdd(BABYLON.MeshBuilder.CreateTorus("vmCl",
                { diameter: 0.22, thickness: 0.03, tessellation: 12 }, Viewmodel.scene), M);
            claw.rotation.x = Math.PI / 2 + 0.3; claw.position.set(0, 0.22, 0.42);
            break;
        }
        case 'horn': {
            const shaft = _vmAdd(_cyl("vmSh", 0.045, 0.05, 0.9), M);
            shaft.rotation.x = 1.15; shaft.position.set(0, -0.02, 0.06);
            const spiral = _vmAdd(_cyl("vmHn", 0.0, 0.13, 0.5), A);
            spiral.rotation.x = -0.45; spiral.position.set(0, 0.26, 0.5);
            break;
        }
        case 'sword': {
            const hilt = _vmAdd(_box("vmHl", 0.07, 0.07, 0.22), B); hilt.position.z = -0.16;
            const guard = _vmAdd(_box("vmGd", 0.26, 0.06, 0.06), M); guard.position.z = -0.02;
            const blade = _vmAdd(_box("vmBl", 0.05, 0.12, 0.85), A); blade.position.z = 0.42;
            const tipB = _vmAdd(_cyl("vmBt", 0.0, 0.13, 0.16), A);
            tipB.rotation.x = Math.PI / 2; tipB.position.z = 0.9;
            break;
        }
        default: { // blaster
            const rec = _vmAdd(_box("vmR", 0.15, 0.17, 0.44), B); rec.position.z = 0.0;
            const barrel = _vmAdd(_cyl("vmBr", 0.075, 0.08, 0.42), M);
            barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.02, 0.36);
            const muzzle = _vmAdd(_cyl("vmMz", muzzleW + 0.04, muzzleW, 0.08), A);
            muzzle.rotation.x = Math.PI / 2; muzzle.position.set(0, 0.02, 0.58);
            const strip = _vmAdd(_box("vmSt", 0.165, 0.05, 0.26), A); strip.position.set(0, -0.02, 0.0);
            const rail = _vmAdd(_box("vmRl", 0.05, 0.045, 0.3), M); rail.position.set(0, 0.11, 0.02);
            const sight = _vmAdd(_box("vmS", 0.04, 0.06, 0.04), M); sight.position.set(0, 0.16, -0.08);
            _addGrip(-0.12);
        }
    }
}

// --- Runtime -------------------------------------------------------------

function viewmodelRecoil() {
    if (!Viewmodel.initialized) return;
    Viewmodel.recoil = Math.min(1.4, Viewmodel.recoil + 1);
}

function updateViewmodel(camera, moving) {
    if (!Viewmodel.initialized || !Viewmodel.root) return;
    const r = Viewmodel.root;

    Viewmodel.phase += moving ? 0.28 : 0.05;
    const p = Viewmodel.phase;

    const targetX = moving ? Math.sin(p) * 0.016 : Math.sin(p) * 0.004;
    const targetY = moving ? -Math.abs(Math.sin(p)) * 0.022 : Math.sin(p * 0.6) * 0.004;
    Viewmodel.bob.x += (targetX - Viewmodel.bob.x) * 0.15;
    Viewmodel.bob.y += (targetY - Viewmodel.bob.y) * 0.15;

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
