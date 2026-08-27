import React, { useState } from "react";
import pressBody from "../assets/press-machine/body.png";
import pressButton from "../assets/press-machine/button.png";

export default function StampPressMachine({ cropRef, onPress }) {
  const [phase, setPhase] = useState("idle");
  const [pressed, setPressed] = useState(false);
  const [shake, setShake] = useState(false);

  const doPress = () => {
    if (phase !== "idle" || !cropRef?.current) return;
    setPhase("pressing");
    setPressed(true);
    if (navigator.vibrate) navigator.vibrate([15, 30, 40]);
    setTimeout(() => setShake(true), 120);
    setTimeout(() => setShake(false), 240);
    setTimeout(() => setPressed(false), 260);
    setTimeout(() => {
      setPhase("ejecting");
      cropRef.current.bake();
    }, 420);
    setTimeout(() => setPhase("idle"), 1300);
  };

  return (
    <div
      style={{
        position: "relative",
        height: 380,
        width: "auto",
        transform: shake ? "translateY(2px)" : "translateY(0)",
        transition: "transform .04s",
        cursor: phase === "idle" ? "pointer" : "default",
      }}
    >
      {/* 机身 */}
      <img src={pressBody} alt="press body" style={{ height: "100%", width: "auto", display: "block" }} />

      {/* 按钮 - 固定位置 */}
      <button
        onClick={doPress}
        disabled={phase !== "idle"}
        style={{
          position: "absolute",
          top: "49%",
          left: "50%",
          width: "30%",
          aspectRatio: "1",
          transform: "translate(-50%, -50%)",
          border: "none",
          cursor: phase === "idle" ? "pointer" : "default",
          padding: 0,
          background: `url('${pressButton}') center/contain no-repeat`,
          opacity: pressed ? 0.9 : 1,
          transition: pressed ? "none" : "opacity .12s",
        }}
      />

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
