// JS/script_projets.js

document.addEventListener('DOMContentLoaded', function() {

  // Sélection du header de filtre et du panneau
  const filterHeader = document.querySelector('.filter-header');
  const filters      = document.getElementById('filters');

  // Toggler l'affichage des filtres et l'icône
  window.toggleFilters = function() {
    filters.classList.toggle('show');
    filterHeader.classList.toggle('active');
  };

  // Toggle détail projet
  window.toggle_project = function(id) {
    const detail = document.getElementById("display-" + id);
    if (detail) detail.classList.toggle("active");
  };

  // Filtrer les projets par thème
  window.filterProjects = function() {
    const checkedBoxes = document.querySelectorAll('#filters input[type="checkbox"]:checked');
    const selectedThemes = Array.from(checkedBoxes).map(cb => cb.value);
    const projects = document.querySelectorAll('.project');

    projects.forEach(project => {
      const themes = project.getAttribute('data-themes').split(',').map(t => t.trim());
      const show = selectedThemes.every(theme => themes.includes(theme));
      project.style.display = show || selectedThemes.length === 0 ? 'flex' : 'none';
    });

    adjustProjectColors();
  };

  // Alternance des couleurs après filtrage
  function adjustProjectColors() {
    const visible = Array.from(document.querySelectorAll('.project'))
      .filter(p => p.style.display !== 'none');
    let lastColor = null;

    visible.forEach(proj => {
      const original = proj.getAttribute('data-color');
      let current = original;
      if (current === lastColor) current = (original === 'noir' ? 'blanc' : 'noir');
      proj.setAttribute('data-color', current);
      lastColor = current;
    });
  }

  // Empêcher la propagation sur labels
  document.querySelectorAll('.filters label').forEach(lbl =>
    lbl.addEventListener('click', e => e.stopPropagation())
  );

  // Burger menu
  const burgerContainer = document.querySelector(".burger-container");
  const burgerBar       = document.getElementById("burgerbar");
  const closeIcon       = document.querySelector("#burgerbar .iconeburgerclose");

  if (burgerContainer && burgerBar && closeIcon) {
    burgerContainer.addEventListener("click", () => burgerBar.style.left = "0");
    closeIcon.addEventListener("click",    () => burgerBar.style.left = "-100%");
  }

});
