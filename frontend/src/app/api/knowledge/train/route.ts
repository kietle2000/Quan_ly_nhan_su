import { NextResponse } from 'next/server';
import { aiAgent } from '@/lib/aiAgent';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, prompt } = body;

    if (!text) {
      return NextResponse.json({ success: false, error: 'Thiếu nội dung' }, { status: 400 });
    }

    const docId = `manual-train-${uuidv4().substring(0, 8)}`;
    
    // Nạp dữ liệu vào Pinecone
    const result = await aiAgent.trainDocument(docId, text);

    return NextResponse.json({ success: true, chunks: result.chunks });
  } catch (error: any) {
    console.error('Lỗi khi nạp kiến thức AI:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
