import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import styled from "styled-components";
import { auth } from "../../../src/firebase";
import { useThemeStore } from "../../store";
import { useNavigate } from "react-router-dom";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Header 상단, Footer 하단 유지 */
  align-items: center;
  min-height: 100vh;
  background-color: ${(props) => props.theme.backgroundColor};
  padding: 0 1rem; /* 좌우 패딩만 적용 */
  font-family: "Source Sans Pro", sans-serif;
  transition: background-color 0.3s ease;
`;

const Header = styled.header`
  width: 100%;
  display: flex;
  justify-content: space-between; /* 로고 왼쪽, 버튼 오른쪽 */
  align-items: center;
  padding: 1.5rem 1rem; /* 헤더 내부 패딩 */
  color: ${(props) => props.theme.textColor};
  flex-shrink: 0; /* Header 크기 고정 */
`;

const ProjectTitle = styled.div`
  font-weight: bold;
  font-size: 1.2rem;
`;

const ThemeToggleButton = styled.button`
  background: none;
  border: none; /* 테두리 제거 (이전 요청 반영) */
  color: ${(props) => props.theme.textColor};
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background-color 0.2s, color 0.2s;
  display: inline-flex; /* 아이콘 정렬 위해 */
  align-items: center;
  justify-content: center;

  /* 아이콘 스타일 */
  .material-symbols-outlined {
    font-size: 1.4rem; /* 아이콘 크기 조정 */
  }

  &:hover {
    /* 약간의 배경색 변화로 호버 효과 */
    background-color: ${(props) => props.theme.textColor}1A; /* 투명도 추가 */
  }
`;

const MainContent = styled.main`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4rem;
  width: 100%;
  max-width: 900px;
  flex-grow: 1;
  padding: 2rem 0;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 2rem;
    align-items: center;
    padding: 1rem 0;
  }
  @media (max-width: 900px) {
    justify-content: center;
  }
`;

const FormContainer = styled.div`
  background-color: ${(props) =>
    props.theme.formContainerColor}; // 테마 사용 확인
  padding: 2.5rem 3rem;
  border-radius: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 450px;
  transition: background-color 0.3s ease;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    max-width: 100%;
  }
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${(props) => props.theme.textColor};

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const Subtitle = styled.p`
  text-align: center;
  font-size: 0.9rem;
  color: ${(props) => props.theme.subTextColor};
  margin-bottom: 1.5rem;
`;

const TypeSelectorContainer = styled.div`
  display: flex;
  border: 1px solid ${(props) => props.theme.btnColor};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
`;

const TypeSelectorButton = styled.button<{ isActive: boolean }>`
  padding: 0.7rem 1.5rem;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  background-color: transparent;
  color: ${(props) => props.theme.textColor};

  ${(props) =>
    props.isActive &&
    `
    background-color: ${props.theme.btnColor};
    color: #333;
  `}

  &:not(:last-child) {
    border-right: 1px solid ${(props) => props.theme.btnColor};
  }

  &:hover:not(:disabled) {
    ${(props) =>
      !props.isActive &&
      `
      background-color: ${props.theme.btnColor}20;
    `}
  }
`;

const InputGroup = styled.div`
  position: relative;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid #dcdcdc; // 테마 적용 고려
  border-radius: 8px;
  font-size: 1rem;
  background-color: ${(props) => props.theme.backgroundColor};
  color: ${(props) => props.theme.textColor};
  transition: border-color 0.2s ease-in-out, background-color 0.3s ease,
    color 0.3s ease;

  &::placeholder {
    color: ${(props) => props.theme.subTextColor};
  }

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.btnColor};
    box-shadow: 0 0 0 2px ${(props) => props.theme.btnColor}4D;
  }
`;

const PasswordInputGroup = styled(InputGroup)`
  position: relative;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: ${(props) => props.theme.subTextColor};
  padding: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;

  .material-symbols-outlined {
    font-size: 1.2rem;
  }
`;

const MessageArea = styled.div`
  min-height: 1.2em;
  text-align: center;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 0.85rem;
`;

const SuccessMessage = styled.p`
  color: #3498db;
  font-size: 0.85rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.9rem;
  background-color: ${(props) => props.theme.btnColor};
  color: #333; // 버튼 색상 대비 고려
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:hover:not(:disabled) {
    background-color: ${(props) =>
      props.theme.hoverBtnColor}; // hoverBtnColor 테마에 정의 필요
    box-shadow: 0 4px 10px ${(props) => props.theme.btnColor}66;
  }

  &:disabled {
    background-color: #cccccc;
    color: #666666;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const SignInLinkText = styled.p`
  text-align: center;
  font-size: 0.9rem;
  margin-top: 1.5rem;
  color: ${(props) => props.theme.subTextColor};
`;

const SignInLink = styled.a`
  color: ${(props) => props.theme.btnColor};
  font-weight: 600;
  text-decoration: none;
  margin-left: 0.3rem;

  &:hover {
    text-decoration: underline;
  }
`;

// --- Register Component ---

export default function Register() {
  const [userType, setUserType] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isDark = useThemeStore((state) => state.isDark);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const handleShowPassword = () => setShowPassword(true);
  const handleHidePassword = () => setShowPassword(false);
  const handleShowConfirmPassword = () => setShowConfirmPassword(true);
  const handleHideConfirmPassword = () => setShowConfirmPassword(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (pw !== confirmPw) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }
    if (pw.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("유효한 이메일 주소를 입력해주세요.");
      setLoading(false);
      return;
    }

    if (userType === "student") {
      if (!email || !pw) {
        setError("이메일과 비밀번호를 입력해주세요.");
        setLoading(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          pw
        );
        console.log("학생 가입 성공:", userCredential.user);
        setError("");
        setSuccessMessage("회원가입 성공");
        setName("");
        setEmail("");
        setPw("");
        setConfirmPw("");
      } catch (err: any) {
        console.error("학생 가입 실패:", err);
        switch (err.code) {
          case "auth/email-already-in-use":
            setError("이미 사용 중인 이메일입니다.");
            break;
          case "auth/weak-password":
            setError("비밀번호는 6자 이상이어야 합니다.");
            break;
          case "auth/invalid-email":
            setError("유효하지 않은 이메일 형식입니다.");
            break;
          default:
            setError("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
      } finally {
        setLoading(false);
      }
    } else if (userType === "professor") {
      if (!name || !email || !pw) {
        setError("이름, 이메일, 비밀번호를 모두 입력해주세요.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          "http://20.41.114.132:8000/api/v1/instructors-auth/register",
          {
            method: "POST",
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name,
              email: email,
              password: pw,
            }),
          }
        );

        if (!response.ok) {
          let apiError = "강의자 등록 중 오류 발생";
          console.error(
            "API Error Response Status:",
            response.status,
            response.statusText
          );
          try {
            const errorText = await response.text();
            console.error("Raw API Error Response Body:", errorText);
            try {
              const errorData = JSON.parse(errorText);
              // API 응답 구조에 따라 detail, message, error 등 다양한 필드 시도
              apiError =
                errorData.detail ||
                errorData.message ||
                errorData.error ||
                JSON.stringify(errorData);
            } catch (parseError) {
              console.error("Failed to parse API error response as JSON.");
              // 텍스트 응답이 의미 있는 정보일 수 있으므로 포함
              apiError = errorText
                ? `${errorText} (Status: ${response.status})`
                : `HTTP Error ${response.status}`;
            }
          } catch (readError) {
            console.error("Failed to read API error response body:", readError);
            apiError = `HTTP Error ${response.status}: ${response.statusText}`;
          }
          throw new Error(apiError);
        }

        const data = await response.json();
        console.log("강의자 등록 성공:", data);
        setError("");
        setSuccessMessage("회원가입 성공");
        setName("");
        setEmail("");
        setPw("");
        setConfirmPw("");
      } catch (err: any) {
        console.error("강의자 등록 실패:", err);
        setError(err.message || "강의자 등록 요청 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 타입 선택 핸들러 (이전 onChange 핸들러 대체)
  const handleTypeSelect = (type: string) => {
    setUserType(type);
    setError("");
    setSuccessMessage("");
    // 필드 초기화는 선택사항 (유지해도 됨)
    // setEmail(''); setPw(''); setConfirmPw('');
    if (type === "student") {
      setName(""); // 학생 선택 시 이름 필드 값만 초기화
    }
  };

  return (
    <PageContainer>
      <Header>
        <ProjectTitle> </ProjectTitle>
        <ThemeToggleButton onClick={toggleTheme}>
          {isDark ? (
            <span className="material-symbols-outlined">light_mode</span>
          ) : (
            <span className="material-symbols-outlined">dark_mode</span>
          )}
        </ThemeToggleButton>
      </Header>

      <MainContent>
        <FormContainer>
          <StyledForm onSubmit={handleSubmit}>
            <Title>Register</Title>
            <Subtitle>Service Introducing comment</Subtitle>

            <TypeSelectorContainer>
              <TypeSelectorButton
                type="button"
                isActive={userType === "student"}
                onClick={() => handleTypeSelect("student")}
                disabled={loading}
              >
                Student
              </TypeSelectorButton>
              <TypeSelectorButton
                type="button"
                isActive={userType === "professor"}
                onClick={() => handleTypeSelect("professor")}
                disabled={loading}
              >
                Professor
              </TypeSelectorButton>
            </TypeSelectorContainer>

            {userType === "professor" && (
              <InputGroup>
                <StyledInput
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Name"
                  required={userType === "professor"}
                />
              </InputGroup>
            )}

            <InputGroup>
              <StyledInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email"
                required
              />
            </InputGroup>

            <PasswordInputGroup>
              <StyledInput
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Enter Password"
                type={showPassword ? "text" : "password"}
                required
              />
              <ToggleButton
                type="button"
                onMouseDown={handleShowPassword}
                onMouseUp={handleHidePassword}
                onMouseLeave={handleHidePassword}
                onTouchStart={handleShowPassword}
                onTouchEnd={handleHidePassword}
                disabled={loading}
              >
                <span className="material-symbols-outlined">visibility</span>
              </ToggleButton>
            </PasswordInputGroup>

            <PasswordInputGroup>
              <StyledInput
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                required
              />
              <ToggleButton
                type="button"
                onMouseDown={handleShowConfirmPassword}
                onMouseUp={handleHideConfirmPassword}
                onMouseLeave={handleHideConfirmPassword}
                onTouchStart={handleShowConfirmPassword}
                onTouchEnd={handleHideConfirmPassword}
                disabled={loading}
              >
                <span className="material-symbols-outlined">visibility</span>
              </ToggleButton>
            </PasswordInputGroup>

            <MessageArea>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {successMessage && (
                <SuccessMessage>{successMessage}</SuccessMessage>
              )}
              {!error && !successMessage && "\u00A0"}
            </MessageArea>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? "Processing..." : "Sign Up"}
            </SubmitButton>

            <SignInLinkText>
              Already have an account?{" "}
              <SignInLink href="#" onClick={() => navigate("/login")}>
                Sign In
              </SignInLink>
            </SignInLinkText>
          </StyledForm>
        </FormContainer>
      </MainContent>
    </PageContainer>
  );
}
