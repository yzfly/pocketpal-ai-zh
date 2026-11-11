const {execFileSync} = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const GENERATOR_PATH = path.join(__dirname, '..', 'generate-app-icons.js');
const {
  APPICONSET,
  ANDROID_RES,
  BRAND_DIR,
  SOURCE_DIR,
  SOURCE_FILES,
  generate,
  opaqueRgbPng,
  parseSvg,
  toVectorDrawable,
  buildTextOutputs,
} = require(GENERATOR_PATH);

const canvas = body =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28 -28 168 168">${body}</svg>`;

const SQUARE = '<path id="square" d="M0 0H9V9Z" fill="#000000"/>';

const vd = body => toVectorDrawable(parseSvg(canvas(body)));

const visible = relative =>
  relative.split(path.sep).every(part => !part.startsWith('.'));

describe('parseSvg', () => {
  it.each([
    ['<rect width="1" height="1"/>', '<rect>'],
    [
      '<path d="M0 0H9" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="2"/>',
      'stroke-dasharray',
    ],
    [
      '<defs><linearGradient id="a"/></defs><path d="M0 0H9V9Z" fill="#000000"/>',
      '<linearGradient>',
    ],
    ['<use href="#a"/>', '<use>'],
    ['<g opacity="0.5">' + SQUARE + '</g>', 'opacity'],
    ['<path d="M0 0H9V9Z" fill="url(#g)"/>', 'fill="url(#g)"'],
    ['<path d="M0 0H9V9Z"/>', 'explicit fill'],
    ...['a<b', 'a&amp;b', "a'b", 'a b', '1a', ''].map(id => [
      `<path id="${id}" d="M0 0H9V9Z" fill="#000000"/>`,
      `unsupported id="${id}" on <path>`,
    ]),
    [
      `<defs><clipPath id="c&lt;"><path d="M0 0H9V9Z"/></clipPath></defs><g clip-path="url(#c)">${SQUARE}</g>`,
      'unsupported id="c&lt;" on <clipPath>',
    ],
    [`<g id="g>">${SQUARE}</g>`, 'unsupported id="g>" on <g>'],
    [
      `<defs><clipPath id="icon-mask"><path d="M0 0H9V9Z"/></clipPath></defs><g clip-path="url(#icon-mask)">${SQUARE}</g>`,
      'id icon-mask is reserved',
    ],
    [
      '<path id="icon-mask" d="M0 0H9V9Z" fill="#000000"/>',
      'id icon-mask is reserved',
    ],
  ])('rejects %s naming %s', (body, name) => {
    expect(() => parseSvg(canvas(body))).toThrow(name);
  });

  it('rejects a viewBox other than the canvas', () => {
    expect(() =>
      parseSvg(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112">${SQUARE}</svg>`,
      ),
    ).toThrow('viewBox');
  });

  it('rejects stray text and unclosed elements', () => {
    expect(() => parseSvg(canvas(`hello${SQUARE}`))).toThrow('hello');
    expect(() => parseSvg(canvas(`<g>${SQUARE}`))).toThrow();
  });
});

describe('toVectorDrawable', () => {
  it('maps the canvas onto a 108dp viewport shifted by the bleed', () => {
    const xml = vd(SQUARE);
    expect(xml).toContain('android:width="108dp"');
    expect(xml).toContain('android:viewportWidth="168"');
    expect(xml).toMatch(
      /<group\n\s+android:translateX="28"\n\s+android:translateY="28">/,
    );
  });

  it('maps path attributes by name and passes path data through', () => {
    const xml = vd(
      '<path id="p" d="M1 2C3 4 5 6 7 8Z" fill="#abcdef" fill-opacity="0.4" fill-rule="evenodd"/>' +
        '<path id="s" d="M0 0L9 9" fill="none" stroke="#343434" stroke-width="5.7931" stroke-linecap="round"/>',
    );
    expect(xml).toContain('android:name="p"');
    expect(xml).toContain('android:fillColor="#ABCDEF"');
    expect(xml).toContain('android:fillAlpha="0.4"');
    expect(xml).toContain('android:fillType="evenOdd"');
    expect(xml).toContain('android:pathData="M1 2C3 4 5 6 7 8Z"');
    expect(xml).toContain('android:strokeColor="#343434"');
    expect(xml).toContain('android:strokeWidth="5.7931"');
    expect(xml).toContain('android:strokeLineCap="round"');
    expect(xml.match(/fillColor/g)).toHaveLength(1);
  });

  it.each([
    [
      'rotate(-30 10 20)',
      ['android:rotation="-30"', 'android:pivotX="10"', 'android:pivotY="20"'],
    ],
    [
      'translate(1.5 -2)',
      ['android:translateX="1.5"', 'android:translateY="-2"'],
    ],
    ['scale(2)', ['android:scaleX="2"', 'android:scaleY="2"']],
  ])('maps transform %s onto one group', (transform, expected) => {
    const xml = vd(`<g id="t" transform="${transform}">${SQUARE}</g>`);
    const group = xml.slice(xml.indexOf('android:name="t"'));
    for (const attribute of expected) {
      expect(group).toContain(attribute);
    }
  });

  it.each([
    'translate(1 2) rotate(3)',
    'matrix(1 0 0 1 0 0)',
    'rotate(3)',
    'translate(1.2.3 4)',
    'scale(.)',
  ])('rejects transform %s naming it', transform => {
    expect(() =>
      parseSvg(canvas(`<g transform="${transform}">${SQUARE}</g>`)),
    ).toThrow(transform);
  });

  it('emits a referenced clipPath as the first child of its group', () => {
    const xml = vd(
      '<defs><clipPath id="c"><path d="M0 0H9V9Z"/></clipPath></defs>' +
        `<g id="clipped" clip-path="url(#c)">${SQUARE}</g>`,
    );
    expect(xml).toMatch(
      /android:name="clipped">\n\s+<clip-path\n\s+android:pathData="M0 0H9V9Z" \/>\n\s+<path/,
    );
  });

  it.each([
    [
      'an unreferenced clipPath',
      '<defs><clipPath id="c"><path d="M0 0H9V9Z"/></clipPath></defs>' + SQUARE,
      'never referenced',
    ],
    [
      'an inline clipPath',
      '<clipPath id="c"><path d="M0 0H9V9Z"/></clipPath>' +
        `<g clip-path="url(#c)">${SQUARE}</g>`,
      'must sit in <defs>',
    ],
    [
      'an unknown reference',
      `<g clip-path="url(#missing)">${SQUARE}</g>`,
      '#missing',
    ],
    [
      'a clip-path on a path',
      '<defs><clipPath id="c"><path d="M0 0H9V9Z"/></clipPath></defs>' +
        '<path d="M0 0H9V9Z" fill="#000000" clip-path="url(#c)"/>',
      'clip-path on <path>',
    ],
    [
      'a multi-child clipPath',
      '<defs><clipPath id="c"><path d="M0 0H9V9Z"/><path d="M0 0H1V1Z"/></clipPath></defs>' +
        `<g clip-path="url(#c)">${SQUARE}</g>`,
      'exactly one <path>',
    ],
  ])('rejects %s', (_, body, message) => {
    expect(() => parseSvg(canvas(body))).toThrow(message);
  });
});

describe('buildTextOutputs', () => {
  const sources = {
    foregroundLight: canvas(SQUARE),
    monochrome: canvas(
      '<path id="m" d="M0 0H9V9Z" fill="#FFFFFF" fill-rule="evenodd"/>',
    ),
  };

  it('writes the adaptive icon for both launcher names', () => {
    const outputs = buildTextOutputs(sources);
    const adaptive =
      outputs['android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'];
    expect(adaptive).toContain('@color/ic_launcher_background');
    expect(adaptive).toContain('@drawable/ic_launcher_foreground');
    expect(adaptive).toContain('@drawable/ic_launcher_monochrome');
    expect(
      outputs[
        'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml'
      ],
    ).toBe(adaptive);
    expect(
      outputs['android/app/src/main/res/values/ic_launcher_background.xml'],
    ).toContain('<color name="ic_launcher_background">#000000</color>');
  });

  it('writes Contents.json in Xcode single-size form', () => {
    const contents =
      buildTextOutputs(sources)[
        'ios/PocketPal/Images.xcassets/AppIcon.appiconset/Contents.json'
      ];
    expect(contents.endsWith('}\n')).toBe(true);
    expect(contents).toContain('"filename" : "AppIcon.png"');
    expect(contents).not.toMatch(/":/);
    const {images, info} = JSON.parse(contents);
    expect(info).toEqual({author: 'xcode', version: 1});
    expect(images.map(image => image.filename)).toEqual([
      'AppIcon.png',
      'AppIcon-dark.png',
      'AppIcon-tinted.png',
    ]);
    expect(images.map(image => image.appearances?.[0].value)).toEqual([
      undefined,
      'dark',
      'tinted',
    ]);
    for (const image of images) {
      expect(image).toMatchObject({
        idiom: 'universal',
        platform: 'ios',
        size: '1024x1024',
      });
      expect(Object.keys(image)).toEqual([...Object.keys(image)].sort());
    }
  });
});

function pngHeader(buffer) {
  expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorType: buffer[25],
  };
}

describe('generate', () => {
  let root;

  const writeSources = overrides => {
    const files = {
      foregroundLight: canvas(SQUARE),
      foregroundDark: canvas(SQUARE),
      monochrome: canvas(
        '<path id="m" d="M0 0H9V9Z" fill="#FFFFFF" fill-rule="evenodd"/>',
      ),
      ...overrides,
    };
    for (const [key, text] of Object.entries(files)) {
      const target = path.join(root, SOURCE_DIR, SOURCE_FILES[key]);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.writeFileSync(target, text);
    }
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'app-icons-'));
  });

  afterEach(() => {
    fs.rmSync(root, {recursive: true, force: true});
  });

  it('writes nothing when a source carries an unsupported element', () => {
    writeSources({monochrome: canvas('<rect width="1" height="1"/>')});
    expect(() => generate({root})).toThrow('<rect>');
    expect(fs.existsSync(path.join(root, 'android'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'ios'))).toBe(false);
  });

  it('exits non-zero from the command line, naming the element', () => {
    writeSources({foregroundLight: canvas('<rect width="1" height="1"/>')});
    const script = path.join(root, 'scripts', 'generate-app-icons.js');
    fs.copyFileSync(GENERATOR_PATH, script);
    let failure;
    try {
      execFileSync('node', [script], {stdio: 'pipe'});
    } catch (error) {
      failure = error;
    }
    expect(failure.status).not.toBe(0);
    expect(failure.stderr.toString()).toContain('<rect>');
  });

  it.each(['previews', '..previews'])(
    'refuses the preview directory %s inside the repo',
    name => {
      writeSources();
      expect(() => generate({root, previewDir: path.join(root, name)})).toThrow(
        'outside the repo',
      );
    },
  );

  it('survives stray .DS_Store files, deleting the appiconset one', () => {
    writeSources();
    const strays = [`${APPICONSET}/.DS_Store`, `${ANDROID_RES}/.DS_Store`];
    for (const stray of strays) {
      fs.mkdirSync(path.dirname(path.join(root, stray)), {recursive: true});
      fs.writeFileSync(path.join(root, stray), 'finder');
    }

    generate({root});

    expect(fs.existsSync(path.join(root, strays[0]))).toBe(false);
    expect(fs.existsSync(path.join(root, strays[1]))).toBe(true);
  });

  it('replaces case-variant icons without deleting a written output', () => {
    writeSources();
    const dir = path.join(root, APPICONSET);
    fs.mkdirSync(dir, {recursive: true});
    for (const name of ['appicon.png', 'Appicon-Dark.png']) {
      fs.writeFileSync(path.join(dir, name), 'old');
    }
    const calls = spy =>
      spy.mock.calls.map(([file], i) => ({
        file: String(file).toLowerCase(),
        order: spy.mock.invocationCallOrder[i],
      }));
    const write = jest.spyOn(fs, 'writeFileSync');
    const remove = jest.spyOn(fs, 'rmSync');
    let writes;
    let removals;
    try {
      generate({root});
    } finally {
      writes = calls(write);
      removals = calls(remove);
      write.mockRestore();
      remove.mockRestore();
    }

    const removedAfterWrite = removals.filter(removal =>
      writes.some(
        ({file, order}) => file === removal.file && order < removal.order,
      ),
    );
    expect(removedAfterWrite).toEqual([]);
    expect(removals).toHaveLength(2);
    expect(fs.readdirSync(dir).sort()).toEqual([
      'AppIcon-dark.png',
      'AppIcon-tinted.png',
      'AppIcon.png',
      'Contents.json',
    ]);
  });

  it('refuses a preview directory that reaches the repo through a symlink', () => {
    writeSources();
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'app-icons-link-'));
    try {
      fs.symlinkSync(root, path.join(elsewhere, 'repo'), 'dir');
      for (const previewDir of [
        path.join(elsewhere, 'repo'),
        path.join(elsewhere, 'repo', 'previews'),
      ]) {
        expect(() => generate({root, previewDir})).toThrow('outside the repo');
      }
      expect(fs.existsSync(path.join(root, 'previews'))).toBe(false);
    } finally {
      fs.rmSync(elsewhere, {recursive: true, force: true});
    }
  });

  it('writes opaque iOS icons, exact legacy sizes and drops stale icons', () => {
    writeSources();
    const stale = path.join(root, APPICONSET, 'iPhone_App_60_2x.png');
    fs.mkdirSync(path.dirname(stale), {recursive: true});
    fs.writeFileSync(stale, 'stale');

    generate({root});

    expect(fs.readdirSync(path.join(root, APPICONSET)).sort()).toEqual([
      'AppIcon-dark.png',
      'AppIcon-tinted.png',
      'AppIcon.png',
      'Contents.json',
    ]);
    for (const name of [
      'AppIcon.png',
      'AppIcon-dark.png',
      'AppIcon-tinted.png',
    ]) {
      expect(
        pngHeader(fs.readFileSync(path.join(root, APPICONSET, name))),
      ).toEqual({width: 1024, height: 1024, colorType: 2});
    }
    const sizes = {mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192};
    for (const [density, size] of Object.entries(sizes)) {
      for (const name of ['ic_launcher', 'ic_launcher_round']) {
        const file = path.join(
          root,
          ANDROID_RES,
          `mipmap-${density}`,
          `${name}.png`,
        );
        expect(pngHeader(fs.readFileSync(file))).toMatchObject({
          width: size,
          height: size,
        });
      }
    }
  });
});

describe('opaqueRgbPng', () => {
  it('refuses a transparent pixel', () => {
    expect(() =>
      opaqueRgbPng(
        {width: 1, height: 1, pixels: Buffer.from([0, 0, 0, 0])},
        'x.png',
      ),
    ).toThrow('non-opaque pixel');
  });
});

describe('buildTextOutputs without the rasterizer', () => {
  afterEach(() => {
    jest.dontMock('@resvg/resvg-js');
  });

  it('never loads @resvg/resvg-js', () => {
    jest.doMock('@resvg/resvg-js', () => {
      throw new Error('resvg loaded');
    });
    jest.isolateModules(() => {
      const isolated = require(GENERATOR_PATH);
      expect(() =>
        isolated.buildTextOutputs({
          foregroundLight: canvas(SQUARE),
          monochrome: canvas(SQUARE),
        }),
      ).not.toThrow();
    });
  });
});

const SAFE_CENTER = 56;
const SAFE_RADIUS = 51.33;
const ARGUMENT_COUNTS = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

const MITER_LIMIT = 4;

// The circle that bounds the whole ellipse an arc is cut from: its centre
// (SVG implementation notes F.6.5) and its larger radius.
function arcBound([x1, y1], [x2, y2], [rx, ry, rotation, large, sweep]) {
  let [a, b] = [Math.abs(rx), Math.abs(ry)];
  if (!a || !b) {
    return {point: [x2, y2], radius: 0};
  }
  const angle = (rotation * Math.PI) / 180;
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const [dx, dy] = [(x1 - x2) / 2, (y1 - y2) / 2];
  const x = cos * dx + sin * dy;
  const y = cos * dy - sin * dx;
  const scaleUp = Math.sqrt(Math.max(1, (x / a) ** 2 + (y / b) ** 2));
  [a, b] = [a * scaleUp, b * scaleUp];
  const spread = (a * y) ** 2 + (b * x) ** 2;
  const factor = spread
    ? Math.sqrt(Math.max(0, ((a * b) ** 2 - spread) / spread)) *
      (large !== sweep ? 1 : -1)
    : 0;
  const [cx, cy] = [(factor * a * y) / b, (-factor * b * x) / a];
  return {
    point: [
      cos * cx - sin * cy + (x1 + x2) / 2,
      sin * cx + cos * cy + (y1 + y2) / 2,
    ],
    radius: Math.max(a, b),
  };
}

function pathExtremes(d) {
  const tokens = d.match(/[MLHVCSQTAZ]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi);
  const extremes = [];
  let current = [0, 0];
  let start = [0, 0];
  let lastControl = null;
  let command = null;
  let i = 0;
  while (i < tokens.length) {
    if (/[a-z]/i.test(tokens[i])) {
      command = tokens[i++];
    }
    const upper = command.toUpperCase();
    const relative = command !== upper;
    const args = tokens.slice(i, i + ARGUMENT_COUNTS[upper]).map(Number);
    i += ARGUMENT_COUNTS[upper];
    const point = (x, y) =>
      relative ? [current[0] + x, current[1] + y] : [x, y];
    const reflected = lastControl
      ? [2 * current[0] - lastControl[0], 2 * current[1] - lastControl[1]]
      : current;
    let end;
    let controls = [];
    switch (upper) {
      case 'M':
      case 'L':
      case 'T':
        end = point(args[0], args[1]);
        controls = upper === 'T' ? [reflected] : [];
        break;
      case 'H':
        end = [relative ? current[0] + args[0] : args[0], current[1]];
        break;
      case 'V':
        end = [current[0], relative ? current[1] + args[0] : args[0]];
        break;
      case 'C':
        controls = [point(args[0], args[1]), point(args[2], args[3])];
        end = point(args[4], args[5]);
        break;
      case 'S':
        controls = [reflected, point(args[0], args[1])];
        end = point(args[2], args[3]);
        break;
      case 'Q':
        controls = [point(args[0], args[1])];
        end = point(args[2], args[3]);
        break;
      case 'A':
        end = point(args[5], args[6]);
        extremes.push(arcBound(current, end, args));
        break;
      case 'Z':
        end = start;
        break;
    }
    lastControl = 'CSQT'.includes(upper) ? controls[controls.length - 1] : null;
    for (const control of controls) {
      extremes.push({point: control, radius: 0});
    }
    extremes.push({point: end, radius: 0});
    if (upper === 'M') {
      start = end;
      command = relative ? 'l' : 'L';
    }
    current = end;
  }
  return extremes;
}

function applyTransform(transform, [x, y], radius) {
  const [a, b, c] = transform.values;
  if (transform.kind === 'translate') {
    return [[x + a, y + b], radius];
  }
  if (transform.kind === 'scale') {
    return [[x * a, y * a], radius * Math.abs(a)];
  }
  const angle = (a * Math.PI) / 180;
  const [dx, dy] = [x - b, y - c];
  return [
    [
      b + dx * Math.cos(angle) - dy * Math.sin(angle),
      c + dx * Math.sin(angle) + dy * Math.cos(angle),
    ],
    radius,
  ];
}

function palPointsOutsideSafeCircle(text) {
  const measure = (d, id, strokeReach, transforms, outside) => {
    for (const extreme of pathExtremes(d)) {
      let {point, radius} = extreme;
      radius += strokeReach;
      for (const transform of [...transforms].reverse()) {
        [point, radius] = applyTransform(transform, point, radius);
      }
      const distance =
        Math.hypot(point[0] - SAFE_CENTER, point[1] - SAFE_CENTER) + radius;
      if (distance > SAFE_RADIUS) {
        outside.push({id, point, distance});
      }
    }
  };
  const visit = (node, transforms, inPal, outside) => {
    if (node.type === 'path') {
      if (!inPal) {
        return;
      }
      const strokeReach = node.attrs.stroke
        ? (Number(node.attrs['stroke-width']) * MITER_LIMIT) / 2
        : 0;
      measure(node.attrs.d, node.attrs.id, strokeReach, transforms, outside);
      return;
    }
    const nested = node.transform
      ? [...transforms, node.transform]
      : transforms;
    // A clipped group only paints inside its clip, so it stays in the safe
    // circle when the clip does, whatever its children draw beyond it.
    if (node.clipD) {
      const clipOutside = [];
      measure(node.clipD, node.clipId, 0, nested, clipOutside);
      if (!clipOutside.length) {
        return;
      }
    }
    for (const child of node.children) {
      visit(child, nested, inPal || node.id === 'pal', outside);
    }
  };
  const outside = [];
  const tree = parseSvg(text);
  let palGroups = 0;
  const countPal = nodes => {
    for (const node of nodes) {
      if (node.type === 'group') {
        palGroups += node.id === 'pal' ? 1 : 0;
        countPal(node.children);
      }
    }
  };
  countPal(tree.children);
  expect(palGroups).toBe(1);
  for (const node of tree.children) {
    visit(node, [], false, outside);
  }
  return outside;
}

const outsideIds = text => [
  ...new Set(palPointsOutsideSafeCircle(text).map(({id}) => id)),
];

describe('committed sources', () => {
  const readSource = key =>
    fs.readFileSync(
      path.join(__dirname, '..', '..', SOURCE_DIR, SOURCE_FILES[key]),
      'utf-8',
    );

  it.each(Object.keys(SOURCE_FILES))(
    'keeps the pal of %s inside the safe circle',
    key => {
      expect(palPointsOutsideSafeCircle(readSource(key))).toEqual([]);
    },
  );

  it('names the pal path that leaves the safe circle', () => {
    const moved = readSource('foregroundLight').replace(
      'M78.7 29.1A',
      'M78.7 -45A',
    );
    expect(outsideIds(moved)).toEqual(['moon']);
  });

  it('applies group transforms before measuring', () => {
    const shifted = canvas(
      '<g id="pal"><g transform="translate(60 0)"><path id="nudged" d="M56 56H60" fill="#000000"/></g></g>',
    );
    expect(outsideIds(shifted)).toEqual(['nudged']);
  });
});

describe('committed outputs', () => {
  const repoRoot = path.join(__dirname, '..', '..');
  const sources = Object.fromEntries(
    Object.entries(SOURCE_FILES).map(([key, file]) => [
      key,
      fs.readFileSync(path.join(repoRoot, SOURCE_DIR, file), 'utf-8'),
    ]),
  );
  const textOutputs = buildTextOutputs(sources);

  it.each(Object.keys(textOutputs))('%s matches its sources', relative => {
    expect(fs.readFileSync(path.join(repoRoot, relative), 'utf-8')).toBe(
      textOutputs[relative],
    );
  });

  it('hides the far side of the ring behind the planet in the monochrome layer', () => {
    const monochrome =
      textOutputs[`${ANDROID_RES}/drawable/ic_launcher_monochrome.xml`];
    expect(monochrome).toContain('android:fillType="evenOdd"');
    expect(monochrome.match(/<clip-path/g)).toHaveLength(2);
  });

  it('draws the in-app logo from the launcher sources', () => {
    const art = text => text.slice(text.indexOf('<g id="pal">'));
    const launcher = art(sources.foregroundLight).replace(/\s*\n\s*/g, '');
    const mark = textOutputs[`${BRAND_DIR}/mark.svg`];
    const inverse = textOutputs[`${BRAND_DIR}/mark-inverse.svg`];
    const paths = text => [...text.matchAll(/ d="([^"]+)"/g)].map(([, d]) => d);
    expect(paths(art(mark))).toEqual(paths(launcher));
    expect(paths(art(inverse))).toEqual(paths(launcher));
    expect(mark).toContain('fill="#000000"/>');
    expect(inverse).toContain('fill="#FFFFFF"/>');
    expect(art(inverse)).not.toContain('#FFFFFF');
  });

  it('ships exactly three opaque 1024 iOS icons', () => {
    const dir = path.join(repoRoot, APPICONSET);
    expect(fs.readdirSync(dir).filter(visible).sort()).toEqual([
      'AppIcon-dark.png',
      'AppIcon-tinted.png',
      'AppIcon.png',
      'Contents.json',
    ]);
    for (const name of [
      'AppIcon.png',
      'AppIcon-dark.png',
      'AppIcon-tinted.png',
    ]) {
      expect(pngHeader(fs.readFileSync(path.join(dir, name)))).toEqual({
        width: 1024,
        height: 1024,
        colorType: 2,
      });
    }
  });

  it.each([
    ['mdpi', 48],
    ['hdpi', 72],
    ['xhdpi', 96],
    ['xxhdpi', 144],
    ['xxxhdpi', 192],
  ])('ships %s legacy icons at %ipx', (density, size) => {
    for (const name of ['ic_launcher', 'ic_launcher_round']) {
      const file = path.join(
        repoRoot,
        ANDROID_RES,
        `mipmap-${density}`,
        `${name}.png`,
      );
      expect(pngHeader(fs.readFileSync(file))).toMatchObject({
        width: size,
        height: size,
      });
    }
  });
});

describe('parseSvg rejects malformed input', () => {
  const CLIP = '<path d="M0 0H9V9Z"/>';
  it.each([
    ['a mismatched closing tag', `<g>${SQUARE}</defs>`, 'closes <g>'],
    [
      'a repeated attribute',
      '<path d="M0 0H9V9Z" fill="#000000" fill="#FFFFFF"/>',
      'repeats fill',
    ],
    [
      'a clip-path that is not a url',
      `<g clip-path="none">${SQUARE}</g>`,
      'clip-path "none"',
    ],
    ['a path without d', '<path fill="#000000"/>', 'without d'],
    [
      'a path with children',
      `<path id="p" d="M0 0H9V9Z" fill="#000000">${SQUARE}</path>`,
      'p has children',
    ],
    [
      'a stroke without a stroke-width',
      '<path id="s" d="M0 0L9 9" fill="none" stroke="#000000"/>',
      's needs an explicit stroke-width',
    ],
    [
      'an unknown fill-rule',
      '<path d="M0 0H9V9Z" fill="#000000" fill-rule="inherit"/>',
      'fill-rule="inherit"',
    ],
    [
      'a clipPath without id',
      `<defs><clipPath>${CLIP}</clipPath></defs>${SQUARE}`,
      'without id',
    ],
    [
      'a clipPath defined twice',
      `<defs><clipPath id="c">${CLIP}</clipPath><clipPath id="c">${CLIP}</clipPath></defs>` +
        `<g clip-path="url(#c)">${SQUARE}</g>`,
      'defined twice',
    ],
    [
      'a clipPath path carrying more than d',
      '<defs><clipPath id="c"><path d="M0 0H9V9Z" fill="#000000"/></clipPath></defs>' +
        `<g clip-path="url(#c)">${SQUARE}</g>`,
      'may carry only d',
    ],
    [
      'a <defs> outside the root',
      `<g><defs><clipPath id="c">${CLIP}</clipPath></defs>${SQUARE}</g>`,
      '<defs> here',
    ],
  ])('rejects %s', (_, body, message) => {
    expect(() => parseSvg(canvas(body))).toThrow(message);
  });

  it.each([
    [
      'a packed arc flag',
      'M0 0A2.57 2.57 0 0139.2 53.0Z',
      'A2.57 2.57 0 0139.2 53.0',
    ],
    ['a flag that is not 0 or 1', 'M0 0A1 1 0 2 1 9 9', 'A1 1 0 2 1 9 9'],
    ['an unknown command', 'M0 0B9 9Z', 'B9 9'],
    ['a sign used as a separator', 'M0 0L9-9Z', 'L9-9'],
    ['a short argument list', 'M0 0L9Z', 'L9'],
    ['arguments after Z', 'M0 0H9V9Z 1', 'Z 1'],
  ])('rejects path data with %s, naming the path', (_, d, segment) => {
    expect(() =>
      parseSvg(canvas(`<path id="p" d="${d}" fill="#000000"/>`)),
    ).toThrow(`path p has unsupported path data "${segment}"`);
  });

  it('rejects path data that does not start with a moveto', () => {
    expect(() =>
      parseSvg(canvas('<path id="p" d="L9 9" fill="#000000"/>')),
    ).toThrow('path p has path data not starting with a moveto');
  });

  it('rejects unsupported clipPath path data, naming the clipPath', () => {
    expect(() =>
      parseSvg(
        canvas(
          '<defs><clipPath id="c"><path d="M0 0B9 9Z"/></clipPath></defs>' +
            `<g clip-path="url(#c)">${SQUARE}</g>`,
        ),
      ),
    ).toThrow('clipPath c has unsupported path data "B9 9"');
  });

  it('accepts separated arc flags, commas and relative commands', () => {
    expect(() =>
      parseSvg(
        canvas(
          '<path d="M0,0 l9 9 a1 1 0 1 0 2 2 A1,1 0 0,1 4 4 h1v1z" fill="#000000"/>',
        ),
      ),
    ).not.toThrow();
  });

  it('rejects a document that is not a single <svg>', () => {
    expect(() => parseSvg(canvas(SQUARE) + canvas(SQUARE))).toThrow(
      'single <svg>',
    );
  });
});

describe('safe-circle scan', () => {
  it.each([
    [
      'an arc whose radius reaches outside',
      '<path id="arc" d="M56 56A60 60 0 0 1 60 56" fill="#000000"/>',
    ],
    [
      'an arc bulging out between endpoints inside',
      '<path id="bulge" d="M56 80A14 14 0 1 0 57 80" fill="#000000"/>',
    ],
    [
      'an arc whose too-small radius scales up outside',
      '<path id="scaled-arc" d="M46 100A1 1 0 0 0 66 100" fill="#000000"/>',
    ],
    [
      'a stroked outline whose stroke reaches outside',
      '<path id="outline" d="M56 106H57" fill="none" stroke="#000000" stroke-width="4"/>',
    ],
    [
      'a relative segment ending outside',
      '<path id="relative" d="M56 56l0 52" fill="#000000"/>',
    ],
    [
      'a curve whose control point is outside',
      '<path id="curve" d="M50 56C50 120 60 120 60 56Z" fill="#000000"/>',
    ],
    [
      'a scale group moving the path outside',
      '<g transform="scale(2)"><path id="scaled" d="M56 56H58" fill="#000000"/></g>',
    ],
    [
      'a rotate group moving the path outside',
      '<g transform="rotate(90 0 56)"><path id="rotated" d="M56 56H58" fill="#000000"/></g>',
    ],
  ])('flags %s', (_, body) => {
    const [id] = body.match(/id="([^"]+)"/).slice(1);
    expect(outsideIds(canvas(`<g id="pal">${body}</g>`))).toEqual([id]);
  });

  it('lets a clip inside the safe circle bound what its group draws', () => {
    const clipped = clip =>
      canvas(
        `<defs><clipPath id="c"><path d="${clip}"/></clipPath></defs>` +
          '<g id="pal"><g clip-path="url(#c)"><path id="wide" d="M-20 -20H130V130Z" fill="#000000"/></g></g>',
      );
    expect(outsideIds(clipped('M40 40H70V70H40Z'))).toEqual([]);
    expect(outsideIds(clipped('M-28 -28H140V140Z'))).toEqual(['wide']);
  });

  it('ignores clip geometry and paths outside the pal group', () => {
    const text = canvas(
      '<defs><clipPath id="c"><path d="M-28 -28H140V140Z"/></clipPath></defs>' +
        '<path id="rim" d="M-28 -28H140" fill="none" stroke="#000000" stroke-width="1"/>' +
        '<g clip-path="url(#c)"><g id="pal"><path id="inside" d="M50 50H60V60Z" fill="#000000"/></g></g>',
    );
    expect(outsideIds(text)).toEqual([]);
  });
});

function drawnPathIds(nodes, inPal = false, out = {pal: [], rest: []}) {
  for (const node of nodes) {
    if (node.type === 'path') {
      (inPal ? out.pal : out.rest).push(node.attrs.id);
    } else {
      drawnPathIds(node.children, inPal || node.id === 'pal', out);
    }
  }
  return out;
}

describe('committed source structure', () => {
  const readSource = key =>
    fs.readFileSync(
      path.join(__dirname, '..', '..', SOURCE_DIR, SOURCE_FILES[key]),
      'utf-8',
    );
  // 口袋AI 标识（星球轨道）：倾斜的星环绕过星球，环的远侧被星球挡住，
  // 近侧与星球之间留一道缝；右上角一颗卫星。三个图层同一几何、纯白。
  const MARK = ['ringBackBand', 'planetBody', 'ringFront', 'moon'];

  it.each(Object.keys(SOURCE_FILES))(
    'puts the whole mark of %s in the pal group with nothing outside',
    key => {
      expect(drawnPathIds(parseSvg(readSource(key)).children)).toEqual({
        pal: MARK,
        rest: [],
      });
    },
  );

  it('draws the monochrome layer in opaque white only', () => {
    const text = readSource('monochrome');
    expect(text).not.toContain('fill-opacity');
    const paints = [...text.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map(
      ([, value]) => value,
    );
    expect(new Set(paints)).toEqual(new Set(['#FFFFFF']));
    expect(text).toContain('fill-rule="evenodd"');
  });

  it('draws every layer from the same geometry', () => {
    const light = readSource('foregroundLight');
    expect(light).toContain('id="planetBody" d="');
    expect(readSource('foregroundDark')).toBe(light);
    expect(readSource('monochrome')).toBe(light);
  });
});

describe('Android launcher resources', () => {
  const repoRoot = path.join(__dirname, '..', '..');
  const resRoot = path.join(repoRoot, ANDROID_RES);

  it('keeps the manifest on both mipmap names', () => {
    const manifest = fs.readFileSync(
      path.join(repoRoot, 'android/app/src/main/AndroidManifest.xml'),
      'utf-8',
    );
    expect(manifest).toContain('android:icon="@mipmap/ic_launcher"');
    expect(manifest).toContain('android:roundIcon="@mipmap/ic_launcher_round"');
  });

  it('resolves both names on anydpi-v26 and every legacy density, with no dark variant', () => {
    const found = [];
    for (const dir of fs.readdirSync(resRoot).filter(visible)) {
      for (const file of fs.readdirSync(path.join(resRoot, dir))) {
        if (file.startsWith('ic_launcher')) {
          found.push(`${dir}/${file}`);
        }
      }
    }
    const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
    expect(found.sort()).toEqual(
      [
        'drawable/ic_launcher_foreground.xml',
        'drawable/ic_launcher_monochrome.xml',
        'mipmap-anydpi-v26/ic_launcher.xml',
        'mipmap-anydpi-v26/ic_launcher_round.xml',
        'values/ic_launcher_background.xml',
        ...densities.flatMap(density => [
          `mipmap-${density}/ic_launcher.png`,
          `mipmap-${density}/ic_launcher_round.png`,
        ]),
      ].sort(),
    );
  });

  it('leaves flavour source sets without a launcher icon override', () => {
    const flavours = fs
      .readdirSync(path.join(repoRoot, 'android/app/src'))
      .filter(name => name !== 'main');
    for (const flavour of flavours) {
      const res = path.join(repoRoot, 'android/app/src', flavour, 'res');
      const icons = fs.existsSync(res)
        ? fs
            .readdirSync(res, {recursive: true})
            .filter(file => path.basename(file).startsWith('ic_launcher'))
        : [];
      expect({flavour, icons}).toEqual({flavour, icons: []});
    }
  });
});

const PAETH = (a, b, c) => {
  const p = a + b - c;
  const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

function decodePng(buffer) {
  const chunks = [];
  const idat = [];
  for (let at = 8; at < buffer.length; ) {
    const length = buffer.readUInt32BE(at);
    const type = buffer.subarray(at + 4, at + 8).toString('ascii');
    chunks.push(type);
    if (type === 'IDAT') {
      idat.push(buffer.subarray(at + 8, at + 8 + length));
    }
    at += 12 + length;
  }
  const {width, height, colorType} = pngHeader(buffer);
  expect(buffer[24]).toBe(8);
  const channels = {2: 3, 6: 4}[colorType];
  const raw = require('zlib').inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const value = raw[y * (stride + 1) + 1 + x];
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y ? pixels[(y - 1) * stride + x] : 0;
      const upLeft =
        y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      const predictor =
        filter === 4
          ? PAETH(left, up, upLeft)
          : [0, left, up, Math.floor((left + up) / 2)][filter];
      pixels[y * stride + x] = (value + predictor) % 256;
    }
  }
  const at = (u, v) => {
    const x = Math.floor((u * width) / 112);
    const y = Math.floor((v * height) / 112);
    const from = y * stride + x * channels;
    const [r, g, b, a = 255] = pixels.subarray(from, from + channels);
    const hex = [r, g, b]
      .map(c => c.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    return {color: `#${hex}`, alpha: a};
  };
  return {chunks, width, height, colorType, pixels, at};
}

const premultiplied = ({colorType, pixels}) => {
  if (colorType === 2) {
    return pixels;
  }
  const out = Buffer.alloc(pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    for (let c = 0; c < 3; c++) {
      out[i + c] = Math.round((pixels[i + c] * alpha) / 255);
    }
    out[i + 3] = alpha;
  }
  return out;
};

const maxChannelDifference = (a, b) => {
  const [left, right] = [premultiplied(a), premultiplied(b)];
  let max = 0;
  for (let i = 0; i < left.length; i++) {
    max = Math.max(max, Math.abs(left[i] - right[i]));
  }
  return max;
};

describe('decodePng', () => {
  const WIDTH = 6;
  const HEIGHT = 10;

  const samplePixels = channels => {
    let seed = 7;
    return Buffer.from(
      Array.from({length: WIDTH * HEIGHT * channels}, (_, i) => {
        seed = (seed * 75 + 74) % 65537;
        return channels === 4 && i % 4 === 3 ? 255 : seed % 256;
      }),
    );
  };

  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(require('zlib').crc32(body));
    return Buffer.concat([length, body, crc]);
  };

  const encodeWithEveryFilter = (colorType, pixels) => {
    const channels = {2: 3, 6: 4}[colorType];
    const stride = WIDTH * channels;
    const rows = Buffer.alloc(HEIGHT * (stride + 1));
    for (let y = 0; y < HEIGHT; y++) {
      const filter = y % 5;
      rows[y * (stride + 1)] = filter;
      for (let x = 0; x < stride; x++) {
        const left = x >= channels ? pixels[y * stride + x - channels] : 0;
        const up = y ? pixels[(y - 1) * stride + x] : 0;
        const upLeft =
          y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
        const predictor = [
          0,
          left,
          up,
          Math.floor((left + up) / 2),
          PAETH(left, up, upLeft),
        ][filter];
        rows[y * (stride + 1) + 1 + x] =
          (pixels[y * stride + x] - predictor + 256) % 256;
      }
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(WIDTH, 0);
    header.writeUInt32BE(HEIGHT, 4);
    header[8] = 8;
    header[9] = colorType;
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', header),
      chunk('IDAT', require('zlib').deflateSync(rows)),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  };

  const decodedByResvg = png => {
    const {Resvg} = require('@resvg/resvg-js');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"><image width="${WIDTH}" height="${HEIGHT}" image-rendering="optimizeSpeed" href="data:image/png;base64,${png.toString('base64')}"/></svg>`;
    return Buffer.from(new Resvg(svg).render().pixels);
  };

  const opaqueRgba = (channels, pixels) =>
    Buffer.from(
      Array.from({length: WIDTH * HEIGHT * 4}, (_, i) =>
        i % 4 === 3 ? 255 : pixels[Math.floor(i / 4) * channels + (i % 4)],
      ),
    );

  it.each([2, 6])(
    'decodes all five filter types in colour type %i',
    colorType => {
      const channels = {2: 3, 6: 4}[colorType];
      const pixels = samplePixels(channels);
      const png = encodeWithEveryFilter(colorType, pixels);
      expect(decodedByResvg(png)).toEqual(opaqueRgba(channels, pixels));
      expect(decodePng(png).pixels).toEqual(pixels);
    },
  );
});

describe('committed PNG content', () => {
  const repoRoot = path.join(__dirname, '..', '..');
  const png = relative =>
    decodePng(fs.readFileSync(path.join(repoRoot, relative)));
  const BACKDROP = [1, 1];
  const PLANET = [52.6, 47.7];
  const GAP = [57.3, 59.2];
  const RING = [59.1, 63.7];
  const MOON = [82.9, 29.1];

  it.each([
    ['AppIcon.png', '#000000', '#FFFFFF'],
    ['AppIcon-dark.png', '#0A0A0A', '#FFFFFF'],
    ['AppIcon-tinted.png', '#000000', '#FFFFFF'],
  ])(
    '%s paints backdrop %s and mark %s with the gap between planet and ring cut out and no transparency chunk',
    (name, backdrop, mark) => {
      const icon = png(`${APPICONSET}/${name}`);
      expect(icon.chunks).toEqual(['IHDR', 'IDAT', 'IEND']);
      expect(icon.at(...BACKDROP)).toEqual({color: backdrop, alpha: 255});
      expect(icon.at(...PLANET)).toEqual({color: mark, alpha: 255});
      expect(icon.at(...RING)).toEqual({color: mark, alpha: 255});
      expect(icon.at(...MOON)).toEqual({color: mark, alpha: 255});
      expect(icon.at(...GAP)).toEqual({color: backdrop, alpha: 255});
    },
  );

  it.each(['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'])(
    'masks the %s legacy icons as a rounded square and a circle over the iOS composition',
    density => {
      const square = png(`${ANDROID_RES}/mipmap-${density}/ic_launcher.png`);
      const round = png(
        `${ANDROID_RES}/mipmap-${density}/ic_launcher_round.png`,
      );
      const ios = png(`${APPICONSET}/AppIcon.png`);
      const brand = png(`${BRAND_DIR}/mark-512.png`);
      for (const icon of [square, round, brand]) {
        expect(icon.colorType).toBe(6);
        expect(icon.at(0, 0).alpha).toBe(0);
        for (const point of [PLANET, GAP, RING, MOON]) {
          expect(icon.at(...point)).toEqual(ios.at(...point));
        }
      }
      expect(square.at(14, 14)).toEqual({color: '#000000', alpha: 255});
      expect(round.at(14, 14).alpha).toBe(0);
    },
  );
});

describe('generate from the committed sources', () => {
  const repoRoot = path.join(__dirname, '..', '..');
  let root;
  let previewDir;
  let firstRun;

  const listFiles = dir =>
    fs
      .readdirSync(dir, {recursive: true})
      .filter(visible)
      .filter(file => fs.statSync(path.join(dir, file)).isFile())
      .map(file => file.split(path.sep).join('/'))
      .sort();
  const readAll = dir =>
    Object.fromEntries(
      listFiles(dir).map(file => [file, fs.readFileSync(path.join(dir, file))]),
    );

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'app-icons-real-'));
    previewDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-icons-preview-'));
    for (const file of Object.values(SOURCE_FILES)) {
      const target = path.join(root, SOURCE_DIR, file);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.copyFileSync(path.join(repoRoot, SOURCE_DIR, file), target);
    }
    generate({root, previewDir});
    firstRun = readAll(root);
  });

  const committed = [
    ...listFiles(path.join(repoRoot, APPICONSET)).map(
      file => `${APPICONSET}/${file}`,
    ),
    ...fs
      .readdirSync(path.join(repoRoot, ANDROID_RES), {recursive: true})
      .filter(file => path.basename(file).startsWith('ic_launcher'))
      .map(file => `${ANDROID_RES}/${file.split(path.sep).join('/')}`),
    ...listFiles(path.join(repoRoot, BRAND_DIR)).map(
      file => `${BRAND_DIR}/${file}`,
    ),
  ].sort();

  afterAll(() => {
    fs.rmSync(root, {recursive: true, force: true});
    fs.rmSync(previewDir, {recursive: true, force: true});
  });

  it('writes the committed output set and nothing else', () => {
    const outputs = Object.keys(firstRun).filter(
      file => !file.startsWith(`${SOURCE_DIR}/`),
    );
    expect(outputs).toEqual(committed);
  });

  it.each(committed.filter(file => file.endsWith('.png')))(
    'regenerates %s to the committed pixels',
    relative => {
      const expected = decodePng(
        fs.readFileSync(path.join(repoRoot, relative)),
      );
      const actual = decodePng(firstRun[relative]);
      const shape = ({width, height, colorType}) => ({
        width,
        height,
        colorType,
      });
      expect(shape(actual)).toEqual(shape(expected));
      expect(maxChannelDifference(actual, expected)).toBeLessThanOrEqual(2);
    },
  );

  it('writes byte-identical outputs on a second run', () => {
    generate({root});
    expect(readAll(root)).toEqual(firstRun);
  });

  it('writes previews only to the preview directory', () => {
    expect(listFiles(previewDir)).toEqual([
      'android-monochrome-themed-1024.png',
      'android-monochrome-themed-144.png',
      'canvas-foreground-dark.png',
      'canvas-foreground-light.png',
      'canvas-monochrome.png',
      'ios-tinted-1024.png',
      'ios-tinted-180.png',
    ]);
    expect(Object.keys(firstRun).some(file => file.includes('canvas-'))).toBe(
      false,
    );
  });
});

describe('command line', () => {
  let root;

  const run = args => {
    try {
      const stdout = execFileSync(
        'node',
        [path.join(root, 'scripts', 'generate-app-icons.js'), ...args],
        {
          stdio: 'pipe',
          env: {
            ...process.env,
            NODE_PATH: path.join(__dirname, '..', '..', 'node_modules'),
          },
        },
      );
      return {status: 0, stdout: stdout.toString()};
    } catch (error) {
      return {status: error.status, stderr: error.stderr.toString()};
    }
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'app-icons-cli-'));
    const sources = {
      foregroundLight: canvas(SQUARE),
      foregroundDark: canvas(SQUARE),
      monochrome: canvas(SQUARE),
    };
    for (const [key, text] of Object.entries(sources)) {
      const target = path.join(root, SOURCE_DIR, SOURCE_FILES[key]);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.writeFileSync(target, text);
    }
    fs.copyFileSync(
      GENERATOR_PATH,
      path.join(root, 'scripts', 'generate-app-icons.js'),
    );
  });

  afterEach(() => {
    fs.rmSync(root, {recursive: true, force: true});
  });

  it('reports what it wrote and exits zero', () => {
    expect(run([])).toEqual({
      status: 0,
      stdout: 'wrote 22 outputs, 0 previews\n',
    });
  });

  it.each([[['--bogus']], [['--preview']]])('exits non-zero on %j', args => {
    const result = run(args);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('unexpected argument');
    expect(fs.existsSync(path.join(root, 'android'))).toBe(false);
  });
});

describe('generate on failure', () => {
  let root;

  afterEach(() => {
    fs.rmSync(root, {recursive: true, force: true});
  });

  it('refuses a subfolder in the appiconset before writing anything', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'app-icons-subfolder-'));
    for (const key of Object.keys(SOURCE_FILES)) {
      const target = path.join(root, SOURCE_DIR, SOURCE_FILES[key]);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.writeFileSync(target, canvas(SQUARE));
    }
    const contents = path.join(root, APPICONSET, 'Contents.json');
    fs.mkdirSync(path.join(root, APPICONSET, 'old.imageset'), {
      recursive: true,
    });
    fs.writeFileSync(contents, 'previous');

    expect(() => generate({root})).toThrow('old.imageset is a directory');

    expect(fs.readFileSync(contents, 'utf-8')).toBe('previous');
    expect(fs.readdirSync(path.join(root, APPICONSET)).sort()).toEqual([
      'Contents.json',
      'old.imageset',
    ]);
    expect(fs.existsSync(path.join(root, 'android'))).toBe(false);
  });

  it('leaves existing outputs and stale icons untouched', () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'app-icons-keep-'));
    const sources = {
      foregroundLight: canvas(SQUARE),
      foregroundDark: canvas('<rect width="1" height="1"/>'),
      monochrome: canvas(SQUARE),
    };
    for (const [key, text] of Object.entries(sources)) {
      const target = path.join(root, SOURCE_DIR, SOURCE_FILES[key]);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.writeFileSync(target, text);
    }
    const existing = {
      [`${APPICONSET}/iPhone_App_60_2x.png`]: 'stale',
      [`${ANDROID_RES}/drawable/ic_launcher_foreground.xml`]: 'previous',
    };
    for (const [relative, content] of Object.entries(existing)) {
      fs.mkdirSync(path.dirname(path.join(root, relative)), {recursive: true});
      fs.writeFileSync(path.join(root, relative), content);
    }

    expect(() => generate({root})).toThrow('<rect>');

    for (const [relative, content] of Object.entries(existing)) {
      expect(fs.readFileSync(path.join(root, relative), 'utf-8')).toBe(content);
    }
    expect(fs.readdirSync(path.join(root, APPICONSET))).toEqual([
      'iPhone_App_60_2x.png',
    ]);
  });
});
