import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

// The photograph on top of the render: ambient occlusion seats the objects
// on the desk and darkens their seams, bright light blooms, the edges of the frame fall off like a
// lit studio's, and Neutral tone mapping keeps the whites white.
export function Grade() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO aoRadius={0.35} distanceFalloff={0.6} intensity={1.8} quality="medium" halfRes color="#1c1712" />
      {/* the projected frame, the lens and the lamp bloom a little */}
      <Bloom mipmapBlur luminanceThreshold={1.0} luminanceSmoothing={0.25} intensity={0.45} radius={0.75} />
      <SMAA />
      <Vignette offset={0.32} darkness={0.34} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}
