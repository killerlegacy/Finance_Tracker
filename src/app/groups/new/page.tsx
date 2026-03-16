'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import { getSession } from '../../lib/auth';
import { createGroup } from '../../lib/groups';
import { CURRENCIES } from '../../lib/constants';

export default function NewGroupPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('₨');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSession().then((session) => {
      if (!session) { router.replace('/auth'); return; }
      setUserId(session.user.id);
      setUserName(session.user.user_metadata?.full_name || session.user.email || 'You');
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter a group name.'); return; }
    setLoading(true);
    setError('');

    const group = await createGroup(name.trim(), description.trim(), currency, userId, userName);
    if (!group) {
      setError('Failed to create group. Please try again.');
      setLoading(false);
      return;
    }
    router.push(`/groups/${group.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => router.push('/groups')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to groups
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="gradient-card p-8 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Create a Group</h1>
            <p className="text-white/80 text-sm mt-1">Set up shared expense tracking</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Group Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Hostel Room 4, Trip to Murree"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What is this group for?"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Group Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700">
              <p className="font-semibold mb-1">✨ You become the group admin</p>
              <p>You can invite others using a unique invite code after creating the group.</p>
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white gradient-card hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
