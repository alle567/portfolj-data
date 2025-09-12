// src/components/Navigation/Footer.tsx
"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Mail } from "lucide-react";
import { SiX } from "react-icons/si";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import ThemeSwitch from "../Button_Switches/ThemeSwitch";

export default function Footer() {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    // TODO: call your API / toast
    console.log("subscribe:", email);
  }

  const product = [
    { label: "Terminal", href: "/terminal" },
    { label: "APIs", href: "/apis" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "/changelog" },
  ];

  const company = [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ];

  const resources = [
    { label: "Docs", href: "/docs" },
    { label: "Guides", href: "/guides" },
    { label: "Status", href: "/status" },
    { label: "Support", href: "/support" },
  ];

  const legal = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
    { label: "Licenses", href: "/licenses" },
  ];

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top: brand + link columns + newsletter */}
        <div className="grid gap-10 py-10 md:grid-cols-2 md:py-12 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold"
            >
              <span className="inline-block h-6 w-6 rounded-lg bg-foreground/10" />
              YourBrand
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Tools for research, analytics and automation. Built with care.
            </p>
          </div>

          {/* Columns */}
          <FooterColumn title="Product" items={product} />
          <FooterColumn title="Company" items={company} />
          <FooterColumn title="Resources" items={resources} />
          <FooterColumn title="Legal" items={legal} />

          {/* Newsletter */}
          <div className="lg:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Newsletter
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Get product updates and release notes.
            </p>
            <form className="mt-3 flex gap-2" onSubmit={onSubmit}>
              <Input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="h-9"
                aria-label="Email address"
              />
              <Button type="submit" className="h-9">
                Subscribe
              </Button>
            </form>
            <p className="mt-2 text-[11px] text-muted-foreground">
              We’ll never share your email. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 py-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} YourBrand. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ThemeSwitch />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  Toggle theme
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Socials */}
            <div className="ml-2 flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" aria-label="Email">
                <Link href="mailto:hello@yourbrand.com">
                  <Mail className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="ghost" size="icon" aria-label="GitHub">
                <Link
                  href="https://github.com/yourbrand"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="h-4 w-4" />
                </Link>
              </Button>

              {/* X (formerly Twitter) */}
              <Button asChild variant="ghost" size="icon" aria-label="X">
                <Link
                  href="https://x.com/yourbrand"
                  target="_blank"
                  rel="noreferrer"
                >
                  <SiX className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* — Helpers — */

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <nav aria-label={title}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <Link className="hover:underline" href={item.href}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
