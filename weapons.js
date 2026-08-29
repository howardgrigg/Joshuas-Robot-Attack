// Weapons System Module
// Handles all weapon configurations, descriptions, and projectile creation

// All 50 available weapons
const ALL_WEAPONS = [
    'Basic Blaster', 'Plasma Rifle', 'Lightning Gun', 'Fire Staff', 'Ice Cannon', 'Freeze Gun',
    'Rocket Launcher', 'Grenade Launcher', 'Laser Cannon', 'Photon Beam', 'Quantum Blaster',
    'Sonic Boom', 'Gravity Gun', 'Energy Sword', 'Fusion Rifle', 'Particle Beam',
    'Void Blaster', 'Storm Caller', 'Sun Beam', 'Moon Ray', 'Star Shooter',
    'Dragon Breath', 'Phoenix Fire', 'Ice Storm', 'Thunder Strike', 'Wind Blade',
    'Earth Shaker', 'Water Cannon', 'Poison Dart', 'Acid Sprayer', 'Venom Shot',
    'Crystal Gun', 'Diamond Shooter', 'Ruby Laser', 'Emerald Beam', 'Sapphire Blast',
    'Shadow Gun', 'Light Ray', 'Time Warp', 'Space Ripper', 'Black Hole',
    'Rainbow Beam', 'Unicorn Horn', 'Magic Wand', 'Wizard Staff', 'Fairy Dust',
    'Robot Zapper', 'Mech Buster', 'Cyber Shot', 'Data Stream', 'Code Cannon'
];

// Weapon image mapping - matches weapon index to image file
function getWeaponImage(weaponName) {
    const weaponIndex = ALL_WEAPONS.indexOf(weaponName);
    if (weaponIndex === -1) {
        console.error(`Weapon not found in ALL_WEAPONS: ${weaponName}`);
        return null;
    }
    
    // Check if we're running on file:// protocol
    if (window.location.protocol === 'file:') {
        console.warn('Running on file:// protocol - weapon images disabled due to CORS restrictions');
        console.log('To see weapon images, please run a local web server:');
        console.log('- Run: python3 -m http.server 8000 (or python -m SimpleHTTPServer 8000)');
        console.log('- Then open: http://localhost:8000');
        return null; // Return null to use fallback colored materials
    }
    
    // Images are numbered 1-50, so add 1 to the index and pad with zeros
    const imageNumber = String(weaponIndex + 1).padStart(5, '0');
    const imagePath = `weaponimages/ComfyUI_${imageNumber}_.png`;
    console.log(`Weapon: ${weaponName} -> Index: ${weaponIndex} -> Image: ${imagePath}`);
    return imagePath;
}

// Weapon class definition
class Weapon {
    constructor(name, config) {
        this.name = name;
        this.speed = config.speed;
        this.damage = config.damage;
        this.color = config.color;
        this.projectileType = config.projectileType;
        this.fireRate = config.fireRate || 100;
        this.spread = config.spread || 0;
        this.projectileCount = config.projectileCount || 1;
        this.special = config.special || null;
        this.trail = config.trail || false;
        this.size = config.size || 0.5;
    }
    
    createProjectile(scene, position, direction) {
        const projectiles = [];
        
        for (let i = 0; i < this.projectileCount; i++) {
            let projectile;
            let projectileDirection = direction.clone();
            
            // Add spread for shotgun-like weapons
            if (this.spread > 0) {
                const spreadAngle = (Math.random() - 0.5) * this.spread;
                const rotationMatrix = BABYLON.Matrix.RotationY(spreadAngle);
                projectileDirection = BABYLON.Vector3.TransformCoordinates(projectileDirection, rotationMatrix);
            }
            
            switch (this.projectileType) {
                case 'laser':
                    projectile = this.createLaser(scene, position, projectileDirection);
                    break;
                case 'arrow':
                    projectile = this.createArrow(scene, position, projectileDirection);
                    break;
                case 'rocket':
                    projectile = this.createRocket(scene, position, projectileDirection);
                    break;
                case 'energy':
                    projectile = this.createEnergyBlast(scene, position, projectileDirection);
                    break;
                case 'beam':
                    projectile = this.createBeam(scene, position, projectileDirection);
                    break;
                case 'bullet':
                    projectile = this.createBullet(scene, position, projectileDirection);
                    break;
                case 'magic':
                    projectile = this.createMagicOrb(scene, position, projectileDirection);
                    break;
                case 'elemental':
                    projectile = this.createElemental(scene, position, projectileDirection);
                    break;
                default:
                    projectile = this.createBasic(scene, position, projectileDirection);
            }
            
            projectile.weaponType = this.name;
            projectile.direction = projectileDirection;
            projectile.speed = this.speed;
            projectile.damage = this.damage;
            projectile.special = this.special;
            
            // Add trail effect
            if (this.trail) {
                this.addTrail(projectile);
            }
            
            projectiles.push(projectile);
        }
        
        return projectiles;
    }
    
    createLaser(scene, position, direction) {
        const laser = BABYLON.MeshBuilder.CreateCylinder("laser", 
            {height: 2, diameterTop: 0.1, diameterBottom: 0.1}, scene);
        laser.position = position.clone();
        laser.lookAt(position.add(direction));
        laser.rotation.x += Math.PI / 2;
        
        const material = new BABYLON.StandardMaterial("laserMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color.scale(0.8);
        material.disableLighting = true;
        laser.material = material;
        
        return laser;
    }
    
    createArrow(scene, position, direction) {
        const arrow = BABYLON.MeshBuilder.CreateCylinder("arrow", 
            {height: 1.5, diameterTop: 0.05, diameterBottom: 0.15}, scene);
        arrow.position = position.clone();
        
        const forward = direction.normalize();
        const up = new BABYLON.Vector3(0, 1, 0);
        const right = BABYLON.Vector3.Cross(up, forward);
        const correctedUp = BABYLON.Vector3.Cross(forward, right);
        arrow.rotation = BABYLON.Vector3.RotationFromAxis(right, correctedUp, forward);
        
        const material = new BABYLON.StandardMaterial("arrowMaterial", scene);
        material.diffuseColor = this.color || new BABYLON.Color3(0.6, 0.4, 0.2);
        arrow.material = material;
        
        const tip = BABYLON.MeshBuilder.CreateCone("arrowTip", 
            {height: 0.3, diameterBottom: 0.2}, scene);
        tip.position.y = 0.75;
        tip.parent = arrow;
        tip.material = material;
        
        return arrow;
    }
    
    createRocket(scene, position, direction) {
        const rocket = BABYLON.MeshBuilder.CreateCylinder("rocket", 
            {height: 1.2, diameterTop: 0.2, diameterBottom: 0.3}, scene);
        rocket.position = position.clone();
        rocket.lookAt(position.add(direction));
        rocket.rotation.x += Math.PI / 2;
        
        const material = new BABYLON.StandardMaterial("rocketMaterial", scene);
        material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        rocket.material = material;
        
        const flame = BABYLON.MeshBuilder.CreateSphere("flame", {diameter: 0.4}, scene);
        flame.position.y = -0.8;
        flame.parent = rocket;
        
        const flameMaterial = new BABYLON.StandardMaterial("flameMaterial", scene);
        flameMaterial.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
        flameMaterial.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
        flame.material = flameMaterial;
        
        return rocket;
    }
    
    createEnergyBlast(scene, position, direction) {
        const energy = BABYLON.MeshBuilder.CreateSphere("energy", {diameter: this.size}, scene);
        energy.position = position.clone();
        
        const material = new BABYLON.StandardMaterial("energyMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color.scale(0.7);
        material.specularColor = new BABYLON.Color3(1, 1, 1);
        energy.material = material;
        
        return energy;
    }
    
    createBeam(scene, position, direction) {
        const beam = BABYLON.MeshBuilder.CreateCylinder("beam", 
            {height: 3, diameterTop: 0.05, diameterBottom: 0.05}, scene);
        beam.position = position.clone();
        beam.lookAt(position.add(direction));
        beam.rotation.x += Math.PI / 2;
        
        const material = new BABYLON.StandardMaterial("beamMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color;
        material.alpha = 0.8;
        material.disableLighting = true;
        beam.material = material;
        
        return beam;
    }
    
    createBullet(scene, position, direction) {
        const bullet = BABYLON.MeshBuilder.CreateSphere("bullet", {diameter: 0.3}, scene);
        bullet.position = position.clone();
        
        const material = new BABYLON.StandardMaterial("bulletMaterial", scene);
        material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.6);
        material.specularColor = new BABYLON.Color3(1, 1, 1);
        bullet.material = material;
        
        return bullet;
    }
    
    createMagicOrb(scene, position, direction) {
        const orb = BABYLON.MeshBuilder.CreateSphere("magicOrb", {diameter: this.size}, scene);
        orb.position = position.clone();
        
        const material = new BABYLON.StandardMaterial("magicMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color.scale(0.6);
        material.alpha = 0.9;
        orb.material = material;
        
        // Add sparkle effect
        for (let i = 0; i < 5; i++) {
            const sparkle = BABYLON.MeshBuilder.CreateSphere("sparkle", {diameter: 0.1}, scene);
            sparkle.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            sparkle.parent = orb;
            
            const sparkleMaterial = new BABYLON.StandardMaterial("sparkleMaterial", scene);
            sparkleMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
            sparkle.material = sparkleMaterial;
        }
        
        return orb;
    }
    
    createElemental(scene, position, direction) {
        const elemental = BABYLON.MeshBuilder.CreateSphere("elemental", {diameter: this.size}, scene);
        elemental.position = position.clone();
        
        const material = new BABYLON.StandardMaterial("elementalMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color.scale(0.5);
        elemental.material = material;
        
        // Add elemental particles
        for (let i = 0; i < 3; i++) {
            const particle = BABYLON.MeshBuilder.CreateSphere("particle", {diameter: 0.15}, scene);
            particle.position = new BABYLON.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            );
            particle.parent = elemental;
            particle.material = material;
        }
        
        return elemental;
    }
    
    createBasic(scene, position, direction) {
        const basic = BABYLON.MeshBuilder.CreateSphere("basic", {diameter: this.size}, scene);
        basic.position = position.clone();
        
        const material = new BABYLON.StandardMaterial("basicMaterial", scene);
        material.diffuseColor = this.color;
        material.emissiveColor = this.color.scale(0.3);
        basic.material = material;
        
        return basic;
    }
    
    addTrail(projectile) {
        const trail = BABYLON.MeshBuilder.CreateSphere("trail", {diameter: 0.2}, projectile.getScene());
        trail.position = projectile.position.clone();
        trail.position.y -= 0.5;
        
        const trailMaterial = new BABYLON.StandardMaterial("trailMaterial", projectile.getScene());
        trailMaterial.diffuseColor = this.color.scale(0.5);
        trailMaterial.emissiveColor = this.color.scale(0.3);
        trailMaterial.alpha = 0.6;
        trail.material = trailMaterial;
        
        setTimeout(() => trail.dispose(), 500);
    }
}

// Get weapon configuration by name
function getWeaponConfig(weaponType) {
    const configs = {
        'Basic Blaster': new Weapon('Basic Blaster', { 
            speed: 2, damage: 20, color: new BABYLON.Color3(0, 1, 1), 
            projectileType: 'energy', size: 0.5, fireRate: 150
        }),
        'Plasma Rifle': new Weapon('Plasma Rifle', { 
            speed: 2.5, damage: 25, color: new BABYLON.Color3(0, 1, 0.5), 
            projectileType: 'energy', size: 0.6, trail: true, fireRate: 200
        }),
        'Lightning Gun': new Weapon('Lightning Gun', { 
            speed: 3, damage: 30, color: new BABYLON.Color3(1, 1, 0), 
            projectileType: 'beam', trail: true, fireRate: 300
        }),
        'Fire Staff': new Weapon('Fire Staff', { 
            speed: 2.2, damage: 35, color: new BABYLON.Color3(1, 0, 0), 
            projectileType: 'elemental', size: 0.7, fireRate: 400
        }),
        'Ice Cannon': new Weapon('Ice Cannon', { 
            speed: 1.8, damage: 25, color: new BABYLON.Color3(0.5, 0.8, 1), 
            projectileType: 'elemental', size: 0.8, fireRate: 250
        }),
        'Freeze Gun': new Weapon('Freeze Gun', { 
            speed: 2.5, damage: 0, color: new BABYLON.Color3(0.7, 0.9, 1), 
            projectileType: 'elemental', size: 0.6, fireRate: 100
        }),
        'Rocket Launcher': new Weapon('Rocket Launcher', { 
            speed: 1.5, damage: 50, color: new BABYLON.Color3(1, 0.5, 0), 
            projectileType: 'rocket', trail: true, fireRate: 1200
        }),
        'Grenade Launcher': new Weapon('Grenade Launcher', { 
            speed: 1.2, damage: 60, color: new BABYLON.Color3(0.8, 0.4, 0), 
            projectileType: 'rocket', spread: 0.2, fireRate: 1500
        }),
        'Laser Cannon': new Weapon('Laser Cannon', { 
            speed: 4, damage: 40, color: new BABYLON.Color3(1, 0, 0), 
            projectileType: 'laser', trail: true, fireRate: 600
        }),
        'Photon Beam': new Weapon('Photon Beam', { 
            speed: 3.5, damage: 35, color: new BABYLON.Color3(1, 1, 1), 
            projectileType: 'beam', fireRate: 450
        }),
        'Quantum Blaster': new Weapon('Quantum Blaster', { 
            speed: 3, damage: 45, color: new BABYLON.Color3(0.5, 0, 1), 
            projectileType: 'energy', size: 0.8, trail: true, fireRate: 800
        }),
        'Sonic Boom': new Weapon('Sonic Boom', { 
            speed: 2.8, damage: 32, color: new BABYLON.Color3(0.7, 0.7, 0.7), 
            projectileType: 'energy', spread: 0.3, projectileCount: 3, fireRate: 350
        }),
        'Gravity Gun': new Weapon('Gravity Gun', { 
            speed: 2, damage: 38, color: new BABYLON.Color3(0.4, 0.2, 0.8), 
            projectileType: 'energy', size: 1.0, fireRate: 550
        }),
        'Energy Sword': new Weapon('Energy Sword', { 
            speed: 1.5, damage: 55, color: new BABYLON.Color3(0, 1, 0), 
            projectileType: 'beam', size: 0.3, fireRate: 1300
        }),
        'Fusion Rifle': new Weapon('Fusion Rifle', { 
            speed: 2.3, damage: 42, color: new BABYLON.Color3(1, 0.8, 0), 
            projectileType: 'energy', trail: true, fireRate: 700
        }),
        'Particle Beam': new Weapon('Particle Beam', { 
            speed: 3.2, damage: 36, color: new BABYLON.Color3(0.8, 0, 0.8), 
            projectileType: 'beam', trail: true, fireRate: 500
        }),
        'Void Blaster': new Weapon('Void Blaster', { 
            speed: 2.1, damage: 48, color: new BABYLON.Color3(0.1, 0.1, 0.1), 
            projectileType: 'energy', size: 0.9, fireRate: 1000
        }),
        'Storm Caller': new Weapon('Storm Caller', { 
            speed: 2.7, damage: 33, color: new BABYLON.Color3(0.3, 0.3, 0.8), 
            projectileType: 'elemental', spread: 0.1, projectileCount: 2, fireRate: 380
        }),
        'Sun Beam': new Weapon('Sun Beam', { 
            speed: 3.8, damage: 44, color: new BABYLON.Color3(1, 1, 0.3), 
            projectileType: 'laser', trail: true, fireRate: 750
        }),
        'Moon Ray': new Weapon('Moon Ray', { 
            speed: 2.9, damage: 29, color: new BABYLON.Color3(0.7, 0.7, 0.9), 
            projectileType: 'beam', fireRate: 280
        }),
        'Star Shooter': new Weapon('Star Shooter', { 
            speed: 3.1, damage: 41, color: new BABYLON.Color3(1, 1, 0.8), 
            projectileType: 'energy', size: 0.4, projectileCount: 5, spread: 0.4, fireRate: 650
        }),
        'Dragon Breath': new Weapon('Dragon Breath', { 
            speed: 2.4, damage: 52, color: new BABYLON.Color3(1, 0.3, 0), 
            projectileType: 'elemental', spread: 0.3, projectileCount: 3, fireRate: 1250
        }),
        'Phoenix Fire': new Weapon('Phoenix Fire', { 
            speed: 2.6, damage: 46, color: new BABYLON.Color3(1, 0.6, 0.1), 
            projectileType: 'elemental', trail: true, fireRate: 900
        }),
        'Ice Storm': new Weapon('Ice Storm', { 
            speed: 2.2, damage: 28, color: new BABYLON.Color3(0.6, 0.9, 1), 
            projectileType: 'elemental', spread: 0.5, projectileCount: 4, fireRate: 320
        }),
        'Thunder Strike': new Weapon('Thunder Strike', { 
            speed: 3.4, damage: 39, color: new BABYLON.Color3(0.9, 0.9, 0.2), 
            projectileType: 'beam', trail: true, fireRate: 580
        }),
        'Wind Blade': new Weapon('Wind Blade', { 
            speed: 3.6, damage: 31, color: new BABYLON.Color3(0.8, 1, 0.8), 
            projectileType: 'beam', size: 0.2, fireRate: 330
        }),
        'Earth Shaker': new Weapon('Earth Shaker', { 
            speed: 1.8, damage: 58, color: new BABYLON.Color3(0.6, 0.4, 0.2), 
            projectileType: 'rocket', size: 1.2, fireRate: 1400
        }),
        'Water Cannon': new Weapon('Water Cannon', { 
            speed: 2.5, damage: 26, color: new BABYLON.Color3(0.2, 0.6, 1), 
            projectileType: 'elemental', spread: 0.2, fireRate: 260
        }),
        'Poison Dart': new Weapon('Poison Dart', { 
            speed: 2.8, damage: 22, color: new BABYLON.Color3(0.4, 0.8, 0.2), 
            projectileType: 'arrow', special: 'poison', fireRate: 180
        }),
        'Acid Sprayer': new Weapon('Acid Sprayer', { 
            speed: 2.1, damage: 34, color: new BABYLON.Color3(0.6, 1, 0.2), 
            projectileType: 'elemental', spread: 0.4, projectileCount: 3, special: 'poison', fireRate: 420
        }),
        'Venom Shot': new Weapon('Venom Shot', { 
            speed: 2.7, damage: 27, color: new BABYLON.Color3(0.5, 0.2, 0.8), 
            projectileType: 'energy', trail: true, special: 'poison', fireRate: 270
        }),
        'Crystal Gun': new Weapon('Crystal Gun', { 
            speed: 2.4, damage: 37, color: new BABYLON.Color3(0.9, 0.5, 0.9), 
            projectileType: 'energy', size: 0.4, projectileCount: 3, spread: 0.2, fireRate: 520
        }),
        'Diamond Shooter': new Weapon('Diamond Shooter', { 
            speed: 3.3, damage: 43, color: new BABYLON.Color3(1, 1, 1), 
            projectileType: 'energy', trail: true, fireRate: 720
        }),
        'Ruby Laser': new Weapon('Ruby Laser', { 
            speed: 2.9, damage: 40, color: new BABYLON.Color3(1, 0.2, 0.2), 
            projectileType: 'laser', fireRate: 620
        }),
        'Emerald Beam': new Weapon('Emerald Beam', { 
            speed: 2.6, damage: 35, color: new BABYLON.Color3(0.2, 1, 0.2), 
            projectileType: 'beam', fireRate: 430
        }),
        'Sapphire Blast': new Weapon('Sapphire Blast', { 
            speed: 2.8, damage: 38, color: new BABYLON.Color3(0.2, 0.2, 1), 
            projectileType: 'energy', size: 0.7, fireRate: 560
        }),
        'Shadow Gun': new Weapon('Shadow Gun', { 
            speed: 3.2, damage: 41, color: new BABYLON.Color3(0.2, 0.2, 0.2), 
            projectileType: 'energy', trail: true, fireRate: 680
        }),
        'Light Ray': new Weapon('Light Ray', { 
            speed: 4.2, damage: 36, color: new BABYLON.Color3(1, 1, 0.9), 
            projectileType: 'laser', trail: true, fireRate: 480
        }),
        'Time Warp': new Weapon('Time Warp', { 
            speed: 1.9, damage: 49, color: new BABYLON.Color3(0.7, 0.3, 0.9), 
            projectileType: 'energy', size: 1.0, fireRate: 1100
        }),
        'Space Ripper': new Weapon('Space Ripper', { 
            speed: 3.5, damage: 47, color: new BABYLON.Color3(0.1, 0.1, 0.9), 
            projectileType: 'beam', trail: true, fireRate: 950
        }),
        'Black Hole': new Weapon('Black Hole', { 
            speed: 1.3, damage: 65, color: new BABYLON.Color3(0.1, 0.1, 0.1), 
            projectileType: 'energy', size: 1.5, fireRate: 2000
        }),
        'Rainbow Beam': new Weapon('Rainbow Beam', { 
            speed: 2.7, damage: 33, color: new BABYLON.Color3(1, 0.5, 1), 
            projectileType: 'beam', trail: true, fireRate: 380
        }),
        'Unicorn Horn': new Weapon('Unicorn Horn', { 
            speed: 2.9, damage: 44, color: new BABYLON.Color3(1, 0.8, 1), 
            projectileType: 'magic', trail: true, fireRate: 780
        }),
        'Magic Wand': new Weapon('Magic Wand', { 
            speed: 2.2, damage: 39, color: new BABYLON.Color3(0.8, 0.4, 1), 
            projectileType: 'magic', fireRate: 590
        }),
        'Wizard Staff': new Weapon('Wizard Staff', { 
            speed: 2.1, damage: 51, color: new BABYLON.Color3(0.5, 0.2, 0.8), 
            projectileType: 'magic', size: 0.8, fireRate: 1200
        }),
        'Fairy Dust': new Weapon('Fairy Dust', { 
            speed: 3.7, damage: 24, color: new BABYLON.Color3(1, 0.9, 0.7), 
            projectileType: 'magic', spread: 0.6, projectileCount: 7, fireRate: 300
        }),
        'Robot Zapper': new Weapon('Robot Zapper', { 
            speed: 2.8, damage: 42, color: new BABYLON.Color3(0.2, 0.8, 0.8), 
            projectileType: 'beam', trail: true, fireRate: 700
        }),
        'Mech Buster': new Weapon('Mech Buster', { 
            speed: 2.3, damage: 56, color: new BABYLON.Color3(0.7, 0.2, 0.2), 
            projectileType: 'rocket', trail: true, fireRate: 1350
        }),
        'Cyber Shot': new Weapon('Cyber Shot', { 
            speed: 3.1, damage: 34, color: new BABYLON.Color3(0.3, 1, 0.3), 
            projectileType: 'energy', trail: true, fireRate: 410
        }),
        'Data Stream': new Weapon('Data Stream', { 
            speed: 3.9, damage: 28, color: new BABYLON.Color3(0, 0.8, 1), 
            projectileType: 'beam', spread: 0.1, projectileCount: 3, fireRate: 340
        }),
        'Code Cannon': new Weapon('Code Cannon', { 
            speed: 2.4, damage: 46, color: new BABYLON.Color3(0.5, 0.5, 1), 
            projectileType: 'energy', size: 0.6, fireRate: 880
        })
    };
    return configs[weaponType] || configs['Basic Blaster'];
}

// Get weapon description with damage info
function getWeaponDescription(weaponName) {
    const baseDescriptions = {
        'Basic Blaster': 'Your trusty starting blaster - reliable and ready for robot battles!',
        'Plasma Rifle': 'Shoots super-hot plasma bolts that melt through robot armor like butter!',
        'Lightning Gun': 'Harness the power of thunder to zap robots with electric fury!',
        'Fire Staff': 'A magical staff that launches blazing fireballs of dragon-breath power!',
        'Ice Cannon': 'Freeze your enemies solid with icy blasts from the frozen lands!',
        'Freeze Gun': 'Turn robots into ice sculptures with this arctic weapon of wonder!',
        'Rocket Launcher': 'BOOM! Giant explosive rockets that send robots flying to the moon!',
        'Grenade Launcher': 'Lob bouncing bombs that explode in spectacular robot-destroying glory!',
        'Laser Cannon': 'Pew pew! A sci-fi laser that cuts through metal like a hot knife!',
        'Photon Beam': 'Pure light energy focused into a devastating beam of justice!',
        'Quantum Blaster': 'Uses quantum physics to make robots disappear into another dimension!',
        'Sonic Boom': 'Sound waves so powerful they shatter robot circuits with musical mayhem!',
        'Gravity Gun': 'Control gravity itself to crush robots with the force of planets!',
        'Energy Sword': 'A glowing blade of pure energy that slices through anything!',
        'Fusion Rifle': 'Harnesses the power of the sun to blast robots into stardust!',
        'Particle Beam': 'Tiny particles moving at light speed pack a universe-sized punch!',
        'Void Blaster': 'Shoots holes in reality that swallow robots into the dark void!',
        'Storm Caller': 'Summon lightning storms to rain electric destruction on enemies!',
        'Sun Beam': 'Channel the burning power of our solar system\'s mighty star!',
        'Moon Ray': 'Mysterious lunar energy that makes robots howl at the moon!',
        'Star Shooter': 'Fire miniature stars that burn brighter than a thousand suns!',
        'Dragon Breath': 'Breathe fire like an ancient dragon protecting its treasure hoard!',
        'Phoenix Fire': 'Flames that rise from ashes to burn robots with immortal power!',
        'Ice Storm': 'Summon blizzards of frozen doom to bury your robot enemies!',
        'Thunder Strike': 'Call down mighty thunderbolts from the storm clouds above!',
        'Wind Blade': 'Sharp gusts of wind that slice through metal like invisible swords!',
        'Earth Shaker': 'Make the ground tremble and crack with earthquake-powered shots!',
        'Water Cannon': 'Tsunami-force water blasts that wash robots away like toy boats!',
        'Poison Dart': 'Sneaky jungle darts tipped with toxic venom that weakens robot systems!',
        'Acid Sprayer': 'Corrosive green acid that dissolves robot armor on contact!',
        'Venom Shot': 'Purple poison bolts that make robots sick with digital plague!',
        'Crystal Gun': 'Magical crystals that shatter into rainbow shards of destruction!',
        'Diamond Shooter': 'The hardest substance on Earth fired at incredible speed!',
        'Ruby Laser': 'Red gemstone power focused into a beam of royal destruction!',
        'Emerald Beam': 'Green gem energy that cuts through robots like jungle vines!',
        'Sapphire Blast': 'Blue crystal power that freezes and shatters robot dreams!',
        'Shadow Gun': 'Dark energy from the shadow realm that makes robots vanish!',
        'Light Ray': 'Pure brightness that blinds robots and fills heroes with courage!',
        'Time Warp': 'Bend time itself to age robots into rusty scrap metal!',
        'Space Ripper': 'Tear holes in space-time that transport robots to distant galaxies!',
        'Black Hole': 'Create mini black holes that suck robots into cosmic oblivion!',
        'Rainbow Beam': 'All the colors of the rainbow united in one spectacular blast!',
        'Unicorn Horn': 'Magical unicorn power that turns robots into harmless butterflies!',
        'Magic Wand': 'Wave this wand to cast spells that make robots disappear in sparkles!',
        'Wizard Staff': 'Ancient wizard magic that turns robots into cute forest animals!',
        'Fairy Dust': 'Sprinkle magical fairy dust to make robots fall asleep peacefully!',
        'Robot Zapper': 'Specially designed to short-circuit robot brains with electric zaps!',
        'Mech Buster': 'The ultimate anti-robot weapon that knows all their weaknesses!',
        'Cyber Shot': 'Digital bullets that hack into robot systems and scramble their code!',
        'Data Stream': 'Information overload that makes robot computers crash and reboot!',
        'Code Cannon': 'Fire programming commands that reprogram robots to be friendly!'
    };
    
    const baseDescription = baseDescriptions[weaponName] || 'A mysterious weapon of unknown power!';
    
    try {
        const weaponConfig = getWeaponConfig(weaponName);
        if (weaponConfig) {
            const damage = weaponConfig.damage;
            let damageText = `Damage: ${damage}`;
            
            if (weaponConfig.special === 'poison') {
                const poisonDamage = Math.floor(damage * 0.3);
                damageText += ` + ${poisonDamage} poison per second!`;
            } else if (weaponName === 'Freeze Gun') {
                damageText = 'Freezes robots for 10 seconds - no damage!';
            } else {
                damageText += ' damage!';
            }
            
            return `${baseDescription} ${damageText}`;
        }
    } catch (e) {
        console.log('Error getting weapon config for', weaponName, e);
    }
    
    return baseDescription;
}

// Switch to a specific weapon
function switchWeapon(weaponIndex) {
    if (weaponIndex >= 0 && weaponIndex < gameState.player.weapons.length) {
        const weaponName = gameState.player.weapons[weaponIndex];
        gameState.player.currentWeapon = weaponIndex;
        
        document.getElementById('currentWeapon').textContent = weaponName;
        document.getElementById('weaponDescription').textContent = getWeaponDescription(weaponName);
    }
}

// Drop weapon at specified position
function dropWeapon(scene, position) {
    const availableWeapons = ALL_WEAPONS.filter(weapon => 
        !gameState.player.weapons.includes(weapon)
    );
    
    if (availableWeapons.length === 0) return;
    
    const randomWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];

    // Cap simultaneous drops - drop the oldest if there are too many
    while (gameState.weaponDrops.length >= 6) {
        const old = gameState.weaponDrops.shift();
        if (typeof disposeWeaponModel === 'function') disposeWeaponModel(old);
        else if (old && old.dispose) old.dispose();
    }

    // Drop the actual gun model (built by viewmodel.js), floating and spinning
    let weaponDrop;
    if (typeof createWeaponModel === 'function') {
        weaponDrop = createWeaponModel(scene, randomWeapon, { renderingGroupId: 0 });
        weaponDrop.scaling.setAll(2.6);
    } else {
        weaponDrop = BABYLON.MeshBuilder.CreateBox("weaponDrop", { size: 1 }, scene);
        const wc = getWeaponConfig(randomWeapon);
        const mat = new BABYLON.StandardMaterial("weaponDropMaterial", scene);
        mat.diffuseColor = wc ? wc.color : new BABYLON.Color3(1, 1, 0);
        mat.emissiveColor = wc ? wc.color.scale(0.3) : new BABYLON.Color3(0.3, 0.3, 0);
        weaponDrop.material = mat;
    }
    weaponDrop.name = "weaponDrop";
    weaponDrop.position = position.clone();
    weaponDrop.position.y += 1.4;
    weaponDrop._baseY = weaponDrop.position.y;
    weaponDrop.weaponName = randomWeapon;
    weaponDrop.spawnedAt = Date.now();

    gameState.weaponDrops.push(weaponDrop);
    if (typeof prewarmWeaponIcon === 'function') prewarmWeaponIcon(randomWeapon);
}