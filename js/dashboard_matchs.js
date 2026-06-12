var DASHBOARD_STATE = {
    allMatches: [],
    filteredMatches: [],
    charts: {
        timeline: null,
        competition: null,
        travel: null,
        competitionKm: null
    },
    map: {
        tooltipNode: null,
        areaCache: {},
        activeAreaCode: ""
    }
};

var CHART_WARNING_SHOWN = false;
var TIME_GRANULARITY = {
    month: { label: "mensuelle" },
    quarter: { label: "trimestrielle" },
    year: { label: "annuelle" }
};

var REGION_BY_DEPARTMENT = {
    "01": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "02": { code: "32", name: "Hauts-de-France" },
    "03": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "04": { code: "93", name: "Provence-Alpes-Cote d'Azur" },
    "05": { code: "93", name: "Provence-Alpes-Cote d'Azur" },
    "06": { code: "93", name: "Provence-Alpes-Cote d'Azur" },
    "07": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "08": { code: "44", name: "Grand Est" },
    "09": { code: "76", name: "Occitanie" },
    "10": { code: "44", name: "Grand Est" },
    "11": { code: "76", name: "Occitanie" },
    "12": { code: "76", name: "Occitanie" },
    "13": { code: "93", name: "Provence-Alpes-Cote d'Azur" },
    "14": { code: "28", name: "Normandie" },
    "15": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "16": { code: "75", name: "Nouvelle-Aquitaine" },
    "17": { code: "75", name: "Nouvelle-Aquitaine" },
    "18": { code: "24", name: "Centre-Val de Loire" },
    "19": { code: "75", name: "Nouvelle-Aquitaine" },
    "21": { code: "27", name: "Bourgogne-Franche-Comte" },
    "22": { code: "53", name: "Bretagne" },
    "23": { code: "75", name: "Nouvelle-Aquitaine" },
    "24": { code: "75", name: "Nouvelle-Aquitaine" },
    "25": { code: "27", name: "Bourgogne-Franche-Comte" },
    "26": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "27": { code: "28", name: "Normandie" },
    "28": { code: "24", name: "Centre-Val de Loire" },
    "29": { code: "53", name: "Bretagne" },
    "2A": { code: "94", name: "Corse" },
    "2B": { code: "94", name: "Corse" },
    "30": { code: "76", name: "Occitanie" },
    "31": { code: "76", name: "Occitanie" },
    "32": { code: "76", name: "Occitanie" },
    "33": { code: "75", name: "Nouvelle-Aquitaine" },
    "34": { code: "76", name: "Occitanie" },
    "35": { code: "53", name: "Bretagne" },
    "36": { code: "24", name: "Centre-Val de Loire" },
    "37": { code: "24", name: "Centre-Val de Loire" },
    "38": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "39": { code: "27", name: "Bourgogne-Franche-Comte" },
    "40": { code: "75", name: "Nouvelle-Aquitaine" },
    "41": { code: "24", name: "Centre-Val de Loire" },
    "42": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "43": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "44": { code: "52", name: "Pays de la Loire" },
    "45": { code: "24", name: "Centre-Val de Loire" },
    "46": { code: "76", name: "Occitanie" },
    "47": { code: "75", name: "Nouvelle-Aquitaine" },
    "48": { code: "76", name: "Occitanie" },
    "49": { code: "52", name: "Pays de la Loire" },
    "50": { code: "28", name: "Normandie" },
    "51": { code: "44", name: "Grand Est" },
    "52": { code: "44", name: "Grand Est" },
    "53": { code: "52", name: "Pays de la Loire" },
    "54": { code: "44", name: "Grand Est" },
    "55": { code: "44", name: "Grand Est" },
    "56": { code: "53", name: "Bretagne" },
    "57": { code: "44", name: "Grand Est" },
    "58": { code: "27", name: "Bourgogne-Franche-Comte" },
    "59": { code: "32", name: "Hauts-de-France" },
    "60": { code: "32", name: "Hauts-de-France" },
    "61": { code: "28", name: "Normandie" },
    "62": { code: "32", name: "Hauts-de-France" },
    "63": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "64": { code: "75", name: "Nouvelle-Aquitaine" },
    "65": { code: "76", name: "Occitanie" },
    "66": { code: "76", name: "Occitanie" },
    "67": { code: "44", name: "Grand Est" },
    "68": { code: "44", name: "Grand Est" },
    "69": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "70": { code: "27", name: "Bourgogne-Franche-Comte" },
    "71": { code: "27", name: "Bourgogne-Franche-Comte" },
    "72": { code: "52", name: "Pays de la Loire" },
    "73": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "74": { code: "84", name: "Auvergne-Rhone-Alpes" },
    "75": { code: "11", name: "Ile-de-France" },
    "76": { code: "28", name: "Normandie" },
    "77": { code: "11", name: "Ile-de-France" },
    "78": { code: "11", name: "Ile-de-France" },
    "79": { code: "75", name: "Nouvelle-Aquitaine" },
    "80": { code: "32", name: "Hauts-de-France" },
    "81": { code: "76", name: "Occitanie" },
    "82": { code: "76", name: "Occitanie" },
    "83": { code: "93", name: "Provence-Alpes-Cote d'Azur" },
    "84": { code: "93", name: "Provence-Alpes-Cote d'Azur" },
    "85": { code: "52", name: "Pays de la Loire" },
    "86": { code: "75", name: "Nouvelle-Aquitaine" },
    "87": { code: "75", name: "Nouvelle-Aquitaine" },
    "88": { code: "44", name: "Grand Est" },
    "89": { code: "27", name: "Bourgogne-Franche-Comte" },
    "90": { code: "27", name: "Bourgogne-Franche-Comte" },
    "91": { code: "11", name: "Ile-de-France" },
    "92": { code: "11", name: "Ile-de-France" },
    "93": { code: "11", name: "Ile-de-France" },
    "94": { code: "11", name: "Ile-de-France" },
    "95": { code: "11", name: "Ile-de-France" }
};

document.addEventListener("DOMContentLoaded", function () {
    initDashboard();
});

async function initDashboard() {
    ["season-filter", "competition-filter", "granularity-filter", "map-granularity-filter"].forEach(function (id) {
        var node = document.getElementById(id);
        if (node) {
            node.addEventListener("change", applyDashboardFilters);
        }
    });

    await loadCsvData();
}

async function loadCsvData() {
    try {
        setStatus("Chargement du fichier CSV...");

        var embeddedCsvText = resolveEmbeddedCsvText();
        if (looksLikeMatchCsv(embeddedCsvText)) {
            processCsvText(embeddedCsvText, "source locale embarquee");
            return;
        }

        var fetchedCsv = await fetchCsvFromKnownPaths();
        if (looksLikeMatchCsv(fetchedCsv.text)) {
            processCsvText(fetchedCsv.text, fetchedCsv.label);
            return;
        }

        throw new Error("aucune source de donnees exploitable n'a ete trouvee");
    } catch (error) {
        setStatus("Erreur de chargement automatique: " + error.message, true);
        setText("data-range", "Chargement automatique indisponible (" + error.message + ").");
    }
}

function resolveEmbeddedCsvText() {
    if (typeof window === "undefined") return "";

    if (typeof window.MATCHS_CSV_TEXT === "string" && window.MATCHS_CSV_TEXT.length > 0) {
        return window.MATCHS_CSV_TEXT;
    }

    if (typeof window.MATCHS_CSV_B64 === "string" && window.MATCHS_CSV_B64.length > 0) {
        return decodeBase64Utf8(window.MATCHS_CSV_B64);
    }

    return "";
}

async function fetchCsvFromKnownPaths() {
    var candidates = [
        { url: "../Convocations/matchs.csv", label: "fichier Convocations/matchs.csv" },
        { url: "./../Convocations/matchs.csv", label: "fichier Convocations/matchs.csv" }
    ];

    for (var i = 0; i < candidates.length; i++) {
        var text = await fetchTextBestEffort(candidates[i].url);
        if (looksLikeMatchCsv(text)) {
            return {
                text: text,
                label: candidates[i].label
            };
        }
    }

    return { text: "", label: "" };
}

async function fetchTextBestEffort(url) {
    if (!url) return "";

    var stamp = "v=" + Date.now();
    var urlWithStamp = url + (url.indexOf("?") === -1 ? "?" : "&") + stamp;

    if (typeof fetch === "function") {
        try {
            var response = await fetch(urlWithStamp, { cache: "no-store" });
            if (response && (response.ok || response.status === 0)) {
                return await response.text();
            }
        } catch (_) {
            // Fallback below.
        }
    }

    if (typeof XMLHttpRequest !== "undefined") {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", urlWithStamp, false);
            xhr.send(null);
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
                return xhr.responseText || "";
            }
        } catch (_) {
            return "";
        }
    }

    return "";
}

function decodeBase64Utf8(base64) {
    try {
        var binary = atob(base64);
        var bytes = new Uint8Array(binary.length);

        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        if (typeof TextDecoder !== "undefined") {
            return new TextDecoder("utf-8").decode(bytes);
        }

        var escaped = "";
        for (var j = 0; j < bytes.length; j++) {
            escaped += "%" + bytes[j].toString(16).padStart(2, "0");
        }

        return decodeURIComponent(escaped);
    } catch (_) {
        return "";
    }
}

function looksLikeMatchCsv(text) {
    return Boolean(text) && text.indexOf("arbitre_1_nom") !== -1 && text.indexOf("competition") !== -1;
}

function processCsvText(csvText, sourceLabel) {
    var rows = parseCsvRows(csvText);
    DASHBOARD_STATE.allMatches = buildElliotDataset(rows);

    if (!DASHBOARD_STATE.allMatches.length) {
        throw new Error("aucun match trouve pour Elliot FEROUX dans les donnees");
    }

    resetFilterOptions();
    populateFilters(DASHBOARD_STATE.allMatches);
    applyDashboardFilters();

    setStatus(DASHBOARD_STATE.allMatches.length + " convocations Elliot chargees (" + sourceLabel + ").");
}

function parseCsvRows(csvText) {
    var delimiter = detectCsvDelimiter(csvText);

    if (typeof Papa !== "undefined") {
        var parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            delimiter: delimiter
        });

        return parsed.data || [];
    }

    return parseCsvRowsManual(csvText, delimiter);
}

function detectCsvDelimiter(csvText) {
    var firstLine = (csvText || "").split(/\r?\n/, 1)[0] || "";
    var semicolons = (firstLine.match(/;/g) || []).length;
    var commas = (firstLine.match(/,/g) || []).length;
    return semicolons > commas ? ";" : ",";
}

function parseCsvRowsManual(csvText, delimiter) {
    var rows = [];
    var currentRow = [];
    var currentField = "";
    var inQuotes = false;

    for (var i = 0; i < csvText.length; i++) {
        var char = csvText[i];
        var nextChar = csvText[i + 1];

        if (inQuotes) {
            if (char === "\"") {
                if (nextChar === "\"") {
                    currentField += "\"";
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
            continue;
        }

        if (char === "\"") {
            inQuotes = true;
        } else if (char === delimiter) {
            currentRow.push(currentField);
            currentField = "";
        } else if (char === "\n") {
            currentRow.push(currentField);
            rows.push(currentRow);
            currentRow = [];
            currentField = "";
        } else if (char !== "\r") {
            currentField += char;
        }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    if (!rows.length) return [];

    var headers = rows[0].map(function (header) {
        return String(header || "").replace(/^\uFEFF/, "").trim();
    });

    return rows.slice(1).reduce(function (objects, row) {
        if (!row || !row.length) return objects;

        var obj = {};
        var hasValue = false;

        headers.forEach(function (key, index) {
            var value = row[index] !== undefined ? row[index] : "";
            if (String(value).trim() !== "") hasValue = true;
            obj[key] = value;
        });

        if (hasValue) {
            objects.push(obj);
        }

        return objects;
    }, []);
}

function resetFilterOptions() {
    var seasonFilter = document.getElementById("season-filter");
    var competitionFilter = document.getElementById("competition-filter");

    if (seasonFilter) {
        seasonFilter.innerHTML = "<option value=\"all\">Toutes les saisons</option>";
    }

    if (competitionFilter) {
        competitionFilter.innerHTML = "<option value=\"all\">Toutes les competitions</option>";
    }
}

function buildElliotDataset(rows) {
    var matches = [];

    rows.forEach(function (row) {
        for (var i = 1; i <= 5; i++) {
            var name = row["arbitre_" + i + "_nom"];
            if (!isElliotName(name)) continue;

            var dateObj = parseFrenchDate(row.date);
            var recevant = cleanText(row.groupe_sportif_recevant) || "-";
            var visiteur = cleanText(row.groupe_sportif_visiteur) || "-";
            var competition = cleanText(row.competition) || "Non renseignee";
            var hostClub = recevant !== "-" ? recevant : (visiteur !== "-" ? visiteur : competition);
            var rawSalle = cleanText(row.adresse_salle);
            var indemnity = parseNumber(row["arbitre_" + i + "_indemnite_eur"]);
            var km = parseNumber(row["arbitre_" + i + "_km"]);

            matches.push({
                dateRaw: cleanText(row.date),
                dateObj: dateObj,
                heure: cleanText(row.heure),
                timeMinutes: parseTimeToMinutes(row.heure),
                competition: competition,
                visiteur: visiteur,
                recevant: recevant,
                hostClub: hostClub,
                hostGroup: normalizeClubGroup(hostClub),
                salle: rawSalle || "-",
                addressKey: rawSalle ? normalizeAddressKey(rawSalle) : "",
                city: rawSalle ? extractCityFromAddress(rawSalle) : "",
                role: i,
                season: computeSeason(dateObj),
                indemnity: indemnity,
                indemnityKnown: indemnity !== null,
                km: km,
                kmKnown: km !== null
            });
            break;
        }
    });

    matches.sort(function (a, b) {
        var aTime = a.dateObj ? a.dateObj.getTime() : -Infinity;
        var bTime = b.dateObj ? b.dateObj.getTime() : -Infinity;
        if (aTime !== bTime) return aTime - bTime;

        var aMinutes = a.timeMinutes !== null ? a.timeMinutes : -1;
        var bMinutes = b.timeMinutes !== null ? b.timeMinutes : -1;
        return aMinutes - bMinutes;
    });

    return matches;
}

function isElliotName(value) {
    var normalized = normalizeText(value || "");
    return normalized.indexOf("feroux") !== -1 && normalized.indexOf("elliot") !== -1;
}

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeClubGroup(value) {
    return cleanText(value)
        .replace(/\s+-\s+\d+$/, "")
        .replace(/\s+\/\s+/g, "/")
        .trim() || "Club non renseigne";
}

function normalizeAddressKey(value) {
    return String(value || "")
        .trim()
        .replace(/\([^\)]*T[^\)]*\)/gi, "")
        .replace(/\(Telephone[^\)]*\)/gi, "")
        .replace("Rute ", "Route ")
        .replace("GYMNAZNE", "GYMNASE")
        .replace("GYMNAZIE", "GYMNASE")
        .replace("GYMNASSE", "GYMNASE")
        .replace("VOUQUEUIL-SOUS-BIARD", "VOUNEUIL-SOUS-BIARD")
        .replace("VOUQUEUIL", "VOUNEUIL")
        .replace("LOAURENT", "LAURENT")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[;,]+$/, "");
}

function extractCityFromAddress(value) {
    var address = normalizeAddressKey(value);
    var match = address.match(/\b\d{5}\s+([A-Za-z\u00C0-\u017F' -]+)\)?$/);
    return match ? cleanText(match[1]) : "";
}

function getVenueGeo(addressKey) {
    if (typeof window === "undefined" || !window.DASHBOARD_MATCHS_GEOCODE_CACHE || !addressKey) {
        return null;
    }

    return window.DASHBOARD_MATCHS_GEOCODE_CACHE[addressKey] || null;
}

function parseFrenchDate(value) {
    if (!value) return null;

    var parts = String(value).split("/");
    if (parts.length !== 3) return null;

    var day = Number(parts[0]);
    var month = Number(parts[1]);
    var year = Number(parts[2]);
    if (!day || !month || !year) return null;

    var dateObj = new Date(year, month - 1, day);
    return Number.isNaN(dateObj.getTime()) ? null : dateObj;
}

function parseTimeToMinutes(value) {
    if (!value) return null;

    var match = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    var hour = Number(match[1]);
    var minute = Number(match[2]);
    if (hour > 23 || minute > 59) return null;

    return hour * 60 + minute;
}

function parseNumber(value) {
    if (value === null || value === undefined) return null;

    var clean = String(value)
        .trim()
        .replace(/\s/g, "")
        .replace(",", ".")
        .replace("€", "");

    if (!clean) return null;

    var number = Number(clean);
    return Number.isFinite(number) ? number : null;
}

function computeSeason(dateObj) {
    if (!dateObj) return "Inconnue";

    var year = dateObj.getFullYear();
    var month = dateObj.getMonth() + 1;
    var startYear = month >= 8 ? year : year - 1;
    return startYear + "-" + (startYear + 1);
}

function populateFilters(matches) {
    var seasonFilter = document.getElementById("season-filter");
    var competitionFilter = document.getElementById("competition-filter");

    if (!seasonFilter || !competitionFilter) return;

    uniqueValues(matches.map(function (match) { return match.season; }))
        .sort(function (a, b) {
            return (Number(b.split("-")[0]) || 0) - (Number(a.split("-")[0]) || 0);
        })
        .forEach(function (season) {
            seasonFilter.appendChild(createOption(season, season));
        });

    uniqueValues(matches.map(function (match) { return match.competition; }))
        .sort(function (a, b) { return a.localeCompare(b, "fr"); })
        .forEach(function (competition) {
            competitionFilter.appendChild(createOption(competition, competition));
        });
}

function createOption(value, text) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    return option;
}

function uniqueValues(values) {
    return Array.from(new Set(values.filter(Boolean)));
}

function getSelectedGranularity() {
    var node = document.getElementById("granularity-filter");
    return node && TIME_GRANULARITY[node.value] ? node.value : "month";
}

function getSelectedMapGranularity() {
    var node = document.getElementById("map-granularity-filter");
    return node && node.value === "region" ? "region" : "department";
}

function applyDashboardFilters() {
    var seasonFilter = document.getElementById("season-filter");
    var competitionFilter = document.getElementById("competition-filter");

    if (!seasonFilter || !competitionFilter) return;

    var selectedSeason = seasonFilter.value;
    var selectedCompetition = competitionFilter.value;

    DASHBOARD_STATE.filteredMatches = DASHBOARD_STATE.allMatches.filter(function (match) {
        var seasonOk = selectedSeason === "all" || match.season === selectedSeason;
        var competitionOk = selectedCompetition === "all" || match.competition === selectedCompetition;
        return seasonOk && competitionOk;
    });

    updateDataRange(DASHBOARD_STATE.filteredMatches);
    updateKPIs(DASHBOARD_STATE.filteredMatches);
    updateCharts(DASHBOARD_STATE.filteredMatches);
    updateInsights(DASHBOARD_STATE.filteredMatches);
    renderMatchesTable(DASHBOARD_STATE.filteredMatches);
    updateMatchCount(DASHBOARD_STATE.filteredMatches);
}

function updateDataRange(matches) {
    if (!matches.length) {
        setText("data-range", "Aucune convocation sur ce filtre.");
        return;
    }

    var validDates = matches
        .map(function (match) { return match.dateObj; })
        .filter(Boolean)
        .sort(function (a, b) { return a - b; });

    if (!validDates.length) {
        setText("data-range", "Periode indisponible pour ce filtre.");
        return;
    }

    setText("data-range", "Periode analysee : " + formatDate(validDates[0]) + " -> " + formatDate(validDates[validDates.length - 1]));
}

function updateMatchCount(matches) {
    var countNode = document.getElementById("match-count");
    var kmNode = document.getElementById("km-summary");
    var count = matches.length;
    var matchesWithKm = matches.filter(function (match) { return match.kmKnown; });
    var totalKm = sumBy(matchesWithKm, function (match) { return match.km || 0; });

    if (countNode) {
        countNode.textContent = count + " match" + (count > 1 ? "s" : "") + " affiche" + (count > 1 ? "s" : "");
    }

    if (!kmNode) return;

    if (!count) {
        kmNode.textContent = "Aucun deplacement sur ce filtre";
        return;
    }

    if (!matchesWithKm.length) {
        kmNode.textContent = "Kilometrage non renseigne sur ce filtre";
        return;
    }

    kmNode.textContent = formatKm(totalKm, 0) + " cumules sur " + matchesWithKm.length + " match" + (matchesWithKm.length > 1 ? "s" : "");
}

function updateKPIs(matches) {
    var matchesWithKm = matches.filter(function (match) { return match.kmKnown; });
    var matchesWithIndemnity = matches.filter(function (match) { return match.indemnityKnown; });
    var totalKm = sumBy(matchesWithKm, function (match) { return match.km || 0; });
    var totalIndemnity = sumBy(matchesWithIndemnity, function (match) { return match.indemnity || 0; });
    var farthest = getFarthestMatch(matches);
    var latest = getLatestMatch(matches);

    setText("kpi-total-matches", String(matches.length));
    setText("kpi-total-km", formatKm(totalKm, 0));
    setText("kpi-avg-km", matchesWithKm.length ? formatKm(totalKm / matchesWithKm.length, 1) : "-");
    setText("kpi-max-km", farthest ? formatKm(farthest.km, 0) : "-");
    setText("kpi-total-indemnity", formatEuro(totalIndemnity));
    setText("kpi-avg-indemnity", matchesWithIndemnity.length ? formatEuro(totalIndemnity / matchesWithIndemnity.length) : "-");
    setText("kpi-competitions", String(uniqueValues(matches.map(function (match) { return match.competition; })).length));
    setText("kpi-km-coverage", matches.length ? Math.round((matchesWithKm.length / matches.length) * 100) + "%" : "0%");
    setText("kpi-last-match", latest ? formatDate(latest.dateObj) : "-");
}

function getLatestMatch(matches) {
    return matches
        .filter(function (match) { return match.dateObj; })
        .sort(function (a, b) { return b.dateObj - a.dateObj; })[0] || null;
}

function getFarthestMatch(matches) {
    return matches
        .filter(function (match) { return match.kmKnown; })
        .sort(function (a, b) {
            var delta = (b.km || 0) - (a.km || 0);
            if (delta !== 0) return delta;
            var bTime = b.dateObj ? b.dateObj.getTime() : -Infinity;
            var aTime = a.dateObj ? a.dateObj.getTime() : -Infinity;
            return bTime - aTime;
        })[0] || null;
}

function getMatchLabel(match) {
    if (!match) return "-";
    return match.hostClub || match.recevant || match.visiteur || match.salle || match.competition;
}

function updateCharts(matches) {
    renderMap(matches);

    if (typeof Chart === "undefined") {
        if (!CHART_WARNING_SHOWN) {
            CHART_WARNING_SHOWN = true;
            setStatus("Donnees chargees, mais Chart.js est indisponible. Les KPI, le tableau et la carte restent utilisables.", true);
        }
        return;
    }

    renderTimelineChart(matches);
    renderTravelChart(matches);
    renderCompetitionChart(matches);
    renderCompetitionKmChart(matches);
}

function renderTimelineChart(matches) {
    var canvas = document.getElementById("chart-timeline");
    if (!canvas) return;

    var granularity = getSelectedGranularity();
    var title = document.getElementById("timeline-title");
    if (title) {
        title.textContent = "Activite dans le temps - lecture " + TIME_GRANULARITY[granularity].label;
    }

    var buckets = buildTimeBuckets(matches, granularity);
    destroyChart("timeline");

    DASHBOARD_STATE.charts.timeline = new Chart(canvas, {
        type: "bar",
        data: {
            labels: buckets.map(function (bucket) { return bucket.label; }),
            datasets: [
                {
                    label: "Kilometres",
                    data: buckets.map(function (bucket) { return round2(bucket.totalKm); }),
                    backgroundColor: "rgba(246, 213, 150, 0.5)",
                    borderColor: "rgba(246, 213, 150, 0.95)",
                    borderWidth: 1,
                    borderRadius: 8,
                    yAxisID: "yKm"
                },
                {
                    label: "Matchs",
                    data: buckets.map(function (bucket) { return bucket.count; }),
                    type: "line",
                    borderColor: "rgba(250, 235, 215, 0.96)",
                    backgroundColor: "rgba(250, 235, 215, 0.16)",
                    pointRadius: 3,
                    pointHoverRadius: 4,
                    tension: 0.28,
                    yAxisID: "yMatches"
                },
                {
                    label: "Indemnites (EUR)",
                    data: buckets.map(function (bucket) { return round2(bucket.totalIndemnity); }),
                    type: "line",
                    borderColor: "#8bb9b0",
                    backgroundColor: "rgba(139, 185, 176, 0.18)",
                    pointRadius: 3,
                    pointHoverRadius: 4,
                    tension: 0.28,
                    yAxisID: "yEuro"
                }
            ]
        },
        options: getSharedChartOptions({
            interaction: {
                mode: "index",
                intersect: false
            },
            scales: {
                x: getAxisStyle(),
                yKm: getAxisStyle({
                    beginAtZero: true,
                    title: { display: true, text: "Kilometres" }
                }),
                yMatches: getAxisStyle({
                    beginAtZero: true,
                    position: "right",
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: "Matchs" }
                }),
                yEuro: getAxisStyle({
                    beginAtZero: true,
                    position: "right",
                    offset: true,
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: "EUR" }
                })
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterBody: function (items) {
                            if (!items || !items.length) return [];
                            var bucket = buckets[items[0].dataIndex];
                            if (!bucket || !bucket.topCompetitions.length) return [];

                            var lines = ["Competitions dominantes :"];
                            bucket.topCompetitions.slice(0, 4).forEach(function (entry) {
                                lines.push(entry.label + " : " + entry.count + " matchs");
                            });
                            return lines;
                        }
                    }
                }
            }
        })
    });
}

function buildTimeBuckets(matches, granularity) {
    var bucketMap = new Map();

    matches.forEach(function (match) {
        if (!match.dateObj) return;

        var bucket = getTimeBucket(match.dateObj, granularity);
        if (!bucketMap.has(bucket.key)) {
            bucketMap.set(bucket.key, {
                key: bucket.key,
                label: bucket.label,
                start: bucket.start,
                count: 0,
                totalKm: 0,
                totalIndemnity: 0,
                competitionCountMap: {}
            });
        }

        var entry = bucketMap.get(bucket.key);
        entry.count += 1;
        entry.totalKm += match.km || 0;
        entry.totalIndemnity += match.indemnity || 0;
        entry.competitionCountMap[match.competition] = (entry.competitionCountMap[match.competition] || 0) + 1;
    });

    return Array.from(bucketMap.values())
        .sort(function (a, b) { return a.start - b.start; })
        .map(function (entry) {
            entry.topCompetitions = Object.keys(entry.competitionCountMap)
                .map(function (label) {
                    return { label: label, count: entry.competitionCountMap[label] };
                })
                .sort(function (a, b) { return b.count - a.count; });
            return entry;
        });
}

function getTimeBucket(dateObj, granularity) {
    var year = dateObj.getFullYear();
    var month = dateObj.getMonth();

    if (granularity === "year") {
        return {
            key: String(year),
            label: String(year),
            start: new Date(year, 0, 1)
        };
    }

    if (granularity === "quarter") {
        var quarterIndex = Math.floor(month / 3);
        return {
            key: year + "-T" + (quarterIndex + 1),
            label: "T" + (quarterIndex + 1) + " " + year,
            start: new Date(year, quarterIndex * 3, 1)
        };
    }

    return {
        key: year + "-" + String(month + 1).padStart(2, "0"),
        label: new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(new Date(year, month, 1)),
        start: new Date(year, month, 1)
    };
}

function renderCompetitionChart(matches) {
    var canvas = document.getElementById("chart-competition");
    if (!canvas) return;

    var stats = aggregateCompetitionStats(matches);
    var topLimit = 7;
    var shaped = stats.slice(0, topLimit);

    if (stats.length > topLimit) {
        var otherEntries = stats.slice(topLimit);
        shaped.push({
            label: "Autres",
            count: sumBy(otherEntries, function (entry) { return entry.count; }),
            totalKm: sumBy(otherEntries, function (entry) { return entry.totalKm; }),
            totalIndemnity: sumBy(otherEntries, function (entry) { return entry.totalIndemnity; }),
            details: otherEntries
        });
    }

    destroyChart("competition");

    DASHBOARD_STATE.charts.competition = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: shaped.map(function (entry) { return entry.label; }),
            datasets: [{
                data: shaped.map(function (entry) { return entry.count; }),
                backgroundColor: [
                    "#f6d596",
                    "#d8bc8c",
                    "#bca57d",
                    "#8b9b9a",
                    "#6f8686",
                    "#557070",
                    "#395757",
                    "#243e3e"
                ],
                borderColor: "rgba(11, 22, 22, 0.95)",
                borderWidth: 2
            }]
        },
        options: getSharedChartOptions({
            plugins: {
                legend: {
                    display: true,
                    position: "bottom",
                    labels: { color: "rgba(250, 235, 215, 0.9)" }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            var entry = shaped[context.dataIndex];
                            var total = context.dataset.data.reduce(function (sum, current) { return sum + current; }, 0);
                            var percentage = total ? Math.round((entry.count / total) * 100) : 0;
                            return entry.label + " : " + entry.count + " matchs (" + percentage + "%)";
                        },
                        afterBody: function (items) {
                            if (!items || !items.length) return [];
                            var entry = shaped[items[0].dataIndex];
                            if (!entry) return [];

                            var lines = [
                                "Km cumules : " + formatKm(entry.totalKm || 0, 0),
                                "Indemnites : " + formatEuro(entry.totalIndemnity || 0)
                            ];

                            if (entry.details && entry.details.length) {
                                lines.push("Detail de l'agregat :");
                                entry.details.slice(0, 8).forEach(function (detail) {
                                    lines.push(detail.label + " : " + detail.count + " matchs");
                                });
                                if (entry.details.length > 8) {
                                    lines.push("+ " + (entry.details.length - 8) + " autres competitions");
                                }
                            }

                            return lines;
                        }
                    }
                }
            }
        })
    });
}

function renderTravelChart(matches) {
    var canvas = document.getElementById("chart-travel");
    if (!canvas) return;

    var clubs = aggregateClubStats(matches)
        .filter(function (club) { return club.kmKnownCount > 0; })
        .sort(function (a, b) {
            if (b.totalKm !== a.totalKm) return b.totalKm - a.totalKm;
            return b.matches - a.matches;
        })
        .slice(0, 10);

    destroyChart("travel");

    DASHBOARD_STATE.charts.travel = new Chart(canvas, {
        type: "bar",
        data: {
            labels: clubs.map(function (club) { return truncateLabel(club.clubLabel, 34); }),
            datasets: [
                {
                    label: "Km cumules",
                    data: clubs.map(function (club) { return round2(club.totalKm); }),
                    backgroundColor: "rgba(246, 213, 150, 0.58)",
                    borderColor: "rgba(246, 213, 150, 0.96)",
                    borderWidth: 1,
                    borderRadius: 10
                },
                {
                    label: "Km moyens",
                    data: clubs.map(function (club) { return round2(club.avgKm); }),
                    type: "line",
                    borderColor: "#8bb9b0",
                    backgroundColor: "rgba(139, 185, 176, 0.18)",
                    pointRadius: 3,
                    pointHoverRadius: 4,
                    tension: 0.25
                }
            ]
        },
        options: getSharedChartOptions({
            indexAxis: "y",
            interaction: {
                mode: "index",
                intersect: false
            },
            scales: {
                x: getAxisStyle({
                    beginAtZero: true,
                    title: { display: true, text: "Kilometres" }
                }),
                y: getAxisStyle()
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return (context.datasetIndex === 0 ? "Km cumules : " : "Km moyens : ")
                                + formatKm(context.raw || 0, context.datasetIndex === 0 ? 0 : 1);
                        },
                        afterBody: function (items) {
                            if (!items || !items.length) return [];
                            var club = clubs[items[0].dataIndex];
                            if (!club) return [];

                            var lines = [
                                "Matchs : " + club.matches,
                                "Indemnites : " + formatEuro(club.totalIndemnity),
                                "Salles utilisees : " + club.venues.length,
                                "Detail des lieux :"
                            ];

                            club.venues.slice(0, 6).forEach(function (venue) {
                                lines.push(formatVenueTooltipLabel(venue) + " - " + formatKm(venue.totalKm, 0) + " - " + venue.matches + " matchs");
                            });

                            if (club.venues.length > 6) {
                                lines.push("+ " + (club.venues.length - 6) + " autres lieux");
                            }

                            return lines;
                        }
                    }
                }
            }
        })
    });
}

function renderCompetitionKmChart(matches) {
    var canvas = document.getElementById("chart-competition-km");
    if (!canvas) return;

    var stats = aggregateCompetitionStats(matches)
        .filter(function (entry) { return entry.totalKm > 0; })
        .sort(function (a, b) {
            if (b.totalKm !== a.totalKm) return b.totalKm - a.totalKm;
            return b.count - a.count;
        })
        .slice(0, 10);

    destroyChart("competitionKm");

    DASHBOARD_STATE.charts.competitionKm = new Chart(canvas, {
        type: "bar",
        data: {
            labels: stats.map(function (entry) { return truncateLabel(entry.label, 34); }),
            datasets: [
                {
                    label: "Km cumules",
                    data: stats.map(function (entry) { return round2(entry.totalKm); }),
                    backgroundColor: "rgba(139, 185, 176, 0.55)",
                    borderColor: "rgba(139, 185, 176, 0.95)",
                    borderWidth: 1,
                    borderRadius: 10
                },
                {
                    label: "Km moyens",
                    data: stats.map(function (entry) { return round2(entry.avgKm); }),
                    type: "line",
                    borderColor: "#f6d596",
                    backgroundColor: "rgba(246, 213, 150, 0.18)",
                    pointRadius: 3,
                    pointHoverRadius: 4,
                    tension: 0.25
                }
            ]
        },
        options: getSharedChartOptions({
            indexAxis: "y",
            interaction: {
                mode: "index",
                intersect: false
            },
            scales: {
                x: getAxisStyle({
                    beginAtZero: true,
                    title: { display: true, text: "Kilometres" }
                }),
                y: getAxisStyle()
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return (context.datasetIndex === 0 ? "Km cumules : " : "Km moyens : ")
                                + formatKm(context.raw || 0, context.datasetIndex === 0 ? 0 : 1);
                        },
                        afterBody: function (items) {
                            if (!items || !items.length) return [];
                            var entry = stats[items[0].dataIndex];
                            if (!entry) return [];

                            return [
                                "Matchs : " + entry.count,
                                "Indemnites : " + formatEuro(entry.totalIndemnity),
                                "Dernier match : " + formatDate(entry.lastDate)
                            ];
                        }
                    }
                }
            }
        })
    });
}

function renderMap(matches) {
    var container = document.getElementById("venues-map");
    var caption = document.getElementById("map-caption");
    if (!container) return;

    var clubs = aggregateClubStats(matches);
    var anomalies = buildMapAnomalies(clubs);
    var granularity = getSelectedMapGranularity();
    var areaSummary = aggregateMapAreaStats(matches, granularity);
    var granularityLabel = granularity === "region" ? "région" : "département";
    renderMapAnomalies(anomalies);

    if (!matches.length) {
        if (caption) caption.textContent = "Aucun match sélectionné.";
        container.innerHTML = "<div class=\"choropleth-empty\">Aucune donnée à représenter sur ce filtre.</div>";
        return;
    }

    if (typeof d3 === "undefined" || !window.DASHBOARD_MATCHS_MAP_DATA) {
        container.innerHTML = "<div class=\"choropleth-empty\">Fond cartographique local indisponible. Les KPI et les anomalies restent visibles.</div>";
        if (caption) {
            caption.textContent = "Impossible de dessiner la choroplèthe locale sur cette page.";
        }
        return;
    }

    if (!areaSummary.areas.length) {
        container.innerHTML = "<div class=\"choropleth-empty\">Aucune zone cartographique exploitable n'a été trouvée sur ce filtre.</div>";
        if (caption) {
            caption.textContent = "Aucune zone exploitable en " + granularityLabel + " sur ce filtre.";
        }
        return;
    }

    renderChoroplethMap(container, areaSummary, granularity);

    if (caption) {
        caption.textContent = buildMapCaption(areaSummary, clubs.length, anomalies.length, granularityLabel);
    }
}

function buildMapCaption(areaSummary, clubCount, anomalyCount, granularityLabel) {
    var metricLabel = areaSummary.metricKey === "totalKm" ? "km cumulés" : "matchs";
    var parts = [
        "Lecture choroplèthe par " + granularityLabel + " sur les " + metricLabel,
        areaSummary.resolvedCount + " match" + (areaSummary.resolvedCount > 1 ? "s" : "") + " rattaché" + (areaSummary.resolvedCount > 1 ? "s" : "") + " à une zone",
        clubCount + " club" + (clubCount > 1 ? "s" : "") + " hôte" + (clubCount > 1 ? "s" : "")
    ];

    if (areaSummary.unresolvedCount > 0) {
        parts.push(areaSummary.unresolvedCount + " match" + (areaSummary.unresolvedCount > 1 ? "s" : "") + " hors zone");
    }

    if (anomalyCount > 0) {
        parts.push(anomalyCount + " anomalie" + (anomalyCount > 1 ? "s" : "") + " à vérifier");
    }

    return parts.join(" • ");
}

function renderChoroplethMap(container, areaSummary, granularity) {
    var mapData = getMapDataForGranularity(granularity);
    if (!mapData || !mapData.features || !mapData.features.length) {
        container.innerHTML = "<div class=\"choropleth-empty\">Fond cartographique local introuvable.</div>";
        return;
    }

    container.innerHTML = ""
        + "<div class=\"choropleth-stage\">"
        + "<div class=\"choropleth-overlay\">"
        + "<div class=\"choropleth-note\" id=\"choropleth-note\"></div>"
        + "<div class=\"choropleth-legend\" id=\"choropleth-legend\"></div>"
        + "</div>"
        + "<div class=\"choropleth-tooltip\" id=\"choropleth-tooltip\"></div>"
        + "</div>";

    var stage = container.querySelector(".choropleth-stage");
    var tooltip = container.querySelector("#choropleth-tooltip");
    var note = container.querySelector("#choropleth-note");
    var legend = container.querySelector("#choropleth-legend");
    DASHBOARD_STATE.map.tooltipNode = tooltip;

    var rect = container.getBoundingClientRect();
    var width = Math.max(rect.width - 36, 520);
    var height = Math.max(container.clientHeight - 36, 420);
    var svg = d3.select(stage)
        .insert("svg", ":first-child")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("role", "img")
        .attr("aria-label", "Carte choroplèthe des déplacements d'arbitrage");

    var projection = d3.geoMercator().fitSize([width, height], mapData);
    var path = d3.geoPath(projection);
    var entriesByCode = {};
    areaSummary.areas.forEach(function (entry) {
        entriesByCode[entry.code] = entry;
    });

    var metricMax = areaSummary.metricMax || 0;
    var colorScale = d3.scaleQuantize()
        .domain([0, metricMax > 0 ? metricMax : 1])
        .range(["#233131", "#2f4a48", "#446664", "#69928d", "#f6d596"]);

    svg.append("g")
        .selectAll("path")
        .data(mapData.features)
        .enter()
        .append("path")
        .attr("class", "choropleth-region")
        .attr("fill", function (feature) {
            var entry = entriesByCode[feature.properties.code];
            if (!entry) return "rgba(250, 235, 215, 0.08)";
            return colorScale(entry.metricValue);
        })
        .attr("opacity", function (feature) {
            return entriesByCode[feature.properties.code] ? 1 : 0.55;
        })
        .attr("d", path)
        .on("mousemove", function (event, feature) {
            var entry = entriesByCode[feature.properties.code] || null;
            showChoroplethTooltip(event, stage, tooltip, buildAreaTooltipHtml(feature, entry, areaSummary.metricKey));
            d3.select(this).classed("is-active", true);
        })
        .on("mouseleave", function () {
            hideChoroplethTooltip(tooltip);
            d3.select(this).classed("is-active", false);
        });

    if (granularity === "region" || areaSummary.areas.length <= 14) {
        svg.append("g")
            .selectAll("text")
            .data(mapData.features.filter(function (feature) {
                return Boolean(entriesByCode[feature.properties.code]);
            }))
            .enter()
            .append("text")
            .attr("x", function (feature) { return path.centroid(feature)[0]; })
            .attr("y", function (feature) { return path.centroid(feature)[1]; })
            .attr("text-anchor", "middle")
            .attr("font-size", granularity === "region" ? 13 : 11)
            .attr("font-weight", 600)
            .attr("fill", "#fff4e2")
            .attr("paint-order", "stroke")
            .attr("stroke", "rgba(7, 16, 16, 0.8)")
            .attr("stroke-width", 3)
            .style("pointer-events", "none")
            .text(function (feature) {
                return granularity === "region"
                    ? truncateLabel(feature.properties.nom, 16)
                    : feature.properties.code;
            });
    }

    renderChoroplethLegend(legend, areaSummary, colorScale);
    renderChoroplethNote(note, areaSummary, granularity);
}

function renderChoroplethLegend(container, areaSummary, colorScale) {
    if (!container) return;

    var domain = colorScale.domain();
    var steps = colorScale.range();
    var minValue = domain[0];
    var maxValue = domain[1];
    var labelMin = areaSummary.metricKey === "totalKm" ? formatKm(minValue, 0) : String(Math.round(minValue)) + " match";
    var labelMax = areaSummary.metricKey === "totalKm" ? formatKm(maxValue, 0) : String(Math.round(maxValue)) + " matchs";

    container.innerHTML = ""
        + "<strong>Intensité de la carte</strong>"
        + "<p>" + escapeHtml(areaSummary.metricKey === "totalKm" ? "Plus la zone est claire, plus les kilomètres cumulés sont élevés." : "Plus la zone est claire, plus le nombre de matchs est élevé.") + "</p>"
        + "<div class=\"choropleth-legend-scale\">"
        + steps.map(function (color) {
            return "<span class=\"choropleth-legend-swatch\" style=\"background:" + color + ";\"></span>";
        }).join("")
        + "</div>"
        + "<div class=\"choropleth-legend-labels\">"
        + "<span>" + escapeHtml(labelMin) + "</span>"
        + "<span>" + escapeHtml(labelMax) + "</span>"
        + "</div>";
}

function renderChoroplethNote(container, areaSummary, granularity) {
    if (!container) return;

    var topArea = areaSummary.topArea;
    if (!topArea) {
        container.innerHTML = "<strong>Lecture rapide</strong><p>Aucune zone saillante sur le filtre en cours.</p>";
        return;
    }

    var granularityLabel = granularity === "region" ? "Région dominante" : "Département dominant";
    var metricText = areaSummary.metricKey === "totalKm"
        ? formatKm(topArea.totalKm, 0) + " cumulés"
        : topArea.count + " matchs";

    container.innerHTML = ""
        + "<strong>" + escapeHtml(granularityLabel) + "</strong>"
        + "<p>" + escapeHtml(topArea.label) + " concentre " + escapeHtml(metricText) + ", sur " + topArea.count + " match" + (topArea.count > 1 ? "s" : "") + " et " + topArea.clubCount + " club" + (topArea.clubCount > 1 ? "s" : "") + " hôte" + (topArea.clubCount > 1 ? "s" : "") + ".</p>";
}

function showChoroplethTooltip(event, stage, tooltip, html) {
    if (!stage || !tooltip) return;

    tooltip.innerHTML = html;
    tooltip.classList.add("visible");

    var stageRect = stage.getBoundingClientRect();
    var offsetX = event.clientX - stageRect.left + 16;
    var offsetY = event.clientY - stageRect.top + 16;
    tooltip.style.left = Math.min(offsetX, Math.max(stageRect.width - 340, 20)) + "px";
    tooltip.style.top = Math.min(offsetY, Math.max(stageRect.height - 220, 20)) + "px";
}

function hideChoroplethTooltip(tooltip) {
    if (!tooltip) return;
    tooltip.classList.remove("visible");
}

function buildAreaTooltipHtml(feature, entry, metricKey) {
    if (!entry) {
        return ""
            + "<strong>" + escapeHtml(feature.properties.nom) + "</strong>"
            + "<p>Aucun match rattaché à cette zone sur le filtre en cours.</p>";
    }

    var list = entry.topClubs.slice(0, 6).map(function (club) {
        return "<li>" + escapeHtml(club.label) + " - " + escapeHtml(formatKm(club.totalKm, 0)) + " - " + club.count + " match" + (club.count > 1 ? "s" : "") + "</li>";
    }).join("");

    if (entry.topClubs.length > 6) {
        list += "<li>+ " + (entry.topClubs.length - 6) + " autres clubs</li>";
    }

    return ""
        + "<strong>" + escapeHtml(entry.label) + "</strong>"
        + "<p>Matchs : " + entry.count + "</p>"
        + "<p>Kilomètres : " + escapeHtml(formatKm(entry.totalKm, 0)) + "</p>"
        + "<p>Indemnités : " + escapeHtml(formatEuro(entry.totalIndemnity)) + "</p>"
        + "<p>Clubs hôtes : " + entry.clubCount + "</p>"
        + "<p>Lecture dominante : " + escapeHtml(metricKey === "totalKm" ? formatKm(entry.metricValue, 0) : entry.metricValue + " matchs") + "</p>"
        + "<ul>" + list + "</ul>";
}

function aggregateMapAreaStats(matches, granularity) {
    var areaMap = new Map();
    var resolvedCount = 0;

    matches.forEach(function (match) {
        var area = resolveMatchArea(match);
        if (!area) return;

        var code = granularity === "region" ? area.regionCode : area.departmentCode;
        var label = granularity === "region" ? area.regionName : area.departmentName;
        if (!code || !label) return;

        if (!areaMap.has(code)) {
            areaMap.set(code, {
                code: code,
                label: label,
                count: 0,
                totalKm: 0,
                totalIndemnity: 0,
                clubMap: {},
                clubCount: 0
            });
        }

        var entry = areaMap.get(code);
        entry.count += 1;
        entry.totalKm += match.km || 0;
        entry.totalIndemnity += match.indemnity || 0;
        if (!entry.clubMap[match.hostGroup]) {
            entry.clubMap[match.hostGroup] = {
                label: match.hostGroup,
                count: 0,
                totalKm: 0
            };
            entry.clubCount += 1;
        }

        entry.clubMap[match.hostGroup].count += 1;
        entry.clubMap[match.hostGroup].totalKm += match.km || 0;
        resolvedCount += 1;
    });

    var areas = Array.from(areaMap.values()).map(function (entry) {
        entry.metricValue = entry.totalKm > 0 ? entry.totalKm : entry.count;
        entry.topClubs = Object.keys(entry.clubMap)
            .map(function (key) { return entry.clubMap[key]; })
            .sort(function (a, b) {
                if (b.totalKm !== a.totalKm) return b.totalKm - a.totalKm;
                return b.count - a.count;
            });
        delete entry.clubMap;
        return entry;
    }).sort(function (a, b) {
        if (b.metricValue !== a.metricValue) return b.metricValue - a.metricValue;
        return b.count - a.count;
    });

    var metricKey = areas.some(function (entry) { return entry.totalKm > 0; }) ? "totalKm" : "count";
    areas.forEach(function (entry) {
        entry.metricValue = metricKey === "totalKm" ? entry.totalKm : entry.count;
    });

    return {
        areas: areas,
        metricKey: metricKey,
        metricMax: areas.reduce(function (maxValue, entry) {
            return Math.max(maxValue, entry.metricValue || 0);
        }, 0),
        topArea: areas[0] || null,
        resolvedCount: resolvedCount,
        unresolvedCount: Math.max(matches.length - resolvedCount, 0)
    };
}

function getMapDataForGranularity(granularity) {
    if (!window.DASHBOARD_MATCHS_MAP_DATA) return null;
    return granularity === "region"
        ? window.DASHBOARD_MATCHS_MAP_DATA.regions
        : window.DASHBOARD_MATCHS_MAP_DATA.departments;
}

function resolveMatchArea(match) {
    if (!match || !match.addressKey) return null;
    return resolveAreaFromAddressKey(match.addressKey);
}

function resolveAreaFromAddressKey(addressKey) {
    if (!addressKey) return null;

    if (DASHBOARD_STATE.map.areaCache[addressKey] !== undefined) {
        return DASHBOARD_STATE.map.areaCache[addressKey];
    }

    var departmentCode = departmentFromPostalCode(extractPostalCode(addressKey));
    var departmentFeature = departmentCode ? findFeatureByCode(getMapDataForGranularity("department"), departmentCode) : null;

    if (!departmentFeature) {
        var geo = getVenueGeo(addressKey);
        if (geo && typeof d3 !== "undefined") {
            departmentFeature = findFeatureContainingPoint(getMapDataForGranularity("department"), geo.lng, geo.lat);
            departmentCode = departmentFeature ? departmentFeature.properties.code : "";
        }
    }

    if (!departmentFeature || !departmentCode) {
        DASHBOARD_STATE.map.areaCache[addressKey] = null;
        return null;
    }

    var region = REGION_BY_DEPARTMENT[departmentCode] || null;
    var resolved = {
        departmentCode: departmentCode,
        departmentName: departmentFeature.properties.nom,
        regionCode: region ? region.code : "",
        regionName: region ? region.name : ""
    };

    DASHBOARD_STATE.map.areaCache[addressKey] = resolved;
    return resolved;
}

function extractPostalCode(address) {
    var match = String(address || "").match(/\b(\d{5})\b/);
    return match ? match[1] : "";
}

function departmentFromPostalCode(postalCode) {
    if (!postalCode) return "";

    if (postalCode.indexOf("20") === 0) {
        return Number(postalCode.slice(0, 3)) <= 201 ? "2A" : "2B";
    }

    var departmentCode = postalCode.slice(0, 2);
    return REGION_BY_DEPARTMENT[departmentCode] ? departmentCode : "";
}

function findFeatureByCode(featureCollection, code) {
    if (!featureCollection || !featureCollection.features) return null;

    for (var i = 0; i < featureCollection.features.length; i++) {
        if (featureCollection.features[i].properties.code === code) {
            return featureCollection.features[i];
        }
    }

    return null;
}

function findFeatureContainingPoint(featureCollection, lng, lat) {
    if (!featureCollection || !featureCollection.features || typeof d3 === "undefined") return null;

    for (var i = 0; i < featureCollection.features.length; i++) {
        if (d3.geoContains(featureCollection.features[i], [lng, lat])) {
            return featureCollection.features[i];
        }
    }

    return null;
}

function aggregateCompetitionStats(matches) {
    var competitionMap = new Map();

    matches.forEach(function (match) {
        var key = match.competition || "Non renseignee";
        if (!competitionMap.has(key)) {
            competitionMap.set(key, {
                label: key,
                count: 0,
                totalKm: 0,
                totalIndemnity: 0,
                kmKnownCount: 0,
                lastDate: null
            });
        }

        var entry = competitionMap.get(key);
        entry.count += 1;
        if (match.kmKnown) {
            entry.totalKm += match.km || 0;
            entry.kmKnownCount += 1;
        }
        if (match.indemnityKnown) {
            entry.totalIndemnity += match.indemnity || 0;
        }
        if (match.dateObj && (!entry.lastDate || match.dateObj > entry.lastDate)) {
            entry.lastDate = match.dateObj;
        }
    });

    return Array.from(competitionMap.values())
        .map(function (entry) {
            entry.avgKm = entry.kmKnownCount ? entry.totalKm / entry.kmKnownCount : 0;
            return entry;
        })
        .sort(function (a, b) {
            if (b.count !== a.count) return b.count - a.count;
            return b.totalKm - a.totalKm;
        });
}

function aggregateClubStats(matches) {
    var clubMap = new Map();

    matches.forEach(function (match) {
        var key = match.hostGroup || "Club non renseigne";
        if (!clubMap.has(key)) {
            clubMap.set(key, {
                clubKey: key,
                clubLabel: key,
                matches: 0,
                totalKm: 0,
                kmKnownCount: 0,
                totalIndemnity: 0,
                indemnityKnownCount: 0,
                lastDate: null,
                missingAddressCount: 0,
                venuesMap: new Map()
            });
        }

        var club = clubMap.get(key);
        club.matches += 1;
        if (match.kmKnown) {
            club.totalKm += match.km || 0;
            club.kmKnownCount += 1;
        }
        if (match.indemnityKnown) {
            club.totalIndemnity += match.indemnity || 0;
            club.indemnityKnownCount += 1;
        }
        if (match.dateObj && (!club.lastDate || match.dateObj > club.lastDate)) {
            club.lastDate = match.dateObj;
        }

        if (!match.addressKey) {
            club.missingAddressCount += 1;
            return;
        }

        if (!club.venuesMap.has(match.addressKey)) {
            club.venuesMap.set(match.addressKey, {
                key: match.addressKey,
                salle: match.salle || "-",
                city: match.city || "",
                geo: getVenueGeo(match.addressKey),
                matches: 0,
                totalKm: 0,
                totalIndemnity: 0,
                kmKnownCount: 0,
                lastDate: null
            });
        }

        var venue = club.venuesMap.get(match.addressKey);
        venue.matches += 1;
        if (match.kmKnown) {
            venue.totalKm += match.km || 0;
            venue.kmKnownCount += 1;
        }
        if (match.indemnityKnown) {
            venue.totalIndemnity += match.indemnity || 0;
        }
        if (match.dateObj && (!venue.lastDate || match.dateObj > venue.lastDate)) {
            venue.lastDate = match.dateObj;
        }
    });

    return Array.from(clubMap.values()).map(function (club) {
        club.venues = Array.from(club.venuesMap.values())
            .map(function (venue) {
                venue.avgKm = venue.kmKnownCount ? venue.totalKm / venue.kmKnownCount : 0;
                return venue;
            })
            .sort(function (a, b) {
                if (b.totalKm !== a.totalKm) return b.totalKm - a.totalKm;
                return b.matches - a.matches;
            });

        club.unmappedVenues = club.venues.filter(function (venue) { return !venue.geo; });
        club.unmappedVenueCount = club.unmappedVenues.length;
        club.avgKm = club.kmKnownCount ? club.totalKm / club.kmKnownCount : 0;
        club.geo = computeClubCentroid(club.venues.filter(function (venue) { return venue.geo; }));
        delete club.venuesMap;
        return club;
    });
}

function computeClubCentroid(venues) {
    if (!venues.length) return null;

    var totals = venues.reduce(function (acc, venue) {
        var weight = venue.matches || 1;
        acc.lat += venue.geo.lat * weight;
        acc.lng += venue.geo.lng * weight;
        acc.weight += weight;
        return acc;
    }, { lat: 0, lng: 0, weight: 0 });

    return {
        lat: roundTo(totals.lat / totals.weight, 6),
        lng: roundTo(totals.lng / totals.weight, 6)
    };
}

function buildMapAnomalies(clubs) {
    var anomalies = [];

    clubs.forEach(function (club) {
        if (club.missingAddressCount > 0) {
            anomalies.push({
                club: club.clubLabel,
                type: "Adresse manquante dans le CSV",
                detail: club.missingAddressCount + " match" + (club.missingAddressCount > 1 ? "s" : "") + " sans adresse de salle"
            });
        }

        club.venues.forEach(function (venue) {
            if (resolveAreaFromAddressKey(venue.key)) return;

            anomalies.push({
                club: club.clubLabel,
                type: venue.geo ? "Zone cartographique introuvable" : "Salle non localisée",
                detail: formatVenueTooltipLabel(venue) + " - " + venue.matches + " match" + (venue.matches > 1 ? "s" : "") + " sans rattachement fiable"
            });
        });
    });

    return anomalies.sort(function (a, b) {
        return a.club.localeCompare(b.club, "fr");
    });
}

function renderMapAnomalies(anomalies) {
    var list = document.getElementById("map-anomalies-list");
    if (!list) return;

    if (!anomalies.length) {
        list.innerHTML = "<li><strong>RAS</strong><br>Toutes les salles connues sur ce filtre sont rattachées à une zone exploitable.</li>";
        return;
    }

    list.innerHTML = anomalies.map(function (entry) {
        return "<li><strong>" + escapeHtml(entry.club) + "</strong><br>" + escapeHtml(entry.type) + "<br>" + escapeHtml(entry.detail) + "</li>";
    }).join("");
}

function formatVenueTooltipLabel(venue) {
    if (!venue) return "Lieu non renseigne";
    if (venue.city) {
        return venue.city + (venue.salle && venue.salle !== "-" ? " - " + truncateLabel(venue.salle, 42) : "");
    }
    if (venue.salle && venue.salle !== "-") {
        return truncateLabel(venue.salle, 54);
    }
    return "Lieu non renseigne";
}

function destroyChart(key) {
    if (DASHBOARD_STATE.charts[key]) {
        DASHBOARD_STATE.charts[key].destroy();
        DASHBOARD_STATE.charts[key] = null;
    }
}

function getSharedChartOptions(overrides) {
    var base = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: "rgba(250, 235, 215, 0.9)"
                }
            },
            tooltip: {
                backgroundColor: "rgba(7, 16, 16, 0.95)",
                titleColor: "#fff2dc",
                bodyColor: "#fff2dc",
                borderColor: "rgba(250, 235, 215, 0.28)",
                borderWidth: 1
            }
        }
    };

    return mergeOptions(base, overrides || {});
}

function getAxisStyle(overrides) {
    var base = {
        ticks: {
            color: "rgba(250, 235, 215, 0.82)",
            font: { size: 11 }
        },
        grid: {
            color: "rgba(250, 235, 215, 0.12)"
        },
        border: {
            color: "rgba(250, 235, 215, 0.2)"
        },
        title: {
            color: "rgba(250, 235, 215, 0.85)",
            font: { size: 11 }
        }
    };

    return mergeOptions(base, overrides || {});
}

function mergeOptions(target, source) {
    Object.keys(source).forEach(function (key) {
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
            if (!target[key] || typeof target[key] !== "object") {
                target[key] = {};
            }
            mergeOptions(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    });

    return target;
}

function updateInsights(matches) {
    var list = document.getElementById("insight-list");
    if (!list) return;

    if (!matches.length) {
        list.innerHTML = "<li>Aucun match pour les filtres selectionnes.</li>";
        return;
    }

    var competitionStats = aggregateCompetitionStats(matches);
    var topCompetition = competitionStats[0] || null;
    var topClub = aggregateClubStats(matches)
        .filter(function (club) { return club.totalKm > 0; })
        .sort(function (a, b) { return b.totalKm - a.totalKm; })[0] || null;
    var buckets = buildTimeBuckets(matches, getSelectedGranularity());
    var busiestBucket = buckets.slice().sort(function (a, b) { return b.count - a.count; })[0] || null;
    var matchesWithKm = matches.filter(function (match) { return match.kmKnown; });
    var totalKm = sumBy(matchesWithKm, function (match) { return match.km || 0; });
    var farthest = getFarthestMatch(matches);
    var anomalies = buildMapAnomalies(aggregateClubStats(matches));

    list.innerHTML = "";

    if (topCompetition) {
        addInsight(list, "Competition principale : " + topCompetition.label + " (" + topCompetition.count + " matchs).");
    }

    if (busiestBucket) {
        addInsight(list, "Pic d'activite : " + busiestBucket.label + " avec " + busiestBucket.count + " matchs, " + formatKm(busiestBucket.totalKm, 0) + " et " + formatEuro(busiestBucket.totalIndemnity) + ".");
    }

    addInsight(list, "Distance cumulee : " + formatKm(totalKm, 0) + " sur " + matchesWithKm.length + " matchs renseignes, soit " + formatKm(matchesWithKm.length ? totalKm / matchesWithKm.length : 0, 1) + " en moyenne.");

    if (farthest) {
        addInsight(list, "Deplacement le plus long : " + getMatchLabel(farthest) + " le " + formatDate(farthest.dateObj) + " avec " + formatKm(farthest.km, 0) + ".");
    }

    if (topClub) {
        addInsight(list, "Club le plus impactant en deplacement : " + topClub.clubLabel + " avec " + formatKm(topClub.totalKm, 0) + " cumules sur " + topClub.matches + " matchs.");
    }

    addInsight(list, anomalies.length
        ? anomalies.length + " anomalie" + (anomalies.length > 1 ? "s" : "") + " geographique" + (anomalies.length > 1 ? "s" : "") + " a verifier dans la carte."
        : "Aucune anomalie geographique detectee sur ce filtre.");
}

function addInsight(listNode, text) {
    var item = document.createElement("li");
    item.textContent = text;
    listNode.appendChild(item);
}

function renderMatchesTable(matches) {
    var body = document.getElementById("matches-table-body");
    if (!body) return;

    body.innerHTML = "";

    matches.slice().sort(function (a, b) {
        var bTime = b.dateObj ? b.dateObj.getTime() : -Infinity;
        var aTime = a.dateObj ? a.dateObj.getTime() : -Infinity;
        return bTime - aTime;
    }).slice(0, 70).forEach(function (match) {
        var row = document.createElement("tr");
        row.innerHTML = ""
            + "<td>" + escapeHtml(formatDate(match.dateObj)) + "</td>"
            + "<td>" + escapeHtml(match.competition) + "</td>"
            + "<td>" + escapeHtml(match.visiteur) + "</td>"
            + "<td>" + escapeHtml(match.recevant) + "</td>"
            + "<td>" + escapeHtml(match.salle || "-") + "</td>"
            + "<td>" + (match.kmKnown ? escapeHtml(formatKm(match.km, 0)) : "-") + "</td>"
            + "<td class=\"indemnity-cell\">" + (match.indemnityKnown ? escapeHtml(formatEuro(match.indemnity)) : "-") + "</td>";
        body.appendChild(row);
    });
}

function formatDate(dateObj) {
    if (!dateObj) return "-";

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(dateObj);
}

function formatEuro(value) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value || 0);
}

function formatKm(value, digits) {
    var decimals = digits === undefined ? 0 : digits;
    return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(roundTo(value || 0, decimals)) + " km";
}

function roundTo(value, digits) {
    var factor = Math.pow(10, digits || 0);
    return Math.round((value || 0) * factor) / factor;
}

function round2(value) {
    return Math.round((value || 0) * 100) / 100;
}

function truncateLabel(value, maxLength) {
    if (!value || value.length <= maxLength) return value;
    return value.slice(0, maxLength - 3).trim() + "...";
}

function sumBy(items, getter) {
    return items.reduce(function (sum, item) {
        return sum + (getter(item) || 0);
    }, 0);
}

function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
}

function setStatus(message, isError) {
    var box = document.getElementById("status-box");
    if (!box) return;

    box.classList.remove("hidden", "error");
    if (isError) {
        box.classList.add("error");
    }

    box.textContent = message;

    if (!isError) {
        setTimeout(function () {
            box.classList.add("hidden");
        }, 2500);
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
