'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Hash, Loader2, Users, CheckCircle } from 'lucide-react';
import { getSession } from '../../lib/auth';
import { getGroupByInviteCode, joinGroup, isAlreadyMember, getGroupMembers } from '../../lib/groups';

const PENDING_INVITE_KEY = 'ft_pending_invite';

function JoinGroupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [groupPreview, setGroupPreview] = useState<{
    name: string;
    description: string;
    memberCount: number;
    currency: string;
    id: string;
  } | null>(null);

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) setCode(urlCode.toUpperCase());

    getSession().then((session) => {
      if (!session) {
        // Save invite code to localStorage so we can auto-join after auth+onboarding
        if (urlCode) {
          localStorage.setItem(PENDING_INVITE_KEY, urlCode.toUpperCase());
        }
        // Redirect to auth, after login they'll come back here
        router.replace(`/auth?mode=login&redirect=/groups/join${urlCode ? `?code=${urlCode}` : ''}`);
        return;
      }

      setUserId(session.user.id);
      setUserName(session.user.user_metadata?.full_name || session.user.email || 'You');

      // Auto-lookup if code is in URL
      if (urlCode) {
        handleLookup(urlCode.toUpperCase(), session.user.id);
      }
    });
  }, [router, searchParams]);

  const handleLookup = async (lookupCode: string, uid?: string) => {
    if (!lookupCode || lookupCode.length < 3) return;
    setChecking(true);
    setError('');
    setGroupPreview(null);

    const group = await getGroupByInviteCode(lookupCode);
    if (!group) {
      setError('No group found with this invite code. Please check and try again.');
      setChecking(false);
      return;
    }

    const currentUserId = uid || userId;
    const alreadyIn = await isAlreadyMember(group.id, currentUserId);
    if (alreadyIn) {
      // Already a member — just redirect to the group
      router.replace(`/groups/${group.id}`);
      return;
    }

    const members = await getGroupMembers(group.id);
    setGroupPreview({
      name: group.name,
      description: group.description,
      memberCount: members.length,
      currency: group.currency,
      id: group.id,
    });
    setChecking(false);
  };

  const handleJoin = async () => {
    if (!groupPreview) return;
    setLoading(true);
    const ok = await joinGroup(groupPreview.id, userId, userName);
    if (!ok) {
      setError('Failed to join group. Please try again.');
      setLoading(false);
      return;
    }
    // Clear pending invite from localStorage
    localStorage.removeItem(PENDING_INVITE_KEY);
    router.push(`/groups/${groupPreview.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/groups')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to groups
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-8 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Hash className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Join a Group</h1>
            <p className="text-white/80 text-sm mt-1">Enter your invite code below</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Invite Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. STU-X4K"
                  maxLength={7}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono tracking-widest uppercase"
                />
                <button
                  onClick={() => handleLookup(code)}
                  disabled={checking || code.length < 3}
                  className="px-4 py-3 gradient-card text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:shadow-md transition-all"
                >
                  {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {groupPreview && (
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-card rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {groupPreview.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{groupPreview.name}</p>
                    {groupPreview.description && (
                      <p className="text-xs text-slate-500">{groupPreview.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>{groupPreview.memberCount} member{groupPreview.memberCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-slate-600">
                    Currency: <span className="font-semibold">{groupPreview.currency}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Group found! Click below to join.
                </div>
              </div>
            )}

            {groupPreview && (
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white gradient-card hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Joining...' : `Join ${groupPreview.name}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <JoinGroupForm />
    </Suspense>
  );
}
