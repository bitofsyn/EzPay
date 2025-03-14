export const createAccount = async (bankName, initialDeposit) => {
    try {
      const response = await fetch("http://localhost:8080/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
        body: JSON.stringify({ bankName, initialDeposit }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "계좌 개설 실패");
      }
      return data;
    } catch (error) {
      throw error;
    }
  };
  