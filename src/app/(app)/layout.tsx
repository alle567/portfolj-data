// src/app/(app)/layout.tsx
import AppSidebar from "@/components/Navigation/AppSidebar";
import AppTopbar from "@/components/Navigation/AppTopbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh w-full">
      <div className="grid md:grid-cols-[16rem_1fr] h-full">
        <AppSidebar />
        <div className="flex min-w-0 min-h-0 flex-col">
          <AppTopbar /> {/* h-14 → 56px */}
          {/* ⬇️ main must be allowed to shrink and hide horizontal overflow */}
          <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
