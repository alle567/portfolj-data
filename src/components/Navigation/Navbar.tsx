"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, LogIn, Menu, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

function MobileMenu({
  products,
  topLinks,
  pathname,
}: {
  products: { title: string; href: string; description?: string }[];
  topLinks: { href: string; label: string }[];
  pathname: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Clean hamburger → X toggle */}
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background/70 ring-1 ring-border/60 backdrop-blur transition
                     hover:bg-muted active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
          <span className="sr-only">Toggle menu</span>
        </button>
      </SheetTrigger>

      {/* Full-width on phones, constrained on sm+ */}
      <SheetContent
        side="left"
        className="w-screen max-w-none p-0 sm:w-[85vw] sm:max-w-sm"
      >
        <SheetHeader className="px-4 pb-2 pt-4">
          <SheetTitle className="text-base">Menu</SheetTitle>
        </SheetHeader>
        <Separator />

        <ScrollArea className="h-[calc(100vh-5rem)] px-2">
          {/* Products */}
          <div className="px-2">
            <Accordion type="single" collapsible defaultValue="products">
              <AccordionItem value="products" className="border-none">
                <AccordionTrigger className="px-2 text-sm">
                  Products
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1">
                    {products.map((p) => (
                      <li key={p.href}>
                        <SheetClose asChild>
                          <Link
                            href={p.href}
                            className={
                              "flex items-center justify-between rounded-xl px-3 py-3 text-base hover:bg-accent hover:text-accent-foreground " +
                              (pathname === p.href
                                ? " bg-accent text-accent-foreground"
                                : "")
                            }
                          >
                            <span>{p.title}</span>
                            <ChevronRight className="h-4 w-4 opacity-60" />
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Links */}
          <div className="mt-3 px-4">
            <p className="px-1 text-xs font-medium text-muted-foreground">
              Links
            </p>
            <ul className="mt-2 space-y-1.5">
              {topLinks.map((l) => (
                <li key={l.href}>
                  <SheetClose asChild>
                    <Link
                      href={l.href}
                      className={
                        "block rounded-xl px-3 py-3 text-base hover:bg-accent hover:text-accent-foreground " +
                        (pathname === l.href
                          ? " bg-accent text-accent-foreground"
                          : "")
                      }
                    >
                      {l.label}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="px-4">
            <div className="mt-6 grid grid-cols-2 gap-3">
              <SheetClose asChild>
                <Button
                  asChild
                  variant="ghost"
                  className="h-11 rounded-full text-base"
                >
                  <Link href="/login" aria-label="Sign in">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in
                  </Link>
                </Button>
              </SheetClose>

              <SheetClose asChild>
                <Button asChild className="h-11 rounded-full text-base">
                  <Link href="/signup" aria-label="Sign up">
                    Sign up
                  </Link>
                </Button>
              </SheetClose>
            </div>

            <p className="mt-4 pb-4 text-center text-xs text-muted-foreground">
              v1.0 • © YourBrand
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default function NavMenu() {
  const pathname = usePathname();

  const products = [
    {
      title: "Terminal",
      href: "/terminal",
      description: "The modern all-in-one company research platform,",
    },
    { title: "APIs", href: "/apis", description: "Coming soon." },
  ];

  const topLinks = [
    { href: "/changelog", label: "Changelog" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <header className="sticky top-3 z-50">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex h-12 items-center gap-2 rounded-full border bg-background/70 px-2.5 shadow-sm ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:h-14 md:px-3">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center rounded-full px-2 text-sm font-semibold tracking-tight md:px-3 md:text-base"
          >
            YourBrand
          </Link>

          {/* Desktop nav */}
          <nav className="ml-1 hidden flex-1 md:flex">
            <NavigationMenu>
              <NavigationMenuList className="items-center gap-1">
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-9 rounded-full px-3 text-sm data-[state=open]:bg-muted">
                    Products
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[540px] gap-2 p-4 sm:w-[600px] sm:grid-cols-2">
                      {products.map((item) => (
                        <li key={item.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={item.href}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <div className="text-sm font-medium leading-none">
                                {item.title}
                              </div>
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {topLinks.map((l) => (
                  <NavigationMenuItem key={l.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={l.href}
                        className={
                          navigationMenuTriggerStyle() +
                          " h-9 !rounded-full px-3 text-sm " +
                          (pathname === l.href
                            ? " bg-accent text-accent-foreground"
                            : " hover:bg-muted")
                        }
                      >
                        {l.label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>

              <NavigationMenuIndicator />
              <NavigationMenuViewport className="rounded-2xl shadow-lg" />
            </NavigationMenu>
          </nav>

          {/* Right-side CTAs */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Separator
              orientation="vertical"
              className="mx-1 hidden h-6 md:block"
            />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-9 rounded-full px-4"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-9 rounded-full px-4 shadow-sm"
            >
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <div className="ml-auto md:hidden">
            <MobileMenu
              products={products}
              topLinks={topLinks}
              pathname={pathname}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
