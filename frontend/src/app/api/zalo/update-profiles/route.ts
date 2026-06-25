import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// API nội bộ: Cập nhật tên + avatar cho tất cả Zalo User chưa có thông tin thật
// Gọi: GET /api/zalo/update-profiles
export async function GET() {
  const results: any[] = [];

  try {
    const convSnap = await getDocs(collection(db, 'conversations'));

    const toUpdate: any[] = [];
    convSnap.forEach(d => {
      const data = d.data();
      if (data.platform === 'Zalo' && data.customerName?.startsWith('Zalo User')) {
        toUpdate.push({ id: d.id, name: data.customerName });
      }
    });

    for (const conv of toUpdate) {
      const userId = conv.id;
      try {
        const proxyUrl = `${process.env.ZALO_PROXY_URL || 'https://nhanphuphuyen.edu.vn/zalo_proxy.php'}?user_id=${userId}`;
        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
        const data = await res.json();

        if (data.error === 0 && data.data) {
          await updateDoc(doc(db, 'conversations', userId), {
            customerName:   data.data.display_name || conv.name,
            customerAvatar: data.data.avatar || ''
          });
          results.push({ userId, status: 'ok', name: data.data.display_name });
        } else {
          results.push({ userId, status: 'error', detail: data });
        }
      } catch (e: any) {
        results.push({ userId, status: 'exception', error: e.message });
      }

      // Chờ 300ms tránh spam
      await new Promise(r => setTimeout(r, 300));
    }

    return NextResponse.json({ total: toUpdate.length, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
