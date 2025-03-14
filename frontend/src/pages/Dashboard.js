import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiMenu, FiX} from "react-icons/fi"; // 메뉴 아이콘 (열기 / 닫기)

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null); // 계좌정보
  const [balance, setBalance] = useState(0); // 계좌 잔액
  const [transactions, setTransactions] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); //데이터 로딩 상태 

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const response = await fetch("http://localhost:8080/api/user");
  //       if (!response.ok) throw new Error("데이터를 불러올 수 없음");

  //       const data = await response.json();
        
  //       if (!data.user) {
  //         navigate("/login"); // 사용자 정보가 없으면 로그인 페이지로 이동
  //         return;
  //       }

  //       setUser(data.user);
  //       setBalance(data.balance || 0);
  //       setTransactions(data.transactions || []);

  //       if (data.account) {
  //         setAccount(data.account);
  //       }
  //     } catch (error) {
  //       console.error("데이터 가져오기 오류:", error);
  //       navigate("/login"); // 오류 발생 시 로그인 페이지로 이동
  //     } finally {
  //       setIsLoading(false); // 로딩 상태 해제
  //     }
  //   };

  //   fetchUserData();
  // }, [navigate]);

  // if(isLoading) {
  //   return(
  //     <div className="min-h-screen flex items-center justify-center bg-gray-100">
  //       <p className="text-gray-600 text-lg">로딩 중...</p>
  //     </div>
  //   );
  // }

  // 하드 코딩 중
  // useEffect(() => {
  //   setTimeout(() => {
  //     setUser({name : "apple"});
  //     setAccount({bankName : "국민은행", accountNumber:"1234567899"});
  //     setBalance(150000);
  //     setTransactions([
  //       {type : "입금", amount : 50000},
  //       {type: "송금", amount : -1000},
  //     ]);
  //     setIsLoading(false);
  //   }, 1000);
  // }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      {/* 헤더 */}
      <header className="flex justify-between items-center w-full max-w-lg bg-white shadow-md p-4 rounded-lg">
        <div>
          {account ? (
            <>
              <h2 className="text-xl font-semibold">{account.bankName}</h2>
              <p className="text-sm text-gray-600">{user.name} 님</p>
            </>
          ) : (
            <h2 className="text-xl font-semibold text-gray-500">계좌 없음</h2>
          )}
        </div>
        <button onClick={() => setIsMenuOpen(true)}>
          <FiMenu size={28} className="text-gray-700" />
        </button>
      </header>

      {/* 계좌 정보 */}
      {account ? (
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 mt-6">
          <p className="text-gray-600">계좌번호</p>
          <p className="text-lg font-semibold">{account.accountNumber}</p>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-2xl font-bold">{balance.toLocaleString()} 원</p>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold">
              이체
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 mt-6 text-center">
          <p className="text-gray-600">현재 계좌가 없습니다.</p>
          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold"
            onClick={() => navigate("/create-account")}
          >
            계좌 생성하기
          </button>
        </div>
      )}

      {/* 최근 거래 내역 */}
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold">최근 거래 내역</h3>
        {transactions.length > 0 ? (
          <ul className="mt-2 space-y-3">
            {transactions.map((tx, index) => (
              <li key={index} className="p-3 border rounded-lg bg-gray-100 flex justify-between">
                <span className="font-semibold">{tx.type}</span>
                <span>{tx.amount.toLocaleString()} 원</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 mt-2">거래 내역이 없습니다.</p>
        )}
      </div>

      {/* 메뉴 모달 (너비 조정 + 자연스럽게) */}
      <div
        className={`fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 transition-opacity duration-300 
        ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 h-full bg-white shadow-lg p-4 transition-transform duration-300 
          w-64 md:w-1/4 max-w-xs transform ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()} // 배경 클릭 시 닫기 방지
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">메뉴</h2>
            <button onClick={() => setIsMenuOpen(false)}>
              <FiX size={24} className="text-gray-700" />
            </button>
          </div>
          <ul className="mt-6 space-y-4">
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">전체계좌조회</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">통합거래내역조회</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">이체</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">환경설정</li>
            <li
              className="text-red-600 hover:text-red-700 cursor-pointer"
              onClick={() => {
                localStorage.removeItem("userToken");
                navigate("/login");
              }}
            >
              로그아웃
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
