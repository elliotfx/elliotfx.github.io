document.addEventListener("DOMContentLoaded", () => {
    const burger = document.querySelector(".burger");
    const menu = document.querySelector(".menu");

    burger.addEventListener("click", () => {
        menu.classList.toggle("active");
    });

    const scrollIndicator = document.querySelector(".scroll-indicator");
    scrollIndicator.addEventListener("click", scrollToPresentation);
});

function scrollToPresentation() {
    const presentationSection = document.getElementById('presentation');
    const offset = -60; // Ajustez cette valeur en fonction de la hauteur de votre header
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = presentationSection.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition + offset;

    smoothScrollTo(offsetPosition, 1000); // 1000ms pour un défilement plus lent
}

function smoothScrollTo(target, duration) {
    const start = window.pageYOffset;
    const distance = target - start;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, start, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

// Commenter ou supprimer cet écouteur d'événement
// window.addEventListener('scroll', () => {
//     const presentationSection = document.getElementById('presentation');
//     const rect = presentationSection.getBoundingClientRect();
//     if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
//         window.scrollTo({
//             top: presentationSection.offsetTop,
//             behavior: 'smooth'
//         });
//     }
// });