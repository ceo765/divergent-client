import { BackSide } from "three";

// Большое тёмное помещение ближайшего будущего (hangar/showroom).
// M1: заглушка из примитивов - пол + «коробка» стен (нормали внутрь через BackSide).
// Позже заменим на полноценный GLB-энвайронмент; геометрия отвязана от логики.

export function Hangar() {
  return (
    <group>
      {/* Пол */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0a0d16" metalness={0.35} roughness={0.65} />
      </mesh>

      {/* Стены/потолок - большая коробка, видимая изнутри */}
      <mesh position={[0, 12, 0]}>
        <boxGeometry args={[80, 24, 80]} />
        <meshStandardMaterial color="#070912" side={BackSide} metalness={0.15} roughness={1} />
      </mesh>

      {/* Пара световых «полос» на полу для масштаба и глубины */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -6]}>
        <planeGeometry args={[0.15, 40]} />
        <meshBasicMaterial color="#1c3a8a" toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 6]}>
        <planeGeometry args={[0.15, 40]} />
        <meshBasicMaterial color="#1c3a8a" toneMapped={false} />
      </mesh>
    </group>
  );
}
