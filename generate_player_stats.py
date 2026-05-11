import pandas as pd
import json
import numpy as np

print("Loading IPL.csv...")
df = pd.read_csv("IPL.csv", low_memory=False)

print("Processing batting stats...")
# Batting stats
batting = df.groupby('batter').agg(
    runs=('runs_batter', 'sum'),
    balls=('balls_faced', 'sum'),
    matches=('match_id', 'nunique')
).reset_index()

# Dismissals
dismissals = df[df['player_out'].notnull() & ~df['wicket_kind'].isin(['run out', 'retired hurt', 'obstructing the field'])]
dismissal_counts = dismissals.groupby('player_out').size().reset_index(name='dismissals')

batting = batting.merge(dismissal_counts, left_on='batter', right_on='player_out', how='left').drop(columns=['player_out'])
batting['dismissals'] = batting['dismissals'].fillna(0)
batting['avg'] = np.where(batting['dismissals'] > 0, batting['runs'] / batting['dismissals'], batting['runs'])
batting['sr'] = np.where(batting['balls'] > 0, (batting['runs'] / batting['balls']) * 100, 0)

print("Processing bowling stats...")
# Bowling stats
bowling_df = df[df['bowler'].notnull()]
wickets_df = df[df['wicket_kind'].notnull() & ~df['wicket_kind'].isin(['run out', 'retired hurt', 'obstructing the field'])]

bowling = bowling_df.groupby('bowler').agg(
    runs_conceded=('runs_bowler', 'sum'),
    balls_bowled=('valid_ball', 'sum')
).reset_index()

wicket_counts = wickets_df.groupby('bowler').size().reset_index(name='wickets')

bowling = bowling.merge(wicket_counts, on='bowler', how='left')
bowling['wickets'] = bowling['wickets'].fillna(0)
bowling['econ'] = np.where(bowling['balls_bowled'] > 0, (bowling['runs_conceded'] / bowling['balls_bowled']) * 6, 0)

print("Combining stats...")
# Combine
players = set(batting['batter'].unique()).union(set(bowling['bowler'].unique()))
stats = {}

for player in players:
    p_stats = {'name': player}
    
    bat = batting[batting['batter'] == player]
    if not bat.empty:
        p_stats['batting'] = {
            'matches': int(bat['matches'].values[0]),
            'runs': int(bat['runs'].values[0]),
            'avg': float(bat['avg'].values[0]),
            'sr': float(bat['sr'].values[0]),
            'balls': int(bat['balls'].values[0])
        }
    else:
        p_stats['batting'] = {'matches': 0, 'runs': 0, 'avg': 0.0, 'sr': 0.0, 'balls': 0}
        
    bowl = bowling[bowling['bowler'] == player]
    if not bowl.empty:
        p_stats['bowling'] = {
            'wickets': int(bowl['wickets'].values[0]),
            'econ': float(bowl['econ'].values[0]),
            'runs': int(bowl['runs_conceded'].values[0]),
            'balls': int(bowl['balls_bowled'].values[0])
        }
    else:
        p_stats['bowling'] = {'wickets': 0, 'econ': 0.0, 'runs': 0, 'balls': 0}
        
    stats[player] = p_stats

print("Saving to src/services/player_stats.json...")
with open("src/services/player_stats.json", "w") as f:
    json.dump(stats, f, indent=2)

print("Done!")
