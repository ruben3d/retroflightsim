export const ShadedVertProgram: string = `
  precision highp float;

  uniform mat3 normalModelMatrix;

  varying vec3 vPosition;
  varying float shade;

  void main() {
    vec3 worldNormal = normalize(normalModelMatrix * normal);
    float shadeUp = 0.9 + dot(worldNormal, vec3(0.0, 1.0, 0.0)) * 0.1;
    float shadeRight = 0.8 + dot(worldNormal, vec3(0.0, 0.0, 1.0)) * 0.2;
    shade = shadeUp * shadeRight;

    vec4 tmpPos = modelMatrix * vec4(position, 1.0);
    vPosition = vec3(tmpPos.x, 0.0, tmpPos.z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;