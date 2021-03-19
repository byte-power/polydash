function applyOverrides(webpackConfig) {
    return {
        ...webpackConfig,
        stats: {
            children: true,
            modules: true,
            chunkModules: true
        }
    };
}

module.exports = applyOverrides;
