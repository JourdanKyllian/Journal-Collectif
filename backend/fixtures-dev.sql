-- ==============================================================================
-- FIXTURES DE DÉVELOPPEMENT & TEST - JOURNAL COLLECTIF
-- ==============================================================================
-- Ce script est STRICTEMENT réservé aux environnements de développement ou de test.
-- Il insère des données d'exemple pour :
--   1. Les Parkings (équipés capteurs IoT et non-équipés)
--   2. Les Bons Plans (billetterie, concours, restauration, code promo)
--   3. Des participations d'exemple pour tester le tirage au sort des concours
--
-- Exécution recommandée (exemples) :
--   - Via terminal psql : psql -U postgres -d journal_collectif -f fixtures-dev.sql
--   - Via Docker : docker exec -i <nom_conteneur_postgres> psql -U <user> -d <db> < fixtures-dev.sql
--   - Ou directement copier-coller dans votre outil SQL (pgAdmin, DBeaver, etc.)
-- ==============================================================================

DO $$
DECLARE
    target_journal_id integer;
    deal_concours_id integer;
BEGIN
    -- 1. Récupération du journal par défaut
    SELECT id INTO target_journal_id FROM "journal" ORDER BY id ASC LIMIT 1;

    IF target_journal_id IS NULL THEN
        RAISE EXCEPTION 'Aucun journal trouvé en base. Assurez-vous d’avoir exécuté les migrations et initialisé un journal.';
    END IF;

    RAISE NOTICE 'Injection des fixtures de test pour le journal ID : %', target_journal_id;

    -- ==========================================================================
    -- 1. PARKINGS
    -- ==========================================================================
    -- Parking 1 : Souterrain équipé de capteurs
    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Hôtel de Ville' AND journal_id = target_journal_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            target_journal_id, 'Parking Hôtel de Ville', 'Souterrain', 220, 168, true, NULL,
            6, '30 min gratuites', '250 m', 'Place de la Mairie', 'Capteurs connectés • Circulation fluide', true, NOW(), NOW()
        );
    END IF;

    -- Parking 2 : Gare équipé de capteurs
    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking Gare & Parvis' AND journal_id = target_journal_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            target_journal_id, 'Parking Gare & Parvis', 'Gare', 180, 48, true, NULL,
            2, '15 min dépose-minute', '650 m', 'Avenue de la Gare', 'Capteurs connectés • Forte affluence pendulaire', true, NOW(), NOW()
        );
    END IF;

    -- Parking 3 : Surface non équipé (avec estimation d'affluence médiane)
    IF NOT EXISTS (SELECT 1 FROM "parking" WHERE name = 'Parking République - Marché' AND journal_id = target_journal_id) THEN
        INSERT INTO "parking" (
            journal_id, name, type, total, available, has_sensors, affluence_mediane,
            ev_spots, free_grace_period, distance, address, status_note, is_active, created_at, updated_at
        ) VALUES (
            target_journal_id, 'Parking République - Marché', 'Surface', 110, 0, false, 'moderee',
            4, 'Gratuit après 19h', '400 m', 'Place de la République', 'Non équipé • Affluence habituelle modérée', true, NOW(), NOW()
        );
    END IF;

    -- Parking 4 : Enclos non équipé
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
    -- 2. BONS PLANS
    -- ==========================================================================
    -- Bon Plan 1 : Billetterie Festival
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

    -- Bon Plan 2 : Grand Concours avec tirage au sort
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

        -- 3. Participations fictives au concours pour tester le tirage au sort
        IF deal_concours_id IS NOT NULL THEN
            INSERT INTO "participation_concours" (bon_plan_id, nom, email, telephone, est_gagnant, created_at, updated_at)
            VALUES
                (deal_concours_id, 'Camille Dupont', 'camille.dupont@test.fr', '0601020304', false, NOW(), NOW()),
                (deal_concours_id, 'Thomas Martin', 'thomas.martin@test.fr', '0611223344', false, NOW(), NOW()),
                (deal_concours_id, 'Léa Bernard', 'lea.bernard@test.fr', '0622334455', false, NOW(), NOW());
        END IF;
    END IF;

    -- Bon Plan 3 : Restauration
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

    -- Bon Plan 4 : Code promo commerce local
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

    RAISE NOTICE '✅ Fixtures de développement injectées avec succès !';
END $$;

