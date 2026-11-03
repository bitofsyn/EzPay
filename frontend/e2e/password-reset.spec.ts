import { expect, test } from "@playwright/test";

test("비밀번호 재설정 요청 후 이메일 안내를 표시한다", async ({ page }) => {
  await page.route("http://localhost:8081/password-reset/request", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ email: "user@ezpay.test" });
    await route.fulfill({ json: { status: "success", data: null, message: "요청 완료" } });
  });

  await page.goto("/find-password");
  await page.getByLabel("이메일 주소").fill("user@ezpay.test");
  await page.getByRole("button", { name: "재설정 메일 보내기" }).click();

  await expect(page.getByRole("status")).toContainText("재설정 링크를 전송했습니다");
  await expect(page).toHaveURL(/\/find-password$/);
});

test("이메일 링크의 토큰으로 비밀번호를 변경한다", async ({ page }) => {
  let authorization = "";
  await page.route("http://localhost:8081/password-reset/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/password-reset/validate") {
      expect(url.searchParams.get("token")).toBe("email-reset-token");
      await route.fulfill({ json: { status: "success", data: "토큰이 유효합니다." } });
      return;
    }
    authorization = request.headers().authorization ?? "";
    await route.fulfill({ json: { status: "success", data: "비밀번호 재설정 완료" } });
  });

  await page.goto("/reset-password?token=email-reset-token");
  await page.getByLabel("새 비밀번호", { exact: true }).fill("NewPassword1!");
  await page.getByLabel("비밀번호 확인").fill("NewPassword1!");
  await page.getByRole("button", { name: "비밀번호 재설정" }).click();

  await expect(page.getByText("비밀번호가 성공적으로 변경되었습니다.")).toBeVisible();
  expect(authorization).toBe("Bearer email-reset-token");
});
