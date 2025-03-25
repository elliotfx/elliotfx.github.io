const loadJSON = async (url) => {
    const response = await fetch(url);
    return response.json();
  };
  
  const loadXLSX = async (url) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  };
  
  const main = async () => {
    try {
      const [geojsonData, xlsxData] = await Promise.all([
        loadJSON("./../data/arr.geojson"),
        loadXLSX("./../data/data.xlsx")
      ]);
  
      const apartmentCount = {};
      const appartementSommePrix = {};
      const entireHomeCount = {};
  
      xlsxData.forEach(({ neighbourhood, price, room_type }) => {
        const prix = parseFloat(price);
        if (neighbourhood) {
          apartmentCount[neighbourhood] = (apartmentCount[neighbourhood] || 0) + 1;
          if (prix) {
            appartementSommePrix[neighbourhood] = (appartementSommePrix[neighbourhood] || 0) + prix;
          }
          if (room_type === "Entire home/apt") {
            entireHomeCount[neighbourhood] = (entireHomeCount[neighbourhood] || 0) + 1;
          }
        }
      });
  
      const appartementMoyenne = Object.keys(apartmentCount).reduce((acc, neighbourhood) => {
        if (appartementSommePrix[neighbourhood]) {
          acc[neighbourhood] = Math.round((appartementSommePrix[neighbourhood] / apartmentCount[neighbourhood]) * 100) / 100;
        }
        return acc;
      }, {});
  
      console.log("Prix moyen par arrondissement (arrondi) :", appartementMoyenne);
      console.log("Nombre de logements entiers par arrondissement :", entireHomeCount);
  
      const initialData = {
        type: "choropleth",
        geojson: geojsonData,
        locations: Object.keys(apartmentCount),
        z: Object.values(apartmentCount),
        colorscale: "YlOrRd",
        reversescale: true,
        marker: { line: { width: 0.5, color: "black" } },
        featureidkey: "properties.neighbourhood"
      };
  
      const layoutMap = {
        autosize: true,
        margin: { l: 0, r: 0, t: 50, b: 0 },
        title: {
          text: "Nombre de logements par arrondissement",
          font: { size: 20, family: "Arial, sans-serif" },
          x: 0.5,
          y: 0.98
        },
        geo: {
          domain: { x: [0, 1], y: [0, 1] },
          center: { lat: 48.8566, lon: 2.3522 },
          projection: { type: "mercator", scale: 1000 },
          showframe: false,
          showcountries: false
        }
      };
  
      Plotly.newPlot("map", [initialData], layoutMap);
  
      const nbapp = {
        x: Object.keys(apartmentCount),
        y: Object.values(apartmentCount),
        type: "bar",
        name: "Nombre appartement",
        marker: { color: "#008F7A" }
      };
  
      const moy = {
        x: Object.keys(appartementMoyenne),
        y: Object.values(appartementMoyenne),
        type: "scatter",
        mode: "lines+markers",
        name: "Prix moyen",
        yaxis: "y2",
        line: { color: "#ff5a5f" },
        marker: { size: 8 }
      };
  
      const layoutGraph = {
        title: "Prix moyen en fonction du nombre d'appartements par arrondissement",
        width: document.getElementById("appmoy").clientWidth * 0.95,
        height: 450,
        margin: {
          l: 50,
          r: 30,
          t: 80,
          b: 120
        },
        xaxis: {
          title: "Arrondissement",
          tickangle: -45,
          tickfont: { size: 10 },
          automargin: true
        },
        yaxis: {
          title: "Nombre d'appartements",
          side: "left",
          automargin: true
        },
        yaxis2: {
          title: "Prix moyen (€)",
          overlaying: "y",
          side: "right",
          automargin: true
        }
      };
  
      Plotly.newPlot("appmoy", [nbapp, moy], layoutGraph);
  
      const updateMap = (selectedStat) => {
        let zData, colorscale, title;
        switch (selectedStat) {
          case "nb_logements":
            zData = Object.values(apartmentCount);
            colorscale = "YlOrRd";
            title = "Nombre de logements par arrondissement";
            break;
          case "prix_moyen":
            zData = Object.values(appartementMoyenne);
            colorscale = "Blues";
            title = "Prix moyen des appartements par arrondissement";
            break;
          case "part_entier":
            zData = Object.values(entireHomeCount);
            colorscale = "Greens";
            title = "Nombre de logements entiers par arrondissement";
            break;
          default:
            return;
        }
        Plotly.update("map", { z: [zData], colorscale }, { title });
      };
  
      document.getElementById("choixStat").addEventListener("change", (event) => {
        updateMap(event.target.value);
      });
  
    } catch (error) {
      console.error("Erreur de chargement des fichiers:", error);
    }
  };
  
  main();