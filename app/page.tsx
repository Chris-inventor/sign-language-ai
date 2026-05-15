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

  const [history, setHistory] = useState<string[]>([])
  const [sentence, setSentence] = useState<string>("")

  // =========================
  // 카메라
  // =========================
  const getCameras = async () => {
    await navigator.mediaDevices.getUserMedia({ video: true })

    const all = await navigator.mediaDevices.enumerateDevices()
    const cams = all.filter(d => d.kind === "videoinput")

    setDevices(cams)

    if (cams.length > 0) {
      setSelectedDevice(cams[cams.length - 1].deviceId)
    }
  }

  useEffect(() => {
    getCameras()
  }, [])

  const startCamera = async (deviceId?: string) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { ideal: deviceId } } : true,
    })

    streamRef.current = stream

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }

    setStatus("CAMERA ON")
  }

  // =========================
  // AI
  // =========================
  const loadAI = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    )

    landmarkerRef.current = await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        },
        runningMode: "VIDEO",
        numHands: 2,
      }
    )
  }

  // =========================
  // 수어
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

    if (index && middle && ring && pinky) return "HELLO"
    if (!index && !middle && !ring && !pinky) return "YES"
    if (index && !middle && !ring && !pinky) return "ONE"
    if (index && middle && !ring && !pinky) return "PEACE"
    if (thumb) return "GOOD"

    if (index && middle && thumb) return "OK"
    if (thumb && pinky) return "CALL"
    if (thumb && index && pinky) return "LOVE"
    if (!index && middle && !ring && !pinky) return "STOP"

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

      // ✅ 🔥 핵심 수정 (여기만 변경)
      const displayWidth = video.clientWidth
      const displayHeight = video.clientHeight

      canvas.width = displayWidth
      canvas.height = displayHeight

      const results = landmarker.detectForVideo(
        video,
        performance.now()
      )

      ctx.clearRect(0, 0, displayWidth, displayHeight)

      if (results.landmarks.length > 0) {
        const gesture = getGesture(results.landmarks)

        setResult(gesture)

        setHistory(prev => {
          const updated = [gesture, ...prev]
          return updated.slice(0, 5)
        })

        if (gesture !== "UNKNOWN" && gesture !== "NONE") {
          setSentence(prev =>
            prev.includes(gesture)
              ? prev
              : prev + " " + gesture
          )
        }

        for (const hand of results.landmarks) {
          for (const p of hand) {
            ctx.beginPath()
            ctx.arc(
              p.x * displayWidth,
              p.y * displayHeight,
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

  const stop = () => {
    runningRef.current = false
    setStatus("STOPPED")
  }

  const reset = () => {
    runningRef.current = false
    setResult("손을 보여주세요 ✋")
    setHistory([])
    setSentence("")
    setStatus("READY")
  }

  const switchCamera = (id: string) => {
    setSelectedDevice(id)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }

    setTimeout(() => startCamera(id), 100)
  }

  // =========================
  // UI
  // =========================
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>SIGN LANGUAGE AI 🤖</h1>

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
          <select
            value={selectedDevice}
            onChange={e => switchCamera(e.target.value)}
          >
            {devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                Camera {i + 1}
              </option>
            ))}
          </select>

          <button onClick={() => startCamera(selectedDevice)}>
            📷 Camera
          </button>

          <button onClick={start}>▶ Start</button>
          <button onClick={stop}>⏹ Stop</button>
          <button onClick={reset}>🔄 Reset</button>

          <h2>{result}</h2>

          <h3>History</h3>
          {history.map((h, i) => (
            <p key={i}>{h}</p>
          ))}

          <h3>Sentence</h3>
          <p>{sentence || "..."}</p>
        </div>
      </div>
    </div>
  )
}

// styles 그대로 유지
const styles: any = {
  page: { minHeight: "100vh", background: "#0f172a", color: "white", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold" },
  container: { display: "flex", gap: 20 },
  videoBox: { position: "relative", width: 600, height: 400 },
  video: { width: "100%", height: "100%" },
  canvas: { position: "absolute", top: 0, left: 0, pointerEvents: "none" },
  panel: { display: "flex", flexDirection: "column", gap: 10 },
}