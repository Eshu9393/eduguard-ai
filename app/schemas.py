from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Binary = Literal[0, 1]

# API field name -> dataset column name (order matches the training features)
FIELD_TO_COLUMN = {
    "gender": "Gender",
    "debtor": "Debtor",
    "scholarship_holder": "Scholarship holder",
    "displaced": "Displaced",
    "international": "International",
    "educational_special_needs": "Educational special needs",
    "daytime_attendance": "Daytime/evening attendance",
    "tuition_fees_up_to_date": "Tuition fees up to date",
    "marital_status": "Marital status",
    "application_mode": "Application mode",
    "course": "Course",
    "previous_qualification": "Previous qualification",
    "nationality": "Nacionality",
    "mothers_qualification": "Mother's qualification",
    "fathers_qualification": "Father's qualification",
    "mothers_occupation": "Mother's occupation",
    "fathers_occupation": "Father's occupation",
    "application_order": "Application order",
    "previous_qualification_grade": "Previous qualification (grade)",
    "admission_grade": "Admission grade",
    "age_at_enrollment": "Age at enrollment",
    "inflation_rate": "Inflation rate",
    "unemployment_rate": "Unemployment rate",
    "gdp": "GDP",
    "sem1_credited": "Curricular units 1st sem (credited)",
    "sem1_enrolled": "Curricular units 1st sem (enrolled)",
    "sem1_evaluations": "Curricular units 1st sem (evaluations)",
    "sem1_approved": "Curricular units 1st sem (approved)",
    "sem1_grade": "Curricular units 1st sem (grade)",
    "sem1_without_evaluations": "Curricular units 1st sem (without evaluations)",
}


class StudentFeatures(BaseModel):
    """Features known after the first semester (feature set B)."""

    model_config = ConfigDict(extra="forbid")  # reject unknown/misspelled fields

    # Binary flags (0 or 1; see the UCI variable table for meanings)
    gender: Binary
    debtor: Binary
    scholarship_holder: Binary
    displaced: Binary
    international: Binary
    educational_special_needs: Binary
    daytime_attendance: Binary
    tuition_fees_up_to_date: Binary

    # Categorical codes (UCI code tables), not quantities
    marital_status: int = Field(ge=0)
    application_mode: int = Field(ge=0)
    course: int = Field(ge=0)
    previous_qualification: int = Field(ge=0)
    nationality: int = Field(ge=0)
    mothers_qualification: int = Field(ge=0)
    fathers_qualification: int = Field(ge=0)
    mothers_occupation: int = Field(ge=0)
    fathers_occupation: int = Field(ge=0)

    # Numeric, known at enrollment
    application_order: int = Field(ge=0, le=9)
    previous_qualification_grade: float = Field(ge=0, le=200)
    admission_grade: float = Field(ge=0, le=200)
    age_at_enrollment: int = Field(ge=16, le=100)
    inflation_rate: float
    unemployment_rate: float
    gdp: float

    # First-semester academic record
    sem1_credited: int = Field(ge=0, le=60)
    sem1_enrolled: int = Field(ge=0, le=60)
    sem1_evaluations: int = Field(ge=0, le=100)
    sem1_approved: int = Field(ge=0, le=60)
    sem1_grade: float = Field(ge=0, le=20)
    sem1_without_evaluations: int = Field(ge=0, le=60)

class Factor(BaseModel):
    feature: str
    value: float
    typical_value: float
    effect: float


class Explanation(BaseModel):
    target: Literal["Dropout"] = "Dropout"
    typical_student_score: float
    student_score: float
    top_factors: list[Factor]
    other_features_effect: float
    note: str = (
        "Effects show how much each input moved this student's Dropout score compared "
        "with a typical student. They describe the model's behavior, not causes."
    )


class PredictionResponse(BaseModel):
    prediction: Literal["Dropout", "Enrolled", "Graduate"]
    probabilities: dict[str, float]
    explanation: Explanation | None = None
    disclaimer: str = (
        "This is a statistical estimate, not a definitive judgment about a student."
    )