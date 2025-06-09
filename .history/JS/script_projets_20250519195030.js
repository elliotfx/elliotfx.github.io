document.addEventListener('DOMContentLoaded', function() {

  // Fonction pour toggler l'affichage des filtres
  window.toggleFilters = function() {
    var filters = document.getElementById('filters');
    if (filters) {
      filters.classList.toggle('show');
    }
  };

  // Fonction toggle pour afficher/masquer le détail d'un projet
  window.toggle_project = function(id) {
    var detail = document.getElementById("display-" + id);
    if (detail) {
      detail.classList.toggle("active");
    } else {
      console.error("Élément avec l'ID 'display-" + id + "' non trouvé.");
    }
  };

  // Fonction pour filtrer les projets par thème
  window.filterProjects = function() {
    var checkedBoxes = document.querySelectorAll('#filters input[type="checkbox"]:checked');
    var selectedThemes = Array.from(checkedBoxes).map(function(checkbox) {
      return checkbox.value;
    });
    var projects = document.querySelectorAll('.project');
    projects.forEach(function(project) {
      var themes = project.getAttribute('data-themes').split(',').map(function(theme) {
        return theme.trim();
      });
      var showProject = selectedThemes.every(function(theme) {
        return themes.includes(theme);
      });
      project.style.display = (showProject || selectedThemes.length === 0) ? 'flex' : 'none';
    });
    // Met à jour les couleurs après filtrage
    adjustProjectColors();
  };

  // Fonction pour réattribuer les couleurs en quinconce après filtrage
  function adjustProjectColors() {
    var visible = Array.from(document.querySelectorAll('.project'))
      .filter(function(p) { return p.style.display !== 'none'; });
    var lastColor = null;

    visible.forEach(function(proj) {
      var original = proj.getAttribute('data-color');
      var current = original;

      if (current === lastColor) {
        current = (original === 'noir') ? 'blanc' : 'noir';
      }

      proj.setAttribute('data-color', current);
      lastColor = current;
    });
  }

  // Empêcher la propagation du clic sur les labels des filtres
  document.querySelectorAll('.filters label').forEach(function(label) {
    label.addEventListener('click', function(event) {
      event.stopPropagation();
    });
  });

  // Test pour voir où va le clic (utile pour debug)
  document.addEventListener('click', function(event) {
    console.log("Élément cliqué :", event.target);
  });

  // Gestion du menu burger
  const burgerContainer = document.querySelector(".burger-container");
  const burgerBar       = document.getElementById("burgerbar");
  const closeIcon       = document.querySelector("#burgerbar .iconeburgerclose");

  if (burgerContainer && burgerBar && closeIcon) {
    // Ouvrir le menu burger
    burgerContainer.addEventListener("click", function() {
      burgerBar.style.left = "0";
    });
    // Fermer le menu burger
    closeIcon.addEventListener("click", function() {
      burgerBar.style.left = "-100%";
    });
  } else {
    console.error("Les éléments du menu burger ne sont pas tous trouvés.");
  }

});
