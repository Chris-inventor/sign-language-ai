// =========================
// 알파벳 인식 (개선 버전)
// 기존 기능 전부 유지
// 기존 getGesture 전체 교체
// =========================

const getGesture = (landmarks: any) => {
  if (!landmarks || landmarks.length === 0)
    return "NONE"

  const hand = landmarks[0]

  const isUp = (
    tip: any,
    base: any
  ) => tip.y < base.y

  const index = isUp(hand[8], hand[6])
  const middle = isUp(hand[12], hand[10])
  const ring = isUp(hand[16], hand[14])
  const pinky = isUp(hand[20], hand[18])

  const thumb =
    hand[4].x < hand[3].x

  // 거리 계산
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
  // ASL ALPHABET
  // =========================

  // A
  if (
    thumb &&
    !index &&
    !middle &&
    !ring &&
    !pinky
  )
    return "A"

  // B
  if (
    index &&
    middle &&
    ring &&
    pinky &&
    !thumb
  )
    return "B"

  // C
  if (
    thumbIndex > 0.15 &&
    index &&
    middle &&
    ring &&
    pinky
  )
    return "C"

  // D
  if (
    index &&
    !middle &&
    !ring &&
    !pinky &&
    !thumb
  )
    return "D"

  // E
  if (
    !thumb &&
    !index &&
    !middle &&
    !ring &&
    !pinky
  )
    return "E"

  // F
  if (
    thumbIndex < 0.05 &&
    middle &&
    !ring &&
    !pinky
  )
    return "F"

  // G
  if (
    thumb &&
    index &&
    !middle &&
    !ring &&
    pinky
  )
    return "G"

  // H
  if (
    index &&
    middle &&
    !ring &&
    pinky
  )
    return "H"

  // I
  if (
    pinky &&
    !index &&
    !middle &&
    !ring
  )
    return "I"

  // J
  if (
    pinky &&
    thumb &&
    !index &&
    !middle &&
    !ring
  )
    return "J"

  // K
  if (
    thumb &&
    index &&
    middle &&
    !ring &&
    !pinky
  )
    return "K"

  // L
  if (
    thumb &&
    index &&
    !middle &&
    !ring &&
    !pinky
  )
    return "L"

  // M
  if (
    !thumb &&
    index &&
    middle &&
    ring &&
    !pinky
  )
    return "M"

  // N
  if (
    !thumb &&
    index &&
    middle &&
    !ring &&
    !pinky
  )
    return "N"

  // O
  if (
    thumbIndex < 0.08 &&
    !pinky
  )
    return "O"

  // P
  if (
    thumb &&
    middle &&
    !index &&
    !ring &&
    !pinky
  )
    return "P"

  // Q
  if (
    thumb &&
    ring &&
    !index &&
    !middle &&
    !pinky
  )
    return "Q"

  // R
  if (
    index &&
    middle &&
    ring &&
    !pinky
  )
    return "R"

  // S
  if (
    !thumb &&
    !index &&
    !middle &&
    ring &&
    !pinky
  )
    return "S"

  // T
  if (
    thumb &&
    !index &&
    middle &&
    !ring &&
    !pinky
  )
    return "T"

  // U
  if (
    index &&
    middle &&
    !ring &&
    !pinky &&
    thumb
  )
    return "U"

  // V
  if (
    index &&
    middle &&
    !ring &&
    !pinky &&
    !thumb
  )
    return "V"

  // W
  if (
    index &&
    middle &&
    ring &&
    !pinky
  )
    return "W"

  // X
  if (
    index &&
    !middle &&
    ring &&
    !pinky
  )
    return "X"

  // Y
  if (
    thumb &&
    pinky &&
    !index &&
    !middle &&
    !ring
  )
    return "Y"

  // Z
  if (
    index &&
    pinky &&
    !middle &&
    !ring
  )
    return "Z"

  return "UNKNOWN"
}