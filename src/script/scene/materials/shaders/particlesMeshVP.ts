export const ParticleMeshVertProgram: string = `
precision highp float;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float halfWidth;
uniform float halfHeight;

attribute vec3 position;
attribute vec3 offset;
attribute float scale;
attribute float rotation;
attribute vec4 color;

varying vec3 vPosition;
varying vec4 vColor;

void main() {
  vColor = color;
  vPosition = vec3(offset.x, 0.0, offset.z);

  float cosA = cos(rotation);
  float sinA = sin(rotation);
  mat2 rot = mat2(cosA, -sinA, sinA, cosA);
  vec3 localPosition = scale * vec3(rot * position.xy, position.z);

  vec4 pos = projectionMatrix * (viewMatrix * vec4(offset, 1.0) + vec4(localPosition, 1.0));
  pos.x = floor(pos.x / pos.w * halfWidth + 0.5) / halfWidth * pos.w;
  pos.y = floor(pos.y / pos.w * halfHeight + 0.5) / halfHeight * pos.w;
  gl_Position = pos;
}
`;