import pandas as pd

df = pd.read_csv("data/raw/data.csv", sep=";")
df.columns = df.columns.str.strip()

print("Shape:", df.shape)
print(df.dtypes.value_counts())
print("Missing values:", df.isna().sum().sum())
print("Duplicate rows:", df.duplicated().sum())
print(df["Target"].value_counts())
print(df["Target"].value_counts(normalize=True).round(3))
