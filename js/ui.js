window.UI = {
    init() {
        this.attachHandlers();
        this.refreshLeaderboard();
        this.toggleMobileControls(false);
    },

    attachHandlers() {
        document.getElementById('new-game-btn')?.addEventListener('click', () => this.startNewGame());
        document.getElementById('undo-btn')?.addEventListener('click', () => {
            const undone = Game.undo();
            this.displayNotice(undone ? 'Ход отменен' : 'Невозможно отменить ход', undone ? 'info' : 'error');
        });

        const leadersBtn = document.getElementById('leaders-btn');
        const leadersModal = document.getElementById('leaders-modal');
        const closeLeadersBtn = document.getElementById('close-leaders-btn');

        leadersBtn?.addEventListener('click', () => {
            this.refreshLeaderboard();
            leadersModal.style.display = 'flex';
            this.toggleMobileControls(false);
        });

        closeLeadersBtn?.addEventListener('click', () => {
            leadersModal.style.display = 'none';
            this.toggleMobileControls(true);
        });

        leadersModal?.addEventListener('click', e => {
            if (e.target === leadersModal) {
                leadersModal.style.display = 'none';
                this.toggleMobileControls(true);
            }
        });

        document.getElementById('save-score-btn')?.addEventListener('click', () => this.saveCurrentScore());
        document.getElementById('restart-btn')?.addEventListener('click', () => this.startNewGame());

        document.getElementById('clear-leaders-btn')?.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите очистить таблицу лидеров?')) {
                Storage.clearLeaders();
                this.refreshLeaderboard();
                this.displayNotice('Таблица лидеров очищена', 'info');
            }
        });

        ['up','down','left','right'].forEach(dir => {
            document.getElementById(`${dir}-btn`)?.addEventListener('click', () => this.handleMove(dir));
        });

        document.addEventListener('keydown', e => {
            if (e.target.tagName.toLowerCase() === 'input') return;
            const keys = {ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right'};
            if (keys[e.key]) { e.preventDefault(); this.handleMove(keys[e.key]); }

            if ((e.key==='r'||e.key==='R') && e.ctrlKey) { e.preventDefault(); this.startNewGame(); }
            if ((e.key==='z'||e.key==='Z') && e.ctrlKey) { 
                e.preventDefault(); 
                this.displayNotice(Game.undo() ? 'Ход отменен' : 'Невозможно отменить ход', Game.undo() ? 'info':'error'); 
            }

            if ((e.key==='d'||e.key==='D') && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                console.log('=== DEBUG INFO ===');
                console.log('Score:', Game.score, 'Best:', Game.bestScore, 'Over:', Game.isGameOver, 'Won:', Game.isGameWon);
                if(Playfield.debugState) Playfield.debugState();
            }
        });

        this.initTouchControls();
    },

    startNewGame() {
        Game.newGame();
        ['save-score-form','save-success','player-name'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (id === 'player-name') el.value = '';
            else el.style.display = (id === 'save-score-form') ? 'flex' : 'none';
        });
    },

    handleMove(direction) {
        const res = Game.move(direction);
        if (res.moved && res.scoreAdded > 0) this.displayNotice(`+${res.scoreAdded}`, 'score');
        else if (!Game.isGameOver) this.displayNotice('Невозможно переместить в этом направлении', 'info');
    },

    saveCurrentScore() {
        const input = document.getElementById('player-name');
        if (!input) return;
        const name = input.value.trim();
        if (!name) { this.displayNotice('Введите имя', 'error'); input.focus(); return; }

        const score = Game.getScore();
        if (Storage.saveScore(name, score)) {
            document.getElementById('save-score-form').style.display = 'none';
            document.getElementById('save-success').style.display = 'block';
            this.refreshLeaderboard();
            this.displayNotice('Рекорд сохранен!', 'success');
        } else this.displayNotice('Ошибка при сохранении рекорда', 'error');
    },

    initTouchControls() {
        const board = document.getElementById('game-board');
        if (!board) return;
        let sx, sy;
        board.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; e.preventDefault(); }, { passive:false });
        board.addEventListener('touchmove', e => e.preventDefault(), { passive:false });
        board.addEventListener('touchend', e => {
            const ex = e.changedTouches[0].clientX;
            const ey = e.changedTouches[0].clientY;
            this.detectSwipe(sx, sy, ex, ey);
            e.preventDefault();
        }, { passive:false });
    },

    detectSwipe(sx, sy, ex, ey) {
        const dx = ex - sx, dy = ey - sy, min = 30;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > min) this.handleMove(dx > 0 ? 'right' : 'left');
        else if (Math.abs(dy) > min) this.handleMove(dy > 0 ? 'down' : 'up');
    },

    refreshLeaderboard() {
        const leaders = Storage.getLeaders();
        const tbody = document.getElementById('leaders-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (leaders.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.textContent = 'Таблица лидеров пуста';
            td.style.cssText = 'text-align:center;padding:20px;color:#777;font-style:italic;';
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            leaders.forEach((l, i) => {
                const tr = document.createElement('tr');
                tr.style.transition = 'background 0.3s';
                tr.style.cursor = 'default';

                const place = document.createElement('td'); place.textContent = i+1;
                const name = document.createElement('td'); name.textContent = l.name;
                const score = document.createElement('td'); score.textContent = l.score;
                const date = document.createElement('td'); date.textContent = l.date;

                [place,name,score,date].forEach(td => td.style.padding='8px 12px');
                tr.append(place,name,score,date);
                tbody.appendChild(tr);
            });
        }
    },

    displayNotice(msg, type='info') {
        const el = document.createElement('div');
        el.textContent = msg;
        el.style.cssText = `
            position:fixed; top:20px; left:50%; transform:translateX(-50%);
            padding:12px 24px; border-radius:10px; font-weight:600;
            z-index:10000; color:white; opacity:1; transition: all 0.4s ease; pointer-events:none;
        `;
        const colors = {success:'#4CAF50', error:'#f44336', info:'#2196F3', score:'#FF9800'};
        el.style.backgroundColor = colors[type] || '#2196F3';
        if(type==='score'){ el.style.fontSize='26px'; el.style.padding='16px 32px'; }

        document.body.appendChild(el);
        setTimeout(()=>{
            el.style.opacity='0';
            el.style.transform+=' translateY(-20px)';
            setTimeout(()=>el.remove(),400);
        }, type==='score'?1000:2000);
    },

    toggleMobileControls(show) {
        const ctrl = document.querySelector('.mobile-controls');
        if (!ctrl) return;
        ctrl.style.display = (show && window.innerWidth <= 600) ? 'flex' : 'none';
    }
};
