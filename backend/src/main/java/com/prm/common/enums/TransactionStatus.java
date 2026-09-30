package com.prm.common.enums;

/** Trạng thái của các transaction, withdrawal, payment. */
public enum TransactionStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED;

    public static TransactionStatus fromString(String value) {
        if (value == null) return null;
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
