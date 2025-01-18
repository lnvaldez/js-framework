module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: ["last 2 versions", "not dead"],
        },
        modules: false,
      },
    ],
    [
      "@babel/preset-react",
      {
        pragma: "Framework.jsx",
        pragmaFrag: "Framework.Fragment",
        throwIfNamespace: false,
      },
    ],
  ],
  plugins: [
    "@babel/plugin-transform-runtime",
    "@babel/plugin-transform-class-properties",
  ],
};
