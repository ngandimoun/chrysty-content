"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import type { Mesh } from "three";

function MoodBlob({
  color,
  position,
  speed,
  audioEnergy,
}: {
  color: string;
  position: [number, number, number];
  speed: number;
  audioEnergy: number;
}) {
  const ref = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * speed * 0.2;
    ref.current.rotation.y = state.clock.elapsedTime * speed * 0.15;
    const scale = 1 + audioEnergy * 0.35;
    ref.current.scale.setScalar(scale);
  });

  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <Sphere ref={ref} args={[1, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.35 + audioEnergy * 0.25}
          speed={2}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.55}
        />
      </Sphere>
    </Float>
  );
}

interface MoodSceneR3fProps {
  colors: [string, string, string];
  energy: number;
  playing: boolean;
  audioEnergy: number;
}

export function MoodSceneR3f({
  colors,
  energy,
  playing,
  audioEnergy,
}: MoodSceneR3fProps) {
  const boost = playing ? audioEnergy : energy * 0.3;

  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.45} />
      <pointLight position={[4, 4, 4]} intensity={1.2} color={colors[0]} />
      <pointLight position={[-4, -2, 2]} intensity={0.8} color={colors[1]} />
      <MoodBlob
        color={colors[0]}
        position={[-1.8, 0.4, 0]}
        speed={0.8}
        audioEnergy={boost}
      />
      <MoodBlob
        color={colors[1]}
        position={[1.6, -0.5, -0.5]}
        speed={1.1}
        audioEnergy={boost}
      />
      <MoodBlob
        color={colors[2]}
        position={[0, 1.2, -1]}
        speed={0.6}
        audioEnergy={boost * 0.8}
      />
    </Canvas>
  );
}
