package com.ecommerce.dto;

import com.ecommerce.model.Payment;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private boolean success;
    private String message;
    private String paymentId;
    private String transactionId;
    private String status;
    private String userId;
    private BigDecimal amount;
    private String currency;
    private String paymentMethod;
    private String orderId;
    private LocalDateTime createdAt;

    // Constructors
    public PaymentResponse() {
    }

    public PaymentResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public PaymentResponse(boolean success, String message, Payment payment) {
        this.success = success;
        this.message = message;
        if (payment != null) {
            this.paymentId = payment.getId().toString();
            this.transactionId = payment.getTransactionId();
            this.status = payment.getStatus().name();
            this.userId = payment.getUserId();
            this.amount = payment.getAmount();
            this.currency = payment.getCurrency();
            this.paymentMethod = payment.getPaymentMethod();
            this.orderId = payment.getOrderId();
            this.createdAt = payment.getCreatedAt();
        }
    }

    // Static factory methods
    public static PaymentResponse success(String message, Payment payment) {
        return new PaymentResponse(true, message, payment);
    }

    public static PaymentResponse failure(String message) {
        return new PaymentResponse(false, message);
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}