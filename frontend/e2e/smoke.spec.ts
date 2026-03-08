import { expect, test } from "@playwright/test"

test("home page renders", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "TaskFlow eCommerce" })).toBeVisible()
})

test("deep link fallback works", async ({ page }) => {
  await page.goto("/this-route-does-not-exist")
  await expect(page.getByText("404 Not found")).toBeVisible()
})
