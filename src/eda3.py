import pandas as pd
from features import TARGET

pd.set_option("display.width", 200)

df = pd.read_csv("data/raw/data.csv", sep=";")
df.columns = df.columns.str.strip()

for col in ["Debtor", "Tuition fees up to date", "Scholarship holder", "Gender"]:
    print(f"\n{col}")
    print(df.groupby(col)[TARGET].value_counts(normalize=True).unstack().round(2))