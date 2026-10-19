import pandas as pd
from features import TARGET

pd.set_option("display.width", 200)
pd.set_option("display.max_columns", None)

df = pd.read_csv("data/raw/data.csv", sep=";")
df.columns = df.columns.str.strip()

zero = df["Curricular units 1st sem (grade)"] == 0

cols = [
    "Curricular units 1st sem (enrolled)",
    "Curricular units 1st sem (evaluations)",
    "Curricular units 1st sem (approved)",
]
print("Zero-grade students:")
print(df[zero][cols].describe().loc[["mean", "min", "max"]].round(2))
print("\nAll other students:")
print(df[~zero][cols].describe().loc[["mean", "min", "max"]].round(2))

print("\nZero-grade AND zero evaluations:",
      (zero & (df["Curricular units 1st sem (evaluations)"] == 0)).sum())