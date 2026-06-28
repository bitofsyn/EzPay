import type { AdminTransferLimitInfo, AdminUser, Transaction } from "../types";

export type PreviewErrorLog = {
  logId: number;
  serviceName: string;
  errorMessage: string;
  occurredAt: string;
  status: "RESOLVED" | "UNRESOLVED";
};

export type PreviewUserDetail = {
  userInfo: {
    userId: number;
    name: string;
    email: string;
    phone?: string;
    status: "ACTIVE" | "INACTIVE" | "LOCKED";
    createdAt: string;
  };
  accounts: Array<{
    accountId: number;
    bankName: string;
    accountNumber: string;
    balance: number;
    main: boolean;
    createdAt: string;
  }>;
  transactions: Array<{
    transactionId: number;
    senderAccount?: { accountNumber: string };
    receiverAccount?: { accountNumber: string };
    transactionDate: string;
    description?: string;
    amount: number;
  }>;
};

export const previewAdminUsers: AdminUser[] = [
  {
    userId: 101,
    email: "soyun@example.com",
    name: "소윤",
    phoneNumber: "010-1234-5678",
    status: "ACTIVE",
    createdAt: "2026-06-01T09:00:00",
  },
  {
    userId: 102,
    email: "minsu@example.com",
    name: "김민수",
    phoneNumber: "010-2222-3333",
    status: "LOCKED",
    createdAt: "2026-05-21T15:30:00",
  },
  {
    userId: 103,
    email: "jihyun@example.com",
    name: "이지현",
    phoneNumber: "010-9999-1111",
    status: "INACTIVE",
    createdAt: "2026-04-18T12:10:00",
  },
];

export const previewAdminTransactions: Transaction[] = [
  {
    transactionId: 8001,
    amount: 120000,
    description: "학원비 송금",
    memo: "정기이체",
    category: "교육",
    status: "SUCCESS",
    transactionDate: "2026-06-28T10:20:00",
    senderAccount: { accountId: 1, accountNumber: "11-1234-5678", bankName: "EzBank", balance: 0 },
    receiverAccount: { accountId: 2, accountNumber: "22-2233-4455", bankName: "EzBank", balance: 0 },
  },
  {
    transactionId: 8002,
    amount: 45000,
    description: "점심 정산",
    memo: "친구",
    category: "생활",
    status: "PENDING",
    transactionDate: "2026-06-28T13:45:00",
    senderAccount: { accountId: 3, accountNumber: "33-4444-5555", bankName: "EzBank", balance: 0 },
    receiverAccount: { accountId: 4, accountNumber: "44-5555-6666", bankName: "EzBank", balance: 0 },
  },
  {
    transactionId: 8003,
    amount: 980000,
    description: "전세 보증금 일부",
    memo: "검토 필요",
    category: "주거",
    status: "FAILED",
    transactionDate: "2026-06-27T20:10:00",
    senderAccount: { accountId: 5, accountNumber: "55-6666-7777", bankName: "EzBank", balance: 0 },
    receiverAccount: { accountId: 6, accountNumber: "66-7777-8888", bankName: "EzBank", balance: 0 },
  },
];

export const previewTransferLimits: AdminTransferLimitInfo[] = [
  {
    limitId: 1,
    userId: 101,
    userName: "소윤",
    dailyLimit: 3000000,
    perTransactionLimit: 1000000,
    usedAmount: 820000,
    remainingAmount: 2180000,
  },
  {
    limitId: 2,
    userId: 102,
    userName: "김민수",
    dailyLimit: 5000000,
    perTransactionLimit: 2000000,
    usedAmount: 4300000,
    remainingAmount: 700000,
  },
];

export const previewErrorLogs: PreviewErrorLog[] = [
  {
    logId: 501,
    serviceName: "transfer-service",
    errorMessage: "고액 송금 검증 응답 지연이 발생했습니다.",
    occurredAt: "2026-06-28T14:12:00",
    status: "UNRESOLVED",
  },
  {
    logId: 502,
    serviceName: "notification-service",
    errorMessage: "푸시 알림 큐가 일시적으로 지연되었습니다.",
    occurredAt: "2026-06-28T12:01:00",
    status: "RESOLVED",
  },
];

export const createPreviewUserDetail = (userId: number): PreviewUserDetail => ({
  userInfo: {
    userId,
    name: userId === 102 ? "김민수" : "소윤",
    email: userId === 102 ? "minsu@example.com" : "soyun@example.com",
    phone: userId === 102 ? "010-2222-3333" : "010-1234-5678",
    status: userId === 102 ? "LOCKED" : "ACTIVE",
    createdAt: "2026-06-01T09:00:00",
  },
  accounts: [
    {
      accountId: 1,
      bankName: "EzBank",
      accountNumber: "1112345678",
      balance: 3200000,
      main: true,
      createdAt: "2026-06-02T10:00:00",
    },
    {
      accountId: 2,
      bankName: "EzBank",
      accountNumber: "2212345678",
      balance: 840000,
      main: false,
      createdAt: "2026-06-12T11:30:00",
    },
  ],
  transactions: [
    {
      transactionId: 9001,
      senderAccount: { accountNumber: "1112345678" },
      receiverAccount: { accountNumber: "4433221100" },
      transactionDate: "2026-06-28T14:20:00",
      description: "월세 이체",
      amount: 650000,
    },
    {
      transactionId: 9002,
      senderAccount: { accountNumber: "1112345678" },
      receiverAccount: { accountNumber: "9988776655" },
      transactionDate: "2026-06-27T18:10:00",
      description: "생활비 송금",
      amount: 120000,
    },
  ],
});
