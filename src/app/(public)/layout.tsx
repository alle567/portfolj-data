import NavMenu from "@/components/Navigation/Navbar";
import Footer from "@/components/Navigation/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavMenu />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
