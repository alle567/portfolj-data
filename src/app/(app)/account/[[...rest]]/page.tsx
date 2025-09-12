// src/app/(app)/account/page.tsx
"use client";

import { UserProfile } from "@clerk/nextjs";
import styles from "./account.module.css";

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 min-w-0">
      <div className={`${styles.wrap} py-4 sm:py-6 min-w-0`}>
        <UserProfile
          routing="path"
          path="/account"
          appearance={{
            elements: {
              // hide Clerk’s internal nav/sidebar
              navbar: "hidden",
              navbarContainer: "hidden",
              navbarContent: "hidden",
              navbarItem: "hidden",
              navbarMobileMenuButton: "hidden",
              navbarMobileMenu: "hidden",

              // layout/centering
              rootBox: "w-full",
              card: "mx-auto w-full max-w-[720px]",
              content: "p-0",
              page: "p-0",

              // keep header text centered
              headerTitle: "text-center",
              headerSubtitle: "text-center",

              // Mobile: internal scroll; Desktop: let page scroll
              pageScrollBox: [
                styles.accountScrollbox, // height calc (module)
                "overflow-y-auto pb-24 sm:pb-28",
                "md:h-auto md:max-h-none md:overflow-visible md:pb-0",
              ].join(" "),
            },
          }}
        />
      </div>
    </div>
  );
}
