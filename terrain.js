// Terrain and Environment Module
// Handles terrain generation, trees, obstacles, and weapon chests

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
    const grassMaterial = new BABYLON.StandardMaterial("grassMaterial", scene);
    grassMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.7, 0.2);
    mainGround.material = grassMaterial;
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
        
        const hillMaterial = new BABYLON.StandardMaterial("hillMaterial" + i, scene);
        hillMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.6, 0.18);
        hill.material = hillMaterial;
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
        
        const rockMaterial = new BABYLON.StandardMaterial("rockMaterial" + i, scene);
        rockMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
        rock.material = rockMaterial;
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
    const sandMaterial = new BABYLON.StandardMaterial("sandMaterial", scene);
    sandMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.6);
    mainGround.material = sandMaterial;
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
        
        const duneMaterial = new BABYLON.StandardMaterial("duneMaterial" + i, scene);
        duneMaterial.diffuseColor = new BABYLON.Color3(0.85, 0.75, 0.55);
        dune.material = duneMaterial;
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
        
        const rockMaterial = new BABYLON.StandardMaterial("rockMaterial" + i, scene);
        rockMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.5, 0.3);
        rock.material = rockMaterial;
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
    const forestMaterial = new BABYLON.StandardMaterial("forestMaterial", scene);
    forestMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.3, 0.1);
    mainGround.material = forestMaterial;
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
        
        const logMaterial = new BABYLON.StandardMaterial("logMaterial" + i, scene);
        logMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.15, 0.05);
        log.material = logMaterial;
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
        
        const rockMaterial = new BABYLON.StandardMaterial("rockMaterial" + i, scene);
        rockMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.2);
        rock.material = rockMaterial;
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
    const volcMaterial = new BABYLON.StandardMaterial("volcMaterial", scene);
    volcMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.1, 0.05);
    volcMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.02, 0.01);
    mainGround.material = volcMaterial;
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
        
        const rockMaterial = new BABYLON.StandardMaterial("rockMaterial" + i, scene);
        rockMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.1, 0.1);
        rockMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.02);
        rock.material = rockMaterial;
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
    const metalMaterial = new BABYLON.StandardMaterial("metalMaterial", scene);
    metalMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.5);
    metalMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    mainGround.material = metalMaterial;
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

// Create tree with trunk and leaves
function createTree(scene, x, z) {
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {height: 12, diameter: 2.5}, scene);
    trunk.position = new BABYLON.Vector3(x, 6, z);
    
    const trunkMaterial = new BABYLON.StandardMaterial("trunkMaterial", scene);
    trunkMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
    trunk.material = trunkMaterial;
    trunk.checkCollisions = true;
    
    const leaves = BABYLON.MeshBuilder.CreateSphere("leaves", {diameter: 8}, scene);
    leaves.position = new BABYLON.Vector3(x, 14, z);
    
    const leavesMaterial = new BABYLON.StandardMaterial("leavesMaterial", scene);
    leavesMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1);
    leaves.material = leavesMaterial;
    leaves.checkCollisions = true;
}

// Create dark forest tree with different styling
function createDarkTree(scene, x, z) {
    const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {height: 15, diameter: 3}, scene);
    trunk.position = new BABYLON.Vector3(x, 7.5, z);
    
    const trunkMaterial = new BABYLON.StandardMaterial("darkTrunkMaterial", scene);
    trunkMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.1, 0.05);
    trunk.material = trunkMaterial;
    trunk.checkCollisions = true;
    
    const leaves = BABYLON.MeshBuilder.CreateSphere("leaves", {diameter: 12}, scene);
    leaves.position = new BABYLON.Vector3(x, 18, z);
    
    const leavesMaterial = new BABYLON.StandardMaterial("darkLeavesMaterial", scene);
    leavesMaterial.diffuseColor = new BABYLON.Color3(0.05, 0.2, 0.05);
    leaves.material = leavesMaterial;
    leaves.checkCollisions = true;
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