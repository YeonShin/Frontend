import React from "react";
import styled, { css } from "styled-components";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useThemeStore } from "../../store"; // 경로 확인 필요
import { useAuthStore } from "../../authStore";

// --- Styled Components ---

const SidebarContainer = styled.nav`
  width: 18%;
  height: 100vh;
  background-color: ${(props) => props.theme.navBackgroundColor};
  color: ${(props) => props.theme.subTextColor};
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 25px 0;
  position: fixed;
  top: 0;
  left: 0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s ease, border-color 0.3s ease;
`;

const SidebarTitle = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${(props) => props.theme.textColor};
  padding: 0 25px;
  margin-bottom: 50px;
  text-align: left;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

// NavItem 스타일: 활성/호버 상태 포함
const NavItem = styled.li<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 25px;
  margin: 0 15px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  color: ${(props) => props.theme.subTextColor};

  ${(props) =>
    props.isActive &&
    css`
      background-color: ${(props) => props.theme.formContainerColor};
      color: ${(props) => props.theme.highlightColor};
      font-weight: 600;
    `}

  &:hover {
    ${(props) =>
      !props.isActive &&
      css`
        background-color: ${(props) => props.theme.subTextColor}10;
        color: ${(props) => props.theme.highlightColor};
      `}
  }
`;

const Icon = styled.span`
  font-size: 28px;
  display: flex;
  align-items: center;
`;

// 하단 영역: 설정 아이콘과 테마 토글 버튼 포함
const SidebarFooter = styled.div`
  margin-top: auto; /* 상단 메뉴와 최대한 멀리 떨어짐 */
  padding: 15px 15px 20px 15px; /* 패딩 조정 */
  display: flex;
  justify-content: flex-end; /* 양쪽 끝 정렬 */
  align-items: center;
`;

//로그아웃 버튼
const LogoutButton = styled.button`
  // div 대신 button 사용
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  margin-left: 5px; // 다른 버튼과의 간격
  cursor: pointer;
  border-radius: 50%;
  color: ${(props) => props.theme.subTextColor};
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  background: none; // 배경 없음
  border: none; // 테두리 없음

  &:hover {
    background-color: ${(props) => props.theme.subTextColor}10;
    color: ${(props) => props.theme.highlightColor || "#1f6feb"};
  }

  ${Icon} {
    // Icon 스타일 상속 또는 재정의
    font-size: 26px;
  }
`;

// 하단 설정 아이콘 버튼 스타일 (NavItem과 유사하게)
const SettingsButton = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 15px; // 아이콘만 있을 경우 불필요할 수 있음
  margin-left: 5px;
  padding: 10px; // 패딩 조정
  cursor: pointer;
  border-radius: 50%;
  color: ${(props) => props.theme.subTextColor};
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;

  ${(props) =>
    props.isActive &&
    css`
      background-color: ${(props) => props.theme.formContainerColor};
      color: ${(props) => props.theme.highlightColor};
    `}

  &:hover {
    ${(props) =>
      !props.isActive &&
      css`
        background-color: ${(props) => props.theme.subTextColor}10;
        color: ${(props) => props.theme.highlightColor};
      `}
  }

  ${Icon} {
    // 내부 Icon 컴포넌트 크기 조정 (선택 사항)
    font-size: 26px;
  }
`;

// 하단 테마 토글 버튼 스타일
const ThemeToggleButtonBottom = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.subTextColor};
  border-radius: 50%;
  cursor: pointer;
  font-size: 26px;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;

  .material-symbols-outlined {
    font-size: inherit;
  }

  &:hover {
    background-color: ${(props) => props.theme.subTextColor}1A;
    border-color: ${(props) => props.theme.textColor};
    color: ${(props) => props.theme.textColor};
  }
`;

const MainContent = styled.div`
  margin-left: 18%;
  width: 82%;
  padding: 30px;
  background-color: ${(props) => props.theme.backgroundColor};
  min-height: 100vh;
  transition: background-color 0.3s ease;
`;

// --- Main Component (Lecturer) ---

const Main = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = useThemeStore((state) => state.isDark);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const logout = useAuthStore((state) => state.logout);
  const handleLogout = () => {
    logout(); // Zustand 스토어의 logout 액션 호출
    navigate("/login"); // 로그인 페이지로 이동
  };
  // 강의자 메뉴 항목
  const navItems = [
    { path: "/instructor/courses", icon: "menu_book", label: "Courses" },
    { path: "/instructor/recording", icon: "videocam", label: "Recording" },
  ];

  // 설정 메뉴 활성 상태 확인
  const settingsPath = "/instructor/setting";
  const isSettingsActive =
    location.pathname === settingsPath ||
    location.pathname.startsWith(settingsPath + "/");

  return (
    <div style={{ display: "flex" }}>
      <SidebarContainer>
        {/* 프로젝트 타이틀 (기존 Logo 대체) */}
        <SidebarTitle> </SidebarTitle>

        <NavList>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");
            return (
              <NavItem
                key={item.path}
                isActive={isActive}
                onClick={() => navigate(item.path)}
              >
                <Icon className="material-symbols-outlined">{item.icon}</Icon>
                <span>{item.label}</span>
              </NavItem>
            );
          })}
        </NavList>

        {/* 하단 영역: 설정 아이콘과 테마 토글 버튼 */}
        <SidebarFooter>
          {/* 테마 토글 버튼 */}
          <ThemeToggleButtonBottom onClick={toggleTheme} title="Toggle Theme">
            {isDark ? (
              <span className="material-symbols-outlined">light_mode</span>
            ) : (
              <span className="material-symbols-outlined">dark_mode</span>
            )}
          </ThemeToggleButtonBottom>
          {/* 설정 아이콘 버튼 */}
          <SettingsButton
            isActive={isSettingsActive}
            onClick={() => navigate(settingsPath)}
            title="Settings"
          >
            <Icon className="material-symbols-outlined">settings</Icon>
            {/* 필요시 텍스트 추가: <span>Settings</span> */}
          </SettingsButton>
          {/* 로그아웃 버튼 */}
          <LogoutButton onClick={handleLogout} title="Logout">
            <Icon className="material-symbols-outlined">logout</Icon>
          </LogoutButton>
        </SidebarFooter>
      </SidebarContainer>

      <MainContent>
        <Outlet />
      </MainContent>
    </div>
  );
};

export default Main;
