const fs = require('fs');
const PNG = require('pngjs').PNG;

const boyData = fs.readFileSync('boy_base.png');
const boyPng = PNG.sync.read(boyData);
const equipData = fs.readFileSync('1級.PNG');
const equipPng = PNG.sync.read(equipData);

const boyW = boyPng.width;
const equipW = equipPng.width;
const h = 300; // Only compare top 300 rows (head area)

let bestOffset = 0;
let minDiff = Infinity;

for (let offset = 0; offset <= boyW - equipW; offset++) {
    let diff = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < equipW; x++) {
            const bIdx = (boyW * y + (x + offset)) << 2;
            const eIdx = (equipW * y + x) << 2;
            
            // Compare alpha and colors
            const bA = boyPng.data[bIdx + 3];
            const eA = equipPng.data[eIdx + 3];
            
            // If both are transparent, no diff
            if (bA === 0 && eA === 0) continue;
            
            // If one is transparent and other is not, big diff
            if ((bA === 0 && eA > 0) || (bA > 0 && eA === 0)) {
                diff += 1000;
                continue;
            }
            
            // Both are non-transparent, compare colors
            const dr = boyPng.data[bIdx] - equipPng.data[eIdx];
            const dg = boyPng.data[bIdx+1] - equipPng.data[eIdx+1];
            const db = boyPng.data[bIdx+2] - equipPng.data[eIdx+2];
            diff += Math.abs(dr) + Math.abs(dg) + Math.abs(db);
        }
    }
    
    if (diff < minDiff) {
        minDiff = diff;
        bestOffset = offset;
    }
}

console.log(`Best offset: ${bestOffset} with difference score: ${minDiff}`);
