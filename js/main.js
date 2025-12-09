document.addEventListener("DOMContentLoaded", () => {

    if (window.Game) {
        if (typeof Game.initialize === "function") {
            Game.initialize();
        } else if (typeof Game.init === "function") {
            Game.init();
        } else {
            console.error("Game.initialize/init is not a function");
        }
    } else {
        console.error("Game is not defined");
    }


    if (window.UI && typeof UI.setup === "function") {
        UI.setup();
    } else {
        console.error("UI.setup is not a function or UI is not defined");
    }

    setTimeout(() => {
        if (window.UI && typeof UI.notify === "function") {
            UI.notify(
                "Добро пожаловать в 2048! Управляйте свайпами или стрелками.",
                "info"
            );
        }
    }, 450);

    const handleMobileUI = () => {
        const panel = document.querySelector(".mobile-controls");
        if (!panel) return;

        panel.style.display = window.innerWidth <= 600 ? "flex" : "none";
    };

    window.addEventListener("resize", handleMobileUI);

    handleMobileUI();
});
