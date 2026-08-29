// Day / Night Cycle Module
// A sun arcs across the sky over ~60 seconds of daylight, followed by ~60
// seconds of night while a moon crosses. Lighting and sky colour are driven
// every frame from the sun's elevation.

const DayNight = {
    cycleMs: 120000,     // full loop: 60s day + 60s night
    startTime: 0,
    initialized: false,
    orbitRadius: 320,
    sun: null,
    moon: null,
    sunLight: null,
    ambientLight: null,
    nightSky: new BABYLON.Color3(0.02, 0.03, 0.09),
    sunsetSky: new BABYLON.Color3(0.85, 0.42, 0.20)
};

// 0 during the day, ramping to 1 at midnight. Used to buff enemies at night.
function getNightFactor() {
    if (!DayNight.initialized) return 0;
    const t = ((Date.now() - DayNight.startTime) % DayNight.cycleMs) / DayNight.cycleMs;
    return Math.max(0, -Math.sin(t * Math.PI * 2));
}

function isNight() {
    return getNightFactor() > 0.15;
}

function initDayNightCycle(scene) {
    DayNight.startTime = Date.now();

    // Directional light that represents the sun's rays
    const sunLight = new BABYLON.DirectionalLight("sunLight", new BABYLON.Vector3(0, -1, 0.2), scene);
    sunLight.intensity = 1.0;
    DayNight.sunLight = sunLight;

    // Re-use the existing hemispheric light as sky/ambient fill
    DayNight.ambientLight = scene.getLightByName("light");

    // Visible sun orb
    const sun = BABYLON.MeshBuilder.CreateSphere("sunOrb", { diameter: 34, segments: 16 }, scene);
    const sunMat = new BABYLON.StandardMaterial("sunMat", scene);
    sunMat.emissiveColor = new BABYLON.Color3(1, 0.92, 0.65);
    sunMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    sunMat.specularColor = new BABYLON.Color3(0, 0, 0);
    sunMat.disableLighting = true;
    sun.material = sunMat;
    sun.isPickable = false;
    sun.infiniteDistance = false;
    DayNight.sun = sun;

    // Soft halo around the sun
    const halo = BABYLON.MeshBuilder.CreateSphere("sunHalo", { diameter: 60, segments: 16 }, scene);
    const haloMat = new BABYLON.StandardMaterial("sunHaloMat", scene);
    haloMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0.4);
    haloMat.disableLighting = true;
    haloMat.alpha = 0.18;
    halo.material = haloMat;
    halo.isPickable = false;
    halo.parent = sun;
    halo.position = BABYLON.Vector3.Zero();

    // Visible moon orb
    const moon = BABYLON.MeshBuilder.CreateSphere("moonOrb", { diameter: 22, segments: 16 }, scene);
    const moonMat = new BABYLON.StandardMaterial("moonMat", scene);
    moonMat.emissiveColor = new BABYLON.Color3(0.72, 0.76, 0.9);
    moonMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
    moonMat.specularColor = new BABYLON.Color3(0, 0, 0);
    moonMat.disableLighting = true;
    moon.material = moonMat;
    moon.isPickable = false;
    DayNight.moon = moon;

    // Sky bodies must not be dimmed by distance fog
    [sun, halo, moon].forEach(m => { m.applyFog = false; });

    DayNight.initialized = true;
    updateDayNightCycle(scene, scene.activeCamera);
}

function updateDayNightCycle(scene, camera) {
    if (!DayNight.initialized || !camera) return;

    // phase: 0 -> sunrise, PI/2 -> noon, PI -> sunset, 3PI/2 -> midnight
    const t = ((Date.now() - DayNight.startTime) % DayNight.cycleMs) / DayNight.cycleMs;
    const phase = t * Math.PI * 2;

    const sinP = Math.sin(phase);   // elevation, +1 noon, -1 midnight
    const cosP = Math.cos(phase);   // east/west travel

    // Sun / moon positions, kept relative to the camera so they stay "in the sky".
    // The big Z offset tilts the whole arc so the sun stays at a raking angle
    // even at midday - that keeps object shadows long enough to read all day.
    const R = DayNight.orbitRadius;
    const sunOffset = new BABYLON.Vector3(cosP * R, sinP * R * 0.82, 235);
    const moonOffset = new BABYLON.Vector3(-cosP * R, -sinP * R * 0.82, 235);

    DayNight.sun.position = camera.position.add(sunOffset);
    DayNight.moon.position = camera.position.add(moonOffset);
    DayNight.sun.setEnabled(sunOffset.y > -50);
    DayNight.moon.setEnabled(moonOffset.y > -50);

    // Daylight strength (0 at/below horizon, 1 at noon), eased
    const dayFactor = Math.max(0, sinP);
    const light = Math.pow(dayFactor, 0.6);

    // The single directional light doubles as sunlight by day and moonlight by
    // night. It carries most of the scene light so its shadows stay readable.
    if (sinP > 0) {
        DayNight.sunLight.direction = sunOffset.scale(-1).normalize();
        DayNight.sunLight.intensity = 0.15 + light * 1.35;
        DayNight.sunLight.diffuse = BABYLON.Color3.Lerp(
            new BABYLON.Color3(1.0, 0.55, 0.3),   // warm at the horizon
            new BABYLON.Color3(1.0, 0.97, 0.9),   // near-white at noon
            Math.min(1, dayFactor * 2)
        );
    } else {
        const moonUp = Math.max(0, -sinP);
        DayNight.sunLight.direction = moonOffset.scale(-1).normalize();
        DayNight.sunLight.intensity = 0.15 + moonUp * 0.4;
        DayNight.sunLight.diffuse = new BABYLON.Color3(0.5, 0.6, 0.85); // cool moonlight
    }

    // Ambient fill: kept moderate so the sun's shadows read; floor keeps night playable
    if (DayNight.ambientLight) {
        DayNight.ambientLight.intensity = 0.34 + light * 0.34;
        DayNight.ambientLight.diffuse = BABYLON.Color3.Lerp(
            new BABYLON.Color3(0.4, 0.46, 0.68),
            new BABYLON.Color3(1, 1, 1),
            light
        );
        DayNight.ambientLight.groundColor = BABYLON.Color3.Lerp(
            new BABYLON.Color3(0.12, 0.14, 0.2),
            new BABYLON.Color3(0.45, 0.42, 0.38),
            light
        );
    }

    // Sky colour: night -> day (level's own sky), with a sunset wash near the horizon
    const daySky = (typeof getCurrentLevelConfig === 'function' && getCurrentLevelConfig().skyColor)
        ? getCurrentLevelConfig().skyColor
        : new BABYLON.Color3(0.4, 0.7, 0.95);

    let sky = BABYLON.Color3.Lerp(DayNight.nightSky, daySky, Math.pow(dayFactor, 0.5));
    const sunsetAmount = (sinP > -0.1) ? Math.max(0, 1 - dayFactor * 4.5) : 0;
    sky = BABYLON.Color3.Lerp(sky, DayNight.sunsetSky, sunsetAmount * 0.3);
    scene.clearColor = sky;

    // Sun tint shifts orange as it sinks
    DayNight.sun.material.emissiveColor = BABYLON.Color3.Lerp(
        new BABYLON.Color3(1, 0.55, 0.25),
        new BABYLON.Color3(1, 0.93, 0.68),
        Math.min(1, dayFactor * 2)
    );
    DayNight.moon.material.emissiveColor = new BABYLON.Color3(0.72, 0.76, 0.9);

    // Hand the current sky state to the graphics module (sky dome, stars, shadows)
    if (typeof onDayNightUpdate === 'function') {
        onDayNightUpdate(scene, camera, {
            sky: sky,
            horizon: BABYLON.Color3.Lerp(sky, DayNight.sunsetSky, sunsetAmount * 0.35 + 0.04),
            dayFactor: dayFactor,
            nightFactor: Math.max(0, -sinP),
            sunUp: sinP > 0
        });
    }
}
