# Export Python depuis 00_Setup.ipynb
# Projet : Classification des sentiments des tweets



# %% [markdown] Cellule 0
# 00 — Configuration de l'environnement
# 
# Ce notebook doit etre execute **au debut de chaque session de travail** afin de
# configurer et verifier votre environnement.
# 
# **Packages Python** (`kafka-python`, `voila`) : ils sont normalement pre-installes
# par l'enseignant via `setup_cluster.sh`. Si un package est manquant (ex. apres un
# redemarrage du conteneur), **la premiere cellule l'installe automatiquement** dans
# votre repertoire personnel (`~/python_packages/`).
# 
# Ce notebook verifie les elements suivants :
# - Disponibilite des paquets Python requis (avec installation automatique si necessaire)
# - Connexion a PySpark et au cluster YARN
# - Acces aux fichiers de donnees sur HDFS
# - Disponibilite du broker Kafka
# - Installation de Voila pour les dashboards
# 
# Executez toutes les cellules dans l'ordre. En cas de probleme, contactez l'enseignant.


# %% Cellule 1
import sys, os, importlib, subprocess

# 1. Ajouter ~/python_packages/ au sys.path
_user_pkg_dir = os.path.expanduser("~/python_packages")
if _user_pkg_dir not in sys.path:
    sys.path.insert(0, _user_pkg_dir)

# 2. Verifier les packages
packages = {"kafka": "kafka-python", "voila": "voila"}
missing = {}

for module, pip_name in packages.items():
    try:
        importlib.import_module(module)
        print(f"  [OK] {pip_name}")
    except ImportError:
        missing[module] = pip_name
        print(f"  [MANQUANT] {pip_name}")

# 3. Installer les packages manquants via --target
if missing:
    print(f"\nInstallation dans ~/python_packages/ ...")
    os.makedirs(_user_pkg_dir, exist_ok=True)
    _proxy = "http://proxy.iutn.univ-poitiers.fr:3128"
    _env = os.environ.copy()
    _env.update({
        "HTTP_PROXY": _proxy,
        "HTTPS_PROXY": _proxy,
        "http_proxy": _proxy,
        "https_proxy": _proxy,
    })
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install",
            "--target", _user_pkg_dir,
            "--no-warn-script-location", "-q",
        ] + list(missing.values()), env=_env)
        print("[OK] Installation terminee.\n")
    except subprocess.CalledProcessError as e:
        print(f"[ERREUR] pip a echoue (code {e.returncode}).")
        print("  Verifiez votre connexion reseau ou contactez l'enseignant.\n")

    # 4. Re-verifier
    importlib.invalidate_caches()
    all_ok = True
    for module, pip_name in packages.items():
        try:
            importlib.import_module(module)
            print(f"  [OK] {pip_name}")
        except ImportError:
            print(f"  [ERREUR] {pip_name} — echec de l'import apres installation")
            all_ok = False

    if all_ok:
        print("\nTous les packages sont maintenant disponibles.")
    else:
        print("\nCertains packages n'ont pas pu etre installes.")
        print("Contactez l'enseignant.")
else:
    print("\nTous les packages sont disponibles.")


# %% [markdown] Cellule 2
# Verification de PySpark et YARN


# %% Cellule 3
import os
username = os.environ.get('USER', 'unknown')
print(f"Utilisateur : {username}")

from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName(f"Setup-{username}") \
    .config("spark.driver.memory", "512m") \
    .config("spark.executor.memory", "1g") \
    .getOrCreate()

print(f"Spark version : {spark.version}")
print(f"Spark master  : {spark.conf.get('spark.master')}")
print(f"SparkSession OK !")


# %% [markdown] Cellule 4
# Verification HDFS


# %% Cellule 5
# Verifier les fichiers de donnees sur HDFS
hdfs_files = spark.sparkContext._jvm.org.apache.hadoop.fs.FileSystem \
    .get(spark.sparkContext._jsc.hadoopConfiguration())

from py4j.java_gateway import java_import
java_import(spark.sparkContext._jvm, "org.apache.hadoop.fs.Path")

paths_to_check = [
    "/data/tweets/tweets_dev.csv",
    "/data/tweets/tweets_prod.csv",
]

print("=== Verification des fichiers HDFS ===")
for p in paths_to_check:
    path = spark.sparkContext._jvm.Path(p)
    exists = hdfs_files.exists(path)
    if exists:
        status = hdfs_files.getFileStatus(path)
        size_mb = status.getLen() / (1024 * 1024)
        print(f"  [OK] {p} ({size_mb:.1f} MB)")
    else:
        print(f"  [MANQUANT] {p} \u2014 Contactez l'enseignant")


# %% Cellule 6
# Apercu rapide des donnees
df_sample = spark.read.csv("hdfs:///data/tweets/tweets_dev.csv", header=False) \
    .limit(5) \
    .toDF("sentiment", "tweet_id", "date", "query", "user", "text")

print("=== Apercu du dataset (5 premieres lignes) ===")
df_sample.show(truncate=50)
print(f"Colonnes : {df_sample.columns}")


# %% [markdown] Cellule 7
# Verification Kafka


# %% Cellule 8
try:
    from kafka import KafkaProducer, KafkaConsumer
    print("[OK] kafka-python installe")
    
    # Tester la connexion au broker
    from kafka.admin import KafkaAdminClient
    try:
        admin = KafkaAdminClient(bootstrap_servers='kafka:9092', request_timeout_ms=5000)
        topics = admin.list_topics()
        print(f"[OK] Connexion Kafka reussie — {len(topics)} topics existants")
        if topics:
            print(f"     Topics : {', '.join(topics[:10])}")
        admin.close()
    except Exception as e:
        print(f"[ATTENTION] Kafka non accessible : {e}")
        print("     C'est normal si Kafka n'est pas encore demarre (Phase 2 uniquement)")
except ImportError:
    print("[ERREUR] kafka-python non installe — executez la premiere cellule de ce notebook")


# %% [markdown] Cellule 9
# Verification Voila


# %% Cellule 10
try:
    import voila
    print(f"[OK] voila installe (version {voila.__version__})")
except ImportError:
    print("[ERREUR] voila non installe — executez la premiere cellule de ce notebook")


# %% [markdown] Cellule 11
# Resume


# %% Cellule 12
print("=" * 50)
print("RESUME DE LA CONFIGURATION")
print("=" * 50)
print(f"Utilisateur      : {username}")
print(f"Spark            : {spark.version}")
print(f"HDFS             : Accessible")
print(f"Kafka-python     : Installe")
print(f"Voila            : Installe")
print()
print("Vous etes pret(e) a commencer le projet !")
print()
print("Prochaines etapes :")
print("  - Phase 1 Track A : 01_Streaming_Indicateurs_etudiant.ipynb")
print("  - Phase 1 Track B : 02_ML_Sentiment_Model_etudiant.ipynb")
print("  - Phase 2         : 03_Production_Pipeline_etudiant.ipynb")
print("=" * 50)


# %% Cellule 13
spark.stop()
print("SparkSession arretee. Vous pouvez maintenant ouvrir un autre notebook.")
