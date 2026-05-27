import sys
from pathlib import Path
import numpy as np

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from signova_practice_i.pose_utils import PoseSequence, ReferenceBank, compare_to_reference_bank

def test_scoring_with_templates():
    print("Testing compare_to_reference_bank with templates...")
    
    names = [
        "nose", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_index_tip", "right_index_tip"
    ]
    
    groups = {
        "body": [0, 1, 2, 3, 4, 5, 6],
        "left_hand": [7],
        "right_hand": [8]
    }
    
    num_frames = 10
    num_joints = len(names)
    
    t0 = np.zeros((num_frames, num_joints, 2), dtype=np.float32)
    t0[:, 0] = [0.0, 0.0]
    t0[:, 1] = [-1.0, 0.0]
    t0[:, 2] = [1.0, 0.0]
    t0[:, 3] = [-1.0, -1.0]
    t0[:, 4] = [1.0, -1.0]
    t0[:, 5] = [-1.0, -2.0]
    t0[:, 6] = [1.0, -2.0]
    t0[:, 7] = [-1.5, -2.5] # left_index_tip
    t0[:, 8] = [1.5, -2.5]  # right_index_tip
    
    t1 = np.zeros((num_frames, num_joints, 2), dtype=np.float32)
    t1[:, 0] = [0.0, 0.0]
    t1[:, 1] = [-1.0, 0.0]
    t1[:, 2] = [1.0, 0.0]
    t1[:, 3] = [-2.0, 0.0]
    t1[:, 4] = [2.0, 0.0]
    t1[:, 5] = [-2.0, 1.0]
    t1[:, 6] = [2.0, 1.0]
    t1[:, 7] = [-2.5, 1.5] # left_index_tip
    t1[:, 8] = [2.5, 1.5]  # right_index_tip
    
    # Normalize templates (each has shoulder width 2.0 and center [0.0, 0.0])
    t0_norm = t0 / 2.0
    t1_norm = t1 / 2.0
    
    template_xy = np.stack([t0_norm, t1_norm], axis=0) # shape (2, 10, 9, 2)
    
    # Compute median and tolerance
    median_xy = np.nanmedian(template_xy, axis=0)
    tolerance = np.maximum(np.nanquantile(np.linalg.norm(template_xy - median_xy[None, ...], axis=-1), 0.85, axis=0) + 0.06, 0.14)
    
    # Construct ReferenceBank (it will precompute angular_tolerance)
    from signova_practice_i.pose_utils import _compute_angular_tolerance
    angular_tolerance = _compute_angular_tolerance(template_xy, names)
    
    bank = ReferenceBank(
        gloss="test_gloss",
        median_xy=median_xy,
        tolerance=tolerance,
        names=names,
        groups=groups,
        reference_ids=["t0", "t1"],
        template_xy=template_xy,
        angular_tolerance=angular_tolerance
    )
    
    # 1. Test perfect match with t0
    user_xy = t0.copy()
    user_conf = np.ones((num_frames, num_joints), dtype=np.float32)
    user_seq = PoseSequence(xy=user_xy, confidence=user_conf, names=names, groups=groups)
    
    result = compare_to_reference_bank(user_seq, bank)
    print("Result Score:", result["score"])
    assert result["score"] == 100, f"Expected perfect score, got {result['score']}"
    assert result["matched_template_index"] == 0, f"Expected template 0 to match, got {result['matched_template_index']}"
    assert result["matched_reference_id"] == "t0"
    assert result["low_tracking_quality"] is False
    
    # 2. Test perfect match with t1
    user_seq_t1 = PoseSequence(xy=t1.copy(), confidence=user_conf, names=names, groups=groups)
    result_t1 = compare_to_reference_bank(user_seq_t1, bank)
    assert result_t1["score"] == 100, f"Expected perfect score for t1, got {result_t1['score']}"
    assert result_t1["matched_template_index"] == 1, f"Expected template 1 to match, got {result_t1['matched_template_index']}"
    
    # 3. Test Missing Component Detection (Left hand missing)
    # If the user has missing hand, it should raise low_tracking_quality and apply mild penalty
    user_xy_missing_hand = t0.copy()
    user_xy_missing_hand[:, 7] = np.nan # left_index_tip is missing
    user_conf_missing_hand = user_conf.copy()
    user_conf_missing_hand[:, 7] = 0.0
    user_seq_missing_hand = PoseSequence(xy=user_xy_missing_hand, confidence=user_conf_missing_hand, names=names, groups=groups)
    
    result_missing = compare_to_reference_bank(user_seq_missing_hand, bank)
    print("Missing hand score:", result_missing["score"])
    print("Missing hand low_tracking_quality:", result_missing["low_tracking_quality"])
    
    assert result_missing["low_tracking_quality"] is True
    # The score should have a mild penalty, so it should be slightly less than 100
    assert result_missing["score"] < 100
    assert result_missing["score"] > 80 # but not too low (mild penalty)
    
    # 4. Verify Finger Tip Weighting Reduction
    # If we offset left_index_tip (a tip joint, index 7) by some distance versus nose (index 0)
    # because left_index_tip is a tip, it has weight 0.5.
    # Nose has no tip, weight 1.0.
    # If we modify left_index_tip to be bad, the penalty should be smaller than if we modify nose by same ratio.
    user_xy_bad_tip = t0.copy()
    user_xy_bad_tip[:, 7] = t0[:, 7] + 5.0 # very bad tip
    seq_bad_tip = PoseSequence(xy=user_xy_bad_tip, confidence=user_conf, names=names, groups=groups)
    result_bad_tip = compare_to_reference_bank(seq_bad_tip, bank)
    
    user_xy_bad_nose = t0.copy()
    user_xy_bad_nose[:, 0] = t0[:, 0] + 5.0 # very bad nose
    seq_bad_nose = PoseSequence(xy=user_xy_bad_nose, confidence=user_conf, names=names, groups=groups)
    result_bad_nose = compare_to_reference_bank(seq_bad_nose, bank)
    
    # Since tip has weight 0.5 and nose has weight 1.0, bad tip should have higher score (less penalty) than bad nose
    print("Bad tip score:", result_bad_tip["score"])
    print("Bad nose score:", result_bad_nose["score"])
    assert result_bad_tip["score"] > result_bad_nose["score"], "Finger tip should have lower weight/penalty than body nose"

    # 5. Test decision_for_target checks low_tracking_quality from result
    from signova_practice_i.scoring import decision_for_target
    decision = decision_for_target(result_missing, target_rank=1)
    assert decision["low_tracking_quality"] is True
    assert decision["accept_as_target"] is False # should reject due to low tracking quality

    # 6. Practice II must not surface a wrong gloss outside the lesson choices
    from signova_practice_i.scoring import decision_for_practice_ii
    practice2_decision = decision_for_practice_ii(
        target_gloss="Giúp đỡ",
        lesson_glosses=["Giúp đỡ", "Làm bài tập", "Dụng cụ học tập"],
        target_result={"score": 72.0, "valid_fraction": 0.95, "low_tracking_quality": False},
        target_rank=2,
        bank_top1_gloss="Làm bài tập",
        classifier_predictions=[
            {"gloss": "Áo sơ mi", "raw_score": 0.82, "lesson_score": 0.0},
            {"gloss": "Giúp đỡ", "raw_score": 0.05, "lesson_score": 0.40},
        ],
        top1_score=96.0,
    )
    assert practice2_decision["predicted_wrong_gloss"] is None
    assert practice2_decision["predicted_wrong_source"] is None
    assert practice2_decision["possible_wrong_word"] is True

    print("All scoring engine unit tests passed!")

if __name__ == "__main__":
    test_scoring_with_templates()
