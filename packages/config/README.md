# @platform/config

Shared, non-runtime tooling config consumed by every other app/package:

- `eslint-preset.js` — the base ESLint flat-config, including the lint rule that mechanically enforces the Clean Architecture dependency direction from [Architecture §5](../../docs/02-architecture/ARCHITECTURE.md#5-clean-architecture-inside-the-api-service) (`domain/`/`application/` may not import `infrastructure/`).
- Root [`tsconfig.base.json`](../../tsconfig.base.json) is extended directly by each app/package's own `tsconfig.json` rather than re-exported from here — one less indirection for a setting every TS file in the repo shares.

A single root-level [`eslint.config.js`](../../eslint.config.js) applies this preset repo-wide — ESLint's flat config resolves upward from any app's working directory, so no app needs its own copy. If an app ever needs true per-app overrides, its `eslint.config.js` would be one line:

```js
import { basePreset } from "@platform/config/eslint-preset.js";
export default [...basePreset, /* app-specific overrides */];
```
