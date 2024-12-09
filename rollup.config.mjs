import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy'

const typescriptOptions = {
    exclude: ["tests/**/*"],
    compilerOptions: { declaration: false },
};

const copyOptions = {
    targets: [
        //{ src: 'src/types/*', dest: 'dist/esm/types' },
        { src: 'src/types/*', dest: 'dist/cjs/types' },
        
        //{ src: 'README.md', dest: 'dist/cjs' },
    ]
};

export default [
//     {
//         external: ["typeorm", "sinon"],
//         input: "src/index.ts",
//         output: { file: "dist/esm/index.mjs", format: "esm" },
//         plugins: [typescript( typescriptOptions ), copy( copyOptions )],
//     },
    {
        external: ["typeorm", "sinon"],
        input: "src/index.ts",
        output: { file: "dist/cjs/index.js", format: "cjs" },
        plugins: [typescript( typescriptOptions ), copy( copyOptions )],
    },
];
