"use client"

import { useEffect, useRef, useState } from "react"
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision"

export default function Page() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const runningRef = useRef(false)

  const [status, setStatus] = useState("READY")
  const [result, setResult] = useState("손을 보여주세요 ✋")

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState("")

  // =========================
  // 카메라 목록 가져오기
  // =========================
  const getCameras = async () => {
    const all = await navigator.mediaDevices.enumerateDevices()
    const cams = all.filter(d => d.kind === "videoinput")

    setDevices(cams)

    if (cams.length > 0 && !selectedDevice) {
      setSelectedDevice(cams[0].deviceId)
    }
  }

  useEffect(() => {
    getCameras()
  }, [])

  // =========================
  // ⭐ 안정 카메라 코드 (이전 버전 기반)
  // =========================
  const startCamera = async (deviceId?: string) => {
    try {
      // 기존 스트림 종료
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : true,
      })

      streamRef.current = stream

      const video = videoRef.current
      if (!video) return

      video.srcObject = stream
      await video.play()

      setStatus("CAMERA ON")
    } catch (e) {
      console.log(e)
      alert("카메라 오류")
    }
  }

  // =========================
  // AI 로딩
  // =========================
  const loadAI = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    )

    landmarkerRef.current =
      await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        },
        runningMode: "VIDEO",
        numHands: 2,
      })
  }

  // =========================
  // 제스처
  // =========================
  const getGesture = (landmarks: any) => {
    if (!landmarks || landmarks.length === 0) return "NONE"

    const hand = landmarks[0]

    const isUp = (tip: any, base: any) => tip.y < base.y

    const index = isUp(hand[8], hand[6])
    const middle = isUp(hand[12], hand[10])
    const ring = isUp(hand[16], hand[14])
    const pinky = isUp(hand[20], hand[18])
    const thumb = hand[4].x < hand[3].x

    if (index && middle && ring && pinky) return "HELLO ✋"
    if (!index && !middle && !ring && !pinky) return "YES 👍"
    if (index && !middle && !ring && !pinky) return "ONE ☝️"
    if (index && middle && !ring && !pinky) return "PEACE ✌️"
    if (thumb) return "GOOD 👍"

    return "UNKNOWN"
  }

  // =========================
  // 시작
  // =========================
  const start = async () => {
    if (!videoRef.current) return

    if (!landmarkerRef.current) {
      setStatus("LOADING AI")
      await loadAI()
    }

    runningRef.current = true
    setStatus("RUNNING")

    const loop = async () => {
      if (!runningRef.current) return

      const video = videoRef.current!
      const canvas = canvasRef.current!
      const landmarker = landmarkerRef.current

      if (!video || !canvas || !landmarker) return

      const ctx = canvas.getContext("2d")!

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const results = landmarker.detectForVideo(
        video,
        performance.now()
      )

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (results.landmarks.length > 0) {
        const gesture = getGesture(results.landmarks)
        setResult(gesture)

        for (const hand of results.landmarks) {
          for (const p of hand) {
            ctx.beginPath()
            ctx.arc(
              p.x * canvas.width,
              p.y * canvas.height,
              5,
              0,
              Math.PI * 2
            )
            ctx.fillStyle = "red"
            ctx.fill()
          }
        }
      } else {
        setResult("손 없음")
      }

      requestAnimationFrame(loop)
    }

    loop()
  }

  // =========================
  // 중지
  // =========================
  const stop = () => {
    runningRef.current = false
    setStatus("STOPPED")
  }

  // =========================
  // 초기화
  // =========================
  const reset = () => {
    runningRef.current = false
    setResult("손을 보여주세요 ✋")
    setStatus("READY")

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // =========================
  // 카메라 변경
  // =========================
  const switchCamera = (id: string) => {
    setSelectedDevice(id)
    startCamera(id)
  }

  return (
    <div style={styles.page}>

      <h1 style={styles.title}>
        SIGN LANGUAGE AI 🤖
      </h1>

      <p>{status}</p>

      <div style={styles.container}>

        <div style={styles.videoBox}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={styles.video}
          />

          <canvas
            ref={canvasRef}
            style={styles.canvas}
          />
        </div>

        <div style={styles.panel}>

          {/* 카메라 선택 */}
          <select
            value={selectedDevice}
            onChange={(e) => switchCamera(e.target.value)}
            style={styles.select}
          >
            {devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                Camera {i + 1}
              </option>
            ))}
          </select>

          <button onClick={() => startCamera(selectedDevice)} style={styles.btn}>
            📷 카메라
          </button>

          <button onClick={start} style={styles.btnGreen}>
            ▶ 시작
          </button>

          <button onClick={stop} style={styles.btnRed}>
            ⏹ 중지
          </button>

          <button onClick={reset} style={styles.btnGray}>
            🔄 초기화
          </button>

          <h2>{result}</h2>

        </div>

      </div>

    </div>
  )
}

// =========================
// STYLE
// =========================
const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
    padding: 20,
  },
  title: { fontSize: 28, fontWeight: "bold" },
  container: { display: "flex", gap: 20 },
  videoBox: { position: "relative", width: 600, height: 400 },
  video: { width: "100%", height: "100%" },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: "none",
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  select: { padding: 8 },
  btn: { padding: 10, background: "#2563eb", color: "white" },
  btnGreen: { padding: 10, background: "#16a34a", color: "white" },
  btnRed: { padding: 10, background: "#ef4444", color: "white" },
  btnGray: { padding: 10, background: "#374151", color: "white" },
}