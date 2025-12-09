window.Game = {
    score: 0,
    bestScore: 0,
    frozen: false,
    achieved2048: false,
    history: [],
    maxSteps: 10,
    busy: false,

    init() {
        this.score = 0
        this.frozen = false
        this.achieved2048 = false
        this.history = []
        this.busy = false

        this.bestScore = Storage.getBestScore() || 0

        Board.init('game-board')

        this.load()

        if (this.history.length === 0) {
            this.spawnStartTiles()
            this.storeStep()
        }

        this.updateScores()
    },

    spawnStartTiles() {
        for (let i = 0; i < 2; i++) Board.addRandomTile()
    },

    storeStep() {
        const snap = {
            board: Board.getBoardState(),
            score: this.score,
            frozen: this.frozen,
            tiles: this.cloneTiles()
        }
        this.history.push(snap)
        if (this.history.length > this.maxSteps) this.history.shift()
        this.save()
    },

    cloneTiles() {
        return Board.tiles.map(t => ({
            value: t.value,
            row: t.row,
            col: t.col
        }))
    },

    restoreTiles(arr) {
        if (!Array.isArray(arr)) return
        Board.reset()
        arr.forEach(t => {
            if (typeof t.value === 'number') Board.addTile(t.value, t.row, t.col, false)
        })
    },

    undo() {
        if (this.history.length <= 1 || this.frozen || this.busy) return false
        this.history.pop()
        const prev = this.history[this.history.length - 1]
        if (prev && prev.tiles) {
            this.restoreTiles(prev.tiles)
            this.score = prev.score || 0
            this.frozen = prev.frozen || false
            this.updateScores()
            this.updateEndScreen()
            this.save()
            return true
        }
        return false
    },

    newGame() {
        if (this.busy) return
        Board.reset()
        this.score = 0
        this.frozen = false
        this.achieved2048 = false
        this.history = []
        this.busy = false
        this.spawnStartTiles()
        this.storeStep()
        this.updateScores()
        this.updateEndScreen()

        const f = document.getElementById('save-score-form')
        const ok = document.getElementById('save-success')
        const name = document.getElementById('player-name')
        if (f) f.style.display = 'flex'
        if (ok) ok.style.display = 'none'
        if (name) name.value = ''

        this.save()
    },

    move(dir) {
        if (this.frozen || this.busy) return { moved: false, scoreAdded: 0 }

        this.busy = true
        Board.prepareForMove()

        let moved = false
        let gained = 0

        if (dir === 'up') ({ moved, scoreAdded: gained } = this.moveUp())
        if (dir === 'down') ({ moved, scoreAdded: gained } = this.moveDown())
        if (dir === 'left') ({ moved, scoreAdded: gained } = this.moveLeft())
        if (dir === 'right') ({ moved, scoreAdded: gained } = this.moveRight())

        if (moved) {
            this.score += gained
            if (this.score > this.bestScore) {
                this.bestScore = this.score
                Storage.saveBestScore(this.score)
            }

            setTimeout(() => {
                const nt = Board.addRandomTile()
                if (nt) {
                    this.storeStep()
                    this.check2048()
                    if (!Board.hasMoves()) this.frozen = true
                    this.updateScores()
                    this.updateEndScreen()
                }
                this.busy = false
            }, 150)
        } else {
            this.busy = false
        }

        return { moved, scoreAdded: gained }
    },

    moveUp() {
        let moved = false
        let add = 0
        for (let c = 0; c < Board.size; c++) {
            for (let r = 1; r < Board.size; r++) {
                const t = Board.cells[r][c]
                if (!t) continue
                let rr = r
                while (rr > 0) {
                    const tr = rr - 1
                    const tt = Board.cells[tr][c]
                    if (!tt) {
                        if (Board.moveTile(t, tr, c)) {
                            moved = true
                            rr = tr
                            continue
                        }
                    }
                    if (tt && tt.value === t.value && !tt.wasMerged) {
                        const m = Board.mergeTiles(t, tt)
                        if (m) {
                            moved = true
                            add += m.value
                        }
                        break
                    }
                    break
                }
            }
        }
        return { moved, scoreAdded: add }
    },

    moveDown() {
        let moved = false
        let add = 0
        for (let c = 0; c < Board.size; c++) {
            for (let r = Board.size - 2; r >= 0; r--) {
                const t = Board.cells[r][c]
                if (!t) continue
                let rr = r
                while (rr < Board.size - 1) {
                    const tr = rr + 1
                    const tt = Board.cells[tr][c]
                    if (!tt) {
                        if (Board.moveTile(t, tr, c)) {
                            moved = true
                            rr = tr
                            continue
                        }
                    }
                    if (tt && tt.value === t.value && !tt.wasMerged) {
                        const m = Board.mergeTiles(t, tt)
                        if (m) {
                            moved = true
                            add += m.value
                        }
                        break
                    }
                    break
                }
            }
        }
        return { moved, scoreAdded: add }
    },

    moveLeft() {
        let moved = false
        let add = 0
        for (let r = 0; r < Board.size; r++) {
            for (let c = 1; c < Board.size; c++) {
                const t = Board.cells[r][c]
                if (!t) continue
                let cc = c
                while (cc > 0) {
                    const tc = cc - 1
                    const tt = Board.cells[r][tc]
                    if (!tt) {
                        if (Board.moveTile(t, r, tc)) {
                            moved = true
                            cc = tc
                            continue
                        }
                    }
                    if (tt && tt.value === t.value && !tt.wasMerged) {
                        const m = Board.mergeTiles(t, tt)
                        if (m) {
                            moved = true
                            add += m.value
                        }
                        break
                    }
                    break
                }
            }
        }
        return { moved, scoreAdded: add }
    },

    moveRight() {
        let moved = false
        let add = 0
        for (let r = 0; r < Board.size; r++) {
            for (let c = Board.size - 2; c >= 0; c--) {
                const t = Board.cells[r][c]
                if (!t) continue
                let cc = c
                while (cc < Board.size - 1) {
                    const tc = cc + 1
                    const tt = Board.cells[r][tc]
                    if (!tt) {
                        if (Board.moveTile(t, r, tc)) {
                            moved = true
                            cc = tc
                            continue
                        }
                    }
                    if (tt && tt.value === t.value && !tt.wasMerged) {
                        const m = Board.mergeTiles(t, tt)
                        if (m) {
                            moved = true
                            add += m.value
                        }
                        break
                    }
                    break
                }
            }
        }
        return { moved, scoreAdded: add }
    },

    check2048() {
        for (let r = 0; r < Board.size; r++) {
            for (let c = 0; c < Board.size; c++) {
                const t = Board.cells[r][c]
                if (t && t.value >= 2048) {
                    this.achieved2048 = true
                    return true
                }
            }
        }
        return false
    },

    save() {
        Storage.saveGameState({
            board: Board.getBoardState(),
            score: this.score,
            bestScore: this.bestScore,
            frozen: this.frozen,
            achieved2048: this.achieved2048,
            history: this.history
        })
    },

    load() {
        const s = Storage.loadGameState()
        if (!s) return false

        this.score = s.score || 0
        this.bestScore = s.bestScore || 0
        this.frozen = s.frozen || false
        this.achieved2048 = s.achieved2048 || false
        this.history = s.history || []

        if (this.history.length > 0) {
            const last = this.history[this.history.length - 1]
            if (last && last.tiles) this.restoreTiles(last.tiles)
            else {
                this.spawnStartTiles()
                this.storeStep()
            }
        } else {
            this.spawnStartTiles()
            this.storeStep()
        }

        return true
    },

    updateScores() {
        const s = document.getElementById('score')
        const b = document.getElementById('best-score')
        if (s) {
            s.textContent = this.score
            s.classList.add('score-update')
            setTimeout(() => s.classList.remove('score-update'), 300)
        }
        if (b) b.textContent = this.bestScore
    },

    updateEndScreen() {
        const scr = document.getElementById('game-over')
        const final = document.getElementById('final-score')
        if (scr && final) {
            if (this.frozen) {
                final.textContent = this.score
                scr.style.display = 'flex'
            } else {
                scr.style.display = 'none'
            }
        }
    },

    getScore() {
        return this.score
    }
}

