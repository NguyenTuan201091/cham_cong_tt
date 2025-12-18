import { GoogleGenAI } from "@google/genai";
import { WeeklyPayrollItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePayroll = async (payrollData: WeeklyPayrollItem[], weekStart: string, weekEnd: string): Promise<string> => {
  try {
    const prompt = `
      Bạn là một trợ lý kế toán cho công ty xây dựng. Dưới đây là dữ liệu bảng lương từ ngày ${weekStart} đến ${weekEnd}.
      Dữ liệu JSON:
      ${JSON.stringify(payrollData.map(p => ({
        name: p.worker.name,
        role: p.worker.role,
        shifts: p.totalShifts,
        amount: p.totalAmount,
        details: p.details.map(d => ({ date: d.date, shifts: d.shifts }))
      })))}

      Vui lòng phân tích ngắn gọn bằng tiếng Việt:
      1. Tổng chi phí lương tuần này.
      2. Ai là người làm việc nhiều nhất (số công cao nhất).
      3. Có trường hợp nào làm tăng ca (trên 1 công/ngày) không? Nếu có hãy liệt kê.
      4. Đưa ra nhận xét chung về hiệu suất làm việc.
      Trình bày kết quả dưới dạng Markdown dễ đọc.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Không thể phân tích dữ liệu lúc này.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Đã xảy ra lỗi khi kết nối với AI. Vui lòng kiểm tra API Key.";
  }
};