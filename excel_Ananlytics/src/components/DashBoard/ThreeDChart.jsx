import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './ThreeDChart.css';

const ThreeDChart = ({ data, xAxis, yAxis, zAxis, darkMode }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const chartGroupRef = useRef(new THREE.Group());

  useEffect(() => {
    const scene = sceneRef.current;
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    scene.add(chartGroupRef.current);

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      controls.dispose();
    };
  }, []);

  useEffect(() => {
    while (chartGroupRef.current.children.length) {
      chartGroupRef.current.remove(chartGroupRef.current.children[0]);
    }

    if (!data || !xAxis || !yAxis || !zAxis) return;

    const xIndex = data.headers.indexOf(xAxis);
    const yIndex = data.headers.indexOf(yAxis);
    const zIndex = data.headers.indexOf(zAxis);

    if (xIndex === -1 || yIndex === -1 || zIndex === -1) return;

    const validRows = data.rows.filter(row => 
      row[xIndex] !== undefined && 
      row[yIndex] !== undefined && 
      row[zIndex] !== undefined && 
      !isNaN(parseFloat(row[xIndex])) && 
      !isNaN(parseFloat(row[yIndex])) && 
      !isNaN(parseFloat(row[zIndex]))
    );

    const xValues = validRows.map(row => parseFloat(row[xIndex]));
    const yValues = validRows.map(row => parseFloat(row[yIndex]));
    const zValues = validRows.map(row => parseFloat(row[zIndex]));

    const maxX = Math.max(...xValues);
    const maxY = Math.max(...yValues);
    const maxZ = Math.max(...zValues);

    const barMaterial = new THREE.MeshPhongMaterial({ 
      color: darkMode ? 0x4a8fe7 : 0x2c3e50,
      transparent: true,
      opacity: 0.9,
      shininess: 100
    });

    validRows.forEach((row, i) => {
      const x = (xValues[i] / maxX) * 5;
      const y = (yValues[i] / maxY) * 5;
      const z = (zValues[i] / maxZ) * 5;
      const geometry = new THREE.BoxGeometry(0.3, y, 0.3);
      const bar = new THREE.Mesh(geometry, barMaterial);
      bar.position.set(x - 2.5, y / 2, z - 2.5);
      chartGroupRef.current.add(bar);

      if (i % 3 === 0) {
        const label = createTextLabel(`${xValues[i].toFixed(1)}, ${yValues[i].toFixed(1)}, ${zValues[i].toFixed(1)}`, darkMode);
        label.position.set(x - 2.5, y + 0.2, z - 2.5);
        label.scale.set(0.05, 0.05, 0.05);
        chartGroupRef.current.add(label);
      }
    });

    const gridHelper = new THREE.GridHelper(10, 10, darkMode ? 0x555555 : 0xcccccc, darkMode ? 0x333333 : 0x999999);
    chartGroupRef.current.add(gridHelper);

    const xLabel = createTextLabel(xAxis, darkMode);
    xLabel.position.set(3, -0.5, 0);
    xLabel.scale.set(0.1, 0.1, 0.1);
    chartGroupRef.current.add(xLabel);

    const yLabel = createTextLabel(yAxis, darkMode);
    yLabel.position.set(0, 5.5, 0);
    yLabel.scale.set(0.1, 0.1, 0.1);
    chartGroupRef.current.add(yLabel);

    const zLabel = createTextLabel(zAxis, darkMode);
    zLabel.position.set(0, -0.5, 3);
    zLabel.rotation.y = Math.PI / 2;
    zLabel.scale.set(0.1, 0.1, 0.1);
    chartGroupRef.current.add(zLabel);
  }, [data, xAxis, yAxis, zAxis, darkMode]);

  const createTextLabel = (text, darkMode) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = darkMode ? '#ffffff' : '#000000';
    context.font = 'Bold 80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    return sprite;
  };

  return (
    <div className={`three-d-chart-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="chart-header">
        <h3>3D Visualization</h3>
        <p>{xAxis} vs {yAxis} vs {zAxis}</p>
      </div>
      <div ref={mountRef} className="chart-render-area" />
    </div>
  );
};

export default ThreeDChart;