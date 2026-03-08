import { describe, expect, it } from "vitest"

import { money } from "@/lib/utils"

describe("money()", () => {
  it("formats number to USD", () => {
    expect(money(12.5)).toBe("$12.50")
  })
})
