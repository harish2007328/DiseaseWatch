"""
DiseaseWatch ML Risk Assessment Module

Uses scikit-learn RandomForestClassifier for risk level prediction
and a rule-based system for syndrome classification.

IMPORTANT: This is a surveillance aid for hackathon demonstration.
Not a medical diagnosis system.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os
import math
from typing import Dict, List, Tuple, Optional


# Feature names for the model
FEATURE_NAMES = [
    "fever", "diarrhea", "vomiting", "cough", "headache",
    "body_pain", "rash", "breathing_difficulty",
    "case_count", "case_growth_rate",
    "water_contamination", "sanitation_problems",
    "stagnant_water", "mosquito_breeding",
    "population_density", "severity_score"
]

RISK_LEVELS = ["low", "medium", "high", "critical"]

SYNDROME_CATEGORIES = [
    "Waterborne illness risk",
    "Respiratory illness risk",
    "Vector-borne illness risk",
    "Gastrointestinal illness risk",
    "General infectious illness risk",
]


def generate_training_data(n_samples: int = 2000) -> Tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Generate synthetic training data for the risk model.
    Creates semi-realistic health surveillance scenarios.
    """
    np.random.seed(42)
    data = []

    for _ in range(n_samples):
        scenario = np.random.choice(["waterborne", "respiratory", "vector", "gastro", "general", "healthy"],
                                     p=[0.18, 0.15, 0.12, 0.15, 0.15, 0.25])

        if scenario == "waterborne":
            row = {
                "fever": np.random.choice([0, 1], p=[0.2, 0.8]),
                "diarrhea": np.random.choice([0, 1], p=[0.1, 0.9]),
                "vomiting": np.random.choice([0, 1], p=[0.2, 0.8]),
                "cough": np.random.choice([0, 1], p=[0.85, 0.15]),
                "headache": np.random.choice([0, 1], p=[0.4, 0.6]),
                "body_pain": np.random.choice([0, 1], p=[0.5, 0.5]),
                "rash": np.random.choice([0, 1], p=[0.9, 0.1]),
                "breathing_difficulty": np.random.choice([0, 1], p=[0.95, 0.05]),
                "case_count": np.random.randint(5, 40),
                "case_growth_rate": np.random.uniform(0.3, 2.5),
                "water_contamination": np.random.choice([0, 1], p=[0.15, 0.85]),
                "sanitation_problems": np.random.choice([0, 1], p=[0.3, 0.7]),
                "stagnant_water": np.random.choice([0, 1], p=[0.4, 0.6]),
                "mosquito_breeding": np.random.choice([0, 1], p=[0.7, 0.3]),
                "population_density": np.random.uniform(0.5, 3.0),
                "severity_score": np.random.choice([1, 2, 3], p=[0.1, 0.4, 0.5]),
            }
            syndrome = "Waterborne illness risk"

        elif scenario == "respiratory":
            row = {
                "fever": np.random.choice([0, 1], p=[0.15, 0.85]),
                "diarrhea": np.random.choice([0, 1], p=[0.9, 0.1]),
                "vomiting": np.random.choice([0, 1], p=[0.85, 0.15]),
                "cough": np.random.choice([0, 1], p=[0.05, 0.95]),
                "headache": np.random.choice([0, 1], p=[0.3, 0.7]),
                "body_pain": np.random.choice([0, 1], p=[0.4, 0.6]),
                "rash": np.random.choice([0, 1], p=[0.9, 0.1]),
                "breathing_difficulty": np.random.choice([0, 1], p=[0.2, 0.8]),
                "case_count": np.random.randint(3, 25),
                "case_growth_rate": np.random.uniform(0.2, 1.8),
                "water_contamination": np.random.choice([0, 1], p=[0.9, 0.1]),
                "sanitation_problems": np.random.choice([0, 1], p=[0.7, 0.3]),
                "stagnant_water": np.random.choice([0, 1], p=[0.8, 0.2]),
                "mosquito_breeding": np.random.choice([0, 1], p=[0.7, 0.3]),
                "population_density": np.random.uniform(0.8, 3.5),
                "severity_score": np.random.choice([1, 2, 3], p=[0.2, 0.5, 0.3]),
            }
            syndrome = "Respiratory illness risk"

        elif scenario == "vector":
            row = {
                "fever": np.random.choice([0, 1], p=[0.1, 0.9]),
                "diarrhea": np.random.choice([0, 1], p=[0.8, 0.2]),
                "vomiting": np.random.choice([0, 1], p=[0.7, 0.3]),
                "cough": np.random.choice([0, 1], p=[0.85, 0.15]),
                "headache": np.random.choice([0, 1], p=[0.2, 0.8]),
                "body_pain": np.random.choice([0, 1], p=[0.15, 0.85]),
                "rash": np.random.choice([0, 1], p=[0.3, 0.7]),
                "breathing_difficulty": np.random.choice([0, 1], p=[0.9, 0.1]),
                "case_count": np.random.randint(2, 20),
                "case_growth_rate": np.random.uniform(0.1, 1.5),
                "water_contamination": np.random.choice([0, 1], p=[0.8, 0.2]),
                "sanitation_problems": np.random.choice([0, 1], p=[0.6, 0.4]),
                "stagnant_water": np.random.choice([0, 1], p=[0.2, 0.8]),
                "mosquito_breeding": np.random.choice([0, 1], p=[0.1, 0.9]),
                "population_density": np.random.uniform(0.5, 2.5),
                "severity_score": np.random.choice([1, 2, 3], p=[0.15, 0.5, 0.35]),
            }
            syndrome = "Vector-borne illness risk"

        elif scenario == "gastro":
            row = {
                "fever": np.random.choice([0, 1], p=[0.3, 0.7]),
                "diarrhea": np.random.choice([0, 1], p=[0.1, 0.9]),
                "vomiting": np.random.choice([0, 1], p=[0.15, 0.85]),
                "cough": np.random.choice([0, 1], p=[0.9, 0.1]),
                "headache": np.random.choice([0, 1], p=[0.4, 0.6]),
                "body_pain": np.random.choice([0, 1], p=[0.3, 0.7]),
                "rash": np.random.choice([0, 1], p=[0.9, 0.1]),
                "breathing_difficulty": np.random.choice([0, 1], p=[0.95, 0.05]),
                "case_count": np.random.randint(3, 30),
                "case_growth_rate": np.random.uniform(0.2, 2.0),
                "water_contamination": np.random.choice([0, 1], p=[0.4, 0.6]),
                "sanitation_problems": np.random.choice([0, 1], p=[0.3, 0.7]),
                "stagnant_water": np.random.choice([0, 1], p=[0.6, 0.4]),
                "mosquito_breeding": np.random.choice([0, 1], p=[0.8, 0.2]),
                "population_density": np.random.uniform(0.5, 2.5),
                "severity_score": np.random.choice([1, 2, 3], p=[0.15, 0.45, 0.4]),
            }
            syndrome = "Gastrointestinal illness risk"

        elif scenario == "general":
            row = {
                "fever": np.random.choice([0, 1], p=[0.2, 0.8]),
                "diarrhea": np.random.choice([0, 1], p=[0.6, 0.4]),
                "vomiting": np.random.choice([0, 1], p=[0.7, 0.3]),
                "cough": np.random.choice([0, 1], p=[0.5, 0.5]),
                "headache": np.random.choice([0, 1], p=[0.3, 0.7]),
                "body_pain": np.random.choice([0, 1], p=[0.3, 0.7]),
                "rash": np.random.choice([0, 1], p=[0.7, 0.3]),
                "breathing_difficulty": np.random.choice([0, 1], p=[0.8, 0.2]),
                "case_count": np.random.randint(2, 15),
                "case_growth_rate": np.random.uniform(0.0, 1.0),
                "water_contamination": np.random.choice([0, 1], p=[0.7, 0.3]),
                "sanitation_problems": np.random.choice([0, 1], p=[0.5, 0.5]),
                "stagnant_water": np.random.choice([0, 1], p=[0.6, 0.4]),
                "mosquito_breeding": np.random.choice([0, 1], p=[0.6, 0.4]),
                "population_density": np.random.uniform(0.3, 2.0),
                "severity_score": np.random.choice([1, 2, 3], p=[0.3, 0.5, 0.2]),
            }
            syndrome = "General infectious illness risk"

        else:  # healthy / low risk
            row = {
                "fever": np.random.choice([0, 1], p=[0.8, 0.2]),
                "diarrhea": np.random.choice([0, 1], p=[0.9, 0.1]),
                "vomiting": np.random.choice([0, 1], p=[0.95, 0.05]),
                "cough": np.random.choice([0, 1], p=[0.8, 0.2]),
                "headache": np.random.choice([0, 1], p=[0.7, 0.3]),
                "body_pain": np.random.choice([0, 1], p=[0.8, 0.2]),
                "rash": np.random.choice([0, 1], p=[0.95, 0.05]),
                "breathing_difficulty": np.random.choice([0, 1], p=[0.98, 0.02]),
                "case_count": np.random.randint(0, 4),
                "case_growth_rate": np.random.uniform(-0.2, 0.3),
                "water_contamination": np.random.choice([0, 1], p=[0.95, 0.05]),
                "sanitation_problems": np.random.choice([0, 1], p=[0.85, 0.15]),
                "stagnant_water": np.random.choice([0, 1], p=[0.9, 0.1]),
                "mosquito_breeding": np.random.choice([0, 1], p=[0.9, 0.1]),
                "population_density": np.random.uniform(0.2, 1.5),
                "severity_score": np.random.choice([1, 2, 3], p=[0.7, 0.25, 0.05]),
            }
            syndrome = "General infectious illness risk"

        # Calculate risk level based on composite score
        symptom_count = sum([row["fever"], row["diarrhea"], row["vomiting"],
                            row["cough"], row["headache"], row["body_pain"],
                            row["rash"], row["breathing_difficulty"]])
        env_score = sum([row["water_contamination"], row["sanitation_problems"],
                        row["stagnant_water"], row["mosquito_breeding"]])
        composite = (symptom_count * 2 + row["case_count"] * 0.5 +
                     row["case_growth_rate"] * 5 + env_score * 3 +
                     row["severity_score"] * 2 + row["population_density"] * 1.5)

        if composite > 35:
            risk = "critical"
        elif composite > 25:
            risk = "high"
        elif composite > 15:
            risk = "medium"
        else:
            risk = "low"

        row["risk_level"] = risk
        row["syndrome"] = syndrome
        data.append(row)

    df = pd.DataFrame(data)
    X = df[FEATURE_NAMES]
    y_risk = df["risk_level"]
    y_syndrome = df["syndrome"]

    return X, y_risk, y_syndrome


class RiskModel:
    """ML model for health risk assessment."""

    def __init__(self):
        self.risk_model: Optional[RandomForestClassifier] = None
        self.risk_encoder = LabelEncoder()
        self.syndrome_model: Optional[RandomForestClassifier] = None
        self.syndrome_encoder = LabelEncoder()
        self.anomaly_model: Optional[IsolationForest] = None
        self.is_trained = False
        self.feature_importance: Dict[str, float] = {}

    def train(self):
        """Train the risk assessment model."""
        print("Training risk assessment model...")
        X, y_risk, y_syndrome = generate_training_data(2000)

        # Encode labels
        y_risk_encoded = self.risk_encoder.fit_transform(y_risk)
        y_syndrome_encoded = self.syndrome_encoder.fit_transform(y_syndrome)

        # Train risk level classifier
        self.risk_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight="balanced"
        )
        self.risk_model.fit(X, y_risk_encoded)

        # Train syndrome classifier
        self.syndrome_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight="balanced"
        )
        self.syndrome_model.fit(X, y_syndrome_encoded)

        # Train anomaly detector
        self.anomaly_model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42
        )
        self.anomaly_model.fit(X)

        # Feature importance
        importances = self.risk_model.feature_importances_
        self.feature_importance = dict(zip(FEATURE_NAMES, [round(float(x), 4) for x in importances]))

        self.is_trained = True
        print("Model training complete.")
        print(f"Feature importance: {self.feature_importance}")

    def predict_risk(self, features: Dict) -> Dict:
        """
        Predict risk level and suspected syndrome.

        Returns risk assessment — NOT a medical diagnosis.
        """
        if not self.is_trained:
            self.train()

        # Prepare feature vector
        feature_vector = np.array([[
            int(features.get("fever", 0)),
            int(features.get("diarrhea", 0)),
            int(features.get("vomiting", 0)),
            int(features.get("cough", 0)),
            int(features.get("headache", 0)),
            int(features.get("body_pain", 0)),
            int(features.get("rash", 0)),
            int(features.get("breathing_difficulty", 0)),
            features.get("case_count", 1),
            features.get("case_growth_rate", 0),
            int(features.get("water_contamination", 0)),
            int(features.get("sanitation_problems", 0)),
            int(features.get("stagnant_water", 0)),
            int(features.get("mosquito_breeding", 0)),
            features.get("population_density", 1.0),
            {"mild": 1, "moderate": 2, "severe": 3}.get(features.get("severity", "mild"), 1),
        ]])

        # Predict risk level
        risk_proba = self.risk_model.predict_proba(feature_vector)[0]
        risk_idx = np.argmax(risk_proba)
        risk_level = self.risk_encoder.inverse_transform([risk_idx])[0]
        risk_confidence = float(risk_proba[risk_idx])

        # Predict syndrome
        syndrome_proba = self.syndrome_model.predict_proba(feature_vector)[0]
        syndrome_idx = np.argmax(syndrome_proba)
        suspected_syndrome = self.syndrome_encoder.inverse_transform([syndrome_idx])[0]
        syndrome_confidence = float(syndrome_proba[syndrome_idx])

        # Use higher confidence
        confidence = max(risk_confidence, syndrome_confidence)

        # Generate reasons
        reasons = self._generate_reasons(features, risk_level, suspected_syndrome)

        # Get top important features for this prediction
        top_features = dict(sorted(
            self.feature_importance.items(),
            key=lambda x: x[1], reverse=True
        )[:6])

        return {
            "risk_level": risk_level,
            "suspected_syndrome": suspected_syndrome,
            "confidence": round(confidence, 2),
            "reasons": reasons,
            "feature_importance": top_features,
        }

    def detect_anomaly(self, features: Dict) -> Dict:
        """Detect anomalous patterns using Isolation Forest + statistical methods."""
        if not self.is_trained:
            self.train()

        current_cases = features.get("current_cases", 0)
        historical_avg = features.get("historical_average", 5)
        historical_std = features.get("historical_std", 2)

        # Statistical anomaly detection
        if historical_std > 0:
            z_score = (current_cases - historical_avg) / historical_std
        else:
            z_score = (current_cases - historical_avg) / max(historical_avg * 0.5, 1)

        pct_increase = ((current_cases - historical_avg) / max(historical_avg, 1)) * 100

        # Isolation Forest anomaly detection
        feature_vector = np.array([[
            int(features.get("fever", 0)),
            int(features.get("diarrhea", 0)),
            int(features.get("vomiting", 0)),
            int(features.get("cough", 0)),
            int(features.get("headache", 0)),
            int(features.get("body_pain", 0)),
            int(features.get("rash", 0)),
            int(features.get("breathing_difficulty", 0)),
            current_cases,
            features.get("case_growth_rate", 0),
            int(features.get("water_contamination", 0)),
            int(features.get("sanitation_problems", 0)),
            int(features.get("stagnant_water", 0)),
            int(features.get("mosquito_breeding", 0)),
            features.get("population_density", 1.0),
            features.get("severity_score", 1),
        ]])

        isolation_score = self.anomaly_model.decision_function(feature_vector)[0]
        isolation_anomaly = self.anomaly_model.predict(feature_vector)[0] == -1

        # Combined anomaly detection
        is_anomaly = (z_score > 2.0) or (pct_increase > 100) or isolation_anomaly

        if is_anomaly:
            if pct_increase > 300:
                message = f"CRITICAL: Extreme increase detected — {int(pct_increase)}% above historical average"
            elif pct_increase > 150:
                message = f"WARNING: Unusual increase detected — {int(pct_increase)}% above historical average"
            else:
                message = f"ALERT: Elevated cases detected — {int(pct_increase)}% above historical average"
        else:
            message = "Case count within expected range"

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": round(float(abs(isolation_score)), 3),
            "deviation": round(float(z_score), 2),
            "message": message,
            "details": {
                "current_cases": current_cases,
                "historical_average": historical_avg,
                "historical_std": round(historical_std, 2),
                "z_score": round(float(z_score), 2),
                "percent_increase": round(pct_increase, 1),
                "isolation_forest_anomaly": isolation_anomaly,
                "isolation_score": round(float(isolation_score), 3),
            }
        }

    def detect_clusters(self, camps_data: List[Dict]) -> List[Dict]:
        """
        Detect geographic clusters of similar health conditions.
        Uses distance-based clustering with symptom similarity.
        """
        clusters = []
        processed = set()

        for i, camp_a in enumerate(camps_data):
            if camp_a["id"] in processed:
                continue

            cluster_camps = [camp_a]
            cluster_syndromes = {}

            if camp_a.get("top_syndrome"):
                cluster_syndromes[camp_a["top_syndrome"]] = camp_a.get("active_cases", 0)

            for j, camp_b in enumerate(camps_data):
                if i == j or camp_b["id"] in processed:
                    continue

                # Geographic distance (rough km)
                dist = self._haversine_distance(
                    camp_a["location_lat"], camp_a["location_lng"],
                    camp_b["location_lat"], camp_b["location_lng"]
                )

                # Within 15km and similar syndrome
                if dist < 15:
                    syndrome_a = camp_a.get("top_syndrome", "")
                    syndrome_b = camp_b.get("top_syndrome", "")

                    if (syndrome_a and syndrome_b and
                        (syndrome_a == syndrome_b or
                         self._syndromes_related(syndrome_a, syndrome_b))):

                        cases_a = camp_a.get("active_cases", 0)
                        cases_b = camp_b.get("active_cases", 0)

                        # Both must have elevated cases
                        if cases_a >= 5 and cases_b >= 5:
                            cluster_camps.append(camp_b)
                            if camp_b.get("top_syndrome"):
                                s = camp_b["top_syndrome"]
                                cluster_syndromes[s] = cluster_syndromes.get(s, 0) + camp_b.get("active_cases", 0)

            if len(cluster_camps) >= 2:
                total_cases = sum(c.get("active_cases", 0) for c in cluster_camps)
                common_syndrome = max(cluster_syndromes, key=cluster_syndromes.get) if cluster_syndromes else "Unknown"

                # Environmental factors
                env_factors = []
                for c in cluster_camps:
                    env_factors.extend(c.get("environmental_issues", []))
                env_factors = list(set(env_factors))

                clusters.append({
                    "id": f"cluster-{len(clusters) + 1}",
                    "affected_camps": [c["name"] for c in cluster_camps],
                    "affected_camp_ids": [c["id"] for c in cluster_camps],
                    "total_cases": total_cases,
                    "common_syndrome": common_syndrome,
                    "environmental_factors": env_factors,
                    "center_lat": sum(c["location_lat"] for c in cluster_camps) / len(cluster_camps),
                    "center_lng": sum(c["location_lng"] for c in cluster_camps) / len(cluster_camps),
                    "radius_km": max(
                        self._haversine_distance(
                            cluster_camps[0]["location_lat"], cluster_camps[0]["location_lng"],
                            c["location_lat"], c["location_lng"]
                        ) for c in cluster_camps
                    ) if len(cluster_camps) > 1 else 5,
                    "severity": "high" if total_cases > 30 else "medium",
                })

                for c in cluster_camps:
                    processed.add(c["id"])

        return clusters

    def _generate_reasons(self, features: Dict, risk_level: str, syndrome: str) -> List[str]:
        """Generate human-readable reasons for the risk assessment."""
        reasons = []

        case_count = features.get("case_count", 0)
        growth_rate = features.get("case_growth_rate", 0)

        if case_count > 15:
            reasons.append(f"High number of cases reported ({case_count})")
        elif case_count > 8:
            reasons.append(f"Significant case count ({case_count})")

        if growth_rate > 1.0:
            reasons.append(f"Rapid case increase ({int(growth_rate * 100)}% growth rate)")
        elif growth_rate > 0.5:
            reasons.append(f"Notable case growth trend ({int(growth_rate * 100)}% growth rate)")

        if features.get("diarrhea") and features.get("vomiting"):
            reasons.append("Gastrointestinal symptoms (diarrhea + vomiting) co-occurring")
        if features.get("cough") and features.get("breathing_difficulty"):
            reasons.append("Respiratory symptoms (cough + breathing difficulty) detected")
        if features.get("rash") and features.get("body_pain"):
            reasons.append("Rash with body pain suggests possible vector-borne illness")

        if features.get("water_contamination"):
            reasons.append("Water contamination reported in camp area")
        if features.get("sanitation_problems"):
            reasons.append("Poor sanitation conditions reported")
        if features.get("stagnant_water"):
            reasons.append("Stagnant water found — potential mosquito breeding site")
        if features.get("mosquito_breeding"):
            reasons.append("Mosquito breeding sites identified")

        severity = features.get("severity", "mild")
        if severity == "severe":
            reasons.append("Severe symptom severity reported")

        if not reasons:
            reasons.append("Assessment based on available symptom and environmental data")

        return reasons

    def _haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two points in km."""
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    def _syndromes_related(self, s1: str, s2: str) -> bool:
        """Check if two syndromes are epidemiologically related."""
        related_groups = [
            {"Waterborne illness risk", "Gastrointestinal illness risk"},
            {"Respiratory illness risk"},
            {"Vector-borne illness risk"},
        ]
        for group in related_groups:
            if s1 in group and s2 in group:
                return True
        return False


# Global model instance
risk_model = RiskModel()


def get_model() -> RiskModel:
    """Get or initialize the risk model."""
    if not risk_model.is_trained:
        risk_model.train()
    return risk_model
