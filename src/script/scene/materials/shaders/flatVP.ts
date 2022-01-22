export const FlatVertProgram: string = `
  precision highp float;

  varying vec3 vPosition;
  varying float shade;

  void main() {
    shade = 1.0;
    vec4 tmpPos = modelMatrix * vec4(position, 1.0);
    vPosition = vec3(tmpPos.x, 0.0, tmpPos.z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;