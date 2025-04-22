import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { fetchMonthlyStatistics } from "../../api/calendarAPI";
import { useNavigate } from "react-router-dom";

const CalendarPage = () => {
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const navigate = useNavigate();

  const userStorage = localStorage.getItem("user");
  const userId = userStorage ? JSON.parse(userStorage).userId : null;

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        if (!userId) return;
        const result = await fetchMonthlyStatistics(userId, currentMonth.year(), currentMonth.month() + 1);
        setMonthlyData(result);
      } catch (error) {
        console.error(error);
      }
    };
    loadStatistics();
  }, [userId, currentMonth]);

  const startDay = currentMonth.startOf("month").startOf("week");
  const endDay = currentMonth.endOf("month").endOf("week");

  const rows = [];
  let days = [];
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
          style={{ width: "48px", height: "48px" }} // ✅ 고정
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
        <div className="mt-10 bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">{selectedDate.format("YYYY-MM-DD")} 상세 내역</h2>
          <div className="space-y-2">
            {selectedDetails.details.map((detail) => (
              <div key={detail.transactionId} className="flex justify-between border-b pb-2 text-sm">
                <span className={`font-semibold ${
                  detail.type === "SUCCESS" ? "text-blue-600" :
                  detail.type === "FAILED" ? "text-gray-400" : "text-orange-400"
                }`}>
                  {detail.type === "SUCCESS" ? "송금 완료" : detail.type === "FAILED" ? "송금 실패" : "송금 취소"}
                </span>
                <span>{detail.bankName}</span>
                <span>{detail.amount.toLocaleString()}원</span>
                <span className="text-gray-400">{detail.memo}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
