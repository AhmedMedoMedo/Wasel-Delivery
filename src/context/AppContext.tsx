import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  addDoc,
  collection,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, PublicProfile, Order, Toast, UserRole, VehicleType } from '../types';
import { sound } from '../utils/sound';

// Fixed commission is strictly 1.00 EGP per successfully completed order
export const COMMISSION_PER_ORDER = 1.0;
export const COMMISSION_RATE = 1.0;

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
  isCommissionModalOpen: boolean;
  openCommissionModal: () => void;
  closeCommissionModal: () => void;
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
    vehicleType: VehicleType,
    deliveryAddress?: string
  ) => Promise<boolean>;
  openEditFeeModal: (orderId: string) => void;
  closeEditFeeModal: () => void;
  saveNewFee: (orderId: string, fee: number) => Promise<void>;
  restApproveDriver: (orderId: string, driverId: string) => Promise<void>;
  restRejectDriver: (orderId: string, driverId: string) => Promise<void>;
  restConfirmPickup: (orderId: string) => Promise<void>;
  restCancelAssignment: (orderId: string) => Promise<void>;
  driverVerifyPickup: (orderId: string, code: string) => Promise<boolean>;
  isOrderPickedUp: (order: Order) => boolean;
  rateDriver: (orderId: string, rating: number) => Promise<void>;
  driverAcceptOrder: (orderId: string) => Promise<void>;
  driverCompleteOrder: (orderId: string) => Promise<void>;
  settleCommission: (userId: string) => Promise<boolean>;
  getCommissionOwed: (user: User | null) => number;
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
    case 'permission-denied':
      return 'تم رفض الإذن من قاعدة البيانات (permission-denied). يرجى التأكد من نشر قواعد الأمان (firestore.rules) في لوحة Firebase Console.';
    case 'auth/unauthorized-domain':
      return 'هذا النطاق غير مصرح به في Firebase Auth. يرجى إضافة النطاق في Firebase Console > Authentication > Settings > Authorized domains.';
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
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState<boolean>(false);

  // Public profiles collection (contains ONLY non-sensitive data: id, name, role, vehicle, ratings)
  const [publicProfiles, setPublicProfiles] = useState<PublicProfile[]>([]);

  // Real-time Cloud Firestore Orders state
  const [orders, setOrders] = useState<Order[]>([]);

  // Track previous orders to trigger live sound and vibration chimes
  const prevOrdersRef = useRef<Order[]>([]);
  const isInitialOrdersLoad = useRef<boolean>(true);

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

  const openCommissionModal = () => setIsCommissionModalOpen(true);
  const closeCommissionModal = () => setIsCommissionModalOpen(false);

  // 1. Subscribe ONLY to publicProfiles collection
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

  // 2. Real-time Subscription to Cloud Firestore Orders collection with Live Sound Alerts
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      prevOrdersRef.current = [];
      isInitialOrdersLoad.current = true;
      return;
    }

    try {
      const ordersCol = collection(db, 'orders');
      const unsubscribe = onSnapshot(
        ordersCol,
        (snapshot) => {
          const list: Order[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Order, 'id'>),
          }));

          // Audio alerts on live changes (skip initial load chime)
          if (!isInitialOrdersLoad.current && prevOrdersRef.current.length > 0) {
            // A. Alert driver if a new pending order arrived
            if (currentUser.role === 'driver') {
              const prevIds = new Set(prevOrdersRef.current.map((o) => o.id));
              const hasNewPending = list.some((o) => !prevIds.has(o.id) && o.status === 'pending');
              if (hasNewPending) {
                sound.play('new_order');
                showToast('🔔 وصل طلب توصيل جديد متاح الآن!');
              }

              // Alert driver if they were approved for an order
              const wasApproved = list.some((o) => {
                const prev = prevOrdersRef.current.find((p) => p.id === o.id);
                return prev && prev.status === 'pending' && o.status === 'active' && o.driverId === currentUser.id;
              });
              if (wasApproved) {
                sound.play('approved');
                showToast('🎉 وافق المطعم على طلبك! توجه لاستلام الأوردر.');
              }
            }

            // B. Alert restaurant if a driver applied
            if (currentUser.role === 'restaurant') {
              const hasNewApplicant = list.some((o) => {
                if (o.restaurantId !== currentUser.id || o.status !== 'pending') return false;
                const prev = prevOrdersRef.current.find((p) => p.id === o.id);
                const prevCount = prev?.applyingDrivers?.length || 0;
                return (o.applyingDrivers?.length || 0) > prevCount;
              });
              if (hasNewApplicant) {
                sound.play('applicant');
                showToast('🛵 تقدم مندوب جديد لتوصيل أحد طلباتك!');
              }
            }
          }

          isInitialOrdersLoad.current = false;
          prevOrdersRef.current = list;
          setOrders(list);
        },
        (error) => {
          console.warn('Orders subscription notice:', error.message);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.error('Error attaching orders listener:', e);
    }
  }, [currentUser?.id, currentUser?.role]);

  // 3. Individual real-time subscription for the authenticated user's OWN document: users/{uid}
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

  // 4. Real Sign In with Firebase Authentication
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
        // If account exists in Firebase Auth but profile document was missing (e.g. earlier failed registration):
        const autoProfile: Omit<User, 'id'> = {
          name: email.split('@')[0],
          email: email.trim(),
          phone: '',
          role: role,
          commissionOwed: 0,
          createdAt: new Date().toISOString(),
          ...(role === 'driver' ? { vehicle: 'motorcycle', ratings: [0] } : {}),
        };

        try {
          await setDoc(userDocRef, autoProfile);
          await setDoc(doc(db, 'publicProfiles', uid), {
            id: uid,
            name: autoProfile.name,
            role: role,
            createdAt: autoProfile.createdAt,
            ...(role === 'driver' ? { vehicle: 'motorcycle', ratings: [0] } : {}),
          });
          const full = { id: uid, ...autoProfile };
          setCurrentUser(full);
          showToast(`تم تفعيل ملف الحساب بنجاح يا ${full.name}`);
          setCurrentScreen(role === 'restaurant' ? 'screen-restaurant' : 'screen-driver');
          return true;
        } catch {
          showToast('لم يتم العثور على بيانات الحساب في قاعدة البيانات. يرجى التأكد من نشر firestore.rules في Firebase Console.', 'error');
          await signOut(auth);
          return false;
        }
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Login error:', error);
      const msg = getAuthErrorMessage(error.code || '');
      showToast(msg, 'error');
      return false;
    }
  };

  // 5. Real Registration: New drivers start with 0.0 rating, 0 commission, and clean database linkage
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
      // Note: All drivers start strictly with rating 0 [0]
      const privateProfile: Omit<User, 'id'> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: role,
        commissionOwed: 0,
        createdAt: new Date().toISOString(),
        ...(role === 'driver' ? { vehicle, ratings: [0] } : {}),
      };

      // 3. Prepare public profile data (WITHOUT email, phone, or financial data)
      const publicData: PublicProfile = {
        id: uid,
        name: name.trim(),
        role: role,
        createdAt: new Date().toISOString(),
        ...(role === 'driver' ? { vehicle, ratings: [0] } : {}),
      };

      // STEP 1: Write private user document (users/{uid}) FIRST
      await setDoc(doc(db, 'users', uid), privateProfile);

      // STEP 2: Write public profile document (publicProfiles/{uid}) SECOND
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

  // 6. Real Sign Out
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

  // 7. Orders and Operations connected directly to Cloud Firestore with fixed 1 EGP commission
  const postOrder = async (
    type: string,
    orderPrice: number,
    deliveryFee: number,
    contactPhone: string,
    vehicleType: VehicleType,
    deliveryAddress?: string
  ): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'restaurant') return false;
    if (!type || !orderPrice || !deliveryFee || !contactPhone) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
      return false;
    }

    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    const orderData: Omit<Order, 'id'> = {
      restaurantId: currentUser.id,
      type: type.trim(),
      vehicleType,
      deliveryFee: Number(deliveryFee),
      orderPrice: Number(orderPrice),
      contactPhone: contactPhone.trim(),
      status: 'pending',
      driverId: null,
      applyingDrivers: [],
      createdAt: new Date().toISOString(),
      commission: COMMISSION_PER_ORDER,
      pickupCode,
      pickedUp: false,
      pickedUpAt: null,
      ...(deliveryAddress && deliveryAddress.trim() ? { deliveryAddress: deliveryAddress.trim() } : {}),
    };

    try {
      await addDoc(collection(db, 'orders'), orderData);
      sound.play('click');
      showToast(`تم نشر الطلب بنجاح! (العمولة الثابتة: ${COMMISSION_PER_ORDER} ج.م فقط)`);
      return true;
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error posting order:', e);
      showToast('فشل نشر الطلب: ' + e.message, 'error');
      return false;
    }
  };

  const openEditFeeModal = (orderId: string) => {
    setEditingOrderId(orderId);
  };

  const closeEditFeeModal = () => {
    setEditingOrderId(null);
  };

  const saveNewFee = async (orderId: string, fee: number) => {
    if (!fee || isNaN(fee) || fee <= 0) {
      showToast('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        deliveryFee: Number(fee),
        commission: COMMISSION_PER_ORDER,
      });
      showToast('تم تحديث تكلفة التوصيل بنجاح!');
      setEditingOrderId(null);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error updating fee:', e);
      showToast('فشل تحديث التكلفة: ' + e.message, 'error');
    }
  };

  const restApproveDriver = async (orderId: string, driverId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'active',
        driverId,
        applyingDrivers: [],
      });
      sound.play('approved');
      showToast('تم اختيار المندوب بنجاح في السحابة! سيتم تنبيه المندوب للتوجه إليك.');
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error approving driver:', e);
      showToast('فشل اختيار المندوب: ' + e.message, 'error');
    }
  };

  const restRejectDriver = async (orderId: string, driverId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        applyingDrivers: arrayRemove(driverId),
      });
      showToast('تم رفض المندوب، الطلب ما زال متاحاً لمناديب آخرين.');
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error rejecting driver:', e);
      showToast('فشل رفض المندوب: ' + e.message, 'error');
    }
  };

  const driverAcceptOrder = async (orderId: string) => {
    if (!currentUser || currentUser.role !== 'driver') return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const currentApplicants = order.applyingDrivers || [];
    if (!currentApplicants.includes(currentUser.id)) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          applyingDrivers: arrayUnion(currentUser.id),
        });
        sound.play('click');
        showToast('تم إرسال طلبك للمطعم بنجاح! يرجى انتظار الموافقة من قسم (مشاويري).');
      } catch (err: unknown) {
        const e = err as Error;
        console.error('Error accepting order:', e);
        showToast('فشل التقدم للطلب: ' + e.message, 'error');
      }
    }
  };

  const restConfirmPickup = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        pickedUp: true,
        pickedUpAt: new Date().toISOString(),
      });
      sound.play('click');
      showToast('تم تأكيد تسليم الأوردر للمندوب واستلام ثمنه بنجاح!');
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error confirming pickup:', e);
      showToast('فشل تأكيد الاستلام: ' + e.message, 'error');
    }
  };

  const restCancelAssignment = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'pending',
        driverId: null,
        applyingDrivers: [],
      });
      sound.play('click');
      showToast('تم إلغاء تعيين المندوب، والطلب أصبح متاحاً من جديد في صفحة الطلبات المتاحة.');
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error cancelling driver assignment:', e);
      showToast('فشل إلغاء تعيين المندوب: ' + e.message, 'error');
    }
  };

  const driverVerifyPickup = async (orderId: string, code: string): Promise<boolean> => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    if (order.pickupCode && order.pickupCode !== code.trim()) {
      showToast('كود الاستلام غير صحيح! يرجى دفع ثمن الأوردر للمطعم لاستلام الكود.', 'error');
      return false;
    }

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        pickedUp: true,
        pickedUpAt: new Date().toISOString(),
      });
      sound.play('click');
      showToast('تم التحقق بنجاح! الأوردر معك الآن، توجه لتسليمه للعميل.');
      return true;
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error verifying pickup code:', e);
      showToast('فشل التحقق من كود الاستلام: ' + e.message, 'error');
      return false;
    }
  };

  // Fixed 1.00 EGP commission applied and locked to both Driver and Restaurant
  const driverCompleteOrder = async (orderId: string) => {
    if (!currentUser || currentUser.role !== 'driver') return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.pickedUp === false) {
      showToast('تنبيه أمان: لا يمكنك تأكيد التوصيل قبل دفع ثمن الأوردر للمطعم وتأكيد الاستلام!', 'error');
      return;
    }

    const comm = COMMISSION_PER_ORDER; // Fixed 1.00 EGP

    try {
      // 1. Complete order in Firestore with 1.00 EGP recorded
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        commission: comm,
      });

      // 2. Lock and increment commission owed for driver (+1.00 EGP)
      await updateDoc(doc(db, 'users', currentUser.id), {
        commissionOwed: increment(comm),
      });

      // 3. Lock and increment commission owed for restaurant (+1.00 EGP)
      if (order.restaurantId) {
        try {
          await updateDoc(doc(db, 'users', order.restaurantId), {
            commissionOwed: increment(comm),
          });
        } catch (restErr) {
          console.warn('Restaurant commission increment note:', restErr);
        }
      }

      sound.play('completed');
      showToast(`تم تأكيد التوصيل بنجاح وتسجيل عمولة ${comm.toFixed(2)} ج.م للموقع في حسابك وحساب المطعم!`);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error completing order:', e);
      showToast('فشل تأكيد التوصيل: ' + e.message, 'error');
    }
  };

  const rateDriver = async (orderId: string, rating: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.driverId) return;

    try {
      // 1. Mark order as rated
      await updateDoc(doc(db, 'orders', orderId), {
        rated: true,
      });

      // 2. Append new rating to driver's public profile in Firestore
      const pubDocRef = doc(db, 'publicProfiles', order.driverId);
      await updateDoc(pubDocRef, {
        ratings: arrayUnion(rating),
      });

      // 3. Append new rating to driver's private profile in Firestore
      const userDocRef = doc(db, 'users', order.driverId);
      await updateDoc(userDocRef, {
        ratings: arrayUnion(rating),
      });

      sound.play('click');
      showToast('شكراً لتقييمك! تم حفظ التقييم في قاعدة البيانات بنجاح.');
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error rating driver:', e);
      showToast('شكراً لتقييمك!');
    }
  };

  // Admin function: Settle/Reset user commission in Firestore
  const settleCommission = async (userId: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        commissionOwed: 0,
      });
      showToast('تمت تسوية وتصفير العمولة في قاعدة البيانات بنجاح!');
      return true;
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error settling commission:', e);
      showToast('فشل تسوية العمولة: ' + e.message, 'error');
      return false;
    }
  };

  // Drivers start with 0.0 rating; only ratings > 0 are averaged
  const getDriverRating = (driverId: string): string => {
    const driver = publicProfiles.find((u) => u.id === driverId) || (currentUser?.id === driverId ? currentUser : null);
    if (!driver || !driver.ratings || driver.ratings.length === 0) return '0.0';
    const validRatings = driver.ratings.filter((r) => r > 0);
    if (validRatings.length === 0) return '0.0';
    const sum = validRatings.reduce((a, b) => a + b, 0);
    return (sum / validRatings.length).toFixed(1);
  };

  // Reactive calculation of commission owed: ensures dynamic real-time tracking (1.00 EGP per order)
  const getCommissionOwed = (user: User | null): number => {
    if (!user) return 0;
    const completedCount = orders.filter((o) => {
      if (user.role === 'restaurant') {
        return o.restaurantId === user.id && o.status === 'completed';
      } else if (user.role === 'driver') {
        return o.driverId === user.id && o.status === 'completed';
      }
      return o.status === 'completed';
    }).length;

    const fromCompletedOrders = completedCount * COMMISSION_PER_ORDER;
    return Math.max(user.commissionOwed || 0, fromCompletedOrders);
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
        isCommissionModalOpen,
        openCommissionModal,
        closeCommissionModal,
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
        restConfirmPickup,
        restCancelAssignment,
        driverVerifyPickup,
        rateDriver,
        driverAcceptOrder,
        driverCompleteOrder,
        settleCommission,
        getCommissionOwed,
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
