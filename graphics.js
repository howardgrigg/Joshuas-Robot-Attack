// Graphics Module
// Global visual polish: emissive glow layer, distance fog, gradient sky
// dome with stars, sun shadows, and punchy combat particle effects.
// Everything here is defensive - if a feature can't initialise, the game
// keeps running without it.

const Graphics = {
    initialized: false,
    scene: null,
    camera: null,
    glow: null,
    shadowGen: null,
    skyMat: null,
    skyDome: null,
    starMat: null,
    starDome: null,
    dotTexture: null,
    _frame: 0,
    _lastMuzzle: 0,
    _fxLights: 0
};

function initGraphics(scene, camera) {
    if (Graphics.initialized) return;
    Graphics.scene = scene;
    Graphics.camera = camera;

    buildGlow(scene);
    buildFog(scene);
    buildSky(scene);
    Graphics.dotTexture = makeDotTexture(scene);
    buildShadows(scene);

    Graphics.initialized = true;
    refreshSceneGraphics(scene);
}

// --- Glow --------------------------------------------------------------------
// A GlowLayer (not a full DefaultRenderingPipeline) lights up emissive things -
// the sun, robot eyes/cores, weapon shots, coins, lava, particle effects -
// while leaving the main render pass (and its shadows) untouched.

function buildGlow(scene) {
    try {
        const gl = new BABYLON.GlowLayer("glow", scene, { blurKernelSize: 24 });
        gl.intensity = 0.5;
        Graphics.glow = gl;
    } catch (e) {
        console.warn('Glow layer unavailable:', e);
    }
}

// --- Fog ------------------------------------------------------------------

function buildFog(scene) {
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0032;
    scene.fogColor = new BABYLON.Color3(0.6, 0.72, 0.85);
}

// --- Sky dome + stars ---------------------------------------------------

function buildSky(scene) {
    // Vertical gradient painted onto a small canvas texture and shown as pure
    // emissive (no lighting) so it can never be blown out by scene lights.
    const tex = new BABYLON.DynamicTexture("skyGradTex", { width: 8, height: 256 }, scene, false);
    tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    Graphics.skyTex = tex;
    paintSkyGradient(new BABYLON.Color3(0.16, 0.40, 0.72), new BABYLON.Color3(0.62, 0.76, 0.92));

    const mat = new BABYLON.StandardMaterial("skyMat", scene);
    mat.emissiveTexture = tex;
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    mat.specularColor = new BABYLON.Color3(0, 0, 0);

    const dome = BABYLON.MeshBuilder.CreateSphere("skyDome",
        { diameter: 1000, segments: 24, sideOrientation: BABYLON.Mesh.BACKSIDE }, scene);
    dome.material = mat;
    dome.infiniteDistance = true;
    dome.isPickable = false;
    dome.applyFog = false;
    Graphics.skyMat = mat;
    Graphics.skyDome = dome;
    Graphics._skySig = "";

    // Star field painted on a transparent canvas
    const starTex = new BABYLON.DynamicTexture("starTex", 1024, scene, false);
    const c = starTex.getContext();
    c.clearRect(0, 0, 1024, 1024);
    for (let i = 0; i < 520; i++) {
        const r = Math.random() < 0.12 ? 2.3 : 1.1;
        c.fillStyle = `rgba(255,255,255,${0.5 + Math.random() * 0.5})`;
        c.beginPath();
        c.arc(Math.random() * 1024, Math.random() * 1024, r, 0, Math.PI * 2);
        c.fill();
    }
    starTex.hasAlpha = true;
    starTex.update();

    const starMat = new BABYLON.StandardMaterial("starMat", scene);
    starMat.diffuseTexture = starTex;
    starMat.opacityTexture = starTex;
    starMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
    starMat.disableLighting = true;
    starMat.backFaceCulling = false;

    const stars = BABYLON.MeshBuilder.CreateSphere("starDome",
        { diameter: 950, segments: 16, sideOrientation: BABYLON.Mesh.BACKSIDE }, scene);
    stars.material = starMat;
    stars.infiniteDistance = true;
    stars.isPickable = false;
    stars.applyFog = false;
    stars.visibility = 0;
    Graphics.starMat = starMat;
    Graphics.starDome = stars;
}

function _cssRGB(c) {
    return `rgb(${Math.round(Math.min(1, c.r) * 255)},${Math.round(Math.min(1, c.g) * 255)},${Math.round(Math.min(1, c.b) * 255)})`;
}

function paintSkyGradient(topColor, bottomColor) {
    const tex = Graphics.skyTex;
    if (!tex) return;
    const ctx = tex.getContext();
    const h = tex.getSize().height;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    const mid = BABYLON.Color3.Lerp(topColor, bottomColor, 0.5);
    g.addColorStop(0.0, _cssRGB(topColor));
    g.addColorStop(0.55, _cssRGB(BABYLON.Color3.Lerp(topColor, mid, 0.7)));
    g.addColorStop(0.86, _cssRGB(bottomColor));
    g.addColorStop(1.0, _cssRGB(bottomColor));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, tex.getSize().width, h);
    tex.update(false);
}

// --- Shadows -----------------------------------------------------------

function buildShadows(scene) {
    try {
        if (typeof DayNight !== 'object' || !DayNight.sunLight) return;
        const sun = DayNight.sunLight;

        const sg = new BABYLON.ShadowGenerator(2048, sun);
        // PCF is far more predictable than ESM for a stylised scene
        sg.usePercentageCloserFiltering = true;
        sg.filteringQuality = BABYLON.ShadowGenerator.QUALITY_MEDIUM;
        sg.darkness = 0.32;
        sg.bias = 0.005;
        sg.normalBias = 0.03;
        sg.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYTWOFRAMES;

        // Let Babylon auto-frame the shadow frustum around the casters each frame.
        sun.autoUpdateExtends = true;
        sun.autoCalcShadowZBounds = true;

        Graphics.shadowGen = sg;
    } catch (e) {
        console.warn('Shadows unavailable:', e);
    }
}

// Rebuild the shadow caster list and mark ground meshes as receivers.
// Cheap enough to run a few times a second so new robots/trees cast shadows.
function refreshSceneGraphics(scene) {
    const sg = Graphics.shadowGen;
    if (!sg) return;
    const map = sg.getShadowMap();
    if (!map) return;
    if (!map.renderList) map.renderList = [];

    map.renderList.length = 0;
    // Only cast shadows from things near the player: keeps the auto-framed
    // shadow frustum tight, so shadows stay crisp. Foliage blobs, hills and
    // dunes are skipped (too many meshes, barely read as shadows).
    const CASTER = /^(enemy|boss|buddy|rock|trunk|log|cactus|weaponDrop|coin)/;
    const RECEIVER = /^(mainGround|hill|dune|platform|lava)/;
    const cam = Graphics.camera;
    const RANGE2 = 70 * 70;

    for (const m of scene.meshes) {
        if (!m || (m.isDisposed && m.isDisposed())) continue;
        if (!m.parent && CASTER.test(m.name)) {
            const near = !cam ||
                BABYLON.Vector3.DistanceSquared(m.getAbsolutePosition(), cam.position) < RANGE2;
            if (near) sg.addShadowCaster(m, true);
        }
        if (RECEIVER.test(m.name)) {
            m.receiveShadows = true;
        }
    }
}

// --- Per-frame ------------------------------------------------------------

function graphicsUpdate(scene, camera) {
    if (!Graphics.initialized) return;
    Graphics._frame++;
    if (Graphics._frame % 20 === 0) {
        refreshSceneGraphics(scene);
    }
}

// Called by daynight.js each frame with the current sky state
function onDayNightUpdate(scene, camera, info) {
    if (!Graphics.initialized) return;

    // Build a clean sky gradient here: the zenith stays blue-ish through the
    // whole cycle, and only the low horizon band picks up a warm dawn/dusk glow.
    if (Graphics.skyTex) {
        const d = Math.min(1, Math.max(0, info.dayFactor));
        const e = d * d * (3 - 2 * d); // smoothstep

        const zenith = BABYLON.Color3.Lerp(
            new BABYLON.Color3(0.03, 0.05, 0.13),   // night
            new BABYLON.Color3(0.20, 0.46, 0.82),   // day
            e);
        let horizon = BABYLON.Color3.Lerp(
            new BABYLON.Color3(0.06, 0.09, 0.18),   // night
            new BABYLON.Color3(0.58, 0.74, 0.92),   // day
            e);

        // Warm glow only when the sun is near the horizon (low d) and above it
        const warm = Math.max(0, 1 - d * 4.5) * (info.sunUp ? 1 : 0.35);
        if (warm > 0) {
            horizon = BABYLON.Color3.Lerp(horizon,
                new BABYLON.Color3(1.0, 0.62, 0.42), Math.min(0.7, warm * 0.7));
        }

        const sig = [zenith.r, zenith.g, zenith.b, horizon.r, horizon.g, horizon.b]
            .map(v => Math.round(v * 50)).join(',');
        if (sig !== Graphics._skySig) {
            Graphics._skySig = sig;
            paintSkyGradient(zenith, horizon);
        }
        Graphics._fogTint = horizon;
    }

    scene.fogColor = Graphics._fogTint || info.horizon;

    if (Graphics.starDome) {
        const v = Math.max(0, Math.min(1, (info.nightFactor - 0.05) * 1.7));
        Graphics.starDome.visibility = v;
        Graphics.starDome.rotation.y += 0.00018;
    }

    // Put the shadow light "up-sun" from the player so auto-extends frames the
    // area the player is actually in.
    if (Graphics.shadowGen && DayNight.sunLight && DayNight.sunLight.direction) {
        DayNight.sunLight.position =
            camera.position.subtract(DayNight.sunLight.direction.scale(90));
    }
}

// --- Combat effects --------------------------------------------------

function makeDotTexture(scene) {
    const t = new BABYLON.DynamicTexture("gfxDot", 64, scene, false);
    const c = t.getContext();
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    t.hasAlpha = true;
    t.update();
    return t;
}

function _burst(scene, position, opts) {
    if (!Graphics.initialized || !Graphics.dotTexture) return;
    try {
        const ps = new BABYLON.ParticleSystem(opts.name || "fx", opts.count || 24, scene);
        ps.particleTexture = Graphics.dotTexture;
        ps.emitter = position.clone();
        ps.minEmitBox = opts.box ? opts.box.scale(-1) : new BABYLON.Vector3(0, 0, 0);
        ps.maxEmitBox = opts.box || new BABYLON.Vector3(0, 0, 0);
        ps.color1 = opts.color1;
        ps.color2 = opts.color2;
        ps.colorDead = opts.colorDead || new BABYLON.Color4(0, 0, 0, 0);
        ps.minSize = opts.minSize; ps.maxSize = opts.maxSize;
        ps.minLifeTime = opts.minLife; ps.maxLifeTime = opts.maxLife;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        ps.gravity = opts.gravity || new BABYLON.Vector3(0, 0, 0);
        ps.direction1 = opts.dir1;
        ps.direction2 = opts.dir2;
        ps.minEmitPower = opts.minPower; ps.maxEmitPower = opts.maxPower;
        ps.updateSpeed = 0.02;
        ps.emitRate = 0;
        ps.manualEmitCount = opts.count || 24;
        ps.disposeOnStop = true;
        ps.start();
        ps.stop();
    } catch (e) { /* effects are optional */ }
}

// One transient FX light at a time, to stay under the StandardMaterial light cap.
function _flashLight(scene, position, color, intensity, steps) {
    if (Graphics._fxLights > 0) return;
    try {
        Graphics._fxLights++;
        const fl = new BABYLON.PointLight("fxFlash", position.clone(), scene);
        fl.diffuse = color;
        fl.specular = color;
        fl.intensity = intensity;
        fl.range = 16;
        let k = 0;
        const iv = setInterval(() => {
            k++;
            fl.intensity = Math.max(0, intensity * (1 - k / steps));
            if (k >= steps) {
                clearInterval(iv);
                fl.dispose();
                Graphics._fxLights--;
            }
        }, 16);
    } catch (e) {
        Graphics._fxLights = 0;
    }
}

function spawnDeathExplosion(scene, position) {
    _burst(scene, position, {
        name: "death", count: 90,
        box: new BABYLON.Vector3(0.4, 0.4, 0.4),
        color1: new BABYLON.Color4(1, 0.78, 0.25, 1),
        color2: new BABYLON.Color4(1, 0.32, 0.05, 1),
        minSize: 0.35, maxSize: 1.5, minLife: 0.25, maxLife: 0.75,
        gravity: new BABYLON.Vector3(0, -9, 0),
        dir1: new BABYLON.Vector3(-6, 3, -6), dir2: new BABYLON.Vector3(6, 9, 6),
        minPower: 2, maxPower: 7
    });
    // Smoke puff
    _burst(scene, position, {
        name: "deathSmoke", count: 26,
        box: new BABYLON.Vector3(0.5, 0.5, 0.5),
        color1: new BABYLON.Color4(0.25, 0.22, 0.2, 0.6),
        color2: new BABYLON.Color4(0.12, 0.1, 0.1, 0.5),
        minSize: 1.2, maxSize: 2.6, minLife: 0.5, maxLife: 1.1,
        gravity: new BABYLON.Vector3(0, 1.5, 0),
        dir1: new BABYLON.Vector3(-1.5, 1, -1.5), dir2: new BABYLON.Vector3(1.5, 3, 1.5),
        minPower: 1, maxPower: 2.5
    });
    _flashLight(scene, position.add(new BABYLON.Vector3(0, 1, 0)),
        new BABYLON.Color3(1, 0.6, 0.2), 6, 7);
}

function spawnMuzzleFlash(scene, camera) {
    if (!Graphics.initialized) return;
    const now = Date.now();
    if (now - Graphics._lastMuzzle < 55) return;
    Graphics._lastMuzzle = now;

    const fwd = camera.getForwardRay().direction;
    const pos = camera.position.add(fwd.scale(1.7)).add(new BABYLON.Vector3(0, -0.35, 0));

    // No dynamic light here - additive particles + bloom read as a flash and
    // stay clear of the StandardMaterial 4-light limit.
    _burst(scene, pos, {
        name: "muzzle", count: 12,
        color1: new BABYLON.Color4(1, 0.9, 0.5, 1),
        color2: new BABYLON.Color4(1, 0.5, 0.12, 1),
        minSize: 0.15, maxSize: 0.5, minLife: 0.04, maxLife: 0.15,
        dir1: fwd.scale(3).add(new BABYLON.Vector3(-1, -1, -1)),
        dir2: fwd.scale(6).add(new BABYLON.Vector3(1, 1, 1)),
        minPower: 1, maxPower: 3
    });
}

function spawnHitSparks(scene, position, color) {
    const c = color || new BABYLON.Color3(1, 0.9, 0.35);
    _burst(scene, position, {
        name: "sparks", count: 22,
        color1: new BABYLON.Color4(c.r, c.g, c.b, 1),
        color2: new BABYLON.Color4(1, 1, 0.75, 1),
        minSize: 0.1, maxSize: 0.34, minLife: 0.15, maxLife: 0.4,
        gravity: new BABYLON.Vector3(0, -12, 0),
        dir1: new BABYLON.Vector3(-4, -1, -4), dir2: new BABYLON.Vector3(4, 6, 4),
        minPower: 2, maxPower: 5
    });
}

function addScreenShake(amount) {
    const cam = Graphics.camera;
    if (!cam || !cam.cameraRotation) return;
    cam.cameraRotation.x += (Math.random() - 0.5) * amount;
    cam.cameraRotation.y += (Math.random() - 0.5) * amount;
}
