package com.prm.common.enums;

/** Trạng thái user account và membership plan. */
public enum ActiveStatus {
    ACTIVE,
    INACTIVE;

    public static ActiveStatus fromString(String value) {
        if (value == null) return null;
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
