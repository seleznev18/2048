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
        

        container.innerHTML = '';
        

        this.gridContainer = document.createElement('div');
        this.gridContainer.className = 'grid';
        

        this.tileContainer = document.createElement('div');
        this.tileContainer.className = 'tiles-container';
        

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
        
        container.appendChild(this.gridContainer);
        container.appendChild(this.tileContainer);
        
 
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

        if (this.cells[row][col]) {
            console.warn('Ячейка уже занята, плитка не добавлена:', row, col);
            return null;
        }
        
        const tile = {
            value: value,
            row: row,
            col: col,
            element: this.createTileElement(value, row, col),
            mergedFrom: null,
            id: Date.now() + Math.random(),
            wasMerged: false, 
            isNew: isNew
        };
        
        this.tiles.push(tile);
        this.cells[row][col] = tile;
        this.tileContainer.appendChild(tile.element);
        
        if (isNew) {
            tile.element.classList.add('tile-new');
            setTimeout(() => {
                tile.element.classList.remove('tile-new');
            }, 200);
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
        
        this.setTilePosition(tile, row, col);
        
        return tile;
    },


    setTilePosition(tileElement, row, col, animate = false) {

        const x = col * (this.cellSize + this.gapSize) + this.boardPadding;
        const y = row * (this.cellSize + this.gapSize) + this.boardPadding;
        
        if (animate) {

            const currentX = parseInt(tileElement.style.left) || x;
            const currentY = parseInt(tileElement.style.top) || y;
            
            tileElement.style.setProperty('--start-x', `${currentX}px`);
            tileElement.style.setProperty('--start-y', `${currentY}px`);
            tileElement.style.setProperty('--end-x', `${x}px`);
            tileElement.style.setProperty('--end-y', `${y}px`);
            
            tileElement.classList.add('tile-moving');
            
            setTimeout(() => {
                tileElement.classList.remove('tile-moving');
                tileElement.style.left = `${x}px`;
                tileElement.style.top = `${y}px`;
            }, 150);
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
        if (tile.row === newRow && tile.col === newCol) {
            return false;
        }
        
        if (this.cells[tile.row][tile.col] === tile) {
            this.cells[tile.row][tile.col] = null;
        }
        
        if (this.cells[newRow][newCol]) {
            console.warn('Новая ячейка уже занята:', newRow, newCol);
            return false;
        }
        
        this.cells[newRow][newCol] = tile;
        tile.row = newRow;
        tile.col = newCol;
        
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
        
    
        this.removeTile(sourceTile);
        this.removeTile(targetTile);
        
   
        const mergedTile = this.addTile(newValue, newRow, newCol, false);
        
 
        mergedTile.wasMerged = true;
        
 
        mergedTile.element.classList.add('tile-merged');
        setTimeout(() => {
            if (mergedTile.element) {
                mergedTile.element.classList.remove('tile-merged');
            }
        }, 300);
        
        return mergedTile;
    },


    removeTile(tile) {

        const index = this.tiles.indexOf(tile);
        if (index === -1) {
            return;
        }
        

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
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (!this.cells[row][col]) {
                    return true;
                }
            }
        }
        

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
