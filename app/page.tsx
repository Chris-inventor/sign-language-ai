"use client"

import { useEffect, useRef, useState } from "react"
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision"

export default function Page() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const runningRef = useRef(false)

  const [status, setStatus] = useState("READY")
  const [text, setText] = useState("손을 보여주세요 ✋")

  // =========================
  // AI 로딩
  // =========================
  const loadAI = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    )

    landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      },
      runningMode: "VIDEO",
      numHands: 2,
    })
  }

  // =========================
  // 카메라 시작
  // =========================
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    })

    if (!videoRef.current) return

    videoRef.current.srcObject = stream
    await videoRef.current.play()

    setStatus("CAMERA ON")
  }

  // =========================
  // AI 시작 (핵심)
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
        setText("손 감지 ✋")

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
        setText("손 없음")
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
    setText("손을 보여주세요 ✋")
    setStatus("READY")

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  return (
    <div style={styles.page}>

      <h1 style={styles.title}>
        SIGN LANGUAGE AI 🤖
      </h1>

      <p>{status}</p>

      <div style={styles.container}>

        {/* VIDEO */}
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

        {/* BUTTONS */}
        <div style={styles.panel}>

          <button style={styles.btn} onClick={startCamera}>
            📷 카메라
          </button>

          <button style={styles.btnGreen} onClick={start}>
            ▶ 시작
          </button>

          <button style={styles.btnRed} onClick={stop}>
            ⏹ 중지
          </button>

          <button style={styles.btnGray} onClick={reset}>
            🔄 초기화
          </button>

          <h2>{text}</h2>

        </div>

      </div>

    </div>
  )
}

// =========================
// 스타일 (안정 버전)
// =========================
const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
  },

  container: {
    display: "flex",
    gap: 20,
  },

  videoBox: {
    position: "relative",
    width: 600,
    height: 400,
    background: "black",
  },

  video: {
    width: "100%",
    height: "100%",
  },

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

  btn: {
    padding: 10,
    background: "#2563eb",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  btnGreen: {
    padding: 10,
    background: "#16a34a",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  btnRed: {
    padding: 10,
    background: "#ef4444",
    border: "none",
    color: "white",
    cursor: "pointer",
  },

  btnGray: {
    padding: 10,
    background: "#374151",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
}