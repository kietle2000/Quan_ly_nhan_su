const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const tools = [
    {
      functionDeclarations: [
        {
          name: 'bookAppointment',
          description: 'Đặt lịch hẹn',
          parameters: {
            type: 'OBJECT',
            properties: {
              customerName: { type: 'STRING', description: 'Tên khách hàng' },
              appointmentTime: { type: 'STRING', description: 'Thời gian hẹn' },
            },
            required: ['customerName', 'appointmentTime'],
          },
        }
      ],
    },
  ];

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro', tools });
    const chat = model.startChat();
    const result = await chat.sendMessage("Xin chào, tôi muốn đặt lịch");
    console.log("Success:", result.response.text());
    if (result.response.functionCalls()) {
      console.log("Function call:", result.response.functionCalls());
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
