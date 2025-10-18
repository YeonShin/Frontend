// src/screen/student/LectureDetail.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import { useParams, useNavigate, useLocation, useBlocker } from "react-router-dom";
import apiClient from "../../api/apiClient"; // Axios 클라이언트
import { debounce } from "lodash";
import MediaPipeFaceMesh from "../../components/mediapipe/MediaPipeFaceMesh";
import VideoJSPlayer from "../../components/video/VideoJSPlayer";
import { db } from "../../firebase";
import { ref, onValue, off } from "firebase/database";
import { useAuthStore } from "../../authStore";

// --- Styled Components for Detail Page ---

// ✅ 오버레이와 스피너 스타일 추가
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  color: white;
  flex-direction: column;
`;

const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #fff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const OverlayMessage = styled.p`
  font-size: 1.1rem;
  font-weight: 500;
`;

const DetailPageContainer = styled.div`
  width: 100%;
`;

const Breadcrumb = styled.div`
  font-size: 0.9rem;
  color: ${(props) => props.theme.subTextColor};
  margin-bottom: 25px;
`;

const ContentLayout = styled.div`
  display: flex;
  gap: 30px;

  @media (max-width: 1200px) {
    flex-direction: column;
  }
`;

const LeftColumn = styled.div`
  flex: 1;
  min-width: 300px;
  transition: all 0.3s ease-in-out;
`;

const RightColumn = styled.div<{ isListVisible: boolean }>`
  flex: ${(props) => (props.isListVisible ? 2 : 1)};
  transition: flex 0.3s ease-in-out;
`;

const Card = styled.div`
  background-color: ${(props) => props.theme.formContainerColor || "white"};
  padding: 20px 25px;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 30px;
`;

const CardTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${(props) => props.theme.textColor};
  margin: 0 0 20px 0;
`;

const VideoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  overflow-y: scroll;

  /* ✅ 스크롤바 스타일 - 거의 안 보이게 */
  &::-webkit-scrollbar {
    width: 6px; /* 얇게 */
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(150, 150, 150, 0.2); /* 아주 옅은 회색 */
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(150, 150, 150, 0.35); /* 마우스 올리면 조금 더 보이게 */
  }

  &::-webkit-scrollbar-track {
    background: transparent; /* 트랙은 투명 */
  }

  /* Firefox */
  scrollbar-width: thin; /* 얇게 */
  scrollbar-color: rgba(150, 150, 150, 0.2) transparent;
`;

const VideoListItem = styled.li<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid ${(props) => props.theme.btnColor || "#eee"};
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: ${(props) =>
    props.isActive ? `${props.theme.btnColor}20` : "transparent"};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${(props) =>
      props.isActive
        ? `${props.theme.btnColor}20`
        : `${props.theme.subTextColor}10`};
  }
`;

const VideoInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const VideoTitle = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  color: ${(props) => props.theme.textColor};
`;

const VideoMeta = styled.span`
  font-size: 0.8rem;
  color: ${(props) => props.theme.subTextColor};
`;

const VideoDuration = styled.span`
  font-size: 0.8rem;
  color: ${(props) => props.theme.subTextColor};
  margin-left: 10px;
`;

const VideoPlayButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.btnColor || "#1f6feb"};
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;

  .material-symbols-outlined {
    font-size: 1.8rem;
  }
`;

const PlayerPlaceholder = styled.div`
  background-color: #eee;
  border-radius: 10px;
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #888;
  margin-bottom: 20px;
`;

const ToggleButton = styled.button`
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background-color: ${(props) => props.theme.btnColor};
  border: 1px solid ${(props) => props.theme.btnColor};
  color: ${(props) => props.theme.textColor};
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: ${(props) => props.theme.hoverBtnColor};
  }
`;

const MessageContainer = styled.div`
  padding: 40px;
  text-align: center;
  color: ${(props) => props.theme.subTextColor};
`;

const DrowsinessButton = styled.button`
  background-color: ${(props) => props.theme.btnColor};
  color: ${(props) => props.theme.textColor};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 1rem;
  width: 100%;

  &:hover {
    background-color: ${(props) => props.theme.hoverBtnColor};
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const DrowsinessMessage = styled.p`
  margin-top: 1rem;
  color: ${(props) => props.theme.subTextColor};
`;

const SectionTitle = styled.h2`
  color: ${(props) => props.theme.textColor};
`;

const Toast = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  padding: 10px 14px;
  background: rgba(20, 22, 28, 0.9);
  color: #fff;
  border-radius: 8px;
  z-index: 9999;
`;

// --- Video 타입 정의 (API 응답 기반) ---
interface Video {
  id: number;
  index: number;
  title: string;
  duration: number; // 초 단위
  upload_at: string;
  watched_percent: number;
}

interface GraphPoint {
  t: number;
  value: number;
}

// (선택) 초기 더미 그래프
const dummyDrowsinessData: GraphPoint[] = [
  { t: 0, value: 1.05 },
  { t: 15, value: 1.1 },
  { t: 30, value: 2.5 },
];

// 숫자 배열을 그래프 포맷으로
const toGraphPoints = (levels: number[]): GraphPoint[] =>
  (levels || []).map((v, i) => ({ t: i, value: v }));

// --- LectureDetail Component ---
const Lectures = () => {
  const uid = useAuthStore((state) => state.uid);
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [videos, setVideos] = useState<Video[]>([]);
  const [lectureName, setLectureName] = useState<string>("Loading...");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [hlsSrc, setHlsSrc] = useState<string | null>(null);
  const [pendingHlsSrc, setPendingHlsSrc] = useState<string | null>(null);
  const [playerLoading, setPlayerLoading] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const [currentPlayTime, setCurrentPlayTime] = useState<number>(0);
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  const [initialWatchedPercent, setInitialWatchedPercent] = useState<number>(0);
  const [isListVisible, setIsListVisible] = useState(true);

  // 🔒 재생 잠금(처음 시청 & 졸음데이터 없음)
  const [isPlaybackLocked, setIsPlaybackLocked] = useState<boolean>(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [isFirstWatch, setIsFirstWatch] = useState<boolean>(false);

  // ✅ 추가: finish 대기/토스트/진척도 저장 제어
  const [isFinishing, setIsFinishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [allowProgressSave, setAllowProgressSave] = useState(true);
  const allowSaveRef = useRef(true);

  // ✅ 페이지 이탈 방지 로직
  useBlocker(() => {
    if (isFinishing) {
      return !window.confirm(
        "분석이 진행 중입니다. 페이지를 벗어나면 데이터가 유실될 수 있습니다. 정말로 이동하시겠습니까?"
      );
    }
    return false;
  });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isFinishing) {
        event.preventDefault();
        event.returnValue = ""; // Chrome에서 프롬프트를 표시하기 위해 필요
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isFinishing]);

  useEffect(() => {
    allowSaveRef.current = allowProgressSave;
  }, [allowProgressSave]);

  // 토스트 자동 숨김
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const progressRef = useRef<{ videoId: number | null; percent: number }>({
    videoId: null,
    percent: 0,
  });

  // Drowsiness states
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [drowsinessData, setDrowsinessData] = useState<GraphPoint[] | null>([]);
  const [drowsinessMessage, setDrowsinessMessage] = useState<string | null>(
    "기기에서 인증 코드를 입력해 페어링을 완료하면 재생이 시작됩니다."
  );

  // ▶️ 자동 finish 중복 방지
  const sentAutoFinishRef = useRef(false);

  // === 저장 로직: 선언을 위쪽에 두고 useMemo로 디바운스 인스턴스 고정 ===
  const performSave = useCallback(async () => {
    // ✅ 첫 시청 동안은 저장 금지
    if (!allowSaveRef.current) return;

    const { videoId, percent } = progressRef.current;
    if (videoId !== null && percent > 0 && percent <= 100) {
      try {
        await apiClient.post("/students/lecture/video/progress", {
          video_id: videoId,
          watched_percent: percent,
        });
      } catch (err) {
        console.error(`[performSave] Failed for video ${videoId}:`, err);
      }
    }
  }, []);

  const debouncedSaveProgress = React.useMemo(
    () => debounce(performSave, 5000),
    [performSave]
  );

  useEffect(() => {
    return () => {
      debouncedSaveProgress.cancel();
      performSave();
    };
  }, [debouncedSaveProgress, performSave]);

  const handleStartSession = async () => {
    if (!selectedVideo) {
      setDrowsinessMessage("Please select a video first.");
      return;
    }
    try {
      const response = await apiClient.post("/students/drowsiness/start", {
        video_id: selectedVideo.id,
      });
      const { session_id, auth_code } = response.data;
      setSessionId(session_id);
      setAuthCode(auth_code);
      setIsDetecting(true);
      setDrowsinessMessage(
        `착용 기기 인증 코드: ${auth_code} — 기기에서 코드를 입력해 페어링을 완료하세요.`
      );
    } catch (error) {
      console.error("Error starting session:", error);
      setDrowsinessMessage("Failed to start session.");
    }
  };

  // 🔔 영상 종료 시 자동 finish
  const handleVideoEnded = useCallback(async () => {
    if (sentAutoFinishRef.current) return;
    sentAutoFinishRef.current = true;

    // 진행률 최종 저장 시도
    debouncedSaveProgress.cancel();
    await performSave();

    if (sessionId) {
      try {
        // ✅ finish 대기 UI on
        setIsFinishing(true);

        const resp = await apiClient.post("/students/drowsiness/finish", {
          session_id: sessionId,
          student_uid: uid,
        });

        setDrowsinessData(toGraphPoints(resp.data || []));
        // ✅ 200 성공 시 메시지 + 토스트
        if (!resp || resp.status === 200) {
          setDrowsinessMessage("졸음 분석이 완료되었습니다.");
          setToast("졸음 분석이 완료되었습니다.");
          // ✅ 초기 시청 완료 후부터 진척도 저장 시작
          setAllowProgressSave(true);
        } else {
          setDrowsinessMessage("졸음 분석 처리에 실패했습니다.");
        }
      } catch (e) {
        console.error("Auto finish failed:", e);
        setDrowsinessMessage("졸음 분석 처리에 실패했습니다.");
      } finally {
        setSessionId(null);
        setAuthCode(null);
        setIsPaired(false);
        setIsDetecting(false);
        setIsFirstWatch(false);
        // ✅ finish 대기 UI off
        setIsFinishing(false);
      }
    }
  }, [debouncedSaveProgress, performSave, sessionId, uid]);

  // Firebase 페어링 상태 감지 + 잠금 해제
  useEffect(() => {
    if (!sessionId) return;

    setIsPaired(false);
    const dbRef = ref(db, `${sessionId}/pairing/paired`);

    const listener = onValue(dbRef, (snapshot) => {
      if (snapshot.val() === true) {
        setIsPaired(true);
        setDrowsinessMessage("Device connected. Starting data collection.");

        // 🔓 잠금 상태면 해제하고 재생 시작
        setIsPlaybackLocked((locked) => {
          if (locked && pendingHlsSrc) {
            setHlsSrc(pendingHlsSrc);
            setPendingHlsSrc(null);
            return false;
          }
          return locked;
        });
      }
    });

    return () => {
      off(dbRef, "value", listener);
    };
  }, [sessionId, pendingHlsSrc]);

  useEffect(() => {
    const resetPercent =
      progressRef.current.videoId !== (selectedVideo?.id ?? null);
    progressRef.current = {
      videoId: selectedVideo?.id ?? null,
      percent: resetPercent ? 0 : progressRef.current.percent,
    };
  }, [selectedVideo]);

  const fetchHlsLink = useCallback(async (videoId: number) => {
    if (videoId === null || videoId === undefined) return;
    setPlayerLoading(true);
    setPlayerError(null);
    setHlsSrc(null);
    setPendingHlsSrc(null);
    setInitialWatchedPercent(0);
    setIsPlaybackLocked(false);
    setLockReason(null);
    sentAutoFinishRef.current = false; // 새 영상마다 리셋

    try {
      const response = await apiClient.post<{
        s3_link: string;
        watched_percent: number;
        drowsiness_levels?: number[];
      }>("/students/lecture/video/link", { video_id: videoId });

      const s3 = response.data?.s3_link;
      const watched = response.data?.watched_percent ?? 0;
      const levels = response.data?.drowsiness_levels ?? [];

      console.log(levels);

      if (!s3) throw new Error("비디오 링크를 가져올 수 없습니다.");

      // ✅ 최초 시청 & 졸음 데이터 없음 → 재생 잠금
      if (levels.length === 0) {
        setIsPlaybackLocked(true);
        setLockReason(
          "처음 시청하는 영상입니다. 기기를 페어링하여 졸음 감지 세션을 시작해 주세요."
        );
        setPendingHlsSrc(s3); // 페어링 완료 시 재생
        setDrowsinessData([]); // 그래프 없음
        setInitialWatchedPercent(0);
        setIsFirstWatch(true);
        // ✅ 첫 시청 동안은 진척도 저장 비활성화
        setAllowProgressSave(false);
        return; // 재생하지 않음
      }

      // 재생 가능
      setIsPlaybackLocked(false);
      setLockReason(null);
      sentAutoFinishRef.current = false; // 재생 시작 전 리셋
      setHlsSrc(s3);
      setPendingHlsSrc(null);
      setInitialWatchedPercent(watched || 0);
      setIsFirstWatch(false);
      if (levels.length > 0) setDrowsinessData(toGraphPoints(levels));

      // ✅ 이어보기/재시청은 저장 허용
      setAllowProgressSave(true);
    } catch (err: any) {
      console.error(`[fetchHlsLink] Error fetching HLS link for ${videoId}:`, err);
      setPlayerError(err.message || "비디오 링크 로딩 중 오류 발생");
    } finally {
      setPlayerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!lectureId) {
      setError("Lecture ID not found.");
      setLoading(false);
      return;
    }
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      const passedLectureName = (location.state as any)?.lectureName;
      setLectureName(passedLectureName || `Lecture ID ${lectureId}`);
      try {
        const lectureIdNumber = parseInt(lectureId, 10);
        if (isNaN(lectureIdNumber)) throw new Error("Invalid Lecture ID format.");
        const response = await apiClient.post<{ videos: Video[] }>(
          "/students/lecture/video",
          { lecture_id: lectureIdNumber }
        );
        const fetchedVideos = response.data.videos || [];
        setVideos(fetchedVideos);
        if (fetchedVideos.length > 0) {
          setSelectedVideo(fetchedVideos[0]);
          await fetchHlsLink(fetchedVideos[0].id);
        } else {
          setHlsSrc(null);
        }
      } catch (err: any) {
        console.error("Failed to fetch initial data:", err);
        setError(err.message || "강의 정보를 불러오는데 실패했습니다.");
        setLectureName("Error Loading Lecture");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [lectureId, location.state, fetchHlsLink]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleTimeUpdate = useCallback(
    (time: number, duration: number) => {
      setCurrentPlayTime(time);
      if (duration && !isNaN(duration) && duration > 0) {
        setCurrentDuration(duration);
        const percent = Math.round((time / duration) * 100);
        const currentPercentInRef = progressRef.current.percent;
        const newPercent =
          percent >= 0 && percent <= 100 ? percent : currentPercentInRef;
        if (newPercent > currentPercentInRef) {
          progressRef.current.percent = newPercent;
          // ✅ 첫 시청 동안은 저장 안 함
          if (allowSaveRef.current) {
            debouncedSaveProgress();
          }
        }
      }
    },
    [debouncedSaveProgress]
  );

  const handleVideoSelect = useCallback(
    async (video: Video) => {
      if (progressRef.current.videoId === video.id) return;

      debouncedSaveProgress.cancel();
      await performSave();
      setCurrentPlayTime(0);
      setCurrentDuration(0);
      setHlsSrc(null);
      setPendingHlsSrc(null);
      setPlayerError(null);
      setInitialWatchedPercent(0);
      setIsPlaybackLocked(false);
      setLockReason(null);
      sentAutoFinishRef.current = false;

      setSelectedVideo(video);
      await fetchHlsLink(video.id);
    },
    [performSave, debouncedSaveProgress, fetchHlsLink]
  );

  if (loading)
    return <MessageContainer>Loading lecture details...</MessageContainer>;
  if (error) return <MessageContainer>Error: {error}</MessageContainer>;

  return (
    <DetailPageContainer>
      <Breadcrumb>&gt; Courses / {lectureName}</Breadcrumb>
      <ToggleButton onClick={() => setIsListVisible(!isListVisible)}>
        {isListVisible ? "Hide List" : "Show List"}
      </ToggleButton>
      <ContentLayout>
        {isListVisible && (
          <LeftColumn>
            <Card>
              <CardTitle>Course Schedule</CardTitle>
              <VideoList>
                {videos.length > 0 ? (
                  videos.map((video) => (
                    <VideoListItem
                      key={video.id}
                      isActive={selectedVideo?.id === video.id}
                      onClick={() => handleVideoSelect(video)}
                    >
                      <VideoInfo>
                        <VideoMeta>Week {video.index}</VideoMeta>
                        <VideoTitle>
                          Chapter {video.index}. {video.title}
                        </VideoTitle>
                        <VideoMeta>
                          {new Date(video.upload_at).toLocaleDateString()}
                        </VideoMeta>
                      </VideoInfo>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <VideoDuration>
                          {formatDuration(video.duration)}
                        </VideoDuration>
                        <VideoPlayButton title={`Play ${video.title}`}>
                          <span className="material-symbols-outlined">
                            play_circle
                          </span>
                        </VideoPlayButton>
                      </div>
                    </VideoListItem>
                  ))
                ) : (
                  <p>No videos available for this lecture.</p>
                )}
              </VideoList>
            </Card>
          </LeftColumn>
        )}

        <RightColumn isListVisible={isListVisible}>
          <Card>
            {/* ✅ finish 대기 중 메시지 */}
            {isFinishing && (
              <MessageContainer>졸음 분석 진행 중...</MessageContainer>
            )}

            {playerLoading && (
              <MessageContainer>Loading video...</MessageContainer>
            )}
            {playerError && (
              <MessageContainer>Error: {playerError}</MessageContainer>
            )}

            {/* 🔒 잠금 상태 */}
            {!playerLoading && !playerError && isPlaybackLocked && (
              <MessageContainer>
                <p>{lockReason || "이 영상은 현재 재생할 수 없습니다."}</p>
                <div style={{ marginTop: 12 }}>
                  <DrowsinessButton
                    onClick={handleStartSession}
                    disabled={!selectedVideo || isDetecting}
                  >
                    {isDetecting ? "세션 진행 중..." : "졸음 감지 세션 시작"}
                  </DrowsinessButton>

                  {drowsinessMessage && (
                    <DrowsinessMessage>{drowsinessMessage}</DrowsinessMessage>
                  )}
                  <DrowsinessMessage></DrowsinessMessage>
                </div>
              </MessageContainer>
            )}

            {/* 정상 재생 */}
            {!playerLoading &&
              !playerError &&
              !isPlaybackLocked &&
              hlsSrc &&
              selectedVideo && (
                <VideoJSPlayer
                  key={hlsSrc}
                  src={hlsSrc}
                  onTimeUpdate={handleTimeUpdate}
                  initialSeekPercent={initialWatchedPercent}
                  graphData={drowsinessData || []}
                  restrictInteract={initialWatchedPercent === 0}
                  onEnded={handleVideoEnded} // ✅ 끝나면 자동 finish
                />
              )}

            {!playerLoading &&
              !playerError &&
              !isPlaybackLocked &&
              !hlsSrc &&
              selectedVideo && (
                <MessageContainer>Could not load video source.</MessageContainer>
              )}
            {!playerLoading && !playerError && !hlsSrc && !selectedVideo && (
              <PlayerPlaceholder>Select a video from the list</PlayerPlaceholder>
            )}
          </Card>

          {isFirstWatch && (
            <Card>
              <SectionTitle>Drowsiness Detection</SectionTitle>
              <MediaPipeFaceMesh sessionId={sessionId} isPaired={isPaired} />
            </Card>
          )}
        </RightColumn>
      </ContentLayout>

      {/* ✅ 토스트 */}
      {toast && <Toast>{toast}</Toast>}

      {/* ✅ 로딩 오버레이 */}
      {isFinishing && (
        <Overlay>
          <Spinner />
          <OverlayMessage>졸음 수준 분석 진행 중...</OverlayMessage>
        </Overlay>
      )}
    </DetailPageContainer>
  );
};

export default Lectures;
