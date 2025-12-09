document.addEventListener("DOMContentLoaded", () => {


    Game.init();



    UI.init();
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
