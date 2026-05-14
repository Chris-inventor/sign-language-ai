"use client"

import { useRef, useState } from "react"
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision"

export default function Page() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const landmarkerRef = useRef<HandLandmarker | null>(null)

  const runningRef = useRef(false)
  const lastGestureRef = useRef("")

  const [status, setStatus] = useState("대기 중")
  const [rawText, setRawText] = useState("")
  const [finalText, setFinalText] = useState("")

  // =========================
  // 모델
  // =========================
  const loadModel = async () => {
    if (landmarkerRef.current) return landmarkerRef.current

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    )

    const landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      },
      runningMode: "VIDEO",
      numHands: 1,
    })

    landmarkerRef.current = landmarker
    return landmarker
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

    setStatus("카메라 ON")
  }

  // =========================
  // 제스처
  // =========================
  const detectGesture = (hand: any) => {
    const tips = [8, 12, 16, 20]
    const pip = [6, 10, 14, 18]

    let up = 0

    for (let i = 0; i < tips.length; i++) {
      if (hand[tips[i]].y < hand[pip[i]].y) up++
    }

    if (up === 4) return "HELLO"
    if (up === 0) return "YES"
    if (up === 1) return "NO"

    return "UNKNOWN"
  }

  // =========================
  // 자연어 변환 (🔥 핵심)
  // =========================
  const toNaturalSentence = (text: string) => {
    const words = text.trim().split(" ")

    let result = ""

    for (const w of words) {
      if (w === "HELLO") result += "Hello. "
      else if (w === "YES") result += "Yes, I understand. "
      else if (w === "NO") result += "No. "
    }

    return result.trim()
  }

  // =========================
  // 손 그리기
  // =========================
  const draw = (landmarks: any) => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "red"

    landmarks.forEach((hand: any) => {
      hand.forEach((p: any) => {
        ctx.beginPath()
        ctx.arc(
          p.x * canvas.width,
          p.y * canvas.height,
          5,
          0,
          Math.PI * 2
        )
        ctx.fill()
      })
    })
  }

  // =========================
  // 실시간 루프
  // =========================
  const startDetection = async () => {
    const video = videoRef.current
    if (!video) return

    const landmarker = await loadModel()

    runningRef.current = true

    const detect = () => {
      if (!runningRef.current) return

      try {
        const results = landmarker.detectForVideo(
          video,
          performance.now()
        )

        if (results.landmarks.length > 0) {
          const hand = results.landmarks[0]

          draw(results.landmarks)

          const gesture = detectGesture(hand)

          if (
            gesture !== "UNKNOWN" &&
            gesture !== lastGestureRef.current
          ) {
            lastGestureRef.current = gesture

            setRawText((prev) => {
              const newText = (prev + " " + gesture).trim()

              // 👉 자연문장 변환
              setFinalText(toNaturalSentence(newText))

              return newText
            })

            setStatus(`👉 ${gesture}`)
          }

        } else {
          setStatus("손 없음")
        }
      } catch (err) {
        console.warn(err)
      }

      requestAnimationFrame(detect)
    }

    detect()
  }

  const stop = () => {
    runningRef.current = false
    setStatus("중지됨")
  }

  const reset = () => {
    setRawText("")
    setFinalText("")
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>🧠 STEP 5: 자연어 번역</h1>

      <p>{status}</p>

      <div style={{ position: "relative", width: 600, height: 400 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%" }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      <button onClick={startCamera}>카메라</button>
      <button onClick={startDetection}>시작</button>
      <button onClick={stop}>중지</button>
      <button onClick={reset}>초기화</button>

      <h2>📌 Raw: {rawText}</h2>
      <h2>✨ Natural: {finalText}</h2>
    </main>
  )
}