from __future__ import annotations

import math
from typing import Any, Dict

from .pose_utils import PoseSequence, ReferenceBank, compare_to_reference_bank


def _finite_float(value: Any, default: float | None = None) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default
    return parsed if math.isfinite(parsed) else default


def public_result(result: Dict[str, Any]) -> Dict[str, Any]:
    return {
        key: value
        for key, value in result.items()
        if key not in {"bad_mask", "valid_mask", "distance", "ratio", "user_xy", "reference_xy", "tolerance_used"}
    }


def rank_sequence_against_banks(seq: PoseSequence, banks: Dict[str, ReferenceBank]) -> list[dict[str, Any]]:
    ranked = []
    for gloss, bank in banks.items():
        result = compare_to_reference_bank(seq, bank)
        ranked.append(
            {
                "gloss": gloss,
                "score": _finite_float(result.get("score"), 0.0),
                "bad_fraction": _finite_float(result.get("bad_fraction"), 1.0),
                "median_ratio": _finite_float(result.get("median_ratio"), None),
            }
        )
    ranked.sort(
        key=lambda item: (
            _finite_float(item.get("bad_fraction"), 1.0),
            -float(_finite_float(item.get("score"), 0.0) or 0.0),
            _finite_float(item.get("median_ratio"), math.inf),
        )
    )
    return ranked


def decision_for_target(
    target_result: Dict[str, Any],
    target_rank: int,
    top1_score: float | None = None,
    soft_accept_score: float = 90.0,
    soft_accept_rank: int = 3,
    soft_accept_gap: float = 12.0,
    wrong_word_rank: int = 4,
    wrong_word_low_score: float = 90.0,
    wrong_word_gap: float = 15.0,
    min_valid_fraction: float = 0.55,
) -> dict[str, bool]:
    score = target_result["score"]
    valid_fraction = float(target_result.get("valid_fraction", 1.0))
    top1_gap = 0.0 if top1_score is None else float(top1_score) - float(score)
    low_tracking_quality = (valid_fraction < min_valid_fraction) or bool(target_result.get("low_tracking_quality", False))
    soft_accept = (
        not low_tracking_quality
        and valid_fraction >= min_valid_fraction
        and target_rank <= soft_accept_rank
        and score >= soft_accept_score
        and top1_gap <= soft_accept_gap
    )
    possible_wrong_word = low_tracking_quality or ((not soft_accept) and (
        target_rank >= wrong_word_rank
        or score < wrong_word_low_score
        or top1_gap >= wrong_word_gap
    ))
    return {
        "accept_as_target": soft_accept,
        "possible_wrong_word": possible_wrong_word,
        "needs_component_feedback": score < 95,
        "low_tracking_quality": low_tracking_quality,
    }



def normalize_lesson_predictions(predictions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    total = float(sum(item["score"] for item in predictions))
    if total <= 1e-9:
        total = 1.0
    return [
        {
            "gloss": item["gloss"],
            "raw_score": float(item["score"]),
            "lesson_score": float(item["score"]) / total,
        }
        for item in predictions
    ]


def with_lesson_scores(
    predictions: list[dict[str, Any]],
    lesson_glosses: list[str],
) -> list[dict[str, Any]]:
    lesson_set = set(lesson_glosses)
    lesson_total = float(
        sum(float(item["score"]) for item in predictions if item.get("gloss") in lesson_set)
    )
    if lesson_total <= 1e-9:
        lesson_total = 1.0
    return [
        {
            "gloss": item["gloss"],
            "raw_score": float(item["score"]),
            "lesson_score": (
                float(item["score"]) / lesson_total
                if item.get("gloss") in lesson_set
                else 0.0
            ),
        }
        for item in predictions
    ]


def decision_for_practice_ii(
    target_gloss: str,
    lesson_glosses: list[str],
    target_result: Dict[str, Any],
    target_rank: int,
    bank_top1_gloss: str | None,
    classifier_predictions: list[dict[str, Any]],
    top1_score: float | None = None,
    wrong_word_min_lesson_score: float = 0.45,
    wrong_word_min_margin: float = 0.10,
    target_accept_min_lesson_score: float = 0.95,
    target_accept_min_raw_score: float = 0.01,
    wrong_word_min_raw_score: float = 0.35,
    min_classifier_raw_score: float = 0.01,
    bank_target_confirm_score: float = 90.0,
    bank_fallback_min_score: float = 95.0,
    bank_fallback_min_gap: float = 5.0,
    bank_fallback_min_target_rank: int = 3,
) -> dict[str, Any]:
    base = decision_for_target(target_result, target_rank, top1_score=top1_score)
    lesson_set = set(lesson_glosses)
    top1 = classifier_predictions[0] if classifier_predictions else None
    top2 = classifier_predictions[1] if len(classifier_predictions) > 1 else None
    predicted_gloss = top1["gloss"] if top1 is not None else None
    predicted_gloss_in_lesson = predicted_gloss in lesson_set if predicted_gloss is not None else False
    predicted_raw_score = float(top1["raw_score"]) if top1 is not None else 0.0
    predicted_lesson_score = float(top1["lesson_score"]) if top1 is not None else 0.0
    predicted_margin = (
        predicted_lesson_score - float(top2["lesson_score"])
        if top1 is not None and top2 is not None
        else predicted_lesson_score
    )
    classifier_supports_target = bool(
        predicted_gloss == target_gloss
        and predicted_raw_score >= min_classifier_raw_score
        and (
            predicted_lesson_score >= target_accept_min_lesson_score
            or predicted_raw_score >= target_accept_min_raw_score
        )
    )
    bank_supports_target = bool(
        bank_top1_gloss == target_gloss
        and top1_score is not None
        and float(top1_score) >= bank_target_confirm_score
        and target_rank == 1
    )

    classifier_wrong_word = bool(
        not bank_supports_target
        and
        predicted_gloss is not None
        and predicted_gloss_in_lesson
        and predicted_gloss != target_gloss
        and predicted_raw_score >= wrong_word_min_raw_score
        and (
            predicted_gloss == bank_top1_gloss
            or target_rank != 1
            or target_result["score"] < 80
            or predicted_margin >= wrong_word_min_margin
        )
    )
    bank_wrong_word_fallback = bool(
        not classifier_wrong_word
        and bank_top1_gloss is not None
        and bank_top1_gloss != target_gloss
        and target_rank >= bank_fallback_min_target_rank
        and top1_score is not None
        and float(top1_score) >= bank_fallback_min_score
        and (float(top1_score) - float(target_result["score"])) >= bank_fallback_min_gap
        and (
            predicted_lesson_score < wrong_word_min_lesson_score
            or predicted_raw_score < min_classifier_raw_score
        )
    )
    bank_strong_wrong_candidate = bool(
        bank_top1_gloss is not None
        and bank_top1_gloss != target_gloss
        and target_rank >= bank_fallback_min_target_rank
        and top1_score is not None
        and float(top1_score) >= max(bank_fallback_min_score, 98.0)
        and (float(top1_score) - float(target_result["score"])) >= max(bank_fallback_min_gap, 12.0)
    )
    wrong_word_detected = classifier_wrong_word or bank_wrong_word_fallback
    possible_wrong_word = wrong_word_detected or (base["possible_wrong_word"] and not classifier_supports_target)
    predicted_wrong_gloss = None
    predicted_wrong_source = None
    if classifier_wrong_word:
        if (
            bank_strong_wrong_candidate
            and predicted_lesson_score == 0.0
            and predicted_gloss != bank_top1_gloss
        ):
            predicted_wrong_gloss = bank_top1_gloss
            predicted_wrong_source = "pose_bank_strong_override"
        else:
            predicted_wrong_gloss = predicted_gloss
            predicted_wrong_source = "global_onnx"
    elif bank_wrong_word_fallback:
        predicted_wrong_gloss = bank_top1_gloss
        predicted_wrong_source = "pose_bank_fallback"

    return {
        "accept_as_target": (not wrong_word_detected) and (base["accept_as_target"] or classifier_supports_target or bank_supports_target),
        "possible_wrong_word": possible_wrong_word,
        "needs_component_feedback": wrong_word_detected or base["needs_component_feedback"],
        "low_tracking_quality": base["low_tracking_quality"],
        "wrong_word_detected": wrong_word_detected,
        "predicted_wrong_gloss": predicted_wrong_gloss,
        "predicted_wrong_source": predicted_wrong_source,
        "predicted_lesson_score": predicted_lesson_score if top1 is not None else None,
        "predicted_raw_score": predicted_raw_score if top1 is not None else None,
        "predicted_margin": predicted_margin if top1 is not None else None,
    }
