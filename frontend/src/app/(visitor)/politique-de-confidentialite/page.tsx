import Link from "next/link";
import { ShieldCheck, Lock, Cookie, Trash2, Mail, EyeOff, Server } from "lucide-react";

export const metadata = {
  title: "Politique de Confidentialité & RGPD | Collectif Territorial",
  description: "Protection de la vie privée, traitement des données personnelles et politique des cookies.",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="w-full bg-blanc min-h-screen">
      {/* En-tête */}
      <section className="bg-linear-to-br from-vert to-noir pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="w-16 h-16 bg-or/20 border border-or/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} className="text-or" />
          </div>
          <h1 className="font-poppins font-black text-4xl text-blanc mb-4">
            Politique de Confidentialité &amp; RGPD
          </h1>
          <p className="font-raleway text-blanc/80 text-lg">
            Transparence totale sur la collecte, la sécurité et vos droits d&apos;accès.
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Engagement */}
        <div className="bg-vert/5 p-6 rounded-2xl border border-vert/20 space-y-3 font-montserrat text-sm text-noir/90 leading-relaxed">
          <p>
            Le Collectif Territorial s&apos;engage à respecter le Règlement Général sur la Protection des Données
            (Règlement UE 2016/679 - RGPD) ainsi que la loi française n° 78-17 « Informatique et Libertés ».
            <strong> Aucune donnée personnelle n&apos;est vendue, louée ou cédée à des régies publicitaires tierces.</strong>
          </p>
        </div>

        {/* 1. Responsable de traitement */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <Server className="text-vert" size={24} />
            1. Responsable du Traitement
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              Le traitement des données est opéré sous la responsabilité de l&apos;association éditrice
              du Collectif pour le compte de la commune éditrice.
            </p>
            <p>
              <strong>Contact DPO / Référent Données :</strong>{" "}
              <a href="mailto:contact@chalonnais.fr" className="text-vert font-bold hover:underline">
                contact@chalonnais.fr
              </a>
            </p>
          </div>
        </div>

        {/* 2. Données collectées & Finalités */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <EyeOff className="text-vert" size={24} />
            2. Données Collectées &amp; Finalités
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-4">
            <p>Nous limitons strictement la collecte aux données nécessaires :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Compte &amp; Authentification :</strong> Nom, prénom, email, mot de passe chiffré (hachage fort bcrypt).
                Finalité : gestion de votre profil, signature de vos contributions et sécurisation de vos accès.
              </li>
              <li>
                <strong>Contributions citoyennes :</strong> Textes des articles, photos soumises, signalements d&apos;objets perdus.
                Finalité : publication d&apos;initiatives locales et modération par le comité de rédaction.
              </li>
              <li>
                <strong>Localisation / Commune active :</strong> Uniquement mémorisée localement dans votre navigateur pour afficher l&apos;édition de votre ville.
                Vos coordonnées GPS précises ne sont jamais stockées sur nos serveurs.
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Cookies et traceurs */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <Cookie className="text-vert" size={24} />
            3. Cookies &amp; Traceurs
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              Conformément aux délibérations de la CNIL, notre politique de traceurs est articulée en deux niveaux :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="bg-champagne/5 p-4 rounded-xl border border-champagne/20">
                <h4 className="font-bold text-vert mb-1">Traceurs Essentiels</h4>
                <p className="text-xs text-noir/70 leading-relaxed">
                  Cookies HTTP <code>HttpOnly</code> sécurisés de session d&apos;authentification et choix de la commune.
                  Strictement nécessaires au fonctionnement, ils ne requièrent pas de consentement préalable.
                </p>
              </div>
              <div className="bg-champagne/5 p-4 rounded-xl border border-champagne/20">
                <h4 className="font-bold text-vert mb-1">Traceurs Optionnels</h4>
                <p className="text-xs text-noir/70 leading-relaxed">
                  Mesures d&apos;audience anonymes (sans suivi publicitaire ni croisement de données).
                  Vous pouvez les refuser à tout moment sans aucun impact sur l&apos;accès au site.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Sécurité */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <Lock className="text-vert" size={24} />
            4. Sécurité &amp; Chiffrement
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              Toutes les communications transitent via un chiffrement SSL/TLS (HTTPS).
              Les mots de passe sont hachés de manière irréversible via l&apos;algorithme <code>bcrypt</code> avec un facteur de coût élevé.
              L&apos;infrastructure de production repose sur des conteneurs Linux durcis (Distroless Stage 3) sans shell système pour prévenir les intrusions.
            </p>
          </div>
        </div>

        {/* 5. Vos droits (Droit à l'oubli) */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <Trash2 className="text-urgent" size={24} />
            5. Droit d&apos;Accès, de Rectification &amp; d&apos;Effacement (RGPD)
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              Conformément aux articles 15 à 22 du RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, de portabilité
              et d&apos;effacement total de vos données (« droit à l&apos;oubli »).
            </p>
            <p>
              Vous pouvez exercer la suppression totale de votre compte directement en ligne depuis votre{" "}
              <Link href="/profile" className="text-vert font-bold underline hover:text-or">
                Espace Profil (onglet Sécurité)
              </Link>{" "}
              ou par courrier électronique à{" "}
              <a href="mailto:contact@chalonnais.fr" className="text-vert font-bold hover:underline">
                contact@chalonnais.fr
              </a>.
            </p>
            <div className="bg-champagne/10 p-4 rounded-xl border border-champagne/20 flex items-center gap-3 text-xs text-noir/80">
              <Mail className="text-vert shrink-0" size={18} />
              <span>
                Réclamation CNIL : Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une plainte auprès de la CNIL sur{" "}
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline font-bold text-vert">
                  cnil.fr
                </a>.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
