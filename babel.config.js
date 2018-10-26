module.exports = function (api) {
  api.cache(() => process.env.NODE_ENV === "production");

  const presets = ["@babel/preset-env"];
  //const plugins = ["@babel/plugin-transform-runtime"];
  const plugins = [];

  return {
    presets,
    plugins
  };
}
