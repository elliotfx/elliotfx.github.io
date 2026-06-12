# Export Python depuis 01_Streaming_Indicateurs_etudiant.ipynb
# Projet : Classification des sentiments des tweets



# %% [markdown] Cellule 0
# 01 — Indicateurs de Streaming en Temps Reel
# 
# **Objectif** : Analyser un flux de tweets en temps reel avec Spark Structured Streaming. Les tweets sont pre-tagues (le sentiment est deja connu dans les donnees). Vous devez construire des indicateurs d'analyse.
# 
# **Prerequis** : L'enseignant a lance le serveur TCP sur le port 9999. Verifiez qu'il est actif avant de commencer.


# %% Cellule 1
import os
username = os.environ.get('USER', 'unknown')

from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName(f"Streaming-{username}") \
    .config("spark.driver.memory", "512m") \
    .config("spark.executor.memory", "1g") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")
print(f"SparkSession creee : {spark.version}")


# %% [markdown] Cellule 2
# 1. Connexion au flux TCP
# 
# Le serveur envoie des lignes CSV au format :
# `"sentiment","tweet_id","date","query","user","text"`
# 
# - sentiment : 0 (negatif) ou 4 (positif)


# %% Cellule 3
# Connexion au flux TCP
raw_stream = spark.readStream \
    .format("socket") \
    .option("host", "localhost") \
    .option("port", 9999) \
    .load()

print(f"Schema du flux brut : {raw_stream.schema}")


# %% [markdown] Cellule 4
# 2. Parsing du flux CSV


# %% Cellule 5
from pyspark.sql.functions import (
    col, split, regexp_replace, current_timestamp, window,
    count, avg, sum, when, explode, desc, lit
)
from pyspark.sql.types import IntegerType, DoubleType

# ============================================================
# TODO [Exercice 2.1] : Parser le flux CSV
#
# Consigne : Parsez la colonne 'value' du flux brut pour extraire
#            les champs sentiment, tweet_id, date, user, text.
#            Convertissez le sentiment : 0 -> -1, 4 -> +1
#            Ajoutez un champ event_time = current_timestamp()
#
# Indice   : Utilisez split(col("value"), '","') pour separer les champs
#            et regexp_replace(..., '"', '') pour enlever les guillemets
#            Utilisez when() pour la conversion du sentiment
#            Le resultat doit s'appeler 'parsed'
#
# Attendu  : Un DataFrame 'parsed' avec les colonnes :
#            sentiment, tweet_id, date, user, text, sentiment_score, event_time
# ============================================================

# Votre code ici :
from pyspark.sql.functions import from_csv

schema = "sentiment INT, tweet_id STRING, date STRING, query STRING, user STRING, text STRING"

parsed = raw_stream.select(
    from_csv(col("value"), schema).alias("data")
).select("data.*").withColumn(
    "sentiment_score",
    when(col("sentiment") == 0, lit(-1))
    .when(col("sentiment") == 4, lit(1))
    .otherwise(lit(0))
).withColumn("event_time", current_timestamp())


# %% [markdown] Cellule 6
# 3. Monitoring global : volume par fenetre


# %% Cellule 7
# ============================================================
# TODO [Exercice 3.1] : Comptage par fenetre temporelle
#
# Consigne : Comptez le nombre de tweets par fenetre de 30 secondes
#            et ecrivez le resultat vers un sink memoire nomme 'volume_par_fenetre'
#
# Indice   : Utilisez .groupBy(window("event_time", "30 seconds")).count()
#            Ecrivez avec .writeStream.outputMode("complete").format("memory")
#            .queryName("volume_par_fenetre").start()
#
# Attendu  : Une query active ecrivant dans la table 'volume_par_fenetre'
# ============================================================

query_volume = (
    parsed
    .groupBy(window("event_time", "30 seconds"))
    .count()
    .withColumn("debut_fenetre", col("window.start"))
    .writeStream
    .outputMode("complete")
    .format("memory")
    .queryName("volume_par_fenetre")
    .start()
)


# %% Cellule 8
import time
time.sleep(120)  # Attendre quelques secondes pour accumuler des donnees
spark.sql("SELECT * FROM volume_par_fenetre ORDER BY debut_fenetre DESC").show(10, truncate=False)


# %% Cellule 9
query_volume.stop()


# %% [markdown] Cellule 10
# 4. Ratio de sentiment par fenetre


# %% Cellule 11
# ============================================================
# TODO [Exercice 4.1] : Ratio de sentiment par fenetre
#
# Consigne : Pour chaque fenetre de 30 secondes, calculez :
#            - le total de tweets
#            - le nombre de positifs (sentiment_score == 1)
#            - le nombre de negatifs (sentiment_score == -1)
#            - le sentiment moyen
#            Ecrivez vers un sink memoire nomme 'sentiment_par_fenetre'
#
# Indice   : Utilisez .groupBy(window(...)).agg(count, sum+when, avg)
#            sum(when(col("sentiment_score") == 1, 1).otherwise(0)) pour compter les positifs
#
# Attendu  : Une query active avec les colonnes debut_fenetre, total, positifs, negatifs, sentiment_moyen
# ============================================================

# Votre code ici :
query_sentiment = (
    parsed
    .groupBy(window("event_time", "30 seconds"))
    .agg(
        count("*").alias("total"),
        sum(when(col("sentiment_score") == 1, 1).otherwise(0)).alias("positifs"),
        sum(when(col("sentiment_score") == -1, 1).otherwise(0)).alias("negatifs"),
        avg("sentiment_score").alias("sentiment_moyen")
    )
    .withColumn("debut_fenetre", col("window.start"))
    .writeStream
    .outputMode("complete")
    .format("memory")
    .queryName("sentiment_par_fenetre")
    .start()
)


# %% Cellule 12
time.sleep(120)
spark.sql("SELECT * FROM sentiment_par_fenetre ORDER BY debut_fenetre DESC").show(10, truncate=False)


# %% Cellule 13
query_sentiment.stop()


# %% [markdown] Cellule 14
# 5. Hashtags trending


# %% Cellule 15
from pyspark.sql.functions import lower, regexp_extract_all

# ============================================================
# TODO [Exercice 5.1] : Extraction des hashtags trending
#
# Consigne : Extrayez tous les hashtags (#motcle) du texte des tweets,
#            puis comptez-les par fenetre de 1 minute.
#            Ecrivez vers un sink memoire nomme 'top_hashtags'
#
# Indice   : regexp_extract_all(lower(col("text")), lit(r"#(\w+)"), 1) extrait les hashtags
#            explode() transforme un tableau en lignes individuelles
#            Groupez par window + hashtag, comptez et triez par count desc
#
# Attendu  : Une query active avec le top des hashtags par fenetre
# ============================================================
query_hashtags = (
    parsed
    .withColumn("hashtag", explode(regexp_extract_all(lower(col("text")), lit(r"#(\w+)"), 1)))
    .groupBy(window("event_time", "1 minute"), "hashtag")
    .agg(count("*").alias("count"))
    .writeStream
    .outputMode("complete")
    .format("memory")
    .queryName("top_hashtags")
    .start()
)


# %% Cellule 16
time.sleep(150)
spark.sql("SELECT window.start, hashtag, count FROM top_hashtags ORDER BY count DESC LIMIT 20").show(truncate=False)


# %% Cellule 17
query_hashtags.stop()


# %% [markdown] Cellule 18
# 6. Mentions les plus frequentes


# %% Cellule 19
# ============================================================
# TODO [Exercice 6.1] : Extraction des mentions @utilisateur
#
# Consigne : Extrayez les mentions @utilisateur du texte,
#            comptez-les par fenetre de 1 minute.
#            Ecrivez vers un sink memoire nomme 'top_mentions'
#
# Indice   : Meme approche que les hashtags mais avec le pattern @(\w+)
#            regexp_extract_all(lower(col("text")), lit(r"@(\w+)"), 1)
#
# Attendu  : Une query active avec le top des mentions par fenetre
# ============================================================

# Votre code ici :
query_mentions = (
    parsed
    .withColumn("mention", explode(regexp_extract_all(lower(col("text")), lit(r"@(\w+)"), 1)))
    .groupBy(window("event_time", "1 minute"), "mention")
    .agg(count("*").alias("count"))
    .writeStream
    .outputMode("complete")
    .format("memory")
    .queryName("top_mentions")
    .start()
)


# %% Cellule 20
time.sleep(150)
spark.sql("SELECT window.start, mention, count FROM top_mentions ORDER BY count DESC LIMIT 20").show(truncate=False)


# %% Cellule 21
query_mentions.stop()


# %% [markdown] Cellule 22
# 7. Analyse des utilisateurs


# %% Cellule 23
# ============================================================
# TODO [Exercice 7.1] : Top utilisateurs et profil sentiment
#
# Consigne : Calculez pour chaque utilisateur :
#            - le nombre de tweets
#            - le sentiment moyen
#            Triez par nombre de tweets decroissant.
#            Ecrivez vers un sink memoire nomme 'user_stats'
#
# Indice   : .groupBy("user").agg(count("*"), avg("sentiment_score"))
#            .orderBy(desc("nb_tweets"))
#
# Attendu  : Une query active avec colonnes user, nb_tweets, sentiment_moyen
# ============================================================

# Votre code ici :
query_users = (
    parsed
    .groupBy("user")
    .agg(
        count("*").alias("nb_tweets"),
        avg("sentiment_score").alias("sentiment_moyen")
    )
    .orderBy(desc("nb_tweets"))
    .writeStream
    .outputMode("complete")
    .format("memory")
    .queryName("user_stats")
    .start()
)


# %% Cellule 24
time.sleep(100)
print("=== Top 15 utilisateurs les plus actifs ===")
spark.sql("SELECT * FROM user_stats ORDER BY nb_tweets DESC LIMIT 15").show(truncate=False)

print("=== Utilisateurs les plus positifs (min 3 tweets) ===")
spark.sql("SELECT * FROM user_stats WHERE nb_tweets >= 3 ORDER BY sentiment_moyen DESC LIMIT 10").show(truncate=False)


# %% [markdown] Cellule 25
# 8. Systeme d'alerte
# 
# Detection d'une chute de sentiment dans une fenetre glissante de 1 minute (pas de 15 secondes). Alerte si le sentiment moyen est inferieur a -0.3 (plus de 65% de tweets negatifs).


# %% Cellule 26
# ============================================================
# TODO [Exercice 8.1] : Systeme d'alerte sentiment negatif
#
# Consigne : Creez une fenetre glissante de 1 minute avec un pas de 15 secondes.
#            Filtrez les fenetres ou le sentiment moyen est < -0.3
#            Ecrivez vers un sink memoire nomme 'alertes'
#
# Indice   : window("event_time", "1 minute", "15 seconds") pour la fenetre glissante
#            .filter(col("sentiment_moyen") < -0.3) pour le seuil d'alerte
#            Output mode "complete"
#
# Attendu  : Une query active montrant les fenetres en alerte
# ============================================================

# Votre code ici :
query_alertes = (
    parsed
    .groupBy(window("event_time", "1 minute", "15 seconds"))
    .agg(
        count("*").alias("total"),
        avg("sentiment_score").alias("sentiment_moyen")
    )
    .filter(col("sentiment_moyen") < -0.3)
    .withColumn("debut", col("window.start"))
    .writeStream
    .outputMode("complete")
    .format("memory")
    .queryName("alertes")
    .start()
)


# %% Cellule 27
time.sleep(90)
result = spark.sql("SELECT * FROM alertes ORDER BY debut DESC")
if result.count() > 0:
    print("ALERTE ! Fenetres avec sentiment tres negatif :")
    result.show(10, truncate=False)
else:
    print("Aucune alerte pour le moment.")


# %% Cellule 28
query_alertes.stop()


# %% [markdown] Cellule 29
# 9. Watermarking
# 
# Le watermarking permet a Spark de gerer les donnees qui arrivent en retard et de liberer la memoire des anciennes fenetres.


# %% Cellule 30
query_alertes_wm = (
    parsed
    .withWatermark("event_time", "1 minute")
    .groupBy(window("event_time", "1 minute", "15 seconds"))
    .agg(
        count("*").alias("total"),
        avg("sentiment_score").alias("sentiment_moyen")
    )
    .filter(col("sentiment_moyen") < -0.3)
    .writeStream
    .outputMode("append")
    .format("memory")
    .queryName("alertes_watermarked")
    .start()
)


# %% Cellule 31
time.sleep(90)  # Attendre que des fenetres soient finalisees
spark.sql("SELECT * FROM alertes_watermarked ORDER BY window.start DESC").show(10, truncate=False)


# %% Cellule 32
query_alertes_wm.stop()


# %% [markdown] Cellule 33
# 10. Arret des queries et de la session


# %% Cellule 34
# Arreter toutes les queries actives
for q in spark.streams.active:
    print(f"Arret de la query : {q.name}")
    q.stop()

print("Toutes les queries sont arretees.")
spark.stop()
print("SparkSession arretee.")
