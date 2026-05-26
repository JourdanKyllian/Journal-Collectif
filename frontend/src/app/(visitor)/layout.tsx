import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AlertBanner from "@/components/layout/AlertBanner";

export default function VisitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="pt-17.5 flex-1 flex flex-col">
        <AlertBanner />
        {children}
      </main>
      <Footer />
    </div>
  );
}