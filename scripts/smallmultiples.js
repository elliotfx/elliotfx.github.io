// Charger le CSV avec fetch + PapaParse
fetch("../data/listings.csv")
  .then(response => response.text())
  .then(csvText => {
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    const dataRows = parsed.data;

    // Nettoyer les données utiles
    const dataFiltered = dataRows.map(r => ({
      arrondissement: r.neighbourhood,
      type: r.room_type
    })).filter(r => r.arrondissement && r.type);

    // Grouper les données par arrondissement et type
    const groupedData = {};
    dataFiltered.forEach(({ arrondissement, type }) => {
      if (!groupedData[arrondissement]) groupedData[arrondissement] = {};
      if (!groupedData[arrondissement][type]) groupedData[arrondissement][type] = 0;
      groupedData[arrondissement][type]++;
    });

    // Couleurs en dégradé de rose
    const colorMap = {
      "Entire home/apt": "#38ffda",   // rose vif
      "Private room": "#c0ff38",      // rose moyen
      "Shared room": "#7638ff",       // rose clair
      "Hotel room": "#ff385d"         // rose pastel
    };

    const traces = [];
    const arrondissements = Object.keys(groupedData);
    const cols = 6; // 6 graphes sur une ligne
    const numRows = Math.ceil(arrondissements.length / cols);

    arrondissements.forEach((arr, index) => {
      const typeCounts = groupedData[arr];
      const labels = Object.keys(typeCounts);
      const values = Object.values(typeCounts);
      const colors = labels.map(label => colorMap[label]);

      traces.push({
        type: "pie",
        labels: labels,
        values: values,
        hole: 0.4,
        domain: {
          row: Math.floor(index / cols),
          column: index % cols
        },
        name: arr,
        title: { text: arr },
        textinfo: "none",
        hoverinfo: "label+value+percent",
        marker: { colors: colors }
      });
    });

    const layout = {
      grid: { rows: numRows, columns: cols, pattern: 'independent' },
      height: 1000,
      width: document.getElementById("chart-container").offsetWidth * 0.9, // Largeur à 90%
      margin: { t: 150 },
      legend: {
        orientation: "h",
        x: 0.5,
        y: 1.1,
        xanchor: "center"
      }
    };

    Plotly.newPlot("chart-container", traces, layout);
  })
  .catch(error => {
    console.error("Erreur de chargement ou parsing CSV :", error);
  });
