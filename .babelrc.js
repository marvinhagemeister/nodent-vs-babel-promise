module.exports = {
  plugins: [
    ["babel-plugin-transform-async-to-promises", { inlineHelpers: true }],
    //   [
    //     "module:fast-async",
    //     {
    //       compiler: {
    //         promises: true,
    //         generators: false,
    //       },
    //       runtimePattern: null,
    //       spec: true,
    //     },
    //   ],
  ],
};
