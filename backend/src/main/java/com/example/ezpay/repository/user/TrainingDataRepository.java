package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.TrainingData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingDataRepository extends JpaRepository<TrainingData, Long> {
}
