// --------------------------------------
// Variables globales
// --------------------------------------
let rawDataGlobal    = [];
let depGeoJsonGlobal = null;
let allTeams         = new Set();
let allTypes         = new Set();
let allCategories    = new Set();
let maxKm            = 0;

// --------------------------------------
// 1) Chargement du CSV et du GeoJSON
// --------------------------------------
Promise.all([
  d3.dsv(";", "../images/datamatch.csv"),
  fetch("../images/dep.geojson").then(resp => resp.json())
])
  .then(([rawData, depGeoJson]) => {
    depGeoJsonGlobal = depGeoJson;

    // 2) On « nettoie » les clés / convertit en numérique
    rawDataGlobal = rawData.map(row => {
      const cleanRow = {};
      Object.keys(row).forEach(key => {
        cleanRow[key.trim()] = row[key].trim();
      });

      cleanRow.Latitude  = +cleanRow.Latitude;
      cleanRow.Longitude = +cleanRow.Longitude;
      cleanRow.km = parseFloat((cleanRow.km || "0").replace(",", "."));

      allTypes.add(cleanRow.Type.trim());
      allCategories.add(cleanRow.Categorie.trim());
      allTeams.add(cleanRow["Equipe 1"].trim());
      allTeams.add(cleanRow["Equipe 2"].trim());

      if (!isNaN(cleanRow.km) && cleanRow.km > maxKm) {
        maxKm = cleanRow.km;
      }
      return cleanRow;
    });

    // 3) On initialise les filtres et on dessine la carte + stats
    initFilters();
    updateMap();
  })
  .catch(err => console.error("Erreur chargement des données :", err));

// --------------------------------------
// 2) Initialisation des filtres
// --------------------------------------
function initFilters() {
  const typeFilter     = document.getElementById("typeFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const categorySearch = document.getElementById("categorySearch");
  const teamFilter     = document.getElementById("teamFilter");
  const teamSearch     = document.getElementById("teamSearch");
  const kmSlider       = document.getElementById("kmSlider");
  const kmValue        = document.getElementById("kmValue");

  // 2.1) Filtre TYPE
  Array.from(allTypes)
    .sort()
    .forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.text  = t;
      typeFilter.appendChild(opt);
    });
  Array.from(typeFilter.options).forEach(o => (o.selected = true));
  typeFilter.addEventListener("change", updateMap);

  // 2.2) Filtre CATÉGORIE + recherche
  function populateCategoryOptions(filterText = "") {
    categoryFilter.innerHTML = "";
    const txt = filterText.trim().toLowerCase();
    Array.from(allCategories)
      .filter(cat => cat.toLowerCase().includes(txt))
      .sort()
      .forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.text  = cat;
        categoryFilter.appendChild(opt);
      });
    Array.from(categoryFilter.options).forEach(o => (o.selected = true));
  }
  populateCategoryOptions();
  categoryFilter.addEventListener("change", updateMap);
  categorySearch.addEventListener("input", () => {
    populateCategoryOptions(categorySearch.value);
    updateMap();
  });

  // 2.3) Filtre KM
  kmSlider.min = 0;
  kmSlider.max = Math.ceil(maxKm || 100);
  kmSlider.value = kmSlider.max;
  kmValue.textContent = kmSlider.value;
  kmSlider.addEventListener("input", () => {
    kmValue.textContent = kmSlider.value;
    updateMap();
  });

  // 2.4) Filtre ÉQUIPE + recherche
  function populateTeamOptions(filterText = "") {
    teamFilter.innerHTML = "";
    const txt = filterText.trim().toLowerCase();
    Array.from(allTeams)
      .filter(team => team.toLowerCase().includes(txt))
      .sort()
      .forEach(team => {
        const opt = document.createElement("option");
        opt.value = team;
        opt.text  = team;
        teamFilter.appendChild(opt);
      });
    Array.from(teamFilter.options).forEach(o => (o.selected = true));
  }
  populateTeamOptions();
  teamFilter.addEventListener("change", updateMap);
  teamSearch.addEventListener("input", () => {
    populateTeamOptions(teamSearch.value);
    updateMap();
  });
}

// --------------------------------------
// 3) Mise à jour de la carte + stats
// --------------------------------------
function updateMap() {
  // 3.1) On récupère les sélections
  const selectedTypes = Array.from(
    document.getElementById("typeFilter").selectedOptions
  ).map(o => o.value);

  const selectedCats = Array.from(
    document.getElementById("categoryFilter").selectedOptions
  ).map(o => o.value);

  const kmLimit = parseFloat(document.getElementById("kmSlider").value);

  const selectedTeams = Array.from(
    document.getElementById("teamFilter").selectedOptions
  ).map(o => o.value);

  // 3.2) On filtre rawDataGlobal
  const filteredData = rawDataGlobal.filter(r => {
    const typeOk = selectedTypes.includes(r.Type.trim());
    const catOk = selectedCats.includes(r.Categorie.trim());
    const kmOk = !isNaN(r.km) && r.km <= kmLimit;
    const teamOk =
      selectedTeams.includes(r["Equipe 1"].trim()) ||
      selectedTeams.includes(r["Equipe 2"].trim());
    return typeOk && catOk && kmOk && teamOk;
  });

  // 3.3) On regroupe par lieu (uniquement) pour cumuler tous les matchs au même endroit
  const grouped = {};
  filteredData.forEach(row => {
    const lieu = row["Lieu"].trim();
    const lat = row.Latitude;
    const lon = row.Longitude;
    const key = `${lieu}__${lat}__${lon}`; // clé = lieu + lat + lon

    if (!grouped[key]) {
      grouped[key] = {
        lieu,
        lat,
        lon,
        matches: []
      };
    }
    grouped[key].matches.push(row);
  });

  // 3.4) Construction des traces scattermapbox
  const pointTraces = Object.values(grouped).map(item => {
    // Choisir la couleur en fonction du PREMIER match trouvé
    const firstMatch = item.matches[0];
    const color = (firstMatch.Type || "").toLowerCase() === "5x5" ? "green" : "red";

    // Construire le texte au survol (popup)
    let hoverText = `<b>${item.lieu}</b><br>`;
    hoverText += `Nombre de matchs : ${item.matches.length}<br>`;

    // Reconstruction de l'URL “Voir détails” avec tous les filtres en cours
    const teamsParamSet = Array.from(
      document.getElementById("teamFilter").selectedOptions
    )
      .map(o => encodeURIComponent(o.value))
      .join(",");
    const kmVal = document.getElementById("kmSlider").value;
    const typesParam = Array.from(
      document.getElementById("typeFilter").selectedOptions
    )
      .map(o => encodeURIComponent(o.value))
      .join(",");
    const catsParam = Array.from(
      document.getElementById("categoryFilter").selectedOptions
    )
      .map(o => encodeURIComponent(o.value))
      .join(",");

    const url =
      `detail.html?lieu=${encodeURIComponent(item.lieu)}` +
      `&teams=${teamsParamSet}` +
      `&km=${kmVal}` +
      `&types=${typesParam}` +
      `&categories=${catsParam}`;

    hoverText += `
      <a href="${url}" target="_blank"
         style="
           display: inline-block;
           margin-top: 8px;
           padding: 6px 10px;
           background: #fff;
           color: #007bff;
           border: 1px solid #007bff;
           border-radius: 4px;
           font-size: 12px;
           text-decoration: none;
         ">
        Voir détails
      </a>
    `;

    return {
      type: "scattermapbox",
      lat: [item.lat],
      lon: [item.lon],
      mode: "markers",
      marker: {
        size: 14,
        color: color,
        symbol: "circle"
      },
      hoverinfo: "text",
      hovertext: hoverText,
      showlegend: false
    };
  });

  // 3.5) Trace des départements (initialisation la première fois)
  if (!updateMap.deptTrace) {
    const NA_CODES = new Set([
      "16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"
    ]);
    const naFeatures = depGeoJsonGlobal.features.filter(f => {
      const code =
        f.properties.code ||
        f.properties.code_dep ||
        f.properties.codeDepartement;
      return code && NA_CODES.has(String(code).padStart(2, "0"));
    });
    const naGeoJson = { type: "FeatureCollection", features: naFeatures };

    updateMap.deptTrace = {
      type: "choroplethmapbox",
      geojson: naGeoJson,
      locations: naGeoJson.features.map(f => f.properties.nom),
      z: naGeoJson.features.map(_ => 1),
      featureidkey: "properties.nom",
      showscale: false,
      colorscale: [[0, "beige"], [1, "beige"]],
      marker: { line: { width: 1, color: "#777" } },
      hoverinfo: "none"
    };

    updateMap.layout = {
      title: "",
        hovermode: 'closest',    // la bulle reste tant que la souris est sur le point
        hoverdistance: 60,       // distance en pixels pour rester « actif »
        spikedistance: 60,
      mapbox: {
        style: "white-bg",
        center: { lat: 45.5, lon: 0.0 },
        zoom: 6,
        bgcolor: "#1e90ff"
      },
      margin: { l: 0, r: 0, t: 0, b: 0 },
      showlegend: false
    };

    Plotly.newPlot(
      "map",
      [updateMap.deptTrace, ...pointTraces],
      updateMap.layout,
      { responsive: true }
    );
  } else {
    // 3.6) Mise à jour des points (restyle)
    const update = {
      lat: pointTraces.map(t => t.lat),
      lon: pointTraces.map(t => t.lon),
      "marker.color": pointTraces.map(t => t.marker.color),
      hovertext: pointTraces.map(t => t.hovertext)
    };
    Plotly.restyle(
      "map",
      update,
      Array.from({ length: pointTraces.length }, (_, i) => i + 1)
    );
    const existingLayers = Plotly.d3.select("#map").data()?.[0]?.length - 1;
    if (pointTraces.length !== existingLayers) {
      Plotly.newPlot(
        "map",
        [updateMap.deptTrace, ...pointTraces],
        updateMap.layout,
        { responsive: true }
      );
    }
  }

  // 4) Mise à jour des graphiques de statistiques
  updateStatsCharts(filteredData);
}

// --------------------------------------
// 4) Mise à jour des graphiques de statistiques
// --------------------------------------
function updateStatsCharts(filteredData) {
  // 4.1) Total des kilomètres
  const totalKm = filteredData.reduce((sum, r) => sum + (r.km || 0), 0);
  document.getElementById("totalKm").textContent = `${totalKm.toFixed(1)} km`;

  // 4.2) Calcul des fréquences
  const teamCounts = {};
  const categoryCounts = {};
  const coRefCounts = {};

  filteredData.forEach(r => {
    const eq1 = r["Equipe 1"].trim();
    const eq2 = r["Equipe 2"].trim();
    teamCounts[eq1] = (teamCounts[eq1] || 0) + 1;
    teamCounts[eq2] = (teamCounts[eq2] || 0) + 1;

    const cat = r.Categorie.trim();
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    const a1 = r["Nom arbitre 1"].trim();
    const a2 = r["Nom arbitre 2"].trim();
    if (
      a1.toLowerCase() === "feroux elliot" &&
      a2.toLowerCase() !== "feroux elliot"
    ) {
      coRefCounts[a2] = (coRefCounts[a2] || 0) + 1;
    }
    if (
      a2.toLowerCase() === "feroux elliot" &&
      a1.toLowerCase() !== "feroux elliot"
    ) {
      coRefCounts[a1] = (coRefCounts[a1] || 0) + 1;
    }
  });

  // 4.3) Préparer les données pour les graphiques
  const teamPairs = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]);
  const teamNames = teamPairs.map(p => p[0]);
  const teamFreqs = teamPairs.map(p => p[1]);

  const categoryPairs = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const catNames = categoryPairs.map(p => p[0]);
  const catFreqs = categoryPairs.map(p => p[1]);

  const coRefPairs = Object.entries(coRefCounts).sort((a, b) => b[1] - a[1]);
  const refNames = coRefPairs.map(p => p[0]);
  const refFreqs = coRefPairs.map(p => p[1]);

  // 4.4) Layout commun
  const commonLayout = {
    font: { family: "Kanit, Arial, sans-serif", size: 13, color: "#333" },
    margin: { l: 60, r: 20, t: 40, b: 80 },
    height: 350,
    paper_bgcolor: "white",
    plot_bgcolor: "white",
    xaxis: {
      tickangle: -45,
      automargin: true,
      tickfont: { size: 11 },
      title: { text: "", standoff: 10 }
    },
    yaxis: {
      automargin: true,
      tickfont: { size: 12 },
      title: { text: "Nombre de matchs", standoff: 10 }
    }
  };

  // 4.5) Graphique “Équipes les plus arbitrées”
  Plotly.newPlot(
    "teamChart",
    [
      {
        x: teamNames,
        y: teamFreqs,
        type: "bar",
        marker: {
          color: "#1f77b4",
          line: { width: 1, color: "#ffffff" }
        },
        hovertemplate: "%{x}<br>%{y} match(s)<extra></extra>"
      }
    ],
    {
      ...commonLayout,
      title: { text: "Équipes les plus arbitrées", font: { size: 18 } },
      xaxis: {
        ...commonLayout.xaxis,
        title: { text: "Équipes", standoff: 15 }
      }
    },
    { responsive: true }
  );

  // 4.6) Graphique “Catégories les plus arbitrées”
  Plotly.newPlot(
    "categoryChart",
    [
      {
        x: catNames,
        y: catFreqs,
        type: "bar",
        marker: {
          color: "#ff7f0e",
          line: { width: 1, color: "#ffffff" }
        },
        hovertemplate: "%{x}<br>%{y} match(s)<extra></extra>"
      }
    ],
    {
      ...commonLayout,
      title: { text: "Catégories les plus arbitrées", font: { size: 18 } },
      xaxis: {
        ...commonLayout.xaxis,
        title: { text: "Catégories", standoff: 15 }
      }
    },
    { responsive: true }
  );

  // 4.7) Graphique “Arbitres co-officiant avec ‘FEROUX Elliot’”
  Plotly.newPlot(
    "refereeChart",
    [
      {
        x: refNames,
        y: refFreqs,
        type: "bar",
        marker: {
          color: "#2ca02c",
          line: { width: 1, color: "#ffffff" }
        },
        hovertemplate: "%{x}<br>%{y} match(s)<extra></extra>"
      }
    ],
    {
      ...commonLayout,
      title: {
        text: "Arbitres ayant officié avec « FEROUX Elliot »",
        font: { size: 18 }
      },
      xaxis: {
        ...commonLayout.xaxis,
        title: { text: "Arbitres", standoff: 15 }
      }
    },
    { responsive: true }
  );
}
