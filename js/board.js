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

        // Clear container
        container.innerHTML = '';

        // Create grid (background cells)
        this.gridContainer = document.createElement('div');
        this.gridContainer.className = 'grid';

        // Append grid to container first so computed styles are available
        container.appendChild(this.gridContainer);

        // Read CSS variables for sizes (so responsive CSS controls layout)
        try {
            const rootStyles = getComputedStyle(document.documentElement);
            const cssCell = rootStyles.getPropertyValue('--cell-size').trim();
            const cssGap = rootStyles.getPropertyValue('--gap').trim();

            if (cssCell) {
                // cssCell like "92px" -> parseInt -> 92
                this.cellSize = parseInt(cssCell, 10) || this.cellSize;
            }
            if (cssGap) {
                this.gapSize = parseInt(cssGap, 10) || this.gapSize;
            }
        } catch (e) {
            // ignore and use defaults
        }

        // After grid is in DOM, compute its padding (boardPadding)
        const gridComputed = getComputedStyle(this.gridContainer);
        const padLeft = parseInt(gridComputed.paddingLeft, 10);
        this.boardPadding = Number.isFinite(padLeft) ? padLeft : this.boardPadding;

        // Create tiles container INSIDE the grid so absolute positioning is relative to grid
        this.tileContainer = document.createElement('div');
        this.tileContainer.className = 'tiles-container';
        this.gridContainer.appendChild(this.tileContainer);

        // Initialize cells and render background grid-cells
        this.cells = [];
        for (let row = 0; row < this.size; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.size; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // grid-template handles size, but set a fallback inline so measurements work
                cell.style.width = this.cellSize + 'px';
                cell.style.height = this.cellSize + 'px';

                this.gridContainer.appendChild(cell);
                this.cells[row][col] = null;
            }
        }

        // Reset logical board state
        this.reset();
    },

    reset() {
        // Remove DOM tile elements
        this.tiles.forEach(tile => {
            if (tile.element && tile.element.parentNode) {
                tile.element.parentNode.removeChild(tile.element);
            }
        });

        // Reset arrays
        this.cells = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.tiles = [];
    },

    addTile(value, row, col, isNew = true) {
        if (row < 0 || col < 0 || row >= this.size || col >= this.size) {
            console.warn('Неправильные координаты для плитки:', row, col);
            return null;
        }

        if (this.cells[row][col]) {
            console.warn('Ячейка уже занята, плитка не добавлена:', row, col);
            return null;
        }

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
            // CSS expects class "new" on .tile (selector .tile.new)
            tile.element.classList.add('new');
            // remove the new marker after animation
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

        // Size from computed CSS variables or JS value
        tile.style.width = this.cellSize + 'px';
        tile.style.height = this.cellSize + 'px';

        // Set initial position
        this.setTilePosition(tile, row, col, false);

        return tile;
    },

    setTilePosition(tileElement, row, col, animate = false) {
        // compute coordinates inside grid: col*(cell + gap) + padding
        const x = col * (this.cellSize + this.gapSize) + this.boardPadding;
        const y = row * (this.cellSize + this.gapSize) + this.boardPadding;

        if (animate) {
            // add moving class for smoother transitions
            tileElement.classList.add('tile-moving');

            // ensure left/top have numeric px values
            const currentLeft = parseInt(tileElement.style.left, 10);
            const currentTop = parseInt(tileElement.style.top, 10);

            // Set target coordinates after small timeout so CSS transition triggers
            setTimeout(() => {
                tileElement.style.left = `${x}px`;
                tileElement.style.top = `${y}px`;
            }, 10);

            // cleanup moving class after transition
            setTimeout(() => {
                tileElement.classList.remove('tile-moving');
            }, 160);
        } else {
            tileElement.style.left = `${x}px`;
            tileElement.style.top = `${y}px`;
        }

        tileElement.dataset.row = row;
        tileElement.dataset.col = col;
    },

    getRandomEmptyCell() {
        const emptyCells = [];

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (!this.cells[row][col]) {
                    emptyCells.push({ row, col });
                }
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
        if (tile.row === newRow && tile.col === newCol) {
            return false;
        }

        // clear current cell if it still references this tile
        if (this.cells[tile.row] && this.cells[tile.row][tile.col] === tile) {
            this.cells[tile.row][tile.col] = null;
        }

        // detect overwriting another tile incorrectly
        if (this.cells[newRow][newCol]) {
            console.warn('Новая ячейка уже занята:', newRow, newCol);
            return false;
        }

        // update logical grid
        this.cells[newRow][newCol] = tile;
        tile.row = newRow;
        tile.col = newCol;

        // animate DOM element
        this.setTilePosition(tile.element, newRow, newCol, true);
        return true;
    },

    mergeTiles(sourceTile, targetTile) {
        if (!sourceTile || !targetTile || sourceTile.wasMerged || targetTile.wasMerged) {
            return null;
        }

        if (sourceTile.value !== targetTile.value) {
            return null;
        }

        const newValue = sourceTile.value * 2;
        const newRow = targetTile.row;
        const newCol = targetTile.col;

        // remove both tiles logically and from DOM
        this.removeTile(sourceTile);
        this.removeTile(targetTile);

        // create merged tile at target position (not marked as new; we'll show merged visual)
        const mergedTile = this.addTile(newValue, newRow, newCol, false);
        if (!mergedTile) return null;

        mergedTile.wasMerged = true;

        // add temporary merged visual class
        mergedTile.element.classList.add('tile-merged');
        setTimeout(() => {
            if (mergedTile.element) mergedTile.element.classList.remove('tile-merged');
        }, 300);

        return mergedTile;
    },

    removeTile(tile) {
        if (!tile) return;

        const index = this.tiles.indexOf(tile);
        if (index === -1) {
            return;
        }

        // remove from tiles array
        this.tiles.splice(index, 1);

        // clear logical grid reference if present
        if (tile.row >= 0 && tile.col >= 0 &&
            tile.row < this.size && tile.col < this.size &&
            this.cells[tile.row] && this.cells[tile.row][tile.col] === tile) {
            this.cells[tile.row][tile.col] = null;
        }

        // remove DOM element
        if (tile.element && tile.element.parentNode) {
            tile.element.parentNode.removeChild(tile.element);
        }
    },

    canMoveTile(tile, direction) {
        if (!tile) return false;
        const { row, col } = tile;

        switch (direction) {
            case 'up':
                return row > 0 && !this.cells[row - 1][col];
            case 'down':
                return row < this.size - 1 && !this.cells[row + 1][col];
            case 'left':
                return col > 0 && !this.cells[row][col - 1];
            case 'right':
                return col < this.size - 1 && !this.cells[row][col + 1];
            default:
                return false;
        }
    },

    canMergeTile(tile, direction) {
        if (!tile) return false;
        const { row, col } = tile;
        let neighborTile = null;

        switch (direction) {
            case 'up':
                neighborTile = row > 0 ? this.cells[row - 1][col] : null;
                break;
            case 'down':
                neighborTile = row < this.size - 1 ? this.cells[row + 1][col] : null;
                break;
            case 'left':
                neighborTile = col > 0 ? this.cells[row][col - 1] : null;
                break;
            case 'right':
                neighborTile = col < this.size - 1 ? this.cells[row][col + 1] : null;
                break;
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
        // empty cell available
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (!this.cells[row][col]) {
                    return true;
                }
            }
        }

        // adjacent equal tiles
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const tile = this.cells[row][col];
                if (tile) {
                    if (col < this.size - 1 && this.cells[row][col + 1] &&
                        this.cells[row][col + 1].value === tile.value) {
                        return true;
                    }
                    if (row < this.size - 1 && this.cells[row + 1][col] &&
                        this.cells[row + 1][col].value === tile.value) {
                        return true;
                    }
                }
            }
        }

        return false;
    },
};
