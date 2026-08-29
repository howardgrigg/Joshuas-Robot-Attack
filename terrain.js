// Terrain and Environment Module
// Handles terrain generation, trees, obstacles, and weapon chests

// --- Procedural texture helpers ----------------------------------------------
// The game ships no image assets, so surface detail is painted onto a
// canvas-backed DynamicTexture once per level and cached on the scene.

function _texCache(scene) {
    if (!scene.__procTex) scene.__procTex = {};
    return scene.__procTex;
}

// Build a tiling speckle/noise texture from a set of options.
function makeSpeckleTexture(scene, key, opts) {
    const cache = _texCache(scene);
    if (cache[key]) return cache[key];

    const size = opts.size || 512;
    const tex = new BABYLON.DynamicTexture("tex_" + key, size, scene, false);
    const ctx = tex.getContext();

    ctx.fillStyle = opts.base;
    ctx.fillRect(0, 0, size, size);

    // Optional panel grid (used for the space floor)
    if (opts.grid) {
        ctx.strokeStyle = opts.gridColor || 'rgba(255,255,255,0.15)';
        ctx.lineWidth = opts.gridWidth || 2;
        for (let g = 0; g <= size; g += opts.grid) {
            ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, size); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(size, g); ctx.stroke();
        }
    }

    // Random speckles for grain
    const spots = opts.spots || 2600;
    ctx.globalAlpha = opts.alpha != null ? opts.alpha : 0.5;
    for (let i = 0; i < spots; i++) {
        const r = opts.minR + Math.random() * (opts.maxR - opts.minR);
        ctx.fillStyle = opts.shades[(Math.random() * opts.shades.length) | 0];
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Optional jagged cracks / streaks
    if (opts.cracks) {
        ctx.strokeStyle = opts.crackColor || 'rgba(0,0,0,0.22)';
        ctx.lineWidth = opts.crackWidth || 1.5;
        for (let i = 0; i < opts.cracks; i++) {
            let x = Math.random() * size, y = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(x, y);
            const segs = 3 + (Math.random() * 4 | 0);
            for (let s = 0; s < segs; s++) {
                x += (Math.random() - 0.5) * 110;
                y += (Math.random() - 0.5) * 110;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }

    tex.update(false);
    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    const uv = opts.uv || 1;
    tex.uScale = uv;
    tex.vScale = uv;
    cache[key] = tex;
    return tex;
}

const GROUND_TEX_OPTS = {
    grasslands: { base:'#4b9a33', shades:['#3d7f28','#57ab3c','#2f6b1f','#6cc04b','#8a7d3a'], minR:1, maxR:3.5, spots:4200, alpha:0.55, uv:16 },
    desert:     { base:'#d9c48a', shades:['#c9b070','#e6d4a0','#bfa460','#efe3bd'], minR:1, maxR:3, spots:3000, alpha:0.5, cracks:45, crackColor:'rgba(120,95,55,0.22)', uv:13 },
    forest:     { base:'#2c4a1e', shades:['#22391a','#37582a','#18280f','#4a3a20','#574726'], minR:1, maxR:4, spots:4400, alpha:0.6, uv:16 },
    volcanic:   { base:'#3a1710', shades:['#280f0a','#4a201a','#1c0a08','#6b2b12','#8a3a14'], minR:1, maxR:4, spots:3800, alpha:0.6, cracks:80, crackColor:'rgba(255,120,40,0.32)', crackWidth:2, uv:13 },
    space:      { base:'#5a5a66', shades:['#4a4a55','#6a6a78','#3f3f48','#7a7a88'], minR:1, maxR:2.5, spots:1600, alpha:0.4, grid:64, uv:6 }
};

const ROCK_TEX_OPTS = {
    grasslands: { base:'#8f8f8f', shades:['#787878','#a2a2a2','#666666','#5c6157'], minR:2, maxR:7, spots:900, alpha:0.5, cracks:30, uv:2 },
    desert:     { base:'#b07d4a', shades:['#9a6a3c','#c48f58','#805530','#d9a56e'], minR:2, maxR:7, spots:850, alpha:0.5, cracks:26, uv:2 },
    forest:     { base:'#3f5a3a', shades:['#2f4a2c','#4f6a48','#5a5a3a','#6a7a3a','#7d7d55'], minR:2, maxR:8, spots:1000, alpha:0.55, cracks:20, uv:2 },
    volcanic:   { base:'#2a1a1a', shades:['#180f0f','#3a2020','#4a2515','#0f0a0a'], minR:2, maxR:8, spots:1000, alpha:0.6, cracks:40, crackColor:'rgba(255,90,30,0.28)', uv:2 }
};

// Shared textured ground material for a theme.
function themeGroundMaterial(scene, theme) {
    const cache = _texCache(scene);
    const matKey = "mat_ground_" + theme;
    if (cache[matKey]) return cache[matKey];

    const tex = makeSpeckleTexture(scene, "ground_" + theme, GROUND_TEX_OPTS[theme] || GROUND_TEX_OPTS.grasslands);
    const mat = new BABYLON.StandardMaterial(matKey, scene);
    mat.diffuseTexture = tex;
    mat.specularColor = theme === 'space'
        ? new BABYLON.Color3(0.35, 0.35, 0.42)
        : new BABYLON.Color3(0.03, 0.03, 0.03);
    if (theme === 'volcanic') mat.emissiveColor = new BABYLON.Color3(0.09, 0.02, 0.01);
    if (theme === 'space') mat.emissiveColor = new BABYLON.Color3(0.06, 0.06, 0.12);
    cache[matKey] = mat;
    return mat;
}

// Bark material for fallen logs (streaky vertical grain).
function forestBarkMaterial(scene) {
    const cache = _texCache(scene);
    if (cache.mat_bark) return cache.mat_bark;
    const tex = makeSpeckleTexture(scene, "bark", {
        base:'#3a220f', shades:['#2a1808','#4a2c15','#1e1206','#573620'],
        minR:1, maxR:2.5, spots:2600, alpha:0.55, cracks:120,
        crackColor:'rgba(20,10,4,0.35)', crackWidth:2, uv:1
    });
    tex.uScale = 1; tex.vScale = 4; // stretch grain along the log
    const mat = new BABYLON.StandardMaterial("mat_bark", scene);
    mat.diffuseTexture = tex;
    mat.specularColor = new BABYLON.Color3(0.03, 0.03, 0.03);
    cache.mat_bark = mat;
    return mat;
}

// Shared textured rock material for a theme.
function themeRockMaterial(scene, theme) {
    const cache = _texCache(scene);
    const matKey = "mat_rock_" + theme;
    if (cache[matKey]) return cache[matKey];

    const tex = makeSpeckleTexture(scene, "rock_" + theme, ROCK_TEX_OPTS[theme] || ROCK_TEX_OPTS.grasslands);
    const mat = new BABYLON.StandardMaterial(matKey, scene);
    mat.diffuseTexture = tex;
    mat.specularColor = new BABYLON.Color3(0.06, 0.06, 0.06);
    if (theme === 'volcanic') mat.emissiveColor = new BABYLON.Color3(0.08, 0.03, 0.02);
    cache[matKey] = mat;
    return mat;
}

// Create level-specific terrain based on theme
function createLevelTerrain(scene, theme) {
    switch (theme) {
        case 'grasslands':
            createGrasslandsTerrain(scene);
            break;
        case 'desert':
            createDesertTerrain(scene);
            break;
        case 'forest':
            createForestTerrain(scene);
            break;
        case 'volcanic':
            createVolcanicTerrain(scene);
            break;
        case 'space':
            createSpaceTerrain(scene);
            break;
        default:
            createGrasslandsTerrain(scene);
    }
}

// Legacy terrain function for backward compatibility
function createTerrain(scene) {
    createGrasslandsTerrain(scene);
}

// Level 1: Grasslands terrain
function createGrasslandsTerrain(scene) {
    // Main grass ground
    const mainGround = BABYLON.MeshBuilder.CreateGround("mainGround", {width: 240, height: 240}, scene);
    mainGround.material = themeGroundMaterial(scene, 'grasslands');
    mainGround.checkCollisions = true;
    
    // Rolling green hills
    for (let i = 0; i < 8; i++) {
        const diameter = Math.random() * 20 + 15;
        const hill = BABYLON.MeshBuilder.CreateSphere("hill" + i, {diameter: diameter}, scene);
        hill.position.x = Math.random() * 100 - 50;
        hill.position.z = Math.random() * 100 - 50;
        
        const yScale = Math.random() * 0.3 + 0.2;
        hill.scaling.y = yScale;
        
        // Position hill so it sits on or slightly below ground level
        const radius = diameter / 2;
        const scaledHeight = radius * yScale;
        hill.position.y = -scaledHeight * 0.6; // Bury 60% of the hill, leaving 40% above ground
        
        hill.material = themeGroundMaterial(scene, 'grasslands');
        hill.checkCollisions = true;
        
        // Add hills to obstacles array for robot AI
        gameState.obstacles.push({
            position: new BABYLON.Vector3(hill.position.x, 0, hill.position.z),
            radius: diameter / 2 + 2 // Use original radius plus buffer
        });
    }
    
    // Small rocks for cover
    for (let i = 0; i < 15; i++) {
        const diameter = Math.random() * 4 + 3;
        const rock = BABYLON.MeshBuilder.CreateSphere("rock" + i, {diameter: diameter}, scene);
        rock.position.x = Math.random() * 150 - 75;
        rock.position.z = Math.random() * 150 - 75;
        rock.position.y = rock.scaling.y / 2;
        
        rock.material = themeRockMaterial(scene, 'grasslands');
        rock.checkCollisions = true;
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(rock.position.x, 0, rock.position.z),
            radius: diameter / 2 + 1
        });
    }
    
    // Trees scattered around
    for (let i = 0; i < 25; i++) {
        const x = Math.random() * 180 - 90;
        const z = Math.random() * 180 - 90;
        createTree(scene, x, z);
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(x, 0, z),
            radius: 3
        });
    }
}

// Level 2: Desert terrain
function createDesertTerrain(scene) {
    // Sandy ground
    const mainGround = BABYLON.MeshBuilder.CreateGround("mainGround", {width: 240, height: 240}, scene);
    mainGround.material = themeGroundMaterial(scene, 'desert');
    mainGround.checkCollisions = true;
    
    // Sand dunes
    for (let i = 0; i < 12; i++) {
        const diameter = Math.random() * 25 + 20;
        const dune = BABYLON.MeshBuilder.CreateSphere("dune" + i, {diameter: diameter}, scene);
        dune.position.x = Math.random() * 120 - 60;
        dune.position.z = Math.random() * 120 - 60;
        
        const yScale = Math.random() * 0.4 + 0.3;
        dune.scaling.y = yScale;
        
        // Position dune so it sits on or slightly below ground level
        const radius = diameter / 2;
        const scaledHeight = radius * yScale;
        dune.position.y = -scaledHeight * 0.7; // Bury 70% of the dune, leaving 30% above ground
        
        dune.material = themeGroundMaterial(scene, 'desert');
        dune.checkCollisions = true;
        
        // Add dunes to obstacles array for robot AI
        gameState.obstacles.push({
            position: new BABYLON.Vector3(dune.position.x, 0, dune.position.z),
            radius: diameter / 2 + 2 // Use original radius plus buffer
        });
    }
    
    // Large rocky outcrops
    for (let i = 0; i < 20; i++) {
        const diameter = Math.random() * 6 + 5;
        const rock = BABYLON.MeshBuilder.CreateSphere("rock" + i, {diameter: diameter}, scene);
        rock.position.x = Math.random() * 180 - 90;
        rock.position.z = Math.random() * 180 - 90;
        rock.position.y = rock.scaling.y / 2;
        rock.scaling.y = Math.random() * 0.8 + 0.5;
        
        rock.material = themeRockMaterial(scene, 'desert');
        rock.checkCollisions = true;
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(rock.position.x, 0, rock.position.z),
            radius: diameter / 2 + 1
        });
    }
    
    // Cacti
    for (let i = 0; i < 15; i++) {
        const cactus = BABYLON.MeshBuilder.CreateCylinder("cactus" + i, {height: Math.random() * 8 + 4, diameter: 1.5}, scene);
        cactus.position.x = Math.random() * 160 - 80;
        cactus.position.z = Math.random() * 160 - 80;
        cactus.position.y = cactus.scaling.y * 2;
        
        const cactusMaterial = new BABYLON.StandardMaterial("cactusMaterial" + i, scene);
        cactusMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.2);
        cactus.material = cactusMaterial;
        cactus.checkCollisions = true;
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(cactus.position.x, 0, cactus.position.z),
            radius: 2
        });
    }
}

// Level 3: Forest terrain
function createForestTerrain(scene) {
    // Dark forest ground
    const mainGround = BABYLON.MeshBuilder.CreateGround("mainGround", {width: 240, height: 240}, scene);
    mainGround.material = themeGroundMaterial(scene, 'forest');
    mainGround.checkCollisions = true;
    
    // Dense forest with many trees
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        createDarkTree(scene, x, z);
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(x, 0, z),
            radius: 3
        });
    }
    
    // Fallen logs for cover
    for (let i = 0; i < 25; i++) {
        const log = BABYLON.MeshBuilder.CreateCylinder("log" + i, {height: Math.random() * 12 + 8, diameter: 2}, scene);
        log.position.x = Math.random() * 180 - 90;
        log.position.z = Math.random() * 180 - 90;
        log.position.y = 1;
        log.rotation.z = Math.PI / 2; // Lay it horizontally
        log.rotation.y = Math.random() * Math.PI;
        
        log.material = forestBarkMaterial(scene);
        log.checkCollisions = true;
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(log.position.x, 0, log.position.z),
            radius: 4
        });
    }
    
    // Moss-covered rocks
    for (let i = 0; i < 18; i++) {
        const diameter = Math.random() * 5 + 4;
        const rock = BABYLON.MeshBuilder.CreateSphere("rock" + i, {diameter: diameter}, scene);
        rock.position.x = Math.random() * 170 - 85;
        rock.position.z = Math.random() * 170 - 85;
        rock.position.y = rock.scaling.y / 2;
        
        rock.material = themeRockMaterial(scene, 'forest');
        rock.checkCollisions = true;
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(rock.position.x, 0, rock.position.z),
            radius: diameter / 2 + 1
        });
    }
}

// Level 4: Volcanic terrain
function createVolcanicTerrain(scene) {
    // Volcanic rock ground
    const mainGround = BABYLON.MeshBuilder.CreateGround("mainGround", {width: 240, height: 240}, scene);
    mainGround.material = themeGroundMaterial(scene, 'volcanic');
    mainGround.checkCollisions = true;
    
    // Lava pools
    for (let i = 0; i < 8; i++) {
        const lavaPool = BABYLON.MeshBuilder.CreateGround("lava" + i, {width: Math.random() * 12 + 8, height: Math.random() * 12 + 8}, scene);
        lavaPool.position.x = Math.random() * 140 - 70;
        lavaPool.position.z = Math.random() * 140 - 70;
        lavaPool.position.y = -0.2;
        
        const lavaMaterial = new BABYLON.StandardMaterial("lavaMaterial" + i, scene);
        lavaMaterial.diffuseColor = new BABYLON.Color3(1, 0.3, 0.1);
        lavaMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0.05);
        lavaPool.material = lavaMaterial;
    }
    
    // Volcanic rock formations
    for (let i = 0; i < 30; i++) {
        const diameter = Math.random() * 7 + 6;
        const rock = BABYLON.MeshBuilder.CreateSphere("rock" + i, {diameter: diameter}, scene);
        rock.position.x = Math.random() * 200 - 100;
        rock.position.z = Math.random() * 200 - 100;
        rock.position.y = rock.scaling.y / 2;
        rock.scaling.y = Math.random() * 1.2 + 0.8;
        
        rock.material = themeRockMaterial(scene, 'volcanic');
        rock.checkCollisions = true;
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(rock.position.x, 0, rock.position.z),
            radius: diameter / 2 + 1
        });
    }
    
    // Steam vents
    for (let i = 0; i < 12; i++) {
        const vent = BABYLON.MeshBuilder.CreateCylinder("vent" + i, {height: 1, diameter: 3}, scene);
        vent.position.x = Math.random() * 120 - 60;
        vent.position.z = Math.random() * 120 - 60;
        vent.position.y = 0.5;
        
        const ventMaterial = new BABYLON.StandardMaterial("ventMaterial" + i, scene);
        ventMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
        vent.material = ventMaterial;
        vent.checkCollisions = true;
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(vent.position.x, 0, vent.position.z),
            radius: 2.5
        });
    }
}

// Level 5: Space station terrain
function createSpaceTerrain(scene) {
    // Metallic floor
    const mainGround = BABYLON.MeshBuilder.CreateGround("mainGround", {width: 240, height: 240}, scene);
    mainGround.material = themeGroundMaterial(scene, 'space');
    mainGround.checkCollisions = true;
    
    // Tech platforms
    for (let i = 0; i < 15; i++) {
        const platform = BABYLON.MeshBuilder.CreateCylinder("platform" + i, {height: Math.random() * 4 + 3, diameter: Math.random() * 10 + 8}, scene);
        platform.position.x = Math.random() * 160 - 80;
        platform.position.z = Math.random() * 160 - 80;
        platform.position.y = platform.scaling.y / 2;
        
        const platformMaterial = new BABYLON.StandardMaterial("platformMaterial" + i, scene);
        platformMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.7);
        platformMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
        platform.material = platformMaterial;
        platform.checkCollisions = true;
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(platform.position.x, 0, platform.position.z),
            radius: (platform.scaling.x * 8) / 2 + 1
        });
    }
    
    // Control panels/structures
    for (let i = 0; i < 20; i++) {
        const panel = BABYLON.MeshBuilder.CreateBox("panel" + i, {width: Math.random() * 3 + 2, height: Math.random() * 6 + 4, depth: 1}, scene);
        panel.position.x = Math.random() * 180 - 90;
        panel.position.z = Math.random() * 180 - 90;
        panel.position.y = panel.scaling.y / 2;
        
        const panelMaterial = new BABYLON.StandardMaterial("panelMaterial" + i, scene);
        panelMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.6);
        panelMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.2);
        panel.material = panelMaterial;
        panel.checkCollisions = true;
        
        gameState.obstacles.push({
            position: new BABYLON.Vector3(panel.position.x, 0, panel.position.z),
            radius: 3
        });
    }
}

// Create a leafy broadleaf tree: tapered trunk + a clustered, layered canopy.
function createTree(scene, x, z) {
    const scale = 0.75 + Math.random() * 0.6;      // size variety
    const tint = (Math.random() - 0.5) * 0.12;      // per-tree green shift

    // Tapered trunk (wider at the base)
    const trunkH = 11 * scale;
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {
        height: trunkH,
        diameterTop: 1.0 * scale,
        diameterBottom: 2.2 * scale,
        tessellation: 8
    }, scene);
    trunk.position = new BABYLON.Vector3(x, trunkH / 2, z);
    trunk.rotation.y = Math.random() * Math.PI;

    const trunkMaterial = new BABYLON.StandardMaterial("trunkMaterial", scene);
    trunkMaterial.diffuseColor = new BABYLON.Color3(0.36, 0.24, 0.14);
    trunkMaterial.specularColor = new BABYLON.Color3(0.05, 0.04, 0.03);
    trunk.material = trunkMaterial;
    trunk.checkCollisions = true;

    // Shared canopy material
    const leavesMaterial = new BABYLON.StandardMaterial("leavesMaterial", scene);
    leavesMaterial.diffuseColor = new BABYLON.Color3(0.14 + tint, 0.5 + tint, 0.14 + tint);
    leavesMaterial.specularColor = new BABYLON.Color3(0.03, 0.06, 0.03);
    leavesMaterial.emissiveColor = new BABYLON.Color3(0.02, 0.07, 0.02);

    // Overlapping blobs make a fuller, less geometric canopy
    const canopyY = trunkH + 1.5 * scale;
    const blobs = [
        { dx: 0.0,  dy: 0.0,  d: 8.4 },
        { dx: 2.4,  dz: 0.6,  dy: -1.4, d: 5.6 },
        { dx: -2.3, dz: -0.8, dy: -1.0, d: 5.8 },
        { dx: 0.4,  dz: 2.2,  dy: -1.6, d: 5.2 },
        { dx: -0.6, dz: -1.8, dy: 2.2,  d: 6.0 }
    ];
    blobs.forEach(b => {
        const leaf = BABYLON.MeshBuilder.CreateSphere("leaves", { diameter: b.d * scale, segments: 6 }, scene);
        leaf.position = new BABYLON.Vector3(
            x + (b.dx || 0) * scale,
            canopyY + (b.dy || 0) * scale,
            z + (b.dz || 0) * scale
        );
        leaf.scaling.y = 0.85;
        leaf.material = leavesMaterial;
    });
}

// Create a dark forest conifer: slim trunk + stacked drooping cone tiers.
function createDarkTree(scene, x, z) {
    const scale = 0.9 + Math.random() * 0.7;

    const trunkH = 6 * scale;
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {
        height: trunkH,
        diameterTop: 0.9 * scale,
        diameterBottom: 1.8 * scale,
        tessellation: 8
    }, scene);
    trunk.position = new BABYLON.Vector3(x, trunkH / 2, z);

    const trunkMaterial = new BABYLON.StandardMaterial("darkTrunkMaterial", scene);
    trunkMaterial.diffuseColor = new BABYLON.Color3(0.16, 0.09, 0.05);
    trunkMaterial.specularColor = new BABYLON.Color3(0.03, 0.02, 0.02);
    trunk.material = trunkMaterial;
    trunk.checkCollisions = true;

    const leavesMaterial = new BABYLON.StandardMaterial("darkLeavesMaterial", scene);
    leavesMaterial.diffuseColor = new BABYLON.Color3(0.05, 0.22, 0.08);
    leavesMaterial.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    leavesMaterial.emissiveColor = new BABYLON.Color3(0.02, 0.06, 0.03);

    // Three overlapping cone tiers, widest at the bottom
    const tiers = [
        { y: trunkH - 0.5 * scale, d: 9.0, h: 8.0 },
        { y: trunkH + 3.5 * scale, d: 7.0, h: 7.0 },
        { y: trunkH + 7.0 * scale, d: 4.6, h: 6.0 }
    ];
    tiers.forEach(t => {
        const cone = BABYLON.MeshBuilder.CreateCylinder("leaves", {
            diameterTop: 0,
            diameterBottom: t.d * scale,
            height: t.h * scale,
            tessellation: 8
        }, scene);
        cone.position = new BABYLON.Vector3(x, t.y + (t.h * scale) / 2 - 1.5 * scale, z);
        cone.rotation.y = Math.random() * Math.PI;
        cone.material = leavesMaterial;
    });
}

// Create weapon storage chest
function createWeaponChest(scene) {
    let chestPosition;
    for (let attempts = 0; attempts < 50; attempts++) {
        const x = Math.random() * 180 - 90;
        const z = Math.random() * 180 - 90;
        chestPosition = new BABYLON.Vector3(x, 1, z);
        
        // Check distance from other chests (minimum 30 units apart)
        let validPosition = true;
        for (const existingChest of gameState.weaponChests) {
            const distance = BABYLON.Vector3.Distance(chestPosition, existingChest.position);
            if (distance < 30) {
                validPosition = false;
                break;
            }
        }
        
        // Check distance from obstacles
        for (const obstacle of gameState.obstacles) {
            const distance = BABYLON.Vector3.Distance(chestPosition, obstacle.position);
            if (distance < 8) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) break;
    }
    
    // Create chest base
    const chest = BABYLON.MeshBuilder.CreateBox("weaponChest", {width: 3, height: 2, depth: 2}, scene);
    chest.position = chestPosition;
    
    const chestMaterial = new BABYLON.StandardMaterial("chestMaterial", scene);
    chestMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1);
    chestMaterial.specularColor = new BABYLON.Color3(0.2, 0.1, 0.05);
    chest.material = chestMaterial;
    
    // Metal bands on chest
    const band1 = BABYLON.MeshBuilder.CreateBox("band1", {width: 3.1, height: 0.2, depth: 2.1}, scene);
    band1.position = new BABYLON.Vector3(chestPosition.x, chestPosition.y + 0.3, chestPosition.z);
    const band2 = BABYLON.MeshBuilder.CreateBox("band2", {width: 3.1, height: 0.2, depth: 2.1}, scene);
    band2.position = new BABYLON.Vector3(chestPosition.x, chestPosition.y - 0.3, chestPosition.z);
    
    const metalMaterial = new BABYLON.StandardMaterial("metalMaterial", scene);
    metalMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    metalMaterial.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    band1.material = metalMaterial;
    band2.material = metalMaterial;
    
    // Glowing indicator
    const indicator = BABYLON.MeshBuilder.CreateSphere("indicator", {diameter: 0.5}, scene);
    indicator.position = new BABYLON.Vector3(chestPosition.x, chestPosition.y + 1.5, chestPosition.z);
    
    const indicatorMaterial = new BABYLON.StandardMaterial("indicatorMaterial", scene);
    indicatorMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    indicatorMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.1);
    indicator.material = indicatorMaterial;
    
    const chestData = {
        mesh: chest,
        indicator: indicator,
        bands: [band1, band2],
        position: chestPosition,
        storedWeapons: [],
        isOpen: false,
        id: gameState.weaponChests.length
    };
    
    chest.checkCollisions = true;
    gameState.weaponChests.push(chestData);
    
    gameState.obstacles.push({
        position: chestPosition,
        radius: 4
    });
}

// Create level-specific environment objects  
function createLevelEnvironment(scene, theme) {
    // Add weapon chests for all levels
    for (let i = 0; i < 6; i++) {
        createWeaponChest(scene);
    }
}

// Legacy environment function for backward compatibility
function createEnvironmentObjects(scene) {
    createLevelEnvironment(scene, 'grasslands');
}