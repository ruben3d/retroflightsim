export const ConstantFragProgram: string = `
  precision lowp float;

  uniform float distance;
  uniform vec3 color;
  uniform float fogDensity;
  uniform vec3 fogColor;

  varying float shade;

  void main() {
    float fogFactor = exp2(-fogDensity * distance);
    fogFactor = 1.0 - clamp(fogFactor, 0.0, 1.0);
    fogFactor = floor(fogFactor * 12.0 + 0.5) / 12.0;

    gl_FragColor = mix(vec4(color * shade, 1.0), vec4(fogColor, 1.0), fogFactor * 0.92);
  }
`;