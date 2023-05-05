export const ShadedVertProgram: string = `
  precision highp float;

  uniform float halfWidth;
  uniform float halfHeight;
  uniform mat3 normalModelMatrix;
  uniform int shadingType;

  varying float shade;

  void main() {
    vec3 worldNormal;

    if (shadingType == 2) {
      worldNormal = normalize(normalModelMatrix * normal);
    } else {
      worldNormal = normal;
    }

    float shadeUp = 0.9 + dot(worldNormal, vec3(0.0, 1.0, 0.0)) * 0.1;
    float shadeRight = 0.8 + (1.0-abs(dot(worldNormal, vec3(0.0, 0.0, 1.0)))) * 0.2;
    shade = shadeUp * shadeRight;

    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    pos.x = floor(pos.x / pos.w * halfWidth + 0.5) / halfWidth * pos.w;
    pos.y = floor(pos.y / pos.w * halfHeight + 0.5) / halfHeight * pos.w;
    gl_Position = pos;
  }
`;