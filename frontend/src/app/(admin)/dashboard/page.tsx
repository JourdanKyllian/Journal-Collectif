import { 
  Newspaper, 
  Clock, 
  Search, 
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const stats = [
    { title: "Articles publiés", value: "382", sub: "+12 ce mois", icon: Newspaper, color: "text-green-600", bg: "bg-green-50" },
    { title: "En attente", value: "7", sub: "À valider", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { title: "Objets déclarés", value: "36", sub: "4 nouveaux", icon: Search, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Alertes actives", value: "2", sub: "En ligne", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="font-poppins font-black text-2xl text-noir mb-1">Dashboard</h1>
        <p className="font-raleway text-champagne text-sm">Bienvenue sur l'interface d'administration</p>
      </div>

      {/* Grille de stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-champagne/20 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-raleway font-bold text-champagne uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-poppins font-black text-noir">{stat.value}</div>
              <p className={`text-xs font-montserrat font-bold mt-1 ${stat.color}`}>
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="grid md:grid-cols-3 gap-6">
        <Button className="h-auto p-6 bg-or hover:bg-or/90 text-noir flex flex-col items-start gap-2 rounded-2xl shadow-lg shadow-or/20 border-0">
          <Newspaper size={24} />
          <div className="text-left">
            <div className="font-bold">Rédiger un article</div>
            <div className="text-xs font-normal opacity-70">Créer et publier du contenu</div>
          </div>
        </Button>

        <Button variant="outline" className="h-auto p-6 bg-blanc border-champagne/30 hover:border-or text-noir flex flex-col items-start gap-2 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <Search size={24} className="text-champagne" />
          <div className="text-left">
            <div className="font-bold">Gérer les objets</div>
            <div className="text-xs font-normal text-champagne">Valider les déclarations</div>
          </div>
        </Button>

        <Button variant="outline" className="h-auto p-6 bg-blanc border-champagne/30 hover:border-red-400 text-noir flex flex-col items-start gap-2 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <AlertTriangle size={24} className="text-red-400" />
          <div className="text-left">
            <div className="font-bold">Publier une alerte</div>
            <div className="text-xs font-normal text-champagne">Urgences et travaux</div>
          </div>
        </Button>
      </div>
    </div>
  );
}