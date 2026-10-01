package com.prm.common.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SearchUtilsTest {

    @Test
    @DisplayName("Chuyển chuỗi tiếng Việt có dấu thành không dấu chính xác")
    void testRemoveAccents() {
        assertEquals("bach dang", SearchUtils.removeAccents("Bạch Đằng"));
        assertEquals("dai viet su ky toan thu", SearchUtils.removeAccents("Đại Việt Sử Ký Toàn Thư"));
        assertEquals("nguyen hue quang trung", SearchUtils.removeAccents("Nguyễn Huệ Quang Trung"));
        assertEquals("", SearchUtils.removeAccents(""));
        assertEquals("", SearchUtils.removeAccents(null));
    }

    @Test
    @DisplayName("Khớp từ khóa không dấu với văn bản có dấu")
    void testMatchesKeywordWithoutAccents() {
        String title = "Trận chiến trên sông Bạch Đằng năm 938";
        
        // Khớp trực tiếp có dấu
        assertTrue(SearchUtils.matchesKeyword(title, "Bạch Đằng"));
        
        // Khớp không dấu
        assertTrue(SearchUtils.matchesKeyword(title, "bach dang"));
        assertTrue(SearchUtils.matchesKeyword(title, "song bach dang"));
        assertTrue(SearchUtils.matchesKeyword(title, "938"));

        // Khớp không phân biệt hoa thường
        assertTrue(SearchUtils.matchesKeyword(title, "BACH DANG"));
        assertTrue(SearchUtils.matchesKeyword(title, "tRaN cHiEn"));

        // Không khớp từ khóa khác
        assertFalse(SearchUtils.matchesKeyword(title, "Chi Lăng"));
        assertFalse(SearchUtils.matchesKeyword(title, "Dien Bien Phu"));
    }

    @Test
    @DisplayName("Từ khóa rỗng hoặc null luôn trả về true")
    void testEmptyOrNullKeyword() {
        assertTrue(SearchUtils.matchesKeyword("Tiêu đề bất kỳ", null));
        assertTrue(SearchUtils.matchesKeyword("Tiêu đề bất kỳ", ""));
        assertTrue(SearchUtils.matchesKeyword("Tiêu đề bất kỳ", "   "));
    }

    @Test
    @DisplayName("Target rỗng hoặc null trả về false khi có từ khóa")
    void testEmptyOrNullTarget() {
        assertFalse(SearchUtils.matchesKeyword(null, "search"));
        assertFalse(SearchUtils.matchesKeyword("", "search"));
    }
}
