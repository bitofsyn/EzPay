import api from "./api";

// 월별 통계 ()
export const fetchMonthlyStatistics = async (userId: string, year: number, month: number) => {
    const response = await api.get("/transactionsStat/monthly", {
        params : {userId, year, month},
    });
    return response.data.data ?? response.data;
}