export const ParticleMeshFragProgram: string = `
precision highp float;

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
varying vec4 vColor;

void main() {
  mat4 bayesian = mat4(
    0.0, 12.0,  3.0, 15.0,
    8.0,  4.0, 11.0,  7.0,
    2.0, 14.0,  1.0, 13.0,
   10.0,  6.0,  9.0,  5.0
  ) * (1.0 / 16.0) - 0.5;

  vec2 screen = gl_FragCoord.xy;

  int modX = int(mod(screen.x,4.0));
  int modY = int(mod(screen.y,4.0));
  for (int x = 0; x < 4; x++) {
    for (int y = 0; y < 4; y++) {
      if (x == modX && y == modY) {
        float alpha = vColor.a + bayesian[x][y];
        if (alpha < 0.5) {
          discard;
        }
      }
    }
  }

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
    bool dithering = mod(floor(screen.x + screen.y), 2.0) > 0.5;
    diffuse = dithering ? color : colorSecondary;
  } else {
    diffuse = vColor.rgb;
  }

  gl_FragColor = mix(vec4(diffuse, 1.0), vec4(fogColor, 1.0), fogFactor * 0.92);
}
`;