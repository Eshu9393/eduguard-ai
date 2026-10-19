import pandas as pd
from sklearn.model_selection import train_test_split
from features import TARGET, FEATURES_A, FEATURES_B, FEATURES_C

RANDOM_STATE = 42
FEATURE_SETS = {"A": FEATURES_A, "B": FEATURES_B, "C": FEATURES_C}


def load_data(path="data/raw/data.csv"):
    df = pd.read_csv(path, sep=";")
    df.columns = df.columns.str.strip()
    return df


def split_data(df, feature_set="B", test_size=0.2):
    X = df[FEATURE_SETS[feature_set]]
    y = df[TARGET]
    return train_test_split(
        X, y, test_size=test_size, stratify=y, random_state=RANDOM_STATE
    )


if __name__ == "__main__":
    df = load_data()
    for name in FEATURE_SETS:
        X_train, X_test, y_train, y_test = split_data(df, name)
        print(name, X_train.shape, X_test.shape)
    print(y_train.value_counts(normalize=True).round(3))
    print(y_test.value_counts(normalize=True).round(3))