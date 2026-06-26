import { NextResponse } from 'next/server';
import { aiAgent } from '@/lib/aiAgent';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { lead } = await req.json();

    if (!lead || !lead.name) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin khách hàng' }, { status: 400 });
    }

    const prompt = `
Bạn là AI tư vấn viên của trung tâm Nhân Phú. 
Nhiệm vụ: Viết một tin nhắn ngắn gọn (dưới 50 từ), thân thiện để chủ động chào hỏi và khơi gợi nhu cầu của khách hàng.
Thông tin khách hàng: Tên là ${lead.name}. 
Nhu cầu/Ghi chú: ${lead.notes || 'Đang quan tâm đến các khóa học của trung tâm'}.
Tin nhắn phải kết thúc bằng một câu hỏi mở để mời khách đến trung tâm tham quan hoặc học thử, nhằm mục đích chốt lịch hẹn.
`;

    // Gọi Gemini để sinh kịch bản
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    const generatedMessage = result.response.text();

    // Lưu vào Activity Log của CRM
    await addDoc(collection(db, 'leads', lead.id, 'activities'), {
      content: `[AI PROACTIVE] Đã tự động gửi tin nhắn tiếp cận:\n"${generatedMessage}"`,
      employeeName: 'Trợ lý AI',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: generatedMessage });
  } catch (error: any) {
    console.error('Lỗi API proactive:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
