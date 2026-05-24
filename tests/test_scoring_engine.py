import sys
from pathlib import Path
import numpy as np

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from signova_practice_i.pose_utils import PoseSequence, ReferenceBank, compare_to_reference_bank

def test_scoring_with_templates():
    print("Testing compare_to_reference_bank with templates...")
    
    names = [
        "nose", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist"
    ]
    
    groups = {
        "body": [0, 1, 2, 3, 4, 5, 6],
        "left_hand": [],
        "right_hand": []
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
    
    t1 = np.zeros((num_frames, num_joints, 2), dtype=np.float32)
    t1[:, 0] = [0.0, 0.0]
    t1[:, 1] = [-1.0, 0.0]
    t1[:, 2] = [1.0, 0.0]
    t1[:, 3] = [-2.0, 0.0]
    t1[:, 4] = [2.0, 0.0]
    t1[:, 5] = [-2.0, 1.0]
    t1[:, 6] = [2.0, 1.0]
    
    # Normalize templates (each has shoulder width 2.0 and center [0.0, 0.0])
    t0_norm = t0 / 2.0
    t1_norm = t1 / 2.0
    
    template_xy = np.stack([t0_norm, t1_norm], axis=0) # shape (2, 10, 7, 2)
    
    # Compute median and tolerance
    median_xy = np.nanmedian(template_xy, axis=0)
    tolerance = np.maximum(np.nanquantile(np.linalg.norm(template_xy - median_xy[None, ...], axis=-1), 0.85, axis=0) + 0.06, 0.14)
    
    bank = ReferenceBank(
        gloss="test_gloss",
        median_xy=median_xy,
        tolerance=tolerance,
        names=names,
        groups=groups,
        reference_ids=["t0", "t1"],
        template_xy=template_xy
    )
    
    # User sequence is raw t0, will be normalized internally
    user_xy = t0.copy()
    user_conf = np.ones((num_frames, num_joints), dtype=np.float32)
    user_seq = PoseSequence(xy=user_xy, confidence=user_conf, names=names, groups=groups)
    
    result = compare_to_reference_bank(user_seq, bank)
    
    print("Result Score:", result["score"])
    print("Result bad_fraction:", result["bad_fraction"])
    print("Result ratio mean/median per joint:")
    for j_idx, name in enumerate(names):
        print(f"  {name}: ratio={np.nanmedian(result['ratio'][:, j_idx])}, bad={np.nanmean(result['bad_mask'][:, j_idx])}")
    
    # Assertions
    assert result["score"] == 100, f"Expected perfect score, got {result['score']}"
    assert result["matched_template_index"] == 0, f"Expected template 0 to match, got {result['matched_template_index']}"
    assert result["matched_reference_id"] == "t0"
    
    # Test a user sequence matching Template 1 exactly
    user_seq_t1 = PoseSequence(xy=t1.copy(), confidence=user_conf, names=names, groups=groups)
    result_t1 = compare_to_reference_bank(user_seq_t1, bank)
    assert result_t1["score"] == 100, f"Expected perfect score for t1, got {result_t1['score']}"
    assert result_t1["matched_template_index"] == 1, f"Expected template 1 to match, got {result_t1['matched_template_index']}"
    assert result_t1["matched_reference_id"] == "t1"
    
    # Test a user sequence that is slightly off Template 0
    # nose should have 100% coord ratio (no incoming angle segment)
    # let's modify user nose coordinate
    user_xy_off = t0.copy()
    user_xy_off[:, 0] = [0.1, 0.1] # nose off
    user_seq_off = PoseSequence(xy=user_xy_off, confidence=user_conf, names=names, groups=groups)
    
    result_off = compare_to_reference_bank(user_seq_off, bank)
    assert "score" in result_off
    assert result_off["worst_joints"][0]["joint"] is not None
    
    print("All scoring engine unit tests passed!")

if __name__ == "__main__":
    test_scoring_with_templates()
