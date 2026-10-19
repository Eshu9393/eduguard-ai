import pandas as pd

df = pd.read_csv("data/raw/data.csv", sep=";")
df.columns = df.columns.str.strip()

summary = pd.DataFrame({
    "dtype": df.dtypes,
    "n_unique": df.nunique(),
    "min": df.min(numeric_only=True),
    "max": df.max(numeric_only=True),
})
print(summary.sort_values("n_unique").to_string())