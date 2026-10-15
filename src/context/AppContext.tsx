import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, PublicProfile, Order, Toast, UserRole, VehicleType } from '../types';

export const COMMISSION_RATE = 2.5;

interface AppContextType {
  currentUser: User | null;
  currentRoleSelecting: UserRole | null;
  currentScreen: string;
  authLoading: boolean;
  users: PublicProfile[];
  publicProfiles: PublicProfile[];
  orders: Order[];
  toasts: Toast[];
  editingOrderId: string | null;
  setCurrentScreen: (screen: string) => void;
  setCurrentRoleSelecting: (role: UserRole | null) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  removeToast: (id: string) => void;
  login: (email: string, pass: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (
    name: string,
    email: string,
    phone: string,
    pass: string,
    role: UserRole,
    vehicle?: VehicleType
  ) => Promise<boolean>;
  postOrder: (
    type: string,
    orderPrice: number,
    deliveryFee: number,
    contactPhone: string,
    vehicleType: VehicleType
  ) => boolean;
  openEditFeeModal: (orderId: string) => void;
  closeEditFeeModal: () => void;
  saveNewFee: (orderId: string, fee: number) => void;
  restApproveDriver: (orderId: string, driverId: string) => void;
  restRejectDriver: (orderId: string, driverId: string) => void;
  rateDriver: (orderId: string, rating: number) => void;
  driverAcceptOrder: (orderId: string) => void;
  driverCompleteOrder: (orderId: string) => void;
  getDriverRating: (driverId: string) => string;
  getRestaurant: (id: string) => PublicProfile | User | undefined;
  getDriver: (id: string) => PublicProfile | User | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to translate Firebase Auth errors into Arabic
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    case 'auth/email-already-in-use':
      return 'البريد الإلكتروني مسجل بالفعل لمستخدم آخر.';
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة.';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة جداً. يرجى إدخال 6 أحرف أو أرقام على الأقل.';
    case 'auth/too-many-requests':
      return 'تم حظر المحاولات مؤقتاً بسبب تكرار الأخطاء. يرجى الانتظار قليلاً.';
    case 'auth/network-request-failed':
      return 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
    default:
      return 'حدث خطأ أثناء المصادقة: ' + errorCode;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentScreen, setCurrentScreen] = useState<string>('screen-role-select');
  const [currentRoleSelecting, setCurrentRoleSelecting] = useState<UserRole | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Public profiles collection (contains ONLY non-sensitive data: id, name, role, vehicle, ratings)
  const [publicProfiles, setPublicProfiles] = useState<PublicProfile[]>([]);

  // Orders list (temporarily in state as orders system phase is upcoming)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem('wasel_orders_phase1');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  });

  // Save temporary orders state
  useEffect(() => {
    try {
      localStorage.setItem('wasel_orders_phase1', JSON.stringify(orders));
    } catch {
      // fallback
    }
  }, [orders]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Subscribe ONLY to publicProfiles collection (never reading the full private users collection)
  useEffect(() => {
    if (!currentUser) {
      setPublicProfiles([]);
      return;
    }

    try {
      const pubProfilesCol = collection(db, 'publicProfiles');
      const unsubscribe = onSnapshot(
        pubProfilesCol,
        (snapshot) => {
          const profiles: PublicProfile[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PublicProfile, 'id'>),
          }));
          setPublicProfiles(profiles);
        },
        (error) => {
          console.warn('Public profiles subscription notice:', error.message);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.error('Error attaching publicProfiles listener:', e);
    }
  }, [currentUser?.id]);

  // 2. Individual real-time subscription for the authenticated user's OWN document: users/{uid}
  useEffect(() => {
    setAuthLoading(true);
    let userDocUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Clean up previous user document subscription if exists
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (!firebaseUser) {
        setCurrentUser(null);
        setCurrentScreen('screen-role-select');
        setAuthLoading(false);
        return;
      }

      try {
        // Check Custom Claims for admin verification
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const hasAdminClaim = idTokenResult.claims.admin === true;

        // Subscribe strictly to THIS user's private document: users/{uid}
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        userDocUnsubscribe = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const profile = { id: firebaseUser.uid, ...(docSnap.data() as Omit<User, 'id'>) };

              if (profile.role === 'admin') {
                if (hasAdminClaim) {
                  setCurrentUser(profile);
                  setCurrentScreen('screen-admin');
                } else {
                  console.warn('Admin access denied: Missing admin Custom Claim for UID:', firebaseUser.uid);
                  signOut(auth);
                  setCurrentUser(null);
                  setCurrentScreen('screen-role-select');
                  showToast('صلاحيات الإدارة غير مهيأة على الخادم. تم تعطيل الدخول الإداري مؤقتاً.', 'error');
                }
              } else if (profile.role === 'restaurant') {
                setCurrentUser(profile);
                setCurrentScreen('screen-restaurant');
              } else if (profile.role === 'driver') {
                setCurrentUser(profile);
                setCurrentScreen('screen-driver');
              } else {
                setCurrentUser(null);
                setCurrentScreen('screen-role-select');
              }
            } else {
              console.warn('User private document does not exist in Firestore for UID:', firebaseUser.uid);
              setCurrentUser(null);
              setCurrentScreen('screen-role-select');
            }
            setAuthLoading(false);
          },
          (err) => {
            console.error('Error reading user private document:', err);
            setCurrentUser(null);
            setCurrentScreen('screen-role-select');
            setAuthLoading(false);
          }
        );
      } catch (err) {
        console.error('Error verifying user credentials:', err);
        setAuthLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe) userDocUnsubscribe();
    };
  }, []);

  // 3. Real Sign In with Firebase Authentication
  const login = async (email: string, pass: string, role: UserRole): Promise<boolean> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const uid = cred.user.uid;

      // Handle Admin login: requires server-side Custom Claim AND matching Firestore profile
      if (role === 'admin') {
        const idTokenResult = await cred.user.getIdTokenResult();
        const hasAdminClaim = idTokenResult.claims.admin === true;

        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);

        if (!hasAdminClaim || !userSnap.exists() || userSnap.data()?.role !== 'admin') {
          await signOut(auth);
          showToast('صلاحيات الإدارة غير مهيأة على الخادم (Custom Claim أو ملف إداري مفقود). الدخول الإداري معطّل.', 'error');
          return false;
        }

        const adminProfile = { id: uid, ...(userSnap.data() as Omit<User, 'id'>) };
        setCurrentUser(adminProfile);
        showToast('تم الدخول إلى لوحة الإدارة بنجاح');
        setCurrentScreen('screen-admin');
        return true;
      }

      // Handle Restaurant or Driver login
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const profile = { id: uid, ...(userSnap.data() as Omit<User, 'id'>) };

        // Prevent admin account from logging in via public restaurant/driver portals
        if (profile.role === 'admin') {
          showToast('هذا الحساب إداري، يرجى الدخول من بوابة الإدارة.', 'error');
          await signOut(auth);
          return false;
        }

        // Verify that the user's role matches the attempted login portal
        if (profile.role !== role) {
          const roleLabel = profile.role === 'restaurant' ? 'مطعم' : 'مندوب';
          showToast(`هذا الحساب مسجل كـ (${roleLabel}). يرجى الدخول من بوابة الـ ${roleLabel}.`, 'error');
          setCurrentRoleSelecting(profile.role);
          setCurrentUser(profile);
          setCurrentScreen(profile.role === 'restaurant' ? 'screen-restaurant' : 'screen-driver');
          return true;
        }

        setCurrentUser(profile);
        showToast(`مرحباً بك يا ${profile.name}`);
        if (profile.role === 'restaurant') {
          setCurrentScreen('screen-restaurant');
        } else if (profile.role === 'driver') {
          setCurrentScreen('screen-driver');
        }
        return true;
      } else {
        showToast('لم يتم العثور على بيانات الحساب في قاعدة البيانات', 'error');
        await signOut(auth);
        return false;
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Login error:', error);
      const msg = getAuthErrorMessage(error.code || '');
      showToast(msg, 'error');
      return false;
    }
  };

  // 4. Real Registration: Writes private profile to users/{uid} AND public profile to publicProfiles/{uid}
  const register = async (
    name: string,
    email: string,
    phone: string,
    pass: string,
    role: UserRole,
    vehicle: VehicleType = 'motorcycle'
  ): Promise<boolean> => {
    // Prevent registering admin account from the public interface
    if (role === 'admin') {
      showToast('غير مسموح بإنشاء حساب إدارة من الواجهة العامة', 'error');
      return false;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !pass) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return false;
    }

    if (pass.length < 6) {
      showToast('كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام', 'error');
      return false;
    }

    try {
      // 1. Create account in Firebase Authentication
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const uid = cred.user.uid;

      // 2. Prepare safe private profile data to store in users/{uid}
      const privateProfile: Omit<User, 'id'> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: role,
        commissionOwed: 0,
        createdAt: new Date().toISOString(),
        ...(role === 'driver' ? { vehicle, ratings: [5] } : {}),
      };

      // 3. Prepare public profile data (WITHOUT email, phone, or financial data)
      const publicData: PublicProfile = {
        id: uid,
        name: name.trim(),
        role: role,
        createdAt: new Date().toISOString(),
        ...(role === 'driver' ? { vehicle, ratings: [5] } : {}),
      };

      // Write private user document (users/{uid}) FIRST (so publicProfiles rule can verify matching role)
      await setDoc(doc(db, 'users', uid), privateProfile);

      // Write public profile document (publicProfiles/{uid}) SECOND
      await setDoc(doc(db, 'publicProfiles', uid), publicData);

      showToast('تم إنشاء الحساب بنجاح وتم تسجيل دخولك!');
      const fullProfile: User = { id: uid, ...privateProfile };
      setCurrentUser(fullProfile);

      if (role === 'restaurant') {
        setCurrentScreen('screen-restaurant');
      } else {
        setCurrentScreen('screen-driver');
      }
      return true;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Registration error:', error);
      const msg = getAuthErrorMessage(error.code || '');
      showToast(msg, 'error');
      return false;
    }
  };

  // 5. Real Sign Out
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setCurrentScreen('screen-role-select');
      showToast('تم تسجيل الخروج بنجاح');
    } catch (err) {
      console.error('Logout error:', err);
      setCurrentUser(null);
      setCurrentScreen('screen-role-select');
    }
  };

  // Orders and operations (kept working for continuity during Phase 1 & 2)
  const postOrder = (
    type: string,
    orderPrice: number,
    deliveryFee: number,
    contactPhone: string,
    vehicleType: VehicleType
  ): boolean => {
    if (!currentUser || currentUser.role !== 'restaurant') return false;
    if (!type || !orderPrice || !deliveryFee || !contactPhone) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return false;
    }

    const newOrder: Order = {
      id: 'ord-' + Math.floor(1000 + Math.random() * 9000),
      restaurantId: currentUser.id,
      type,
      vehicleType,
      deliveryFee,
      orderPrice,
      contactPhone,
      status: 'pending',
      driverId: null,
      applyingDrivers: [],
      createdAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    showToast('تم نشر طلبك بنجاح في صفحة الطلبات المتاحة للمناديب!');
    return true;
  };

  const openEditFeeModal = (orderId: string) => {
    setEditingOrderId(orderId);
  };

  const closeEditFeeModal = () => {
    setEditingOrderId(null);
  };

  const saveNewFee = (orderId: string, fee: number) => {
    if (!fee || isNaN(fee) || fee <= 0) {
      showToast('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, deliveryFee: fee } : o))
    );
    showToast('تم تحديث تكلفة التوصيل بنجاح!');
    setEditingOrderId(null);
  };

  const restApproveDriver = (orderId: string, driverId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'active', driverId, applyingDrivers: [] } : o
      )
    );
    showToast('تم اختيار المندوب بنجاح! سيتم تنبيه المندوب للتوجه إليك.');
  };

  const restRejectDriver = (orderId: string, driverId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              applyingDrivers: (o.applyingDrivers || []).filter((id) => id !== driverId),
            }
          : o
      )
    );
    showToast('تم رفض المندوب، المنشور ما زال متاحاً لمناديب آخرين.');
  };

  const rateDriver = (orderId: string, rating: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, rated: true } : o))
    );

    if (order.driverId) {
      // Update in publicProfiles if available
      try {
        const pubDocRef = doc(db, 'publicProfiles', order.driverId);
        getDoc(pubDocRef).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const curr = data.ratings || [];
            updateDoc(pubDocRef, { ratings: [...curr, rating] }).catch(console.error);
          }
        });
      } catch (e) {
        console.error(e);
      }
    }
    showToast('شكراً لتقييمك!');
  };

  const driverAcceptOrder = (orderId: string) => {
    if (!currentUser || currentUser.role !== 'driver') return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const currentApplicants = order.applyingDrivers || [];
    if (!currentApplicants.includes(currentUser.id)) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, applyingDrivers: [...currentApplicants, currentUser.id] }
            : o
        )
      );
      showToast('تم إرسال طلبك للمطعم! يرجى انتظار الموافقة من قسم (مشاويري).');
    }
  };

  const driverCompleteOrder = (orderId: string) => {
    if (!currentUser || currentUser.role !== 'driver') return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'completed', completedAt: new Date().toISOString() }
          : o
      )
    );

    showToast('تم تأكيد التوصيل بنجاح وتم تسجيل العمولة. أحسنت!');
  };

  const getDriverRating = (driverId: string): string => {
    const driver = publicProfiles.find((u) => u.id === driverId) || (currentUser?.id === driverId ? currentUser : null);
    if (!driver || !driver.ratings || driver.ratings.length === 0) return '5.0';
    const sum = driver.ratings.reduce((a, b) => a + b, 0);
    return (sum / driver.ratings.length).toFixed(1);
  };

  const getRestaurant = (id: string) => {
    if (currentUser?.id === id) return currentUser;
    return publicProfiles.find((u) => u.id === id);
  };

  const getDriver = (id: string) => {
    if (currentUser?.id === id) return currentUser;
    return publicProfiles.find((u) => u.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRoleSelecting,
        currentScreen,
        authLoading,
        users: publicProfiles,
        publicProfiles,
        orders,
        toasts,
        editingOrderId,
        setCurrentScreen,
        setCurrentRoleSelecting,
        showToast,
        removeToast,
        login,
        logout,
        register,
        postOrder,
        openEditFeeModal,
        closeEditFeeModal,
        saveNewFee,
        restApproveDriver,
        restRejectDriver,
        rateDriver,
        driverAcceptOrder,
        driverCompleteOrder,
        getDriverRating,
        getRestaurant,
        getDriver,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
