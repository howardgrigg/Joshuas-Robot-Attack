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

// A pistol grip most archetypes share
function _addGrip(back) {
    const grip = _vmAdd(_box("vmGrip", 0.1, 0.22, 0.12), Viewmodel.bodyMat);
    grip.position.set(0, -0.17, back);
    grip.rotation.x = -0.35;
    const trig = _vmAdd(_box("vmTrig", 0.04, 0.07, 0.03), Viewmodel.metalMat);
    trig.position.set(0, -0.1, back + 0.09);
}

// --- Per-weapon look ---------------------------------------------------

// Map a weapon to an archetype + accent colour, from its config + name.
function weaponSpec(name) {
    let cfg = null;
    try { cfg = getWeaponConfig(name); } catch (e) {}
    const color = (cfg && cfg.color) ? cfg.color.clone() : new BABYLON.Color3(0.2, 0.9, 1);
    const type = cfg ? cfg.projectileType : 'energy';
    const size = cfg ? (cfg.size || 0.5) : 0.5;
    const multi = cfg ? (cfg.projectileCount || 1) : 1;
    const poison = cfg && cfg.special === 'poison';

    let archetype = 'blaster';
    if (type === 'beam') archetype = 'beam';
    else if (type === 'laser') archetype = 'laser';
    else if (type === 'rocket') archetype = 'cannon';
    else if (type === 'elemental') archetype = 'elemental';
    else if (type === 'magic') archetype = 'staff';
    else if (type === 'arrow') archetype = 'bow';

    // Name-based special silhouettes
    const n = (name || '').toLowerCase();
    if (n.includes('sword') || n.includes('blade')) archetype = 'sword';
    else if (n.includes('unicorn') || n.includes('horn')) archetype = 'horn';
    else if (n.includes('black hole') || n.includes('void')) archetype = 'voidcannon';

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
        case 'cannon':
        case 'voidcannon': {
            const tube = _vmAdd(_cyl("vmT", 0.26 + spec.size * 0.06, 0.24, 0.5), B);
            tube.rotation.x = Math.PI / 2; tube.position.z = 0.16;
            const back = _vmAdd(_box("vmBk", 0.22, 0.22, 0.18), D); back.position.z = -0.14;
            const ring = _vmAdd(BABYLON.MeshBuilder.CreateTorus("vmRg",
                { diameter: 0.3, thickness: 0.05, tessellation: 16 }, Viewmodel.scene), A);
            ring.rotation.x = Math.PI / 2; ring.position.z = 0.4;
            const tip = _vmAdd(_sph("vmTip", 0.18),
                spec.archetype === 'voidcannon' ? D : A);
            tip.position.z = 0.44; tip.scaling.z = 0.6;
            const sight = _vmAdd(_box("vmS", 0.05, 0.08, 0.1), M); sight.position.set(0, 0.16, -0.05);
            _addGrip(-0.12);
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
