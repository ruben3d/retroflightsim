export const LineVertProgram: string = `
  precision highp float;

  uniform float halfWidth;
  uniform float halfHeight;

  varying vec3 vPosition;

  void main() {
    vec4 tmpPos = modelMatrix * vec4(position, 1.0);
    vPosition = vec3(tmpPos.x, 0.0, tmpPos.z);

    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    pos.x = floor(pos.x / pos.w * halfWidth + 0.5) / halfWidth * pos.w;
    pos.y = floor(pos.y / pos.w * halfHeight + 0.5) / halfHeight * pos.w;
    gl_Position = pos;
  }
`;