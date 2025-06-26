package com.ecommerce.repository;

import com.ecommerce.model.Payment;
import com.ecommerce.model.Payment.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // Find payment by transaction ID
    Optional<Payment> findByTransactionId(String transactionId);

    // Find payments by user ID
    List<Payment> findByUserIdOrderByCreatedAtDesc(String userId);

    // Find payments by order ID
    List<Payment> findByOrderId(String orderId);

    // Find payments by status
    List<Payment> findByStatus(PaymentStatus status);

    // Find payments by user ID and status
    List<Payment> findByUserIdAndStatus(String userId, PaymentStatus status);

    // Custom query to find recent payments for a user
    @Query("SELECT p FROM Payment p WHERE p.userId = :userId ORDER BY p.createdAt DESC")
    List<Payment> findRecentPaymentsByUserId(@Param("userId") String userId);

    // Count payments by status
    long countByStatus(PaymentStatus status);

    // Check if payment exists by transaction ID
    boolean existsByTransactionId(String transactionId);
}