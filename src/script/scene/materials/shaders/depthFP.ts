export const DepthFragProgram: string = `
  precision lowp float;

  uniform vec3 vCameraNormal;
  uniform float vCameraD;
  uniform vec3 color;
  uniform float fogDensity;
  uniform vec3 fogColor;

  varying vec3 vPosition;
  varying float shade;

  void main() {
    float distance = dot(vPosition, vCameraNormal) + vCameraD;
    float fogFactor = exp2(-fogDensity * distance);
    fogFactor = 1.0 - clamp(fogFactor, 0.0, 1.0);
    fogFactor = floor(fogFactor * 12.0 + 0.5) / 12.0;

    gl_FragColor = mix(vec4(color * shade, 1.0), vec4(fogColor, 1.0), fogFactor * 0.92);
  }
`;