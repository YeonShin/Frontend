import React, { useState, useEffect } from "react";
import styled from "styled-components";
import apiClient from "../../api/apiClient";
import { useNavigate } from "react-router-dom";
import profileImage from '../../assets/profileImage.svg'


// --- Styled Components for Dashboard ---
const MainTitle = styled.h2`
  color: ${(props) => props.theme.textColor};
  font-size: 20px;
  font-weight: bold;
`;
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px; /* 섹션 간의 간격 */
`;

const Row = styled.div`
  display: flex;
  gap: 25px; /* 카드 간의 간격 */
  width: 100%;

  @media (max-width: 1024px) {
    /* 작은 화면에서는 세로로 쌓기 */
    flex-direction: column;
  }
`;

// 기본 카드 스타일
const Card = styled.div`
  background-color: ${(props) => props.theme.formContainerColor}; // 테마 적용
  padding: 20px 25px;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  flex: 1; /* Flex 아이템이 공간을 차지하도록 */
  transition: background-color 0.3s ease;
`;

// 카드 제목
const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 15px 0;
`;

// 카드 부제목 (날짜 등)
const CardSubtitle = styled.p`
  font-size: 0.85rem;
  color: ${(props) => props.theme.subTextColor};
  margin: -10px 0 15px 0;
`;

// 리스트 (오늘/내일 수업, 할 일)
const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: ${(props) => props.theme.textColor};
  padding-bottom: 10px;
  border-bottom: 1px solid ${(props) => props.theme.btnColor}; // 테마 또는 하드코딩

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const ItemTime = styled.span`
  font-size: 0.85rem;
  color: ${(props) => props.theme.subTextColor};
  min-width: 50px; /* 시간 영역 너비 고정 */
`;

const ItemText = styled.span`
  flex-grow: 1; /* 텍스트가 남은 공간 차지 */
`;

// 아이콘 스타일
const ListIcon = styled.span`
  display: flex;
  align-items: center;
  font-size: 1.1rem; /* 아이콘 크기 */

  &.dot-icon {
    color: ${(props) => props.theme.btnColor}; /* 노란색 점 */
    font-size: 0.8rem; /* 점 아이콘 크기 */
  }
  &.play-icon {
    color: ${(props) => props.theme.subTextColor}; /* 회색 재생 아이콘 */
    cursor: pointer;
    &:hover {
      color: ${(props) => props.theme.textColor};
    }
  }
`;

// 빈 카드 스타일 (뭐넣노)
const PlaceholderCard = styled(Card)`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 150px; /* 최소 높이 */
  color: ${(props) => props.theme.subTextColor};
  font-size: 1rem;
`;

// Detection Analytics 카드 (더 클 수 있음)
const WideCard = styled(Card)`
  flex: 2; /* 다른 카드보다 너비 비율 크게 */
  min-height: 200px; /* 최소 높이 */
  padding: 0px 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${(props) => props.theme.subTextColor}; /* 임시 텍스트 색상 */
  /* 나중에 실제 내용 채우기 */

  @media (max-width: 1024px) {
    flex-basis: auto; /* 세로로 쌓일 때 기본 크기 */
    min-height: 150px;
  }
`;

// Continue Learning 섹션
const ContinueLearningContainer = styled.div`
  margin-top: 10px; /* 위 카드와의 간격 */
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 15px 0;
`;

const CourseList = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto; /* 가로 스크롤 */
  padding-bottom: 15px; /* 스크롤바 공간 */

  /* 스크롤바 스타일링 (선택 사항) */
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f1f1f1;
    border-radius: 4px;
  }
`;

const CourseCard = styled.div`
  background-color: ${(props) => props.theme.formContainerColor};
  border-radius: 10px;
  overflow: hidden; /* 이미지 모서리 처리 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  min-width: 250px; /* 카드 최소 너비 */
  max-width: 250px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  }
`;

const CourseImage = styled.img`
  width: 100%;
  height: 140px; /* 이미지 높이 고정 */
  object-fit: cover; /* 이미지 비율 유지하며 채우기 */
  display: block;
`;

const CourseInfo = styled.div`
  padding: 15px;
  flex-grow: 1; /* 내용이 적어도 높이 차지 */
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const CourseTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
  margin: 0;
  line-height: 1.3;
`;

const CourseDetail = styled.p`
  font-size: 0.8rem;
  color: ${(props) => props.theme.subTextColor};
  margin: 0;
`;

const CourseFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 15px 15px 15px; /* 아래쪽 패딩 */
`;

const ProgressBar = styled.div`
  flex-grow: 1;
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
`;

const Progress = styled.div<{ percentage: number }>`
  width: ${(props) => props.percentage}%;
  height: 100%;
  background-color: ${(props) => props.theme.btnColor}; // 테마 또는 하드코딩
  border-radius: 3px;
`;

const PlayButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.btnColor};
  cursor: pointer;
  padding: 0;
  display: flex;

  .material-symbols-outlined {
    font-size: 1.8rem;
  }
`;

const ProfileCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
`;

const ProfileImage = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${(props) => props.theme.btnColor};
`;

const ProfileName = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
  margin: 5px 0 0 0;
`;

const ProfileEmail = styled.p`
  font-size: 0.85rem;
  color: ${(props) => props.theme.subTextColor};
  margin: 0;
`;

const formatDateWithDay = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const dayOfMonth = date.getDate().toString().padStart(2, "0");
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = daysOfWeek[date.getDay()];
  return `${month}.${dayOfMonth}(${dayOfWeek})`;
};

const formatVideoTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}-${day} | ${hours}:${minutes}`;
};

const getWeekDateRange = (date: Date): string => {
  const startOfWeek = new Date(date);
  // Set to Sunday of the current week
  startOfWeek.setDate(date.getDate() - date.getDay());

  const endOfWeek = new Date(startOfWeek);
  // Set to Saturday of the current week
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const formatDate = (d: Date) =>
    `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
      .getDate()
      .toString()
      .padStart(2, "0")}`;

  return `${formatDate(startOfWeek)} ~ ${formatDate(endOfWeek)}`;
};

// --- Lecture 타입 정의 (API 응답 기반) ---
interface Lecture {
  lecture_id: number;
  lecture_name: string;
  instructor_name: string;
  classroom: string;
  schedule: string;
}

// --- Profile 타입 정의 (API 응답 기반) ---
interface Profile {
  email: string;
  name: string;
  profile_image_url: string | null;
}

// --- IncompleteVideo 타입 정의 (API 응답 기반) ---
interface IncompleteVideo {
  video_id: number;
  lecture_id: number;
  lecture_name: string;
  video_name: string;
  instructor_name: string;
  timestamp: string;
  video_image_url: string | null;
}

// --- Dashboard Component ---

const Dashboard = () => {
  const navigate = useNavigate();
  const [todayClasses, setTodayClasses] = useState<Lecture[]>([]);
  const [tomorrowClasses, setTomorrowClasses] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [incompleteVideos, setIncompleteVideos] = useState<IncompleteVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState<boolean>(true);

  const today = new Date();
  const formattedToday = formatDateWithDay(today);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const formattedTomorrow = formatDateWithDay(tomorrow);

  const weekDateRange = getWeekDateRange(today);

  useEffect(() => {
    const fetchLectures = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<{ lectures: Lecture[] }>(
          "/students/lecture"
        );
        const allLectures = response.data.lectures || [];

        const todayDate = new Date();
        const todayDay = todayDate.getDay(); // 0 for Sunday, 1 for Monday...

        const tomorrowDate = new Date();
        tomorrowDate.setDate(todayDate.getDate() + 1);
        const tomorrowDay = tomorrowDate.getDay();

        // [수정 1] 한글과 영어 요일을 모두 매핑하도록 dayMap 확장
        const dayMap: { [key: string]: number } = {
          일: 0,
          Sun: 0,
          월: 1,
          Mon: 1,
          화: 2,
          Tue: 2,
          수: 3,
          Wed: 3,
          목: 4,
          Thu: 4,
          금: 5,
          Fri: 5,
          토: 6,
          Sat: 6,
        };

        // [수정 2] 문자열 전체에서 한글/영어 요일을 찾는 더 유연한 정규식 사용
        const getDaysFromSchedule = (schedule: string): string[] => {
          // e.g., "월수 10:00", "Mon 09:00", "Tue,Thu 13:00" 등을 모두 처리
          const regex = /(일|월|화|수|목|금|토|Sun|Mon|Tue|Wed|Thu|Fri|Sat)/g;
          const matches = schedule.match(regex);
          return matches || []; // 매칭되는 것이 없으면 빈 배열 반환
        };

        const todayLectures = allLectures.filter((lecture) => {
          const scheduleDays = getDaysFromSchedule(lecture.schedule);
          // 스케줄에 요일 정보가 없는 경우, 매일 있는 수업으로 간주하지 않으므로 필터링
          if (scheduleDays.length === 0) return false;

          return scheduleDays.some((dayStr) => dayMap[dayStr] === todayDay);
        });

        const tomorrowLectures = allLectures.filter((lecture) => {
          const scheduleDays = getDaysFromSchedule(lecture.schedule);
          if (scheduleDays.length === 0) return false;

          return scheduleDays.some((dayStr) => dayMap[dayStr] === tomorrowDay);
        });

        setTodayClasses(todayLectures);
        setTomorrowClasses(tomorrowLectures);
      } catch (err) {
        console.error("Failed to fetch lectures:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await apiClient.get<Profile>("/students/profile");
        setProfile(response.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    const fetchIncompleteVideos = async () => {
      setVideosLoading(true);
      try {
        const response = await apiClient.get<IncompleteVideo[]>(
          "/students/recent-incomplete-videos"
        );
        setIncompleteVideos(response.data);
      } catch (err) {
        console.error("Failed to fetch incomplete videos:", err);
      } finally {
        setVideosLoading(false);
      }
    };

    fetchLectures();
    fetchProfile();
    fetchIncompleteVideos();
  }, []); // 의존성 배열은 비어있는 것이 맞습니다.

  const getTimeFromSchedule = (schedule: string): string => {
    const match = schedule.match(/\d{2}:\d{2}/);
    return match ? match[0] : "";
  };

  return (
    <DashboardContainer>
      <MainTitle>Dashboard</MainTitle>
      <Row>
        <Card>
          <CardTitle>Today's Class</CardTitle>
          <CardSubtitle>{formattedToday}</CardSubtitle>
          <List>
            {loading ? (
              <ListItem>
                <ItemText>Loading...</ItemText>
              </ListItem>
            ) : todayClasses.length > 0 ? (
              todayClasses.map((item) => (
                <ListItem key={item.lecture_id}>
                  <ListIcon className="material-symbols-outlined dot-icon">
                    fiber_manual_record
                  </ListIcon>
                  <ItemTime>{getTimeFromSchedule(item.schedule)}</ItemTime>
                  <ItemText>{item.lecture_name}</ItemText>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ItemText>No classes today.</ItemText>
              </ListItem>
            )}
          </List>
        </Card>
        <Card>
          <CardTitle>Tomorrow's Class</CardTitle>
          <CardSubtitle>{formattedTomorrow}</CardSubtitle>{" "}
          {/* 날짜는 동적으로 받아와야 함 */}
          <List>
            {loading ? (
              <ListItem>
                <ItemText>Loading...</ItemText>
              </ListItem>
            ) : tomorrowClasses.length > 0 ? (
              tomorrowClasses.map((item) => (
                <ListItem key={item.lecture_id}>
                  <ListIcon className="material-symbols-outlined dot-icon">
                    fiber_manual_record
                  </ListIcon>
                  <ItemTime>{getTimeFromSchedule(item.schedule)}</ItemTime>
                  <ItemText>{item.lecture_name}</ItemText>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ItemText>No classes tomorrow.</ItemText>
              </ListItem>
            )}
          </List>
        </Card>
        <ProfileCard>
          {profileLoading ? (
            <ItemText>Loading profile...</ItemText>
          ) : profile ? (
            <>
              <ProfileImage
                src={
                  profile.profile_image_url ||
                  profileImage
                }
                alt="Profile"
                crossOrigin="anonymous" /* 이 속성을 추가합니다! */
              />
              <div style={{ textAlign: "center" }}>
                <ProfileName>{profile.name}</ProfileName>
                <ProfileEmail>{profile.email}</ProfileEmail>
              </div>
            </>
          ) : (
            <ItemText>Failed to load profile.</ItemText>
          )}
        </ProfileCard>
      </Row>

      <Row>
        <WideCard>Detection Analytics (내용 추가 예정)</WideCard>
        <Card>
          <CardTitle>To-do ({weekDateRange})</CardTitle>
          <List>
            {videosLoading ? (
              <ListItem>
                <ItemText>Loading...</ItemText>
              </ListItem>
            ) : incompleteVideos.length > 0 ? (
              incompleteVideos.map((video) => (
                <ListItem key={video.video_id}>
                  <ListIcon className="material-symbols-outlined play-icon">
                    play_circle
                  </ListIcon>
                  <ItemText>
                    {video.lecture_name} - {video.video_name} <br />
                    <span style={{ fontSize: "0.8rem", color: "#888" }}>
                      Last watched: {formatVideoTimestamp(video.timestamp)}
                    </span>
                  </ItemText>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ItemText>No tasks to complete.</ItemText>
              </ListItem>
            )}
          </List>
        </Card>
      </Row>

      {/* 하단 행 */}
      <ContinueLearningContainer>
        <SectionTitle>Continue Learning</SectionTitle>
        <CourseList>
          {videosLoading ? (
            <p>Loading courses...</p>
          ) : incompleteVideos.length > 0 ? (
            incompleteVideos.map((video) => (
              <CourseCard
                key={video.video_id}
                onClick={() => navigate(`/student/courses/${video.lecture_id}`)}
              >
                <CourseImage
                  src={
                    video.video_image_url ||
                    "https://via.placeholder.com/250x140/ccc/fff?text=Video"
                  }
                  alt={video.video_name}
                  crossOrigin="anonymous" /* 이 속성을 추가합니다! */
                />
                <CourseInfo>
                  <CourseTitle>{video.lecture_name}</CourseTitle>
                  <CourseDetail>{video.video_name}</CourseDetail>
                  <CourseDetail>{video.instructor_name}</CourseDetail>
                </CourseInfo>
                <CourseFooter>
                  <div style={{ flexGrow: 1 }} />
                  <PlayButton title="Continue course">
                    <span className="material-symbols-outlined">
                      play_arrow
                    </span>
                  </PlayButton>
                </CourseFooter>
              </CourseCard>
            ))
          ) : (
            <p>No recent incomplete videos.</p>
          )}
        </CourseList>
      </ContinueLearningContainer>
    </DashboardContainer>
  );
};

export default Dashboard;