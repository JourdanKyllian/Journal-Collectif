"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, BookOpen, Share2 } from "lucide-react";
import { useFetchApi } from "@/hooks/useFetchApi";
import { getCategoryUI, formatDateToFrench, calculateReadTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ArticleDetails {
  id: number;
  titre: string;
  contenu: string;
  image_couverture: string | null;
  published_at: string;
  categorie?: { libelle: string };
}

export default function ArticleReadPage() {
  const params = useParams();
  const router = useRouter();
  
  // Requête API pour récupérer l'article spécifique
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

  // Si l'article n'existe pas ou s'il y a une erreur 404/410
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
      navigator.share({
        title: article.titre,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Lien copié dans le presse-papier !");
    }
  };

  return (
    <article className="w-full bg-blanc pb-24">
      {/* HEADER DE L'ARTICLE */}
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

      {/* CONTENU DE L'ARTICLE */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/*
          La classe "prose" de Tailwind Typography formate automatiquement
          tout le HTML généré par Tiptap (les h2, les paragraphes, les images).
        */}
        <div 
          className="prose prose-lg prose-headings:font-poppins prose-headings:font-black prose-headings:text-noir prose-p:font-montserrat prose-p:text-noir/80 prose-a:text-or prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl max-w-none"
          dangerouslySetInnerHTML={{ __html: article.contenu }} 
        />
      </div>
    </article>
  );
}
