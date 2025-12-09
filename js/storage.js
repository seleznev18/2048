window.DataVault = {
    KEYS: {
        STATE: "game_state_blob_v2",
        BEST: "best_points_record_v2",
        BOARD: "scoreboard_records_v2"
    },


    storeSnapshot(payload) {
        try {
            const encoded = JSON.stringify(payload);
            localStorage.setItem(this.KEYS.STATE, encoded);
            return true;
        } catch (err) {
            console.warn("Не удалось сохранить снимок игры:", err);
            return false;
        }
    },

    readSnapshot() {
        try {
            const raw = localStorage.getItem(this.KEYS.STATE);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.warn("Ошибка восстановления состояния:", err);
            return null;
        }
    },

    pushScore(user, points) {
        try {
            const list = this.fetchScores();
            const entry = {
                player: user || "Игрок",
                value: points,
                stamp: new Date().toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                })
            };

            list.push(entry);
            list.sort((a, b) => b.value - a.value);

            const trimmed = list.slice(0, 10);

            localStorage.setItem(this.KEYS.BOARD, JSON.stringify(trimmed));
            this.updateBest(points);

            return true;
        } catch (err) {
            console.warn("Ошибка добавления результата:", err);
            return false;
        }
    },

    fetchScores() {
        try {
            const raw = localStorage.getItem(this.KEYS.BOARD);
            return raw ? JSON.parse(raw) : [];
        } catch (err) {
            console.warn("Ошибка загрузки таблицы рекордов:", err);
            return [];
        }
    },

    wipeScores() {
        try {
            localStorage.removeItem(this.KEYS.BOARD);
            return true;
        } catch (err) {
            console.warn("Ошибка очистки лидеров:", err);
            return false;
        }
    },
    updateBest(val) {
        try {
            const prev = this.getBest();
            if (val > prev) {
                localStorage.setItem(this.KEYS.BEST, String(val));
                return true;
            }
            return false;
        } catch (err) {
            console.warn("Ошибка сохранения лучшего счета:", err);
            return false;
        }
    },

    getBest() {
        try {
            const raw = localStorage.getItem(this.KEYS.BEST);
            return raw ? parseInt(raw) : 0;
        } catch (err) {
            console.warn("Ошибка чтения лучшего результата:", err);
            return 0;
        }
    },

    nukeAll() {
        try {
            localStorage.removeItem(this.KEYS.STATE);
            localStorage.removeItem(this.KEYS.BEST);
            localStorage.removeItem(this.KEYS.BOARD);
            return true;
        } catch (err) {
            console.warn("Ошибка полной очистки:", err);
            return false;
        }
    }
};
