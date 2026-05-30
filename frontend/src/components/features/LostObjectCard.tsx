import { LucideIcon, MapPin, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ObjectStatus = "perdu" | "trouve" | "reclame";

interface LostObjectCardProps {
  reference: string;
  title: string;
  location: string;
  date: string;
  status: ObjectStatus;
  icon: LucideIcon;
  onClickAction?: () => void;
}

export default function LostObjectCard({
  reference, title, location, date, status, icon: Icon, onClickAction
}: LostObjectCardProps) {
  
  // Configuration conditionnelle selon le statut
  const isReclame = status === "reclame";
  const statusConfig = {
    perdu: { badgeBg: "bg-yellow-100", badgeText: "text-yellow-800", label: "Perdu", btnText: "Contacter", btnClass: "bg-noir text-blanc hover:bg-vert" },
    trouve: { badgeBg: "bg-green-100", badgeText: "text-green-800", label: "Trouvé", btnText: "Réclamer", btnClass: "bg-noir text-blanc hover:bg-vert" },
    reclame: { badgeBg: "bg-champagne/40", badgeText: "text-vert", label: "Réclamé", btnText: "Réclamé ✓", btnClass: "bg-champagne/30 text-vert cursor-not-allowed hover:bg-champagne/30" }
  };

  const config = statusConfig[status];

  return (
    <div className={`bg-blanc border border-champagne/30 rounded-2xl overflow-hidden transition-all ${isReclame ? 'opacity-60' : 'hover:-translate-y-1 hover:shadow-xl'}`}>
      
      {/* En-tête de la carte avec l'icône */}
      <div className="h-40 bg-champagne/15 flex items-center justify-center relative border-b border-champagne/20">
        <Icon size={48} className="text-champagne/70" />
        <span className={`absolute top-3 right-3 font-poppins font-black text-xs px-3 py-1 rounded-full shadow-sm ${config.badgeBg} ${config.badgeText}`}>
          {config.label}
        </span>
      </div>

      {/* Corps de la carte */}
      <div className="p-5">
        <h3 className="font-montserrat font-bold text-sm text-noir mb-2">{title}</h3>
        
        <div className="font-montserrat text-xs text-champagne leading-relaxed mb-3 space-y-1">
          <div className="flex items-center gap-1.5"><MapPin size={14} /> {location}</div>
          <div className="flex items-center gap-1.5"><CalendarDays size={14} /> {date}</div>
        </div>
        
        <div className="flex justify-between items-center border-t border-champagne/20 pt-3">
          <span className="font-montserrat text-xs text-champagne font-semibold">{reference}</span>
          <Button 
            onClick={onClickAction}
            disabled={isReclame}
            size="sm"
            className={`font-montserrat font-bold text-xs px-4 py-2 rounded-lg transition-all ${config.btnClass}`}
          >
            {config.btnText}
          </Button>
        </div>
      </div>
    </div>
  );
}