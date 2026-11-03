package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.TransactionFilter;
import com.example.ezpay.modules.payment.internal.service.TransactionFilterService;
import com.example.ezpay.request.TransactionFilterRequest;
import com.example.ezpay.shared.common.dto.CommonResponse;
import com.example.ezpay.response.TransactionFilterResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import com.example.ezpay.shared.security.CurrentUserService;

import java.util.List;

@RestController
@RequestMapping("/filter")
@RequiredArgsConstructor
public class TransactionFilterController {

    private final TransactionFilterService transactionFilterService;
    private final CurrentUserService currentUserService;


    // 필터 저장
    @PostMapping
    public ResponseEntity<CommonResponse<TransactionFilter>> saveFilter(Authentication authentication,
                                                                        @RequestBody TransactionFilterRequest transactionFilterRequest) {
        transactionFilterRequest.setUserId(currentUserService.getUserId(authentication));
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
    public ResponseEntity<CommonResponse<List<TransactionFilter>>> readFilterByUser(Authentication authentication,
                                                                                    @PathVariable Long userId) {
        currentUserService.requireUserId(authentication, userId);
        try {
            List<TransactionFilter> filters = transactionFilterService.readFilterByUser(userId);
            return ResponseEntity.ok(new CommonResponse<>("success", filters, "Filters 조회 성공"));
        }catch (Exception e) {
            return ResponseEntity.badRequest().body(new CommonResponse<>("false", null, e.getMessage()));
        }
    }

    // 특정 필터 조회
    @GetMapping("/detail/{id}")
    public ResponseEntity<CommonResponse<TransactionFilter>> getFilterById(Authentication authentication,
                                                                           @PathVariable Long id) {
        try {
            TransactionFilter filter = transactionFilterService.getFilterById(id);
            requireOwnedFilter(authentication, filter);
            return ResponseEntity.ok(new CommonResponse<>("success", filter, "필터 조회 성공"));
        } catch (AccessDeniedException e) {
            throw e;
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(new CommonResponse<>("error", null, "필터를 찾을 수 없습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new CommonResponse<>("error", null, e.getMessage()));
        }
    }


    // 필터 조건 검색(날짜 범위, 금액 범위로 검색)
    @PostMapping("/search")
    public ResponseEntity<CommonResponse<List<TransactionFilter>>> searchFilter(Authentication authentication,
                                                                                @RequestBody TransactionFilterRequest transactionFilterRequest) {
        transactionFilterRequest.setUserId(currentUserService.getUserId(authentication));
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
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody TransactionFilterRequest transactionFilterRequest) {
        try {
            requireOwnedFilter(authentication, transactionFilterService.getFilterById(id));
            transactionFilterRequest.setUserId(currentUserService.getUserId(authentication));
            TransactionFilterResponse response = transactionFilterService.updateFilter(id, transactionFilterRequest);
            return ResponseEntity.ok(new CommonResponse<>("success", response, "필터 수정 성공"));  // ✅ DTO 그대로 반환
        } catch (AccessDeniedException e) {
            throw e;
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(new CommonResponse<>("error", null, "필터를 찾을 수 없습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new CommonResponse<>("error", null, "서버 오류 발생"));
        }
    }

    // 필터 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<CommonResponse<Void>> deleteFilter(Authentication authentication,
                                                              @PathVariable Long id) {
        try {
            requireOwnedFilter(authentication, transactionFilterService.getFilterById(id));
            transactionFilterService.deleteFilter(id);
            return ResponseEntity.ok(new CommonResponse<>("success", null, "filter 삭제 성공"));
        } catch (AccessDeniedException e) {
            throw e;
        }catch (Exception e) {
            return ResponseEntity.badRequest().body(new CommonResponse<>("false", null, e.getMessage()));
        }
    }

    private void requireOwnedFilter(Authentication authentication, TransactionFilter filter) {
        Long currentUserId = currentUserService.getUserId(authentication);
        if (!filter.getUser().getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("다른 사용자의 거래 필터에 접근할 수 없습니다.");
        }
    }
}
