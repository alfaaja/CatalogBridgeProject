import { load } from "cheerio"
import { cloneElement, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { pathnameMock, setOpenMobileMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(),
  setOpenMobileMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({ usePathname: pathnameMock }))
vi.mock("@/app/login/actions", () => ({ logout: vi.fn() }))
vi.mock("@/components/ui/sidebar", () => {
  const Wrapper = ({ children }: { children?: ReactNode }) => <div>{children}</div>

  return {
    Sidebar: Wrapper,
    SidebarContent: Wrapper,
    SidebarFooter: Wrapper,
    SidebarGroup: Wrapper,
    SidebarGroupContent: Wrapper,
    SidebarGroupLabel: Wrapper,
    SidebarHeader: Wrapper,
    SidebarMenu: ({ children }: { children?: ReactNode }) => <ul>{children}</ul>,
    SidebarMenuButton: ({
      children,
      isActive,
      render,
    }: {
      children?: ReactNode
      isActive?: boolean
      render: ReactElement<Record<string, unknown>>
    }) => cloneElement(render, { "data-active": String(Boolean(isActive)) }, children),
    SidebarMenuItem: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
    SidebarRail: Wrapper,
    useSidebar: () => ({ setOpenMobile: setOpenMobileMock }),
  }
})

import { AppSidebar } from "./app-sidebar"

describe("AppSidebar", () => {
  beforeEach(() => {
    pathnameMock.mockReset()
    setOpenMobileMock.mockReset()
  })

  it("shows History as the active primary navigation item", () => {
    pathnameMock.mockReturnValue("/history")

    const $ = load(
      renderToStaticMarkup(<AppSidebar reviewerEmail="reviewer@example.com" />)
    )
    const link = $('a[href="/history"]')

    expect(link.text()).toContain("History")
    expect(link.attr("aria-current")).toBe("page")
    expect(link.attr("data-active")).toBe("true")
  })

  it("links the authenticated brand and Dashboard item to /dashboard", () => {
    pathnameMock.mockReturnValue("/dashboard")

    const $ = load(
      renderToStaticMarkup(<AppSidebar reviewerEmail="reviewer@example.com" />)
    )
    const dashboardLinks = $('a[href="/dashboard"]')

    expect(dashboardLinks).toHaveLength(2)
    expect(dashboardLinks.filter('[aria-current="page"]')).toHaveLength(1)
  })
})
