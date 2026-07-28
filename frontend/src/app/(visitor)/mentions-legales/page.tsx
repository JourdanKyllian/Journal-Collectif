import { Scale, ShieldCheck, Server, FileText, Cookie, Mail } from "lucide-react";

export const metadata = {
  title: "Mentions Légales & RGPD | Collectif Chalonnais",
  description: "Mentions légales, politique de confidentialité et gestion des données personnelles.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="w-full bg-blanc min-h-screen">
      {/* En-tête */}
      <section className="bg-linear-to-br from-vert to-noir pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="w-16 h-16 bg-or/20 border border-or/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Scale size={32} className="text-or" />
          </div>
          <h1 className="font-poppins font-black text-4xl text-blanc mb-4">
            Mentions Légales &amp; RGPD
          </h1>
          <p className="font-raleway text-blanc/80 text-lg">
            Transparence, respect de la vie privée et protection de vos données.
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        
        {/* 1. Édition du site */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <FileText className="text-vert" size={24} />
            1. Édition du site
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3 bg-champagne/5 p-6 rounded-2xl border border-champagne/20">
            <p><strong>Nom de l&apos;association :</strong> Collectif Chalonnais</p>
            <p><strong>Forme juridique :</strong> Association loi 1901 (à compléter/modifier avec le SIRET si applicable)</p>
            <p><strong>Siège social :</strong> [Adresse complète de l&apos;association, Ex: 1 Place de la Mairie, 51000 Châlons]</p>
            <p><strong>Directeur de la publication :</strong> Gabin Husson</p>
            <p><strong>Contact :</strong> contact@chalonnais.fr</p>
          </div>
        </div>

        {/* 2. Hébergement */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <Server className="text-vert" size={24} />
            2. Hébergement
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              L&apos;architecture technique de la plateforme est répartie sur plusieurs services cloud de confiance garantissant la sécurité et la haute disponibilité :
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Interface utilisateur (Frontend) :</strong> Hébergée par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.</li>
              <li><strong>Serveur de données (Backend) :</strong> Hébergé par Render Networks, Inc., San Francisco, CA, États-Unis (Serveurs localisés en Europe, Francfort).</li>
            </ul>
          </div>
        </div>

        {/* 3. Politique RGPD */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <ShieldCheck className="text-vert" size={24} />
            3. Données personnelles (RGPD)
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-4">
            <p>
              Le Collectif Chalonnais s&apos;engage à ce que la collecte et le traitement de vos données soient conformes au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
            </p>
            
            <h3 className="font-bold text-noir">Finalité de la collecte</h3>
            <p>
              Les données personnelles collectées (nom, prénom, email, téléphone) sont strictement nécessaires à :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La gestion de votre compte utilisateur et de vos accès.</li>
              <li>L&apos;envoi de communications liées à l&apos;actualité de la commune.</li>
              <li>La gestion des annonces et objets trouvés.</li>
            </ul>

            <h3 className="font-bold text-noir">Vos droits</h3>
            <p>
              Conformément à la réglementation, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de portabilité de vos données. Vous pouvez également vous opposer au traitement de vos données.
            </p>
            
            <div className="bg-vert/5 p-4 rounded-xl border border-vert/20 mt-4 flex items-start gap-4">
              <Mail className="text-vert shrink-0 mt-1" size={20} />
              <p>
                Pour exercer ces droits, vous pouvez modifier vos informations directement depuis les <strong>Paramètres de votre Profil</strong> ou nous contacter à : <a href="mailto:contact@chalonnais.fr" className="font-bold text-vert hover:underline">contact@chalonnais.fr</a>.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Gestion des Cookies */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <Cookie className="text-vert" size={24} />
            4. Gestion des Cookies
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              La plateforme utilise <strong>uniquement des cookies techniques strictement nécessaires</strong> au fonctionnement de l&apos;application. 
            </p>
            <p>
              Aucun cookie de traçage publicitaire ou d&apos;analyse comportementale intrusif n&apos;est utilisé. Les cookies présents servent exclusivement à maintenir votre session sécurisée active (Cookies <code>HttpOnly</code> d&apos;authentification JWT). Par conséquent, ils sont exemptés du recueil de consentement préalable.
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}
