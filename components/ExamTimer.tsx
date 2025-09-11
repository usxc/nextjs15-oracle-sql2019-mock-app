'use client';
import { useEffect, useMemo, useState } from 'react';
export default function ExamTimer({ expiresAt }: { expiresAt: string }) {
    const target = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
    const remain = Math.max(0, Math.floor((target - now) / 1000));
    const mm = String(Math.floor(remain / 60)).padStart(2, '0');
    const ss = String(remain % 60).padStart(2, '0');
    return <div className={`px-3 py-1 rounded-md text-sm border ${remain === 0 ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white'}`}>残り {mm}:{ss}</div>;
}
