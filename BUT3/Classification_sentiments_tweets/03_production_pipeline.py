# Export Python depuis 03_Production_Pipeline_etudiant.ipynb
# Projet : Classification des sentiments des tweets



# %% [markdown] Cellule 0
# 03 — Pipeline de Production : Kafka + Spark Streaming + ML
# 
# **Objectif** : Assembler tout ce qui a ete developpe en Phase 1 dans un pipeline de production temps reel.
# 
# **Architecture** :
# 
# Kafka Producer → Topic `tweets-raw-{username}` → Spark Structured Streaming → Modele ML → HDFS → Dashboard
# 
# **Prerequis** :
# - Kafka demarre (verifiez dans Kafka-UI : http://10.15.61.20:8080)
# - Modele ML sauvegarde sur HDFS (`hdfs:///models/sentiment_model`) — cf. notebook 02
# - Notebook `00_Setup.ipynb` execute (kafka-python installe)


# %% Cellule 1
import sys, os

_user_pkg_dir = os.path.expanduser("~/python_packages")
if _user_pkg_dir not in sys.path:
    sys.path.insert(0, _user_pkg_dir)

username = os.environ.get('USER', 'unknown')
topic = f"tweets-raw-{username}"
print(f"Utilisateur : {username}")
print(f"Topic Kafka : {topic}")


# %% [markdown] Cellule 2
# 1. Verification de Kafka


# %% Cellule 3
from kafka.admin import KafkaAdminClient

try:
    admin = KafkaAdminClient(bootstrap_servers='kafka:9092', request_timeout_ms=5000)
    topics = admin.list_topics()
    print(f"[OK] Connexion Kafka reussie")
    print(f"Topics existants ({len(topics)}) : {', '.join(topics[:10]) if topics else 'aucun'}")
    admin.close()
except Exception as e:
    print(f"[ERREUR] Impossible de se connecter a Kafka : {e}")
    print("Verifiez que le stack Kafka est demarre.")


# %% [markdown] Cellule 4
# 2. Producteur Kafka minimal


# %% [markdown] Cellule 5
# python ~/notebooks/scripts/kafka_producer.py --rate 100 --no-shuffle
# hdfs dfs -mkdir -p /user/eferoux/notebooks/scripts
# hdfs dfs -put kafka_producer.py /user/eferoux/notebooks/scripts/


# %% [markdown] Cellule 6
# 3. Consommateur Kafka minimal


# %% Cellule 7
from kafka import KafkaConsumer
import json

# ============================================================
# TODO [Exercice 3.1] : Consommateur Kafka minimal
# ============================================================

# 1. Configuration du consommateur selon les indices fournis
consumer = KafkaConsumer(
    topic,                          
    bootstrap_servers='kafka:9092',
    auto_offset_reset='earliest',
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    consumer_timeout_ms=5000
)

print(f"📥 Lecture des messages sur le topic : {topic}...")
print("-" * 50)

count = 0
try:
    # 2. Itération sur le flux de messages
    for message in consumer:
        tweet = message.value
        print(f"Tweet {count+1} | User: {tweet['user']} | Text: {tweet['text'][:60]}...")
        count += 1
        
        # On peut s'arrêter après 10 messages pour valider l'exercice
        if count >= 1000:
            break

    print("-" * 50)
    print(f"✅ Terminé : {count} messages reçus.")

except Exception as e:
    print(f"❌ Erreur lors de la lecture : {e}")
finally:
    consumer.close()


# %% [markdown] Cellule 8
# 4. Spark Structured Streaming depuis Kafka


# %% Cellule 9
from pyspark.sql import SparkSession

import os

# Définir les variables d'environnement AVANT de créer SparkSession
os.environ['http_proxy'] = 'http://proxy.iutn.univ-poitiers.fr:3128'
os.environ['https_proxy'] = 'http://proxy.iutn.univ-poitiers.fr:3128'
os.environ['HTTP_PROXY'] = 'http://proxy.iutn.univ-poitiers.fr:3128'
os.environ['HTTPS_PROXY'] = 'http://proxy.iutn.univ-poitiers.fr:3128'

# Configuration Java pour Ivy (téléchargement Maven)
os.environ['JAVA_TOOL_OPTIONS'] = (
    '-Dhttp.proxyHost=proxy.iutn.univ-poitiers.fr -Dhttp.proxyPort=3128 '
    '-Dhttps.proxyHost=proxy.iutn.univ-poitiers.fr -Dhttps.proxyPort=3128'
)




spark = SparkSession.builder \
    .appName(f"Production-{username}") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.3") \
    .config("spark.driver.memory", "2g") \
    .config("spark.executor.memory", "4g") \
    .config("spark.executor.cores", "2") \
    .config("spark.executor.instances", "2") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")
print(f"SparkSession creee avec le connecteur Kafka")


# %% Cellule 10
from pyspark.sql.functions import col, from_json, to_timestamp
from pyspark.sql.types import StructType, StructField, StringType, IntegerType

# 1. Définition du schéma JSON correspondant aux messages envoyés par le producteur
schema = StructType([
    StructField("sentiment", IntegerType(), True),
    StructField("tweet_id", StringType(), True),
    StructField("date", StringType(), True),
    StructField("user", StringType(), True),
    StructField("text", StringType(), True),
    StructField("produced_at", StringType(), True)
])

# 2. Lecture du flux streaming depuis Kafka
df_kafka = spark.readStream.format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", topic) \
    .option("startingOffsets", "latest") \
    .load()

# 3. Parsing du JSON et ajout du timestamp d'événement (event_time)
df_parsed = df_kafka.select(
    from_json(col("value").cast("string"), schema).alias("data")
).select("data.*") \
 .withColumn("event_time", to_timestamp(col("produced_at")))

# Vérification du schéma en console
df_parsed.printSchema()


# %% [markdown] Cellule 11
# 5. Integration du modele ML
# 
# > **Attention au training-serving skew** : le nettoyage de texte doit etre **identique** a celui utilise lors de l'entrainement (notebook 02).


# %% Cellule 12
import re
from pyspark.sql.functions import udf, col
from pyspark.sql.types import StringType as ST
from pyspark.ml import PipelineModel

# UDF de nettoyage IDENTIQUE au training (notebook 02)
def clean_text(text):
    if text is None:
        return ""
    text = text.lower()
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#', '', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

clean_text_udf = udf(clean_text, ST())

# ============================================================
# TODO [Exercice 5.1] : Integration du modele ML
# ============================================================

# 1. Appliquez le nettoyage sur df_parsed -> df_cleaned
df_cleaned = df_parsed.withColumn("clean_text", clean_text_udf(col("text")))

# 2. Chargez le modele ML depuis HDFS
model_path = f"hdfs:///user/{username}/models/sentiment_model"
model = PipelineModel.load(model_path)

# 3. Appliquez le modele sur df_cleaned
df_inference = model.transform(df_cleaned)

# 4. Selectionnez les colonnes utiles dans df_predicted
df_predicted = df_inference.select(
    "tweet_id", 
    "user", 
    "text", 
    "event_time", 
    "sentiment", 
    col("prediction").alias("predicted_sentiment"), 
    "clean_text"
)

# Affichage du schéma streaming
df_predicted.printSchema()


# %% [markdown] Cellule 13
# 6. Ecriture des resultats vers HDFS


# %% Cellule 14
# Correction des chemins avec l'autorité explicite
output_path = f"hdfs://master:9001/user/{username}/streaming_results"
checkpoint_path = f"hdfs://master:9001/user/{username}/streaming_checkpoints"

# ============================================================
# TODO [Exercice 6.1] : Ecriture des predictions sur HDFS
# ============================================================

query_predictions = df_predicted.select(
    "tweet_id", 
    "user", 
    "text", 
    "event_time", 
    "predicted_sentiment"
) \
    .writeStream \
    .format("json") \
    .option("path", output_path) \
    .option("checkpointLocation", checkpoint_path) \
    .trigger(processingTime="10 seconds") \
    .start()

print(f"✅ Requête démarrée avec succès !")
print(f"Ecriture des predictions vers : {output_path}")


# %% [markdown] Cellule 15
# 7. Verification des resultats


# %% Cellule 16
import time
time.sleep(30)  # Attendre que des donnees arrivent

# Lire les resultats ecrits sur HDFS
df_results = spark.read.json(output_path)
print(f"Nombre de tweets predits : {df_results.count()}")
print()

# Apercu
df_results.show(10, truncate=50)

# Distribution des predictions
print("=== Distribution des predictions ===")
df_results.groupBy("predicted_sentiment").count().show()


# %% [markdown] Cellule 17
# 8. Monitoring du pipeline


# %% Cellule 18
# Statut de la query
print(f"Query active : {query_predictions.isActive}")
print(f"Dernier progres :")
progress = query_predictions.lastProgress
if progress:
    print(f"  Timestamp      : {progress.get('timestamp', 'N/A')}")
    print(f"  Lignes traitees: {progress.get('numInputRows', 'N/A')}")
    print(f"  Duree batch    : {progress.get('batchDuration', 'N/A')} ms")


# %% [markdown] Cellule 19
# 9. Arret


# %% Cellule 20
# Arreter la query de streaming
query_predictions.stop()
print("Query de streaming arretee.")

spark.stop()
print("SparkSession arretee.")


# %% [markdown] Cellule 21
# 10. Questions de reflexion
# 
# 1. **TCP vs Kafka** : Comparez l'architecture TCP socket (Phase 1) avec Kafka (Phase 2). Quels sont les avantages et inconvenients de chacune ?
# 
# 1. TCP vs Kafka : Comparaison d'architecture
# 
# | Caractéristique | TCP Socket (Phase 1) | Kafka (Phase 2) |
# | :--- | :--- | :--- |
# | **Persistance** | **Nulle** : Les données sont perdues si Spark n'est pas prêt au moment de l'envoi. | **Haute** : Kafka stocke les messages sur disque, permettant de rejouer le flux (`earliest`). |
# | **Couplage** | **Fort** : Le producteur doit connaître la destination et les deux doivent être connectés en même temps. | **Faible** : Producteurs et consommateurs sont indépendants ; le flux est "tamponné" dans le topic. |
# | **Évolutivité** | **Limitée** : Difficile d'envoyer un flux TCP vers plusieurs consommateurs simultanément. | **Excellente** : Plusieurs applications (ML, Dashboard, SQL) peuvent lire le même topic en parallèle. |
# | **Complexité** | Très simple à implémenter pour du test. | Plus complexe (nécessite un broker et la gestion des offsets). |
# 
# ---
# 
# 2. Back-pressure : Gestion de la congestion
# 
# Le phénomène de **Back-pressure** survient lorsque la vitesse de traitement de Spark est inférieure à la vitesse de production de Kafka (ex: inférence ML trop lourde).
# 
# * **En TCP Socket** : Le buffer réseau sature. Sans mécanisme de contrôle, les nouveaux messages sont soit rejetés (perte de données), soit le système source se bloque, risquant de faire planter le producteur.
# * **Avec Kafka** : Kafka sert de **tampon élastique**. Si Spark ralentit, les tweets s'accumulent simplement dans les partitions de Kafka sans perte de données. Spark traite les micro-batchs dès qu'il a des ressources et rattrape son retard en suivant les **offsets**.
# 
# ---
# 
# 3. Passage à l'échelle : 1 million de tweets par seconde
# 
# | Composant | Goulot d'étranglement | Solution pour le passage à l'échelle |
# | :--- | :--- | :--- |
# | **Kafka** | I/O Disque et débit limité sur un seul broker. | Augmenter le nombre de **Partitions** et déployer un cluster multi-brokers. |
# | **Spark** | Puissance de calcul pour l'inférence ML sur un seul worker. | Augmenter le nombre d'**Executors** et de **Cores** sur YARN. |
# | **HDFS** | Saturation du NameNode ("Small Files Problem"). | Utiliser **Parquet** ou **Avro** et regrouper les écritures (compactage). |
# | **Modèle ML** | Lenteur des UDF Python classiques. | Utiliser des **Pandas UDF (Vectorisées)** ou fonctions natives Spark SQL. |
# 
