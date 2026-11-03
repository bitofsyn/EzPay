import { expect, test } from "@playwright/test";

test("로그인 후 계좌를 확인하고 송금을 요청한다", async ({ page }) => {
  let transferRequest: Record<string, unknown> | null = null;

  await page.route("http://localhost:8081/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/users/login" && request.method() === "POST") {
      await route.fulfill({
        json: {
          status: "success",
          data: { userId: 1, email: "user@ezpay.test", name: "테스트 사용자", role: "USER", token: "e2e-token" },
          message: "로그인 성공",
        },
      });
      return;
    }
    if (path === "/users/me") {
      await route.fulfill({
        json: { status: "success", data: { userId: 1, email: "user@ezpay.test", name: "테스트 사용자", role: "USER" } },
      });
      return;
    }
    if (path === "/account/me") {
      await route.fulfill({
        json: {
          status: "success",
          data: [{ accountId: 1, accountNumber: "111122223333", bankName: "EzPay", balance: 500000, main: true }],
        },
      });
      return;
    }
    if (path === "/account/1234567890") {
      await route.fulfill({ json: { status: "success", data: { accountId: 2, ownerName: "김민수" } } });
      return;
    }
    if (path === "/transaction/transfer" && request.method() === "POST") {
      transferRequest = request.postDataJSON();
      await route.fulfill({ json: { status: "success", data: "request-e2e", message: "TRANSFER_ACCEPTED" } });
      return;
    }
    if (path.startsWith("/dashboard") || path.startsWith("/transaction/account/")) {
      await route.fulfill({ json: { status: "success", data: [] } });
      return;
    }
    await route.fulfill({ json: { status: "success", data: [] } });
  });

  await page.goto("/login");
  await page.getByPlaceholder("이메일 주소 입력").fill("user@ezpay.test");
  await page.getByPlaceholder("비밀번호 입력").fill("password123!");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/send");
  await expect(page.getByRole("heading", { name: "송금하기", exact: true })).toBeVisible();
  await page.getByLabel("계좌번호").fill("1234567890");
  await expect(page.getByLabel("받는 사람 이름")).toHaveValue("김민수");
  await page.getByPlaceholder("0").fill("10000");
  await page.getByLabel("메모 (선택)").fill("점심값 정산");
  await page.getByRole("button", { name: "다음 · 송금 내용 확인" }).click();

  await expect(page.getByRole("heading", { name: "송금 확인" })).toBeVisible();
  await expect(page.getByText("₩10,000")).toBeVisible();
  await page.getByRole("button", { name: "확인 송금" }).click();

  await expect(page).toHaveURL(/\/account\/1$/);
  expect(transferRequest).toMatchObject({
    fromAccountId: 1,
    toAccountId: 2,
    amount: 10000,
    memo: "점심값 정산",
  });
});
