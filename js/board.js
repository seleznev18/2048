window.Board = {
    dimension: 4,
    matrix: [],
    blocks: [],
    layerBlocks: null,
    layerCells: null,

    tileW: 100,
    tileGap: 15,
    padding: 15,

    init(rootId) {
        const root = document.getElementById(rootId);
        if (!root) return;
        root.innerHTML = "";

        this.layerCells = document.createElement("section");
        this.layerCells.className = "pf-grid";

        this.layerBlocks = document.createElement("section");
        this.layerBlocks.className = "pf-blocks";

        this.matrix = [];

        for (let r = 0; r < this.dimension; r++) {
            this.matrix[r] = [];
            for (let c = 0; c < this.dimension; c++) {
                const cell = document.createElement("div");
                cell.className = "pf-cell";
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.style.width = this.tileW + "px";
                cell.style.height = this.tileW + "px";

                this.layerCells.appendChild(cell);
                this.matrix[r][c] = null;
            }
        }

        root.appendChild(this.layerCells);
        root.appendChild(this.layerBlocks);

        this.resetBoard();
        this.addRandom();
        this.addRandom();
    },

    resetBoard() {
        this.blocks.forEach(b => b.el?.remove());
        this.matrix = Array(this.dimension)
            .fill(null)
            .map(() => Array(this.dimension).fill(null));
        this.blocks = [];
    },

    spawnBlock(value, r, c, animate = true) {
        if (this.matrix[r][c]) return null;

        const block = {
            id: crypto.randomUUID(),
            v: value,
            r,
            c,
            merged: false,
            el: this._makeBlock(value, r, c)
        };

        this.matrix[r][c] = block;
        this.blocks.push(block);
        this.layerBlocks.appendChild(block.el);

        if (animate) {
            block.el.classList.add("pf-new");
            setTimeout(() => block.el.classList.remove("pf-new"), 220);
        }

        return block;
    },

    _makeBlock(v, r, c) {
        const el = document.createElement("div");
        el.className = `pf-tile pf-v-${v}`;
        if (v > 2048) el.classList.add("pf-big");

        el.textContent = v;
        el.dataset.v = v;
        el.dataset.r = r;
        el.dataset.c = c;

        el.style.width = this.tileW + "px";
        el.style.height = this.tileW + "px";

        this._position(el, r, c, false);

        return el;
    },

    _position(el, r, c, animate) {
        const left = c * (this.tileW + this.tileGap) + this.padding;
        const top = r * (this.tileW + this.tileGap) + this.padding;

        if (animate) {
            const prevX = parseInt(el.style.left) || left;
            const prevY = parseInt(el.style.top) || top;

            el.style.setProperty("--sx", prevX + "px");
            el.style.setProperty("--sy", prevY + "px");
            el.style.setProperty("--ex", left + "px");
            el.style.setProperty("--ey", top + "px");

            el.classList.add("pf-move");
            setTimeout(() => {
                el.classList.remove("pf-move");
                el.style.left = left + "px";
                el.style.top = top + "px";
            }, 150);
        } else {
            el.style.left = left + "px";
            el.style.top = top + "px";
        }

        el.dataset.r = r;
        el.dataset.c = c;
    },

    randomFree() {
        const empty = [];
        for (let r = 0; r < this.dimension; r++) {
            for (let c = 0; c < this.dimension; c++) {
                if (!this.matrix[r][c]) empty.push({ r, c });
            }
        }
        return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
    },

    addRandom() {
        const spot = this.randomFree();
        if (!spot) return null;
        const val = Math.random() < 0.9 ? 2 : 4;
        return this.spawnBlock(val, spot.r, spot.c, true);
    },

    prepMove() {
        this.blocks.forEach(b => {
            b.merged = false;
            b.prev = { r: b.r, c: b.c };
        });
    },

    shiftBlock(block, nr, nc) {
        if (block.r === nr && block.c === nc) return false;

        if (this.matrix[block.r][block.c] === block)
            this.matrix[block.r][block.c] = null;

        if (this.matrix[nr][nc]) return false;

        this.matrix[nr][nc] = block;
        block.r = nr;
        block.c = nc;

        this._position(block.el, nr, nc, true);
        return true;
    },
    combine(a, b) {
        if (!a || !b || a.merged || b.merged || a.v !== b.v) return null;

        const nextVal = a.v * 2;
        const r = b.r;
        const c = b.c;

        this.removeBlock(a);
        this.removeBlock(b);

        const merged = this.spawnBlock(nextVal, r, c, false);
        merged.merged = true;

        merged.el.classList.add("pf-merge");
        setTimeout(() => merged.el.classList.remove("pf-merge"), 300);

        return merged;
    },

    removeBlock(block) {
        const idx = this.blocks.indexOf(block);
        if (idx >= 0) this.blocks.splice(idx, 1);

        if (this.matrix[block.r] && this.matrix[block.r][block.c] === block) {
            this.matrix[block.r][block.c] = null;
        }

        if (block.el && block.el.parentNode) block.el.remove();
    },

    canShift(block, dir) {
        const { r, c } = block;
        switch (dir) {
            case "up": return r > 0 && !this.matrix[r - 1][c];
            case "down": return r < this.dimension - 1 && !this.matrix[r + 1][c];
            case "left": return c > 0 && !this.matrix[r][c - 1];
            case "right": return c < this.dimension - 1 && !this.matrix[r][c + 1];
        }
        return false;
    },

    canCombine(block, dir) {
        const { r, c } = block;
        let target = null;

        switch (dir) {
            case "up": target = r > 0 ? this.matrix[r - 1][c] : null; break;
            case "down": target = r < this.dimension - 1 ? this.matrix[r + 1][c] : null; break;
            case "left": target = c > 0 ? this.matrix[r][c - 1] : null; break;
            case "right": target = c < this.dimension - 1 ? this.matrix[r][c + 1] : null; break;
        }

        return target && target.v === block.v && !target.merged;
    },

    snapshot() {
        return this.matrix.map(row => row.map(cell => cell ? cell.v : 0));
    },

    restore(state) {
        this.resetBoard();
        for (let r = 0; r < this.dimension; r++) {
            for (let c = 0; c < this.dimension; c++) {
                if (state[r][c] > 0) this.spawnBlock(state[r][c], r, c, false);
            }
        }
    },

    hasMoves() {
        for (let r = 0; r < this.dimension; r++) {
            for (let c = 0; c < this.dimension; c++) {
                if (!this.matrix[r][c]) return true;
                const block = this.matrix[r][c];
                if (c < this.dimension - 1 && this.matrix[r][c + 1]?.v === block.v) return true;
                if (r < this.dimension - 1 && this.matrix[r + 1][c]?.v === block.v) return true;
            }
        }
        return false;
    }
};
