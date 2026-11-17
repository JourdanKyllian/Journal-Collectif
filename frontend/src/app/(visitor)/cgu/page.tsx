import Link from "next/link";
import { Handshake, ShieldAlert, HeartHandshake, FileCheck, Users, Ban } from "lucide-react";

export const metadata = {
  title: "Conditions Générales d'Utilisation (CGU) | Collectif Territorial",
  description: "Cadre d'utilisation, charte de contribution citoyenne et règles de solidarité locale.",
};

export default function CguPage() {
  return (
    <div className="w-full bg-blanc min-h-screen">
      {/* En-tête */}
      <section className="bg-linear-to-br from-vert to-noir pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="w-16 h-16 bg-or/20 border border-or/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Handshake size={32} className="text-or" />
          </div>
          <h1 className="font-poppins font-black text-4xl text-blanc mb-4">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="font-raleway text-blanc/80 text-lg">
            Charte de confiance, modération éditoriale et solidarité citoyenne.
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Préambule */}
        <div className="bg-or/10 p-6 rounded-2xl border border-or/30 space-y-3 font-montserrat text-sm text-noir/90 leading-relaxed">
          <h2 className="font-poppins font-bold text-lg text-vert flex items-center gap-2">
            <HeartHandshake size={20} className="text-or" />
            Préambule &amp; Esprit du Collectif
          </h2>
          <p>
            La présente plateforme est un espace citoyen et collaboratif dédié à la vie locale,
            à l&apos;information de proximité et à l&apos;entraide bénévole entre riverains.
            En utilisant ce service, chaque citoyen s&apos;engage à respecter un esprit de courtoisie,
            d&apos;entraide et de véracité de l&apos;information.
          </p>
          <p className="text-xs text-champagne">
            Dernière mise à jour : Novembre 2026 • Plateforme citoyenne à but non lucratif (aucune vente ni transaction marchande).
          </p>
        </div>

        {/* 1. Objet & Gratuité */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <FileCheck className="text-vert" size={24} />
            1. Objet du Service &amp; Gratuité
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              Le site et l&apos;application permettent aux résidents et acteurs locaux de consulter
              l&apos;actualité municipale et associative, de proposer des initiatives ou articles de
              quartier, et de participer à l&apos;entraide (signalement d&apos;objets trouvés, alertes locales).
            </p>
            <p>
              L&apos;accès à la plateforme et à l&apos;ensemble de ses fonctionnalités est <strong>entièrement gratuit</strong> pour les citoyens.
              Aucune transaction financière, vente ou abonnement payant n&apos;est proposé sur ce site.
            </p>
          </div>
        </div>

        {/* 2. Inscription & Compte */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <Users className="text-vert" size={24} />
            2. Compte Utilisateur &amp; Identité
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              La consultation des actualités publiées est libre et sans inscription. La proposition
              d&apos;articles, le signalement d&apos;objets perdus ou l&apos;accès aux services administratifs
              nécessitent la création d&apos;un compte personnel avec adresse email valide.
            </p>
            <p>
              L&apos;utilisateur s&apos;engage à ne pas créer de faux compte et à préserver la confidentialité de son mot de passe.
              L&apos;utilisateur dispose de la faculté de signer ses publications sous un <strong>anonymat public (« Citoyen Anonyme »)</strong>,
              tout en maintenant une traçabilité auprès du comité de rédaction pour prévenir les abus.
            </p>
          </div>
        </div>

        {/* 3. Charte de contribution */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <Ban className="text-urgent" size={24} />
            3. Charte de Contribution &amp; Règles de Publication
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-4">
            <p>
              En soumettant un contenu (article, texte, photo, commentaire), l&apos;auteur garantit qu&apos;il dispose
              des droits d&apos;auteur nécessaires et que ses écrits respectent les lois de la République. Sont strictement interdits :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-noir/90">
              <li>Les propos diffamatoires, injurieux, calomnieux ou attentatoires à la vie privée.</li>
              <li>Les incitations à la haine, à la violence ou les discriminations de toute nature.</li>
              <li>Les publicités commerciales non sollicitées ou démarches de prospection.</li>
              <li>La diffusion de fausses informations (fake news) délibérées ou de rumeurs non vérifiées.</li>
            </ul>
            <p>
              <strong>Comité de rédaction &amp; Modération :</strong> Tout article proposé par un citoyen est soumis
              à la validation préalable (modération *a priori*) d&apos;un relecteur ou administrateur communal avant sa mise en ligne.
              Le comité se réserve le droit de refuser toute publication non conforme à la ligne éditoriale locale.
            </p>
          </div>
        </div>

        {/* 4. Objets perdus et entraide */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <ShieldAlert className="text-vert" size={24} />
            4. Service Objets Trouvés &amp; Solidarité
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              La section Objets Perdus / Trouvés est un outil bénévole de signalement citoyen en lien avec la régie municipale.
              Le Collectif agit comme simple intermédiaire technique et ne peut être tenu responsable :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-noir/90">
              <li>De l&apos;état ou de la détérioration d&apos;un objet signalé.</li>
              <li>De la non-restitution d&apos;un objet perdu par un tiers.</li>
              <li>Des litiges pouvant survenir entre particuliers lors de la remise d&apos;un objet.</li>
            </ul>
            <p>
              Pour les objets de grande valeur ou documents officiels (CNI, passeport, carte bancaire), il est rappelé de les déposer
              directement au bureau de police municipale ou à l&apos;accueil de la Mairie.
            </p>
          </div>
        </div>

        {/* 5. Données personnelles et résiliation */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-3 font-poppins font-bold text-2xl text-noir border-b border-champagne/30 pb-3">
            <HeartHandshake className="text-vert" size={24} />
            5. Données Personnelles &amp; Droit à l&apos;Oubli
          </h2>
          <div className="font-montserrat text-sm text-noir/80 leading-relaxed space-y-3">
            <p>
              Les modalités de traitement de vos données sont régies par notre{" "}
              <Link href="/mentions-legales" className="text-vert font-bold underline hover:text-or">
                Politique de Confidentialité &amp; RGPD
              </Link>.
            </p>
            <p>
              Chaque utilisateur peut à tout moment résilier son compte et exiger la suppression immédiate
              de l&apos;ensemble de ses données nominatives depuis son espace Profil ou par email à{" "}
              <a href="mailto:contact@chalonnais.fr" className="text-vert underline">contact@chalonnais.fr</a>.
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}
