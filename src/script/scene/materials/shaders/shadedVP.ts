export const ShadedVertProgram: string = `
  precision highp float;

  uniform mat3 normalModelMatrix;

  varying float shade;

  void main() {
    vec3 worldNormal = normalize(normalModelMatrix * normal);
    float shadeUp = 0.9 + dot(worldNormal, vec3(0.0, 1.0, 0.0)) * 0.1;
    float shadeRight = 0.8 + (1.0-abs(dot(worldNormal, vec3(0.0, 0.0, 1.0)))) * 0.2;
    shade = shadeUp * shadeRight;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;