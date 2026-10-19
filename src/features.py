TARGET = "Target"

BINARY = [
    "Gender", "Debtor", "Scholarship holder", "Displaced", "International",
    "Educational special needs", "Daytime/evening attendance",
    "Tuition fees up to date",
]

CATEGORICAL = [
    "Marital status", "Application mode", "Course", "Previous qualification",
    "Nacionality", "Mother's qualification", "Father's qualification",
    "Mother's occupation", "Father's occupation",
]

NUMERIC_AT_ENROLLMENT = [
    "Application order", "Previous qualification (grade)", "Admission grade",
    "Age at enrollment", "Inflation rate", "Unemployment rate", "GDP",
]

SEM1 = [f"Curricular units 1st sem ({s})" for s in
        ["credited", "enrolled", "evaluations", "approved", "grade", "without evaluations"]]
SEM2 = [f"Curricular units 2nd sem ({s})" for s in
        ["credited", "enrolled", "evaluations", "approved", "grade", "without evaluations"]]

FEATURES_A = BINARY + CATEGORICAL + NUMERIC_AT_ENROLLMENT
FEATURES_B = FEATURES_A + SEM1
FEATURES_C = FEATURES_B + SEM2

if __name__ == "__main__":
    import pandas as pd
    df = pd.read_csv("data/raw/data.csv", sep=";")
    df.columns = df.columns.str.strip()
    assert len(FEATURES_C) == len(set(FEATURES_C)), "duplicate feature names"
    assert set(FEATURES_C) | {TARGET} == set(df.columns), "columns don't match dataset"
    print("A:", len(FEATURES_A), "B:", len(FEATURES_B), "C:", len(FEATURES_C))