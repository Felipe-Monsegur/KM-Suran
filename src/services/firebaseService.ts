import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Trip, FuelCharge } from '../types';

// ============ USUARIOS PERMITIDOS (LISTA BLANCA) ============
export const isUserAllowed = async (userId: string, email: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'allowedUsers', userId));
    if (userDoc.exists()) return true;

    const emailLower = email?.toLowerCase() || '';
    const emailQuery = query(collection(db, 'allowedUsers'), where('email', '==', emailLower));
    const emailSnapshot = await getDocs(emailQuery);
    return !emailSnapshot.empty;
  } catch (error) {
    console.error('Error al verificar usuario permitido:', error);
    return false;
  }
};

// ============ VIAJES (TRIPS) ============
function tripFromDoc(id: string, data: Record<string, unknown>): Trip {
  const createdAt = data.createdAt as Timestamp | undefined;
  const dateField = data.date as Timestamp | string | undefined;
  let dateStr = '';
  if (dateField instanceof Timestamp) {
    dateStr = dateField.toDate().toISOString();
  } else if (typeof dateField === 'string') {
    dateStr = dateField;
  }

  return {
    id,
    userId: String(data.userId || ''),
    userDisplayName: String(data.userDisplayName || '').trim(),
    km: Number(data.km) || 0,
    date: dateStr,
    note: String(data.note || ''),
    createdAt: createdAt?.toDate?.().toISOString() || '',
  };
}

export const getTrips = async (): Promise<Trip[]> => {
  const q = query(collection(db, 'trips'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => tripFromDoc(d.id, d.data()));
};

export const addTrip = async (trip: {
  userId: string;
  userDisplayName: string;
  km: number;
  date: string;
  note: string;
}): Promise<string> => {
  const docRef = await addDoc(collection(db, 'trips'), {
    userId: trip.userId,
    userDisplayName: trip.userDisplayName.trim(),
    km: Math.max(0, trip.km),
    date: trip.date,
    note: trip.note.trim(),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const deleteTrip = async (tripId: string): Promise<void> => {
  await deleteDoc(doc(db, 'trips', tripId));
};

export const updateTrip = async (
  tripId: string,
  trip: { userDisplayName: string; km: number; date: string; note: string }
): Promise<void> => {
  await updateDoc(doc(db, 'trips', tripId), {
    userDisplayName: trip.userDisplayName.trim(),
    km: Math.max(0, trip.km),
    date: trip.date,
    note: trip.note.trim(),
    updatedAt: Timestamp.now(),
  });
};

// ============ CARGAS DE NAFTA ============
function fuelFromDoc(id: string, data: Record<string, unknown>): FuelCharge {
  const createdAt = data.createdAt as Timestamp | undefined;
  const dateField = data.date as Timestamp | string | undefined;
  let dateStr = '';
  if (dateField instanceof Timestamp) {
    dateStr = dateField.toDate().toISOString();
  } else if (typeof dateField === 'string') {
    dateStr = dateField;
  }

  return {
    id,
    userId: String(data.userId || ''),
    userDisplayName: String(data.userDisplayName || '').trim(),
    amount: Number(data.amount) || 0,
    liters: data.liters != null ? Number(data.liters) : null,
    date: dateStr,
    note: String(data.note || ''),
    createdAt: createdAt?.toDate?.().toISOString() || '',
  };
}

export const getFuelCharges = async (): Promise<FuelCharge[]> => {
  const q = query(collection(db, 'fuelCharges'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => fuelFromDoc(d.id, d.data()));
};

export const addFuelCharge = async (charge: {
  userId: string;
  userDisplayName: string;
  amount: number;
  liters: number | null;
  date: string;
  note: string;
}): Promise<string> => {
  const docRef = await addDoc(collection(db, 'fuelCharges'), {
    userId: charge.userId,
    userDisplayName: charge.userDisplayName.trim(),
    amount: Math.max(0, charge.amount),
    liters: charge.liters != null ? Math.max(0, charge.liters) : null,
    date: charge.date,
    note: charge.note.trim(),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const deleteFuelCharge = async (chargeId: string): Promise<void> => {
  await deleteDoc(doc(db, 'fuelCharges', chargeId));
};

export const updateFuelCharge = async (
  chargeId: string,
  charge: {
    userDisplayName: string;
    amount: number;
    liters: number | null;
    date: string;
    note: string;
  }
): Promise<void> => {
  await updateDoc(doc(db, 'fuelCharges', chargeId), {
    userDisplayName: charge.userDisplayName.trim(),
    amount: Math.max(0, charge.amount),
    liters: charge.liters != null ? Math.max(0, charge.liters) : null,
    date: charge.date,
    note: charge.note.trim(),
    updatedAt: Timestamp.now(),
  });
};

// ============ CONFIGURACIÓN DE USUARIO ============
export interface UserSettings {
  theme?: 'dark' | 'light';
  headerColorDark?: string;
  headerColorLight?: string;
  headerTitle?: string;
  displayName?: string;
}

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const userSettingsSnap = await getDoc(doc(db, 'userSettings', userId));
    if (!userSettingsSnap.exists()) return null;
    const data = userSettingsSnap.data();
    return {
      theme: data.theme || null,
      headerColorDark: data.headerColorDark || null,
      headerColorLight: data.headerColorLight || null,
      headerTitle: data.headerTitle || null,
      displayName:
        data.displayName != null && String(data.displayName).trim()
          ? String(data.displayName).trim()
          : undefined,
    };
  } catch (error) {
    console.error('Error al obtener configuraciones del usuario:', error);
    return null;
  }
};

export const saveUserTheme = async (userId: string, theme: 'dark' | 'light'): Promise<void> => {
  await setDoc(
    doc(db, 'userSettings', userId),
    { userId, theme, updatedAt: Timestamp.now() },
    { merge: true }
  );
};

export const saveUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<void> => {
  await setDoc(
    doc(db, 'userSettings', userId),
    { userId, ...settings, updatedAt: Timestamp.now() },
    { merge: true }
  );
};
