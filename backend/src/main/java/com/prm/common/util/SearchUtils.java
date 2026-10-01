package com.prm.common.util;

import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.regex.Pattern;

public final class SearchUtils {

    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
    private static final Pattern MULTI_SPACE_PATTERN = Pattern.compile("\\s+");

    private SearchUtils() {}

    /**
     * Cắt bỏ khoảng trắng đầu/cuối và gom nhiều khoảng trắng liên tiếp thành 1 khoảng trắng duy nhất.
     */
    public static String normalizeWhitespace(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        return MULTI_SPACE_PATTERN.matcher(text.trim()).replaceAll(" ");
    }

    /**
     * Chuyển chuỗi tiếng Việt có dấu thành không dấu, viết thường, loại bỏ ký tự đặc biệt thừa.
     */
    public static String removeAccents(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        String normalized = normalizeWhitespace(text);
        String nfd = Normalizer.normalize(normalized, Normalizer.Form.NFD);
        return DIACRITICS_PATTERN.matcher(nfd)
                .replaceAll("")
                .replace('đ', 'd')
                .replace('Đ', 'd')
                .toLowerCase()
                .trim();
    }

    /**
     * Kiểm tra xem chuỗi nguồn (target) có chứa từ khóa (keyword) hay không,
     * tự động trim khoảng trắng, chuẩn hóa khoảng trắng thừa, hỗ trợ cả so sánh trực tiếp
     * không phân biệt hoa thường và so sánh không dấu tiếng Việt.
     */
    public static boolean matchesKeyword(String target, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }

        String cleanKeyword = normalizeWhitespace(keyword).toLowerCase();
        if (cleanKeyword.isEmpty()) {
            return true;
        }

        if (!StringUtils.hasText(target)) {
            return false;
        }

        String cleanTarget = normalizeWhitespace(target).toLowerCase();

        if (cleanTarget.contains(cleanKeyword)) {
            return true;
        }

        String unaccentTarget = removeAccents(cleanTarget);
        String unaccentKeyword = removeAccents(cleanKeyword);

        return unaccentTarget.contains(unaccentKeyword);
    }
}
