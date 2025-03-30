document.addEventListener('DOMContentLoaded', function () {
    const dataUrl = '../data/listings.csv'; // URL du fichier CSV contenant les données des logements
    const neighborhoodUrl = '../data/neighbourhoods.geojson'; // URL du fichier GeoJSON contenant les données des quartiers

    let selectedRoomType = null; // Variable pour stocker le type de logement sélectionné
    let selectedNeighborhood = null; // Variable pour stocker l'arrondissement sélectionné

    // Charger les données CSV
    fetch(dataUrl)
        .then(response => response.text())
        .then(data => {
            const listings = parseCSV(data); // Parser les données CSV
            createGraphs(listings); // Créer les graphiques avec les données parsées
            populateNeighborhoods(listings); // Remplir les cases à cocher des arrondissements
        });

    // Charger les données GeoJSON
    fetch(neighborhoodUrl)
        .then(response => response.json())
        .then(neighborhoods => {
            // Traiter les données des quartiers si nécessaire
        });

    // Fonction pour parser le CSV
    function parseCSV(data) {
        const parsedData = Papa.parse(data, {
            header: true, // Utiliser la première ligne comme en-tête
            skipEmptyLines: true, // Ignorer les lignes vides
        });

        // Retourner uniquement les colonnes nécessaires
        return parsedData.data.map(row => ({
            id: row.id || null,
            name: row.name || null,
            host_name: row.host_name || null,
            host_id: row.host_id || null,
            neighbourhood: row.neighbourhood || null,
            room_type: row.room_type || null,
            price: parseFloat(row.price) || 0, // Convertir le prix en nombre
            number_of_reviews: parseInt(row.number_of_reviews) || 0, // Convertir le nombre d'avis en nombre
            latitude: parseFloat(row.latitude) || 0,
            longitude: parseFloat(row.longitude) || 0
        })).filter(listing => listing.room_type && listing.price > 0); // Filtrer les lignes valides
    }

    // Fonction pour créer les graphiques
    function createGraphs(listings) {
        const roomTypeSelect = document.getElementById('room_type'); // Sélecteur pour le type de logement
        const priceMinInput = document.getElementById('price_min'); // Champ de saisie pour le prix minimum
        const priceMaxInput = document.getElementById('price_max'); // Champ de saisie pour le prix maximum
        const applyFiltersButton = document.getElementById('apply_filters'); // Bouton pour appliquer les filtres

        // Ajouter un événement de clic au bouton pour appliquer les filtres
        applyFiltersButton.addEventListener('click', () => updateGraphs(listings));

        // Fonction pour mettre à jour les graphiques en fonction des filtres
        function updateGraphs(data) {
            const roomType = selectedRoomType || roomTypeSelect.value; // Priorité à la sélection graphique
            const minPrice = parseFloat(priceMinInput.value); // Récupérer la valeur du prix minimum
            const maxPrice = parseFloat(priceMaxInput.value); // Récupérer la valeur du prix maximum
            const selectedNeighborhoods = selectedNeighborhood ? [selectedNeighborhood] : Array.from(document.querySelectorAll('#neighborhoods input:checked')).map(input => input.value); // Récupérer les arrondissements sélectionnés

            // Filtrer les données en fonction des filtres sélectionnés
            const filteredData = data.filter(item => {
                return (roomType === 'all' || item.room_type === roomType) &&
                       item.price >= minPrice && item.price <= maxPrice &&
                       (selectedNeighborhoods.length === 0 || selectedNeighborhoods.includes(item.neighbourhood));
            });

            // Mettre à jour les graphiques avec les données filtrées
            updateRoomTypeCountChart(filteredData);
            updateAveragePriceChart(filteredData);
            updateNeighborhoodChart(filteredData);
            updatePriceDistributionChart(filteredData);
            updatePriceScatterPlot(filteredData);
            updateMap(filteredData);
        }

        // Fonction pour mettre à jour le graphique du nombre de logements par type de chambre
        function updateRoomTypeCountChart(data) {
            const roomTypes = [...new Set(data.map(item => item.room_type))]; // Récupérer les types de chambres uniques
            const counts = roomTypes.map(type => data.filter(item => item.room_type === type).length); // Compter le nombre de logements pour chaque type de chambre

            const trace = {
                x: roomTypes,
                y: counts,
                type: 'bar',
                text: counts,
                textposition: 'outside',
                marker: {
                    color: roomTypes.map(type => (type === selectedRoomType ? '#ff5a5f' : '#ff5a5f')) // Couleur des barres
                }
            };

            const layout = {
                title: 'Nombre de logements par type de chambre',
                xaxis: { title: 'Type de chambre' },
                yaxis: { title: 'Nombre de logements' }
            };

            const config = {
                modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'], // Retirer les boutons de la barre de menu
                displaylogo: false // Ne pas afficher le logo Plotly
            };

            Plotly.newPlot('roomTypeCountChart', [trace], layout, config);

            // Ajouter l'événement plotly_click
            document.getElementById('roomTypeCountChart').on('plotly_click', function (event) {
                const clickedRoomType = event.points[0].x;

                // Si l'élément cliqué est déjà sélectionné, désélectionner
                if (selectedRoomType === clickedRoomType) {
                    selectedRoomType = null; // Réinitialiser la sélection
                    roomTypeSelect.value = 'all'; // Réinitialiser le filtre dans la zone de filtres
                } else {
                    selectedRoomType = clickedRoomType; // Mettre à jour la sélection
                    roomTypeSelect.value = selectedRoomType; // Mettre à jour la zone de filtres
                }

                updateGraphs(listings); // Mettre à jour les graphiques
            });
        }

        // Fonction pour mettre à jour le graphique du prix moyen par type de chambre
        function updateAveragePriceChart(data) {
            const roomTypes = [...new Set(data.map(item => item.room_type))]; // Récupérer les types de chambres uniques
            const averagePrices = roomTypes.map(type => {
                const filtered = data.filter(item => item.room_type === type);
                const total = filtered.reduce((sum, item) => sum + item.price, 0);
                return total / filtered.length; // Calculer le prix moyen pour chaque type de chambre
            });

            const trace = {
                x: roomTypes,
                y: averagePrices,
                type: 'bar',
                text: averagePrices.map(price => price.toFixed(2)),
                textposition: 'outside',
                marker: {
                    color: '#ff5a5f' // Couleur constante pour toutes les barres
                }
            };

            const layout = {
                title: 'Prix moyen par type de chambre',
                xaxis: { title: 'Type de chambre' },
                yaxis: { title: 'Prix moyen (€)' }
            };

            const config = {
                modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'], // Retirer les boutons de la barre de menu
                displaylogo: false // Ne pas afficher le logo Plotly
            };

            Plotly.newPlot('averagePriceChart', [trace], layout, config);

            // Ajouter l'événement plotly_click
            document.getElementById('averagePriceChart').on('plotly_click', function (event) {
                const clickedRoomType = event.points[0].x;

                // Si l'élément cliqué est déjà sélectionné, désélectionner
                if (selectedRoomType === clickedRoomType) {
                    selectedRoomType = null; // Réinitialiser la sélection
                    roomTypeSelect.value = 'all'; // Réinitialiser le filtre dans la zone de filtres
                } else {
                    selectedRoomType = clickedRoomType; // Mettre à jour la sélection
                    roomTypeSelect.value = selectedRoomType; // Mettre à jour la zone de filtres
                }

                updateGraphs(data); // Mettre à jour les graphiques
            });
        }

        // Fonction pour mettre à jour le graphique du nombre de logements par arrondissement
        function updateNeighborhoodChart(data) {
            const neighborhoods = [...new Set(data.map(item => item.neighbourhood))]; // Récupérer les arrondissements uniques
            const counts = neighborhoods.map(neighborhood => data.filter(item => item.neighbourhood === neighborhood).length); // Compter le nombre de logements pour chaque arrondissement

            const trace = {
                x: neighborhoods,
                y: counts,
                type: 'bar',
                text: counts,
                textposition: 'outside',
                marker: {
                    color: '#ff5a5f' // Couleur par défaut
                }
            };

            const layout = {
                title: 'Nombre de logements par arrondissement',
                xaxis: { title: 'Arrondissement' },
                yaxis: { title: 'Nombre de logements' }
            };

            const config = {
                modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'], // Retirer les boutons de la barre de menu
                displaylogo: false // Ne pas afficher le logo Plotly
            };

            Plotly.newPlot('neighborhoodChart', [trace], layout, config);

            // Ajouter l'événement plotly_click
            document.getElementById('neighborhoodChart').on('plotly_click', function (event) {
                const clickedNeighborhood = event.points[0].x;

                // Si l'élément cliqué est déjà sélectionné, désélectionner
                if (selectedNeighborhood === clickedNeighborhood) {
                    selectedNeighborhood = null; // Réinitialiser la sélection
                } else {
                    selectedNeighborhood = clickedNeighborhood; // Mettre à jour la sélection
                }

                updateGraphs(listings); // Mettre à jour les graphiques
            });
        }

        // Fonction pour mettre à jour le graphique de la distribution des prix
        function updatePriceDistributionChart(data) {
            const prices = data.map(item => item.price); // Récupérer les prix des logements

            const trace = {
                x: prices,
                type: 'histogram',
                marker: {
                    color: '#ff5a5f' // Couleur des barres
                }
            };

            const layout = {
                title: 'Distribution des prix',
                xaxis: { title: 'Prix (€)' },
                yaxis: { title: 'Nombre de logements' }
            };

            const config = {
                modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'], // Retirer les boutons de la barre de menu
                displaylogo: false // Ne pas afficher le logo Plotly
            };

            Plotly.newPlot('priceDistributionChart', [trace], layout, config);
        }

        // Fonction pour mettre à jour le graphique des prix par nombre d'avis
        function updatePriceScatterPlot(data) {
            const trace = {
                x: data.map(item => item.price), // Récupérer les prix des logements
                y: data.map(item => item.number_of_reviews), // Récupérer le nombre d'avis des logements
                mode: 'markers',
                type: 'scatter',
                text: data.map(item => item.name), // Récupérer les noms des logements pour les infobulles
                marker: { size: 12, color: '#ff5a5f' } // Couleur et taille des points
            };

            const layout = {
                title: 'Prix par nombre d\'avis',
                xaxis: { title: 'Prix (€)' },
                yaxis: { title: 'Nombre d\'avis' }
            };

            const config = {
                modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'], // Retirer les boutons de la barre de menu
                displaylogo: false // Ne pas afficher le logo Plotly
            };

            Plotly.newPlot('priceScatterPlot', [trace], layout, config);
        }

        // Fonction pour mettre à jour la carte des logements
        function updateMap(data) {
            const trace = {
                type: 'scattermapbox',
                lat: data.map(item => item.latitude), // Récupérer les latitudes des logements
                lon: data.map(item => item.longitude), // Récupérer les longitudes des logements
                mode: 'markers',
                marker: { size: 9, color: '#ff5a5f' }, // Couleur et taille des points
                text: data.map(item => `Nom: ${item.name}<br>Hôte: ${item.host_name}<br>Type: ${item.room_type}`) // Infobulles avec le nom, l'hôte et le type de logement
            };

            const layout = {
                mapbox: {
                    style: 'open-street-map',
                    center: { lat: 48.8566, lon: 2.3522 }, // Centrer la carte sur Paris
                    zoom: 10
                },
                title: 'Carte des logements'
            };

            Plotly.newPlot('map', [trace], layout); // La carte conserve toutes les options de la barre de menu
        }

        // Charger les données initiales et mettre à jour les graphiques
        updateGraphs(listings);
    }

    // Fonction pour remplir les cases à cocher des arrondissements
    function populateNeighborhoods(listings) {
        const neighborhoods = [...new Set(listings.map(item => item.neighbourhood))]; // Récupérer les arrondissements uniques
        const neighborhoodsContainer = document.getElementById('neighborhoods'); // Conteneur pour les cases à cocher

        neighborhoods.forEach(neighborhood => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = neighborhood;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(neighborhood));
            neighborhoodsContainer.appendChild(label); // Ajouter les cases à cocher au conteneur
        });
    }
});