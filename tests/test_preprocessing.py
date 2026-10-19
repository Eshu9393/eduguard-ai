import numpy as np
import pandas as pd

from data_preprocessing import build_preprocessor, split_data
from features import BINARY, CATEGORICAL, FEATURES_B, TARGET


def make_df(n=200, seed=0):
    rng = np.random.default_rng(seed)
    data = {}
    for c in FEATURES_B:
        if c in BINARY:
            data[c] = rng.integers(0, 2, n)
        elif c in CATEGORICAL:
            data[c] = rng.integers(1, 5, n)
        else:
            data[c] = rng.normal(10, 3, n)
    data[TARGET] = rng.choice(["Dropout", "Enrolled", "Graduate"], n, p=[0.3, 0.2, 0.5])
    return pd.DataFrame(data)


def test_preprocessor_output_has_no_nan_and_keeps_rows():
    df = make_df()
    out = build_preprocessor("B").fit_transform(df[FEATURES_B])
    assert out.shape[0] == len(df)
    assert not np.isnan(out).any()


def test_unseen_category_does_not_crash():
    df = make_df()
    pre = build_preprocessor("B").fit(df[FEATURES_B])
    new = df[FEATURES_B].head(3).copy()
    new["Course"] = 99999  # a code never seen in training
    assert pre.transform(new).shape[0] == 3


def test_split_is_stratified():
    df = make_df(n=1000)
    _, _, y_train, y_test = split_data(df, "B")
    for cls in ["Dropout", "Enrolled", "Graduate"]:
        assert abs((y_train == cls).mean() - (y_test == cls).mean()) < 0.03


def test_split_is_reproducible():
    df = make_df()
    a = split_data(df, "B")[0].index
    b = split_data(df, "B")[0].index
    assert list(a) == list(b)