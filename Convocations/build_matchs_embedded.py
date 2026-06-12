"""
build_matchs_embedded.py
Lit base_matchs_sans heure.xlsx et génère tous les fichiers JS embarqués
pour le dashboard portfolio.

Colonnes Excel attendues :
  DATE, LOCAUX, VISITEURS, DIVISION, INDEMNITE, ARBITRES,
  POSTE_ARBITRE, OBSERVATEUR_ARBITRE, LIEU, KM
"""

from pathlib import Path
import csv
import io
import json
import re

try:
    import openpyxl
except ImportError:
    raise SystemExit("openpyxl requis : pip install openpyxl")

# ============================================================
# CHEMINS
# ============================================================

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent

EXCEL_PATH = ROOT / "base_matchs_sans heure.xlsx"

dashboard_js_path     = PROJECT_ROOT / "js"   / "dashboard_matchs.js"
geocode_cache_path    = PROJECT_ROOT / "js"   / "dashboard_matchs_geocode_cache.js"
map_data_path         = PROJECT_ROOT / "js"   / "dashboard_matchs_map_data.js"

out_csv               = ROOT          / "matchs.csv"
out_convocations      = ROOT          / "matchs_embedded.js"
out_html_embedded     = PROJECT_ROOT  / "html" / "matchs_embedded.js"
out_html_dashboard    = PROJECT_ROOT  / "html" / "dashboard_matchs.js"
out_html_local        = PROJECT_ROOT  / "html" / "dashboard_matchs.local.js"
out_html_geocode      = PROJECT_ROOT  / "html" / "dashboard_matchs_geocode_cache.js"
out_html_map_data     = PROJECT_ROOT  / "html" / "dashboard_matchs_map_data.js"

# ============================================================
# LECTURE EXCEL → CSV
# ============================================================

FIELDNAMES = [
    "fichier_pdf",        # non utilisé (laissé vide, compat. ancienne colonne)
    "date",
    "heure",              # vide avec ce fichier
    "numero_rencontre",   # vide
    "competition",
    "comite_organisateur",# vide
    "groupe_sportif_visiteur",
    "adresse_salle",
    "correspondant",      # vide
    "groupe_sportif_recevant",
    "code_e_marque_v2",   # vide
    "notes",
    # Arbitre 1
    "arbitre_1_nom", "arbitre_1_licence", "arbitre_1_mail", "arbitre_1_portable",
    "arbitre_1_indemnite_eur", "arbitre_1_km",
    # Arbitre 2 (poste_arbitre stocké ici pour compatibilité)
    "arbitre_2_nom", "arbitre_2_licence", "arbitre_2_mail", "arbitre_2_portable",
    "arbitre_2_indemnite_eur", "arbitre_2_km",
    # Arbitres 3-5 (vides dans ce fichier)
    "arbitre_3_nom", "arbitre_3_licence", "arbitre_3_mail", "arbitre_3_portable",
    "arbitre_3_indemnite_eur", "arbitre_3_km",
    "arbitre_4_nom", "arbitre_4_licence", "arbitre_4_mail", "arbitre_4_portable",
    "arbitre_4_indemnite_eur", "arbitre_4_km",
    "arbitre_5_nom", "arbitre_5_licence", "arbitre_5_mail", "arbitre_5_portable",
    "arbitre_5_indemnite_eur", "arbitre_5_km",
]


def clean_str(value):
    if value is None:
        return ""
    s = str(value).strip()
    # Supprimer whitespace interne multiple
    s = re.sub(r"\s+", " ", s)
    return s


def fmt_number(value):
    """Retourne une chaîne numérique sans virgule flottante inutile."""
    if value is None or str(value).strip() == "":
        return ""
    try:
        f = float(str(value).replace(",", "."))
        # Entier si pas de décimale significative
        return str(int(f)) if f == int(f) else str(f)
    except ValueError:
        return ""


def parse_names(raw: str) -> list[str]:
    """Découpe 'NOM Prénom, NOM2 Prénom2' en liste de noms."""
    if not raw:
        return []
    return [n.strip() for n in raw.split(",") if n.strip()]


def find_elliot_index(names: list[str]) -> int:
    """Retourne l'index (0-based) d'Elliot Feroux dans la liste, -1 si absent."""
    for i, name in enumerate(names):
        normalized = name.lower()
        normalized = normalized.encode("ascii", "ignore").decode()  # supprime accents basiques
        if "feroux" in normalized and "elliot" in normalized.replace("é", "e"):
            return i
    return -1


def excel_to_csv(excel_path: Path) -> str:
    """Lit le fichier Excel et retourne le texte CSV (séparateur ;)."""
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise ValueError("Le fichier Excel est vide.")

    # Vérification headers
    headers_raw = [str(h or "").strip().upper() for h in rows[0]]
    expected = {"DATE", "LOCAUX", "VISITEURS", "DIVISION", "INDEMNITE",
                "ARBITRES", "POSTE_ARBITRE", "LIEU", "KM"}
    missing = expected - set(headers_raw)
    if missing:
        raise ValueError(f"Colonnes manquantes dans l'Excel : {missing}")

    col = {h: i for i, h in enumerate(headers_raw)}

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=FIELDNAMES, delimiter=";",
                            lineterminator="\n", extrasaction="ignore")
    writer.writeheader()

    for row in rows[1:]:
        def get(colname):
            idx = col.get(colname, -1)
            return row[idx] if idx >= 0 and idx < len(row) else None

        date_val     = clean_str(get("DATE"))
        locaux       = clean_str(get("LOCAUX"))
        visiteurs    = clean_str(get("VISITEURS"))
        division     = clean_str(get("DIVISION"))
        indemnite    = fmt_number(get("INDEMNITE"))
        arbitres_raw = clean_str(get("ARBITRES"))
        poste        = clean_str(get("POSTE_ARBITRE"))
        lieu         = clean_str(get("LIEU"))
        km_val       = fmt_number(get("KM"))

        if not date_val and not locaux and not visiteurs:
            continue  # ligne vide

        names = parse_names(arbitres_raw)
        elliot_idx = find_elliot_index(names)

        # On place Elliot en arbitre_1 avec ses données
        # Les autres arbitres sont listés en arbitre_2 (noms seulement)
        if elliot_idx == -1:
            # Elliot absent de cette ligne → ligne ignorée
            continue

        other_names = [n for i, n in enumerate(names) if i != elliot_idx]

        record = {fn: "" for fn in FIELDNAMES}

        record["date"]                    = date_val
        record["heure"]                   = ""
        record["competition"]             = division
        record["groupe_sportif_visiteur"] = visiteurs
        record["groupe_sportif_recevant"] = locaux
        record["adresse_salle"]           = lieu

        # Elliot = arbitre_1
        record["arbitre_1_nom"]           = "FEROUX Elliot"
        record["arbitre_1_indemnite_eur"] = indemnite
        record["arbitre_1_km"]            = km_val

        # Autres arbitres : noms seulement en arbitre_2..5
        for i, name in enumerate(other_names[:4], start=2):
            record[f"arbitre_{i}_nom"] = name

        writer.writerow(record)

    return buf.getvalue()


# ============================================================
# MAIN
# ============================================================

def main():
    if not EXCEL_PATH.exists():
        raise SystemExit(f"[ERREUR] Fichier introuvable : {EXCEL_PATH}")

    print(f"Lecture de : {EXCEL_PATH}")
    csv_text = excel_to_csv(EXCEL_PATH)

    # Compter les lignes (hors header)
    line_count = csv_text.count("\n") - 1
    print(f"  -> {line_count} match(s) Elliot trouves")

    # Écriture CSV
    out_csv.write_text(csv_text, encoding="utf-8-sig")
    print(f"OK: {out_csv}")

    # Lecture des JS existants
    dashboard_js       = dashboard_js_path.read_text(encoding="utf-8")
    geocode_cache_js   = geocode_cache_path.read_text(encoding="utf-8")
    map_data_js        = map_data_path.read_text(encoding="utf-8")

    # Génération des bundles
    embedded_csv_js = "window.MATCHS_CSV_TEXT = " + json.dumps(csv_text, ensure_ascii=False) + ";\n"
    local_bundle_js = embedded_csv_js + "\n" + dashboard_js + "\n"

    out_convocations.write_text(embedded_csv_js,  encoding="utf-8")
    out_html_embedded.write_text(embedded_csv_js, encoding="utf-8")
    out_html_dashboard.write_text(dashboard_js,   encoding="utf-8")
    out_html_local.write_text(local_bundle_js,    encoding="utf-8")
    out_html_geocode.write_text(geocode_cache_js, encoding="utf-8")
    out_html_map_data.write_text(map_data_js,     encoding="utf-8")

    print(f"OK: {out_convocations} (CSV embarqué)")
    print(f"OK: {out_html_embedded}")
    print(f"OK: {out_html_dashboard} (synchro JS dashboard)")
    print(f"OK: {out_html_local} (bundle local = CSV + dashboard JS)")
    print(f"OK: {out_html_geocode}")
    print(f"OK: {out_html_map_data}")
    print("\nTraitement terminé.")


if __name__ == "__main__":
    main()
