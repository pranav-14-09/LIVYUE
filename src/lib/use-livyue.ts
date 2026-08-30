"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CheckInStatus,
  EnergyLevel,
  Intention,
  IntentionCategory,
  UserSettings,
} from "./types";
import {
  addIntention as storageAddIntention,
  addMorningIntention as storageAddMorningIntention,
  checkReturningStatus,
  clearAllData as storageClearAllData,
  clearHistoryOnly as storageClearHistoryOnly,
  deleteDay as storageDeleteDay,
  deleteDayMessage as storageDeleteDayMessage,
  deleteIntention as storageDeleteIntention,
  deleteMorningIntention as storageDeleteMorningIntention,
  exportStoreAsJSON,
  getSelectedDate,
  getServerStore,
  getStore,
  getTimeOfDayPhase,
  getTodayDateString,
  getTodayEntry,
  importStoreFromJSON,
  loadCloudStore,
  reorderIntentions as storageReorderIntentions,
  resetStore as storageResetStore,
  saveDayMessage as storageSaveDayMessage,
  saveEveningReflection as storageSaveEveningReflection,
  saveEveningTakeaways as storageSaveEveningTakeaways,
  setSelectedDate as storageSetSelectedDate,
  setUserStorageScope,
  subscribeToStore,
  toggleIntentionActive as storageToggleIntentionActive,
  undoDeleteDay as storageUndoDeleteDay,
  undoDeleteIntention as storageUndoDeleteIntention,
  updateEveningNote as storageUpdateEveningNote,
  updateEveningStatus as storageUpdateEveningStatus,
  updateIntention as storageUpdateIntention,
  updateMorningIntention as storageUpdateMorningIntention,
  updateSettings as storageUpdateSettings,
} from "./storage";
import { createClient } from "./supabase/client";
import {
  fetchUserStoreAction,
  migrateLocalStoreAction,
} from "@/server/actions/entry-actions";
import { signOutAction } from "@/server/actions/auth-actions";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
  isVerified: boolean;
}

export function useLivyue() {
  const store = useSyncExternalStore(
    subscribeToStore,
    getStore,
    getServerStore
  );

  // Dynamic live clock for midnight rollover and phase changes
  const [liveDate, setLiveDate] = useState(() => getTodayDateString(new Date()));
  const [livePhase, setLivePhase] = useState(() => getTimeOfDayPhase(new Date()));
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);

  // 1. Clock interval
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const newDateStr = getTodayDateString(now);
      const newPhase = getTimeOfDayPhase(now);

      setLiveDate((prev) => (prev !== newDateStr ? newDateStr : prev));
      setLivePhase((prev) => (prev !== newPhase ? newPhase : prev));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Auth & Cloud Store Initialization
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const initAuthAndStore = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser && isMounted) {
          setUserStorageScope(authUser.id);
          setUser({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || "",
            isVerified: Boolean(authUser.email_confirmed_at),
          });

          // Fetch cloud entries
          const serverStoreRes = await fetchUserStoreAction();
          if (serverStoreRes.success && serverStoreRes.data && isMounted) {
            loadCloudStore(serverStoreRes.data);

            // Check if local storage has guest entries that need migrating to cloud
            const localStore = getStore();
            const localCount = Object.keys(localStore.entries || {}).length;
            const cloudCount = Object.keys(serverStoreRes.data.entries || {}).length;

            if (localCount > cloudCount) {
              const migrationRes = await migrateLocalStoreAction(localStore);
              if (migrationRes.success && migrationRes.data?.migratedCount) {
                setMigrationNotice(
                  `Successfully migrated ${migrationRes.data.migratedCount} local days to your cloud account.`
                );
                setTimeout(() => setMigrationNotice(null), 5000);
              }
            }
          }
        } else if (isMounted) {
          setUserStorageScope(null);
          setUser(null);
        }
      } catch (err) {
        console.warn("Cloud initialization note:", err);
      } finally {
        if (isMounted) setIsCloudLoaded(true);
      }
    };

    initAuthAndStore();

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && isMounted) {
        setUserStorageScope(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || "",
          isVerified: Boolean(session.user.email_confirmed_at),
        });
        const serverStoreRes = await fetchUserStoreAction();
        if (serverStoreRes.success && serverStoreRes.data && isMounted) {
          loadCloudStore(serverStoreRes.data);
        }
      } else if (isMounted) {
        setUserStorageScope(null);
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const selectedDate = getSelectedDate();
  const activeDate = selectedDate || liveDate;

  const todayEntry = useMemo(
    () => getTodayEntry(store, activeDate),
    [store, activeDate]
  );

  const returningStatus = useMemo(
    () => checkReturningStatus(store),
    [store]
  );

  return {
    store,
    isLoaded: true,
    isCloudLoaded,
    user,
    migrationNotice,
    todayDate: activeDate,
    liveDate,
    selectedDate,
    setSelectedDate: (date: string | null) => storageSetSelectedDate(date),
    isHistoricalDate: Boolean(selectedDate && selectedDate !== liveDate),
    currentPhase: livePhase,
    todayEntry,
    returningStatus,

    // Auth actions
    signOut: () => signOutAction(),

    // Morning Operations
    addMorningIntention: (
      date: string,
      item: { title: string; category: string; description?: string }
    ) => storageAddMorningIntention(date, item),
    updateMorningIntention: (
      date: string,
      item: { id: string; title: string; category: string; description?: string }
    ) => storageUpdateMorningIntention(date, item),
    deleteMorningIntention: (date: string, intentionId: string) =>
      storageDeleteMorningIntention(date, intentionId),
    undoDeleteIntention: () => storageUndoDeleteIntention(),
    saveDayMessage: (date: string, message: string) =>
      storageSaveDayMessage(date, message),
    deleteDayMessage: (date: string) => storageDeleteDayMessage(date),

    // Evening Operations
    updateEveningStatus: (
      date: string,
      intentionId: string,
      status: CheckInStatus,
      note?: string
    ) => storageUpdateEveningStatus(date, intentionId, status, note),
    updateEveningNote: (date: string, intentionId: string, note: string) =>
      storageUpdateEveningNote(date, intentionId, note),
    saveEveningReflection: (
      date: string,
      reflection: string,
      takeaways?: string,
      energyLevel?: EnergyLevel
    ) => storageSaveEveningReflection(date, reflection, takeaways, energyLevel),
    saveEveningTakeaways: (date: string, takeaways: string) =>
      storageSaveEveningTakeaways(date, takeaways),

    // History Operations
    deleteDay: (date: string) => storageDeleteDay(date),
    undoDeleteDay: () => storageUndoDeleteDay(),

    // Global Intentions Library Operations
    addIntention: (item: {
      title: string;
      description?: string;
      category: IntentionCategory;
    }) => storageAddIntention(item),
    updateIntention: (intention: Intention) =>
      storageUpdateIntention(intention),
    toggleIntentionActive: (id: string) =>
      storageToggleIntentionActive(id),
    reorderIntentions: (orderedIds: string[]) =>
      storageReorderIntentions(orderedIds),
    deleteIntention: (id: string) => storageDeleteIntention(id),

    // Settings & Backups
    updateSettings: (partial: Partial<UserSettings>) =>
      storageUpdateSettings(partial),
    exportData: () => exportStoreAsJSON(),
    importData: (jsonStr: string) => importStoreFromJSON(jsonStr),
    clearAllData: () => storageClearAllData(),
    clearHistoryOnly: () => storageClearHistoryOnly(),
    resetAll: () => storageResetStore(),
  };
}
