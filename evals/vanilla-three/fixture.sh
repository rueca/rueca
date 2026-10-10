#!/bin/bash
set -e
mkdir -p src
echo '{ "name": "product", "private": true, "type": "module", "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0", "three": "^0.186.0" } }' > package.json
cat > src/scene.js <<'J'
import * as THREE from 'three'
export function start(el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  el.appendChild(renderer.domElement)
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.set(0, 1, 5)
  const mat = new THREE.MeshStandardMaterial({ color: '#c8a27a', roughness: 0.4 })
  const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.3, 200, 32), mat); mesh.name = 'Product'
  const key = new THREE.DirectionalLight('#ffffff', 2); key.name = 'Key light'; key.position.set(3, 4, 2)
  scene.add(mesh, key, new THREE.AmbientLight('#ffffff', 0.3))
  let raf = 0
  const loop = () => { const { clientWidth: w, clientHeight: h } = el; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); mesh.rotation.y += 0.005; renderer.render(scene, camera); raf = requestAnimationFrame(loop) }
  loop()
  return {
    scene, renderer,
    setColor: (c) => mat.color.set(c),
    setRoughness: (r) => { mat.roughness = r },
    setLight: (i) => { key.intensity = i },
    dispose: () => { cancelAnimationFrame(raf); renderer.dispose(); el.removeChild(renderer.domElement) },
  }
}
J
