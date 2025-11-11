import { Navigate, Outlet } from "react-router-dom";
import React from "react";
import { useAuthStore } from "../authStore"; // 경로 확인

const Root = () => {
  const { isAuthenticated, userRole } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    userRole: state.userRole,
  }));

  // 1. 로그인 X -> /login으로
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. 로그인 O -> 역할에 따라 리디렉션
  if (userRole) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  // 역할 정보가 아직 없거나, 다른 예외 상황일 경우
  return <Outlet />;
};

export default Root;