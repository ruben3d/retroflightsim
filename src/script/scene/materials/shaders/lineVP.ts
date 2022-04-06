import { H_RES_HALF, V_RES_HALF } from "../../../defs";

export const LineVertProgram: string = `
  precision highp float;

  varying vec3 vPosition;

  void main() {
    vec4 tmpPos = modelMatrix * vec4(position, 1.0);
    vPosition = vec3(tmpPos.x, 0.0, tmpPos.z);

    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    pos.x = floor(pos.x / pos.w * ${H_RES_HALF}.0 + 0.5) / ${H_RES_HALF}.0 * pos.w;
    pos.y = floor(pos.y / pos.w * ${V_RES_HALF}.0) / ${V_RES_HALF}.0 * pos.w;
    gl_Position = pos;
  }
`;