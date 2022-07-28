export const DepthFragProgram: string = `
  precision lowp float;

  uniform vec3 vCameraPos;
  uniform vec3 vCameraNormal;
  uniform float vCameraD;
  uniform int shadingType;
  uniform vec3 color;
  uniform vec3 colorSecondary;
  uniform int fogType;
  uniform float fogDensity;
  uniform vec3 fogColor;

  varying vec3 vPosition;

  void main() {
    float distance = 0.0;
    float fogSteps = 12.0;

    if (fogType == 1) {
      distance = dot(vPosition, vCameraNormal) + vCameraD;
    } else if (fogType == 2) {
      vec3 dV = vPosition - vCameraPos;
      distance = sqrt(dot(dV, dV));
      fogSteps = 24.0;
    }

    float fogFactor = exp2(-fogDensity * distance);
    fogFactor = 1.0 - clamp(fogFactor, 0.0, 1.0);
    fogFactor = floor(fogFactor * fogSteps + 0.5) / fogSteps;

    vec3 diffuse;
    if (shadingType == 0) {
      vec2 screen = gl_FragCoord.xy;
      bool dithering = mod(floor(screen.x + screen.y), 2.0) > 0.5;
      diffuse = dithering ? color : colorSecondary;
    } else {
      diffuse = color;
    }

    gl_FragColor = mix(vec4(diffuse, 1.0), vec4(fogColor, 1.0), fogFactor * 0.92);
  }
`;