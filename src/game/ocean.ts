import * as THREE from 'three';
import { COLORS, PHYSICS } from './constants';

const vertexShader = `
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveSpeed;
  uniform float uWaveFreq;
  
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vWaveHeight;
  
  // Simple noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    float time = uTime * uWaveSpeed;
    
    // Layered wave calculation for realistic ocean
    float wave1 = sin(pos.x * uWaveFreq + time) * cos(pos.z * uWaveFreq * 0.7 + time * 0.8);
    float wave2 = sin(pos.x * uWaveFreq * 1.3 + time * 1.1) * 0.5;
    float wave3 = cos(pos.z * uWaveFreq * 0.9 + time * 0.6) * 0.3;
    float noise = snoise(vec2(pos.x * 0.05 + time * 0.1, pos.z * 0.05)) * 0.8;
    
    float height = (wave1 + wave2 + wave3 + noise) * uWaveHeight;
    pos.y += height;
    vWaveHeight = height;
    
    // Calculate normal from wave derivatives
    float dx = cos(pos.x * uWaveFreq + time) * uWaveFreq * uWaveHeight;
    float dz = -sin(pos.z * uWaveFreq * 0.7 + time * 0.8) * uWaveFreq * 0.7 * uWaveHeight;
    vNormal = normalize(vec3(-dx, 1.0, -dz));
    
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  uniform vec3 uDeepColor;
  uniform vec3 uSurfaceColor;
  uniform vec3 uShallowColor;
  uniform vec3 uFoamColor;
  uniform vec3 uSunDir;
  
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vWaveHeight;
  
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 normal = normalize(vNormal);
    
    // Fresnel effect - more reflective at glancing angles
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
    fresnel = clamp(fresnel, 0.0, 1.0);
    
    // Water color based on depth/wave height
    float heightFactor = clamp(vWaveHeight / 2.0 + 0.5, 0.0, 1.0);
    vec3 waterColor = mix(uDeepColor, uSurfaceColor, heightFactor);
    waterColor = mix(waterColor, uShallowColor, fresnel * 0.3);
    
    // Foam on wave peaks
    float foam = smoothstep(0.6, 1.0, heightFactor);
    waterColor = mix(waterColor, uFoamColor, foam * 0.7);
    
    // Specular highlight from sun
    vec3 halfDir = normalize(viewDir + uSunDir);
    float specAngle = max(dot(normal, halfDir), 0.0);
    float specular = pow(specAngle, 128.0) * 0.8;
    waterColor += vec3(specular);
    
    // Distance fog
    float dist = length(vWorldPos - cameraPosition);
    float fogFactor = exp(-dist * 0.0008);
    fogFactor = clamp(fogFactor, 0.0, 1.0);
    
    gl_FragColor = vec4(waterColor, 0.92);
  }
`;

export class Ocean {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.PlaneGeometry;

  constructor(scene: THREE.Scene) {
    // High-res plane for wave detail
    this.geometry = new THREE.PlaneGeometry(10000, 10000, 256, 256);
    this.geometry.rotateX(-Math.PI / 2);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaveHeight: { value: PHYSICS.waveHeight },
        uWaveSpeed: { value: PHYSICS.waveSpeed },
        uWaveFreq: { value: PHYSICS.waveFrequency },
        uDeepColor: { value: new THREE.Color(COLORS.oceanDeep) },
        uSurfaceColor: { value: new THREE.Color(COLORS.oceanSurface) },
        uShallowColor: { value: new THREE.Color(COLORS.oceanShallow) },
        uFoamColor: { value: new THREE.Color(COLORS.foam) },
        uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.2).normalize() },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.y = PHYSICS.waterLevel;
    this.mesh.frustumCulled = false; // Always render ocean
    scene.add(this.mesh);
  }

  public getWaveHeight(x: number, z: number, time: number): number {
    // Simplified wave calculation matching the shader (for physics)
    const freq = PHYSICS.waveFrequency;
    const speed = PHYSICS.waveSpeed;
    const height = PHYSICS.waveHeight;

    const wave1 = Math.sin(x * freq + time * speed) * Math.cos(z * freq * 0.7 + time * speed * 0.8);
    const wave2 = Math.sin(x * freq * 1.3 + time * speed * 1.1) * 0.5;
    const wave3 = Math.cos(z * freq * 0.9 + time * speed * 0.6) * 0.3;

    return (wave1 + wave2 + wave3) * height;
  }

  public update(time: number) {
    this.material.uniforms.uTime.value = time;
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
