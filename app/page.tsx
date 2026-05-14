"use client"

import { useRef, useState } from "react"

export default function Page() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [status, setStatus] = useState("READY")
  const [text, setText] = useState("손을 보여주세요 ✋")

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

  const start = () => {
    setStatus("RUNNING")
    setText("HELLO ✋")
  }

  const stop = () => {
    setStatus("STOPPED")
  }

  const reset = () => {
    setStatus("READY")
    setText("손을 보여주세요 ✋")
  }

  return (
    <div style={styles.bg}>

      <div style={styles.card}>

        {/* LEFT */}
        <div style={styles.left}>

          <h1 style={styles.title}>
            🧠 SIGN AI
          </h1>

          <div style={styles.status}>
            {status}
          </div>

          <div style={styles.videoBox}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.video}
            />
          </div>

          {/* 버튼 그룹 (중요) */}
          <div style={styles.buttonCol}>

            <button style={styles.blue} onClick={startCamera}>
              📷 카메라 시작
            </button>

            <div style={styles.row}>
              <button style={styles.green} onClick={start}>
                ▶ 시작
              </button>

              <button style={styles.red} onClick={stop}>
                ⏹ 중지
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div style={styles.right}>

          <h2 style={styles.subtitle}>
            RESULT
          </h2>

          <div style={styles.result}>
            {text}
          </div>

          <button style={styles.gray} onClick={reset}>
            🔄 초기화
          </button>

        </div>

      </div>

    </div>
  )
}

const styles: any = {

  bg: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#0f172a,#1e293b)",
  },

  card: {
    display: "flex",
    gap: 20,
    padding: 20,
    width: "90%",
    maxWidth: 1000,
    background: "#111827",
    borderRadius: 20,
    color: "white",
  },

  left: { flex: 1 },
  right: { flex: 1 },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },

  status: {
    color: "#60a5fa",
    marginBottom: 10,
  },

  videoBox: {
    background: "black",
    height: 300,
    borderRadius: 15,
    overflow: "hidden",
  },

  video: {
    width: "100%",
    height: "100%",
  },

  buttonCol: {
    marginTop: 15,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  row: {
    display: "flex",
    gap: 10,
  },

  blue: {
    padding: 10,
    background: "#2563eb",
    border: "none",
    borderRadius: 10,
    color: "white",
  },

  green: {
    flex: 1,
    padding: 10,
    background: "#16a34a",
    border: "none",
    borderRadius: 10,
    color: "white",
  },

  red: {
    flex: 1,
    padding: 10,
    background: "#ef4444",
    border: "none",
    borderRadius: 10,
    color: "white",
  },

  subtitle: {
    fontSize: 20,
    marginBottom: 10,
  },

  result: {
    background: "#0f172a",
    height: 300,
    borderRadius: 15,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 24,
  },

  gray: {
    marginTop: 10,
    width: "100%",
    padding: 10,
    background: "#374151",
    border: "none",
    borderRadius: 10,
    color: "white",
  },
}