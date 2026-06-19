const initApp = () => {
    const parts = ['weapon', 'helmet', 'armor', 'pants', 'shield'];
    
    // Use window.APP_CONFIG which is now globally set in config.js
    const config = window.APP_CONFIG ? window.APP_CONFIG.boy : null;
    
    const updateLayer = (part, level) => {
        const imgElement = document.getElementById(`layer-${part}`);
        if (!imgElement) return;

        if (level && config && config[level] && config[level][part]) {
            const data = config[level][part];
            const baseW = config.base.w;
            const baseH = config.base.h;
            
            // Set the absolute positioning based on percentages relative to the container
            imgElement.style.left = (data.x / baseW * 100) + '%';
            imgElement.style.top = (data.y / baseH * 100) + '%';
            imgElement.style.width = (data.w / baseW * 100) + '%';
            imgElement.style.height = (data.h / baseH * 100) + '%';
            
            const baseURL = window.APP_CONFIG.baseURL || "./";
            imgElement.src = `${baseURL}assets/boy/${part}/${level}.png`;
            imgElement.style.opacity = '1';
        } else {
            imgElement.src = '';
            imgElement.style.opacity = '0';
        }
    };

    parts.forEach(part => {
        const select = document.getElementById(`select-${part}`);
        if (select) {
            select.addEventListener('change', (e) => {
                updateLayer(part, e.target.value);
            });
        }
    });

    const equipAllBtn = document.getElementById('equip-all-btn');
    if (equipAllBtn) {
        equipAllBtn.addEventListener('click', () => {
            parts.forEach(part => {
                const select = document.getElementById(`select-${part}`);
                if (select) select.value = 'level1';
                updateLayer(part, 'level1');
            });
        });
    }

    const unequipAllBtn = document.getElementById('unequip-all-btn');
    if (unequipAllBtn) {
        unequipAllBtn.addEventListener('click', () => {
            parts.forEach(part => {
                const select = document.getElementById(`select-${part}`);
                if (select) select.value = '';
                updateLayer(part, '');
            });
        });
    }

    // --- Adjustment Panel Logic ---
    const adjPart = document.getElementById('adj-part');
    const adjLevel = document.getElementById('adj-level');
    const adjX = document.getElementById('adj-x');
    const adjY = document.getElementById('adj-y');

    const loadAdjValues = () => {
        const p = adjPart.value;
        const l = adjLevel.value;
        if (config && config[l] && config[l][p]) {
            adjX.value = config[l][p].x;
            adjY.value = config[l][p].y;
        } else {
            adjX.value = '';
            adjY.value = '';
        }
    };

    if (adjPart && adjLevel && adjX && adjY) {
        adjPart.addEventListener('change', loadAdjValues);
        adjLevel.addEventListener('change', loadAdjValues);
        
        const updateOffset = () => {
            const p = adjPart.value;
            const l = adjLevel.value;
            if (config && config[l] && config[l][p]) {
                config[l][p].x = parseInt(adjX.value) || 0;
                config[l][p].y = parseInt(adjY.value) || 0;
                
                // If the adjusted part is currently equipped, update the view
                const currentSelect = document.getElementById(`select-${p}`);
                if (currentSelect && currentSelect.value === l) {
                    updateLayer(p, l);
                }
            }
        };

        adjX.addEventListener('input', updateOffset);
        adjY.addEventListener('input', updateOffset);

        // Init load
        loadAdjValues();
    }

    const copyBtn = document.getElementById('copy-config-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const output = `window.APP_CONFIG = ${JSON.stringify(window.APP_CONFIG, null, 2)};`;
            navigator.clipboard.writeText(output).then(() => {
                alert('已經成功複製新的 Config 內容！請將它貼上並覆蓋 config.js');
            }).catch(err => {
                alert('複製失敗，請手動複製 console 中的輸出。');
                console.log(output);
            });
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
