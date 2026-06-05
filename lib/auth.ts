import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

function requireAuth() {
  if (!auth) throw new Error("Firebase Auth is not configured");
  return auth;
}
import { User, UserRole } from "@/types";

const googleProvider = new GoogleAuthProvider();

export async function ensureUserDocument(
  firebaseUser: FirebaseUser
): Promise<User> {
  const userRef = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return { uid: firebaseUser.uid, ...snap.data() } as User;
  }

  const newUser: Omit<User, "uid"> & { uid: string } = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "User",
    photoURL: firebaseUser.photoURL || undefined,
    role: "customer" as UserRole,
    createdAt: serverTimestamp() as Timestamp,
    addresses: [],
  };

  await setDoc(userRef, newUser);
  return newUser as User;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const cred = await createUserWithEmailAndPassword(requireAuth(), email, password);
  const userRef = doc(db, "users", cred.user.uid);
  await setDoc(userRef, {
    uid: cred.user.uid,
    email,
    displayName,
    role: "customer",
    createdAt: serverTimestamp(),
    addresses: [],
  });
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(requireAuth(), email, password);
  await ensureUserDocument(cred.user);
  return cred.user;
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(requireAuth(), googleProvider);
  await ensureUserDocument(cred.user);
  return cred.user;
}

export async function signOut() {
  await firebaseSignOut(requireAuth());
}

export async function syncSessionCookie(idToken: string) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Failed to sync session");
  return res.json();
}

export async function clearSessionCookie() {
  await fetch("/api/auth/logout", { method: "POST" });
}
