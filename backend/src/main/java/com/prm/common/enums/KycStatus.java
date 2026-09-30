package com.prm.common.enums;

/** Trạng thái của KycProfile. */
public enum KycStatus {
    DRAFT,
    PENDING,
    APPROVED,
    REJECTED;

    public static KycStatus fromString(String value) {
        if (value == null) return null;
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
