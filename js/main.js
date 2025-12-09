document.addEventListener("DOMContentLoaded", () => {


    Game.init();



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
