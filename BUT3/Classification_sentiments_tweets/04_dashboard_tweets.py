# Export Python depuis 04_Dashboard_Tweets-3.ipynb
# Projet : Classification des sentiments des tweets



# %% [markdown] Cellule 0
# 04 — Dashboard de Visualisation des Tweets
# 
# **Objectif** : Visualiser les résultats du pipeline de production (notebook 03) à l'aide de graphiques interactifs.
# 
# **Prérequis** :
# - Le pipeline de production (notebook 03) a écrit des résultats sur HDFS
# - Les bibliothèques `matplotlib`, `plotly`, `wordcloud` sont disponibles
# 
# **Architecture** :
# 
# HDFS (JSON) → Spark (lecture batch) → Pandas → Matplotlib / Plotly → Dashboard


# %% Cellule 1
# !pip install matplotlib plotly wordcloud pandas seaborn


# %% Cellule 2
import os
username = os.environ.get('USER', 'unknown')

from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName(f"Dashboard-{username}") \
    .config("spark.driver.memory", "2g") \
    .config("spark.executor.memory", "4g") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")
print(f"SparkSession créée : {spark.version}")


# %% [markdown] Cellule 3
# 1. Chargement des résultats depuis HDFS
# 
# On lit les fichiers JSON produits par le pipeline de production (notebook 03).
# 
# Colonnes attendues : `tweet_id`, `user`, `text`, `event_time`, `predicted_sentiment`


# %% Cellule 4
from pyspark.sql.functions import col, when, lit, count, avg, hour, minute, lower, explode, desc
from pyspark.sql.functions import regexp_extract_all, window, to_timestamp, date_format
from pyspark.sql.types import IntegerType

# Chemin HDFS des résultats du pipeline de production
output_path = f"hdfs://master:9001/user/{username}/streaming_results"

# Lecture des résultats
df_results = spark.read.json(output_path)

# Conversion du timestamp si nécessaire
df_results = df_results.withColumn("event_time", to_timestamp(col("event_time")))

# Ajout d'un label textuel pour la lisibilité
df_results = df_results.withColumn(
    "sentiment_label",
    when(col("predicted_sentiment") == 1.0, "Positif")
    .when(col("predicted_sentiment") == 0.0, "Négatif")
    .otherwise("Inconnu")
)

total = df_results.count()
print(f"Nombre total de tweets chargés : {total}")
df_results.printSchema()
df_results.show(5, truncate=60)


# %% Cellule 5
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Style global Matplotlib
plt.style.use("seaborn-v0_8-whitegrid")
sns.set_palette("husl")

# Conversion en Pandas pour les visualisations
pdf = df_results.toPandas()
pdf["event_time"] = pd.to_datetime(pdf["event_time"])

print(f"DataFrame Pandas : {pdf.shape[0]} lignes, {pdf.shape[1]} colonnes")
pdf.head()


# %% [markdown] Cellule 6
# ---
# 2. Distribution globale du sentiment
# 
# Camembert (pie chart) et barres montrant la répartition positif vs négatif.


# %% Cellule 7
# === 2.1 Camembert avec Plotly ===
sentiment_counts = pdf['sentiment_label'].value_counts().reset_index()
sentiment_counts.columns = ['Sentiment', 'Nombre']

colors = {'Positif': '#2ecc71', 'Négatif': '#e74c3c', 'Inconnu': '#95a5a6'}

fig = px.pie(
    sentiment_counts, 
    values='Nombre', 
    names='Sentiment',
    title='Distribution globale du sentiment des tweets',
    color='Sentiment',
    color_discrete_map=colors,
    hole=0.4  # donut chart
)
fig.update_traces(textposition='inside', textinfo='percent+label+value')
fig.update_layout(width=600, height=450)
fig.show()


# %% Cellule 8
# === 2.2 Barres avec Matplotlib ===
fig, ax = plt.subplots(figsize=(8, 4))

sentiment_data = pdf['sentiment_label'].value_counts()
bars = ax.bar(
    sentiment_data.index, 
    sentiment_data.values, 
    color=[colors.get(s, '#95a5a6') for s in sentiment_data.index],
    edgecolor='white', linewidth=1.5
)

# Ajouter les valeurs sur les barres
for bar, val in zip(bars, sentiment_data.values):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + total*0.01,
            f'{val} ({val/total*100:.1f}%)', ha='center', fontweight='bold', fontsize=12)

ax.set_title('Répartition des prédictions de sentiment', fontsize=14, fontweight='bold')
ax.set_ylabel('Nombre de tweets')
ax.set_xlabel('Sentiment prédit')
plt.tight_layout()
plt.show()


# %% [markdown] Cellule 9
# ---
# 3. Évolution du sentiment dans le temps
# 
# Courbes temporelles montrant l'évolution du volume et du ratio de sentiment par fenêtre.


# %% Cellule 10
# === 3.1 Volume de tweets par fenêtre de 30 secondes (Plotly) ===

# Arrondir au pas de 30 secondes
pdf['time_bin_30s'] = pdf['event_time'].dt.floor('30s')

volume_time = pdf.groupby('time_bin_30s').agg(
    total=('predicted_sentiment', 'count'),
    positifs=('predicted_sentiment', lambda x: (x == 1.0).sum()),
    negatifs=('predicted_sentiment', lambda x: (x == 0.0).sum()),
    sentiment_moyen=('predicted_sentiment', 'mean')
).reset_index()

fig = make_subplots(
    rows=2, cols=1,
    subplot_titles=('Volume de tweets par fenêtre de 30s', 'Sentiment moyen par fenêtre'),
    vertical_spacing=0.15,
    shared_xaxes=True
)

# Volume empilé positif/négatif
fig.add_trace(
    go.Bar(x=volume_time['time_bin_30s'], y=volume_time['positifs'], 
           name='Positifs', marker_color='#2ecc71'),
    row=1, col=1
)
fig.add_trace(
    go.Bar(x=volume_time['time_bin_30s'], y=volume_time['negatifs'], 
           name='Négatifs', marker_color='#e74c3c'),
    row=1, col=1
)

# Sentiment moyen
fig.add_trace(
    go.Scatter(x=volume_time['time_bin_30s'], y=volume_time['sentiment_moyen'],
               mode='lines+markers', name='Sentiment moyen',
               line=dict(color='#3498db', width=2),
               marker=dict(size=5)),
    row=2, col=1
)

# Ligne de référence à 0.5
fig.add_hline(y=0.5, line_dash='dash', line_color='gray', 
              annotation_text='Neutre (0.5)', row=2, col=1)

fig.update_layout(
    height=650, width=1000,
    title_text='Évolution temporelle du flux de tweets',
    barmode='stack',
    showlegend=True
)
fig.update_yaxes(title_text='Nombre de tweets', row=1, col=1)
fig.update_yaxes(title_text='Sentiment moyen', row=2, col=1)
fig.update_xaxes(title_text='Temps', row=2, col=1)
fig.show()


# %% Cellule 11
# === 3.2 Courbe cumulative du sentiment (Matplotlib) ===
pdf_sorted = pdf.sort_values('event_time').copy()
pdf_sorted['cumul_positifs'] = (pdf_sorted['predicted_sentiment'] == 1.0).cumsum()
pdf_sorted['cumul_negatifs'] = (pdf_sorted['predicted_sentiment'] == 0.0).cumsum()
pdf_sorted['cumul_total'] = range(1, len(pdf_sorted) + 1)
pdf_sorted['ratio_positif_cumul'] = pdf_sorted['cumul_positifs'] / pdf_sorted['cumul_total']

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), sharex=True)

# Volume cumulé
ax1.fill_between(pdf_sorted['event_time'], pdf_sorted['cumul_positifs'], 
                 alpha=0.5, color='#2ecc71', label='Positifs')
ax1.fill_between(pdf_sorted['event_time'], pdf_sorted['cumul_positifs'], 
                 pdf_sorted['cumul_total'], alpha=0.5, color='#e74c3c', label='Négatifs')
ax1.set_ylabel('Nombre cumulé de tweets')
ax1.set_title('Volume cumulé de tweets (positifs vs négatifs)', fontweight='bold')
ax1.legend(loc='upper left')

# Ratio cumulé
ax2.plot(pdf_sorted['event_time'], pdf_sorted['ratio_positif_cumul'], 
         color='#3498db', linewidth=2)
ax2.axhline(y=0.5, color='gray', linestyle='--', alpha=0.7, label='Seuil 50%')
ax2.fill_between(pdf_sorted['event_time'], pdf_sorted['ratio_positif_cumul'], 0.5,
                 where=pdf_sorted['ratio_positif_cumul'] >= 0.5, alpha=0.3, color='#2ecc71')
ax2.fill_between(pdf_sorted['event_time'], pdf_sorted['ratio_positif_cumul'], 0.5,
                 where=pdf_sorted['ratio_positif_cumul'] < 0.5, alpha=0.3, color='#e74c3c')
ax2.set_ylabel('Ratio positif cumulé')
ax2.set_xlabel('Temps')
ax2.set_title('Ratio de tweets positifs au cours du temps', fontweight='bold')
ax2.set_ylim(0, 1)
ax2.legend()

plt.tight_layout()
plt.show()


# %% [markdown] Cellule 12
# ---
# 4. Top utilisateurs actifs et leur profil sentiment


# %% Cellule 13
# === 4.1 Top 15 utilisateurs les plus actifs (Plotly) ===
user_stats = pdf.groupby('user').agg(
    nb_tweets=('tweet_id', 'count'),
    sentiment_moyen=('predicted_sentiment', 'mean'),
    nb_positifs=('predicted_sentiment', lambda x: (x == 1.0).sum()),
    nb_negatifs=('predicted_sentiment', lambda x: (x == 0.0).sum())
).reset_index().sort_values('nb_tweets', ascending=False)

top_users = user_stats.head(15)

fig = go.Figure()

fig.add_trace(go.Bar(
    y=top_users['user'], x=top_users['nb_positifs'],
    name='Positifs', orientation='h', marker_color='#2ecc71'
))
fig.add_trace(go.Bar(
    y=top_users['user'], x=top_users['nb_negatifs'],
    name='Négatifs', orientation='h', marker_color='#e74c3c'
))

fig.update_layout(
    barmode='stack',
    title='Top 15 utilisateurs les plus actifs (répartition du sentiment)',
    xaxis_title='Nombre de tweets',
    yaxis_title='Utilisateur',
    height=500, width=900,
    yaxis=dict(autorange='reversed')
)
fig.show()


# %% Cellule 14
# === 4.2 Scatter : Activité vs Sentiment moyen (Plotly) ===
# On ne garde que les utilisateurs avec au moins 3 tweets
active_users = user_stats[user_stats['nb_tweets'] >= 3].copy()

fig = px.scatter(
    active_users,
    x='nb_tweets',
    y='sentiment_moyen',
    hover_name='user',
    size='nb_tweets',
    color='sentiment_moyen',
    color_continuous_scale=['#e74c3c', '#f39c12', '#2ecc71'],
    title='Profil des utilisateurs : Activité vs Sentiment moyen (min 3 tweets)',
    labels={
        'nb_tweets': 'Nombre de tweets',
        'sentiment_moyen': 'Sentiment moyen (0=Négatif, 1=Positif)'
    }
)
fig.add_hline(y=0.5, line_dash='dash', line_color='gray', annotation_text='Neutre')
fig.update_layout(height=500, width=900)
fig.show()


# %% [markdown] Cellule 15
# ---
# 5. Analyse des hashtags


# %% Cellule 16
import re
from collections import Counter

# === 5.1 Extraction des hashtags ===
all_hashtags = []
hashtags_pos = []
hashtags_neg = []

for _, row in pdf.iterrows():
    text = str(row['text']).lower()
    tags = re.findall(r'#(\w+)', text)
    all_hashtags.extend(tags)
    if row['predicted_sentiment'] == 1.0:
        hashtags_pos.extend(tags)
    else:
        hashtags_neg.extend(tags)

top_hashtags = Counter(all_hashtags).most_common(20)
top_pos = Counter(hashtags_pos).most_common(10)
top_neg = Counter(hashtags_neg).most_common(10)

print(f"Nombre total de hashtags extraits : {len(all_hashtags)}")
print(f"Hashtags uniques : {len(set(all_hashtags))}")

if len(top_hashtags) == 0:
    print("\nAucun hashtag trouvé dans les tweets.")
else:
    print(f"\nTop 10 hashtags : {top_hashtags[:10]}")


# %% Cellule 17
# === 5.2 Barres horizontales des top hashtags (Matplotlib) ===
if len(top_hashtags) > 0:
    tags_df = pd.DataFrame(top_hashtags, columns=['hashtag', 'count'])
    tags_df = tags_df.sort_values('count', ascending=True)  # pour affichage horizontal

    fig, ax = plt.subplots(figsize=(10, 6))
    colors_ht = plt.cm.viridis(tags_df['count'] / tags_df['count'].max())
    ax.barh(tags_df['hashtag'].apply(lambda x: f'#{x}'), tags_df['count'], color=colors_ht)
    ax.set_xlabel('Nombre d\'occurrences')
    ax.set_title('Top 20 des hashtags les plus fréquents', fontsize=14, fontweight='bold')
    
    for i, (val, tag) in enumerate(zip(tags_df['count'], tags_df['hashtag'])):
        ax.text(val + 0.5, i, str(val), va='center', fontsize=9)
    
    plt.tight_layout()
    plt.show()
else:
    print("Pas de hashtags à afficher.")


# %% Cellule 18
# === 5.3 Comparaison hashtags positifs vs négatifs (Plotly) ===
if len(top_pos) > 0 and len(top_neg) > 0:
    fig = make_subplots(rows=1, cols=2, 
                        subplot_titles=('Hashtags tweets positifs', 'Hashtags tweets négatifs'))

    df_pos = pd.DataFrame(top_pos, columns=['hashtag', 'count']).sort_values('count', ascending=True)
    df_neg = pd.DataFrame(top_neg, columns=['hashtag', 'count']).sort_values('count', ascending=True)

    fig.add_trace(
        go.Bar(y=df_pos['hashtag'].apply(lambda x: f'#{x}'), x=df_pos['count'],
               orientation='h', marker_color='#2ecc71', name='Positifs'),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(y=df_neg['hashtag'].apply(lambda x: f'#{x}'), x=df_neg['count'],
               orientation='h', marker_color='#e74c3c', name='Négatifs'),
        row=1, col=2
    )

    fig.update_layout(height=450, width=1000, title_text='Hashtags par catégorie de sentiment')
    fig.show()
else:
    print("Pas assez de hashtags pour la comparaison.")


# %% [markdown] Cellule 19
# ---
# 6. Analyse des mentions (@utilisateur)


# %% Cellule 20
# === 6.1 Extraction et visualisation des mentions ===
all_mentions = []
for _, row in pdf.iterrows():
    text = str(row['text']).lower()
    mentions = re.findall(r'@(\w+)', text)
    all_mentions.extend(mentions)

top_mentions = Counter(all_mentions).most_common(15)
print(f"Nombre total de mentions : {len(all_mentions)}")
print(f"Mentions uniques : {len(set(all_mentions))}")

if len(top_mentions) > 0:
    mentions_df = pd.DataFrame(top_mentions, columns=['mention', 'count'])
    
    fig = px.bar(
        mentions_df, x='count', y='mention',
        orientation='h',
        title='Top 15 des comptes les plus mentionnés',
        labels={'count': 'Nombre de mentions', 'mention': 'Utilisateur mentionné'},
        color='count',
        color_continuous_scale='Blues'
    )
    fig.update_layout(height=450, width=800, yaxis=dict(autorange='reversed'))
    fig.show()
else:
    print("Aucune mention trouvée dans les tweets.")


# %% [markdown] Cellule 21
# ---
# 7. Nuage de mots (Word Cloud)


# %% Cellule 22
from wordcloud import WordCloud

# Fonction de nettoyage identique aux notebooks précédents
def clean_text(text):
    if text is None:
        return ""
    text = text.lower()
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#', '', text)
    text = re.sub(r'[^a-z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Séparer les textes positifs et négatifs
texts_pos = ' '.join(pdf[pdf['predicted_sentiment'] == 1.0]['text'].apply(clean_text))
texts_neg = ' '.join(pdf[pdf['predicted_sentiment'] == 0.0]['text'].apply(clean_text))
texts_all = ' '.join(pdf['text'].apply(clean_text))

fig, axes = plt.subplots(1, 3, figsize=(20, 6))

# Wordcloud global
wc_all = WordCloud(width=600, height=400, background_color='white', 
                   max_words=100, colormap='viridis').generate(texts_all)
axes[0].imshow(wc_all, interpolation='bilinear')
axes[0].set_title('Tous les tweets', fontsize=14, fontweight='bold')
axes[0].axis('off')

# Wordcloud positif
if len(texts_pos.strip()) > 0:
    wc_pos = WordCloud(width=600, height=400, background_color='white',
                       max_words=80, colormap='Greens').generate(texts_pos)
    axes[1].imshow(wc_pos, interpolation='bilinear')
axes[1].set_title('Tweets positifs', fontsize=14, fontweight='bold', color='#2ecc71')
axes[1].axis('off')

# Wordcloud négatif
if len(texts_neg.strip()) > 0:
    wc_neg = WordCloud(width=600, height=400, background_color='white',
                       max_words=80, colormap='Reds').generate(texts_neg)
    axes[2].imshow(wc_neg, interpolation='bilinear')
axes[2].set_title('Tweets négatifs', fontsize=14, fontweight='bold', color='#e74c3c')
axes[2].axis('off')

plt.suptitle('Nuages de mots par catégorie de sentiment', fontsize=16, fontweight='bold', y=1.02)
plt.tight_layout()
plt.show()


# %% [markdown] Cellule 23
# ---
# 8. Heatmap : Activité par minute


# %% Cellule 24
# === 8.1 Heatmap d'activité (volume par fenêtre de 1 minute) ===
pdf['minute_bin'] = pdf['event_time'].dt.floor('1min')

heatmap_data = pdf.groupby(['minute_bin', 'sentiment_label']).size().unstack(fill_value=0)

if heatmap_data.shape[0] > 1:
    fig, ax = plt.subplots(figsize=(14, 5))
    
    # Barres empilées par minute
    heatmap_data.plot(kind='bar', stacked=True, ax=ax, 
                      color=[colors.get(c, '#95a5a6') for c in heatmap_data.columns],
                      edgecolor='white', linewidth=0.5)
    
    # Formater les labels de l'axe X
    tick_labels = [t.strftime('%H:%M') for t in heatmap_data.index]
    ax.set_xticklabels(tick_labels, rotation=45, ha='right', fontsize=8)
    
    ax.set_title('Volume de tweets par minute (empilé par sentiment)', fontsize=14, fontweight='bold')
    ax.set_xlabel('Minute')
    ax.set_ylabel('Nombre de tweets')
    ax.legend(title='Sentiment')
    plt.tight_layout()
    plt.show()
else:
    print("Pas assez de données temporelles pour la heatmap.")


# %% [markdown] Cellule 25
# ---
# 9. Détection des zones d'alerte (sentiment < seuil)


# %% Cellule 26
# === 9.1 Zones d'alerte sur la courbe de sentiment ===
SEUIL_ALERTE = 0.35  # Moins de 35% de positifs = alerte

# Recalcul par fenêtre de 1 minute
alert_data = pdf.groupby('minute_bin').agg(
    total=('predicted_sentiment', 'count'),
    ratio_positif=('predicted_sentiment', 'mean')
).reset_index()

alert_data['alerte'] = alert_data['ratio_positif'] < SEUIL_ALERTE

fig = go.Figure()

# Courbe du ratio positif
fig.add_trace(go.Scatter(
    x=alert_data['minute_bin'], y=alert_data['ratio_positif'],
    mode='lines+markers',
    name='Ratio positif',
    line=dict(color='#3498db', width=2),
    marker=dict(
        size=8,
        color=['#e74c3c' if a else '#3498db' for a in alert_data['alerte']],
        symbol=['x' if a else 'circle' for a in alert_data['alerte']]
    )
))

# Seuil d'alerte
fig.add_hline(y=SEUIL_ALERTE, line_dash='dash', line_color='red', 
              annotation_text=f'Seuil d\'alerte ({SEUIL_ALERTE})')
fig.add_hline(y=0.5, line_dash='dot', line_color='gray', annotation_text='Neutre (0.5)')

# Highlight zones d'alerte
for _, row in alert_data[alert_data['alerte']].iterrows():
    fig.add_vrect(
        x0=row['minute_bin'] - pd.Timedelta(seconds=30),
        x1=row['minute_bin'] + pd.Timedelta(seconds=30),
        fillcolor='red', opacity=0.1, line_width=0
    )

nb_alertes = alert_data['alerte'].sum()
fig.update_layout(
    title=f'Détection des zones d\'alerte sentiment — {nb_alertes} alerte(s) détectée(s)',
    xaxis_title='Temps', yaxis_title='Ratio de tweets positifs',
    height=450, width=1000,
    yaxis=dict(range=[0, 1])
)
fig.show()

if nb_alertes > 0:
    print(f"\n⚠️  {nb_alertes} fenêtre(s) en alerte (ratio positif < {SEUIL_ALERTE}) :")
    print(alert_data[alert_data['alerte']][['minute_bin', 'total', 'ratio_positif']].to_string(index=False))
else:
    print("\n✅ Aucune alerte détectée sur la période analysée.")


# %% [markdown] Cellule 27
# ---
# 10. Tableau récapitulatif (KPIs)


# %% Cellule 28
# === 10.1 KPIs globaux ===
total_tweets = len(pdf)
nb_positifs = (pdf['predicted_sentiment'] == 1.0).sum()
nb_negatifs = (pdf['predicted_sentiment'] == 0.0).sum()
ratio_positif = nb_positifs / total_tweets * 100 if total_tweets > 0 else 0
nb_users = pdf['user'].nunique()
nb_hashtags = len(set(all_hashtags))
nb_mentions = len(set(all_mentions))

# Période d'analyse
t_min = pdf['event_time'].min()
t_max = pdf['event_time'].max()
duree = t_max - t_min

print("=" * 60)
print("           DASHBOARD — RÉCAPITULATIF DES KPIs")
print("=" * 60)
print(f"  Période analysée     : {t_min} → {t_max}")
print(f"  Durée totale         : {duree}")
print(f"  ─────────────────────────────────────────")
print(f"  Total tweets         : {total_tweets:,}")
print(f"  Tweets positifs      : {nb_positifs:,} ({ratio_positif:.1f}%)")
print(f"  Tweets négatifs      : {nb_negatifs:,} ({100 - ratio_positif:.1f}%)")
print(f"  ─────────────────────────────────────────")
print(f"  Utilisateurs uniques : {nb_users:,}")
print(f"  Hashtags uniques     : {nb_hashtags:,}")
print(f"  Mentions uniques     : {nb_mentions:,}")
print(f"  ─────────────────────────────────────────")
print(f"  Débit moyen          : {total_tweets / max(duree.total_seconds(), 1):.1f} tweets/sec")
print(f"  Alertes détectées    : {nb_alertes}")
print("=" * 60)


# %% Cellule 29
# === 10.2 KPIs visuels avec Plotly Indicator ===
fig = make_subplots(
    rows=2, cols=3,
    specs=[
        [{"type": "indicator"}, {"type": "indicator"}, {"type": "indicator"}],
        [{"type": "indicator"}, {"type": "indicator"}, {"type": "indicator"}]
    ],
    vertical_spacing=0.3
)

fig.add_trace(go.Indicator(
    mode="number", value=total_tweets,
    title={"text": "Total Tweets"},
    number={"font": {"size": 40, "color": "#2c3e50"}}
), row=1, col=1)

fig.add_trace(go.Indicator(
    mode="number", value=nb_positifs,
    title={"text": "Tweets Positifs"},
    number={"font": {"size": 40, "color": "#2ecc71"}}
), row=1, col=2)

fig.add_trace(go.Indicator(
    mode="number", value=nb_negatifs,
    title={"text": "Tweets Négatifs"},
    number={"font": {"size": 40, "color": "#e74c3c"}}
), row=1, col=3)

fig.add_trace(go.Indicator(
    mode="gauge+number", value=ratio_positif,
    title={"text": "% Positif"},
    gauge={"axis": {"range": [0, 100]},
           "bar": {"color": "#2ecc71"},
           "steps": [{"range": [0, 35], "color": "#fadbd8"},
                     {"range": [35, 65], "color": "#fef9e7"},
                     {"range": [65, 100], "color": "#d5f5e3"}],
           "threshold": {"value": 50, "line": {"color": "gray", "width": 2}}}
), row=2, col=1)

fig.add_trace(go.Indicator(
    mode="number", value=nb_users,
    title={"text": "Utilisateurs uniques"},
    number={"font": {"size": 40, "color": "#3498db"}}
), row=2, col=2)

fig.add_trace(go.Indicator(
    mode="number+delta", value=nb_alertes,
    title={"text": "Alertes"},
    number={"font": {"size": 40, "color": "#e67e22" if nb_alertes > 0 else "#2ecc71"}},
    delta={"reference": 0, "increasing": {"color": "#e74c3c"}}
), row=2, col=3)

fig.update_layout(height=450, width=1000, title_text='Dashboard KPIs — Vue d\'ensemble')
fig.show()


# %% [markdown] Cellule 30
# ---
# 11. Exemples de tweets par catégorie


# %% Cellule 31
# === 11.1 Exemples de tweets positifs ===
print("=== 🟢 Exemples de tweets POSITIFS ===")
sample_pos = pdf[pdf['predicted_sentiment'] == 1.0].sample(min(5, nb_positifs))
for _, row in sample_pos.iterrows():
    print(f"  @{row['user']}: {row['text'][:100]}")

print(f"\n=== 🔴 Exemples de tweets NÉGATIFS ===")
sample_neg = pdf[pdf['predicted_sentiment'] == 0.0].sample(min(5, nb_negatifs))
for _, row in sample_neg.iterrows():
    print(f"  @{row['user']}: {row['text'][:100]}")


# %% [markdown] Cellule 32
# ---
# 12. Arrêt de la SparkSession


# %% Cellule 33
spark.stop()
print("SparkSession arrêtée.")
print("\n✅ Dashboard terminé — Toutes les visualisations ont été générées.")
