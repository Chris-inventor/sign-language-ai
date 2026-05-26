"use client"

import { useEffect, useRef, useState } from "react"
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision"

export default function Page() {
  const videoRef =
    useRef<HTMLVideoElement | null>(null)

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null)

  const streamRef =
    useRef<MediaStream | null>(null)

  const landmarkerRef =
    useRef<HandLandmarker | null>(null)

  const runningRef = useRef(false)

  const [status, setStatus] =
    useState("READY")

  const [result, setResult] = useState(
    "손을 보여주세요 ✋"
  )

  const [devices, setDevices] =
    useState<MediaDeviceInfo[]>([])

  const [selectedDevice, setSelectedDevice] =
    useState("")

  const [history, setHistory] = useState<
    string[]
  >([])

  const [sentence, setSentence] =
    useState("")

  // =========================
  // 카메라 목록
  // =========================
  const getCameras = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        video: true,
      })

      const all =
        await navigator.mediaDevices.enumerateDevices()

      const cams = all.filter(
        d => d.kind === "videoinput"
      )

      setDevices(cams)

      if (cams.length > 0) {
        setSelectedDevice(
          cams[cams.length - 1].deviceId
        )
      }
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    getCameras()
  }, [])

  // =========================
  // 카메라 시작
  // =========================
  const startCamera = async (
    deviceId?: string
  ) => {
    try {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach(t => t.stop())
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? {
                deviceId: {
                  ideal: deviceId,
                },
                width: {
                  ideal: 1280,
                },
                height: {
                  ideal: 720,
                },
              }
            : true,
        })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

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
    const vision =
      await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      )

    landmarkerRef.current =
      await HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",

            delegate: "GPU",
          },

          runningMode: "VIDEO",

          numHands: 1,

          minHandDetectionConfidence: 0.8,
          minHandPresenceConfidence: 0.8,
          minTrackingConfidence: 0.8,
        }
      )
  }

  // =========================
  // 알파벳 인식
  // =========================
  const getGesture = (landmarks: any) => {
    if (
      !landmarks ||
      landmarks.length === 0
    )
      return "NONE"

    const hand = landmarks[0]

    const isUp = (
      tip: any,
      base: any
    ) => tip.y < base.y

    const index = isUp(
      hand[8],
      hand[6]
    )

    const middle = isUp(
      hand[12],
      hand[10]
    )

    const ring = isUp(
      hand[16],
      hand[14]
    )

    const pinky = isUp(
      hand[20],
      hand[18]
    )

    const thumb =
      hand[4].x < hand[3].x

    const distance = (
      a: any,
      b: any
    ) => {
      return Math.sqrt(
        (a.x - b.x) ** 2 +
          (a.y - b.y) ** 2
      )
    }

    const thumbIndex =
      distance(hand[4], hand[8])

    // =========================
    // ASL 알파벳
    // =========================

    if (
      thumb &&
      !index &&
      !middle &&
      !ring &&
      !pinky
    )
      return "A"

    if (
      index &&
      middle &&
      ring &&
      pinky &&
      !thumb
    )
      return "B"

    if (
      thumbIndex > 0.15 &&
      index &&
      middle &&
      ring &&
      pinky
    )
      return "C"

    if (
      index &&
      !middle &&
      !ring &&
      !pinky &&
      !thumb
    )
      return "D"

    if (
      !thumb &&
      !index &&
      !middle &&
      !ring &&
      !pinky
    )
      return "E"

    if (
      thumbIndex < 0.05 &&
      middle &&
      !ring &&
      !pinky
    )
      return "F"

    if (
      thumb &&
      index &&
      !middle &&
      !ring &&
      pinky
    )
      return "G"

    if (
      index &&
      middle &&
      !ring &&
      pinky
    )
      return "H"

    if (
      pinky &&
      !index &&
      !middle &&
      !ring
    )
      return "I"

    if (
      pinky &&
      thumb &&
      !index &&
      !middle &&
      !ring
    )
      return "J"

    if (
      thumb &&
      index &&
      middle &&
      !ring &&
      !pinky
    )
      return "K"

    if (
      thumb &&
      index &&
      !middle &&
      !ring &&
      !pinky
    )
      return "L"

    if (
      !thumb &&
      index &&
      middle &&
      ring &&
      !pinky
    )
      return "M"

    if (
      !thumb &&
      index &&
      middle &&
      !ring &&
      !pinky
    )
      return "N"

    if (
      thumbIndex < 0.08 &&
      !pinky
    )
      return "O"

    if (
      thumb &&
      middle &&
      !index &&
      !ring &&
      !pinky
    )
      return "P"

    if (
      thumb &&
      ring &&
      !index &&
      !middle &&
      !pinky
    )
      return "Q"

    if (
      index &&
      middle &&
      ring &&
      !pinky
    )
      return "R"

    if (
      !thumb &&
      !index &&
      !middle &&
      ring &&
      !pinky
    )
      return "S"

    if (
      thumb &&
      !index &&
      middle &&
      !ring &&
      !pinky
    )
      return "T"

    if (
      index &&
      middle &&
      !ring &&
      !pinky &&
      thumb
    )
      return "U"

    if (
      index &&
      middle &&
      !ring &&
      !pinky &&
      !thumb
    )
      return "V"

    if (
      index &&
      middle &&
      ring &&
      !pinky
    )
      return "W"

    if (
      index &&
      !middle &&
      ring &&
      !pinky
    )
      return "X"

    if (
      thumb &&
      pinky &&
      !index &&
      !middle &&
      !ring
    )
      return "Y"

    if (
      index &&
      pinky &&
      !middle &&
      !ring
    )
      return "Z"

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
      const landmarker =
        landmarkerRef.current

      if (
        !video ||
        !canvas ||
        !landmarker
      )
        return

      const ctx =
        canvas.getContext("2d")!

      const displayWidth =
        video.clientWidth

      const displayHeight =
        video.clientHeight

      canvas.width = displayWidth
      canvas.height = displayHeight

      const now =
        performance.now()

      const results =
        landmarker.detectForVideo(
          video,
          now
        )

      ctx.clearRect(
        0,
        0,
        displayWidth,
        displayHeight
      )

      if (
        results.landmarks.length > 0
      ) {
        const gesture =
          getGesture(
            results.landmarks
          )

        setResult(gesture)

        // 히스토리
        setHistory(prev => {
          const updated = [
            gesture,
            ...prev,
          ]

          return updated.slice(0, 8)
        })

        // 문장 생성
        if (
          gesture !== "UNKNOWN" &&
          gesture !== "NONE"
        ) {
          setSentence(prev => {
            if (
              prev.endsWith(
                gesture
              )
            )
              return prev

            return (
              prev + gesture
            )
          })
        }

        // 랜드마크
        for (const hand of results.landmarks) {
          for (const p of hand) {
            const x =
              p.x * displayWidth

            const y =
              p.y * displayHeight

            ctx.beginPath()

            ctx.arc(
              x,
              y,
              7,
              0,
              Math.PI * 2
            )

            ctx.fillStyle =
              "#ff0000"

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

    setResult(
      "손을 보여주세요 ✋"
    )

    setHistory([])

    setSentence("")

    setStatus("READY")

    const canvas =
      canvasRef.current

    if (canvas) {
      const ctx =
        canvas.getContext("2d")!

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      )
    }
  }

  // =========================
  // 카메라 전환
  // =========================
  const switchCamera = (
    id: string
  ) => {
    setSelectedDevice(id)

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach(t => t.stop())
    }

    setTimeout(() => {
      startCamera(id)
    }, 100)
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>
        ASL Alphabet AI 🤟
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

        {/* PANEL */}
        <div style={styles.panel}>
          <select
            value={selectedDevice}
            onChange={e =>
              switchCamera(
                e.target.value
              )
            }
            style={styles.select}
          >
            {devices.map((d, i) => (
              <option
                key={d.deviceId}
                value={d.deviceId}
              >
                Camera {i + 1}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              startCamera(
                selectedDevice
              )
            }
            style={styles.btn}
          >
            📷 Camera
          </button>

          <button
            onClick={start}
            style={styles.btnGreen}
          >
            ▶ Start
          </button>

          <button
            onClick={stop}
            style={styles.btnRed}
          >
            ⏹ Stop
          </button>

          <button
            onClick={reset}
            style={styles.btnGray}
          >
            🔄 Reset
          </button>

          <h2>
            👉 {result}
          </h2>

          <div style={styles.card}>
            <h3>
              🧠 Recent Letters
            </h3>

            {history.map((h, i) => (
              <p key={i}>{h}</p>
            ))}
          </div>

          <div style={styles.card}>
            <h3>
              📖 Word Builder
            </h3>

            <p>
              {sentence || "..."}
            </p>
          </div>
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
    fontFamily: "sans-serif",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },

  container: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
  },

  videoBox: {
    position: "relative",
    width: 700,
    maxWidth: "100%",
    aspectRatio: "16/9",
    borderRadius: 20,
    overflow: "hidden",
    border: "2px solid #334155",
  },

  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
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
    gap: 12,
    minWidth: 260,
  },

  select: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    fontSize: 16,
  },

  btn: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "#2563eb",
    color: "white",
    fontSize: 16,
    cursor: "pointer",
  },

  btnGreen: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "#16a34a",
    color: "white",
    fontSize: 16,
    cursor: "pointer",
  },

  btnRed: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "#dc2626",
    color: "white",
    fontSize: 16,
    cursor: "pointer",
  },

  btnGray: {
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "#475569",
    color: "white",
    fontSize: 16,
    cursor: "pointer",
  },

  card: {
    background: "#1e293b",
    padding: 14,
    borderRadius: 16,
  },
}