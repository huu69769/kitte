import React, { useState } from "react";
import pressBody from "../assets/press-machine/body.png";
import pressButton from "../assets/press-machine/button.png";

export default function StampPressMachine({ stamp, onPress }) {
  const [phase, setPhase] = useState("idle");
  const [pressed, setPressed] = useState(false);
  const [shake, setShake] = useState(false);

  const doPress = () => {
    if (phase !== "idle" || !stamp) return;
    setPhase("pressing");
    setPressed(true);
    if (navigator.vibrate) navigator.vibrate([15, 30, 40]);
    setTimeout(() => setShake(true), 120);
    setTimeout(() => setShake(false), 240);
    setTimeout(() => setPressed(false), 260);
    setTimeout(() => {
      setPhase("ejecting");
      if (onPress) onPress();
    }, 420);
    setTimeout(() => setPhase("idle"), 1300);
  };

  const C = {
    body: "#2e2b2c",
    bodyHi: "#3d3839",
    red: "#a83a2e",
    redHi: "#c04a3a",
    redDk: "#7a2a20",
    slot: "#1a1718",
    brass: "#c9a24b",
    paper: "#f6f1e6",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(120% 90% at 50% 5%, #34363b, #232427 75%)",
        fontFamily: '"PingFang SC","Microsoft YaHei",system-ui,sans-serif',
        color: "#e8e6e1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        gap: 30,
      }}
    >
      <div style={{ fontSize: 13, letterSpacing: 5, color: "#9a9ea5", textTransform: "uppercase" }}>
        Stamp Press · 压印机
      </div>

      <div
        style={{
          position: "relative",
          width: 260,
          transform: shake ? "translateY(2px)" : "translateY(0)",
          transition: "transform .04s",
        }}
      >
        {/* 机身 */}
        <img src={pressBody} alt="press body" style={{ width: "100%", display: "block" }} />

        {/* 按钮 - 固定位置 */}
        <button
          onClick={doPress}
          disabled={phase !== "idle" || !stamp}
          style={{
            position: "absolute",
            top: "49%",
            left: "50%",
            width: "30%",
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            border: "none",
            cursor: phase === "idle" && stamp ? "pointer" : "default",
            padding: 0,
            background: `url('${pressButton}') center/contain no-repeat`,
            opacity: pressed ? 0.9 : 1,
            transition: pressed ? "none" : "opacity .12s",
          }}
        />

        {/* 出票动画 */}
        {stamp && phase === "ejecting" && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2,
              animation: "eject 0.9s cubic-bezier(.2,.8,.3,1) forwards",
            }}
          >
            <img
              src={stamp.stampUrl}
              alt=""
              style={{ width: 120, filter: "drop-shadow(0 6px 12px rgba(0,0,0,.5))" }}
            />
          </div>
        )}
      </div>

      {/* 等待邮票提示 */}
      {!stamp && (
        <div
          style={{
            fontSize: 12,
            color: "#9a9ea5",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          等待烘焙邮票…
        </div>
      )}

      {stamp && phase === "idle" && (
        <div
          style={{ fontSize: 11, color: "#9a9ea5", textAlign: "center", lineHeight: 1.8 }}
        >
          按下红色按钮压印
        </div>
      )}

      <style>{`
        @keyframes eject {
          0%   { transform: translateX(-50%) translateY(-30px); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateX(-50%) translateY(70px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
