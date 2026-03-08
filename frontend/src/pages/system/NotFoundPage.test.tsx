import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import NotFoundPage from "@/pages/system/NotFoundPage"

describe("NotFoundPage", () => {
  it("renders 404 content", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByText("404 Not found")).toBeInTheDocument()
  })
})
