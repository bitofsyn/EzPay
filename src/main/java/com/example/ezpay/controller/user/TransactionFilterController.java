package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.TransactionFilter;
import com.example.ezpay.request.TransactionFilterRequest;
import com.example.ezpay.response.CommonResponse;
import com.example.ezpay.response.TransactionFilterResponse;
import com.example.ezpay.service.user.TransactionFilterService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/filter")
@RequiredArgsConstructor
public class TransactionFilterController {

    private final TransactionFilterService transactionFilterService;


    // 필터 저장
    @PostMapping
    public ResponseEntity<CommonResponse<TransactionFilter>> saveFilter(@RequestBody TransactionFilterRequest transactionFilterRequest) {
        try {
            TransactionFilter filter = transactionFilterService.saveFilter(transactionFilterRequest);
            return ResponseEntity.ok(new CommonResponse<>("success", filter, "필터 저장 성공 "));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new CommonResponse<>("error", null, e.getMessage()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new CommonResponse<>("error", null, e.getMessage()));
        }
    }

    // 사용자별 필터 조회
    @GetMapping("/{userId}")
    public ResponseEntity<CommonResponse<List<TransactionFilter>>> readFilterByUser(@PathVariable Long userId) {
        try {
            List<TransactionFilter> filters = transactionFilterService.readFilterByUser(userId);
            return ResponseEntity.ok(new CommonResponse<>("success", filters, "Filters 조회 성공"));
        }catch (Exception e) {
            return ResponseEntity.badRequest().body(new CommonResponse<>("false", null, e.getMessage()));
        }
    }

    // 특정 필터 조회
    @GetMapping("/detail/{id}")
    public ResponseEntity<CommonResponse<TransactionFilter>> getFilterById(@PathVariable Long id) {
        try {
            TransactionFilter filter = transactionFilterService.getFilterById(id);
            return ResponseEntity.ok(new CommonResponse<>("success", filter, "필터 조회 성공"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(new CommonResponse<>("error", null, "필터를 찾을 수 없습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new CommonResponse<>("error", null, e.getMessage()));
        }
    }


    // 필터 조건 검색(날짜 범위, 금액 범위로 검색)
    @PostMapping("/search")
    public ResponseEntity<CommonResponse<List<TransactionFilter>>> searchFilter(@RequestBody TransactionFilterRequest transactionFilterRequest) {
        try{
            List<TransactionFilter> filters = transactionFilterService.searchFilter(transactionFilterRequest);
            return ResponseEntity.ok(new CommonResponse<>("success", filters, "필터 검색 성공"));
        }catch (Exception e) {
            return ResponseEntity.internalServerError().body(new CommonResponse<>("error", null, e.getMessage()));
        }
    }

    // 필터 수정
    @PutMapping("/{id}")
    public ResponseEntity<CommonResponse<TransactionFilterResponse>> updateFilter(
            @PathVariable Long id,
            @RequestBody TransactionFilterRequest transactionFilterRequest) {
        try {
            TransactionFilterResponse response = transactionFilterService.updateFilter(id, transactionFilterRequest);
            return ResponseEntity.ok(new CommonResponse<>("success", response, "필터 수정 성공"));  // ✅ DTO 그대로 반환
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(new CommonResponse<>("error", null, "필터를 찾을 수 없습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new CommonResponse<>("error", null, "서버 오류 발생"));
        }
    }





    // 필터 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<CommonResponse<Void>> deleteFilter(@PathVariable Long id) {
        try {
            transactionFilterService.deleteFilter(id);
            return ResponseEntity.ok(new CommonResponse<>("success", null, "filter 삭제 성공"));
        }catch (Exception e) {
            return ResponseEntity.badRequest().body(new CommonResponse<>("false", null, e.getMessage()));
        }
    }
}
