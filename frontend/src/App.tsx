import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes";

function App() {
  return (
    <>
      <AppRoutes/>
      {/* toast() 알림을 그리는 컨테이너. 없으면 송금 완료·잔액 부족 등 모든 토스트가 화면에 나타나지 않는다. */}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
