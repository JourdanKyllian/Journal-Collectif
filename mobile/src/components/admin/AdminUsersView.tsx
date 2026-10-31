import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import {
  Users as UsersIcon,
  Shield,
  ShieldAlert,
  UserCheck,
  User,
  Search,
  Plus,
  Trash2,
  Mail,
  Phone,
  CheckCircle2,
  X,
  ChevronDown,
} from 'lucide-react-native';

import { COLORS, FONTS } from '@/theme/tokens';
import { UsersService, ManagedUser, UserRole } from '@/lib/services/users.service';

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; bg: string; text: string; icon: typeof User }
> = {
  super_admin: {
    label: 'Super Admin',
    bg: '#FEF3C7',
    text: '#B45309',
    icon: ShieldAlert,
  },
  admin: {
    label: 'Administrateur',
    bg: '#DCFCE7',
    text: '#15803D',
    icon: Shield,
  },
  redacteur: {
    label: 'Rédacteur',
    bg: '#E0E7FF',
    text: '#4338CA',
    icon: UserCheck,
  },
  utilisateur: {
    label: 'Citoyen',
    bg: '#F1F5F9',
    text: '#475569',
    icon: User,
  },
};

export default function AdminUsersView() {
  const [users, setUsers] = useState<ManagedUser[]>(() => UsersService.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);

  // Formulaire d'invitation
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstname, setInviteFirstname] = useState('');
  const [inviteLastname, setInviteLastname] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('redacteur');
  const [invitePassword, setInvitePassword] = useState('Collectif2026!');

  useEffect(() => {
    return UsersService.subscribe((updated) => {
      setUsers(updated);
    });
  }, []);

  // Statistiques de l'équipe
  const superAdminCount = users.filter((u) => u.role === 'super_admin').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const redacteurCount = users.filter((u) => u.role === 'redacteur').length;
  const citoyenCount = users.filter((u) => u.role === 'utilisateur').length;

  // Filtrage
  const filteredUsers = users.filter((user) => {
    if (selectedRoleFilter !== 'all' && user.role !== selectedRoleFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = `${user.profile?.firstname ?? ''} ${user.profile?.lastname ?? ''}`.toLowerCase();
      const email = user.email.toLowerCase();
      return name.includes(q) || email.includes(q);
    }
    return true;
  });

  const handleOpenInviteModal = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInviteEmail('');
    setInviteFirstname('');
    setInviteLastname('');
    setInviteRole('redacteur');
    setInvitePassword('Collectif2026!');
    setIsInviteModalVisible(true);
  };

  const handleSaveInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      Toast.show({
        type: 'error',
        text1: 'Email invalide',
        text2: 'Veuillez saisir une adresse email valide pour ce membre.',
      });
      return;
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await UsersService.createUser({
      email: inviteEmail.trim().toLowerCase(),
      firstname: inviteFirstname.trim(),
      lastname: inviteLastname.trim(),
      role: inviteRole,
      password: invitePassword,
    });

    Toast.show({
      type: 'success',
      text1: 'Membre ajouté avec succès',
      text2: `${inviteFirstname || inviteEmail} rejoint l'équipe en tant que ${ROLE_CONFIG[inviteRole].label}.`,
    });

    setIsInviteModalVisible(false);
  };

  const handleChangeRole = (user: ManagedUser) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();

    const rolesList: { role: UserRole; label: string }[] = [
      { role: 'admin', label: 'Administrateur' },
      { role: 'redacteur', label: 'Rédacteur' },
      { role: 'utilisateur', label: 'Citoyen (Rétrograder)' },
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: `Modifier le rôle de ${user.profile?.firstname ?? user.email}`,
          options: ['Annuler', ...rolesList.map((r) => r.label)],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex > 0) {
            const selected = rolesList[buttonIndex - 1];
            await UsersService.updateUserRole(user.id, selected.role);
            Toast.show({
              type: 'success',
              text1: 'Rôle mis à jour',
              text2: `${user.email} est désormais ${selected.label}.`,
            });
          }
        }
      );
    } else {
      Alert.alert(
        'Modifier le rôle',
        `Sélectionnez le nouveau statut pour ${user.profile?.firstname ?? user.email} :`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Administrateur',
            onPress: () => UsersService.updateUserRole(user.id, 'admin'),
          },
          {
            text: 'Rédacteur',
            onPress: () => UsersService.updateUserRole(user.id, 'redacteur'),
          },
          {
            text: 'Citoyen',
            onPress: () => UsersService.updateUserRole(user.id, 'utilisateur'),
          },
        ]
      );
    }
  };

  const handleDeleteUser = (user: ManagedUser) => {
    if (user.role === 'super_admin') {
      Toast.show({
        type: 'error',
        text1: 'Action interdite',
        text2: 'Le Super Admin ne peut pas être supprimé.',
      });
      return;
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      'Révoquer l’accès',
      `Voulez-vous vraiment supprimer le compte de ${user.profile?.firstname ?? user.email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await UsersService.deleteUser(user.id);
            Toast.show({
              type: 'info',
              text1: 'Accès révoqué',
              text2: 'L’utilisateur a été retiré de l’équipe.',
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Résumé de l'équipe */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statsTitle}>Équipe de rédaction & Gestion</Text>
            <Text style={styles.statsSubtitle}>
              {superAdminCount + adminCount + redacteurCount} collaborateurs actifs • {citoyenCount} citoyens
            </Text>
          </View>
          <Pressable
            onPress={handleOpenInviteModal}
            style={styles.addBtn}
            hitSlop={6}
          >
            <Plus size={15} color={COLORS.blanc} strokeWidth={2.8} />
            <Text style={styles.addBtnText}>Nouveau membre</Text>
          </Pressable>
        </View>

        {/* Compteurs de rôles */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statCount}>{adminCount + superAdminCount}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statCount}>{redacteurCount}</Text>
            <Text style={styles.statLabel}>Rédacteurs</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statCount}>{citoyenCount}</Text>
            <Text style={styles.statLabel}>Citoyens</Text>
          </View>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher par nom, prénom ou email..."
          placeholderTextColor="#94A3B8"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
            <X size={16} color="#94A3B8" />
          </Pressable>
        )}
      </View>

      {/* Filtres par Rôle */}
      <View style={styles.filtersRow}>
        {(
          [
            { key: 'all', label: 'Tous' },
            { key: 'admin', label: 'Admins' },
            { key: 'redacteur', label: 'Rédacteurs' },
            { key: 'utilisateur', label: 'Citoyens' },
          ] as const
        ).map((filter) => {
          const isSelected = selectedRoleFilter === filter.key;
          return (
            <Pressable
              key={filter.key}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setSelectedRoleFilter(filter.key);
              }}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Liste des membres */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredUsers.map((user) => {
          const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.utilisateur;
          const RoleIcon = roleConf.icon;
          const initial = (
            (user.profile?.firstname?.[0] ?? user.email[0]) || 'U'
          ).toUpperCase();

          return (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userCardHeader}>
                {/* Avatar initiales */}
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>

                {/* Infos principales */}
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>
                      {user.profile?.firstname
                        ? `${user.profile.firstname} ${user.profile?.lastname ?? ''}`
                        : user.email.split('@')[0]}
                    </Text>
                    {user.is_phone_verified && (
                      <CheckCircle2 size={13} color="#16A34A" />
                    )}
                  </View>

                  <View style={styles.emailRow}>
                    <Mail size={12} color="#94A3B8" />
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </View>

                {/* Badge de rôle cliquable pour changer */}
                <Pressable
                  onPress={() => handleChangeRole(user)}
                  style={[styles.roleBadge, { backgroundColor: roleConf.bg }]}
                >
                  <RoleIcon size={12} color={roleConf.text} strokeWidth={2.4} />
                  <Text style={[styles.roleBadgeText, { color: roleConf.text }]}>
                    {roleConf.label}
                  </Text>
                  <ChevronDown size={11} color={roleConf.text} />
                </Pressable>
              </View>

              {/* Téléphone si renseigné */}
              {user.profile?.tel && (
                <View style={styles.telRow}>
                  <Phone size={12} color="#94A3B8" />
                  <Text style={styles.telText}>{user.profile.tel}</Text>
                </View>
              )}

              {/* Pied de carte : Actions */}
              <View style={styles.userCardFooter}>
                <Pressable
                  onPress={() => handleChangeRole(user)}
                  style={styles.changeRoleBtn}
                >
                  <Text style={styles.changeRoleBtnText}>Changer le rôle</Text>
                </Pressable>

                {user.role !== 'super_admin' && (
                  <Pressable
                    onPress={() => handleDeleteUser(user)}
                    style={styles.deleteUserBtn}
                    hitSlop={8}
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <UsersIcon size={36} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>Aucun membre trouvé</Text>
            <Text style={styles.emptyStateDesc}>
              Essayez de modifier votre recherche ou vos filtres.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modale d'ajout de membre */}
      <Modal
        visible={isInviteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsInviteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Nouveau collaborateur</Text>
              <Text style={styles.modalSubtitle}>
                Ajouter un rédacteur ou un administrateur
              </Text>
            </View>
            <Pressable
              onPress={() => setIsInviteModalVisible(false)}
              style={styles.closeBtn}
            >
              <X size={20} color={COLORS.noir} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Prénom & Nom */}
            <View style={styles.nameInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>PRÉNOM</Text>
                <TextInput
                  style={styles.textInput}
                  value={inviteFirstname}
                  onChangeText={setInviteFirstname}
                  placeholder="Ex : Maxime"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>NOM</Text>
                <TextInput
                  style={styles.textInput}
                  value={inviteLastname}
                  onChangeText={setInviteLastname}
                  placeholder="Ex : Robert"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Email */}
            <Text style={styles.inputLabel}>ADRESSE EMAIL PROFESSIONNELLE *</Text>
            <TextInput
              style={styles.textInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="redacteur@journal-collectif.fr"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Rôle */}
            <Text style={styles.inputLabel}>RÔLE ATTRIBUÉ *</Text>
            <View style={styles.roleSelectorRow}>
              {(['redacteur', 'admin'] as UserRole[]).map((r) => {
                const conf = ROLE_CONFIG[r];
                const isSelected = inviteRole === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setInviteRole(r);
                    }}
                    style={[
                      styles.roleSelectorChip,
                      isSelected && { backgroundColor: conf.bg, borderColor: COLORS.vert },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleSelectorChipText,
                        isSelected && { color: conf.text, fontWeight: '700' },
                      ]}
                    >
                      {conf.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Mot de passe temporaire */}
            <Text style={styles.inputLabel}>MOT DE PASSE TEMPORAIRE</Text>
            <TextInput
              style={styles.textInput}
              value={invitePassword}
              onChangeText={setInvitePassword}
              placeholder="Mot de passe"
              placeholderTextColor="#94A3B8"
              secureTextEntry={false}
            />
          </ScrollView>

          {/* Footer modale */}
          <View style={styles.modalFooter}>
            <Pressable
              onPress={() => setIsInviteModalVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>

            <Pressable
              onPress={handleSaveInvite}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>Enregistrer le membre</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  statsCard: {
    backgroundColor: COLORS.blanc,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 14,
    color: COLORS.noir,
  },
  statsSubtitle: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.vert,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: COLORS.blanc,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCount: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 16,
    color: COLORS.noir,
    lineHeight: 20,
  },
  statLabel: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blanc,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.montserrat,
    fontSize: 13,
    color: COLORS.noir,
    paddingVertical: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: COLORS.noir,
  },
  filterChipText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 12,
    color: '#64748B',
  },
  filterChipTextActive: {
    color: COLORS.blanc,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 40,
    gap: 10,
  },
  userCard: {
    backgroundColor: COLORS.blanc,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 15,
    color: '#334155',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 13,
    color: COLORS.noir,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  userEmail: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#64748B',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    fontWeight: '700',
  },
  telRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingLeft: 48,
  },
  telText: {
    fontFamily: FONTS.montserrat,
    fontSize: 11,
    color: '#64748B',
  },
  userCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
    marginTop: 8,
  },
  changeRoleBtn: {
    paddingVertical: 4,
  },
  changeRoleBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: COLORS.vert,
    fontWeight: '600',
  },
  deleteUserBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyStateTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
  emptyStateDesc: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#94A3B8',
  },
  // Modale
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.blanc,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: FONTS.poppinsBold,
    fontSize: 18,
    color: COLORS.noir,
  },
  modalSubtitle: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#64748B',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  nameInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 11,
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FONTS.montserrat,
    fontSize: 13,
    color: COLORS.noir,
    marginBottom: 14,
  },
  roleSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  roleSelectorChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  roleSelectorChipText: {
    fontFamily: FONTS.montserrat,
    fontSize: 12,
    color: '#64748B',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 13,
    color: '#475569',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.vert,
  },
  submitBtnText: {
    fontFamily: FONTS.montserratSemiBold,
    fontSize: 13,
    color: COLORS.blanc,
    fontWeight: '700',
  },
});

