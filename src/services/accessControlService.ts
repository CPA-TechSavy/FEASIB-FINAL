import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

export const ADMIN_EMAILS = [
  'gerbertovirtudazo2@gmail.com',
  'suarezjohnjoebert@gmail.com',
  'suarezjohnjoebertcpa@gmail.com',
];
export const ADMIN_EMAIL = 'gerbertovirtudazo2@gmail.com';
export const ADMIN_CPA_EMAIL = 'suarezjohnjoebertcpa@gmail.com';
export const DEMO_USER_EMAIL = 'demo@nobsfeasibility.com';

export function isDemoUser(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === DEMO_USER_EMAIL || clean.startsWith('demo@');
}

export interface AccessRequestRecord {
  email: string;
  displayName: string;
  photoURL?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string | null;
  approvalToken: string;
}

export function sanitizeEmailKey(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, '_');
}

export function checkIsAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === clean);
}

/**
 * Dispatch an email notification to John Joebert Suarez (suarezjohnjoebert@gmail.com & suarezjohnjoebertcpa@gmail.com)
 * with one-click direct approval and rejection links.
 */
export async function sendAdminNotificationEmail(
  applicant: { email: string; displayName: string },
  token: string
): Promise<void> {
  const origin = window.location.origin;
  const approveUrl = `${origin}/?action=approve&email=${encodeURIComponent(
    applicant.email
  )}&token=${encodeURIComponent(token)}`;
  const rejectUrl = `${origin}/?action=reject&email=${encodeURIComponent(
    applicant.email
  )}&token=${encodeURIComponent(token)}`;

  const messageBody = `
Hello John Joebert Suarez,

A user has requested access to use and install NoBSFeasibility with their Google account:

• Name: ${applicant.displayName}
• Email: ${applicant.email}
• Requested At: ${new Date().toLocaleString()}

=========================================
ACTIONS (CLICK TO APPROVE OR REJECT):
=========================================

▶ TO ALLOW ACCESS (1-CLICK APPROVAL):
${approveUrl}

▶ TO REJECT ACCESS:
${rejectUrl}

You can also manage all approved users directly inside the NoBSFeasibility Admin Panel:
${origin}

— NoBSFeasibility Security & Authorization Engine
  `.trim();

  try {
    // Attempt asynchronous delivery to both admin email inboxes
    for (const targetEmail of ADMIN_EMAILS) {
      fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `[NoBSFeasibility Access Request] ${applicant.displayName} (${applicant.email})`,
          _template: 'box',
          _captcha: 'false',
          applicant_name: applicant.displayName,
          applicant_email: applicant.email,
          requested_at: new Date().toLocaleString(),
          one_click_approve_link: approveUrl,
          one_click_reject_link: rejectUrl,
          full_message: messageBody,
        }),
      }).catch((e) => console.warn(`Delivery notice to ${targetEmail}:`, e));
    }
  } catch (err) {
    console.warn('Background notification dispatch note:', err);
  }
}

/**
 * Check current access status for an email.
 */
export async function checkAccessStatus(
  email: string
): Promise<{ status: 'approved' | 'pending' | 'rejected' | 'not_requested'; record?: AccessRequestRecord }> {
  const cleanEmail = email.toLowerCase().trim();

  // Admin / Owner is automatically approved
  if (checkIsAdmin(cleanEmail)) {
    return { status: 'approved' };
  }

  // Demo Guest Profile does not need owner approval
  if (isDemoUser(cleanEmail)) {
    return { status: 'approved' };
  }

  const docKey = sanitizeEmailKey(cleanEmail);
  const docRef = doc(db, 'access_requests', docKey);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AccessRequestRecord;
      return { status: data.status, record: data };
    }
  } catch (err) {
    console.error('Error checking access status:', err);
  }

  return { status: 'not_requested' };
}

/**
 * Submit or retrieve an access request for a Google user.
 */
export async function requestWebsiteAccess(user: {
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<AccessRequestRecord> {
  const cleanEmail = user.email.toLowerCase().trim();

  // Demo users do not need owner approval
  if (isDemoUser(cleanEmail)) {
    return {
      email: cleanEmail,
      displayName: user.displayName || 'Demo Guest User',
      photoURL: user.photoURL || '',
      status: 'approved',
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvalToken: 'demo-token',
    };
  }

  const docKey = sanitizeEmailKey(cleanEmail);
  const docRef = doc(db, 'access_requests', docKey);

  const existing = await getDoc(docRef);
  if (existing.exists()) {
    const record = existing.data() as AccessRequestRecord;
    // If it was rejected previously or not approved, resend notification
    if (record.status === 'pending') {
      sendAdminNotificationEmail(
        { email: cleanEmail, displayName: record.displayName },
        record.approvalToken
      );
    }
    return record;
  }

  // Generate unique approval token
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36);

  const newRecord: AccessRequestRecord = {
    email: cleanEmail,
    displayName: user.displayName || cleanEmail,
    photoURL: user.photoURL || '',
    status: 'pending',
    requestedAt: new Date().toISOString(),
    approvedAt: null,
    approvalToken: token,
  };

  await setDoc(docRef, newRecord);

  // Dispatch email notification to suarezjohnjoebertcpa@gmail.com
  await sendAdminNotificationEmail(
    { email: cleanEmail, displayName: newRecord.displayName },
    token
  );

  return newRecord;
}

/**
 * Realtime listener for access approval.
 */
export function subscribeToAccessApproval(
  email: string,
  onStatusChange: (status: 'pending' | 'approved' | 'rejected') => void
): () => void {
  const cleanEmail = email.toLowerCase().trim();
  if (checkIsAdmin(cleanEmail) || isDemoUser(cleanEmail)) {
    onStatusChange('approved');
    return () => {};
  }

  const docKey = sanitizeEmailKey(cleanEmail);
  const docRef = doc(db, 'access_requests', docKey);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AccessRequestRecord;
        onStatusChange(data.status);
      }
    },
    (error) => {
      console.error('Access status listener error:', error);
    }
  );
}

/**
 * Process one-click approval/rejection from Gmail link in URL.
 */
export async function handleUrlApprovalAction(): Promise<{
  handled: boolean;
  action?: 'approved' | 'rejected';
  email?: string;
  error?: string;
}> {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const targetEmail = urlParams.get('email');
  const token = urlParams.get('token');

  if (!action || !targetEmail || !token || (action !== 'approve' && action !== 'reject')) {
    return { handled: false };
  }

  const cleanEmail = targetEmail.toLowerCase().trim();
  const docKey = sanitizeEmailKey(cleanEmail);
  const docRef = doc(db, 'access_requests', docKey);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { handled: true, error: 'Access request not found.' };
    }

    const data = snap.data() as AccessRequestRecord;
    if (data.approvalToken !== token) {
      return { handled: true, error: 'Security approval token is invalid or has expired.' };
    }

    const newStatus: 'approved' | 'rejected' = action === 'approve' ? 'approved' : 'rejected';
    await updateDoc(docRef, {
      status: newStatus,
      approvedAt: new Date().toISOString(),
    });

    // Remove action parameters from URL
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    return {
      handled: true,
      action: newStatus,
      email: cleanEmail,
    };
  } catch (err: any) {
    console.error('Error processing approval from URL:', err);
    return { handled: true, error: err?.message || 'Error updating approval status.' };
  }
}

/**
 * Retrieve all access requests (for John Joebert Suarez CPA Admin view)
 */
export async function fetchAllAccessRequests(): Promise<AccessRequestRecord[]> {
  try {
    const colRef = collection(db, 'access_requests');
    const snap = await getDocs(colRef);
    const results: AccessRequestRecord[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as AccessRequestRecord);
    });
    // Sort pending first, then by requestedAt desc
    return results.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
    });
  } catch (err) {
    console.error('Error fetching all access requests:', err);
    return [];
  }
}

/**
 * Realtime listener for all access requests (for owner/admin real-time approval)
 */
export function subscribeToAllAccessRequests(
  callback: (requests: AccessRequestRecord[]) => void
): () => void {
  const colRef = collection(db, 'access_requests');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const results: AccessRequestRecord[] = [];
      snapshot.forEach((docSnap) => {
        results.push(docSnap.data() as AccessRequestRecord);
      });
      // Sort pending first, then by requestedAt desc
      results.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
      });
      callback(results);
    },
    (err) => {
      console.warn('Error subscribing to all access requests:', err);
    }
  );
}

/**
 * Manually update access status by admin with 1 click
 */
export async function setAccessStatus(
  email: string,
  newStatus: 'approved' | 'rejected'
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const docKey = sanitizeEmailKey(cleanEmail);
  const docRef = doc(db, 'access_requests', docKey);
  await setDoc(
    docRef,
    {
      status: newStatus,
      approvedAt: newStatus === 'approved' ? new Date().toISOString() : null,
    },
    { merge: true }
  );
}

/**
 * Pre-approve a Google account before they even log in
 */
export async function preApproveGoogleAccount(
  email: string,
  displayName?: string
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const docKey = sanitizeEmailKey(cleanEmail);
  const docRef = doc(db, 'access_requests', docKey);
  await setDoc(
    docRef,
    {
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      photoURL: '',
      status: 'approved',
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvalToken: 'pre-approved',
    },
    { merge: true }
  );
}
