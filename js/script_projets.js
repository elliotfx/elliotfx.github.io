/* ===================================
   Portfolio Elliot FEROUX
   Scripts d'interactivité
   =================================== */

var activeModal = null;
var lastFocusedElement = null;
var focusableModalSelector = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
].join(",");

document.addEventListener("DOMContentLoaded", function () {
    applyPortfolioConsistencyUpdates();
    initBurgerMenu();
    initProjectFilters();
    initLightbox();

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            if (isLightboxOpen()) {
                closeLightbox();
                return;
            }

            closeAllModals();
            closeBurgerMenu();
            return;
        }

        if (e.key === "Tab" && activeModal) {
            trapModalFocus(e);
        }
    });
});

/* ===================================
   MISE À JOUR ET COHÉRENCE DU CONTENU
   =================================== */

function applyPortfolioConsistencyUpdates() {
    updateNavigationAndHomeLogo();

    var pageName = window.location.pathname.split("/").pop() || "index.html";

    if (pageName === "apropos.html") {
        updateAboutPage();
    } else if (pageName === "alternance.html") {
        updateAlternancePage();
    } else if (pageName === "projets.html") {
        updateProjectsPage();
    } else if (pageName === "bilan.html") {
        updateBilanPage();
    } else if (pageName === "contact.html") {
        updateContactPage();
    }
}

function updateNavigationAndHomeLogo() {
    document.querySelectorAll('.link-nav-underline a[href$="apropos.html"]').forEach(function (link) {
        link.textContent = "À PROPOS";
    });

    document.querySelectorAll('a[href*="iutp.univ-poitiers.fr/sd"]').forEach(function (link) {
        link.href = "./index.html";
        link.removeAttribute("target");
        link.setAttribute("aria-label", "Retour à l'accueil");
    });
}

function findProjectBlockByTitle(title) {
    var titles = document.querySelectorAll(".project-block .titre");

    for (var i = 0; i < titles.length; i += 1) {
        if (titles[i].textContent.trim() === title) {
            return titles[i].closest(".project-block");
        }
    }

    return null;
}

function setProjectParagraphs(title, paragraphs) {
    var block = findProjectBlockByTitle(title);
    if (!block) return;

    var description = block.querySelector(".project-description");
    if (!description) return;

    Array.prototype.slice.call(description.children).forEach(function (child) {
        if (child.tagName === "P") {
            child.remove();
        }
    });

    var anchor = description.querySelector("button, .dashboard-link");

    paragraphs.forEach(function (text) {
        var paragraph = document.createElement("p");
        paragraph.textContent = text;
        description.insertBefore(paragraph, anchor || null);
    });
}

function updateAboutPage() {
    setProjectParagraphs("Arbitrage basket-ball 5x5", [
        "De 8 à 18 ans, j’ai joué au basket en club, d’abord à Ménigoute puis à Lusignan. Je pratiquais avant tout pour le plaisir et pour partager ma passion avec les autres.",
        "À 17 ans, je me suis progressivement tourné vers l’arbitrage. Après une première saison au niveau départemental, j’ai suivi la formation régionale. Je suis aujourd’hui arbitre officiel et je souhaite continuer à progresser vers les niveaux supérieurs.",
        "L’arbitrage est devenu une véritable passion. Il m’a permis de gagner en confiance, de prendre des décisions sous pression et de rencontrer de nombreuses personnes dans le milieu du basket-ball."
    ]);

    setProjectParagraphs("Arbitrage basket-ball 3x3", [
        "Le basket-ball 3x3 est une discipline olympique inspirée du basket de rue. Son rythme, son organisation et la gestion des acteurs sont différents du basket-ball 5x5. Cette autre manière d’arbitrer m’a rapidement attiré.",
        "J’ai depuis arbitré plusieurs événements, dont les Jeux européens inter-entreprises de Bordeaux, l’Urban PB de Poitiers et le Tournoi international du Grand Cognac. Cette discipline me permet de voyager, de profiter du basket en plein air et de découvrir de nouveaux environnements."
    ]);

    setProjectParagraphs("Bénévolat - Mélusik", [
        "La musique a toujours occupé une place importante dans ma famille. J’ai commencé à participer bénévolement au festival Mélusik en 2023, d’abord à la restauration et à la logistique.",
        "Lors de l’édition suivante, j’ai rejoint l’accueil du festival. J’étais chargé de servir les festivaliers en jetons, de gérer les retours de caution et de répondre à leurs questions. J’ai particulièrement apprécié ce poste, qui demandait du contact, de la rigueur et des responsabilités.",
        "Cette expérience m’a aidé à gagner en confiance et à comprendre l’importance de l’accueil dans l’image donnée par un événement dès l’arrivée du public."
    ]);

    setProjectParagraphs("Arbitrage Universitaire", [
        "Depuis l’année universitaire 2024-2025, j’arbitre régulièrement dans le cadre universitaire, principalement à Poitiers. Ces rencontres me permettent de travailler avec des joueuses et joueurs de niveaux variés et d’enrichir mon expérience.",
        "J’ai notamment arbitré des finales académiques et interacadémiques, dont une finale réunissant des équipes de l’ENSMA, de Bordeaux et de Pau. Ces rendez-vous complètent mon activité en club et me permettent de pratiquer encore davantage ma passion."
    ]);
}

function replaceTitles(replacements) {
    document.querySelectorAll(".titre, .diplayed-title").forEach(function (title) {
        var current = title.textContent.trim();
        if (Object.prototype.hasOwnProperty.call(replacements, current)) {
            title.textContent = replacements[current];
        }
    });
}

function updateAlternancePage() {
    replaceTitles({
        "Recettage des Smart Data": "Recette des Smart Data",
        "Pilotage des cabinets d’expertise IRD": "Pilotage des sociétés d’expertise IRD",
        "Dossiers anciens et à forts enjeux": "Suivi des sinistres IRD anciens et à forts enjeux",
        "Création de tableaux de bord corporels": "Suivi des sinistres corporels anciens et à forts enjeux"
    });

    var presentationBlock = findProjectBlockByTitle("Mutuelle de Poitiers Assurances");
    if (!presentationBlock) return;

    var paragraph = presentationBlock.querySelector(".project-description p");
    if (paragraph) {
        paragraph.textContent = "Fondée en 1838, la Mutuelle de Poitiers Assurances est une société d’assurance mutualiste qui accompagne près de 500 000 sociétaires grâce à un réseau de plus de 300 agences réparties dans 59 départements. J’y effectue actuellement ma deuxième année d’alternance au sein du Data Office, avec un rôle qui a progressivement évolué de la découverte des données vers la gestion plus complète de projets data.";
    }
}

function updateProjectsPage() {
    replaceTitles({
        "Prévision des Importations — Danemark": "Prévision des importations du Danemark",
        "Présentation — Le Danemark": "Prévision des importations du Danemark"
    });
}

function findBilanTitle(text) {
    var titles = document.querySelectorAll(".bilan .titre");

    for (var i = 0; i < titles.length; i += 1) {
        if (titles[i].textContent.trim() === text) {
            return titles[i];
        }
    }

    return null;
}

function replaceBilanSection(startText, endText, paragraphs) {
    var startTitle = findBilanTitle(startText);
    var endTitle = findBilanTitle(endText);

    if (!startTitle || !endTitle || startTitle.parentNode !== endTitle.parentNode) return;

    var current = startTitle.nextSibling;
    while (current && current !== endTitle) {
        var next = current.nextSibling;
        current.remove();
        current = next;
    }

    paragraphs.forEach(function (text) {
        var paragraph = document.createElement("p");
        paragraph.textContent = text;
        endTitle.parentNode.insertBefore(paragraph, endTitle);
    });
}

function updateBilanPage() {
    replaceBilanSection("BILAN PERSONNEL — BUT 1", "BILAN PERSONNEL — BUT 2", [
        "Cette première année de BUT Science des Données m’a permis de découvrir la diversité de la formation, entre programmation, statistiques, gestion de données et projets collectifs. Les nombreux travaux réalisés m’ont appris à mieux répartir les tâches, à communiquer au sein d’un groupe et à présenter des résultats de manière structurée.",
        "Les enseignements les plus théoriques, notamment en mathématiques, ont représenté une difficulté importante. Cette expérience m’a fait comprendre que je devais travailler plus régulièrement, chercher des explications complémentaires et ne pas attendre les évaluations pour revenir sur les notions mal comprises.",
        "Cette année m’a surtout donné envie de confronter mes compétences à des problématiques concrètes. L’entrée en alternance constituait donc une suite logique pour mieux comprendre les attentes professionnelles et donner davantage de sens aux connaissances acquises en cours."
    ]);

    replaceBilanSection("BILAN PERSONNEL — BUT 2", "BILAN PERSONNEL — BUT 3", [
        "Cette deuxième année a été contrastée. Les résultats académiques n’ont pas toujours été à la hauteur de mes attentes, mais cette période m’a permis de mieux identifier mes difficultés, en particulier dans les matières très théoriques et dans l’utilisation de nouveaux outils techniques.",
        "J’ai compris que mon principal axe de progression concernait la régularité. Pour avancer, j’ai commencé à mieux organiser mes semaines, à travailler davantage avec d’autres étudiants et à rechercher des ressources complémentaires lorsque les explications du cours ne suffisaient pas.",
        "L’alternance a constitué le point fort de cette année. Elle m’a permis de développer des compétences concrètes, de progresser techniquement et de gagner en aisance à l’oral. Le fait de voir l’utilisation réelle de mes analyses et de mes tableaux de bord m’a aidé à prendre confiance dans mes capacités.",
        "Ce bilan m’a servi de point de départ pour aborder la troisième année avec davantage de méthode. Mon objectif était de mieux relier les enseignements du BUT aux besoins rencontrés en entreprise et de prendre une place plus active dans la conduite des projets."
    ]);
}

function updateContactPage() {
    var cvContainer = document.querySelector(".CV");
    if (!cvContainer) return;

    if (!cvContainer.querySelector(".cv-download-link")) {
        var wrapper = document.createElement("p");
        wrapper.style.textAlign = "center";
        wrapper.style.margin = "20px 0";

        var link = document.createElement("a");
        link.className = "cv-download-link";
        link.href = "./../Images/CV.pdf";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("download", "");
        link.textContent = "TÉLÉCHARGER MON CV";
        link.style.color = "antiquewhite";
        link.style.fontFamily = "'Bebas Neue', sans-serif";
        link.style.fontSize = "1.2em";

        wrapper.appendChild(link);
        cvContainer.insertBefore(wrapper, cvContainer.firstChild);
    }

    var fallbackParagraphs = cvContainer.querySelectorAll("object p");
    if (fallbackParagraphs[0]) {
        fallbackParagraphs[0].textContent = "Le CV ne peut pas être affiché dans ce navigateur.";
    }
    if (fallbackParagraphs[1]) {
        fallbackParagraphs[1].innerHTML = '<a href="./../Images/CV.pdf" target="_blank" rel="noopener noreferrer" style="color: antiquewhite;">Ouvrir le CV au format PDF</a>';
    }
}

/* ===================================
   MODALES
   =================================== */

function display_project(id) {
    var modal = document.getElementById("display" + id);
    var overlay = document.getElementById("modal-overlay");

    if (!modal) return;

    lastFocusedElement = document.activeElement;
    activeModal = modal;

    if (!modal.hasAttribute("tabindex")) {
        modal.setAttribute("tabindex", "-1");
    }

    modal.style.display = "block";
    modal.classList.remove("modal-close");
    void modal.offsetHeight;
    modal.classList.add("modal-open");

    if (overlay) overlay.classList.add("visible");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(function () {
        focusModal(modal);

        setTimeout(function () {
            if (!modal.contains(document.activeElement)) {
                focusModal(modal);
            }
        }, 60);
    });
}

function close_display(id) {
    var modal = document.getElementById(id.slice(2));
    var overlay = document.getElementById("modal-overlay");

    if (!modal) return;

    if (overlay) overlay.classList.remove("visible");
    hideModal(modal, true);
}

function closeAllModals() {
    var modals = document.querySelectorAll(".project-page");
    var overlay = document.getElementById("modal-overlay");
    var shouldRestoreFocus = false;

    modals.forEach(function (modal) {
        if (modal.style.display === "block") {
            shouldRestoreFocus = shouldRestoreFocus || modal === activeModal;
            hideModal(modal, modal === activeModal);
        }
    });

    if (overlay) overlay.classList.remove("visible");

    if (!shouldRestoreFocus) {
        activeModal = null;
    }
}

function hideModal(modal, shouldRestoreFocus) {
    var fallbackTimer;

    modal.classList.remove("modal-open");
    modal.classList.add("modal-close");

    function finishClose() {
        clearTimeout(fallbackTimer);
        modal.style.display = "none";
        modal.classList.remove("modal-close");
        document.body.style.overflow = "";
        modal.removeEventListener("animationend", finishClose);

        if (activeModal === modal) {
            activeModal = null;
        }

        if (shouldRestoreFocus) {
            restoreFocus();
        }
    }

    modal.addEventListener("animationend", finishClose);
    fallbackTimer = setTimeout(finishClose, 350);
}

function restoreFocus() {
    if (
        lastFocusedElement &&
        typeof lastFocusedElement.focus === "function" &&
        document.contains(lastFocusedElement)
    ) {
        try {
            lastFocusedElement.focus({ preventScroll: true });
        } catch (e) {
            lastFocusedElement.focus();
        }
    }

    lastFocusedElement = null;
}

function focusModal(modal) {
    var target = modal.querySelector("button") || modal;

    try {
        target.focus({ preventScroll: true });
    } catch (e) {
        target.focus();
    }
}

function trapModalFocus(e) {
    var focusableElements = Array.prototype.slice.call(
        activeModal.querySelectorAll(focusableModalSelector)
    ).filter(function (element) {
        return element.offsetParent !== null || element === document.activeElement;
    });

    if (focusableElements.length === 0) {
        e.preventDefault();
        activeModal.focus();
        return;
    }

    var firstElement = focusableElements[0];
    var lastElement = focusableElements[focusableElements.length - 1];

    if (!activeModal.contains(document.activeElement)) {
        e.preventDefault();
        if (e.shiftKey) {
            lastElement.focus();
        } else {
            firstElement.focus();
        }
        return;
    }

    if (e.shiftKey && (document.activeElement === firstElement || document.activeElement === activeModal)) {
        e.preventDefault();
        lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
    }
}

/* ===================================
   MENU BURGER
   =================================== */

function initBurgerMenu() {
    var burgerIcon = document.querySelector(".iconeburger");
    var burgerMenu = document.getElementById("burgerbar");
    var closeIcon = document.querySelector(".iconeburgerclose");

    if (burgerIcon && burgerMenu) {
        burgerIcon.addEventListener("click", function () {
            burgerMenu.style.left = "0";
        });
    }

    if (closeIcon && burgerMenu) {
        closeIcon.addEventListener("click", function () {
            burgerMenu.style.left = "-100%";
        });
    }

    document.addEventListener("click", function (e) {
        if (
            burgerMenu &&
            burgerMenu.style.left === "0px" &&
            !burgerMenu.contains(e.target) &&
            burgerIcon &&
            !burgerIcon.contains(e.target)
        ) {
            burgerMenu.style.left = "-100%";
        }
    });
}

function closeBurgerMenu() {
    var burgerMenu = document.getElementById("burgerbar");
    if (burgerMenu && burgerMenu.style.left === "0px") {
        burgerMenu.style.left = "-100%";
    }
}

/* ===================================
   SYSTÈME DE FILTRAGE AUTOMATIQUE
   =================================== */

function initProjectFilters() {
    var filterBar = document.getElementById("filter-bar");
    var projectBlocks = document.querySelectorAll(".project-block");
    var selectedTags = [];

    if (!filterBar || projectBlocks.length === 0) return;

    filterBar.innerHTML = "";

    var allTags = [];
    projectBlocks.forEach(function (block) {
        parseTags(block).forEach(function (tag) {
            if (allTags.indexOf(tag) === -1) {
                allTags.push(tag);
            }
        });
    });

    filterBar.appendChild(createFilterButton("Tous", "all", true));

    allTags.sort().forEach(function (tag) {
        filterBar.appendChild(createFilterButton(tag, tag, false));
    });

    projectBlocks.forEach(function (block) {
        var container = block.querySelector(".project-tags");
        if (!container) return;

        container.innerHTML = "";

        parseTags(block).forEach(function (tag) {
            var pill = document.createElement("span");
            pill.className = "tag-pill";
            pill.textContent = tag;
            pill.style.cursor = "pointer";
            pill.addEventListener("click", function () {
                toggleFilter(filterBar, projectBlocks, selectedTags, tag);
                window.scrollTo(0, 0);
            });
            container.appendChild(pill);
        });
    });

    filterBar.addEventListener("click", function (e) {
        if (!e.target.classList.contains("filter-btn")) return;
        toggleFilter(filterBar, projectBlocks, selectedTags, e.target.dataset.tag);
    });

    applyFilters(filterBar, projectBlocks, selectedTags);
}

function toggleFilter(filterBar, projectBlocks, selectedTags, tag) {
    if (tag === "all") {
        selectedTags.length = 0;
    } else {
        var tagIndex = selectedTags.indexOf(tag);
        if (tagIndex === -1) {
            selectedTags.push(tag);
        } else {
            selectedTags.splice(tagIndex, 1);
        }
    }

    applyFilters(filterBar, projectBlocks, selectedTags);
}

function applyFilters(filterBar, projectBlocks, selectedTags) {
    filterBar.querySelectorAll(".filter-btn").forEach(function (btn) {
        if (btn.dataset.tag === "all") {
            btn.classList.toggle("active", selectedTags.length === 0);
            return;
        }

        btn.classList.toggle("active", selectedTags.indexOf(btn.dataset.tag) !== -1);
    });

    projectBlocks.forEach(function (block) {
        if (selectedTags.length === 0) {
            block.classList.remove("hidden");
        } else {
            var projectTags = parseTags(block);
            var matchesAtLeastOneTag = selectedTags.some(function (selectedTag) {
                return projectTags.indexOf(selectedTag) !== -1;
            });
            block.classList.toggle("hidden", !matchesAtLeastOneTag);
        }
    });

    reapplyAlternatingColors(projectBlocks);

    var visible = getVisibleBlocks(projectBlocks);
    visible.forEach(function (block, i) {
        block.classList.remove("animate-in");
        void block.offsetHeight;
        block.classList.add("animate-in");
        block.style.animationDelay = (i * 0.07) + "s";
    });

    var noResults = document.getElementById("no-results");
    if (noResults) {
        noResults.classList.toggle("visible", visible.length === 0);
    }
}

function reapplyAlternatingColors(projectBlocks) {
    getVisibleBlocks(projectBlocks).forEach(function (block, i) {
        block.classList.remove("section-dark", "section-light");
        block.classList.add(i % 2 === 0 ? "section-dark" : "section-light");
    });
}

function getVisibleBlocks(projectBlocks) {
    return Array.prototype.filter.call(projectBlocks, function (block) {
        return !block.classList.contains("hidden");
    });
}

function parseTags(block) {
    var raw = block.dataset.tags || "";
    return raw.split(",")
        .map(function (tag) { return tag.trim(); })
        .filter(function (tag) { return tag.length > 0; });
}

function createFilterButton(text, tagValue, isActive) {
    var button = document.createElement("button");
    button.className = "filter-btn" + (isActive ? " active" : "");
    button.dataset.tag = tagValue;
    button.textContent = text;
    button.type = "button";
    return button;
}

/* ===================================
   LIGHTBOX
   =================================== */

function initLightbox() {
    if (!document.getElementById("lightbox-overlay")) {
        var overlay = document.createElement("div");
        overlay.id = "lightbox-overlay";
        overlay.className = "lightbox-overlay";
        overlay.innerHTML = '<button class="lightbox-close" type="button" aria-label="Fermer">&times;</button><img class="lightbox-content" src="" alt="Plein écran">';
        document.body.appendChild(overlay);

        overlay.addEventListener("click", function (e) {
            if (e.target !== overlay.querySelector(".lightbox-content")) {
                closeLightbox();
            }
        });
    }

    document.querySelectorAll(".details-project img, .project-image img").forEach(function (image) {
        if (!image.classList.contains("no-lightbox")) {
            image.style.cursor = "zoom-in";
            image.removeEventListener("click", onImageClick);
            image.addEventListener("click", onImageClick);
        }
    });
}

function onImageClick(e) {
    if (e) e.stopPropagation();
    openLightbox(this.src, this.alt);
}

function openLightbox(src, alt) {
    var overlay = document.getElementById("lightbox-overlay");
    if (!overlay) return;

    var image = overlay.querySelector(".lightbox-content");
    image.src = src;
    image.alt = alt;
    overlay.classList.add("visible");
}

function closeLightbox() {
    var overlay = document.getElementById("lightbox-overlay");
    if (overlay) overlay.classList.remove("visible");
}

function isLightboxOpen() {
    var overlay = document.getElementById("lightbox-overlay");
    return !!(overlay && overlay.classList.contains("visible"));
}
