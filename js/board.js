window.Board = {
    size: 4,
    cells: [],
    tiles: [],
    tileContainer: null,
    gridContainer: null,
    cellSize: 100,
    gapSize: 15,
    boardPadding: 15,

    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        while (container.firstChild) container.removeChild(container.firstChild);

        this.gridContainer = document.createElement('div');
        this.gridContainer.className = 'grid';
        container.appendChild(this.gridContainer);

        try {
            const rootStyles = getComputedStyle(document.documentElement);
            const cssCell = rootStyles.getPropertyValue('--cell-size').trim();
            const cssGap = rootStyles.getPropertyValue('--gap').trim();

            if (cssCell) this.cellSize = parseInt(cssCell, 10) || this.cellSize;
            if (cssGap) this.gapSize = parseInt(cssGap, 10) || this.gapSize;
        } catch (e) {}

        const gridComputed = getComputedStyle(this.gridContainer);
        const padLeft = parseInt(gridComputed.paddingLeft, 10);
        this.boardPadding = Number.isFinite(padLeft) ? padLeft : this.boardPadding;

        this.tileContainer = document.createElement('div');
        this.tileContainer.className = 'tiles-container';
        this.gridContainer.appendChild(this.tileContainer);

        this.cells = [];
        for (let row = 0; row < this.size; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.style.width = this.cellSize + 'px';
                cell.style.height = this.cellSize + 'px';
                this.gridContainer.appendChild(cell);
                this.cells[row][col] = null;
            }
        }

        this.reset();
    },

    reset() {
        this.tiles.forEach(tile => {
            if (tile.element && tile.element.parentNode) {
                tile.element.parentNode.removeChild(tile.element);
            }
        });
        this.cells = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.tiles = [];
    },

    addTile(value, row, col, isNew = true) {
        if (row < 0 || col < 0 || row >= this.size || col >= this.size) return null;
        if (this.cells[row][col]) return null;

        const element = this.createTileElement(value, row, col);

        const tile = {
            value: value,
            row: row,
            col: col,
            element: element,
            mergedFrom: null,
            id: Date.now() + Math.random(),
            wasMerged: false,
            isNew: isNew
        };

        this.tiles.push(tile);
        this.cells[row][col] = tile;
        this.tileContainer.appendChild(tile.element);

        if (isNew) {
            tile.element.classList.add('new');
            setTimeout(() => {
                if (tile.element) tile.element.classList.remove('new');
            }, 360);
        }

        return tile;
    },

    createTileElement(value, row, col) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        if (value > 2048) tile.classList.add('tile-super');

        tile.textContent = value;
        tile.dataset.value = value;
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.dataset.id = Date.now() + Math.random();

        tile.style.width = this.cellSize + 'px';
        tile.style.height = this.cellSize + 'px';

        const x = col * (this.cellSize + this.gapSize) + this.boardPadding;
        const y = row * (this.cellSize + this.gapSize) + this.boardPadding;
        tile.style.transform = `translate(${x}px, ${y}px)`;
        tile._currentPos = { x, y };
        return tile;
    },

    setTilePosition(tileElement, row, col, animate = false) {
        const x = col * (this.cellSize + this.gapSize) + this.boardPadding;
        const y = row * (this.cellSize + this.gapSize) + this.boardPadding;

        if (!tileElement._currentPos) {
            tileElement._currentPos = { x, y };
            tileElement.style.transition = 'none';
            tileElement.style.transform = `translate(${x}px, ${y}px)`;
            setTimeout(() => {
                tileElement.style.transition = '';
            }, 0);
        } else if (animate) {
            tileElement.style.transition = 'transform 180ms cubic-bezier(.2,.9,.3,1)';
            tileElement.style.transform = `translate(${x}px, ${y}px)`;
            tileElement._currentPos = { x, y };
            const clear = () => {
                tileElement.style.transition = '';
                tileElement.removeEventListener('transitionend', clear);
            };
            tileElement.addEventListener('transitionend', clear);
        } else {
            tileElement.style.transition = 'none';
            tileElement.style.transform = `translate(${x}px, ${y}px)`;
            tileElement._currentPos = { x, y };
            setTimeout(() => {
                tileElement.style.transition = '';
            }, 0);
        }

        tileElement.dataset.row = row;
        tileElement.dataset.col = col;
    },

    getRandomEmptyCell() {
        const emptyCells = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (!this.cells[row][col]) emptyCells.push({ row, col });
            }
        }
        return emptyCells.length > 0 ?
            emptyCells[Math.floor(Math.random() * emptyCells.length)] :
            null;
    },

    addRandomTile() {
        const emptyCell = this.getRandomEmptyCell();
        if (!emptyCell) return null;
        const value = Math.random() < 0.9 ? 2 : 4;
        return this.addTile(value, emptyCell.row, emptyCell.col, true);
    },

    prepareForMove() {
        this.tiles.forEach(tile => {
            tile.wasMerged = false;
            tile.previousPosition = { row: tile.row, col: tile.col };
        });
    },

    moveTile(tile, newRow, newCol) {
        if (!tile) return false;
        if (tile.row === newRow && tile.col === newCol) return false;

        if (this.cells[tile.row] && this.cells[tile.row][tile.col] === tile) {
            this.cells[tile.row][tile.col] = null;
        }

        if (this.cells[newRow][newCol]) return false;

        this.cells[newRow][newCol] = tile;
        tile.row = newRow;
        tile.col = newCol;

        this.setTilePosition(tile.element, newRow, newCol, true);
        return true;
    },

    mergeTiles(sourceTile, targetTile) {
        if (!sourceTile || !targetTile || sourceTile.wasMerged || targetTile.wasMerged) return null;
        if (sourceTile.value !== targetTile.value) return null;

        const newValue = sourceTile.value * 2;
        const newRow = targetTile.row;
        const newCol = targetTile.col;

        this.removeTile(sourceTile);
        this.removeTile(targetTile);

        const mergedTile = this.addTile(newValue, newRow, newCol, false);
        if (!mergedTile) return null;

        // Сразу ставим на правильное место без анимации
        this.setTilePosition(mergedTile.element, newRow, newCol, false);

        mergedTile.wasMerged = true;

        return mergedTile;
    },

    removeTile(tile) {
        if (!tile) return;
        const index = this.tiles.indexOf(tile);
        if (index === -1) return;

        this.tiles.splice(index, 1);
        if (tile.row >= 0 && tile.col >= 0 &&
            tile.row < this.size && tile.col < this.size &&
            this.cells[tile.row] && this.cells[tile.row][tile.col] === tile) {
            this.cells[tile.row][tile.col] = null;
        }
        if (tile.element && tile.element.parentNode) {
            tile.element.parentNode.removeChild(tile.element);
        }
    },

    canMoveTile(tile, direction) {
        if (!tile) return false;
        const { row, col } = tile;

        switch (direction) {
            case 'up': return row > 0 && !this.cells[row - 1][col];
            case 'down': return row < this.size - 1 && !this.cells[row + 1][col];
            case 'left': return col > 0 && !this.cells[row][col - 1];
            case 'right': return col < this.size - 1 && !this.cells[row][col + 1];
            default: return false;
        }
    },

    canMergeTile(tile, direction) {
        if (!tile) return false;
        const { row, col } = tile;
        let neighborTile = null;

        switch (direction) {
            case 'up': neighborTile = row > 0 ? this.cells[row - 1][col] : null; break;
            case 'down': neighborTile = row < this.size - 1 ? this.cells[row + 1][col] : null; break;
            case 'left': neighborTile = col > 0 ? this.cells[row][col - 1] : null; break;
            case 'right': neighborTile = col < this.size - 1 ? this.cells[row][col + 1] : null; break;
        }

        return neighborTile && neighborTile.value === tile.value && !neighborTile.wasMerged;
    },

    getBoardState() {
        const state = [];
        for (let row = 0; row < this.size; row++) {
            state[row] = [];
            for (let col = 0; col < this.size; col++) {
                state[row][col] = this.cells[row][col] ? this.cells[row][col].value : 0;
            }
        }
        return state;
    },

    restoreBoardState(state) {
        this.reset();
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (state[row][col] > 0) {
                    this.addTile(state[row][col], row, col, false);
                }
            }
        }
    },

    hasMoves() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (!this.cells[row][col]) return true;
            }
        }

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const tile = this.cells[row][col];
                if (tile) {
                    if (col < this.size - 1 && this.cells[row][col + 1] &&
                        this.cells[row][col + 1].value === tile.value) return true;
                    if (row < this.size - 1 && this.cells[row + 1][col] &&
                        this.cells[row + 1][col].value === tile.value) return true;
                }
            }
        }

        return false;
    }
};
