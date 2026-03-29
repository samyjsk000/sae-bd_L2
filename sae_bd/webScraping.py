import requests
from bs4 import BeautifulSoup
import mysql.connector
import time
import sys
from urllib.parse import urljoin, urlparse
import re

# --- CONFIGURATION ---
BASE_URL = "https://www.lesrecettesdevirginie.com"
MAX_PAGES = 23

# ⚙️  Modifie ces valeurs selon ta config MySQL
DB_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "user":     "root",
    "password": "aghiles123",
    "database": "kitechen",   # La base doit déjà exister
    "charset":  "utf8mb4",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
    "Connection": "keep-alive",
    "Referer": "https://www.google.com/"
}

# --- CONNEXION MYSQL ---

def get_db_connection():
    """Connexion à la base MySQL existante. Arrêt immédiat si impossible."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print(f"[DB] Connecté à '{DB_CONFIG['database']}' sur {DB_CONFIG['host']}")
        return conn
    except mysql.connector.Error as e:
        print(f"[ERREUR DB] Impossible de se connecter : {e}")
        print("  → Vérifie host, user, password et database dans DB_CONFIG.")
        sys.exit(1)

def verify_tables(cursor):
    """
    Vérifie que les tables nécessaires existent déjà dans la base.
    Le script ne crée RIEN — il se connecte à une base existante.
    """
    tables_requises = {"Plats", "Recettes", "Ingredients", "RecettesIngredients", "Etapes"}
    cursor.execute("SHOW TABLES")
    tables_presentes = {row[0] for row in cursor.fetchall()}

    manquantes = tables_requises - tables_presentes
    if manquantes:
        print(f"[ERREUR DB] Tables manquantes : {', '.join(manquantes)}")
        print("  → Le script suppose que la base est déjà initialisée.")
        sys.exit(1)

    print(f"[DB] Tables vérifiées : OK ({', '.join(sorted(tables_presentes & tables_requises))})")

# --- SCRAPING ---

def fetch_html(url):
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"  [HTTP ERREUR] {url} → {e}")
        return None

def normalize_url(href):
    if not href:
        return None
    url = urljoin(BASE_URL, href)
    if urlparse(url).netloc != urlparse(BASE_URL).netloc:
        return None
    return url

def is_recipe_url(url):
    if not url:
        return False
    path = urlparse(url).path
    if re.match(r'/\d{4}/\d{2}/.+\.html$', path):
        return True
    if re.match(r'/article-.+\.html$', path):
        return True
    return False

def get_recipe_urls_from_page(soup):
    urls = set()
    for h2 in soup.select("h2.PostPreview-title"):
        a = h2.find("a", href=True)
        if a:
            url = normalize_url(a["href"])
            if url and is_recipe_url(url):
                urls.add(url)
    return urls

def get_next_page_url(page_num):
    if page_num < MAX_PAGES:
        return f"{BASE_URL}/page/{page_num + 1}"
    return None

# --- INSERTION MYSQL (non-destructive) ---

def get_or_create_plat(cursor, conn, nom_plat="Cuisine de Virginie"):
    """
    Retourne l'idPlat existant s'il existe déjà,
    sinon insère et retourne le nouvel id.
    """
    cursor.execute("SELECT idPlat FROM Plats WHERE nomPlat = %s", (nom_plat,))
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute("INSERT INTO Plats (nomPlat) VALUES (%s)", (nom_plat,))
    conn.commit()
    return cursor.lastrowid

def process_recipe(url, id_plat, conn):
    """Scrape une recette et insère uniquement les données nouvelles."""
    html = fetch_html(url)
    if not html:
        return

    soup = BeautifulSoup(html, "html.parser")
    cursor = conn.cursor()

    try:
        # --- Titre ---
        nom_tag = soup.select_one("h1.Post-title, h2.PostPreview-title, h1.post-title, h1")
        nom = nom_tag.get_text(strip=True) if nom_tag else "Recette sans titre"

        # --- Recette : insertion uniquement si l'URL est nouvelle ---
        cursor.execute("SELECT idRecette FROM Recettes WHERE url = %s", (url,))
        row = cursor.fetchone()

        if row:
            # La recette existe déjà → on ne la réécrit pas
            print(f"   [DÉJÀ EN BASE] {nom}")
            return
        
        cursor.execute(
            "INSERT INTO Recettes (nomRecette, idPlat, url) VALUES (%s, %s, %s)",
            (nom, id_plat, url)
        )
        id_recette = cursor.lastrowid

        # --- Corps de l'article ---
        corps = soup.select_one(".Post-content, .post-body, .entry-content, .PostBody")
        if not corps:
            print(f"   [AVERT] Corps introuvable pour : {nom}")
            conn.commit()
            return

        mots_cles_unites = [
            "g ", "gr ", "kg ", "cl ", "ml ", " l ",
            "cuillère", "cuilleres", "c. à", "c.à",
            "tasse", "sachet", "pincée", "gousse",
            "tranche", "filet", "botte", "branche"
        ]

        lignes = corps.find_all(["li", "p"])
        etape_compteur = 1

        for ligne in lignes:
            texte = ligne.get_text(strip=True)
            if len(texte) < 5:
                continue

            est_ingredient = any(mot in texte.lower() for mot in mots_cles_unites)

            if est_ingredient:
                # Ingrédient : INSERT IGNORE si déjà connu (même nom = même ingrédient)
                cursor.execute(
                    "INSERT IGNORE INTO Ingredients (nomIngredient) VALUES (%s)",
                    (texte,)
                )
                cursor.execute(
                    "SELECT idIngredient FROM Ingredients WHERE nomIngredient = %s",
                    (texte,)
                )
                id_ing = cursor.fetchone()[0]

                # Liaison recette↔ingrédient : INSERT IGNORE si déjà liée
                cursor.execute(
                    "INSERT IGNORE INTO RecettesIngredients "
                    "(idRecette, idIngredient, nbrIngredient) VALUES (%s, %s, %s)",
                    (id_recette, id_ing, "À vérifier")
                )
            else:
                # Étape : INSERT IGNORE grâce à la contrainte UNIQUE(idRecette, numeroEtape)
                cursor.execute(
                    "INSERT IGNORE INTO Etapes (numeroEtape, textEtape, idRecette) "
                    "VALUES (%s, %s, %s)",
                    (etape_compteur, texte, id_recette)
                )
                etape_compteur += 1

        conn.commit()
        print(f"   [OK] {nom} ({etape_compteur - 1} étapes)")

    except mysql.connector.Error as e:
        conn.rollback()
        print(f"   [ERREUR SQL] {url} → {e}")
    except Exception as e:
        conn.rollback()
        print(f"   [ERREUR] {url} → {e}")
    finally:
        cursor.close()

# --- MAIN ---

def main():
    print("=== Scraper : Les Recettes de Virginie (MySQL) ===\n")

    conn = get_db_connection()
    cursor = conn.cursor()
    verify_tables(cursor)

    # Récupère ou crée le Plat de référence sans écraser ce qui existe
    id_plat = get_or_create_plat(cursor, conn)
    cursor.close()

    # --- Phase 1 : Collecte des URLs ---
    print(f"\n--- Phase 1 : Collecte des liens ({MAX_PAGES} pages) ---")
    toutes_les_urls = set()
    page_num = 1
    page_url = BASE_URL

    while page_url:
        print(f"  Page {page_num}/{MAX_PAGES} : {page_url}")
        html = fetch_html(page_url)
        if not html:
            break

        soup = BeautifulSoup(html, "html.parser")
        nouvelles = get_recipe_urls_from_page(soup)
        toutes_les_urls.update(nouvelles)
        print(f"    → {len(nouvelles)} recette(s) | Total : {len(toutes_les_urls)}")

        page_url = get_next_page_url(page_num)
        page_num += 1
        time.sleep(1.5)

    print(f"\n{len(toutes_les_urls)} recette(s) trouvées.\n")

    # --- Phase 2 : Scraping ---
    # Retirer [:5] pour tout scraper
    print("--- Phase 2 : Scraping des recettes (limité à 5 pour la démo) ---\n")
    urls_a_traiter = list(toutes_les_urls)[:5]

    for i, url in enumerate(urls_a_traiter):
        print(f"({i+1}/{len(urls_a_traiter)}) {url}")
        process_recipe(url, id_plat, conn)
        time.sleep(2)

    conn.close()
    print(f"\n=== Terminé ! ===")

if __name__ == "__main__":
    main()
