#!/bin/bash
set -e
mkdir -p src
echo '{ "name": "product", "private": true, "type": "module", "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0", "three": "^0.186.0" } }' > package.json
cat > src/scene.js <<'J'
import * as THREE from 'three'

/**
 * start(el, { onPick }) mounts the configurator into `el` and returns:
 *   objects            [{ id, name, kind: 'mesh' | 'light' }] — everything an outliner should list
 *   setColor(hex)      product colour (cheap)
 *   setRoughness(0..1) material roughness (cheap)
 *   setLight(0..5)     key light intensity (cheap)
 *   setDetail(n)       tube segments 16..512 — EXPENSIVE: disposes and rebuilds the geometry (~100 ms at 512)
 *   select(id | null)  outline an object in the viewport
 *   renderPNG(scale)   Promise<Blob> of the current view at `scale`× resolution
 *   dispose()          stop rendering and free GPU memory
 * onPick(id | null) fires when the user clicks an object (or empty space) in the viewport.
 */
export function start(el, { onPick } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  el.appendChild(renderer.domElement)
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.set(0, 1, 5); camera.lookAt(0, 0, 0)
  const mat = new THREE.MeshStandardMaterial({ color: '#c8a27a', roughness: 0.4 })
  let detail = 200
  const geo = (n) => new THREE.TorusKnotGeometry(1, 0.3, n, 32)
  const mesh = new THREE.Mesh(geo(detail), mat); mesh.name = 'Product'; mesh.userData.id = 'product'
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.1, 64), new THREE.MeshStandardMaterial({ color: '#2a2a2a' }))
  base.position.y = -1.5; base.name = 'Plinth'; base.userData.id = 'plinth'
  const key = new THREE.DirectionalLight('#ffffff', 2); key.name = 'Key light'; key.userData.id = 'key'; key.position.set(3, 4, 2)
  scene.add(mesh, base, key, new THREE.AmbientLight('#ffffff', 0.3))
  const outline = new THREE.BoxHelper(mesh, '#4c8dff'); outline.visible = false; scene.add(outline)
  const pickable = [mesh, base]
  const ray = new THREE.Raycaster()
  const onClick = (e) => {
    const r = renderer.domElement.getBoundingClientRect()
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera)
    onPick?.(ray.intersectObjects(pickable)[0]?.object.userData.id ?? null)
  }
  renderer.domElement.addEventListener('click', onClick)
  let raf = 0
  const size = () => { const { clientWidth: w, clientHeight: h } = el; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() }
  const loop = () => { size(); outline.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop) }
  loop()
  return {
    objects: [{ id: 'product', name: 'Product', kind: 'mesh' }, { id: 'plinth', name: 'Plinth', kind: 'mesh' }, { id: 'key', name: 'Key light', kind: 'light' }],
    setColor: (c) => mat.color.set(c),
    setRoughness: (v) => { mat.roughness = v },
    setLight: (v) => { key.intensity = v },
    setDetail: (n) => { if (n === detail) return; detail = n; mesh.geometry.dispose(); mesh.geometry = geo(n) },
    select: (id) => { const o = pickable.find((m) => m.userData.id === id); outline.visible = !!o; if (o) outline.setFromObject(o) },
    renderPNG: (scale = 2) => new Promise((res) => {
      const { clientWidth: w, clientHeight: h } = el
      renderer.setSize(w * scale, h * scale, false); renderer.render(scene, camera)
      renderer.domElement.toBlob((b) => { size(); res(b) }, 'image/png')
    }),
    dispose: () => { cancelAnimationFrame(raf); renderer.domElement.removeEventListener('click', onClick); mesh.geometry.dispose(); renderer.dispose(); el.removeChild(renderer.domElement) },
  }
}
J
