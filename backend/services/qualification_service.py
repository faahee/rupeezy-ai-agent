class QualificationScorer:
    scoring_signals = {
        "explicit_interest": +25,
        "network_mentioned": +20,
        "objection_resolved": +10,
        "engagement_long": +15,
        "asked_for_details": +20,
        "multiple_objections": -15,
        "wants_to_think": -10,
        "negative_response": -20,
        "language_match": +5,
    }

    @staticmethod
    def classify(score: int) -> str:
        if score >= 70:
            return "Hot"
        elif score >= 40:
            return "Warm"
        return "Cold"

    @staticmethod
    def get_recommended_action(classification: str) -> str:
        actions = {
            "Hot": "Transfer to RM immediately",
            "Warm": "Send WhatsApp follow-up link",
            "Cold": "Log for re-engagement in 30 days",
        }
        return actions.get(classification, "Log for re-engagement in 30 days")

    @classmethod
    def compute_score(cls, signals: dict) -> int:
        """
        signals: dict of signal_name -> bool (True if triggered)
        """
        score = 0
        for signal, triggered in signals.items():
            if triggered and signal in cls.scoring_signals:
                score += cls.scoring_signals[signal]
        return max(0, min(100, score))

    @classmethod
    def score_from_conversation(cls, conversation_data: dict) -> dict:
        signals = {
            "explicit_interest": conversation_data.get("explicit_interest", False),
            "network_mentioned": conversation_data.get("network_mentioned", False),
            "objection_resolved": conversation_data.get("objections_resolved", 0) > 0,
            "engagement_long": conversation_data.get("message_count", 0) > 6,
            "asked_for_details": conversation_data.get("asked_for_details", False),
            "multiple_objections": conversation_data.get("objections_raised", 0) >= 3,
            "wants_to_think": conversation_data.get("wants_to_think", False),
            "negative_response": conversation_data.get("negative_response", False),
            "language_match": conversation_data.get("language_match", False),
        }
        score = cls.compute_score(signals)
        classification = cls.classify(score)
        return {
            "score": score,
            "classification": classification,
            "recommended_action": cls.get_recommended_action(classification),
            "signals": signals,
        }
