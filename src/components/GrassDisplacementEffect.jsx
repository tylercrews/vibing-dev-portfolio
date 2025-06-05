import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function GrassDisplacement() {
  const containerRef = useRef();
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 5, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const blades = [];
    const bladeCountX = 80;
    const bladeCountZ = 50;
    const spacingZ = 0.3;
    const baseSpacingX = 0.12; // reset base spacing to previous wider value

    const geometry = new THREE.BufferGeometry();
    const points = new Float32Array(6);
    points[0] = 0; points[1] = 0; points[2] = 0;
    points[3] = 0; points[4] = 1; points[5] = 0;
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));

    const material = new THREE.LineBasicMaterial({ color: 'green' });

    const centerX = bladeCountX / 2;
    const centerZ = bladeCountZ / 2;

    for (let j = 0; j < bladeCountZ; j++) {
      const z = (j - centerZ) * spacingZ;
      const fanOut = 1 - Math.pow(j / bladeCountZ, 2); // restore previous outward fan effect

      for (let i = 0; i < bladeCountX; i++) {
        const centerOffset = i - centerX;
        const x = centerOffset * baseSpacingX * (1 + fanOut);
        const line = new THREE.Line(geometry.clone(), material.clone());
        line.position.set(x, 0, z);
        line.userData.angle = 0;
        scene.add(line);
        blades.push(line);
      }
    }

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
      mouse.current.set(x, y);
    };
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      blades.forEach((blade) => {
        const dx = mouse.current.x - blade.position.x;
        const dz = mouse.current.y - blade.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const maxDist = 0.6;

        let influence = Math.max(0, 1 - dist / maxDist);
        const angle = influence * Math.sign(dx) * Math.PI / 2;
        blade.userData.angle += (angle - blade.userData.angle) * 0.1;

        const positions = blade.geometry.attributes.position.array;
        const bend = Math.sin(blade.userData.angle) * 0.5;
        positions[3] = bend;
        positions[4] = Math.cos(blade.userData.angle);
        blade.geometry.attributes.position.needsUpdate = true;
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh'
      }}
    />
  );
}
