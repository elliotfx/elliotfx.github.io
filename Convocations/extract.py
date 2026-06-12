from __future__ import annotations

import base64
import json
import re
import time
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
from openai import OpenAI

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_DIR = Path(r"C:\Users\ellio\Downloads\Pas fait")
OUTPUT_JSONL = Path(r"C:\Users\ellio\Downloads\convocations_lmstudio.jsonl")
FAILED_JSONL = Path(r"C:\Users\ellio\Downloads\convocations_lmstudio_failed.jsonl")

# Identifiant API du modèle chargé dans LM Studio
MODEL_NAME = "qwen2.5-vl-7b-instruct_3workers"

LMSTUDIO_BASE_URL = "http://localhost:1234/v1"
LMSTUDIO_API_KEY = "lm-studio"

MAX_IMAGE_SIDE = 1400
RESUME = True
STORE_RAW_MODEL_OUTPUT = True
SLEEP_BETWEEN_REQUESTS = 0.5

# ============================================================
# SCHÉMA JSON ATTENDU
# ============================================================

JSON_TEMPLATE = {
    "fichier_pdf": None,
    "date": None,
    "heure": None,
    "numero_rencontre": None,
    "competition": None,
    "groupe_sportif_visiteur": None,
    "adresse_salle": None,
    "correspondant": None,
    "groupe_sportif_recevant": None,
    "arbitres": [],
    "notes": None,
}

RESPONSE_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "basket_convocation",
        "strict": True,
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "fichier_pdf": {"type": ["string", "null"]},
                "date": {"type": ["string", "null"]},
                "heure": {"type": ["string", "null"]},
                "numero_rencontre": {"type": ["string", "null"]},
                "competition": {"type": ["string", "null"]},
                "groupe_sportif_visiteur": {"type": ["string", "null"]},
                "adresse_salle": {"type": ["string", "null"]},
                "correspondant": {"type": ["string", "null"]},
                "groupe_sportif_recevant": {"type": ["string", "null"]},
                "arbitres": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "nom": {"type": ["string", "null"]},
                            "licence": {"type": ["string", "null"]},
                            "mail": {"type": ["string", "null"]},
                            "portable": {"type": ["string", "null"]},
                            "indemnite_eur": {"type": ["number", "null"]},
                            "km": {"type": ["number", "null"]},
                        },
                        "required": ["nom", "licence", "mail", "portable", "indemnite_eur", "km"],
                    },
                },
                "notes": {"type": ["string", "null"]},
            },
            "required": [
                "fichier_pdf",
                "date",
                "heure",
                "numero_rencontre",
                "competition",
                "groupe_sportif_visiteur",
                "adresse_salle",
                "correspondant",
                "groupe_sportif_recevant",
                "arbitres",
                "notes",
            ],
        },
    },
}

# ============================================================
# PROMPTS
# ============================================================

SYSTEM_PROMPT = """Tu extrais des informations depuis une convocation PDF d'arbitrage de basket française.

Tu reçois les pages du PDF sous forme d'images.
Tu dois lire visuellement le document et renvoyer uniquement un JSON.

Règles impératives :
- N'invente jamais une information absente.
- Si une info manque, mets null.
- Réponds uniquement avec du JSON, sans phrase autour.
- Le champ fichier_pdf doit contenir le nom du fichier envoyé.
- competition = niveau + poule si visible.
- correspondant = nom + téléphone si visibles.
- adresse_salle = nom de salle + adresse si visibles ensemble.
- arbitres = liste des arbitres visibles.
- indemnite_eur = nombre, par exemple 44.4 et pas "44,40 €".
- km = nombre de kilomètres de l'arbitre si visible.
- notes = précision utile si une information est ambiguë ou difficile à lire.
"""

USER_PROMPT = f"""Analyse cette convocation d'arbitrage et renvoie uniquement un objet JSON avec exactement cette structure :

{json.dumps(JSON_TEMPLATE, ensure_ascii=False, indent=2)}

Pour "arbitres", renvoie une liste d'objets de la forme :
{{
  "nom": null,
  "licence": null,
  "mail": null,
  "portable": null,
  "indemnite_eur": null,
  "km": null
}}

Ne mets aucun texte avant ou après le JSON.
"""

# ============================================================
# OUTILS
# ============================================================

def jsonl_append(path: Path, item: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(item, ensure_ascii=False) + "\n")


def load_done_set(path: Path) -> set[str]:
    done: set[str] = set()
    if not path.exists():
        return done

    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                name = obj.get("fichier_pdf")
                if isinstance(name, str) and name:
                    done.add(name)
            except Exception:
                pass
    return done


def normalize_whitespace(value: Any) -> Any:
    if value is None:
        return None
    if not isinstance(value, str):
        return value
    value = re.sub(r"\s+", " ", value).strip()
    return value or None


def to_float_or_none(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)

    s = str(value).strip()
    if not s:
        return None

    s = s.replace("€", "")
    s = s.replace("km", "")
    s = s.replace("KM", "")
    s = s.replace("\u202f", " ")
    s = s.replace("\xa0", " ")
    s = s.replace(" ", "")
    s = s.replace(",", ".")

    try:
        return float(s)
    except Exception:
        return None


def pdf_to_image_data_urls(pdf_path: Path, max_side: int = 1400) -> list[str]:
    doc = fitz.open(pdf_path)
    urls: list[str] = []

    try:
        for page in doc:
            rect = page.rect
            longest = max(rect.width, rect.height)
            zoom = max_side / float(longest)
            zoom = min(max(zoom, 1.0), 2.2)

            pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
            image_bytes = pix.tobytes("jpeg", jpg_quality=85)
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            urls.append(f"data:image/jpeg;base64,{b64}")
    finally:
        doc.close()

    return urls


def parse_json_from_response(content: str) -> dict[str, Any]:
    content = content.strip()

    try:
        return json.loads(content)
    except Exception:
        pass

    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", content, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        return json.loads(fenced.group(1))

    first_obj = re.search(r"(\{.*\})", content, flags=re.DOTALL)
    if first_obj:
        return json.loads(first_obj.group(1))

    raise ValueError("Impossible de parser la réponse en JSON.")


def clean_record(obj: dict[str, Any], pdf_name: str) -> dict[str, Any]:
    cleaned = dict(JSON_TEMPLATE)
    cleaned.update(obj or {})
    cleaned["fichier_pdf"] = pdf_name

    for field in [
        "fichier_pdf",
        "date",
        "heure",
        "numero_rencontre",
        "competition",
        "groupe_sportif_visiteur",
        "adresse_salle",
        "correspondant",
        "groupe_sportif_recevant",
        "notes",
    ]:
        cleaned[field] = normalize_whitespace(cleaned.get(field))

    arbitres = cleaned.get("arbitres") or []
    if not isinstance(arbitres, list):
        arbitres = []

    fixed_arbitres = []
    for arb in arbitres:
        if not isinstance(arb, dict):
            continue

        fixed_arbitres.append({
            "nom": normalize_whitespace(arb.get("nom")),
            "licence": normalize_whitespace(arb.get("licence")),
            "mail": normalize_whitespace(arb.get("mail")),
            "portable": normalize_whitespace(arb.get("portable")),
            "indemnite_eur": to_float_or_none(arb.get("indemnite_eur")),
            "km": to_float_or_none(arb.get("km")),
        })

    cleaned["arbitres"] = fixed_arbitres
    return cleaned


def build_messages(pdf_name: str, image_urls: list[str]) -> list[dict[str, Any]]:
    content_parts: list[dict[str, Any]] = [
        {"type": "text", "text": f"{USER_PROMPT}\n\nNom du fichier: {pdf_name}"}
    ]

    for url in image_urls:
        content_parts.append({
            "type": "image_url",
            "image_url": {"url": url},
        })

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": content_parts},
    ]


def call_model(client: OpenAI, messages: list[dict[str, Any]], use_schema: bool) -> str:
    kwargs = {
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": 0,
    }
    if use_schema:
        kwargs["response_format"] = RESPONSE_SCHEMA

    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


def call_lmstudio_for_pdf(client: OpenAI, pdf_path: Path) -> dict[str, Any]:
    image_urls = pdf_to_image_data_urls(pdf_path, max_side=MAX_IMAGE_SIDE)
    messages = build_messages(pdf_path.name, image_urls)

    raw_content = None

    try:
        raw_content = call_model(client, messages, use_schema=True)
    except Exception:
        raw_content = call_model(client, messages, use_schema=False)

    data = parse_json_from_response(raw_content)
    data = clean_record(data, pdf_path.name)

    if STORE_RAW_MODEL_OUTPUT:
        data["_raw_model_output"] = raw_content

    return data


def display_record_console(record: dict[str, Any]) -> None:
    print("   " + "=" * 60)
    print(f"   Fichier              : {record.get('fichier_pdf')}")
    print(f"   Date                 : {record.get('date')}")
    print(f"   Heure                : {record.get('heure')}")
    print(f"   N° rencontre         : {record.get('numero_rencontre')}")
    print(f"   Compétition          : {record.get('competition')}")
    print(f"   GS visiteur          : {record.get('groupe_sportif_visiteur')}")
    print(f"   GS recevant          : {record.get('groupe_sportif_recevant')}")
    print(f"   Adresse salle        : {record.get('adresse_salle')}")
    print(f"   Correspondant        : {record.get('correspondant')}")

    arbitres = record.get("arbitres") or []
    print(f"   Arbitres             : {len(arbitres)}")

    for i, arb in enumerate(arbitres, start=1):
        print(f"      --- Arbitre {i} ---")
        print(f"      Nom               : {arb.get('nom')}")
        print(f"      Licence           : {arb.get('licence')}")
        print(f"      Mail              : {arb.get('mail')}")
        print(f"      Portable          : {arb.get('portable')}")
        print(f"      Indemnité (€)     : {arb.get('indemnite_eur')}")
        print(f"      Km                : {arb.get('km')}")

    print(f"   Notes                : {record.get('notes')}")

    if STORE_RAW_MODEL_OUTPUT:
        print("   JSON extrait :")
        print(json.dumps(record, ensure_ascii=False, indent=2))

    print("   " + "=" * 60)


# ============================================================
# MAIN
# ============================================================

def main() -> None:
    if not INPUT_DIR.exists():
        print(f"[ERREUR] Dossier introuvable : {INPUT_DIR}")
        return

    pdf_files = sorted(INPUT_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"[INFO] Aucun PDF trouvé dans : {INPUT_DIR}")
        return

    already_done = load_done_set(OUTPUT_JSONL) if RESUME else set()

    client = OpenAI(
        base_url=LMSTUDIO_BASE_URL,
        api_key=LMSTUDIO_API_KEY,
    )

    total = len(pdf_files)
    print(f"{total} PDF trouvés")
    print(f"Sortie OK  : {OUTPUT_JSONL}")
    print(f"Sortie NOK : {FAILED_JSONL}")
    print()

    for idx, pdf_path in enumerate(pdf_files, start=1):
        if pdf_path.name in already_done:
            print(f"[{idx}/{total}] SKIP {pdf_path.name}")
            continue

        print(f"[{idx}/{total}] Traitement {pdf_path.name} ...")

        try:
            record = call_lmstudio_for_pdf(client, pdf_path)
            jsonl_append(OUTPUT_JSONL, record)

            print("   OK")
            display_record_console(record)

        except Exception as e:
            jsonl_append(FAILED_JSONL, {
                "fichier_pdf": pdf_path.name,
                "erreur": str(e),
            })
            print(f"   ERREUR | {e}")

        if SLEEP_BETWEEN_REQUESTS > 0:
            time.sleep(SLEEP_BETWEEN_REQUESTS)

    print()
    print("Traitement terminé.")


if __name__ == "__main__":
    main()