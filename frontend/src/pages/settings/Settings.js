// src/pages/settings/Settings.js

import { Routes, Route } from "react-router-dom";
import UserInfo from "./UserInfo";
import PasswordChange from "./PasswordChange";
import Notification from "./Notification";
import TransferLimit from "./TransferLimit";
import Withdraw from "./Withdraw";

const Settings = () => {
    return (
        <Routes>
            <Route path="/" element={<UserInfo />} />
            <Route path="password" element={<PasswordChange />} />
            <Route path="notification" element={<Notification />} />
            <Route path="transfer-limit" element={<TransferLimit />} />
            <Route path="withdraw" element={<Withdraw />} />
        </Routes>
    );
};

export default Settings;
