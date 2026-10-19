import pandas as pd
from sklearn.model_selection import train_test_split
from features import TARGET, FEATURES_A, FEATURES_B, FEATURES_C
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from features import BINARY, CATEGORICAL

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

def build_preprocessor(feature_set="B"):
    cols = FEATURE_SETS[feature_set]
    binary = [c for c in cols if c in BINARY]
    categorical = [c for c in cols if c in CATEGORICAL]
    numeric = [c for c in cols if c not in BINARY + CATEGORICAL]

    return ColumnTransformer([
        ("bin", "passthrough", binary),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical),
        ("num", StandardScaler(), numeric),
    ])

if __name__ == "__main__":
    df = load_data()
    for name in FEATURE_SETS:
        X_train, X_test, y_train, y_test = split_data(df, name)
        pre = build_preprocessor(name)
        Xt = pre.fit_transform(X_train)   # learn from TRAIN only
        Xe = pre.transform(X_test)        # apply to test, never fit on it
        print(name, "train:", Xt.shape, "test:", Xe.shape)