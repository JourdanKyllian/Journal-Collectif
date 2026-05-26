import Link from "next/link";
import { LucideIcon, CalendarDays, BookOpen } from "lucide-react";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  icon: LucideIcon;
  gradientClass: string;
  href?: string;
}

export default function ArticleCard({ 
  title, excerpt, category, date, readTime, icon: Icon, gradientClass, href = "#" 
}: ArticleCardProps) {
  return (
    <Link 
      href={href} 
      className="group block bg-blanc border border-champagne/30 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:border-champagne cursor-pointer"
    >
      <div className={`h-44 flex items-center justify-center relative ${gradientClass}`}>
        <Icon size={48} className="text-blanc opacity-90 group-hover:scale-110 transition-transform duration-300" />
        <span className="absolute bottom-3 left-3 bg-or text-noir font-poppins font-black text-xs px-3 py-1 rounded-full shadow-sm">
          {category}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-montserrat font-bold text-base text-noir mb-2 leading-snug line-clamp-2 group-hover:text-vert transition-colors">
          {title}
        </h3>
        <p className="font-montserrat text-sm text-champagne leading-relaxed mb-4 line-clamp-2">
          {excerpt}
        </p>
        <div className="flex justify-between items-center text-xs text-champagne font-montserrat">
          <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {date}</span>
          <span className="flex items-center gap-1.5"><BookOpen size={14} /> {readTime}</span>
        </div>
      </div>
    </Link>
  );
}