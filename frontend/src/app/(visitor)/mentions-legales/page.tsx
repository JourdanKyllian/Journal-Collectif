import { Scale, ShieldCheck, Server, FileText, Cookie, Mail, Copyright } from "lucide-react";

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
            <p><strong>Forme juridique :</strong> Association loi 1901</p>
            <p><strong>Numéro RNA :</strong> [WXXXXXXXXX]</p>
            <p><strong>Numéro SIRET :</strong> [Numéro SIRET si applicable, sinon supprimer la ligne]</p>
            <p><strong>Siège social :</strong> [Adresse complète, Ex: 1 Place de la Mairie, 51000 Châlons]</p>
            <p><strong>Directeur de la publication :</strong> Gabin Husson</p>
            <p><strong>Email de contact :</strong> contact@chalonnais.fr</p>
            <p><strong>Téléphone :</strong> [Numéro de téléphone de l&apos;association]</p>
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
              En conformité avec l&apos;article 6-I-2 de la loi pour la confiance dans l&apos;économie numérique (LCEN), l&apos;architecture technique de la plateforme est répartie sur les services suivants :
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Interface utilisateur (Frontend) :</strong> Hébergée par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.<br/>
                <em>Téléphone de l&apos;hébergeur :</em> +1 559-288-7060
              </li>
              <li>
                <strong>Serveur de données (Backend) :</strong> Hébergé par Render Networks, Inc., 525 Brannan St Suite 300, San Francisco, CA 94107, États-Unis. (Les données sont physiquement localisées sur le territoire Européen, à Francfort).<br/>
                <em>Contact de l&apos;hébergeur :</em> support@render.com
              </li>
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
            
            <h3 className="font-bold text-noir">Finalité et base légale du traitement</h3>
            <p>
              Vos données personnelles (nom, prénom, email, téléphone) sont recueillies sur la base de votre consentement et sont strictement nécessaires à :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La gestion de votre compte utilisateur et de vos accès à la plateforme.</li>
              <li>L&apos;envoi de communications liées à l&apos;actualité de la commune.</li>
              <li>La gestion des annonces et de la rubrique objets trouvés.</li>
            </ul>

            <h3 className="font-bold text-noir">Durée de conservation</h3>
            <p>
              Vos données personnelles sont conservées pendant toute la durée de votre inscription. En cas d&apos;inactivité de votre compte pendant une durée continue de 3 ans, vos données seront automatiquement anonymisées ou supprimées.
            </p>

            <h3 className="font-bold text-noir">Vos droits et réclamation (CNIL)</h3>
            <p>
              Conformément à la réglementation en vigueur, vous disposez d&apos;un droit d&apos;accès, de rectification, de portabilité, d&apos;effacement de vos données ou d&apos;une limitation du traitement. 
            </p>
            <p>
              Si vous estimez, après nous avoir contactés, que vos droits &quot;Informatique et Libertés&quot; ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-vert hover:underline">www.cnil.fr</a>).
            </p>
            
            <div className="bg-vert/5 p-4 rounded-xl border border-vert/20 mt-4 flex items-start gap-4">
              <Mail className="text-vert shrink-0 mt-1" size={20} />
              <p>
                Pour exercer vos droits, vous pouvez modifier vos informations directement depuis les <strong>Paramètres de votre Profil</strong> ou nous contacter à : <a href="mailto:contact@chalonnais.fr" className="font-bold text-vert hover:underline">contact@chalonnais.fr</a>.
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
              Aucun cookie de traçage publicitaire ou d&apos;analyse comportementale n&apos;est utilisé. Les cookies présents servent exclusivement à maintenir votre session sécurisée active (Cookies d&apos;authentification de type <code>HttpOnly</code>). Conformément aux recommandations de la CNIL, ces traceurs sont exemptés du recueil de consentement préalable.
            </p>
          </div>
        </div>

        {/* 5. Propriété Intellectuelle */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <Copyright className="text-vert" size={24} />
            5. Propriété Intellectuelle
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              L&apos;ensemble du contenu de ce site (textes, articles, images, illustrations, logos, architecture technique) est la propriété exclusive du Collectif Chalonnais ou de ses partenaires.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable. Toute exploitation non autorisée du site ou de l&apos;un quelconque des éléments qu&apos;il contient sera considérée comme constitutive d&apos;une contrefaçon et poursuivie conformément aux dispositions du Code de la Propriété Intellectuelle.
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}
