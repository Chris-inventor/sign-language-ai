"use client"

import { useRef, useState } from "react"
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision"

export default function Page() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // ✅ 중요: AI는 ref로 유지해야 안 사라짐
  const landmarkerRef = useRef<HandLandmarker | null>(null)

  const [status, setStatus] = useState("READY")
  const [result, setResult] = useState("손을 보여주세요 ✋")

  // =========================
  // AI 로딩 (핵심 수정)
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
  // 카메라
  // =========================
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    })

    const video = videoRef.current
    if (!video) return

    video.srcObject = stream
    await video.play()

    setStatus("CAMERA ON")
  }

  // =========================
  // 손 인식
  // =========================
  const startDetection = async () => {
    if (!videoRef.current) return

    setStatus("LOADING AI")

    if (!landmarkerRef.current) {
      await loadAI()
    }

    const detectLoop = async () => {
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

      // ✅ 진짜 동작 여부
      if (results.landmarks.length > 0) {
        setResult("손 감지 ✋")

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

      requestAnimationFrame(detectLoop)
    }

    detectLoop()
  }

  return (
    <div style={styles.page}>

      <h1 style={styles.title}>SIGN AI 🤖</h1>

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

          <button style={styles.btn} onClick={startCamera}>
            📷 카메라
          </button>

          <button style={styles.btnGreen} onClick={startDetection}>
            ✋ AI 시작
          </button>

          <h2>{result}</h2>

        </div>

      </div>

    </div>
  )
}

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
  panel: { display: "flex", flexDirection: "column", gap: 10 },
  btn: { padding: 10, background: "#2563eb", color: "white" },
  btnGreen: { padding: 10, background: "#16a34a", color: "white" },
}