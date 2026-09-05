// Подиум в центре зала - «якорь» сцены, куда встаёт аватар.
// M1: примитив-заглушка (цилиндр + светящееся кольцо). Позже заменим на GLB.

export function Podium() {
  return (
    <group position={[0, 0, 0]}>
      {/* тело подиума */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.7, 0.2, 72]} />
        <meshStandardMaterial color="#12151f" metalness={0.65} roughness={0.3} />
      </mesh>
      {/* верхняя площадка */}
      <mesh position={[0, 0.21, 0]} receiveShadow>
        <cylinderGeometry args={[1.45, 1.45, 0.02, 72]} />
        <meshStandardMaterial color="#171b28" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* светящееся акцентное кольцо */}
      <mesh position={[0, 0.225, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.34, 72]} />
        <meshBasicMaterial color="#2f6bff" toneMapped={false} />
      </mesh>
    </group>
  );
}
