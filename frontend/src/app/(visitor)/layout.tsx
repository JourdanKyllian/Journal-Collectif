import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AlertBanner from "@/components/layout/AlertBanner";

/**
 * Interface représentant les propriétés du layout visiteur.
 * 
 * @interface VisitorLayoutProps
 * @property {React.ReactNode} children - Les composants enfants à rendre dans la section principale.
 */
interface VisitorLayoutProps {
  children: React.ReactNode;
}

/**
 * Composant de mise en page pour l'espace visiteur.
 * Intègre la barre de navigation, le bandeau d'alerte, le contenu dynamique et le pied de page.
 * 
 * @param {VisitorLayoutProps} props - Les propriétés du composant.
 * @returns {JSX.Element} La mise en page visiteur rendue.
 */
export default function VisitorLayout({ children }: VisitorLayoutProps) {
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