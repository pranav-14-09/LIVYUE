"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CheckInStatus,
  DailyIntentionInstance,
  DayEntry,
  EnergyLevel,
  LivyueStoreData,
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
  exportStoreAsJSON as storageExportStoreAsJSON,
  formatDateLabel,
  formatShortDate,
  getLastDeletedDay,
  getLastDeletedIntention,
  getServerStore,
  getStore,
  getTimeOfDayPhase,
  getTodayDateString,
  getTodayEntry,
  importStoreFromJSON as storageImportStoreFromJSON,
  loadCloudStore,
  reorderIntentions as storageReorderIntentions,
  resetStore as storageResetStore,
  saveDayMessage as storageSaveDayMessage,
  saveEveningReflection as storageSaveEveningReflection,
  saveEveningTakeaways as storageSaveEveningTakeaways,
  saveStore,
  setSelectedDate as storageSetSelectedDate,
  getSelectedDate,
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
  addIntentionAction,
  deleteDayAction,
  deleteIntentionAction,
  fetchUserStoreAction,
  migrateLocalStoreAction,
  saveDayMessageAction,
  saveEveningReflectionAction,
  saveUserSettingsAction,
  syncDayEntryAction,
  updateIntentionAction,
  updateIntentionNoteAction,
  updateIntentionStatusAction,
} from "@/server/actions/entry-actions";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
  isVerified?: boolean;
}

export function useLivyue() {
  const store = useSyncExternalStore(
    subscribeToStore,
    getStore,
    getServerStore
  );

  const [liveDate, setLiveDate] = useState(() => getTodayDateString());
  const [livePhase, setLivePhase] = useState(() => getTimeOfDayPhase());
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);

  // 1. Live Time-of-Day clock & local date updater
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

            // Check if local storage had un-migrated guest entries
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

  // Helper to reconcile a single day entry in store
  const reconcileDayEntry = (entry: DayEntry) => {
    const current = getStore();
    const updatedStore: LivyueStoreData = {
      ...current,
      entries: {
        ...current.entries,
        [entry.date]: entry,
      },
    };
    saveStore(updatedStore);
  };

  // Reconciled Async Mutations
  const addMorningIntention = async (
    date: string,
    item: { title: string; category: string; description?: string }
  ): Promise<DailyIntentionInstance> => {
    const optimistic = storageAddMorningIntention(date, item);
    if (user) {
      try {
        const res = await addIntentionAction(date, item);
        if (res.success && res.data) {
          reconcileDayEntry(res.data.dayEntry);
          return res.data.intention;
        }
      } catch (err) {
        console.error("Failed to persist intention to cloud:", err);
      }
    }
    return optimistic;
  };

  const updateMorningIntention = async (
    date: string,
    item: { id: string; title: string; category: string; description?: string }
  ) => {
    storageUpdateMorningIntention(date, item);
    if (user) {
      try {
        const res = await updateIntentionAction(date, item);
        if (res.success && res.data?.dayEntry) {
          reconcileDayEntry(res.data.dayEntry);
        }
      } catch (err) {
        console.error("Failed to update intention in cloud:", err);
      }
    }
  };

  const deleteMorningIntention = async (date: string, intentionId: string) => {
    storageDeleteMorningIntention(date, intentionId);
    if (user) {
      try {
        const res = await deleteIntentionAction(date, intentionId);
        if (res.success && res.data?.dayEntry) {
          reconcileDayEntry(res.data.dayEntry);
        }
      } catch (err) {
        console.error("Failed to delete intention from cloud:", err);
      }
    }
  };

  const undoDeleteIntention = async () => {
    const lastDeleted = getLastDeletedIntention();
    const success = storageUndoDeleteIntention();
    if (success && lastDeleted && user) {
      try {
        const res = await addIntentionAction(lastDeleted.date, {
          title: lastDeleted.intention.title,
          category: lastDeleted.intention.category,
          description: lastDeleted.intention.description,
        });
        if (res.success && res.data) {
          reconcileDayEntry(res.data.dayEntry);
        }
      } catch (err) {
        console.error("Failed to re-persist undone intention to cloud:", err);
      }
    }
    return success;
  };

  const saveDayMessage = async (date: string, message: string) => {
    storageSaveDayMessage(date, message);
    if (user) {
      try {
        await saveDayMessageAction(date, message);
      } catch (err) {
        console.error("Failed to save day message to cloud:", err);
      }
    }
  };

  const deleteDayMessage = async (date: string) => {
    storageDeleteDayMessage(date);
    if (user) {
      try {
        await saveDayMessageAction(date, "");
      } catch (err) {
        console.error("Failed to delete day message in cloud:", err);
      }
    }
  };

  const updateEveningStatus = async (
    date: string,
    intentionId: string,
    status: CheckInStatus,
    note?: string
  ) => {
    storageUpdateEveningStatus(date, intentionId, status, note);
    if (user) {
      try {
        const res = await updateIntentionStatusAction(date, intentionId, status);
        if (res.success && res.data?.dayEntry) {
          reconcileDayEntry(res.data.dayEntry);
        }
        if (note !== undefined) {
          await updateIntentionNoteAction(intentionId, note);
        }
      } catch (err) {
        console.error("Failed to update status in cloud:", err);
      }
    }
  };

  const updateEveningNote = async (
    date: string,
    intentionId: string,
    note: string
  ) => {
    storageUpdateEveningNote(date, intentionId, note);
    if (user) {
      try {
        await updateIntentionNoteAction(intentionId, note);
      } catch (err) {
        console.error("Failed to update note in cloud:", err);
      }
    }
  };

  const saveEveningReflection = async (
    date: string,
    reflection: string,
    takeaways?: string,
    energyLevel?: EnergyLevel
  ) => {
    storageSaveEveningReflection(date, reflection, takeaways, energyLevel);
    if (user) {
      try {
        const res = await saveEveningReflectionAction(date, {
          eveningReflection: reflection,
          takeaways,
          energyLevel,
          completedEvening: true,
        });
        if (res.success && res.data?.dayEntry) {
          reconcileDayEntry(res.data.dayEntry);
        }
      } catch (err) {
        console.error("Failed to save evening reflection to cloud:", err);
      }
    }
  };

  const saveEveningTakeaways = async (date: string, takeaways: string) => {
    storageSaveEveningTakeaways(date, takeaways);
    if (user) {
      try {
        const res = await saveEveningReflectionAction(date, { takeaways });
        if (res.success && res.data?.dayEntry) {
          reconcileDayEntry(res.data.dayEntry);
        }
      } catch (err) {
        console.error("Failed to save takeaways to cloud:", err);
      }
    }
  };

  const deleteDay = async (date: string) => {
    const target = storageDeleteDay(date);
    if (user) {
      try {
        await deleteDayAction(date);
      } catch (err) {
        console.error("Failed to delete day in cloud:", err);
      }
    }
    return target;
  };

  const undoDeleteDay = async () => {
    const lastDeleted = getLastDeletedDay();
    const success = storageUndoDeleteDay();
    if (success && lastDeleted && user) {
      try {
        await syncDayEntryAction(lastDeleted.entry);
      } catch (err) {
        console.error("Failed to re-sync undone day to cloud:", err);
      }
    }
    return success;
  };

  const updateSettings = async (partial: Partial<UserSettings>) => {
    storageUpdateSettings(partial);
    if (user) {
      try {
        await saveUserSettingsAction(partial);
      } catch (err) {
        console.error("Failed to save settings to cloud:", err);
      }
    }
  };

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

    // Data mutations
    addMorningIntention,
    updateMorningIntention,
    deleteMorningIntention,
    undoDeleteIntention,
    saveDayMessage,
    deleteDayMessage,
    updateEveningStatus,
    updateEveningNote,
    saveEveningReflection,
    saveEveningTakeaways,
    deleteDay,
    undoDeleteDay,

    // Intentions CRUD
    addIntention: storageAddIntention,
    updateIntention: storageUpdateIntention,
    deleteIntention: storageDeleteIntention,
    toggleIntentionActive: storageToggleIntentionActive,
    reorderIntentions: storageReorderIntentions,

    // Settings
    updateSettings,

    // Backup & Reset
    exportStoreAsJSON: storageExportStoreAsJSON,
    importStoreFromJSON: storageImportStoreFromJSON,
    clearAllData: storageClearAllData,
    clearHistoryOnly: storageClearHistoryOnly,
    resetStore: storageResetStore,

    // Helpers
    formatDateLabel,
    formatShortDate,
    getTodayDateString,
  };
}
