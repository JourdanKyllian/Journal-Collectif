-- ==============================================================================
-- FIXTURES DE DÉVELOPPEMENT & TEST - JOURNAL COLLECTIF (PACK COMPLET)
-- ==============================================================================
-- Ce script est STRICTEMENT réservé aux environnements de développement ou de test.
-- Il insère un jeu de données complet et réaliste pour tester l'ensemble des
-- fonctionnalités du Dashboard Admin, du Frontend et de l'Application Mobile :
--
--   1. Articles & Modération :
--      - 4 articles publiés en ligne avec images HD
--      - 2 articles "en attente" (demandes citoyennes à modérer)
--      - 1 article "brouillon" en cours de rédaction
--   2. Objets Perdus & Trouvés (declaration_objet) :
--      - Objets perdus, trouvés et réclamés/clôturés
--   3. Parkings :
--      - Équipés de capteurs IoT (temps réel) et non-équipés (affluence médiane)
--   4. Bons Plans & Billetterie :
--      - Codes promo, offres restauration, billetterie festival, grand jeu concours
--   5. Participations d'exemple au jeu concours :
--      - Permet de tester directement le tirage au sort des gagnants
--
-- Exécution recommandée :
--   - Docker : docker compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB < backend/fixtures-dev.sql
--   - Ou directement dans pgAdmin, DBeaver, TablePlus, etc.
-- ==============================================================================

DO $$
DECLARE
    target_journal_id integer;
    admin_user_id integer;
    redacteur_user_id integer;
    citoyen_user_id integer;

    cat_actu_id integer;
    cat_culture_id integer;
    cat_ecolo_id integer;
    cat_vie_id integer;

    art_id integer;
    deal_concours_id integer;
BEGIN
    -- 1. Récupération du journal cible (premier journal actif)
    SELECT id INTO target_journal_id FROM "journal" ORDER BY id ASC LIMIT 1;

    IF target_journal_id IS NULL THEN
        RAISE EXCEPTION 'Aucun journal trouvé en base. Lancez d’abord les migrations et le seed initial.';
    END IF;

    RAISE NOTICE 'Injection des fixtures pour le Journal ID : %', target_journal_id;

    -- 2. Récupération des utilisateurs pour attribuer les auteurs/déclarants
    SELECT id INTO admin_user_id FROM "users" WHERE email = 'admin@journal.fr' LIMIT 1;
    SELECT id INTO redacteur_user_id FROM "users" WHERE email = 'redacteur@journal.fr' LIMIT 1;
    SELECT id INTO citoyen_user_id FROM "users" WHERE email = 'visiteur.complet@exemple.fr' LIMIT 1;

    -- Fallback si les utilisateurs du seed n'existent pas encore
    IF redacteur_user_id IS NULL THEN redacteur_user_id := admin_user_id; END IF;
    IF citoyen_user_id IS NULL THEN citoyen_user_id := admin_user_id; END IF;

    -- 3. Récupération ou création des catégories de base
    SELECT id INTO cat_actu_id FROM "categorie" WHERE libelle = 'Actualités' AND journal_id = target_journal_id LIMIT 1;
    IF cat_actu_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (target_journal_id, 'Actualités', 'Toute l''actualité brûlante de la région', '📰', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_actu_id;
    END IF;

    SELECT id INTO cat_culture_id FROM "categorie" WHERE libelle = 'Culture' AND journal_id = target_journal_id LIMIT 1;
    IF cat_culture_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (target_journal_id, 'Culture', 'Actualités culturelles, spectacles et patrimoine', '🎭', 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_culture_id;
    END IF;

    SELECT id INTO cat_ecolo_id FROM "categorie" WHERE libelle = 'Environnement' AND journal_id = target_journal_id LIMIT 1;
    IF cat_ecolo_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (target_journal_id, 'Environnement', 'Écologie, nature et mobilités douces', '🌱', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_ecolo_id;
    END IF;

    SELECT id INTO cat_vie_id FROM "categorie" WHERE libelle = 'Vie Locale' AND journal_id = target_journal_id LIMIT 1;
    IF cat_vie_id IS NULL THEN
        INSERT INTO "categorie" (journal_id, libelle, description, icon, image_bandeau_url, is_delete, created_at, updated_at)
        VALUES (target_journal_id, 'Vie Locale', 'Vie de quartier, initiatives et vie associative', '🏘️', 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80', false, NOW(), NOW())
        RETURNING id INTO cat_vie_id;
    END IF;

    -- ==========================================================================
    -- 1. ARTICLES
    -- ==========================================================================

    -- --- A. 4 ARTICLES PUBLIÉS ---
    -- Article Publié 1 : Marché Bio
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Lancement du nouveau grand marché bio au centre-ville' AND journal_id = target_journal_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'Lancement du nouveau grand marché bio au centre-ville',
            '<p>Le cœur de notre cité bat au rythme des saveurs locales ce samedi. Plus de 35 producteurs régionaux, maraîchers, fromagers et apiculteurs ont investi la place centrale pour une première édition saluée par les riverains.</p><p>Une dynamique économique et conviviale qui s’inscrit dans le programme de valorisation des circuits courts de la municipalité.</p>',
            'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
            'publie',
            NOW() - INTERVAL '3 days',
            cat_vie_id,
            false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        IF redacteur_user_id IS NOT NULL THEN
            INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at) VALUES (redacteur_user_id, art_id, 'Rédacteur en chef', NOW());
        END IF;
    END IF;

    -- Article Publié 2 : Rénovation Théâtre
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Le Théâtre Municipal rouvre ses portes après 18 mois de rénovation' AND journal_id = target_journal_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'Le Théâtre Municipal rouvre ses portes après 18 mois de rénovation',
            '<p>Joyau du patrimoine architectural du XIXe siècle, la grande salle à l''italienne a bénéficié d''une restauration complète de ses dorures et d''une modernisation acoustique de pointe.</p><p>Le week-end inaugural débutera par une série de représentations gratuites pour tous les habitants.</p>',
            'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
            'publie',
            NOW() - INTERVAL '2 days',
            cat_culture_id,
            false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        IF redacteur_user_id IS NOT NULL THEN
            INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at) VALUES (redacteur_user_id, art_id, 'Journaliste Culture', NOW());
        END IF;
    END IF;

    -- Article Publié 3 : Pistes Cyclables
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Plan vélo : 12 nouveaux kilomètres de pistes sécurisées dès cet automne' AND journal_id = target_journal_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'Plan vélo : 12 nouveaux kilomètres de pistes sécurisées dès cet automne',
            '<p>Favoriser les mobilités décarbonées tout en garantissant la sécurité des usagers : c’est l’objectif affiché par le nouveau tracé qui reliera les faubourgs est au quartier de la gare.</p><p>Des bornes de gonflage en libre-service et des abris sécurisés complètent ce dispositif d''envergure.</p>',
            'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80',
            'publie',
            NOW() - INTERVAL '1 day',
            cat_ecolo_id,
            false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        IF redacteur_user_id IS NOT NULL THEN
            INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at) VALUES (redacteur_user_id, art_id, 'Chroniqueur Mobilités', NOW());
        END IF;
    END IF;

    -- Article Publié 4 : Concert Solidaire
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Succès retentissant pour le festival solidaire des Berges' AND journal_id = target_journal_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'Succès retentissant pour le festival solidaire des Berges',
            '<p>Plus de 4 500 spectateurs se sont rassemblés au parc fluvial pour applaudir 8 groupes locaux bénévoles. Les fonds récoltés permettront de financer le centre d’accueil hivernal pour les personnes sans-abri.</p>',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
            'publie',
            NOW() - INTERVAL '12 hours',
            cat_actu_id,
            false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        IF redacteur_user_id IS NOT NULL THEN
            INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at) VALUES (redacteur_user_id, art_id, 'Correspondant Local', NOW());
        END IF;
    END IF;

    -- --- B. 2 ARTICLES EN ATTENTE (Demandes citoyennes à modérer) ---
    -- Article En Attente 1 : Demande citoyenne - Nettoyage de la forêt
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Appel citoyen : Grande matinée citoyenne de ramassage des déchets au Bois Vert' AND journal_id = target_journal_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'Appel citoyen : Grande matinée citoyenne de ramassage des déchets au Bois Vert',
            '<p>Bonjour la rédaction ! En tant qu’habitant du quartier des Érables, je constate avec regret l’accumulation d’emballages le long des sentiers du Bois Vert. Nous organisons avec un groupe de voisins une matinée de nettoyage le dimanche 15 novembre à 10h.</p><p>Gants et sacs fournis par le collectif de quartier. Serait-il possible de relayer cet appel dans le Journal Collectif ? Merci d''avance pour votre soutien !</p>',
            'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80',
            'en_attente',
            NULL,
            cat_ecolo_id,
            false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        IF citoyen_user_id IS NOT NULL THEN
            INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at) VALUES (citoyen_user_id, art_id, 'Citoyen Contributeur', NOW());
        END IF;
    END IF;

    -- Article En Attente 2 : Demande citoyenne - Club de lecture intergénérationnel
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = 'Création d’un club de lecture intergénérationnel à la médiathèque' AND journal_id = target_journal_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'Création d’un club de lecture intergénérationnel à la médiathèque',
            '<p>Nous souhaitons lancer un rendez-vous bimensuel entre seniors et collégiens autour des romans graphiques et classiques de la littérature. Premier goûter littéraire prévu samedi 22 novembre.</p><p>Cet article a pour but d''inviter les passionnés de lecture de tous âges à nous rejoindre.</p>',
            'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
            'en_attente',
            NULL,
            cat_culture_id,
            false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        IF citoyen_user_id IS NOT NULL THEN
            INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at) VALUES (citoyen_user_id, art_id, 'Citoyen Proposant', NOW());
        END IF;
    END IF;

    -- --- C. 1 ARTICLE EN BROUILLON (Rédacteur) ---
    IF NOT EXISTS (SELECT 1 FROM "article" WHERE titre = '[Brouillon] Enquête exclusive : L’essor des commerces indépendants du centre-ville' AND journal_id = target_journal_id) THEN
        INSERT INTO "article" (
            journal_id, titre, contenu, image_couverture, statut, published_at, categorie_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            '[Brouillon] Enquête exclusive : L’essor des commerces indépendants du centre-ville',
            '<p><em>Note interne : Ajouter l’interview du président de l''association des commerçants ainsi que le graphique sur la vacance commerciale avant validation finale.</em></p><p>Alors que de nombreuses villes moyennes peinent à préserver leur commerce traditionnel, notre centre-ville enregistre une baisse de 14% des locaux vacants sur 2 ans...</p>',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
            'brouillon',
            NULL,
            cat_vie_id,
            false, NOW(), NOW()
        ) RETURNING id INTO art_id;

        IF redacteur_user_id IS NOT NULL THEN
            INSERT INTO "auteur_article" (user_id, article_id, role_contribution, created_at) VALUES (redacteur_user_id, art_id, 'Enquêteur / Rédacteur', NOW());
        END IF;
    END IF;

    -- ==========================================================================
    -- 2. OBJETS PERDUS & TROUVÉS (declaration_objet)
    -- ==========================================================================

    -- Objet 1 : Perdu (Actif / En ligne)
    IF NOT EXISTS (SELECT 1 FROM "declaration_objet" WHERE name_object = 'Sac à dos imperméable Kånken' AND journal_id = target_journal_id) THEN
        INSERT INTO "declaration_objet" (
            journal_id, type_declaration, name_object, description, lieu_presume, image_url, user_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'perdu',
            'Sac à dos imperméable Kånken',
            'Couleur ocre/moutarde. Contient une trousse d''écolier et des cours universitaires de droit. Très précieux pour les révisions !',
            'Place du Marché, près de la fontaine',
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
            citoyen_user_id,
            false, NOW() - INTERVAL '2 days', NOW()
        );
    END IF;

    -- Objet 2 : Trouvé (Actif / En ligne)
    IF NOT EXISTS (SELECT 1 FROM "declaration_objet" WHERE name_object = 'Trousseau de clés avec porte-clés Tour Eiffel' AND journal_id = target_journal_id) THEN
        INSERT INTO "declaration_objet" (
            journal_id, type_declaration, name_object, description, lieu_presume, image_url, user_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'trouve',
            'Trousseau de clés avec porte-clés Tour Eiffel',
            'Composé de 3 clés (dont une clé de boîte aux lettres et un badge Vigik noir). Déposé temporairement à la boulangerie du coin.',
            'Avenue de la République, devant l''arrêt de bus',
            'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
            citoyen_user_id,
            false, NOW() - INTERVAL '1 day', NOW()
        );
    END IF;

    -- Objet 3 : Trouvé (En attente de modération)
    IF NOT EXISTS (SELECT 1 FROM "declaration_objet" WHERE name_object = 'Smartphone iPhone 13 avec coque transparente' AND journal_id = target_journal_id) THEN
        INSERT INTO "declaration_objet" (
            journal_id, type_declaration, name_object, description, lieu_presume, image_url, user_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'trouve',
            'Smartphone iPhone 13 avec coque transparente',
            'Écran intact, fond d''écran représentant un chat tigré. Trouvé sur un banc public, batterie déchargée.',
            'Square des Jardins Publics',
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
            citoyen_user_id,
            false, NOW() - INTERVAL '5 hours', NOW()
        );
    END IF;

    -- Objet 4 : Perdu (Doudou enfant)
    IF NOT EXISTS (SELECT 1 FROM "declaration_objet" WHERE name_object = 'Peluche Lapin blanc Jellycat' AND journal_id = target_journal_id) THEN
        INSERT INTO "declaration_objet" (
            journal_id, type_declaration, name_object, description, lieu_presume, image_url, user_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'perdu',
            'Peluche Lapin blanc Jellycat',
            'Doudou fétiche de ma fille de 3 ans, oreilles longues grises. Forte valeur sentimentale.',
            'Aire de jeux du Parc Municipal',
            'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
            citoyen_user_id,
            false, NOW() - INTERVAL '3 days', NOW()
        );
    END IF;

    -- Objet 5 : Réclamé / Clôturé (Restitué au propriétaire)
    IF NOT EXISTS (SELECT 1 FROM "declaration_objet" WHERE name_object = 'Portefeuille en cuir marron avec papiers d''identité' AND journal_id = target_journal_id) THEN
        INSERT INTO "declaration_objet" (
            journal_id, type_declaration, name_object, description, lieu_presume, image_url, user_id, is_delete, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'reclame',
            'Portefeuille en cuir marron avec papiers d''identité',
            'Retrouvé par un passant et restitué à son propriétaire après vérification de la pièce d''identité à l''accueil de la mairie.',
            'Gare SNCF',
            'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
            citoyen_user_id,
            false, NOW() - INTERVAL '7 days', NOW()
        );
    END IF;

    -- ==========================================================================
    -- 3. PARKINGS
    -- ==========================================================================
    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Hôtel de Ville' AND journal_id = target_journal_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            target_journal_id, 'Parking Hôtel de Ville', 'Souterrain', 220, 168, true, NULL,
            6, '30 min gratuites', '250 m', 'Place de la Mairie', 'Capteurs connectés • Circulation fluide', true, NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Gare & Parvis' AND journal_id = target_journal_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            target_journal_id, 'Parking Gare & Parvis', 'Gare', 180, 48, true, NULL,
            2, '15 min dépose-minute', '650 m', 'Avenue de la Gare', 'Capteurs connectés • Forte affluence pendulaire', true, NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking République - Marché' AND journal_id = target_journal_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            target_journal_id, 'Parking République - Marché', 'Surface', 110, 0, false, 'moderee',
            4, 'Gratuit après 19h', '400 m', 'Place de la République', 'Non équipé • Affluence habituelle modérée', true, NOW(), NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Esplanade des Fêtes' AND journal_id = target_journal_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            target_journal_id, 'Parking Esplanade des Fêtes', 'Enclos', 90, 0, false, 'calme',
            0, 'Gratuit', '850 m', 'Esplanade du Stade', 'Non équipé • Stationnement libre', true, NOW(), NOW()
        );
    END IF;

    -- ==========================================================================
    -- 4. BONS PLANS & CONCOURS
    -- ==========================================================================
    IF NOT EXISTS (SELECT 1 FROM "bon_plan" WHERE titre = '20% sur le Festival des Lumières' AND journal_id = target_journal_id) THEN
        INSERT INTO "bon_plan" (
            journal_id, titre, description, categorie, partenaire, valeur, code_promo,
            lien_url, image, date_debut, date_fin, est_exclusif, statut, conditions, created_at, updated_at
        ) VALUES (
            target_journal_id,
            '20% sur le Festival des Lumières',
            'Bénéficiez d’un tarif préférentiel sur la billetterie du festival d’automne en réservant avec le code résident.',
            'billetterie',
            'Service Culturel Municipal',
            '-20%',
            'FESTIVAL26',
            'https://billetterie.culture.fr',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
            NOW() - INTERVAL '5 days',
            NOW() + INTERVAL '30 days',
            true,
            'actif',
            'Valable sur présentation d’un justificatif de domicile ou avec le code promo.',
            NOW(),
            NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "bon_plan" WHERE titre = 'Gagnez 2 places pour le Cinéma Capitole' AND journal_id = target_journal_id) THEN
        INSERT INTO "bon_plan" (
            journal_id, titre, description, categorie, partenaire, valeur, code_promo,
            lien_url, image, date_debut, date_fin, est_exclusif, statut, conditions, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'Gagnez 2 places pour le Cinéma Capitole',
            'Participez au grand tirage au sort mensuel de la commune et tentez de remporter vos entrées pour le film de votre choix.',
            'concours',
            'Cinéma Le Capitole',
            'Jeu Concours',
            NULL,
            'https://cinema-capitole.fr/concours',
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
            NOW() - INTERVAL '2 days',
            NOW() + INTERVAL '15 days',
            true,
            'actif',
            'Tirage au sort parmi les résidents inscrits. Résultat par notification.',
            NOW(),
            NOW()
        ) RETURNING id INTO deal_concours_id;

        IF deal_concours_id IS NOT NULL THEN
            INSERT INTO "participation_concours" (bon_plan_id, nom, email, telephone, est_gagnant, created_at, updated_at)
            VALUES
                (deal_concours_id, 'Camille Dupont', 'camille.dupont@test.fr', '0601020304', false, NOW(), NOW()),
                (deal_concours_id, 'Thomas Martin', 'thomas.martin@test.fr', '0611223344', false, NOW(), NOW()),
                (deal_concours_id, 'Léa Bernard', 'lea.bernard@test.fr', '0622334455', false, NOW(), NOW());
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "bon_plan" WHERE titre = 'Café gourmand offert dès 15 € d’addition' AND journal_id = target_journal_id) THEN
        INSERT INTO "bon_plan" (
            journal_id, titre, description, categorie, partenaire, valeur, code_promo,
            lien_url, image, date_debut, date_fin, est_exclusif, statut, conditions, created_at, updated_at
        ) VALUES (
            target_journal_id,
            'Café gourmand offert dès 15 € d’addition',
            'Les artisans torréfacteurs du centre historique vous accueillent pour une pause détente privilégiée.',
            'restauration',
            'Torréfaction Saint-Pierre',
            '1 Café Offert',
            'COLLECTIF-CAFE',
            NULL,
            'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80',
            NOW() - INTERVAL '10 days',
            NOW() + INTERVAL '60 days',
            false,
            'actif',
            'Sur présentation de l’application Journal Collectif en caisse.',
            NOW(),
            NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "bon_plan" WHERE titre = '15% de réduction chez votre maraîcher bio' AND journal_id = target_journal_id) THEN
        INSERT INTO "bon_plan" (
            journal_id, titre, description, categorie, partenaire, valeur, code_promo,
            lien_url, image, date_debut, date_fin, est_exclusif, statut, conditions, created_at, updated_at
        ) VALUES (
            target_journal_id,
            '15% de réduction chez votre maraîcher bio',
            'Encouragez le circuit court et consommez les légumes de saison récoltés à moins de 15 km de votre commune.',
            'code_promo',
            'Les Maraîchers du Val',
            '-15%',
            'BIO15LOCAL',
            NULL,
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
            NOW() - INTERVAL '3 days',
            NOW() + INTERVAL '20 days',
            false,
            'actif',
            'Dès 20 € d’achats en magasin.',
            NOW(),
            NOW()
        );
    END IF;

    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ JEU COMPLET DE FIXTURES INJECTÉ AVEC SUCCÈS POUR LE JOURNAL ID : %', target_journal_id;
    RAISE NOTICE '   - 4 Articles publiés avec images HD & auteurs';
    RAISE NOTICE '   - 2 Demandes citoyennes en attente de modération';
    RAISE NOTICE '   - 1 Article en brouillon';
    RAISE NOTICE '   - 5 Objets (perdus, trouvés et réclamés)';
    RAISE NOTICE '   - 4 Parkings (connectés IoT et manuels)';
    RAISE NOTICE '   - 4 Bons plans & 3 participants au jeu concours';
    RAISE NOTICE '==============================================================================';
END $$;
