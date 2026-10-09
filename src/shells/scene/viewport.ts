/* ---------------------------------------------------------------------------
   The viewport — plain three.js, no React. Mounted through the kit's
   <MountSurface>, which hands it a <div>. It reads the two stores (params
   and ui), writes back to them (gizmo drags, picking), and exposes an
   imperative `engine` for the chrome's exports and camera commands.

   Rendering is on demand: a rAF loop that only draws when something moved.
   Pipeline: RenderPass → bloom → selection outline → OutputPass (tone map).
   Exports and thumbnails run inside the frame loop so the visible canvas
   never shows an intermediate size.
--------------------------------------------------------------------------- */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { params, ui, OBJ, MESHES, LIGHTS, COLOURWAYS, type V, type Vec3, type Pose, type View, type MatType, type LightType, type XYZ } from './state'
import { bodyGeometry, capGeometry, ringGeometry, baseGeometry, pedestalGeometry, knitNormalMap, lightGlyph, toonRamp } from './geometry'
import type { AxisId } from './local/AxisGizmo'

export interface EngineApi {
  canvas: HTMLCanvasElement
  goTo: (p: Pose, ms?: number) => void
  pose: () => Pose
  snapAxis: (a: AxisId) => void
  frame: () => void
  render: (o: { scale: number; transparent: boolean }) => Promise<Blob>
  glb: () => Promise<Blob>
  cameraJSON: () => Record<string, unknown>
  thumbnails: (views: View[]) => Promise<Record<string, string>>
  onCamera: (fn: (m: ArrayLike<number>) => void) => () => void
}
export const engine: { current: EngineApi | null } = { current: null }

const D2R = Math.PI / 180
const TONE: Record<string, THREE.ToneMapping> = { aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, neutral: THREE.NeutralToneMapping, none: THREE.NoToneMapping }
const AIM = new THREE.Vector3(0, 1.25, 0)
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const r3 = (n: number) => Math.round(n * 1000) / 1000
const cssVar = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

interface MeshSlot { mesh: THREE.Mesh; mats: Record<MatType, THREE.Material> }
type AnyLight = THREE.DirectionalLight | THREE.SpotLight | THREE.PointLight
interface LightSlot { rig: THREE.Group; light: AnyLight | null; type: LightType | null; proxy: THREE.Sprite; beam: THREE.Line }

export function mountViewport(el: HTMLDivElement): () => void {
  /* --- renderer ---------------------------------------------------------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const canvas = renderer.domElement
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none'
  canvas.tabIndex = 0
  canvas.setAttribute('aria-label', '3D viewport. Drag to orbit, right-drag to pan, scroll to zoom, click to select.')
  el.appendChild(canvas)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex

  const content = new THREE.Group() // exported
  content.name = 'Scene'
  const helpers = new THREE.Group() // editor-only
  scene.add(content, helpers)
  const aim = new THREE.Object3D()
  aim.position.copy(AIM)
  helpers.add(aim)

  /* --- objects ----------------------------------------------------------- */
  const nodes = new Map<string, THREE.Object3D>()
  const meshSlots = new Map<string, MeshSlot>()
  const knit = knitNormalMap()

  const speaker = new THREE.Group()
  speaker.name = 'Aura speaker'
  content.add(speaker)
  nodes.set('speaker', speaker)

  const geos: Record<string, () => THREE.BufferGeometry> = { body: bodyGeometry, cap: capGeometry, ring: ringGeometry, base: baseGeometry, pedestal: pedestalGeometry }
  for (const id of MESHES) {
    const normalMap = id === 'body' ? knit : null
    const mats: Record<MatType, THREE.Material> = {
      standard: new THREE.MeshStandardMaterial({ normalMap, normalScale: new THREE.Vector2(0.55, 0.55) }),
      physical: new THREE.MeshPhysicalMaterial({ normalMap, normalScale: new THREE.Vector2(0.55, 0.55), clearcoatRoughness: 0.06, sheenRoughness: 0.55, thickness: 0.35, ior: 1.45 }),
      toon: new THREE.MeshToonMaterial({ normalMap }),
    }
    const mesh = new THREE.Mesh(geos[id](), mats.standard)
    mesh.name = OBJ[id].name
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.id = id
    ;(OBJ[id].parent === 'speaker' ? speaker : content).add(mesh)
    nodes.set(id, mesh)
    meshSlots.set(id, { mesh, mats })
  }

  const floorMat = new THREE.ShadowMaterial({ opacity: 0.3 })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2), floorMat)
  floor.receiveShadow = true
  floor.name = 'Shadow catcher'
  content.add(floor)
  nodes.set('floor', floor)

  const grid = new THREE.GridHelper(24, 48)
  const gridMat = grid.material as THREE.LineBasicMaterial
  gridMat.transparent = true
  gridMat.depthWrite = false
  grid.position.y = 0.001
  helpers.add(grid)

  /* --- lights ------------------------------------------------------------ */
  const glyph = lightGlyph()
  const lightSlots = new Map<string, LightSlot>()
  for (const id of LIGHTS) {
    const rig = new THREE.Group()
    rig.name = OBJ[id].name
    content.add(rig)
    nodes.set(id, rig)
    const proxy = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyph, depthTest: false, depthWrite: false, sizeAttenuation: false, transparent: true }))
    proxy.scale.set(0.05, 0.05, 1)
    proxy.renderOrder = 999
    proxy.userData.id = id
    helpers.add(proxy)
    const beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), AIM.clone()]), new THREE.LineDashedMaterial({ dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0.8, depthTest: false }))
    beam.renderOrder = 998
    beam.visible = false
    helpers.add(beam)
    lightSlots.set(id, { rig, light: null, type: null, proxy, beam })
  }

  const makeLight = (type: LightType): AnyLight => {
    let l: THREE.DirectionalLight | THREE.SpotLight | THREE.PointLight
    if (type === 'directional') {
      l = new THREE.DirectionalLight()
      l.target = aim
      const cam = l.shadow.camera
      cam.left = cam.bottom = -3
      cam.right = cam.top = 3
      cam.near = 0.5
      cam.far = 30
    } else if (type === 'spot') {
      l = new THREE.SpotLight()
      l.target = aim
      l.decay = 2
      l.shadow.focus = 1
      l.shadow.camera.near = 0.5
      l.shadow.camera.far = 30
    } else {
      l = new THREE.PointLight()
      l.decay = 2
      l.shadow.camera.near = 0.2
      l.shadow.camera.far = 30
    }
    l.shadow.mapSize.set(type === 'point' ? 1024 : 2048, type === 'point' ? 1024 : 2048)
    l.shadow.bias = -0.00015
    l.shadow.normalBias = 0.02
    l.shadow.blurSamples = 16
    return l
  }

  /* --- cameras + controls ------------------------------------------------ */
  const persp = new THREE.PerspectiveCamera(30, 1, 0.05, 300)
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -200, 400)
  let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera = persp
  let orthoH = 4
  persp.position.set(5.1, 3.9, 6.1)

  const orbit = new OrbitControls(camera as THREE.PerspectiveCamera | THREE.OrthographicCamera, canvas)
  orbit.target.copy(AIM)
  orbit.enableDamping = true
  orbit.dampingFactor = 0.09
  orbit.minDistance = 1.2
  orbit.maxDistance = 40
  orbit.screenSpacePanning = true
  orbit.update()

  const tc = new TransformControls(camera, canvas)
  tc.size = 0.85
  tc.setSpace('local')
  helpers.add(tc.getHelper())

  /* --- post -------------------------------------------------------------- */
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
  const composer = new EffectComposer(renderer, rt)
  const renderPass = new RenderPass(scene, camera)
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.32, 1.4)
  const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera)
  outline.edgeStrength = 4
  outline.edgeThickness = 1
  outline.edgeGlow = 0
  outline.pulsePeriod = 0
  const output = new OutputPass()
  composer.addPass(renderPass)
  composer.addPass(bloom)
  composer.addPass(outline)
  composer.addPass(output)

  const setAccent = () => {
    const a = new THREE.Color(cssVar('--signal', '#0d99ff'))
    outline.visibleEdgeColor.copy(a)
    outline.hiddenEdgeColor.copy(a).multiplyScalar(0.35)
    dirty = true
  }

  /* --- state → scene ----------------------------------------------------- */
  let dirty = true
  let lastProjection = 'perspective'
  const values = (): V => {
    const v = params.values()
    const pre = ui.getState().preview
    const cw = pre ? COLOURWAYS.find((c) => c.id === pre) : null
    return cw ? { ...v, ...cw.values } : v
  }
  const setXf = (o: THREE.Object3D, v: V, id: string) => {
    const p = v[`${id}_pos`] as Vec3, r = v[`${id}_rot`] as Vec3, s = v[`${id}_scale`] as Vec3
    o.position.set(p.x, p.y, p.z)
    o.rotation.set(r.x * D2R, r.y * D2R, r.z * D2R)
    o.scale.set(s.x || 1e-4, s.y || 1e-4, s.z || 1e-4)
    o.visible = v[`${id}_visible`] !== false
  }

  const apply = () => {
    const v = values()
    setXf(speaker, v, 'speaker')
    for (const [id, { mesh, mats }] of meshSlots) {
      setXf(mesh, v, id)
      const type = v[`${id}_mtype`] as MatType
      const color = new THREE.Color(v[`${id}_color`])
      const m = mats[type]
      mesh.material = m
      if (m instanceof THREE.MeshStandardMaterial) {
        m.color.copy(color)
        m.roughness = v[`${id}_rough`]
        m.metalness = v[`${id}_metal`]
      }
      if (m instanceof THREE.MeshPhysicalMaterial) {
        m.clearcoat = v[`${id}_clearcoat`]
        m.sheen = v[`${id}_sheen`]
        m.sheenColor.copy(color).lerp(new THREE.Color('#ffffff'), 0.35)
        m.transmission = v[`${id}_transmission`]
      }
      if (m instanceof THREE.MeshToonMaterial) {
        m.color.copy(color)
        const ramp = toonRamp(v[`${id}_bands`])
        if (m.gradientMap !== ramp) { m.gradientMap = ramp; m.needsUpdate = true }
      }
      const e = m as THREE.MeshStandardMaterial
      e.emissive?.copy(color)
      e.emissiveIntensity = v[`${id}_emission`]
    }
    floor.visible = v.floor_visible !== false
    floorMat.opacity = v.floor_opacity

    for (const [id, s] of lightSlots) {
      const type = v[`${id}_ltype`] as LightType
      if (type !== s.type) {
        if (s.light) { s.rig.remove(s.light); s.light.dispose() }
        s.light = makeLight(type)
        s.light.name = OBJ[id].name
        s.rig.add(s.light)
        s.type = type
      }
      setXf(s.rig, v, id)
      const l = s.light!
      l.color.set(v[`${id}_lcolor`])
      const d = s.rig.position.distanceTo(AIM)
      l.intensity = v[`${id}_intensity`] * (type === 'directional' ? 1 : d * d)
      l.castShadow = !!v[`${id}_shadow`] && !!v.shadows
      l.shadow.radius = v.shadowSoft
      if (l instanceof THREE.SpotLight) {
        l.angle = v[`${id}_angle`] * D2R
        l.penumbra = v[`${id}_penumbra`]
      }
      s.proxy.position.copy(s.rig.position)
      s.proxy.visible = s.rig.visible
      ;(s.proxy.material as THREE.SpriteMaterial).color.set(v[`${id}_lcolor`])
      const pos = s.beam.geometry.getAttribute('position') as THREE.BufferAttribute
      pos.setXYZ(0, s.rig.position.x, s.rig.position.y, s.rig.position.z)
      pos.needsUpdate = true
      s.beam.computeLineDistances()
    }

    const bg = new THREE.Color(v.bg)
    scene.background = bg
    scene.environmentIntensity = v.envIntensity
    scene.environmentRotation.set(0, v.envRotation * D2R, 0)
    renderer.toneMapping = TONE[v.toneMapping] ?? THREE.NeutralToneMapping
    renderer.toneMappingExposure = v.exposure
    bloom.strength = v.glow
    bloom.enabled = v.glow > 0.001

    grid.visible = !!v.grid
    const lum = bg.r * 0.3 + bg.g * 0.59 + bg.b * 0.11
    gridMat.color.set(lum > 0.45 ? '#000000' : '#ffffff')
    gridMat.opacity = lum > 0.45 ? 0.12 : 0.1

    orbit.autoRotate = !!v.turntable
    orbit.autoRotateSpeed = v.spin
    if (v.projection !== lastProjection) setProjection(v.projection)
    if (persp.fov !== v.fov) { persp.fov = v.fov; resize() }
    syncSelection()
    dirty = true
  }

  /* --- selection + gizmo ------------------------------------------------- */
  const syncSelection = () => {
    const { selected, tool } = ui.getState()
    const node = selected ? nodes.get(selected) : null
    const kind = selected ? OBJ[selected]?.kind : null
    const locked = selected ? params.values()[`${selected}_locked`] : false
    outline.selectedObjects = node && (kind === 'mesh' || kind === 'group') ? [node] : []
    const accent = cssVar('--signal', '#0d99ff')
    for (const [id, s] of lightSlots) {
      const on = id === selected
      s.beam.visible = on && s.rig.visible && s.type !== 'point'
      ;(s.beam.material as THREE.LineDashedMaterial).color.set(on ? accent : '#ffffff')
      s.proxy.scale.setScalar(on ? 0.062 : 0.05)
    }
    const canTransform = node && (kind === 'mesh' || kind === 'group' || kind === 'light') && tool !== 'select' && !locked && node.visible
    if (canTransform) {
      if (tc.object !== node) tc.attach(node)
      tc.setMode(kind === 'light' ? 'translate' : tool)
    } else if (tc.object) tc.detach()
    dirty = true
  }

  let dragId: string | null = null
  tc.addEventListener('dragging-changed', (e) => { orbit.enabled = !e.value })
  tc.addEventListener('mouseDown', () => { dragId = ui.getState().selected })
  tc.addEventListener('objectChange', () => {
    const id = dragId
    const o = tc.object
    if (!id || !o) return
    params.patch({
      [`${id}_pos`]: { x: r3(o.position.x), y: r3(o.position.y), z: r3(o.position.z) },
      [`${id}_rot`]: { x: r3(o.rotation.x / D2R), y: r3(o.rotation.y / D2R), z: r3(o.rotation.z / D2R) },
      [`${id}_scale`]: { x: r3(o.scale.x), y: r3(o.scale.y), z: r3(o.scale.z) },
    }, { commit: false })
  })
  tc.addEventListener('mouseUp', () => { params.commit(); dragId = null })
  tc.addEventListener('change', () => { dirty = true })
  orbit.addEventListener('change', () => { dirty = true; if (!tween && userOrbit && ui.getState().activeView) ui.setState({ activeView: null }) })
  let userOrbit = false
  orbit.addEventListener('start', () => { userOrbit = true })
  orbit.addEventListener('end', () => { userOrbit = false })

  /* --- picking ----------------------------------------------------------- */
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  let down: { x: number; y: number } | null = null
  const visibleChain = (o: THREE.Object3D | null): boolean => { for (let n = o; n; n = n.parent) if (!n.visible) return false; return true }
  const onDown = (e: PointerEvent) => { down = tc.axis ? null : { x: e.clientX, y: e.clientY } }
  const onUp = (e: PointerEvent) => {
    if (!down || e.button !== 0 || tc.dragging) return
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return
    down = null
    const r = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const v = params.values()
    const pickable: THREE.Object3D[] = []
    for (const [id, s] of meshSlots) if (!v[`${id}_locked`] && visibleChain(s.mesh)) pickable.push(s.mesh)
    for (const [id, s] of lightSlots) if (!v[`${id}_locked`] && s.proxy.visible) pickable.push(s.proxy)
    const hit = ray.intersectObjects(pickable, false)[0]
    const id = hit?.object.userData.id as string | undefined
    if (!id) return ui.setState({ selected: null })
    // Figma/Spline: the first click selects the group; a click inside an
    // already-selected group (or ⌘/Ctrl-click) selects the part itself.
    const parent = OBJ[id].parent
    const cur = ui.getState().selected
    const deep = e.metaKey || e.ctrlKey || !parent || v[`${parent}_locked`] || cur === parent || (cur && OBJ[cur]?.parent === parent)
    ui.setState({ selected: deep ? id : parent! })
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointerup', onUp)

  /* --- camera helpers ---------------------------------------------------- */
  let tween: { from: Pose; to: Pose; t0: number; ms: number } | null = null
  const pose = (): Pose => ({ position: camera.position.toArray() as XYZ, target: orbit.target.toArray() as XYZ })
  const goTo = (to: Pose, ms = 650) => { tween = { from: pose(), to, t0: performance.now(), ms } }
  const stepTween = (now: number) => {
    if (!tween) return false
    const k = Math.min(1, (now - tween.t0) / tween.ms)
    const e = ease(k)
    const a = tween.from, b = tween.to
    camera.position.set(...(a.position.map((x, i) => x + (b.position[i] - x) * e) as XYZ))
    orbit.target.set(...(a.target.map((x, i) => x + (b.target[i] - x) * e) as XYZ))
    if (k >= 1) tween = null
    return true
  }

  const setProjection = (kind: string) => {
    const target = orbit.target
    const fovR = persp.fov * D2R
    if (kind === 'orthographic' && camera === persp) {
      orthoH = 2 * persp.position.distanceTo(target) * Math.tan(fovR / 2)
      ortho.position.copy(persp.position)
      ortho.quaternion.copy(persp.quaternion)
      ortho.zoom = 1
      camera = ortho
    } else if (kind === 'perspective' && camera === ortho) {
      const h = orthoH / ortho.zoom
      const dist = h / (2 * Math.tan(fovR / 2))
      const dir = ortho.position.clone().sub(target).normalize()
      persp.position.copy(target).addScaledVector(dir, dist)
      camera = persp
    }
    lastProjection = kind
    orbit.object = camera
    tc.camera = camera
    renderPass.camera = camera
    outline.renderCamera = camera
    resize()
    orbit.update()
  }

  const snapAxis = (a: AxisId) => {
    const dir = new THREE.Vector3(a[1] === 'x' ? 1 : 0, a[1] === 'y' ? 1 : 0, a[1] === 'z' ? 1 : 0).multiplyScalar(a[0] === '-' ? -1 : 1)
    if (a[1] === 'y') dir.z = 0.0008 // keep OrbitControls off the pole
    const t = orbit.target.clone()
    const dist = camera.position.distanceTo(t)
    goTo({ position: t.clone().addScaledVector(dir.normalize(), dist).toArray() as XYZ, target: t.toArray() as XYZ }, 450)
    ui.setState({ activeView: null })
  }

  const frame = () => {
    const sel = ui.getState().selected
    const node = sel && OBJ[sel]?.kind !== 'camera' && OBJ[sel]?.kind !== 'floor' ? nodes.get(sel) : null
    const box = new THREE.Box3()
    if (node && OBJ[sel!].kind === 'light') box.setFromCenterAndSize(node.position, new THREE.Vector3(1, 1, 1))
    else if (node) box.setFromObject(node)
    else { box.setFromObject(speaker); box.union(new THREE.Box3().setFromObject(nodes.get('pedestal')!)) }
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const dist = (sphere.radius * 1.25) / Math.sin((persp.fov * D2R) / 2)
    const dir = camera.position.clone().sub(orbit.target).normalize()
    goTo({ position: sphere.center.clone().addScaledVector(dir, dist).toArray() as XYZ, target: sphere.center.toArray() as XYZ })
    if (camera === ortho) { ortho.zoom = orthoH / (sphere.radius * 2.6); ortho.updateProjectionMatrix() }
  }

  /* --- size + safe area -------------------------------------------------- */
  let W = 1, H = 1
  const applyOffset = (cam: THREE.PerspectiveCamera | THREE.OrthographicCamera, w: number, h: number) => {
    const { l, r, t, b } = ui.getState().insets
    cam.setViewOffset(w, h, (r - l) / 2, (b - t) / 2, w, h)
  }
  const resize = () => {
    W = Math.max(1, el.clientWidth)
    H = Math.max(1, el.clientHeight)
    renderer.setSize(W, H, false)
    composer.setPixelRatio(renderer.getPixelRatio())
    composer.setSize(W, H)
    persp.aspect = W / H
    const a = W / H
    ortho.left = (-orthoH * a) / 2
    ortho.right = (orthoH * a) / 2
    ortho.top = orthoH / 2
    ortho.bottom = -orthoH / 2
    applyOffset(persp, W, H)
    applyOffset(ortho, W, H)
    persp.updateProjectionMatrix()
    ortho.updateProjectionMatrix()
    dirty = true
  }
  const ro = new ResizeObserver(resize)
  ro.observe(el)

  /* --- frame loop -------------------------------------------------------- */
  const camListeners = new Set<(m: ArrayLike<number>) => void>()
  const jobs: (() => void)[] = []
  const inFrame = <T,>(fn: () => T) => new Promise<T>((res, rej) => jobs.push(() => { try { res(fn()) } catch (e) { rej(e) } }))
  let raf = 0
  let last = performance.now()
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    const tweening = stepTween(now)
    const moved = orbit.update(dt) || tweening
    if (jobs.length) { jobs.splice(0).forEach((j) => j()); dirty = true }
    if (!moved && !dirty) return
    composer.render(dt)
    dirty = false
    camera.updateMatrixWorld()
    const m = camera.matrixWorldInverse.elements
    camListeners.forEach((fn) => fn(m))
  }

  /* --- offscreen renders (exports + thumbnails) -------------------------- */
  const withEditorHidden = <T,>(fn: () => T): T => {
    const was = helpers.visible
    const sel = outline.selectedObjects
    helpers.visible = false
    outline.selectedObjects = []
    try { return fn() } finally { helpers.visible = was; outline.selectedObjects = sel }
  }

  const renderImage = ({ scale, transparent }: { scale: number; transparent: boolean }) =>
    inFrame(() => withEditorHidden(() => {
      // Render exactly the uncovered region the user is looking at, at `scale`×.
      const { l, r, t, b } = ui.getState().insets
      const sw = Math.max(1, W - l - r), sh = Math.max(1, H - t - b)
      const ow = Math.round(sw * scale), oh = Math.round(sh * scale)
      const pr = renderer.getPixelRatio()
      // setViewOffset crops the full W×H frustum to the safe rect (it also sets aspect = W/H).
      const cam = camera.clone() as typeof camera
      cam.setViewOffset(W, H, l, t, sw, sh)
      cam.updateProjectionMatrix()
      renderer.setPixelRatio(1)
      renderer.setSize(ow, oh, false)
      const bg = scene.background
      if (transparent) {
        scene.background = null
        renderer.setClearColor(0x000000, 0)
        renderer.render(scene, cam)
      } else {
        composer.setPixelRatio(1)
        composer.setSize(ow, oh)
        renderPass.camera = cam
        composer.render(0)
        renderPass.camera = camera
      }
      const out = document.createElement('canvas')
      out.width = ow
      out.height = oh
      out.getContext('2d')!.drawImage(canvas, 0, 0)
      scene.background = bg
      renderer.setPixelRatio(pr)
      resize()
      return out
    })).then((c) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Encode failed'))), 'image/png')))

  const thumbnails = (views: View[]) =>
    inFrame(() => withEditorHidden(() => {
      const tw = 176, th = 112
      const pr = renderer.getPixelRatio()
      const cam = new THREE.PerspectiveCamera(persp.fov, tw / th, 0.05, 300)
      const out: Record<string, string> = {}
      const c2 = document.createElement('canvas')
      c2.width = tw
      c2.height = th
      const g = c2.getContext('2d')!
      renderer.setScissorTest(true)
      for (const v of views) {
        cam.position.set(...v.position)
        cam.lookAt(...v.target)
        renderer.setViewport(0, 0, tw / pr, th / pr)
        renderer.setScissor(0, 0, tw / pr, th / pr)
        renderer.render(scene, cam)
        g.clearRect(0, 0, tw, th)
        g.drawImage(canvas, 0, canvas.height - th, tw, th, 0, 0, tw, th)
        out[v.id] = c2.toDataURL('image/jpeg', 0.85)
      }
      renderer.setScissorTest(false)
      renderer.setViewport(0, 0, W, H)
      return out
    }))

  const glb = async () => {
    const exporter = new GLTFExporter()
    const objs = [speaker, nodes.get('pedestal')!, ...[...lightSlots.values()].map((s) => s.rig)].filter((o) => o.visible)
    const res = await exporter.parseAsync(objs, { binary: true, onlyVisible: true })
    return new Blob([res as ArrayBuffer], { type: 'model/gltf-binary' })
  }

  const cameraJSON = () => ({
    projection: camera === persp ? 'perspective' : 'orthographic',
    fov: persp.fov,
    position: camera.position.toArray().map(r3),
    target: orbit.target.toArray().map(r3),
    zoom: r3(camera.zoom),
    up: camera.up.toArray(),
    near: camera.near,
    far: camera.far,
  })

  /* --- wiring ------------------------------------------------------------ */
  let tris = 0
  for (const s of meshSlots.values()) tris += (s.mesh.geometry.index?.count ?? s.mesh.geometry.getAttribute('position').count) / 3
  ui.setState({ stats: { tris: Math.round(tris), meshes: meshSlots.size, lights: lightSlots.size } })

  setAccent()
  apply()
  resize()
  const offParams = params.subscribe(apply)
  const offUi = ui.subscribe((s, prev) => {
    if (s.preview !== prev.preview) apply()
    else if (s.selected !== prev.selected || s.tool !== prev.tool) syncSelection()
    if (s.insets !== prev.insets) resize()
  })
  const onTheme = () => setAccent()
  window.addEventListener('studio:theme', onTheme)
  raf = requestAnimationFrame(tick)

  engine.current = {
    canvas, goTo, pose, snapAxis, frame, render: renderImage, glb, cameraJSON, thumbnails,
    onCamera: (fn) => { camListeners.add(fn); camera.updateMatrixWorld(); fn(camera.matrixWorldInverse.elements); return () => camListeners.delete(fn) },
  }

  return () => {
    cancelAnimationFrame(raf)
    ro.disconnect()
    offParams()
    offUi()
    window.removeEventListener('studio:theme', onTheme)
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointerup', onUp)
    tc.detach()
    tc.dispose()
    orbit.dispose()
    composer.dispose()
    rt.dispose()
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose?.()
    })
    for (const s of meshSlots.values()) Object.values(s.mats).forEach((m) => m.dispose())
    knit.dispose()
    glyph.dispose()
    envTex.dispose()
    pmrem.dispose()
    renderer.dispose()
    canvas.remove()
    if (engine.current?.canvas === canvas) engine.current = null
  }
}
