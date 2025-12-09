window.Storage = {

    saveGameState(gameState) {
        try {
            localStorage.setItem('2048_game_state', JSON.stringify(gameState));
            return true;
        } catch (e) {
            console.error('Ошибка при сохранении состояния игры:', e);
            return false;
        }
    },


    loadGameState() {
        try {
            const state = localStorage.getItem('2048_game_state');
            return state ? JSON.parse(state) : null;
        } catch (e) {
            console.error('Ошибка при загрузке состояния игры:', e);
            return null;
        }
    },


    saveScore(name, score) {
        try {
            const leaders = this.getLeaders();
            const newRecord = {
                name: name || 'Аноним',
                score: score,
                date: new Date().toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                })
            };
            
 
            leaders.push(newRecord);
            

            leaders.sort((a, b) => b.score - a.score);
            
   
            const topLeaders = leaders.slice(0, 10);
            

            localStorage.setItem('2048_leaders', JSON.stringify(topLeaders));
            

            this.saveBestScore(score);
            
            return true;
        } catch (e) {
            console.error('Ошибка при сохранении рекорда:', e);
            return false;
        }
    },


    getLeaders() {
        try {
            const leaders = localStorage.getItem('2048_leaders');
            return leaders ? JSON.parse(leaders) : [];
        } catch (e) {
            console.error('Ошибка при получении таблицы лидеров:', e);
            return [];
        }
    },

    clearLeaders() {
        try {
            localStorage.removeItem('2048_leaders');
            return true;
        } catch (e) {
            console.error('Ошибка при очистке таблицы лидеров:', e);
            return false;
        }
    },


    saveBestScore(score) {
        try {
            const currentBest = this.getBestScore();
            if (score > currentBest) {
                localStorage.setItem('2048_best_score', score.toString());
                return true;
            }
            return false;
        } catch (e) {
            console.error('Ошибка при сохранении лучшего счета:', e);
            return false;
        }
    },


    getBestScore() {
        try {
            const best = localStorage.getItem('2048_best_score');
            return best ? parseInt(best) : 0;
        } catch (e) {
            console.error('Ошибка при получении лучшего счета:', e);
            return 0;
        }
    },


    clearAll() {
        try {
            localStorage.removeItem('2048_game_state');
            localStorage.removeItem('2048_best_score');
            localStorage.removeItem('2048_leaders');
            return true;
        } catch (e) {
            console.error('Ошибка при очистке данных:', e);
            return false;
        }
    }
};