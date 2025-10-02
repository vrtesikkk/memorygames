// --- Animated Background Bubbles ---
function createBackgroundBubbles() {
    const bg = document.querySelector('.background-bubbles');
    if (!bg) return;
    bg.innerHTML = '';
    const bubbleCount = 18;
    for (let i = 0; i < bubbleCount; i++) {
        const b = document.createElement('div');
        b.className = 'background-bubble';
        const size = Math.random() * 60 + 40;
        b.style.width = b.style.height = size + 'px';
        b.style.left = Math.random() * 100 + 'vw';
        b.style.bottom = '-' + (Math.random() * 40 + 20) + 'px';
        b.style.animationDuration = (14 + Math.random() * 10) + 's';
        b.style.opacity = (0.10 + Math.random() * 0.18).toFixed(2);
        bg.appendChild(b);
    }
}

// --- Dark/Light Mode Toggle ---
function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    function setTheme(mode) {
        if (mode === 'light') {
            document.body.classList.add('light-mode');
            btn.textContent = '☀️';
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            btn.textContent = '🌙';
            localStorage.setItem('theme', 'dark');
        }
    }
    btn.onclick = () => {
        setTheme(document.body.classList.contains('light-mode') ? 'dark' : 'light');
    };
    // On load
    setTheme(localStorage.getItem('theme') || 'dark');
}

// --- Game State ---
let gameState = {
    bestReactionScore: 0,
    totalGamesPlayed: 0
};

// --- Reaction Test mode ---
function setupReactionTest() {
    const area = document.getElementById('reaction-area');
    const startBtn = document.getElementById('reaction-start');
    const timeEl = document.getElementById('reaction-time');
    const scoreEl = document.getElementById('reaction-score-value');
    if (!area || !startBtn || !timeEl || !scoreEl) return;

    let running = false;
    let remainingMs = 60000; // 1 minute
    let tickTimer = null;
    let spawnTimer = null;
    let score = 0;

    function resetUI() {
        running = false;
        remainingMs = 60000;
        score = 0;
        timeEl.textContent = '01:00';
        scoreEl.textContent = '0';
        area.innerHTML = '';
        startBtn.disabled = false;
        startBtn.textContent = 'Start';
        if (tickTimer) clearInterval(tickTimer);
        if (spawnTimer) clearInterval(spawnTimer);
        tickTimer = null;
        spawnTimer = null;
        
        // Reset slider
        const sliderFill = document.getElementById('slider-fill');
        if (sliderFill) {
            sliderFill.style.width = '0%';
        }
    }

    function spawnBubble() {
        const spaceship = document.createElement('img');
        spaceship.src = 'img/spaceship.png';
        spaceship.style.position = 'absolute';
        spaceship.style.cursor = 'pointer';
        const size = Math.floor(Math.random() * 40) + 30; // 30-70px
        spaceship.style.width = size + 'px';
        spaceship.style.height = 'auto';
        const rect = area.getBoundingClientRect();
        const maxLeft = Math.max(0, rect.width - size);
        const maxTop = Math.max(0, rect.height - size);
        spaceship.style.left = Math.floor(Math.random() * maxLeft) + 'px';
        spaceship.style.top = Math.floor(Math.random() * maxTop) + 'px';
        spaceship.addEventListener('click', () => {
            score++;
            scoreEl.textContent = String(score);
            spaceship.remove();
        }, { once: true });
        // Auto-remove timing: 2s for first 30s, 1s for last 30s
        const elapsed = 60000 - remainingMs;
        const removeDelay = elapsed < 30000 ? 2000 : 1000;
        setTimeout(() => spaceship.remove(), removeDelay);
        area.appendChild(spaceship);
    }

    function updateSpawnInterval() {
        if (spawnTimer) clearInterval(spawnTimer);
        const elapsed = 60000 - remainingMs;
        const interval = elapsed < 30000 ? 2000 : 1000; // first 30s every 2s, last 30s every 1s
        spawnTimer = setInterval(() => {
            if (!running) return;
            spawnBubble();
        }, interval);
    }

    function format(ms) {
        const s = Math.max(0, Math.ceil(ms / 1000));
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return mm + ':' + ss;
    }

    function endGame() {
        clearInterval(tickTimer);
        clearInterval(spawnTimer);
        running = false;
        startBtn.disabled = false;
        startBtn.textContent = 'Play Again';
        
        // Update best score
        if (score > gameState.bestReactionScore) {
            gameState.bestReactionScore = score;
        }
        
        // Show results
        let feedback = '';
        if (score >= 30) {
            feedback = 'Super!';
        } else if (score >= 20) {
            feedback = 'Good!';
        } else {
            feedback = 'Try harder!';
        }
        
        area.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-primary);">
                <h3 style="color: var(--accent-success); margin-bottom: 16px;">Mission Complete!</h3>
                <p style="font-size: 1.2rem; margin-bottom: 8px;">Spaceships Destroyed: ${score}</p>
                <p style="font-size: 1.1rem; color: var(--accent-gold); margin-bottom: 16px;">${feedback}</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">Best Score: ${gameState.bestReactionScore}</p>
            </div>
        `;
        
        // Save progress
        gameState.totalGamesPlayed++;
        saveGameState();
    }

    function startGame() {
        if (running) return;
        running = true;
        remainingMs = 60000;
        score = 0;
        area.innerHTML = '';
        scoreEl.textContent = '0';
        startBtn.disabled = true;
        startBtn.textContent = 'Playing...';
        updateSpawnInterval();
        // spawn immediately so player has something to click
        spawnBubble();
        tickTimer = setInterval(() => {
            remainingMs -= 250; // smooth timer updates
            if (remainingMs <= 0) {
                timeEl.textContent = '00:00';
                endGame();
            } else {
                timeEl.textContent = format(remainingMs);
                // If we cross 30s boundary, refresh spawn rate
                const elapsed = 60000 - remainingMs;
                if (Math.abs(30000 - elapsed) < 200) updateSpawnInterval();
                
                // Update slider progress
                const progress = (elapsed / 60000) * 100;
                const sliderFill = document.getElementById('slider-fill');
                if (sliderFill) {
                    sliderFill.style.width = progress + '%';
                }
            }
        }, 250);
    }

    startBtn.addEventListener('click', startGame);
    resetUI();
}

// --- Save/Load game state ---
function saveGameState() {
    localStorage.setItem('reactionGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem('reactionGameState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        gameState = { ...gameState, ...parsedState };
    }
}

// --- Init ---
function init() {
    createBackgroundBubbles();
    setupThemeToggle();
    setupReactionTest();
    loadGameState();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});
