// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
declare namespace RuntimeExports {
    let HEAPF32: any;
    let HEAPF64: any;
    let HEAP_DATA_VIEW: any;
    let HEAP8: any;
    let HEAPU8: any;
    let HEAP16: any;
    let HEAPU16: any;
    let HEAP32: any;
    let HEAPU32: any;
    let HEAP64: any;
    let HEAPU64: any;
}
interface WasmModule {
}

export interface ClassHandle {
  isAliasOf(other: ClassHandle): boolean;
  delete(): void;
  deleteLater(): this;
  isDeleted(): boolean;
  clone(): this;
}
export interface PointVector extends ClassHandle {
  size(): number;
  get(_0: number): Point | undefined;
  push_back(_0: Point): void;
  resize(_0: number, _1: Point): void;
  set(_0: number, _1: Point): boolean;
}

export interface CFGLayout extends ClassHandle {
  edge_count(): number;
  node_count(): number;
  get_waypoints(_0: number): PointVector;
  get_coords(_0: number): Point;
  get_height(): number;
  get_width(): number;
}

export interface LayoutBuilder extends ClassHandle {
  build(): CFGLayout;
  make_empty_node(): number;
  make_edge(_0: number, _1: number): number;
  make_node(_0: number, _1: number): number;
  graphviz(): string;
}

export type Point = {
  x: number,
  y: number
};

interface EmbindModule {
  PointVector: {
    new(): PointVector;
  };
  CFGLayout: {};
  LayoutBuilder: {};
  make_layout_builder(): LayoutBuilder;
}

export type MainModule = WasmModule & typeof RuntimeExports & EmbindModule;
