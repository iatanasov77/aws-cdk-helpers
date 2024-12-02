import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy'

const typescriptOptions = {
    exclude: ["tests/**/*"],
    compilerOptions: { declaration: false },
};

const copyOptions = {
    targets: [
        { src: 'src/types/*', dest: 'dist/esm/types' }
    ]
};

const data = [
    {
        external: ["typeorm", "sinon"],
        input: "src/index.ts",
        output: { file: "dist/esm/index.js", format: "esm" },
        plugins: [typescript( typescriptOptions ), copy( copyOptions )],
    },
//     {
//         external: ["typeorm", "sinon"],
//         input: "src/index.ts",
//         output: { file: "dist/cjs/index.js", format: "cjs" },
//         plugins: [typescript( typescriptOptions )],
//     },
];

module.exports = data;