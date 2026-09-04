"use client"

import type { LucideIcon } from "lucide-react"
import {
  Import,
  LayoutDashboard,
  LogOut,
  Package,
  Waypoints,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { logout } from "@/app/login/actions"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

type NavigationItem = Readonly<{
  href: string
  icon: LucideIcon
  label: string
}>

const navigation: readonly NavigationItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/products", icon: Package, label: "Products" },
  { href: "/import", icon: Import, label: "Import Product" },
]

function isNavigationItemActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`)
}

function reviewerInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export function AppSidebar({ reviewerEmail }: { reviewerEmail: string }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-3">
        <Link
          aria-label="CatalogBridge home"
          className="flex min-h-10 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          href="/"
          onClick={() => setOpenMobile(false)}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
            <Waypoints aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-semibold">
              CatalogBridge
            </span>
            <span className="block truncate text-[0.68rem] tracking-wide text-muted-foreground uppercase">
              Commerce operations
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Primary navigation">
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const active = isNavigationItemActive(pathname, item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        render={
                          <Link
                            aria-current={active ? "page" : undefined}
                            href={item.href}
                            onClick={() => setOpenMobile(false)}
                          />
                        }
                        size="lg"
                        tooltip={item.label}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3 px-1 py-1 group-data-[collapsible=icon]:hidden">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold"
          >
            {reviewerInitials(reviewerEmail)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium">
              {reviewerEmail}
            </span>
            <span className="block text-xs text-muted-foreground">Reviewer</span>
          </span>
        </div>
        <form action={logout}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<button type="submit" />}
                tooltip="Sign out"
              >
                <LogOut aria-hidden="true" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
