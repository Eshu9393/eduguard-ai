import pandas as pd

df = pd.read_csv("data/raw/data.csv", sep=";")
df.columns = df.columns.str.strip()

for col in ["Debtor", "Tuition fees up to date", "Scholarship holder", "Gender"]:
    print(df[col].value_counts().sort_index().to_string(), "\n")