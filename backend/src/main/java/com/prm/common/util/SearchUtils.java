package com.prm.common.util;

import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.regex.Pattern;

public final class SearchUtils {

    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private SearchUtils() {}

    /**
     * Chuyển chuỗi tiếng Việt có dấu thành không dấu, viết thường, loại bỏ ký tự đặc biệt thừa.
     */
    public static String removeAccents(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        String nfd = Normalizer.normalize(text, Normalizer.Form.NFD);
        return DIACRITICS_PATTERN.matcher(nfd)
                .replaceAll("")
                .replace('đ', 'd')
                .replace('Đ', 'd')
                .toLowerCase()
                .trim();
    }

    /**
     * Kiểm tra xem chuỗi nguồn (target) có chứa từ khóa (keyword) hay không,
     * hỗ trợ cả so sánh trực tiếp không phân biệt hoa thường và so sánh không dấu tiếng Việt.
     */
    public static boolean matchesKeyword(String target, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        if (!StringUtils.hasText(target)) {
            return false;
        }

        String lowerTarget = target.toLowerCase();
        String lowerKeyword = keyword.trim().toLowerCase();

        if (lowerTarget.contains(lowerKeyword)) {
            return true;
        }

        String unaccentTarget = removeAccents(target);
        String unaccentKeyword = removeAccents(keyword);

        return unaccentTarget.contains(unaccentKeyword);
    }
}
