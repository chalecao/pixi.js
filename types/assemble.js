/**
 * IMPORTANT: this is a workaround to massage the output of the types
 * generated by tsd-jsdoc. In the future, some of these things may
 * be fixed with support in tsd-jsdoc, but for now, we'll be manually
 * doing some funny business to support proper types.
 */
const fs = require('fs');
const path = require('path');

// Get the name of the bundle
const bundle = process.argv[2];
if (!bundle) {
    console.log("ERROR: missing package");
    process.exit(1);
}

// Path for the temporary types generated by tsd-jsdoc
const tempPath = path.resolve(`dist/types/${bundle}/types.d.ts`);
let buffer = fs.readFileSync(tempPath, 'utf8');

process.stdout.write(`Assembling "${bundle}" types... `);

// TypeScript requires that static methods must be contained
// when extending, for instance PIXI.TilingSprite must contain
// a static with matching signature
buffer = buffer.replace(
    'class TilingSprite extends PIXI.Sprite {',
    ['class TilingSprite extends PIXI.Sprite {',
    '        static from(source: number | string | PIXI.Texture | HTMLCanvasElement | HTMLVideoElement, options?: any): PIXI.Sprite;',
    '        static fromFrame(): PIXI.Sprite;',
    '        static fromImage(): PIXI.Sprite;']
        .join('\n')
);

buffer = buffer.replace(
    'class CubeTexture extends PIXI.BaseTexture {',
    ['class CubeTexture extends PIXI.BaseTexture {',
    '        static from(resources: string|HTMLImageElement|HTMLCanvasElement|SVGElement|HTMLVideoElement, options?: any): BaseTexture;']
        .join('\n')
);

if (bundle === 'pixi.js') {
    // Strip the CanvasRenderer from the default typings
    buffer = buffer
        .replace(/PIXI\.CanvasRenderer \| (PIXI\.Renderer)/g, '$1')
        .replace(/(PIXI\.Renderer) \| PIXI\.CanvasRenderer/g, '$1');
}

// EventEmitter3 and resource-loader are external dependencies, we'll
// inject these into the find output
const eventTypes = fs.readFileSync(path.join(__dirname, 'events.d.ts'), 'utf8');
const loaderTypes = fs.readFileSync(path.join(__dirname, 'loader.d.ts'), 'utf8');

// Lastly, tsd-jsdoc doesn't support this yet, so we'll inject the module
// declaration at the end, so that users can use ambient namespace typings
// like `import 'pixi.js';` OR module typings `import * as PIXI from 'pixi.js';`
const declareModule = `declare module "${bundle}" {
    export = PIXI;
}`;

fs.writeFileSync(tempPath, [buffer, eventTypes, loaderTypes, declareModule].join('\n'));

// Copy the temporary file to the output location
fs.copyFileSync(tempPath, path.resolve(`bundles/${bundle}/${bundle}.d.ts`));

console.log('done.\n');
