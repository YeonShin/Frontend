declare module "*.svg" {
  // CRA에서는 두 가지 import 패턴을 모두 쓰는 경우가 많아 둘 다 선언해둡니다.
  import * as React from "react";
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  const src: string; // img src로 쓰는 기본 문자열 경로
  export default src;
}