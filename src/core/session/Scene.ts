// A scene: one row of the session grid. Launching it launches every slot in
// the row at one quantised time (an empty slot stops its track, a track
// without a slot in the row is left alone), so a set moves as a whole.

export interface ScoreScene {
  /** Unique across the score's scenes. */
  id: string
  name: string
}

/** A document that has scenes (a `Score`, or anything shaped like one). */
export interface SceneHolder {
  scenes: readonly ScoreScene[]
}

export function findScene(holder: SceneHolder, id: string): ScoreScene | undefined {
  return holder.scenes.find((scene) => scene.id === id)
}

/** Scene ids in row order. */
export function sceneOrder(holder: SceneHolder): string[] {
  return holder.scenes.map((scene) => scene.id)
}

/** The scene `steps` rows after `id` (negative for before), wrapping; undefined when there are none. */
export function sceneNeighbour(
  holder: SceneHolder,
  id: string,
  steps: number,
): ScoreScene | undefined {
  const { scenes } = holder
  if (scenes.length === 0) return undefined
  const index = scenes.findIndex((scene) => scene.id === id)
  if (index === -1) return scenes[0]
  const next = (((index + steps) % scenes.length) + scenes.length) % scenes.length
  return scenes[next]
}
