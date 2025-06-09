// filtre les projets selon les thèmes cochés
function filterProjects() {
  const checkboxes = Array.from(document.querySelectorAll('#filters input[type="checkbox"]'));
  const selected = checkboxes.filter(cb => cb.checked).map(cb => cb.value);
  const projects = document.querySelectorAll('.project');

  projects.forEach(proj => {
    const themes = proj.getAttribute('data-themes').split(',');
    const match = selected.every(val => themes.includes(val));
    proj.style.display = match || selected.length === 0 ? 'flex' : 'none';
  });

  // ajuste les couleurs en quinconce
  adjustProjectColors();
}

// alterne la couleur si deux projets visibles ont la même couleur originelle
function adjustProjectColors() {
  const visible = Array.from(document.querySelectorAll('.project'))
    .filter(p => p.style.display !== 'none');
  let lastColor = null;

  visible.forEach(proj => {
    const original = proj.getAttribute('data-color');
    let current = original;

    if (current === lastColor) {
      current = original === 'noir' ? 'blanc' : 'noir';
    }

    proj.setAttribute('data-color', current);
    lastColor = current;
  });
}

// toggler l'affichage des filtres
function toggleFilters() {
  document.getElementById('filters').classList.toggle('show');
}

// toggler l'affichage du détail d'un projet
function toggle_project(id) {
  const detail = document.getElementById('display-' + id);
  detail.classList.toggle('active');
}
