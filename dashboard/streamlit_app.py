import os

import httpx
import pandas as pd
import streamlit as st

from code_tables import (APPLICATION_MODE, COURSE, FATHER_OCCUPATION,
                         FATHER_QUALIFICATION, GENDER, MARITAL_STATUS,
                         MOTHER_OCCUPATION, MOTHER_QUALIFICATION, NATIONALITY,
                         PREVIOUS_QUALIFICATION)

API_URL = os.getenv("EDUGUARD_API_URL", "http://127.0.0.1:8000")
S = st.session_state

st.set_page_config(page_title="EduGuard AI", page_icon="🎓", layout="wide")

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
html, body, [class*="css"] {font-family: 'Inter', sans-serif;}
.block-container {padding-top: 1.6rem; max-width: 1250px;}

.hero {position: relative; overflow: hidden; padding: 2rem 2.2rem; border-radius: 20px;
  color: #fff; margin-bottom: 1.4rem;
  background: linear-gradient(125deg,#312e81 0%,#6d28d9 50%,#0e7490 100%);}
.hero::before {content: ""; position: absolute; right: -60px; top: -80px; width: 280px;
  height: 280px; border-radius: 50%; background: rgba(255,255,255,.10);}
.hero::after {content: ""; position: absolute; right: 120px; bottom: -110px; width: 220px;
  height: 220px; border-radius: 50%; background: rgba(255,255,255,.07);}
.hero h1 {margin: 0; font-size: 2.3rem; font-weight: 700; color: #fff; position: relative;}
.hero p {margin: .5rem 0 1rem; max-width: 640px; opacity: .93; font-size: 1.05rem; position: relative;}
.chip {display: inline-block; margin: 0 .5rem .3rem 0; padding: .28rem .8rem; border-radius: 999px;
  font-size: .8rem; font-weight: 500; background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.28); position: relative;}

.step {display: flex; align-items: center; gap: .6rem; font-weight: 600; font-size: 1.05rem; margin-bottom: .2rem;}
.badge {display: inline-flex; align-items: center; justify-content: center; width: 1.7rem;
  height: 1.7rem; border-radius: 50%; color: #fff; font-size: .85rem; font-weight: 700;
  background: linear-gradient(135deg,#4338ca,#7c3aed);}
.hint {font-size: .85rem; opacity: .7; margin: 0 0 .6rem;}

.card {border: 1px solid rgba(128,128,128,.28); border-radius: 16px; padding: 1.2rem 1.3rem;
  background: rgba(128,128,128,.05); margin-bottom: .9rem;}
.result {display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;}
.result .bars {flex: 1; min-width: 190px;}
.outcome {font-size: 1.9rem; font-weight: 700; line-height: 1.1; margin: .15rem 0 .45rem;}
.pill {display: inline-block; padding: .18rem .7rem; border-radius: 999px;
  font-size: .78rem; font-weight: 600; color: #fff;}
.bar-row {margin: .55rem 0;}
.bar-label {display: flex; justify-content: space-between; font-size: .9rem; margin-bottom: .2rem;}
.bar-track {height: 9px; border-radius: 999px; background: rgba(128,128,128,.22); overflow: hidden;}
.bar-fill {height: 100%; border-radius: 999px;}
.muted {opacity: .72; font-size: .85rem;}

.tiles {display: grid; grid-template-columns: repeat(2, 1fr); gap: .6rem; margin: .4rem 0 .6rem;}
.tile {border: 1px solid rgba(128,128,128,.25); border-radius: 12px; padding: .7rem .9rem;
  background: rgba(128,128,128,.04);}
.tile .l {font-size: .72rem; opacity: .7; text-transform: uppercase; letter-spacing: .05em;}
.tile .v {font-size: 1.3rem; font-weight: 700; margin-top: .1rem;}

.howto {display: grid; gap: .7rem; margin-top: .6rem;}
.howto div {display: flex; gap: .7rem; align-items: flex-start;}

section[data-testid="stSidebar"] {background: linear-gradient(180deg, rgba(109,40,217,.10), rgba(14,116,144,.06));}
.stButton > button, [data-testid="stFormSubmitButton"] > button {width: 100%; border-radius: 10px;}
[data-testid="stFormSubmitButton"] > button {background: linear-gradient(120deg,#4338ca,#7c3aed);
  color: #fff; border: 0; font-weight: 600; padding: .65rem 1rem; font-size: 1rem;}
button[data-baseweb="tab"] {font-weight: 600;}
</style>
""", unsafe_allow_html=True)

ORDER = ["Dropout", "Enrolled", "Graduate"]
COLORS = {"Dropout": "#e5484d", "Enrolled": "#f5a524", "Graduate": "#30a46c"}
MEANING = {
    "Dropout": "The inputs resemble students who left before finishing. Treat this "
               "as a prompt to check in and offer support, not as a verdict.",
    "Enrolled": "The inputs resemble students who were still studying when the normal "
                "course duration ended. Their outcome is still open.",
    "Graduate": "The inputs resemble students who completed the course on time.",
}

DEFAULTS = {
    "age": 19, "gender": 0, "marital": 1, "daytime": 1,
    "displaced": True, "international": False, "special": False,
    "debtor": False, "fees": True, "scholarship": False,
    "enrolled": 6, "evaluations": 8, "approved": 5, "credited": 0,
    "without_eval": 0, "grade": 12.5,
    "course": 9238, "app_mode": 17, "app_order": 1, "prev_qual": 1,
    "prev_grade": 130.0, "adm_grade": 125.0, "nationality": 1,
    "mq": 19, "fq": 19, "mo": 5, "fo": 5,
    "inflation": 1.4, "unemployment": 11.1, "gdp": 0.32,
}
PRESETS = {
    "Strong first semester": {"enrolled": 6, "evaluations": 7, "approved": 6, "grade": 14.5},
    "Mixed first semester": {"enrolled": 6, "evaluations": 6, "approved": 3, "grade": 11.0},
    "No units passed": {"enrolled": 6, "evaluations": 4, "approved": 0, "grade": 0.0},
}
for k, v in DEFAULTS.items():
    S.setdefault(k, v)


def apply_preset(name):
    S.update({**DEFAULTS, **(PRESETS[name] if name else {})})
    S.pop("result", None)


@st.cache_data(ttl=5)
def api_get(path):
    try:
        r = httpx.get(f"{API_URL}{path}", timeout=2)
        return r.json() if r.status_code == 200 else None
    except (httpx.HTTPError, ValueError):
        return None


def build_payload():
    return {
        "gender": S.gender, "debtor": int(S.debtor),
        "scholarship_holder": int(S.scholarship), "displaced": int(S.displaced),
        "international": int(S.international),
        "educational_special_needs": int(S.special),
        "daytime_attendance": S.daytime, "tuition_fees_up_to_date": int(S.fees),
        "marital_status": S.marital, "application_mode": S.app_mode,
        "course": S.course, "previous_qualification": S.prev_qual,
        "nationality": S.nationality, "mothers_qualification": S.mq,
        "fathers_qualification": S.fq, "mothers_occupation": S.mo,
        "fathers_occupation": S.fo, "application_order": S.app_order,
        "previous_qualification_grade": S.prev_grade,
        "admission_grade": S.adm_grade, "age_at_enrollment": S.age,
        "inflation_rate": S.inflation, "unemployment_rate": S.unemployment,
        "gdp": S.gdp, "sem1_credited": S.credited, "sem1_enrolled": S.enrolled,
        "sem1_evaluations": S.evaluations, "sem1_approved": S.approved,
        "sem1_grade": S.grade, "sem1_without_evaluations": S.without_eval,
    }


def soft_checks(p):
    notes = []
    if p["sem1_approved"] > p["sem1_enrolled"]:
        notes.append("Units approved is higher than units enrolled. Please double-check these values.")
    if (p["sem1_approved"] == 0) != (p["sem1_grade"] == 0):
        notes.append(
            "In the training data, an average grade of 0 always went with zero approved "
            "units, and any approved unit came with a non-zero grade. This combination "
            "is unusual, so treat the result with extra caution."
        )
    return notes


def step(num, title):
    st.markdown(f'<div class="step"><span class="badge">{num}</span>{title}</div>',
                unsafe_allow_html=True)


def hint(text):
    st.markdown(f'<p class="hint">{text}</p>', unsafe_allow_html=True)


def donut_svg(probs, pred):
    segs, cum = [], 0.0
    for cls in ORDER:
        pr = probs.get(cls, 0.0) * 100
        segs.append(
            f'<circle cx="21" cy="21" r="15.915" fill="none" stroke="{COLORS[cls]}" '
            f'stroke-width="4.5" stroke-dasharray="{pr:.2f} {100 - pr:.2f}" '
            f'stroke-dashoffset="{25 - cum:.2f}"/>'
        )
        cum += pr
    return (
        '<svg viewBox="0 0 42 42" width="140" height="140">'
        '<circle cx="21" cy="21" r="15.915" fill="none" stroke="rgba(128,128,128,.2)" stroke-width="4.5"/>'
        + "".join(segs)
        + f'<text x="21" y="20.5" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor">{probs[pred]:.0%}</text>'
        + f'<text x="21" y="26" text-anchor="middle" font-size="3.2" fill="currentColor" opacity=".7">{pred}</text>'
        + "</svg>"
    )


def bars_html(probs):
    rows = []
    for cls in ORDER:
        pr = probs.get(cls, 0.0)
        rows.append(
            f'<div class="bar-row"><div class="bar-label"><span>{cls}</span>'
            f"<span><b>{pr:.0%}</b></span></div>"
            f'<div class="bar-track"><div class="bar-fill" '
            f'style="width:{pr * 100:.1f}%;background:{COLORS[cls]}"></div></div></div>'
        )
    return "".join(rows)


def tile(label, value):
    return f'<div class="tile"><div class="l">{label}</div><div class="v">{value}</div></div>'


def render_result(out, p):
    pred, probs = out["prediction"], out["probabilities"]
    top = probs[pred]
    conf = "High score" if top >= 0.7 else "Moderate score" if top >= 0.5 else "Low score: mixed signals"
    color = COLORS[pred]
    st.markdown(
        f'<div class="card" style="background:linear-gradient(135deg,{color}22,transparent);'
        f'border-color:{color}66">'
        '<div class="muted">Most likely outcome</div>'
        f'<div class="outcome" style="color:{color}">{pred}</div>'
        f'<span class="pill" style="background:{color}">{conf}</span>'
        f'<p style="margin:.8rem 0 .6rem">{MEANING[pred]}</p>'
        f'<div class="result"><div>{donut_svg(probs, pred)}</div>'
        f'<div class="bars">{bars_html(probs)}</div></div>'
        '<div class="muted" style="margin-top:.5rem">Model scores, not verified '
        "probabilities of real outcomes.</div></div>",
        unsafe_allow_html=True,
    )
    for note in soft_checks(p):
        st.warning(note)
    st.caption(out["disclaimer"])
    exp = out.get("explanation")
    if exp:
        st.markdown("##### Why this score?")
        st.markdown(
            f"The model's **Dropout score** is **{exp['student_score']:.0%}** for this student, "
            f"compared with **{exp['typical_student_score']:.0%}** for a typical student. "
            "Red bars pushed the score up and green bars pushed it down. "
            "One point (pt) is one percentage point of Dropout score."
        )
        st.markdown(factors_html(exp), unsafe_allow_html=True)
        st.caption(exp["note"] + " The explanation is always about the Dropout score, "
                   "whichever outcome was predicted.")

    enrolled, approved = p["sem1_enrolled"], p["sem1_approved"]
    rate = min(approved / enrolled, 1.0) if enrolled > 0 else 0.0
    st.markdown("##### Inputs at a glance")
    st.markdown(
        '<div class="tiles">'
        + tile("Units passed", f"{approved} of {enrolled}")
        + tile("Average grade", f"{p['sem1_grade']:.1f} / 20")
        + tile("Tuition fees", "Up to date" if p["tuition_fees_up_to_date"] else "Not up to date")
        + tile("Age at enrollment", p["age_at_enrollment"])
        + "</div>"
        '<div class="bar-label"><span class="muted">Share of enrolled units passed</span>'
        f"<span><b>{rate:.0%}</b></span></div>"
        f'<div class="bar-track"><div class="bar-fill" style="width:{rate * 100:.0f}%;'
        'background:linear-gradient(90deg,#4338ca,#0e7490)"></div></div>',
        unsafe_allow_html=True,
    )
    st.caption("The tiles above show the values you entered, not the model's reasoning.")


METRIC_LABELS = {
    "dropout_recall": "Dropout recall",
    "f1_macro": "Macro F1",
    "accuracy": "Accuracy",
    "f1_weighted": "Weighted F1",
    "recall_macro": "Macro recall",
    "precision_macro": "Macro precision",
}
SELECTED_MODEL = "Gradient Boosting (tuned)"  # the model we evaluated on the test set

st.markdown("""
<style>
.cm {width: 100%; border-collapse: collapse; margin: .3rem 0;}
.cm th {font-size: .75rem; font-weight: 500; opacity: .75; padding: .4rem;}
.cm td {text-align: center; padding: .7rem .4rem; border: 1px solid rgba(128,128,128,.25);
  font-size: 1.15rem;}
</style>
""", unsafe_allow_html=True)


def comparison_bars(results, metric):
    rows = sorted(results, key=lambda r: r[metric]["mean"], reverse=True)
    out = []
    for r in rows:
        m, sd = r[metric]["mean"], r[metric]["std"]
        final = r["model"] == SELECTED_MODEL
        color = "#6d28d9" if final else "rgba(128,128,128,.55)"
        tag = " ★ selected" if final else ""
        out.append(
            f'<div class="bar-row"><div class="bar-label"><span>{r["model"]}{tag}</span>'
            f'<span><b>{m:.3f}</b> <span class="muted">± {sd:.3f}</span></span></div>'
            f'<div class="bar-track"><div class="bar-fill" '
            f'style="width:{m * 100:.1f}%;background:{color}"></div></div></div>'
        )
    return "".join(out)


def confusion_html(labels, cm):
    head = "<tr><th></th>" + "".join(f"<th>Predicted<br>{l}</th>" for l in labels) + "</tr>"
    body = ""
    for i, row in enumerate(cm):
        total = sum(row) or 1
        cells = ""
        for j, v in enumerate(row):
            share = v / total
            rgb = "48,164,108" if i == j else "229,72,77"
            cells += (f'<td style="background:rgba({rgb},{0.08 + 0.55 * share:.2f})">'
                      f'<b>{v}</b><br><span class="muted">{share:.0%} of actual</span></td>')
        body += f"<tr><th>Actual<br>{labels[i]}</th>{cells}</tr>"
    return f'<table class="cm">{head}{body}</table>'


FEATURE_LABELS = {
    "Curricular units 1st sem (approved)": "Units approved",
    "Curricular units 1st sem (enrolled)": "Units enrolled",
    "Curricular units 1st sem (evaluations)": "Evaluations taken",
    "Curricular units 1st sem (credited)": "Units credited",
    "Curricular units 1st sem (grade)": "Average grade",
    "Curricular units 1st sem (without evaluations)": "Units without evaluations",
    "Tuition fees up to date": "Tuition fees up to date",
    "Previous qualification (grade)": "Previous qualification grade",
    "Daytime/evening attendance": "Attendance",
    "Nacionality": "Nationality",
}
VALUE_TABLES = {
    "Course": COURSE, "Application mode": APPLICATION_MODE,
    "Marital status": MARITAL_STATUS, "Previous qualification": PREVIOUS_QUALIFICATION,
    "Nacionality": NATIONALITY, "Mother's qualification": MOTHER_QUALIFICATION,
    "Father's qualification": FATHER_QUALIFICATION,
    "Mother's occupation": MOTHER_OCCUPATION, "Father's occupation": FATHER_OCCUPATION,
    "Gender": GENDER,
}
YES_NO = {"Debtor", "Displaced", "Educational special needs", "International",
          "Scholarship holder", "Tuition fees up to date"}
TAGS = {"Gender": "sensitive attribute", "Inflation rate": "economic context",
        "Unemployment rate": "economic context", "GDP": "economic context"}

st.markdown("""
<style>
.fx-row {margin: .75rem 0;}
.fx-top {display: flex; justify-content: space-between; font-size: .92rem;}
.fx-track {position: relative; height: 10px; margin: .35rem 0; border-radius: 999px;
  background: rgba(128,128,128,.15);}
.fx-axis {position: absolute; left: 50%; top: -3px; bottom: -3px; width: 2px;
  background: rgba(128,128,128,.6);}
.fx-bar {position: absolute; top: 0; bottom: 0; border-radius: 999px;}
.tag {display: inline-block; margin-left: .4rem; padding: .05rem .5rem; border-radius: 999px;
  font-size: .68rem; font-weight: 500; border: 1px solid rgba(128,128,128,.45); opacity: .85;}
</style>
""", unsafe_allow_html=True)


def fmt_value(feature, v):
    if feature in YES_NO:
        return "Yes" if v else "No"
    if feature == "Daytime/evening attendance":
        return "Daytime" if v else "Evening"
    table = VALUE_TABLES.get(feature)
    if table is not None:
        text = table.get(int(v), f"code {int(v)}")
        return text if len(text) <= 36 else text[:35] + "…"
    return f"{v:g}"


def factors_html(exp):
    factors = exp["top_factors"]
    scale = max(abs(f["effect"]) for f in factors) or 1.0
    rows = []
    for f in factors:
        e, name = f["effect"], f["feature"]
        w = abs(e) / scale * 50
        color = "#e5484d" if e > 0 else "#30a46c"
        pos = f"left:50%;width:{w:.1f}%" if e > 0 else f"left:{50 - w:.1f}%;width:{w:.1f}%"
        tag = f'<span class="tag">{TAGS[name]}</span>' if name in TAGS else ""
        label = FEATURE_LABELS.get(name, name)
        rows.append(
            f'<div class="fx-row"><div class="fx-top"><span><b>{label}</b>{tag}</span>'
            f'<span style="color:{color}"><b>{e * 100:+.1f}</b> pts</span></div>'
            f'<div class="fx-track"><div class="fx-axis"></div>'
            f'<div class="fx-bar" style="{pos};background:{color}"></div></div>'
            f'<div class="muted">{fmt_value(name, f["value"])} '
            f'· typical student: {fmt_value(name, f["typical_value"])}</div></div>'
        )
    other = exp["other_features_effect"]
    rows.append(f'<div class="muted">All other features combined: <b>{other * 100:+.1f}</b> pts</div>')
    return "".join(rows)

# ---------------- Sidebar ----------------
with st.sidebar:
    st.header("🎓 EduGuard AI")
    health = api_get("/health")
    if health is None:
        st.error("● API offline")
        st.caption("Start it with `uvicorn app.main:app`")
    elif not health.get("model_loaded"):
        st.warning("● API online, model not loaded")
    else:
        st.success("● API online · model loaded")
        info = api_get("/model-info")
        if info:
            st.caption(
                f"Held-out test accuracy {info['test_accuracy']:.1%} · "
                f"macro-F1 {info['test_macro_f1']:.2f}"
            )
    st.divider()
    st.markdown("**Try an example**")
    for name in PRESETS:
        st.button(name, on_click=apply_preset, args=(name,), key=f"preset_{name}")
    st.button("Reset form", on_click=apply_preset, args=(None,), key="reset")
    st.caption("Examples change only the first-semester results. "
               "They are illustrations, not real students.")

# ---------------- Header ----------------
st.markdown(
    '<div class="hero"><h1>🎓 EduGuard AI</h1>'
    "<p>Estimate how a student's first semester points toward Dropout, Enrolled, "
    "or Graduate, so support can reach the right students sooner.</p>"
    '<span class="chip">30 input features</span>'
    '<span class="chip">3 possible outcomes</span>'
    '<span class="chip">UCI open dataset · CC BY 4.0</span></div>',
    unsafe_allow_html=True,
)

tab_predict, tab_perf, tab_codes, tab_about = st.tabs(
    ["Predict", "Model performance", "Code guide", "About & limitations"]
)

# ---------------- Predict ----------------
with tab_predict:
    left, right = st.columns([3, 2], gap="large")

    with left:
        with st.form("student_form"):
            with st.container(border=True):
                step(1, "About the student")
                hint("Hover over the ? icons for what each field means.")
                c1, c2 = st.columns(2)
                c1.number_input("Age at enrollment", min_value=16, max_value=100, step=1, key="age")
                c2.selectbox("Marital status", list(MARITAL_STATUS),
                             format_func=MARITAL_STATUS.get, key="marital")
                c1.selectbox("Attendance", [1, 0],
                             format_func=lambda v: "Daytime" if v else "Evening", key="daytime")
                c2.selectbox("Gender", [0, 1], format_func=GENDER.get, key="gender",
                             help="The dataset records gender as male or female only. "
                                  "Gender can raise fairness concerns; see the About tab.")
                t1, t2, t3 = st.columns(3)
                t1.toggle("Displaced", key="displaced",
                          help="Whether the student is recorded as displaced in the dataset.")
                t2.toggle("International", key="international")
                t3.toggle("Special needs", key="special",
                          help="Recorded as 'educational special needs' in the dataset.")

            with st.container(border=True):
                step(2, "Finances")
                hint("Yes/No answers about the student's account with the institution.")
                f1, f2, f3 = st.columns(3)
                f1.toggle("Debtor", key="debtor")
                f2.toggle("Fees up to date", key="fees",
                          help="Tuition fees paid up to date.")
                f3.toggle("Scholarship", key="scholarship")

            with st.container(border=True):
                step(3, "First-semester results")
                hint("A curricular unit is one course subject. Counts are for the first semester.")
                s1, s2, s3 = st.columns(3)
                s1.number_input("Units enrolled", min_value=0, max_value=60, step=1, key="enrolled",
                                help="Number of subjects the student signed up for.")
                s2.number_input("Units approved", min_value=0, max_value=60, step=1, key="approved",
                                help="Number of subjects the student passed.")
                s3.number_input("Evaluations taken", min_value=0, max_value=100, step=1, key="evaluations",
                                help="Number of exams/assessments taken across those subjects.")
                s4, s5 = st.columns(2)
                s4.number_input("Units credited", min_value=0, max_value=60, step=1, key="credited",
                                help="Curricular units credited in the first semester, as recorded in the dataset.")
                s5.number_input("Units without evaluations", min_value=0, max_value=60, step=1, key="without_eval",
                                help="Units with no evaluation recorded.")
                st.slider("Average grade (0-20)", 0.0, 20.0, step=0.1, key="grade",
                          help="Average grade across the first semester on a 0-20 scale. "
                               "0 means no unit was passed.")

            with st.expander("4 · Application and background (optional)"):
                hint("Pre-filled with typical values. Change them if you know the student's details. "
                     "Every code is explained in the Code guide tab.")
                st.selectbox("Course", list(COURSE), format_func=COURSE.get, key="course")
                st.selectbox("Application mode", list(APPLICATION_MODE),
                             format_func=APPLICATION_MODE.get, key="app_mode",
                             help="How the student applied to the institution.")
                st.number_input("Application order (0 = first choice, 9 = last)",
                                min_value=0, max_value=9, step=1, key="app_order",
                                help="Which choice this course was on the student's application.")
                st.selectbox("Previous qualification", list(PREVIOUS_QUALIFICATION),
                             format_func=PREVIOUS_QUALIFICATION.get, key="prev_qual")
                g1, g2 = st.columns(2)
                g1.number_input("Previous qualification grade (0-200)", min_value=0.0,
                                max_value=200.0, step=0.1, format="%.1f", key="prev_grade")
                g2.number_input("Admission grade (0-200)", min_value=0.0,
                                max_value=200.0, step=0.1, format="%.1f", key="adm_grade")
                st.selectbox("Nationality", list(NATIONALITY),
                             format_func=NATIONALITY.get, key="nationality")
                st.selectbox("Mother's qualification", list(MOTHER_QUALIFICATION),
                             format_func=MOTHER_QUALIFICATION.get, key="mq")
                st.selectbox("Father's qualification", list(FATHER_QUALIFICATION),
                             format_func=FATHER_QUALIFICATION.get, key="fq")
                st.selectbox("Mother's occupation", list(MOTHER_OCCUPATION),
                             format_func=MOTHER_OCCUPATION.get, key="mo")
                st.selectbox("Father's occupation", list(FATHER_OCCUPATION),
                             format_func=FATHER_OCCUPATION.get, key="fo")
                e1, e2, e3 = st.columns(3)
                e1.number_input("Inflation rate (%)", min_value=-5.0, max_value=20.0,
                                step=0.1, key="inflation")
                e2.number_input("Unemployment rate (%)", min_value=0.0, max_value=30.0,
                                step=0.1, key="unemployment")
                e3.number_input("GDP", min_value=-10.0, max_value=10.0,
                                step=0.01, key="gdp",
                                help="Economic indicators as recorded in the dataset.")

            submitted = st.form_submit_button("Predict outcome", type="primary")

    with right:
        if submitted:
            payload = build_payload()
            try:
                r = httpx.post(f"{API_URL}/predict", json=payload, timeout=10)
            except httpx.HTTPError:
                st.error("Can't reach the prediction API. Start it with "
                         "`uvicorn app.main:app`.")
            else:
                if r.status_code == 200:
                    S["result"] = {"out": r.json(), "payload": payload}
                elif r.status_code == 422:
                    st.error("The API rejected some inputs:")
                    for err in r.json()["detail"]:
                        st.write(f"- **{err['loc'][-1]}**: {err['msg']}")
                else:
                    st.error(f"API error {r.status_code}")

        res = S.get("result")
        if res:
            render_result(res["out"], res["payload"])
        else:
            st.markdown(
                '<div class="card"><div class="step">How it works</div>'
                '<div class="howto">'
                '<div><span class="badge">1</span><span>Enter the student\'s details, or pick an '
                "example in the sidebar.</span></div>"
                '<div><span class="badge">2</span><span>Press <b>Predict outcome</b>.</span></div>'
                '<div><span class="badge">3</span><span>Read the scores for Dropout, Enrolled '
                "and Graduate. They are estimates to guide support.</span></div>"
                "</div></div>",
                unsafe_allow_html=True,
            )





# ---------------- Model performance ----------------
with tab_perf:
    perf = api_get("/model-performance")
    if perf is None:
        st.info("Performance data isn't available. Start the API, then run "
                "`python src/evaluate.py` and `python src/compare_models.py`.")
    else:
        test, comp = perf["test"], perf["comparison"]
        st.markdown("### Held-out test results")
        st.caption("Scored once on 885 students the model never saw during training or tuning.")
        k1, k2, k3 = st.columns(3)
        k1.markdown(tile("Accuracy", f"{test['accuracy']:.1%}"), unsafe_allow_html=True)
        k2.markdown(tile("Macro F1", f"{test['macro_f1']:.3f}"), unsafe_allow_html=True)
        k3.markdown(tile("Dropout recall", f"{test['per_class']['Dropout']['recall']:.1%}"),
                    unsafe_allow_html=True)

        cm_col, pc_col = st.columns([3, 2], gap="large")
        with cm_col:
            st.markdown("##### Confusion matrix")
            st.markdown(confusion_html(test["labels"], test["confusion_matrix"]),
                        unsafe_allow_html=True)
            st.caption("Rows are the true outcome, columns the prediction. Green cells are "
                       "correct calls; red cells are mistakes. Percentages are shares of each "
                       "true class, so the diagonal shows recall.")
        with pc_col:
            st.markdown("##### Per-class scores")
            df_pc = pd.DataFrame(test["per_class"]).T[["precision", "recall", "f1-score", "support"]]
            df_pc["support"] = df_pc["support"].astype(int)
            st.dataframe(df_pc.round(3))
            st.caption("Enrolled is the weakest class: its outcome is still open, so the "
                       "model finds only a minority of those students.")

        st.markdown("### Model comparison")
        if comp is None:
            st.info("Run `python src/compare_models.py` to generate the comparison.")
        else:
            metric = st.radio("Metric", list(METRIC_LABELS), format_func=METRIC_LABELS.get,
                              horizontal=True)
            st.markdown(comparison_bars(comp["results"], metric), unsafe_allow_html=True)
            st.caption(
                f"{comp['cv_folds']}-fold stratified cross-validation on "
                f"{comp['n_train']} training students (feature set {comp['feature_set']}). "
                "Bars show the mean; ± is the spread across folds. Models whose gaps are "
                "smaller than the spread are effectively tied."
            )
            st.markdown(
                "**How the model was chosen.** We wanted a model that catches dropouts, not "
                "just one with high accuracy. The rule: require cross-validated Dropout recall "
                "of at least 0.74, then pick the best macro F1. The 0.74 threshold was set after "
                "seeing the cross-validation results, and the test set was used only once, "
                "after the choice was made."
            )





# ---------------- Code guide ----------------
with tab_codes:
    st.markdown("### Code guide")
    st.markdown(
        "The dataset stores many answers as numbers. The form shows names, and this "
        "page lists every number and its meaning. Labels are copied from the "
        "[UCI dataset documentation](https://archive.ics.uci.edu/dataset/697/predict+students+dropout+and+academic+success)."
    )
    g1, g2 = st.columns(2)
    with g1:
        st.markdown(
            "**Yes/No fields** (1 = yes, 0 = no): Displaced, Educational special needs, "
            "Debtor, Tuition fees up to date, Scholarship holder, International.\n\n"
            "**Gender:** 1 = male, 0 = female.\n\n"
            "**Attendance:** 1 = daytime, 0 = evening."
        )
    with g2:
        st.markdown(
            "**Application order:** 0 = first choice, 9 = last choice.\n\n"
            "**Grades:** admission and previous-qualification grades use 0 to 200; "
            "semester average grades use 0 to 20.\n\n"
            "**Curricular unit:** one course subject."
        )
    TABLES = {
        "Marital status": MARITAL_STATUS,
        "Application mode": APPLICATION_MODE,
        "Course": COURSE,
        "Previous qualification": PREVIOUS_QUALIFICATION,
        "Nationality": NATIONALITY,
        "Mother's / Father's qualification": MOTHER_QUALIFICATION,
        "Father's qualification (extra codes)": {
            k: v for k, v in FATHER_QUALIFICATION.items() if k not in MOTHER_QUALIFICATION
        },
        "Mother's occupation": MOTHER_OCCUPATION,
        "Father's occupation": FATHER_OCCUPATION,
    }
    for title, table in TABLES.items():
        with st.expander(title):
            st.dataframe(
                pd.DataFrame({"Code": list(table), "Meaning": list(table.values())}),
                hide_index=True,
            )

# ---------------- About ----------------
with tab_about:
    st.markdown("""
### What this tool does
EduGuard AI estimates whether a student is more likely to **drop out**, **still be
enrolled**, or **graduate**, using information known after the first semester.
It is meant to help advisors decide who to check in with, not to judge students.

### How to read a result
- The ring and bars are model scores that add up to 100%. They are not verified
  probabilities of real outcomes.
- "Enrolled" is the hardest class for the model, because those students' outcomes
  are still open. Treat it with the most caution.
- Much of the signal comes from first-semester results, so the tool is better at
  recognizing students who are already struggling than at predicting surprises.

### Limitations
- Trained on one Portuguese institution's data, so it may not transfer elsewhere.
- Some inputs (such as gender) can raise fairness concerns. Review before real use.
- Whether fee and debtor status were recorded before or after the outcome is not
  documented in the dataset, so those inputs may carry some leaked information.

### Data
Realinho, V., Vieira Martins, M., Machado, J., & Baptista, L. (2021).
*Predict Students' Dropout and Academic Success* [Dataset]. UCI Machine Learning
Repository. https://doi.org/10.24432/C5MC89 (CC BY 4.0)
""")