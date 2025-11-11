// src/components/video/VideoJSPlayer.tsx
import React, { useRef, useEffect, useCallback, useMemo } from "react";
import styled from "styled-components";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "@videojs/http-streaming";
import { Chart, registerables } from "chart.js";
import type { Chart as ChartType } from "chart.js";
import type Player from "video.js/dist/types/player";

Chart.register(...registerables);

// --- Styled Components ---
const PlayerWrapper = styled.div`
  position: relative;
  width: 100%;
  height: clamp(320px, 56vw, 540px);
  background-color: #000;

  .video-js {
    position: absolute;
    inset: 0;
    border-radius: 10px;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  .vjs-tech {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  .video-js .vjs-time-control {
    display: block;
  }
  .video-js .vjs-remaining-time {
    display: none;
  }
  .video-js .vjs-progress-control:hover .vjs-time-tooltip {
    display: none !important;
  }

  /* 그래프 오버레이 */
  .graph-overlay {
    position: absolute;
    left: 0px;
    right: 0px;
    width: 100%;
    bottom: 100%;
    height: 60px;
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.15s ease-out;
    transform: translateY(-10%);
  }

  .vjs-progress-control:hover .graph-overlay {
    opacity: 1;
  }
  .graph-hit-area {
    position: absolute;
    inset: 0;
    pointer-events: auto;
    cursor: pointer;
  }
  .graph-tooltip {
    position: absolute;
    padding: 4px 6px;
    border-radius: 6px;
    background: rgba(10, 12, 18, 0.92);
    color: #fff;
    font-size: 12px;
    transform: translate(-50%, -150%);
    white-space: nowrap;
    pointer-events: none;
    display: none;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
    z-index: 11;
  }

  /* 🔒 상호작용 제한 모드 - 진행바/재생버튼 클릭 비활성화 */
  .vjs-restrict .vjs-progress-control,
  .vjs-restrict .vjs-play-control {
    pointer-events: none !important;
    opacity: 0.7;
  }
`;

interface GraphDataPoint {
  t: number | string;
  value: number | string | { t: number | string; value: number | string };
}

interface VideoJSPlayerProps {
  src: string;
  graphData?: GraphDataPoint[];
  onTimeUpdate?: (time: number, duration: number) => void;
  initialSeekPercent?: number;
  /** 처음 시청 중에는 일시정지/되감기/앞으로 감기 금지 */
  restrictInteract?: boolean;
  /** 🎯 영상이 끝났을 때 호출 (부모에서 finish API 등 처리) */
  onEnded?: () => void;
}

const VideoJSPlayer: React.FC<VideoJSPlayerProps> = ({
  src,
  graphData = [],
  onTimeUpdate,
  initialSeekPercent = 0,
  restrictInteract = false,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const chartRef = useRef<ChartType<"line", { x: number; y: number }[]> | null>(
    null
  );

  // 1) 서버 데이터 평탄화: 변화 시점 목록으로 정리 (x: 초, y: 값)
  //    value가 객체면 그 안의 {t, value}를 사용
  const baseChangePoints = useMemo(() => {
    const flattened = (graphData ?? [])
      .map((d) => {
        if (
          d &&
          typeof d.value === "object" &&
          d.value !== null &&
          "t" in (d.value as any) &&
          "value" in (d.value as any)
        ) {
          const inner = d.value as any;
          return { x: Number(inner.t) || 0, y: Number(inner.value) || 0 };
        }
        return {
          x: Number((d as any).t) || 0,
          y: Number((d as any).value) || 0,
        };
      })
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));

    // 동일 t 중복 제거(뒤에 나온 값 우선) + 정렬
    const byT = new Map<number, number>();
    for (const p of flattened) byT.set(p.x, p.y);
    const sorted = Array.from(byT.entries())
      .map(([x, y]) => ({ x, y }))
      .sort((a, b) => a.x - b.x);

    // 최소 하나는 있어야 함
    if (sorted.length === 0) sorted.push({ x: 0, y: 0 });

    // 0초 포인트 보장(없다면 앞에 동일 값으로 추가)
    if (sorted[0].x > 0) {
      sorted.unshift({ x: 0, y: sorted[0].y });
    }

    return sorted;
  }, [graphData]);

  // 2) 요구사항: 첫 변화(0초)는 그대로, 그 이후 변화점은 모두 +1s (2:00 → 2:01)
  const changePoints = useMemo(() => {
    const offsetSec = 1; // [offset 1s] 2분 0초 대신 2분 1초부터 새 값 적용
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < baseChangePoints.length; i++) {
      const p = baseChangePoints[i];
      if (i === 0)
        out.push({ x: p.x, y: p.y }); // 첫 포인트는 그대로 (보통 0초)
      else out.push({ x: p.x + offsetSec, y: p.y }); // 이후는 +1초
    }
    // 다시 시간 정렬 및 중복 제거
    const byT = new Map<number, number>();
    for (const p of out) byT.set(p.x, p.y);
    return Array.from(byT.entries())
      .map(([x, y]) => ({ x, y }))
      .sort((a, b) => a.x - b.x);
  }, [baseChangePoints]);

  // 3) 어떤 시각에서의 "의미 값"(구간 상수)을 반환 (툴팁/라벨용)
  const valueAt = useCallback(
    (timeSec: number): number => {
      if (!changePoints.length) return 0;
      let best = changePoints[0].y;
      for (let i = 0; i < changePoints.length; i++) {
        if (changePoints[i].x <= timeSec) best = changePoints[i].y;
        else break;
      }
      return best;
    },
    [changePoints]
  );

  const secondsToLabel = useCallback((sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let resizeHandler: (() => void) | null = null;
    let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
    let pauseHandler: (() => void) | null = null;
    let seekingHandler: (() => void) | null = null;
    let timeupdateHandler: (() => void) | null = null;
    let endedHandler: (() => void) | null = null;

    const initTimeout = setTimeout(() => {
      if (!videoRef.current) return;

      const player = videojs(videoRef.current, {
        autoplay: true,
        controls: true,
        fill: true,
        sources: [{ src, type: "application/x-mpegURL" }],
        userActions: { hotkeys: false },
      });
      playerRef.current = player;

      // 🔒 상호작용 제한 모드 표시
      if (restrictInteract) player.addClass("vjs-restrict");
      else player.removeClass("vjs-restrict");

      // 안전한 play 호출
      const safePlay = () => {
        const maybe = player.play?.();
        if (maybe && typeof (maybe as any).catch === "function") {
          (maybe as Promise<any>).catch(() => {});
        }
      };

      // 일시정지 무력화 (단, 종료 직전/종료 시는 예외)
      if (restrictInteract) {
        pauseHandler = () => {
          const dur = player.duration() || 0;
          const t = player.currentTime() || 0;
          if (player.ended() || (dur > 0 && t >= dur - 0.35)) return;
          safePlay();
        };
        player.on("pause", pauseHandler);
      }

      if (onTimeUpdate) {
        timeupdateHandler = () => {
          onTimeUpdate(player.currentTime() ?? 0, player.duration() ?? 0);
        };
        player.on("timeupdate", timeupdateHandler);
      }

      // seeking 방지
      let lastTime = 0;
      const saveTime = () => {
        lastTime = player.currentTime() ?? lastTime;
      };
      player.on("timeupdate", saveTime);
      if (restrictInteract) {
        seekingHandler = () => {
          const now = player.currentTime() ?? 0;
          if (Math.abs(now - lastTime) > 1) player.currentTime(lastTime);
        };
        player.on("seeking", seekingHandler);
      }

      // 키보드 탐색/일시정지 차단
      if (restrictInteract) {
        keydownHandler = (e: KeyboardEvent) => {
          const block = [" ", "k", "j", "l", "ArrowLeft", "ArrowRight"];
          if (block.includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
          }
        };
        window.addEventListener("keydown", keydownHandler, true);
      }

      // ▶️ 영상 종료 감지
      endedHandler = () => {
        onEnded?.();
      };
      player.on("ended", endedHandler);

      player.one("loadedmetadata", () => {
        const duration = player.duration();
        if (duration && initialSeekPercent && initialSeekPercent > 0) {
          player.currentTime((duration * initialSeekPercent) / 100);
        }
      });

      // ===== 그래프 오버레이 렌더링 =====
      player.ready(() => {
        if (player.isDisposed() || player.el().querySelector(".graph-overlay"))
          return;

        const progressHolder = player
          .el()
          .querySelector<HTMLElement>(".vjs-progress-holder");
        if (!progressHolder) return;
        progressHolder.style.position = "relative";

        const overlay = document.createElement("div");
        overlay.className = "graph-overlay";
        const canvas = document.createElement("canvas");
        const hitArea = document.createElement("div");
        hitArea.className = "graph-hit-area";
        const tooltip = document.createElement("div");
        tooltip.className = "graph-tooltip";

        overlay.append(canvas, hitArea, tooltip);
        progressHolder.appendChild(overlay);

        const buildChart = () => {
          if (player.isDisposed()) return;
          const width = overlay.clientWidth;
          if (width === 0) return;

          canvas.width = width * devicePixelRatio;
          canvas.height = overlay.clientHeight * devicePixelRatio;
          canvas.style.width = `100%`;
          canvas.style.height = `100%`;

          if (chartRef.current) chartRef.current.destroy();

          const duration =
            player.duration() || Math.max(...changePoints.map((d) => d.x), 0);

          // --- 꺾은선 그래프 시리즈 만들기 ---
          // 각 변화점을 직선으로 연결하여 기울기가 있는 꺾은선 그래프 생성
          const base = changePoints.slice();
          const series: { x: number; y: number }[] = [];

          // 모든 변화점을 그대로 연결 (직선으로 이어짐)
          for (const point of base) {
            series.push({ x: point.x, y: point.y });
          }

          // 마지막 구간을 영상 끝까지 유지
          const lastY = base[base.length - 1]?.y ?? 0;
          if (duration > (series[series.length - 1]?.x ?? 0)) {
            series.push({ x: duration, y: lastY });
          }

          // y축 범위 자동화 (+여유 10%)
          const ys = series.map((p) => p.y);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const pad = (maxY - minY) * 0.1 || 0.1; // 값이 모두 같아도 최소 여유
          const yMin = minY - pad;
          const yMax = maxY + pad;

          // 그라데이션 생성
          const ctx = canvas.getContext("2d");
          let gradient: CanvasGradient | undefined;
          if (ctx) {
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, "rgba(255, 255, 255, 1)"); // 위쪽은 흰색
            gradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // 아래쪽은 원래 색
          }

          // 차트 생성 (부드러운 곡선)
          chartRef.current = new Chart(canvas, {
            type: "line",
            data: {
              datasets: [
                {
                  label: "Drowsiness Level",
                  data: series,
                  fill: true,
                  tension: 0.2, // 직선 꺾은선 그래프
                  pointRadius: 0,
                  borderWidth: 2,
                  borderColor: "rgba(255, 255, 255, 0.9)",
                  backgroundColor: gradient || "rgba(180, 200, 255, 0.35)", // 그라데이션 적용
                  parsing: { xAxisKey: "x", yAxisKey: "y" },
                },
              ],
            },
            options: {
              animation: false,
              responsive: false,
              maintainAspectRatio: false,
              layout: { padding: 0 },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
              },
              scales: {
                x: {
                  type: "linear",
                  min: 0,
                  max: duration, // 전체 영상 길이까지
                  grid: { display: false },
                  ticks: { display: false },
                },
                y: {
                  min: 1, // 데이터 기반 최소
                  max: 5, // 데이터 기반 최대(+여유)
                  display: false,
                },
              },
            },
          });
        };

        const attachInteractions = () => {
          // 처음 시청 제한 모드면 그래프 클릭 탐색도 차단
          if (restrictInteract) return;

          const getSeekTime = (e: MouseEvent): number | null => {
            if (player.isDisposed()) return null;
            const rect = hitArea.getBoundingClientRect();
            if (rect.width === 0) return null;
            const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
            return (x / rect.width) * (player.duration() ?? 0);
          };

          hitArea.addEventListener("mousemove", (e) => {
            const time = getSeekTime(e);
            if (time === null) return;

            const rect = hitArea.getBoundingClientRect();
            const x = e.clientX - rect.left;

            tooltip.style.left = `${x}px`;
            tooltip.style.display = "block";

            // 구간 상수 의미를 살린 값 표시(스무딩과 무관)
            const val = valueAt(time);
            const safeVal = Number.isFinite(val) ? val : 0;
            tooltip.textContent = `${secondsToLabel(time)} · ${safeVal.toFixed(
              2
            )}`;
          });

          hitArea.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
          });

          hitArea.addEventListener("click", (e) => {
            const time = getSeekTime(e);
            if (time !== null) player.currentTime(time);
          });
        };

        const ro = new ResizeObserver(buildChart);
        ro.observe(overlay);
        resizeObserver = ro;

        const rebuildChartWithRAF = () => requestAnimationFrame(buildChart);

        player.on(
          [
            "durationchange",
            "playerresize",
            "loadedmetadata",
            "fullscreenchange",
          ],
          rebuildChartWithRAF
        );
        window.addEventListener("resize", rebuildChartWithRAF);
        resizeHandler = rebuildChartWithRAF;

        attachInteractions();
        buildChart();
      });
    }, 0);

    return () => {
      clearTimeout(initTimeout);
      if (keydownHandler)
        window.removeEventListener("keydown", keydownHandler, true);
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (resizeObserver) resizeObserver.disconnect();
      if (playerRef.current && !playerRef.current.isDisposed()) {
        if (pauseHandler) playerRef.current.off("pause", pauseHandler);
        if (seekingHandler) playerRef.current.off("seeking", seekingHandler);
        if (timeupdateHandler)
          playerRef.current.off("timeupdate", timeupdateHandler);
        if (endedHandler) playerRef.current.off("ended", endedHandler);
        playerRef.current.dispose();
        playerRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    src,
    changePoints,
    initialSeekPercent,
    onTimeUpdate,
    secondsToLabel,
    restrictInteract,
    onEnded,
  ]);

  return (
    <PlayerWrapper>
      <div data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered" />
      </div>
    </PlayerWrapper>
  );
};

export default VideoJSPlayer;