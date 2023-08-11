const path = require('path');


module.exports = {
    entry: {
        converter: {
            import: './src/converter.ts',
            filename: 'converter.js'
        },
        init: {
            import: './src/init.ts',
            filename: 'init.js'
        },
        help: {
            import: './src/help.ts',
            filename: 'help.js'
        },
    },
    output: {
        path: path.resolve(__dirname, 'commands'),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)$/,
                //转换时排除node_modules依赖
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-typescript']
                    }
                }
            },
        ]
    },
    plugins: [
        // 暂时用不到
    ],
    mode: 'production',
    target: 'node',
    resolve: {
        extensions: ['.ts', '.js']
    },
}