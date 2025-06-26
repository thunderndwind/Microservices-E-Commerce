package com.ecommerce.service;

import com.ecommerce.dto.PaymentRequest;
import com.ecommerce.dto.PaymentResponse;
import com.ecommerce.model.Payment;
import com.ecommerce.model.Payment.PaymentStatus;
import com.ecommerce.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Process a payment request
     */
    public PaymentResponse processPayment(PaymentRequest request) {
        try {
            // Validate payment request
            if (!isValidPaymentRequest(request)) {
                return PaymentResponse.failure("Invalid payment request");
            }

            // Create payment entity
            Payment payment = new Payment(
                    request.getUserId(),
                    request.getAmount(),
                    request.getCurrency(),
                    request.getPaymentMethod(),
                    request.getOrderId());

            // Generate transaction ID
            String transactionId = generateTransactionId();
            payment.setTransactionId(transactionId);

            // Store payment details (masked for security)
            if (request.getDetails() != null) {
                String maskedDetails = maskPaymentDetails(request.getDetails());
                payment.setPaymentDetails(maskedDetails);
            }

            // Simulate payment processing
            boolean paymentSuccessful = simulatePaymentProcessing(request);

            if (paymentSuccessful) {
                payment.setStatus(PaymentStatus.SUCCESS);
                Payment savedPayment = paymentRepository.save(payment);
                return PaymentResponse.success("Payment processed successfully", savedPayment);
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason("Payment processing failed");
                Payment savedPayment = paymentRepository.save(payment);
                return PaymentResponse.failure("Payment processing failed");
            }

        } catch (Exception e) {
            return PaymentResponse.failure("Payment processing error: " + e.getMessage());
        }
    }

    /**
     * Validate payment by ID
     */
    public PaymentResponse validatePayment(String paymentId) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findById(Long.parseLong(paymentId));

            if (paymentOpt.isEmpty()) {
                return PaymentResponse.failure("Payment not found");
            }

            Payment payment = paymentOpt.get();
            boolean isValid = payment.getStatus() == PaymentStatus.SUCCESS;

            String message = isValid ? "Payment is valid" : "Payment is not valid";
            return new PaymentResponse(isValid, message, payment);

        } catch (NumberFormatException e) {
            return PaymentResponse.failure("Invalid payment ID format");
        } catch (Exception e) {
            return PaymentResponse.failure("Validation error: " + e.getMessage());
        }
    }

    /**
     * Get payment status by ID
     */
    public PaymentResponse getPaymentStatus(String paymentId) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findById(Long.parseLong(paymentId));

            if (paymentOpt.isEmpty()) {
                return PaymentResponse.failure("Payment not found");
            }

            Payment payment = paymentOpt.get();
            return PaymentResponse.success("Payment found", payment);

        } catch (NumberFormatException e) {
            return PaymentResponse.failure("Invalid payment ID format");
        } catch (Exception e) {
            return PaymentResponse.failure("Error retrieving payment: " + e.getMessage());
        }
    }

    /**
     * Get payment history for a user
     */
    public List<Payment> getPaymentHistory(String userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get payment by transaction ID
     */
    public Optional<Payment> getPaymentByTransactionId(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId);
    }

    /**
     * Refund a payment
     */
    public PaymentResponse refundPayment(String paymentId) {
        try {
            Optional<Payment> paymentOpt = paymentRepository.findById(Long.parseLong(paymentId));

            if (paymentOpt.isEmpty()) {
                return PaymentResponse.failure("Payment not found");
            }

            Payment payment = paymentOpt.get();

            if (payment.getStatus() != PaymentStatus.SUCCESS) {
                return PaymentResponse.failure("Only successful payments can be refunded");
            }

            // Simulate refund processing
            payment.setStatus(PaymentStatus.REFUNDED);
            Payment savedPayment = paymentRepository.save(payment);

            return PaymentResponse.success("Payment refunded successfully", savedPayment);

        } catch (NumberFormatException e) {
            return PaymentResponse.failure("Invalid payment ID format");
        } catch (Exception e) {
            return PaymentResponse.failure("Refund error: " + e.getMessage());
        }
    }

    // Private helper methods

    private boolean isValidPaymentRequest(PaymentRequest request) {
        return request != null &&
                request.getUserId() != null && !request.getUserId().trim().isEmpty() &&
                request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) > 0 &&
                request.getCurrency() != null && !request.getCurrency().trim().isEmpty() &&
                request.getPaymentMethod() != null && !request.getPaymentMethod().trim().isEmpty();
    }

    private String generateTransactionId() {
        return "TXN_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private String maskPaymentDetails(PaymentRequest.PaymentDetails details) {
        // Mask sensitive information for storage
        StringBuilder masked = new StringBuilder();
        if (details.getCardNumber() != null && details.getCardNumber().length() > 4) {
            String cardNumber = details.getCardNumber();
            masked.append("Card: ****").append(cardNumber.substring(cardNumber.length() - 4));
        }
        if (details.getCardHolder() != null) {
            masked.append(", Holder: ").append(details.getCardHolder());
        }
        return masked.toString();
    }

    private boolean simulatePaymentProcessing(PaymentRequest request) {
        // Simulate payment processing logic
        // In a real system, this would integrate with payment gateways

        // For demo purposes, simulate different outcomes based on amount
        BigDecimal amount = request.getAmount();

        // Fail payments over $10,000 (simulate high-value transaction restrictions)
        if (amount.compareTo(new BigDecimal("10000")) > 0) {
            return false;
        }

        // Fail payments with specific test card numbers
        if (request.getDetails() != null &&
                request.getDetails().getCardNumber() != null &&
                request.getDetails().getCardNumber().endsWith("0000")) {
            return false;
        }

        // 95% success rate for other payments
        return Math.random() < 0.95;
    }
}