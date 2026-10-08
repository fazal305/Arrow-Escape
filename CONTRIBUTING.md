# Contributing

Thanks for wanting to help with Arrow Escape.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Before opening a pull request, run the same checks CI runs:

```bash
npm run lint
npm test
npm run build
```

## Adding or changing levels

Levels live in `src/levels/levels.json` and are generated from the shape masks
in `scripts/shapes.js`:

1. Add or edit a shape mask. Each letter is a colour region (see `PALETTE`);
   `.` is outside the shape.
2. Run `npm run levels` to regenerate `levels.json`. The generator only emits
   levels that are solvable.
3. Run `npm test`. Every bundled level is checked for solvability.

You can also hand-edit `levels.json`. The row encoding is documented at the top
of `src/game/engine.js`.

## Pull requests

- Keep changes focused; one topic per pull request.
- Describe what changed and how you tested it (browser and screen size).
- UI changes should keep keyboard play, visible focus and the
  `prefers-reduced-motion` behaviour working.

By contributing you agree to the Contributor License Agreement below and that
you will follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Contributor License Agreement

This project is licensed under the PolyForm Noncommercial License 1.0.0, with paid commercial licenses available from the maintainer. Contributions are accepted only under the [Contributor License Agreement](CLA.md), which lets the maintainer relicense and sell them. Pull requests are merged only after you have agreed to it in the pull request template.
