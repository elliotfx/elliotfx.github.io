// headerLoader.js
fetch('./../html/header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;
    })
    .catch(error => console.error('Erreur lors du chargement du header :', error));
