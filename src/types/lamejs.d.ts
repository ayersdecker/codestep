declare module 'lamejs' {
  interface LameJsModule {
    Mp3Encoder: new (channels: number, sampleRate: number, kbps: number) => {
      encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
      flush(): Int8Array;
    };
  }

  const lamejs: LameJsModule;
  export default lamejs;
}
