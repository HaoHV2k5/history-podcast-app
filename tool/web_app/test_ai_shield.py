"""
test_ai_shield.py — Kiểm tra phân tầng điểm số và chuyển đổi MarkItDown của AI Shield
"""
import sys
from pathlib import Path

# Thêm đường dẫn web_app và scripts
WEB_APP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(WEB_APP_DIR))

from ai_shield_service import (
    evaluate_tier,
    convert_content_to_markdown,
    rule_based_policy_evaluation,
    verify_content_ai_shield
)


def test_evaluate_tier():
    # 1. Dưới 50% => Báo động đỏ (RED_ALERT)
    tier, label = evaluate_tier(30.0)
    assert tier == "RED_ALERT", f"Expected RED_ALERT, got {tier}"
    assert label == "Báo động đỏ", f"Expected Báo động đỏ, got {label}"

    tier, label = evaluate_tier(49.9)
    assert tier == "RED_ALERT"

    # 2. 50% tới < 80% => Khá (FAIR)
    tier, label = evaluate_tier(50.0)
    assert tier == "FAIR", f"Expected FAIR, got {tier}"
    assert label == "Khá"

    tier, label = evaluate_tier(79.9)
    assert tier == "FAIR"

    # 3. 80% tới 90% => Tốt (GOOD)
    tier, label = evaluate_tier(80.0)
    assert tier == "GOOD", f"Expected GOOD, got {tier}"
    assert label == "Tốt"

    tier, label = evaluate_tier(90.0)
    assert tier == "GOOD"

    # 4. Trên 90% => Xuất sắc (EXCELLENT)
    tier, label = evaluate_tier(90.1)
    assert tier == "EXCELLENT", f"Expected EXCELLENT, got {tier}"
    assert label == "Xuất sắc"

    tier, label = evaluate_tier(99.0)
    assert tier == "EXCELLENT"
    print("✅ test_evaluate_tier: PASSED (All 4 policy tiers verified!)")


def test_markitdown_conversion():
    title = "Trận Chi Lăng Xương Giang 1427"
    script = "Nghĩa quân Lam Sơn dưới sự chỉ huy của Lê Lợi và Nguyễn Trãi đã phục kích và tiêu diệt Liễu Thăng tại ải Chi Lăng."
    storyboard = {
        "scenes": [
            {"narration": "Ải Chi Lăng hiểm trở với địa thế núi đá hiểm yếu", "prompt": "Chi Lang Pass historical battlefield"},
            {"narration": "Liễu Thăng trúng kế tử trận", "prompt": "Lieu Thang general defeated"}
        ]
    }

    md = convert_content_to_markdown(title, script, storyboard)
    assert "# Video: Trận Chi Lăng Xương Giang 1427" in md
    assert "## Lời Thuyết Minh Chính" in md
    assert "Ải Chi Lăng" in md
    assert "Visual Prompt" in md
    print("✅ test_markitdown_conversion: PASSED (MarkItDown structured document generated!)")


def test_rule_based_policy():
    # Trường hợp vi phạm nặng (chứa từ cấm / xuyên tạc)
    res_red = rule_based_policy_evaluation(
        title="Video vi phạm",
        script_text="Kịch bản chứa nội dung xuyên tạc lịch sử và thông tin sai lệch",
        markdown_content="# Test",
        context_chunks=[]
    )
    assert res_red["tier"] == "RED_ALERT"
    assert res_red["score"] < 50.0
    assert len(res_red["violations"]) > 0

    # Trường hợp tốt
    res_good = rule_based_policy_evaluation(
        title="Trận Bạch Đằng",
        script_text="Ngô Quyền cắm cọc gỗ nhọn trên sông Bạch Đằng năm 938 đánh tan quân Nam Hán mở ra kỷ nguyên độc lập lâu dài cho dân tộc.",
        markdown_content="# Test",
        context_chunks=[{"book_title": "Đại Việt Sử Ký", "page": 50, "similarity": 0.5}]
    )
    assert res_good["tier"] in ["GOOD", "EXCELLENT"]
    assert res_good["score"] >= 80.0
    print("✅ test_rule_based_policy: PASSED")


if __name__ == "__main__":
    test_evaluate_tier()
    test_markitdown_conversion()
    test_rule_based_policy()
    print("\n🎉 ALL AI SHIELD TESTS PASSED SUCCESSFULLY!")
