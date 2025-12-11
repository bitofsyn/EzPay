import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { fetchMonthlyStatistics } from "../../api/calendarAPI";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../../utils/storage";

interface TransactionDetail {
  transactionId: number;
  type: "SUCCESS" | "FAILED" | "CANCELLED";
  bankName: string;
  amount: number;
  memo: string;
}

interface DailyData {
  date: string;
  details: TransactionDetail[];
}

const CalendarPage: React.FC = () => {
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(today);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [monthlyData, setMonthlyData] = useState<DailyData[]>([]);
  const navigate = useNavigate();

  const userData = getUserData();
  const userId = userData?.userId ?? null;

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        if (!userId) return;
        const result = await fetchMonthlyStatistics(String(userId), currentMonth.year(), currentMonth.month() + 1);
        console.log("result", result);
        setMonthlyData(result);
      } catch (error) {
        console.error(error);
      }
    };
    loadStatistics();
  }, [userId, currentMonth]);

  const startDay = currentMonth.startOf("month").startOf("week");
  const endDay = currentMonth.endOf("month").endOf("week");

  const rows: JSX.Element[] = [];
  let days: JSX.Element[] = [];
  let day = startDay;

  const monthIncome = monthlyData.reduce((sum, item) => {
    const successAmount = item.details?.filter(d => d.type === "SUCCESS")
      .reduce((acc, cur) => acc + (cur.amount || 0), 0) || 0;
    return sum + successAmount;
  }, 0);

  while (day.isBefore(endDay, "day")) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const dataForDay = monthlyData.find((item) => item.date === cloneDay.format("YYYY-MM-DD"));

      let totalSuccessAmount = 0;
      if (dataForDay && dataForDay.details) {
        totalSuccessAmount = dataForDay.details
          .filter((detail) => detail.type === "SUCCESS")
          .reduce((acc, cur) => acc + (cur.amount || 0), 0);
      }

      days.push(
        <div
          key={day.toString()}
          className={`relative flex flex-col items-center justify-center rounded-full cursor-pointer ${
            day.isSame(today, "day") ? "bg-yellow-300 font-bold text-white" : ""
          } ${
            selectedDate && day.isSame(selectedDate, "day") ? "bg-blue-100 text-black" : ""
          }`}
          onClick={() => setSelectedDate(cloneDay)}
          style={{ width: "48px", height: "48px" }}
        >
          <div
            className={`text-sm ${
              cloneDay.day() === 0 ? "text-red-500" :
              cloneDay.day() === 6 ? "text-blue-500" :
              "text-gray-800"
            }`}
          >
            {day.format("D")}
          </div>

          {/* 금액 표시 */}
          {totalSuccessAmount !== 0 && (
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-gray-100 text-gray-700 text-xs rounded px-2 py-0.5 shadow">
              -{totalSuccessAmount.toLocaleString()}원
            </div>
          )}
        </div>
      );
      day = day.add(1, "day");
    }
    rows.push(
      <div className="grid grid-cols-7 gap-y-6 gap-x-2 justify-center" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  const nextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"));
  };

  const prevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"));
  };

  const selectedDetails = monthlyData.find(
    (item) => item.date === selectedDate?.format("YYYY-MM-DD")
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 px-4">
      {/* 상단 네비 */}
      <div className="w-full flex justify-between items-center mb-6 max-w-6xl">
        <div className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/dashboard")}>
          EzPay
        </div>
        <div className="text-gray-500 text-sm">{today.format("YYYY년 M월 D일")}</div>
      </div>

      {/* 타이틀 */}
      <h1 className="text-3xl font-bold mb-6">월별 소비 통계</h1>

      {/* 총합 */}
      <div className="mb-6 bg-white shadow-md p-4 rounded-xl w-full max-w-2xl text-center">
        <div className="text-lg font-semibold">총 송금 금액: {monthIncome.toLocaleString()} 원</div>
      </div>

      {/* 달력 */}
      <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-2xl">
        {/* 달력 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={prevMonth}
            className="text-2xl p-2 hover:bg-gray-200 rounded-full"
          >←</button>
          <div className="text-xl font-bold">{currentMonth.format("YYYY년 M월")}</div>
          <button
            onClick={nextMonth}
            className="text-2xl p-2 hover:bg-gray-200 rounded-full"
          >→</button>
        </div>

        {/* 요일 */}
        <div className="grid grid-cols-7 text-center text-gray-500 font-semibold mb-4">
          <div className="text-red-400">일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div className="text-blue-400">토</div>
        </div>

        {/* 날짜 */}
        <div className="space-y-4">
          {rows}
        </div>
      </div>

      {/* 선택된 상세 */}
      {selectedDate && selectedDetails && (
        <div className="mt-6 bg-white p-4 rounded-2xl shadow-md w-full max-w-2xl">
          <h2 className="text-base font-bold text-gray-800 mb-3">{selectedDate.format("YYYY년 M월 D일")} 상세 내역</h2>
          <div className="space-y-2">
            {selectedDetails.details.map((detail) => (
              <div
                key={detail.transactionId}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  detail.type === "SUCCESS" ? "bg-blue-100 text-blue-600" :
                  detail.type === "FAILED" ? "bg-gray-200 text-gray-500" : "bg-orange-100 text-orange-500"
                }`}>
                  {detail.type === "SUCCESS" ? "완료" : detail.type === "FAILED" ? "실패" : "취소"}
                </span>
                <span className="text-sm text-gray-700 w-20 text-center">{detail.bankName}</span>
                <span className="text-sm font-semibold text-gray-800 w-24 text-right">
                  {detail.amount.toLocaleString()}원
                </span>
                <span className="text-xs text-gray-400 w-20 text-right truncate" title={detail.memo}>
                  {detail.memo || "-"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
