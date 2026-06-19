const fs = require('fs');
const PNG = require('pngjs').PNG;
const path = require('path');

const baseDir = __dirname;
const boyPath = path.join(baseDir, 'boy_base.png');
const equipPath = path.join(baseDir, '1級.PNG');

const boyPng = PNG.sync.read(fs.readFileSync(boyPath));
const equipPng = PNG.sync.read(fs.readFileSync(equipPath));

const boyW = boyPng.width;
const boyH = boyPng.height;
const equipW = equipPng.width;
const equipH = equipPng.height;

// User provided calibration data (8 points)
const scale = 0.6811;
const offsetX = -188;
const offsetY = -6;

const eqPts = [
    { x: 734, y: 162 }, // 0: Left Eye
    { x: 781, y: 162 }, // 1: Right Eye
    { x: 671, y: 401 }, // 2: Left Elbow
    { x: 894, y: 392 }, // 3: Right Elbow
    { x: 627, y: 540 }, // 4: Left Hand (Weapon)
    { x: 940, y: 527 }, // 5: Right Hand (Shield)
    { x: 683, y: 916 }, // 6: Left Foot
    { x: 896, y: 924 }  // 7: Right Foot
];

// Threshold for color difference
const TOLERANCE = 50; 

// 2. Dynamic part segmentation based on the 8 points
const neckY = Math.max(eqPts[0].y, eqPts[1].y) + 100;
const waistY = Math.min(eqPts[4].y, eqPts[5].y) - 20; 
const leftElbowX = eqPts[2].x;
const rightElbowX = eqPts[3].x;

console.log(`Dynamic Boundaries: NeckY=${neckY}, WaistY=${waistY}, LeftBound=${leftElbowX}, RightBound=${rightElbowX}`);

const parts = [
    { name: 'helmet', test: (x, y) => y <= neckY && x >= leftElbowX - 50 && x <= rightElbowX + 50 },
    { name: 'weapon', test: (x, y) => x < leftElbowX + 15 && y > neckY },
    { name: 'shield', test: (x, y) => x > rightElbowX - 15 && y > neckY },
    { name: 'pants',  test: (x, y) => y > waistY && x >= leftElbowX && x <= rightElbowX },
    { name: 'armor',  test: (x, y) => true }
];

const partData = {};
for (const p of parts) {
    partData[p.name] = { minX: equipW, maxX: 0, minY: equipH, maxY: 0, pixels: [] };
}

// Map each equipment pixel to the base image and compare
for (let y = 0; y < equipH; y++) {
    for (let x = 0; x < equipW; x++) {
        const eIdx = (equipW * y + x) << 2;
        const eA = equipPng.data[eIdx + 3];
        
        if (eA > 0) {
            const baseX = Math.round((x - offsetX) / scale);
            const baseY = Math.round((y - offsetY) / scale);
            
            let isEquipment = true;
            
            if (baseX >= 0 && baseX < boyW && baseY >= 0 && baseY < boyH) {
                const bIdx = (boyW * baseY + baseX) << 2;
                const bR = boyPng.data[bIdx];
                const bG = boyPng.data[bIdx+1];
                const bB = boyPng.data[bIdx+2];
                const bA = boyPng.data[bIdx+3];
                
                const eR = equipPng.data[eIdx];
                const eG = equipPng.data[eIdx+1];
                const eB = equipPng.data[eIdx+2];
                
                if (bA > 0) {
                    const diff = Math.abs(bR - eR) + Math.abs(bG - eG) + Math.abs(bB - eB);
                    if (diff <= TOLERANCE) {
                        isEquipment = false;
                    }
                }
            }
            
            if (isEquipment) {
                for (const p of parts) {
                    if (p.test(x, y)) {
                        const data = partData[p.name];
                        data.pixels.push({ x, y, r: equipPng.data[eIdx], g: equipPng.data[eIdx+1], b: equipPng.data[eIdx+2], a: eA });
                        if (x < data.minX) data.minX = x;
                        if (x > data.maxX) data.maxX = x;
                        if (y < data.minY) data.minY = y;
                        if (y > data.maxY) data.maxY = y;
                        break;
                    }
                }
            }
        }
    }
}

// 4. Save tightly cropped PNGs and generate config
const config = {
    boy: {
        base: { x: 0, y: 0, w: equipW, h: equipH },
        level1: {}
    }
};

const assetsDir = path.join(baseDir, 'assets', 'boy');

for (const p of parts) {
    const data = partData[p.name];
    if (data.pixels.length === 0) continue;
    
    const w = data.maxX - data.minX + 1;
    const h = data.maxY - data.minY + 1;
    
    const outPng = new PNG({ width: w, height: h });
    for (let i = 0; i < outPng.data.length; i++) {
        outPng.data[i] = 0;
    }
    
    for (const pix of data.pixels) {
        const outX = pix.x - data.minX;
        const outY = pix.y - data.minY;
        const idx = (w * outY + outX) << 2;
        outPng.data[idx] = pix.r;
        outPng.data[idx+1] = pix.g;
        outPng.data[idx+2] = pix.b;
        outPng.data[idx+3] = pix.a;
    }
    
    const dir = path.join(assetsDir, p.name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'level1.png'), PNG.sync.write(outPng));
    console.log(`Saved tightly cropped ${p.name}/level1.png (${w}x${h})`);
    
    config.boy.level1[p.name] = { x: data.minX, y: data.minY, w, h };
}

// 5. Generate scaled and aligned base image
const basePng = new PNG({ width: equipW, height: equipH });
for (let y = 0; y < equipH; y++) {
    for (let x = 0; x < equipW; x++) {
        const outIdx = (equipW * y + x) << 2;
        const baseX = Math.round((x - offsetX) / scale);
        const baseY = Math.round((y - offsetY) / scale);
        
        if (baseX >= 0 && baseX < boyW && baseY >= 0 && baseY < boyH) {
            const inIdx = (boyW * baseY + baseX) << 2;
            basePng.data[outIdx] = boyPng.data[inIdx];
            basePng.data[outIdx+1] = boyPng.data[inIdx+1];
            basePng.data[outIdx+2] = boyPng.data[inIdx+2];
            basePng.data[outIdx+3] = boyPng.data[inIdx+3];
        } else {
            basePng.data[outIdx+3] = 0;
        }
    }
}
fs.writeFileSync(path.join(assetsDir, 'base.png'), PNG.sync.write(basePng));
console.log('Saved properly scaled and aligned base.png');

const configContent = `const APP_CONFIG = ${JSON.stringify(config, null, 2)};`;
fs.writeFileSync(path.join(baseDir, 'config.js'), configContent);
console.log('Saved config.js');
