// app/components/ActiveStates.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ActiveStates() {
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/states/active', { cache: 'no-store' });
    const data = await res.json();
    setStates(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div>Loading states…</div>;
  return <div>Active states: {states.join(', ')}</div>;
}
