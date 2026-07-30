"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, BookOpen, Share2, PenTool } from "lucide-react";
import { useFetchApi } from "@/hooks/useFetchApi";
import { getCategoryUI, formatDateToFrench, calculateReadTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ArticleCredit {
  role: string;
  name: string;
}

interface ArticleDetails {
  id: number;
  titre: string;
  contenu: string;
  image_couverture: string | null;
  published_at: string;
  categorie?: { libelle: string };
  credits: ArticleCredit[]; // <- Ajout de notre nouvelle propriété issue du backend
}

export default function ArticleReadPage() {
  const params = useParams();
  const router = useRouter();
  
  const { data: article, isLoading, error } = useFetchApi<ArticleDetails>(`/v1/article/${params.id}`);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 animate-pulse">
        <Skeleton className="h-10 w-32 rounded-full mb-8" />
        <Skeleton className="h-14 w-full md:w-3/4 mb-6" />
        <div className="flex gap-4 mb-12">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-champagne/10 rounded-full flex items-center justify-center mb-6">
          <BookOpen size={32} className="text-champagne" />
        </div>
        <h1 className="font-poppins font-black text-3xl text-noir mb-3">Article introuvable</h1>
        <p className="font-montserrat text-champagne mb-8">Ce contenu a été retiré ou n&apos;a jamais existé.</p>
        <Button onClick={() => router.push('/articles')} className="bg-or text-noir font-montserrat font-bold hover:bg-or/90 rounded-xl">
          <ArrowLeft size={16} className="mr-2" /> Retour aux actualités
        </Button>
      </div>
    );
  }

  const categoryName = article.categorie?.libelle || "Général";
  const uiConfig = getCategoryUI(categoryName);
  const CatIcon = uiConfig.icon;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: article.titre, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Lien copié dans le presse-papier !");
    }
  };

  return (
    <article className="w-full bg-blanc pb-24">
      {/* HEADER */}
      <header className={`${uiConfig.gradient} pt-20 pb-16 px-6 text-blanc`}>
        <div className="max-w-4xl mx-auto">
          <Link href="/articles" className="inline-flex items-center text-blanc/70 hover:text-blanc font-montserrat text-sm mb-10 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Retour
          </Link>
          
          <Badge className="bg-blanc/20 hover:bg-blanc/30 text-blanc border-0 font-poppins font-black px-4 py-1.5 rounded-full mb-6 flex items-center gap-2 w-fit text-sm">
            <CatIcon size={16} /> {categoryName}
          </Badge>

          <h1 className="font-poppins font-black text-3xl md:text-5xl lg:text-6xl leading-tight mb-8">
            {article.titre}
          </h1>

          <div className="flex flex-wrap items-center gap-6 font-montserrat text-sm text-blanc/80 border-t border-blanc/20 pt-6">
            <span className="flex items-center gap-2"><CalendarDays size={16} /> Publié le {formatDateToFrench(article.published_at)}</span>
            <span className="flex items-center gap-2"><BookOpen size={16} /> Lecture : {calculateReadTime(article.contenu)}</span>
            
            <Button onClick={handleShare} variant="ghost" className="ml-auto text-blanc hover:bg-blanc/20 hover:text-blanc rounded-xl px-4">
              <Share2 size={16} className="mr-2" /> Partager
            </Button>
          </div>
        </div>
      </header>

      {/* CONTENU */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div 
          className="prose prose-lg prose-headings:font-poppins prose-headings:font-black prose-headings:text-noir prose-p:font-montserrat prose-p:text-noir/80 prose-a:text-or prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl max-w-none"
          dangerouslySetInnerHTML={{ __html: article.contenu }} 
        />
      </div>

      {/* CRÉDITS DE L'ARTICLE (Traçabilité RGPD) */}
      {article.credits && article.credits.length > 0 && (
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-champagne/5 border border-champagne/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h4 className="font-poppins font-black text-noir flex items-center gap-2 mb-2">
                <PenTool size={18} className="text-or" /> Équipe Éditoriale
              </h4>
              <p className="font-montserrat text-xs text-champagne">
                Cet article a été rédigé et modéré avec soin pour la commune.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 min-w-0 md:min-w-62.5">
              {article.credits.map((credit, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm font-montserrat border-b border-champagne/10 pb-1 last:border-0 last:pb-0">
                  <span className="text-champagne">{credit.role}</span>
                  <strong className="text-noir">{credit.name}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
