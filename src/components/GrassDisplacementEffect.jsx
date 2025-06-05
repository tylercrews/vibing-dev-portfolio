import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function FurField() {
  const containerRef = useRef();
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const lastMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const direction = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 2, 4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const countX = 100;
    const countZ = 100;
    const total = countX * countZ;
    const dummy = new THREE.Object3D();

    const grassHeight = 0.6;
    const baseGeometry = new THREE.CylinderGeometry(0.005, 0.005, grassHeight, 6, 60, true);
    const baseMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uDirection: { value: 0.0 },
      },
      vertexShader: `
        uniform vec2 uMouse;
        uniform float uDirection;
        varying vec3 vColor;

        void main() {
          vec3 transformed = position;
          float factor = (transformed.y + ${grassHeight / 2.0}) / ${grassHeight};
          vec4 basePos = modelMatrix * vec4(0.0, -${grassHeight / 2.0}, 0.0, 1.0);
          float dist = distance(vec2(basePos.x, basePos.z), uMouse);
          float force = 3.0 * exp(-2.0 * dist); // more sensitive

          float angle = force * uDirection * 1.57 * factor;
          float cosA = cos(angle);
          float sinA = sin(angle);

          float newX = transformed.x * cosA - transformed.y * sinA;
          transformed.y = transformed.x * sinA + transformed.y * cosA;
          transformed.x = newX;

          vColor = vec3(0.9, 0.9, 0.9);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.InstancedMesh(baseGeometry, baseMaterial, total);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < countX; i++) {
      for (let j = 0; j < countZ; j++) {
        const x = (i / countX - 0.5) * 4;
        const z = (j / countZ - 0.5) * 4;
        dummy.position.set(x, 0, z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i * countZ + j, dummy.matrix);
      }
    }

    scene.add(mesh);

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -4;
      mouse.current.set(x, y);
    };
    window.addEventListener('mousemove', onMouseMove);

    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const damping = 10.0;

      const velX = mouse.current.x - lastMouse.current.x;
      direction.current += (velX - direction.current) * delta * damping;

      baseMaterial.uniforms.uMouse.value.copy(mouse.current);
      baseMaterial.uniforms.uDirection.value = direction.current;

      lastMouse.current.copy(mouse.current);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
    ></div>
  );
}
