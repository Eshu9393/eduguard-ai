import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from features import TARGET

df = pd.read_csv("data/raw/data.csv", sep=";")
df.columns = df.columns.str.strip()

# 1. Class balance plot
order = ["Dropout", "Enrolled", "Graduate"]
sns.countplot(data=df, x=TARGET, order=order)
plt.title("Target class distribution")
plt.savefig("notebooks/target_distribution.png", dpi=150, bbox_inches="tight")
plt.close()

# 2. Age outliers
print(df["Age at enrollment"].describe())
print("Students older than 40:", (df["Age at enrollment"] > 40).sum())

# 3. Dropout rate by age group
df["age_group"] = pd.cut(df["Age at enrollment"], [16, 20, 25, 30, 40, 80])
print(df.groupby("age_group", observed=True)[TARGET]
        .value_counts(normalize=True).unstack().round(2))

# 4. Zero grades in semester 1
zero = df["Curricular units 1st sem (grade)"] == 0
print("Zero 1st-sem grade:", zero.sum())
print(df[zero][TARGET].value_counts())