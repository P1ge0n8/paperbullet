import { PROJECTOR_LENS } from './FilmProjector'
import { Euler, Matrix4, Quaternion, Vector3 } from 'three'

export const MACHINE = new Vector3(-0.49, 0.009, 0.03)
export const SCALE = 1.68
export const PITCH = 0.18
export const WALL_Z = -3.22
const rotation = new Quaternion().setFromEuler(new Euler(PITCH, 0, 0))
const transform = new Matrix4().compose(MACHINE, rotation, new Vector3(SCALE, SCALE, SCALE))
export const LENS = new Vector3(...PROJECTOR_LENS).applyMatrix4(transform)
const axis = new Vector3(0, 0, -1).applyQuaternion(rotation)
export const SCREEN = LENS.clone().addScaledVector(axis, (WALL_Z - LENS.z) / axis.z)

export type Controls = {
  start: number
  finished: boolean
  ready: boolean
  onReady: () => void
  onEnter: () => void
  screenElement?: HTMLElement
}
