import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center px-6 bg-blanc text-center">
      <div className="w-24 h-24 bg-linear-to-br from-vert to-noir rounded-3xl border-4 border-or flex items-center justify-center text-or shadow-xl mb-8">
        <SearchX size={48} />
      </div>
      <h1 className="font-poppins font-black text-4xl text-noir mb-4">
        Page <span className="text-or">Introuvable</span> (404)
      </h1>
      <p className="font-raleway text-champagne text-lg max-w-md mx-auto mb-8">
        Il semblerait que vous vous soyez perdu dans les rues de la commune. Cette page n'existe pas ou a été déplacée.
      </p>
      <Link href="/">
        <Button className="bg-noir text-blanc font-montserrat font-bold px-8 py-6 rounded-xl hover:bg-vert transition-all">
          <ArrowLeft size={18} className="mr-2" /> Retourner à l'accueil
        </Button>
      </Link>
    </div>
  );
}