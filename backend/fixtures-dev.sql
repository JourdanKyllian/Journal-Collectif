-- ==============================================================================
-- FIXTURES DE DÉVELOPPEMENT & TEST - JOURNAL COLLECTIF (MULTI-TENANT 2 COMMUNES)
-- ==============================================================================
-- Ce script est STRICTEMENT réservé aux environnements de développement ou de test.
-- Il insère un jeu complet de données multi-tenant, 100% autonome et idempotent :
--
--   1. 2 COMMUNES & 2 JOURNAUX ACTIFS :
--      - Commune 1 : Châlons-en-Champagne (51108 / 51000, slug: collectif-chalonnais)
--      - Commune 2 : Épernay (51230 / 51200, slug: mairie-epernay)
--
--   2. ÉQUIPES DÉDIÉES PAR COMMUNE (Mot de passe commun : Password123!) :
--      - Commune 1 (Châlons) :
--          • Président éditorial (Super Admin) : president.chalons@journal.fr
--          • Admin (Modérateur chef)           : admin.chalons@journal.fr
--          • Rédacteur attitré                 : redacteur.chalons@journal.fr
--      - Commune 2 (Épernay) :
--          • Président éditorial (Super Admin) : president.epernay@journal.fr
--          • Admin (Modérateur chef)           : admin.epernay@journal.fr
--          • Rédacteur attitré                 : redacteur.epernay@journal.fr
--
--   3. PROFILS CITOYENS / VISITEURS :
--      - Utilisateur sans compte : navigation publique libre (mode invité)
--      - Visiteur enregistré     : visiteur.enregistre@exemple.fr (non vérifié)
--      - Visiteur vérifié        : citoyen.verifie@exemple.fr     (téléphone validé)
--      (+ comptes legacy préservés : superadmin@journal.fr, admin@journal.fr, etc.)
--
--   4. CONTENUS MULTI-TENANT PROPRES À CHAQUE VILLE :
--      - Catégories thématiques distinctes
--      - Articles publiés, en attente de modération citoyenne et brouillons
--      - Déclarations d'objets perdus et trouvés
--      - Parkings connectés IoT (temps réel) et à affluence médiane
--      - Bons plans locaux & jeux concours avec participants de test
--      - Alertes d'informations municipales
-- ==============================================================================

DO $$
DECLARE
    -- Rôles
    role_super_admin_id integer;
    role_admin_id integer;
    role_redacteur_id integer;
    role_utilisateur_id integer;

    -- Communes & Journaux
    com_chalons_id integer;
    com_epernay_id integer;
    j_chalons_id integer;
    j_epernay_id integer;

    -- Utilisateurs Châlons
    user_pres_chalons_id integer;
    user_admin_chalons_id integer;
    user_redac_chalons_id integer;

    -- Utilisateurs Épernay
    user_pres_epernay_id integer;
    user_admin_epernay_id integer;
    user_redac_epernay_id integer;

    -- Citoyens / Visiteurs
    user_visiteur_enr_id integer;
    user_citoyen_ver_id integer;

    -- Catégories Châlons
    cat_ch_actu_id integer;
    cat_ch_culture_id integer;
    cat_ch_ecolo_id integer;
    cat_ch_vie_id integer;

    -- Catégories Épernay
    cat_ep_actu_id integer;
    cat_ep_culture_id integer;
    cat_ep_terroir_id integer;
    cat_ep_vie_id integer;

    -- Variables de manipulation
    art_id integer;
    deal_concours_id integer;
    default_pwd_hash varchar := '$2b$10$7meeR80wMvHesTIXnc1plOuyl0ReEp6.z5p5ezXhTIedruS3EAhZi'; -- Password123!
BEGIN
    -- ==========================================================================
    -- 0. INITIALISATION DES RÔLES DU SYSTÈME
    -- ==========================================================================
    SELECT id INTO role_super_admin_id FROM "role" WHERE libelle = 'super_admin' LIMIT 1;
    IF role_super_admin_id IS NULL THEN
        INSERT INTO "role" (libelle) VALUES ('super_admin') RETURNING id INTO role_super_admin_id;
    END IF;

    SELECT id INTO role_admin_id FROM "role" WHERE libelle = 'admin' LIMIT 1;
    IF role_admin_id IS NULL THEN
        INSERT INTO "role" (libelle) VALUES ('admin') RETURNING id INTO role_admin_id;
    END IF;

    SELECT id INTO role_redacteur_id FROM "role" WHERE libelle = 'redacteur' LIMIT 1;
    IF role_redacteur_id IS NULL THEN
        INSERT INTO "role" (libelle) VALUES ('redacteur') RETURNING id INTO role_redacteur_id;
    END IF;

    SELECT id INTO role_utilisateur_id FROM "role" WHERE libelle = 'utilisateur' LIMIT 1;
    IF role_utilisateur_id IS NULL THEN
        INSERT INTO "role" (libelle) VALUES ('utilisateur') RETURNING id INTO role_utilisateur_id;
    END IF;

    -- ==========================================================================
    -- 1. COMMUNES & JOURNAUX (MULTI-TENANT)
    -- ==========================================================================

    -- --- COMMUNE 1 : CHÂLONS-EN-CHAMPAGNE ---
    SELECT id INTO com_chalons_id FROM "commune" WHERE code_insee = '51108' LIMIT 1;
    IF com_chalons_id IS NULL THEN
        INSERT INTO "commune" (nom, code_insee, code_postal, created_at)
        VALUES ('Châlons-en-Champagne', '51108', '51000', NOW())
        RETURNING id INTO com_chalons_id;
    END IF;

    SELECT id INTO j_chalons_id FROM "journal" WHERE slug = 'collectif-chalonnais' LIMIT 1;
    IF j_chalons_id IS NULL THEN
        INSERT INTO "journal" (
            slug, nom_journal, type_journal, nom_ville, email_contact, tel_contact,
            description_footer, statut, created_at, updated_at
        ) VALUES (
            'collectif-chalonnais', 'Collectif Chalonnais', 'Journal associatif indépendant',
            'Châlons-en-Champagne', 'contact@collectif-chalonnais.fr', '03 26 26 08 30',
            'Le journal officiel et indépendant de la commune, pour rester connectés à la vie locale en temps réel.',
            'actif', NOW(), NOW()
        ) RETURNING id INTO j_chalons_id;
    ELSE
        UPDATE "journal" SET statut = 'actif' WHERE id = j_chalons_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "journal_commune" WHERE journal_id = j_chalons_id AND commune_id = com_chalons_id) THEN
        INSERT INTO "journal_commune" (journal_id, commune_id) VALUES (j_chalons_id, com_chalons_id);
    END IF;

    -- --- COMMUNE 2 : ÉPERNAY ---
    SELECT id INTO com_epernay_id FROM "commune" WHERE code_insee = '51230' LIMIT 1;
    IF com_epernay_id IS NULL THEN
        INSERT INTO "commune" (nom, code_insee, code_postal, created_at)
        VALUES ('Épernay', '51230', '51200', NOW())
        RETURNING id INTO com_epernay_id;
    END IF;

    SELECT id INTO j_epernay_id FROM "journal" WHERE slug = 'mairie-epernay' LIMIT 1;
    IF j_epernay_id IS NULL THEN
        INSERT INTO "journal" (
            slug, nom_journal, type_journal, nom_ville, email_contact, tel_contact,
            description_footer, statut, created_at, updated_at
        ) VALUES (
            'mairie-epernay', 'Épernay Actu', 'Journal municipal & associatif',
            'Épernay', 'contact@epernay-actu.fr', '03 26 53 37 37',
            'L''actualité municipale, associative et culturelle de la Capitale du Champagne.',
            'actif', NOW(), NOW()
        ) RETURNING id INTO j_epernay_id;
    ELSE
        UPDATE "journal" SET statut = 'actif' WHERE id = j_epernay_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "journal_commune" WHERE journal_id = j_epernay_id AND commune_id = com_epernay_id) THEN
        INSERT INTO "journal_commune" (journal_id, commune_id) VALUES (j_epernay_id, com_epernay_id);
    END IF;

    -- ==========================================================================
    -- 2. COMPTES UTILISATEURS, PROFILS & MEMBRE DE JOURNAL
    -- ==========================================================================

    -- --- ÉQUIPE CHÂLONS ---
    -- A. Président éditorial (Super Admin Châlons)
    SELECT id INTO user_pres_chalons_id FROM "users" WHERE email = 'president.chalons@journal.fr' LIMIT 1;
    IF user_pres_chalons_id IS NULL THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('president.chalons@journal.fr', default_pwd_hash, role_super_admin_id, true, true, false, NOW(), NOW())
        RETURNING id INTO user_pres_chalons_id;

        INSERT INTO "profile" (user_id, firstname, lastname, tel, bio, avatar_ref, is_delete, created_at, updated_at)
        VALUES (user_pres_chalons_id, 'Henri', 'Giraud', '+33 6 01 02 03 04', 'Président éditorial du Collectif Chalonnais.', 'default_02', false, NOW(), NOW());
    END IF;
    INSERT INTO "journal_member" (user_id, journal_id, role_id, created_at)
    VALUES (user_pres_chalons_id, j_chalons_id, role_super_admin_id, NOW())
    ON CONFLICT ("user_id", "journal_id") DO UPDATE SET role_id = EXCLUDED.role_id;

    -- B. Admin (Modérateur chef Châlons)
    SELECT id INTO user_admin_chalons_id FROM "users" WHERE email = 'admin.chalons@journal.fr' LIMIT 1;
    IF user_admin_chalons_id IS NULL THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('admin.chalons@journal.fr', default_pwd_hash, role_admin_id, true, false, false, NOW(), NOW())
        RETURNING id INTO user_admin_chalons_id;

        INSERT INTO "profile" (user_id, firstname, lastname, tel, bio, avatar_ref, is_delete, created_at, updated_at)
        VALUES (user_admin_chalons_id, 'Marc', 'Lemoine', '+33 6 01 02 03 05', 'Responsable de la modération locale de Châlons.', 'default_03', false, NOW(), NOW());
    END IF;
    INSERT INTO "journal_member" (user_id, journal_id, role_id, created_at)
    VALUES (user_admin_chalons_id, j_chalons_id, role_admin_id, NOW())
    ON CONFLICT ("user_id", "journal_id") DO UPDATE SET role_id = EXCLUDED.role_id;

    -- C. Rédacteur attitré Châlons
    SELECT id INTO user_redac_chalons_id FROM "users" WHERE email = 'redacteur.chalons@journal.fr' LIMIT 1;
    IF user_redac_chalons_id IS NULL THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('redacteur.chalons@journal.fr', default_pwd_hash, role_redacteur_id, true, false, false, NOW(), NOW())
        RETURNING id INTO user_redac_chalons_id;

        INSERT INTO "profile" (user_id, firstname, lastname, tel, bio, avatar_ref, is_delete, created_at, updated_at)
        VALUES (user_redac_chalons_id, 'Sophie', 'Dubois', '+33 6 01 02 03 06', 'Journaliste municipale & culturelle chalonnaise.', 'default_04', false, NOW(), NOW());
    END IF;
    INSERT INTO "journal_member" (user_id, journal_id, role_id, created_at)
    VALUES (user_redac_chalons_id, j_chalons_id, role_redacteur_id, NOW())
    ON CONFLICT ("user_id", "journal_id") DO UPDATE SET role_id = EXCLUDED.role_id;

    -- --- ÉQUIPE ÉPERNAY ---
    -- A. Président éditorial (Super Admin Épernay)
    SELECT id INTO user_pres_epernay_id FROM "users" WHERE email = 'president.epernay@journal.fr' LIMIT 1;
    IF user_pres_epernay_id IS NULL THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('president.epernay@journal.fr', default_pwd_hash, role_super_admin_id, true, true, false, NOW(), NOW())
        RETURNING id INTO user_pres_epernay_id;

        INSERT INTO "profile" (user_id, firstname, lastname, tel, bio, avatar_ref, is_delete, created_at, updated_at)
        VALUES (user_pres_epernay_id, 'Claire', 'De Castellane', '+33 6 02 02 03 04', 'Présidente éditoriale de Épernay Actu.', 'default_02', false, NOW(), NOW());
    END IF;
    INSERT INTO "journal_member" (user_id, journal_id, role_id, created_at)
    VALUES (user_pres_epernay_id, j_epernay_id, role_super_admin_id, NOW())
    ON CONFLICT ("user_id", "journal_id") DO UPDATE SET role_id = EXCLUDED.role_id;

    -- B. Admin (Modérateur chef Épernay)
    SELECT id INTO user_admin_epernay_id FROM "users" WHERE email = 'admin.epernay@journal.fr' LIMIT 1;
    IF user_admin_epernay_id IS NULL THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('admin.epernay@journal.fr', default_pwd_hash, role_admin_id, true, false, false, NOW(), NOW())
        RETURNING id INTO user_admin_epernay_id;

        INSERT INTO "profile" (user_id, firstname, lastname, tel, bio, avatar_ref, is_delete, created_at, updated_at)
        VALUES (user_admin_epernay_id, 'Julien', 'Mercier', '+33 6 02 02 03 05', 'Administrateur et modérateur de la commune d''Épernay.', 'default_03', false, NOW(), NOW());
    END IF;
    INSERT INTO "journal_member" (user_id, journal_id, role_id, created_at)
    VALUES (user_admin_epernay_id, j_epernay_id, role_admin_id, NOW())
    ON CONFLICT ("user_id", "journal_id") DO UPDATE SET role_id = EXCLUDED.role_id;

    -- C. Rédacteur attitré Épernay
    SELECT id INTO user_redac_epernay_id FROM "users" WHERE email = 'redacteur.epernay@journal.fr' LIMIT 1;
    IF user_redac_epernay_id IS NULL THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('redacteur.epernay@journal.fr', default_pwd_hash, role_redacteur_id, true, false, false, NOW(), NOW())
        RETURNING id INTO user_redac_epernay_id;

        INSERT INTO "profile" (user_id, firstname, lastname, tel, bio, avatar_ref, is_delete, created_at, updated_at)
        VALUES (user_redac_epernay_id, 'Alexandre', 'Moët', '+33 6 02 02 03 06', 'Rédacteur patrimoine & terroir d''Épernay.', 'default_04', false, NOW(), NOW());
    END IF;
    INSERT INTO "journal_member" (user_id, journal_id, role_id, created_at)
    VALUES (user_redac_epernay_id, j_epernay_id, role_redacteur_id, NOW())
    ON CONFLICT ("user_id", "journal_id") DO UPDATE SET role_id = EXCLUDED.role_id;

    -- --- CITOYENS & VISITEURS TRANSVERSES ---
    -- A. Visiteur enregistré (non vérifié : pas de téléphone certifié)
    SELECT id INTO user_visiteur_enr_id FROM "users" WHERE email = 'visiteur.enregistre@exemple.fr' LIMIT 1;
    IF user_visiteur_enr_id IS NULL THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('visiteur.enregistre@exemple.fr', default_pwd_hash, role_utilisateur_id, false, false, false, NOW(), NOW())
        RETURNING id INTO user_visiteur_enr_id;

        INSERT INTO "profile" (user_id, firstname, lastname, tel, bio, avatar_ref, is_delete, created_at, updated_at)
        VALUES (user_visiteur_enr_id, 'Lucas', 'Bernard', NULL, NULL, 'default_01', false, NOW(), NOW());
    END IF;
    INSERT INTO "journal_member" (user_id, journal_id, role_id, created_at)
    VALUES (user_visiteur_enr_id, j_chalons_id, role_utilisateur_id, NOW())
    ON CONFLICT ("user_id", "journal_id") DO NOTHING;
    INSERT INTO "journal_member" (user_id, journal_id, role_id, created_at)
    VALUES (user_visiteur_enr_id, j_epernay_id, role_utilisateur_id, NOW())
    ON CONFLICT ("user_id", "journal_id") DO NOTHING;

    -- B. Visiteur vérifié (citoyen complet avec téléphone certifié)
    SELECT id INTO user_citoyen_ver_id FROM "users" WHERE email = 'citoyen.verifie@exemple.fr' LIMIT 1;
    IF user_citoyen_ver_id IS NULL THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('citoyen.verifie@exemple.fr', default_pwd_hash, role_utilisateur_id, true, false, false, NOW(), NOW())
        RETURNING id INTO user_citoyen_ver_id;

        INSERT INTO "profile" (user_id, firstname, lastname, tel, bio, avatar_ref, is_delete, created_at, updated_at)
        VALUES (user_citoyen_ver_id, 'Camille', 'Dupont', '+33 6 11 22 33 44', 'Citoyen engagé de la région champenoise.', 'default_01', false, NOW(), NOW());
    END IF;
    INSERT INTO "journal_member" (user_id, journal_id, role_id, created_at)
    VALUES (user_citoyen_ver_id, j_chalons_id, role_utilisateur_id, NOW())
    ON CONFLICT ("user_id", "journal_id") DO NOTHING;
    INSERT INTO "journal_member" (user_id, journal_id, role_id, created_at)
    VALUES (user_citoyen_ver_id, j_epernay_id, role_utilisateur_id, NOW())
    ON CONFLICT ("user_id", "journal_id") DO NOTHING;

    -- C. Rétrocompatibilité anciens comptes de test
    IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'admin@journal.fr') THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('admin@journal.fr', default_pwd_hash, role_admin_id, true, false, false, NOW(), NOW());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'redacteur@journal.fr') THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('redacteur@journal.fr', default_pwd_hash, role_redacteur_id, true, false, false, NOW(), NOW());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'superadmin@journal.fr') THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('superadmin@journal.fr', default_pwd_hash, role_super_admin_id, true, true, false, NOW(), NOW());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'visiteur.complet@exemple.fr') THEN
        INSERT INTO "users" (email, password, role_id, is_phone_verified, is_platform_admin, must_change_password, created_at, updated_at)
        VALUES ('visiteur.complet@exemple.fr', default_pwd_hash, role_utilisateur_id, true, false, false, NOW(), NOW());
    END IF;

    -- ==========================================================================
    -- 3. CATÉGORIES THÉMATIQUES
    -- ==========================================================================

    -- --- CATÉGORIES CHÂLONS ---
    SELECT id INTO cat_ch_actu_id FROM "categorie" WHERE libelle = 'Actualités' AND journal_id = j_chalons_id LIMIT 1;
    IF cat_ch_actu_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (j_chalons_id, 'Actualités', 'Toute l''actualité brûlante du bassin chalonnais', '📰', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_ch_actu_id;
    END IF;

    SELECT id INTO cat_ch_culture_id FROM "categorie" WHERE libelle = 'Culture' AND journal_id = j_chalons_id LIMIT 1;
    IF cat_ch_culture_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (j_chalons_id, 'Culture', 'Spectacles, patrimoine et scènes vivantes', '🎭', 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_ch_culture_id;
    END IF;

    SELECT id INTO cat_ch_ecolo_id FROM "categorie" WHERE libelle = 'Environnement' AND journal_id = j_chalons_id LIMIT 1;
    IF cat_ch_ecolo_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (j_chalons_id, 'Environnement', 'Écologie, mobilités douces et parcs fluviaux', '🌱', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_ch_ecolo_id;
    END IF;

    SELECT id INTO cat_ch_vie_id FROM "categorie" WHERE libelle = 'Vie Locale' AND journal_id = j_chalons_id LIMIT 1;
    IF cat_ch_vie_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (j_chalons_id, 'Vie Locale', 'Commerces de proximité et vie de quartier', '🏘️', 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_ch_vie_id;
    END IF;

    -- --- CATÉGORIES ÉPERNAY ---
    SELECT id INTO cat_ep_actu_id FROM "categorie" WHERE libelle = 'Actualités' AND journal_id = j_epernay_id LIMIT 1;
    IF cat_ep_actu_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (j_epernay_id, 'Actualités', 'L''information en continu sur la commune d''Épernay', '📰', 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_ep_actu_id;
    END IF;

    SELECT id INTO cat_ep_culture_id FROM "categorie" WHERE libelle = 'Culture & Festivités' AND journal_id = j_epernay_id LIMIT 1;
    IF cat_ep_culture_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (j_epernay_id, 'Culture & Festivités', 'Événements, Habits de Lumière et patrimoine sparnacien', '✨', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_ep_culture_id;
    END IF;

    SELECT id INTO cat_ep_terroir_id FROM "categorie" WHERE libelle = 'Vigne & Terroir' AND journal_id = j_epernay_id LIMIT 1;
    IF cat_ep_terroir_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (j_epernay_id, 'Vigne & Terroir', 'Avenue de Champagne, coteaux historiques et viticulture durable', '🍇', 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_ep_terroir_id;
    END IF;

    SELECT id INTO cat_ep_vie_id FROM "categorie" WHERE libelle = 'Vie Sparnacienne' AND journal_id = j_epernay_id LIMIT 1;
    IF cat_ep_vie_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (j_epernay_id, 'Vie Sparnacienne', 'Halle Saint-Thibault, commerces et initiatives citoyennes', '🥂', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_ep_vie_id;
    END IF;

    -- ==========================================================================
    -- 4. ARTICLES & AUTEURS PAR VILLE
    -- ==========================================================================

    -- --------------------------------------------------------------------------
    -- 4.1 ARTICLES CHÂLONS-EN-CHAMPAGNE
    -- --------------------------------------------------------------------------
    -- Article Publié 1 : Marché Bio
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Lancement du nouveau grand marché bio au centre-ville' AND journal_id = j_chalons_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            j_chalons_id,
            'Lancement du nouveau grand marché bio au centre-ville',
            '<p>Le cœur de notre cité bat au rythme des saveurs locales ce samedi. Plus de 35 producteurs régionaux, maraîchers, fromagers et apiculteurs ont investi la place centrale pour une première édition saluée par les riverains.</p><p>Une dynamique économique et conviviale qui s’inscrit dans le programme de valorisation des circuits courts de la municipalité.</p>',
            'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
            'publie', NOW() - INTERVAL '3 days', cat_ch_vie_id, false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at)
        VALUES (user_redac_chalons_id, art_id, 'Rédacteur en chef', NOW());
    END IF;

    -- Article Publié 2 : Théâtre Municipal
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Le Théâtre Municipal rouvre ses portes après 18 mois de rénovation' AND journal_id = j_chalons_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            j_chalons_id,
            'Le Théâtre Municipal rouvre ses portes après 18 mois de rénovation',
            '<p>Joyau du patrimoine architectural du XIXe siècle, la grande salle à l''italienne a bénéficié d''une restauration complète de ses dorures et d''une modernisation acoustique de pointe.</p><p>Le week-end inaugural débutera par une série de représentations gratuites pour tous les habitants.</p>',
            'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
            'publie', NOW() - INTERVAL '2 days', cat_ch_culture_id, false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at)
        VALUES (user_redac_chalons_id, art_id, 'Journaliste Culture', NOW());
    END IF;

    -- Article Publié 3 : Plan Vélo
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Plan vélo : 12 nouveaux kilomètres de pistes sécurisées dès cet automne' AND journal_id = j_chalons_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            j_chalons_id,
            'Plan vélo : 12 nouveaux kilomètres de pistes sécurisées dès cet automne',
            '<p>Favoriser les mobilités décarbonées tout en garantissant la sécurité des usagers : c’est l’objectif affiché par le nouveau tracé qui reliera les faubourgs est au quartier de la gare.</p><p>Des bornes de gonflage en libre-service et des abris sécurisés complètent ce dispositif d''envergure.</p>',
            'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80',
            'publie', NOW() - INTERVAL '1 day', cat_ch_ecolo_id, false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at)
        VALUES (user_redac_chalons_id, art_id, 'Chroniqueur Mobilités', NOW());
    END IF;

    -- Article En Attente : Ramassage citoyen
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Appel citoyen : Grande matinée de ramassage des déchets au Bois Vert' AND journal_id = j_chalons_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            j_chalons_id,
            'Appel citoyen : Grande matinée de ramassage des déchets au Bois Vert',
            '<p>Nous organisons avec un collectif de voisins une matinée de nettoyage le dimanche 15 novembre à 10h. Gants et sacs fournis. Venez nombreux participer à la préservation de notre environnement !</p>',
            'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80',
            'en_attente', NULL, cat_ch_ecolo_id, false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at)
        VALUES (user_citoyen_ver_id, art_id, 'Citoyen Proposant', NOW());
    END IF;

    -- Article Brouillon : Commerces indépendants
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = '[Brouillon] Enquête : L’essor des commerces indépendants du centre-ville' AND journal_id = j_chalons_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            j_chalons_id,
            '[Brouillon] Enquête : L’essor des commerces indépendants du centre-ville',
            '<p><em>Note interne : Finaliser les chiffres de fréquentation avant soumission au comité éditorial.</em></p><p>Le cœur marchand de Châlons résiste remarquablement grâce aux nouveaux concepts de boutiques partagées...</p>',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
            'brouillon', NULL, cat_ch_vie_id, false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at)
        VALUES (user_redac_chalons_id, art_id, 'Enquêteur / Rédacteur', NOW());
    END IF;

    -- --------------------------------------------------------------------------
    -- 4.2 ARTICLES ÉPERNAY
    -- --------------------------------------------------------------------------
    -- Article Publié 1 : Habits de Lumière
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Habits de Lumière : le programme féerique sur l''Avenue de Champagne' AND journal_id = j_epernay_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            j_epernay_id,
            'Habits de Lumière : le programme féerique sur l''Avenue de Champagne',
            '<p>Trois jours de festivités grandioses illumineront la plus prestigieuse avenue de la commune. Spectacles de rue monumentaux, vidéo-mapping sur les façades historiques et dégustations gastronomiques seront au rendez-vous.</p><p>Plus de 50 000 visiteurs sont attendus pour célébrer l''art de vivre champenois et la créativité locale.</p>',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
            'publie', NOW() - INTERVAL '1 day', cat_ep_culture_id, false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at)
        VALUES (user_redac_epernay_id, art_id, 'Rédacteur Culture Épernay', NOW());
    END IF;

    -- Article Publié 2 : Halle Saint-Thibault
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Restauration de la Halle Saint-Thibault : les artisans locaux à l''honneur' AND journal_id = j_epernay_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            j_epernay_id,
            'Restauration de la Halle Saint-Thibault : les artisans locaux à l''honneur',
            '<p>Véritable carrefour de convivialité sparnacienne, le marché couvert moderne fait la part belle aux circuits courts, fromages d''AOP et créations gourmandes régionales.</p><p>Un nouveau banc d''écailler et un espace dégustation viennent enrichir l''expérience des chalands du mercredi et samedi matin.</p>',
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
            'publie', NOW() - INTERVAL '2 days', cat_ep_vie_id, false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at)
        VALUES (user_redac_epernay_id, art_id, 'Chroniqueur Économie Locale', NOW());
    END IF;

    -- Article Publié 3 : Sentiers Viticoles
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Écotourisme : ouverture des nouveaux sentiers de découverte viticole' AND journal_id = j_epernay_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            j_epernay_id,
            'Écotourisme : ouverture des nouveaux sentiers de découverte viticole',
            '<p>Des coteaux historiques inscrits au patrimoine mondial de l''UNESCO jusqu''aux belvédères dominant la vallée de la Marne, 3 nouveaux parcours balisés sont désormais accessibles aux randonneurs et cyclistes.</p>',
            'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80',
            'publie', NOW() - INTERVAL '4 days', cat_ep_terroir_id, false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at)
        VALUES (user_redac_epernay_id, art_id, 'Journaliste Terroir', NOW());
    END IF;

    -- Article En Attente Épernay : Boîte à livres
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Appel citoyen : Végétalisation et installation d''une boîte à livres Quartier Sud' AND journal_id = j_epernay_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            j_epernay_id,
            'Appel citoyen : Végétalisation et installation d''une boîte à livres Quartier Sud',
            '<p>Avec les résidents de la rue de Champagne Sud, nous souhaitons fleurir le square et y installer une cabine d''échange littéraire. Nous sollicitons le soutien de la commune et de nos voisins !</p>',
            'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
            'en_attente', NULL, cat_ep_vie_id, false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at)
        VALUES (user_citoyen_ver_id, art_id, 'Citoyen Proposant', NOW());
    END IF;

    -- Article Brouillon Épernay : Caves & UNESCO
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = '[Brouillon] Dossier spécial : Les galeries souterraines d''Épernay' AND journal_id = j_epernay_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            j_epernay_id,
            '[Brouillon] Dossier spécial : Les galeries souterraines d''Épernay',
            '<p><em>Note interne : Récupérer les archives photographiques du XIXe siècle auprès du service patrimoine.</em></p><p>Plus de 110 kilomètres de caves creusées dans la craie s''étendent sous les pavés de la cité...</p>',
            'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
            'brouillon', NULL, cat_ep_culture_id, false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at)
        VALUES (user_redac_epernay_id, art_id, 'Rédacteur Attitré', NOW());
    END IF;

    -- ==========================================================================
    -- 5. DÉCLARATION D'OBJETS PERDUS & TROUVÉS
    -- ==========================================================================

    -- --- OBJETS CHÂLONS ---
    IF NOT EXISTS (SELECT 1 FROM "declaration_objet" WHERE name_object = 'Sac à dos imperméable Kånken' AND journal_id = j_chalons_id) THEN
        INSERT INTO "declaration_objet" (
            journal_id, type_declaration, name_object, description, lieu_presume, image_url, user_id, is_delete, created_at, updated_at
        ) VALUES (
            j_chalons_id, 'perdu', 'Sac à dos imperméable Kånken',
            'Couleur ocre/moutarde. Contient une trousse d''écolier et des cours universitaires.',
            'Place du Marché, près de la fontaine',
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
            user_citoyen_ver_id, false, NOW() - INTERVAL '2 days', NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "declaration_objet" WHERE name_object = 'Trousseau de clés avec badge Vigik' AND journal_id = j_chalons_id) THEN
        INSERT INTO "declaration_objet" (
            journal_id, type_declaration, name_object, description, lieu_presume, image_url, user_id, is_delete, created_at, updated_at
        ) VALUES (
            j_chalons_id, 'trouve', 'Trousseau de clés avec badge Vigik',
            '3 clés plates et badge d''immeuble noir. Déposé au poste de police municipale.',
            'Avenue de la République, devant l''arrêt de bus',
            'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
            user_citoyen_ver_id, false, NOW() - INTERVAL '1 day', NOW()
        );
    END IF;

    -- --- OBJETS ÉPERNAY ---
    IF NOT EXISTS (SELECT 1 FROM "declaration_objet" WHERE name_object = 'Appareil photo numérique reflex' AND journal_id = j_epernay_id) THEN
        INSERT INTO "declaration_objet" (
            journal_id, type_declaration, name_object, description, lieu_presume, image_url, user_id, is_delete, created_at, updated_at
        ) VALUES (
            j_epernay_id, 'perdu', 'Appareil photo numérique reflex',
            'Boîtier noir avec bandoulière en cuir marron. Photos de famille très précieuses.',
            'Avenue de Champagne, sur un banc près des grilles de l''Orangerie',
            'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
            user_citoyen_ver_id, false, NOW() - INTERVAL '1 day', NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "declaration_objet" WHERE name_object = 'Parapluie canne à damier' AND journal_id = j_epernay_id) THEN
        INSERT INTO "declaration_objet" (
            journal_id, type_declaration, name_object, description, lieu_presume, image_url, user_id, is_delete, created_at, updated_at
        ) VALUES (
            j_epernay_id, 'trouve', 'Parapluie canne à damier',
            'Manche en bois sculpté, tissu noir et gris. Trouvé et remis à l''accueil de l''Office de Tourisme.',
            'Place Charles de Gaulle',
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
            user_citoyen_ver_id, false, NOW() - INTERVAL '3 hours', NOW()
        );
    END IF;

    -- ==========================================================================
    -- 6. PARKINGS (CAPTEURS IOT & AFFLUENCE MÉDIANE)
    -- ==========================================================================

    -- --- PARKINGS CHÂLONS ---
    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Saint-Alpin' AND journal_id = j_chalons_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            j_chalons_id, 'Parking Saint-Alpin', 'Souterrain', 220, 168, true, 'calme',
            6, '30 min gratuites', '250 m', 'Place Saint-Alpin', 'Capteurs connectés • Circulation fluide', true, NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Hôtel de Ville' AND journal_id = j_chalons_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            j_chalons_id, 'Parking Hôtel de Ville', 'Surface', 180, 48, true, 'forte',
            2, '15 min dépose-minute', '400 m', 'Place Foch', 'Capteurs connectés • Forte affluence marché', true, NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Gare SNCF & Parvis' AND journal_id = j_chalons_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            j_chalons_id, 'Parking Gare SNCF & Parvis', 'Gare', 150, 0, false, 'forte',
            4, 'Gratuit usagers TER', '650 m', 'Place de la Gare', 'Non équipé • Stationnement pendulaire soutenu', true, NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Esplanade des Fêtes' AND journal_id = j_chalons_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            j_chalons_id, 'Parking Esplanade des Fêtes', 'Enclos', 90, 0, false, 'calme',
            0, 'Gratuit', '850 m', 'Esplanade du Stade', 'Non équipé • Stationnement libre', true, NOW(), NOW()
        );
    END IF;

    -- --- PARKINGS ÉPERNAY ---
    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Centre-Ville Charles de Gaulle' AND journal_id = j_epernay_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            j_epernay_id, 'Parking Centre-Ville Charles de Gaulle', 'Souterrain', 320, 142, true, 'moderee',
            8, '45 min gratuites', '150 m', 'Place Charles de Gaulle', 'Capteurs connectés • Idéal pour l''Avenue de Champagne', true, NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Gare d''Épernay' AND journal_id = j_epernay_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            j_epernay_id, 'Parking Gare d''Épernay', 'Surface', 160, 54, true, 'forte',
            4, '20 min gratuites', '450 m', 'Boulevard de la Motte', 'Capteurs connectés • Correspondances TGV / TER', true, NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Rempart Perrier' AND journal_id = j_epernay_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            j_epernay_id, 'Parking Rempart Perrier', 'Enclos', 95, 0, false, 'moderee',
            2, 'Gratuit après 18h', '350 m', 'Rue du Rempart Perrier', 'Non équipé • Proche zone piétonne commerçante', true, NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Esplanade Raoul Chandon' AND journal_id = j_epernay_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            j_epernay_id, 'Parking Esplanade Raoul Chandon', 'Surface', 130, 0, false, 'calme',
            0, 'Gratuit', '700 m', 'Avenue de Champagne', 'Non équipé • Stationnement touristique libre', true, NOW(), NOW()
        );
    END IF;

    -- ==========================================================================
    -- 7. BONS PLANS & JEUX CONCOURS
    -- ==========================================================================

    -- --- BONS PLANS CHÂLONS ---
    IF NOT EXISTS (SELECT 1 FROM "bon_plan" WHERE titre = '20% sur le Festival des Lumières' AND journal_id = j_chalons_id) THEN
        INSERT INTO "bon_plan" (
            journal_id, titre, description, categorie, partenaire, valeur, code_promo,
            lien_url, image, date_debut, date_fin, est_exclusif, statut, conditions, created_at, updated_at
        ) VALUES (
            j_chalons_id, '20% sur le Festival des Lumières',
            'Bénéficiez d’un tarif préférentiel sur la billetterie du festival d’automne en réservant avec le code résident.',
            'billetterie', 'Service Culturel Municipal', '-20%', 'FESTIVAL26', 'https://billetterie.culture.fr',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
            NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days', true, 'actif',
            'Valable sur présentation d’un justificatif de domicile ou avec le code promo.', NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "bon_plan" WHERE titre = 'Gagnez 2 places pour le Cinéma Capitole' AND journal_id = j_chalons_id) THEN
        INSERT INTO "bon_plan" (
            journal_id, titre, description, categorie, partenaire, valeur, code_promo,
            lien_url, image, date_debut, date_fin, est_exclusif, statut, conditions, created_at, updated_at
        ) VALUES (
            j_chalons_id, 'Gagnez 2 places pour le Cinéma Capitole',
            'Participez au grand tirage au sort mensuel de la commune et tentez de remporter vos entrées pour le film de votre choix.',
            'concours', 'Cinéma Le Capitole', 'Jeu Concours', NULL, 'https://cinema-capitole.fr/concours',
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
            NOW() - INTERVAL '2 days', NOW() + INTERVAL '15 days', true, 'actif',
            'Tirage au sort parmi les résidents inscrits. Résultat par notification.', NOW(), NOW()
        ) RETURNING id INTO deal_concours_id;

        IF deal_concours_id IS NOT NULL THEN
            INSERT INTO "participation_concours" (bon_plan_id, nom, email, telephone, est_gagnant, created_at, updated_at)
            VALUES
                (deal_concours_id, 'Camille Dupont', 'camille.dupont@test.fr', '0601020304', false, NOW(), NOW()),
                (deal_concours_id, 'Thomas Martin', 'thomas.martin@test.fr', '0611223344', false, NOW(), NOW()),
                (deal_concours_id, 'Léa Bernard', 'lea.bernard@test.fr', '0622334455', false, NOW(), NOW());
        END IF;
    END IF;

    -- --- BONS PLANS ÉPERNAY ---
    IF NOT EXISTS (SELECT 1 FROM "bon_plan" WHERE titre = 'Visite guidée des caves de craie à -25%' AND journal_id = j_epernay_id) THEN
        INSERT INTO "bon_plan" (
            journal_id, titre, description, categorie, partenaire, valeur, code_promo,
            lien_url, image, date_debut, date_fin, est_exclusif, statut, conditions, created_at, updated_at
        ) VALUES (
            j_epernay_id, 'Visite guidée des caves de craie à -25%',
            'Explorez les galeries centenaires de l''Avenue de Champagne avec un guide conférencier et profitez d''un tarif privilégié.',
            'billetterie', 'Maison de Champagne Sparnacienne', '-25%', 'BULLE25', 'https://visites-epernay.fr',
            'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1000&q=80',
            NOW() - INTERVAL '4 days', NOW() + INTERVAL '45 days', true, 'actif',
            'Réservation préalable requise sur le site du domaine avec le code promo.', NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "bon_plan" WHERE titre = 'Grand Tirage : Panier gourmand du Terroir Sparnacien' AND journal_id = j_epernay_id) THEN
        INSERT INTO "bon_plan" (
            journal_id, titre, description, categorie, partenaire, valeur, code_promo,
            lien_url, image, date_debut, date_fin, est_exclusif, statut, conditions, created_at, updated_at
        ) VALUES (
            j_epernay_id, 'Grand Tirage : Panier gourmand du Terroir Sparnacien',
            'Tentez de remporter un panier d''exception réunissant les spécialités des producteurs de la Halle Saint-Thibault.',
            'concours', 'Commerçants de la Halle', 'Jeu Concours', NULL, 'https://epernay-terroir.fr/tirage',
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
            NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', true, 'actif',
            'Un seul participant par foyer sparnacien.', NOW(), NOW()
        ) RETURNING id INTO deal_concours_id;

        IF deal_concours_id IS NOT NULL THEN
            INSERT INTO "participation_concours" (bon_plan_id, nom, email, telephone, est_gagnant, created_at, updated_at)
            VALUES
                (deal_concours_id, 'Sophie Mercier', 'sophie.mercier@test.fr', '0608091011', false, NOW(), NOW()),
                (deal_concours_id, 'Antoine Petit', 'antoine.petit@test.fr', '0612131415', false, NOW(), NOW()),
                (deal_concours_id, 'Emma Robert', 'emma.robert@test.fr', '0616171819', false, NOW(), NOW());
        END IF;
    END IF;

    -- ==========================================================================
    -- 8. ALERTES D'INFORMATION MUNICIPALE
    -- ==========================================================================

    -- Alerte Châlons
    IF NOT EXISTS (SELECT 1 FROM "alerts" WHERE title = 'Travaux d''aménagement Place de la République' AND journal_id = j_chalons_id) THEN
        INSERT INTO "alerts" (journal_id, type, title, message, "startDate", "endDate", created_at, updated_at)
        VALUES (
            j_chalons_id, 'info', 'Travaux d''aménagement Place de la République',
            'Perturbations de circulation à prévoir en journée. Privilégiez les parkings souterrains Saint-Alpin et Hôtel de Ville.',
            CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', NOW(), NOW()
        );
    END IF;

    -- Alerte Épernay
    IF NOT EXISTS (SELECT 1 FROM "alerts" WHERE title = 'Habits de Lumière : piétonnisation de l''Avenue' AND journal_id = j_epernay_id) THEN
        INSERT INTO "alerts" (journal_id, type, title, message, "startDate", "endDate", created_at, updated_at)
        VALUES (
            j_epernay_id, 'event', 'Habits de Lumière : piétonnisation de l''Avenue',
            'L''Avenue de Champagne sera piétonnisée du vendredi 17h au dimanche 23h. Navettes gratuites depuis le parking Charles de Gaulle.',
            CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', NOW(), NOW()
        );
    END IF;

    -- ==========================================================================
    -- RÉSUMÉ D'EXÉCUTION
    -- ==========================================================================
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ JEU COMPLET DE FIXTURES MULTI-TENANT INJECTÉ AVEC SUCCÈS !';
    RAISE NOTICE '------------------------------------------------------------------------------';
    RAISE NOTICE '1. COMMUNE 1 : Châlons-en-Champagne (ID Journal : %, Commune : %)', j_chalons_id, com_chalons_id;
    RAISE NOTICE '   - Président éditorial : president.chalons@journal.fr (Password123!)';
    RAISE NOTICE '   - Admin (Modérateur)  : admin.chalons@journal.fr     (Password123!)';
    RAISE NOTICE '   - Rédacteur attitré   : redacteur.chalons@journal.fr (Password123!)';
    RAISE NOTICE '   - Contenus : 4 articles publiés, 1 attente, 1 brouillon, 4 parkings, 2 bons plans';
    RAISE NOTICE '------------------------------------------------------------------------------';
    RAISE NOTICE '2. COMMUNE 2 : Épernay (ID Journal : %, Commune : %)', j_epernay_id, com_epernay_id;
    RAISE NOTICE '   - Président éditorial : president.epernay@journal.fr (Password123!)';
    RAISE NOTICE '   - Admin (Modérateur)  : admin.epernay@journal.fr     (Password123!)';
    RAISE NOTICE '   - Rédacteur attitré   : redacteur.epernay@journal.fr (Password123!)';
    RAISE NOTICE '   - Contenus : 3 articles publiés, 1 attente, 1 brouillon, 4 parkings, 2 bons plans';
    RAISE NOTICE '------------------------------------------------------------------------------';
    RAISE NOTICE '3. CITOYENS / VISITEURS :';
    RAISE NOTICE '   - Mode invité (sans compte) : consultation publique sans authentification';
    RAISE NOTICE '   - Visiteur enregistré       : visiteur.enregistre@exemple.fr (Password123!)';
    RAISE NOTICE '   - Visiteur vérifié          : citoyen.verifie@exemple.fr     (Password123!)';
    RAISE NOTICE '==============================================================================';
END $$;
