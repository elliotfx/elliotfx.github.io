/* ===================================
   Portfolio Elliot FEROUX
   Scripts d'Interactivite
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

    // ---- Menu Burger ----
    initBurgerMenu();

    // ---- Filtres de Projets ----
    initProjectFilters();

    // ---- Lightbox Images ----
    initLightbox();

    // ---- Raccourcis clavier ----
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
   MODALES
   =================================== */

/**
 * Affiche la fenetre modale d'un projet avec animation.
 * @param {string} id - L'identifiant du bouton (ex: "-light-green")
 */
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

    // Force reflow pour que l'animation se relance
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

/**
 * Ferme la fenetre modale d'un projet avec animation.
 * @param {string} id - L'identifiant du bouton fermer (ex: "undisplay-light-green")
 */
function close_display(id) {
    var modal = document.getElementById(id.slice(2));
    var overlay = document.getElementById("modal-overlay");

    if (!modal) return;

    if (overlay) overlay.classList.remove("visible");
    hideModal(modal, true);
}

/**
 * Ferme toutes les modales ouvertes avec animation.
 */
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

    // Fermer en cliquant en dehors
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
   SYSTEME DE FILTRAGE AUTOMATIQUE
   =================================== */

/**
 * Initialise le systeme de filtres dynamiques.
 *
 * Fonctionnement :
 * 1. Scanne tous les blocs `.project-block` pour recuperer leurs `data-tags`
 * 2. Genere automatiquement un bouton filtre par tag unique
 * 3. Au clic sur un filtre : affiche/masque les projets correspondants
 * 4. Reapplique l'alternance noir/beige sur les projets visibles
 */
function initProjectFilters() {
    var filterBar = document.getElementById("filter-bar");
    var projectBlocks = document.querySelectorAll(".project-block");
    var selectedTags = [];

    if (!filterBar || projectBlocks.length === 0) return;

    // ---- 1. Collecter tous les tags uniques ----
    var allTags = [];
    projectBlocks.forEach(function (block) {
        var tags = parseTags(block);
        tags.forEach(function (tag) {
            if (allTags.indexOf(tag) === -1) {
                allTags.push(tag);
            }
        });
    });

    // ---- 2. Creer le bouton "Tous" ----
    filterBar.appendChild(createFilterButton("Tous", "all", true));

    // ---- 3. Creer un bouton par tag (tri alphabetique) ----
    allTags.sort().forEach(function (tag) {
        filterBar.appendChild(createFilterButton(tag, tag, false));
    });

    // ---- 4. Generer les pills de tags dans chaque projet ----
    projectBlocks.forEach(function (block) {
        var container = block.querySelector(".project-tags");
        if (!container) return;

        var tags = parseTags(block);
        tags.forEach(function (tag) {
            var pill = document.createElement("span");
            pill.className = "tag-pill";
            pill.textContent = tag;

            // Rendre les pills cliquables -> active le filtre correspondant
            pill.style.cursor = "pointer";
            pill.addEventListener("click", function () {
                toggleFilter(filterBar, projectBlocks, selectedTags, tag);
                window.scrollTo(0, 0);
            });

            container.appendChild(pill);
        });
    });

    // ---- 5. Gestionnaire de clic sur les filtres ----
    filterBar.addEventListener("click", function (e) {
        if (!e.target.classList.contains("filter-btn")) return;
        var selectedTag = e.target.dataset.tag;
        toggleFilter(filterBar, projectBlocks, selectedTags, selectedTag);
    });

    // ---- 6. Application initiale des couleurs ----
    applyFilters(filterBar, projectBlocks, selectedTags);
}

/**
 * Active/desactive un filtre specifique (multi-selection).
 */
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

/**
 * Applique le filtrage et rafraichit l'interface.
 */
function applyFilters(filterBar, projectBlocks, selectedTags) {
    // Mettre a jour l'etat actif des boutons
    filterBar.querySelectorAll(".filter-btn").forEach(function (btn) {
        if (btn.dataset.tag === "all") {
            btn.classList.toggle("active", selectedTags.length === 0);
            return;
        }

        btn.classList.toggle("active", selectedTags.indexOf(btn.dataset.tag) !== -1);
    });

    // Afficher / masquer les projets
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

    // Reappliquer l'alternance de couleurs
    reapplyAlternatingColors(projectBlocks);

    // Relancer l'animation d'apparition
    var visible = getVisibleBlocks(projectBlocks);
    visible.forEach(function (block, i) {
        block.classList.remove("animate-in");
        void block.offsetHeight; // Force reflow
        block.classList.add("animate-in");
        block.style.animationDelay = (i * 0.07) + "s";
    });

    // Gerer le message "aucun resultat"
    var noResults = document.getElementById("no-results");
    if (noResults) {
        noResults.classList.toggle("visible", visible.length === 0);
    }
}

/**
 * Reapplique l'alternance noir/beige sur les projets visibles.
 * Garantit toujours : sombre -> clair -> sombre -> clair...
 */
function reapplyAlternatingColors(projectBlocks) {
    var visible = getVisibleBlocks(projectBlocks);

    visible.forEach(function (block, i) {
        block.classList.remove("section-dark", "section-light");
        if (i % 2 === 0) {
            block.classList.add("section-dark");
        } else {
            block.classList.add("section-light");
        }
    });
}

/**
 * Recupere les projets visibles (non masques).
 */
function getVisibleBlocks(projectBlocks) {
    return Array.prototype.filter.call(projectBlocks, function (b) {
        return !b.classList.contains("hidden");
    });
}

/**
 * Parse les tags d'un bloc projet depuis son attribut data-tags.
 * @param {HTMLElement} block
 * @returns {string[]}
 */
function parseTags(block) {
    var raw = block.dataset.tags || "";
    return raw.split(",")
        .map(function (t) { return t.trim(); })
        .filter(function (t) { return t.length > 0; });
}

/**
 * Cree un bouton de filtre.
 */
function createFilterButton(text, tagValue, isActive) {
    var btn = document.createElement("button");
    btn.className = "filter-btn" + (isActive ? " active" : "");
    btn.dataset.tag = tagValue;
    btn.textContent = text;
    btn.type = "button";
    return btn;
}

/* ===================================
   LIGHTBOX (Plein écran)
   =================================== */

function initLightbox() {
    if (!document.getElementById("lightbox-overlay")) {
        var overlay = document.createElement("div");
        overlay.id = "lightbox-overlay";
        overlay.className = "lightbox-overlay";
        overlay.innerHTML = '<button class="lightbox-close" type="button" aria-label="Fermer">&times;</button><img class="lightbox-content" src="" alt="Plein écran">';
        document.body.appendChild(overlay);

        overlay.addEventListener("click", function(e) {
            if (e.target !== overlay.querySelector(".lightbox-content")) {
                closeLightbox();
            }
        });
    }

    // Ajout de l'événement clic sur les images des modales et projets
    var images = document.querySelectorAll(".details-project img, .project-image img");
    images.forEach(function(img) {
        if (!img.classList.contains("no-lightbox")) {
            img.style.cursor = "zoom-in";
            // Éviter les multiples écouteurs si le script est relancé
            img.removeEventListener("click", onImageClick);
            img.addEventListener("click", onImageClick);
        }
    });
}

function onImageClick(e) {
    if (e) {
        e.stopPropagation();
    }

    openLightbox(this.src, this.alt);
}

function openLightbox(src, alt) {
    var overlay = document.getElementById("lightbox-overlay");
    if (!overlay) return;
    var img = overlay.querySelector(".lightbox-content");
    img.src = src;
    img.alt = alt;
    overlay.classList.add("visible");
}

function closeLightbox() {
    var overlay = document.getElementById("lightbox-overlay");
    if (overlay) {
        overlay.classList.remove("visible");
    }
}

function isLightboxOpen() {
    var overlay = document.getElementById("lightbox-overlay");
    return !!(overlay && overlay.classList.contains("visible"));
}
