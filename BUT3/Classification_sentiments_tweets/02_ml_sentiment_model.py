# Export Python depuis 02_ML_Sentiment_Model.ipynb
# Projet : Classification des sentiments des tweets



# %% [markdown] Cellule 0
# 02 — Construction d'un Modele de Sentiment avec PySpark MLlib
# 
# **Objectif** : Construire un pipeline de Machine Learning capable de predire le sentiment (positif/negatif) d'un tweet a partir de son texte.
# 
# **Ce modele sera reutilise en Phase 2** pour l'inference en temps reel dans le pipeline Kafka-Spark.
# 
# **Architecture du pipeline ML** :
# Texte brut → Nettoyage → Tokenization → Stop Words → TF-IDF → Logistic Regression


# %% Cellule 1
import os
username = os.environ.get('USER', 'unknown')

from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName(f"ML-Sentiment-{username}") \
    .config("spark.driver.memory", "2g") \
    .config("spark.executor.memory", "4g") \
    .config("spark.executor.cores", "2") \
    .config("spark.executor.instances", "2") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")
print(f"SparkSession creee : {spark.version} (master: {spark.conf.get('spark.master')})")


# %% [markdown] Cellule 2
# 1. Chargement et exploration des donnees


# %% Cellule 3
from pyspark.sql.functions import col, when

# ============================================================
# TODO [Exercice 1.1] : Chargement des donnees depuis HDFS
# ============================================================

# Chargement du CSV sans header depuis HDFS
df = spark.read.csv("hdfs:///data/tweets/tweets_dev.csv", header=False) \
    .toDF("sentiment", "tweet_id", "date", "query", "user", "text") \
    .withColumn("sentiment", col("sentiment").cast("int"))

# OPTIONNEL MAIS RECOMMANDÉ (selon le sujet PDF section 4.1) :
# Création de la colonne 'label' pour le Machine Learning
# 4 (positif) -> 1.0
# 0 (négatif) -> 0.0
df = df.withColumn(
    "label", 
    when(col("sentiment") == 4, 1.0).otherwise(0.0)
)

# Vérification (Affichage des 5 premières lignes)
print(f"Nombre total de tweets : {df.count()}")
df.show(5)
df.printSchema()


# %% Cellule 4
# ============================================================
# TODO [Exercice 1.2] : Exploration des donnees (EDA)
# ============================================================

# 1. Affichage de la distribution des sentiments
print("=== Distribution des classes ===")
df.groupBy("sentiment").count().show()

# 2. Exemples de tweets négatifs (sentiment = 0)
print("=== Exemples de tweets NEGATIFS (0) ===")
df.filter(col("sentiment") == 0) \
    .select("text") \
    .show(5, truncate=80)

# 3. Exemples de tweets positifs (sentiment = 4)
print("=== Exemples de tweets POSITIFS (4) ===")
df.filter(col("sentiment") == 4) \
    .select("text") \
    .show(5, truncate=80)


# %% [markdown] Cellule 5
# 2. Conversion des labels


# %% Cellule 6
from pyspark.sql.functions import col, when

# ============================================================
# TODO [Exercice 2.1] : Conversion des labels
# ============================================================

# Création de la colonne 'label'
# 4 (Positif) -> 1.0
# 0 (Négatif) -> 0.0
# Tout autre cas (sécurité) -> 0.0
df = df.withColumn(
    "label",
    when(col("sentiment") == 4, 1.0).otherwise(0.0)
)

# Vérification
df.select("sentiment", "label").show(5)
df.printSchema()


# %% [markdown] Cellule 7
# 3. Nettoyage du texte
# 
# **Important** : La fonction de nettoyage doit etre identique entre l'entrainement et l'inference (Phase 2).
# Un ecart entre les deux (training-serving skew) degraderait les performances du modele.


# %% Cellule 8
import re
from pyspark.sql.functions import udf, col
from pyspark.sql.types import StringType

# ============================================================
# TODO [Exercice 3.1] : Nettoyage du texte avec UDF
# ============================================================

def clean_text(text):
    # Gestion des valeurs nulles pour éviter les erreurs
    if text is None:
        return ""
    
    # 1. Passage en minuscules
    text = text.lower()
    
    # 2. Suppression des URLs (http://...)
    text = re.sub(r'http\S+', '', text)
    
    # 3. Suppression des mentions (@utilisateur)
    text = re.sub(r'@\w+', '', text)
    
    # 4. Suppression du symbole # (on garde le mot, ex: "#joie" -> "joie")
    text = re.sub(r'#', '', text)
    
    # 5. Conservation uniquement des lettres et espaces (adieu ponctuation et chiffres)
    text = re.sub(r'[^a-z\s]', '', text)
    
    # 6. Normalisation des espaces (pas de double espace)
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

# Enregistrement de la fonction comme UDF Spark
clean_udf = udf(clean_text, StringType())

# Application de l'UDF pour créer la colonne 'clean_text'
df = df.withColumn("clean_text", clean_udf(col("text")))

# Vérification (Comparaison avant/après)
print("=== Comparaison Texte Brut vs Nettoyé ===")
df.select("text", "clean_text").show(5, truncate=50)


# %% [markdown] Cellule 9
# 4. Pipeline ML : TF-IDF + Logistic Regression
# 
# Le pipeline enchaine les etapes suivantes :
# 1. **RegexTokenizer** : decoupe le texte en mots
# 2. **StopWordsRemover** : supprime les mots vides (the, a, is...)
# 3. **CountVectorizer** : cree un vecteur de frequences de mots (Bag of Words)
# 4. **IDF** : pondere les frequences par l'Inverse Document Frequency
# 5. **LogisticRegression** : classifie le sentiment


# %% Cellule 10
from pyspark.ml.feature import RegexTokenizer, StopWordsRemover, NGram, VectorAssembler, CountVectorizer, IDF
from pyspark.ml.classification import LogisticRegression
from pyspark.ml import Pipeline

print("📦 Pipeline Baseline Amélioré (Logistic Regression)")

# 1. Tokenization et StopWords
tokenizer = RegexTokenizer(inputCol="clean_text", outputCol="words", pattern="\\W")
remover = StopWordsRemover(inputCol="words", outputCol="filtered")

# 2. N-grams
bigram = NGram(n=2, inputCol="filtered", outputCol="bigrams")
trigram = NGram(n=3, inputCol="filtered", outputCol="trigrams")

# 3. TF-IDF Unigrams
cv_uni = CountVectorizer(inputCol="filtered", outputCol="tf_uni", vocabSize=100000, minDF=3.0)
idf_uni = IDF(inputCol="tf_uni", outputCol="features_uni")

# 4. TF-IDF Bigrams
cv_bi = CountVectorizer(inputCol="bigrams", outputCol="tf_bi", vocabSize=100000, minDF=3.0)
idf_bi = IDF(inputCol="tf_bi", outputCol="features_bi")

# 5. TF-IDF Trigrams
cv_tri = CountVectorizer(inputCol="trigrams", outputCol="tf_tri", vocabSize=50000, minDF=3.0)
idf_tri = IDF(inputCol="tf_tri", outputCol="features_tri")

# 6. Combiner les 3
assembler = VectorAssembler(
    inputCols=["features_uni", "features_bi", "features_tri"], 
    outputCol="features"
)

# 7. Régression Logistique
lr = LogisticRegression(
    featuresCol="features",
    labelCol="label",
    maxIter=150,
    regParam=0.0001,
    elasticNetParam=0.0
)

# Pipeline
pipeline = Pipeline(stages=[
    tokenizer, remover, bigram, trigram, 
    cv_uni, idf_uni, cv_bi, idf_bi, cv_tri, idf_tri, 
    assembler, lr
])

print("Pipeline créé")


# %% [markdown] Cellule 11
# 5. Entrainement


# %% Cellule 12
# ============================================================
# TODO [Exercice 5.1] : Split et entrainement
# ============================================================

# 1. Division des données (Train 80% / Test 20%)
# Le seed=42 assure que la division est reproductible (toujours les mêmes tweets dans le train)
train_df, test_df = df.randomSplit([0.8, 0.2], seed=42)

print(f"Taille du jeu d'entraînement : {train_df.count()} tweets")
print(f"Taille du jeu de test : {test_df.count()} tweets")

# 2. Entraînement du modèle sur les données d'apprentissage
print("Entraînement du modèle en cours")
model = pipeline.fit(train_df)

print("Modèle entraîné avec succès !")


# %% [markdown] Cellule 13
# 6. Prediction et evaluation


# %% Cellule 14
# ============================================================
# TODO [Exercice 6.1] : Predictions
# ============================================================

# 1. Application du modèle sur le jeu de test
# Le modèle ajoute les colonnes 'prediction' (0.0 ou 1.0) et 'probability' (vecteur de confiance)
predictions = model.transform(test_df)

# 2. Affichage d'un aperçu
print("=== Aperçu des prédictions sur le jeu de test ===")
predictions.select("text", "label", "prediction", "probability") \
    .show(10, truncate=60)


# %% Cellule 15
from pyspark.ml.evaluation import BinaryClassificationEvaluator, MulticlassClassificationEvaluator

# ============================================================
# TODO [Exercice 6.2] : Evaluation du modele
# ============================================================

# 1. Calcul de l'AUC-ROC (Binary Classification)
binary_eval = BinaryClassificationEvaluator(
    labelCol="label", 
    rawPredictionCol="rawPrediction", 
    metricName="areaUnderROC"
)
auc = binary_eval.evaluate(predictions)

# 2. Calcul des autres métriques (Multiclass Classification)
multi_eval = MulticlassClassificationEvaluator(
    labelCol="label", 
    predictionCol="prediction"
)

accuracy = multi_eval.evaluate(predictions, {multi_eval.metricName: "accuracy"})
f1_score = multi_eval.evaluate(predictions, {multi_eval.metricName: "f1"})
weighted_precision = multi_eval.evaluate(predictions, {multi_eval.metricName: "weightedPrecision"})
weighted_recall = multi_eval.evaluate(predictions, {multi_eval.metricName: "weightedRecall"})

# 3. Affichage des résultats
print(f"*** Résultats de l'évaluation ***")
print(f"Area Under ROC (AUC) : {auc:.4f}")
print(f"Accuracy             : {accuracy:.4f}")
print(f"F1 Score             : {f1_score:.4f}")
print(f"Weighted Precision   : {weighted_precision:.4f}")
print(f"Weighted Recall      : {weighted_recall:.4f}")

# Vérification du critère de réussite
if auc > 0.70:
    print("Succès : L'AUC est supérieur à 0.70.")
else:
    print("Attention : L'AUC est inférieur à 0.70. Vérifiez votre nettoyage de texte.")


# %% Cellule 16
# ============================================================
# TODO [Exercice 6.3] : Matrice de confusion
# ============================================================

print("=== Matrice de Confusion (Label vs Prédiction) ===")

conf_matrix = predictions.crosstab("label", "prediction")
conf_matrix.show()


# %% [markdown] Cellule 17
# 7. Sauvegarde du modele
# 
# Le modele est sauvegarde sur HDFS a un chemin precis qui sera reutilise en Phase 2 pour l'inference en streaming.


# %% Cellule 18
# Sauvegarde sur HDFS (chemin exact utilise en Phase 2)
model_path = "hdfs:////user/eferoux/models/sentiment_model"
model.write().overwrite().save(model_path)
print(f"Modele sauvegarde : {model_path}")


# %% [markdown] Cellule 19
# 8. Verification du rechargement


# %% Cellule 20
from pyspark.ml import PipelineModel
from pyspark.sql.functions import col

# ============================================================
# ÉTAPE PRÉALABLE (Exercice 7.1 / 4.5) : Sauvegarde du modèle
# ============================================================
model.write().overwrite().save("hdfs:////user/eferoux/models/sentiment_model")
print("Modèle sauvegardé avec succès sur HDFS.")


# ============================================================
# TODO [Exercice 8.1] : Verification du rechargement du modele
# ============================================================

# 1. Rechargement du modèle depuis HDFS
loaded_model = PipelineModel.load("hdfs:///models/sentiment_model")

# 2. Création d'un petit jeu de données manuel (5 tweets)
data_verif = [
    ("J'adore Spark, c'est vraiment génial et puissant !",),
    ("C'est une catastrophe, je déteste ce service, nul.",),
    ("Le film était pas mal, mais un peu long.",),
    ("Je suis tellement heureux aujourd'hui #bonheur",),
    ("Mauvaise expérience, je ne recommande pas du tout.",)
]
df_verif = spark.createDataFrame(data_verif, ["text"])

# 3. Application du MÊME nettoyage que lors de l'entraînement
df_verif_clean = df_verif.withColumn("clean_text", clean_udf(col("text")))

# 4. Prédiction avec le modèle rechargé
predictions_verif = loaded_model.transform(df_verif_clean)

# 5. Affichage des résultats
print("=== Test du modèle rechargé ===")
predictions_verif.select("text", "prediction", "probability").show(truncate=False)


# %% [markdown] Cellule 21
# 9. Arret de la SparkSession


# %% Cellule 22
spark.stop()
print("SparkSession arretee.")
