# Dependabot Remediation Plan: Pillow 12.3.0

## Status

**Implemented in this PR.** The two direct pins now target Pillow 12.3.0. Clean Python 3.12 dependency resolution, `pip check`, Pillow version reporting, and the ML-service test pass locally. Docker/Compose verification remains pending because the local Docker service is unavailable; Dependabot closure remains pending merge and graph refresh.

## Decision summary

Upgrade the two direct Pillow pins from `12.2.0` to `12.3.0`:

- `ml-service/requirements.txt`
- `tests/requirements.txt`

This is one coordinated dependency update, not 26 independent code fixes. All 26 open alerts affect the same direct `pillow` dependency and identify `12.3.0` as the first patched version. There is no committed Python lockfile or constraints file to regenerate.

The ML service is the production-critical target: it accepts image bytes, decodes them with `PIL.Image.open(...).convert("RGB")`, and runs in the `python:3.12-slim` image. The test requirements contain a second direct pin used by the Python test environment.

Pillow 12.3.0 requires Python 3.10 or later and publishes Python 3.12 support, so it is compatible with the service base image. See the [Pillow 12.3.0 PyPI release](https://pypi.org/project/pillow/12.3.0/) and its [release notes](https://pillow.readthedocs.io/en/stable/releasenotes/12.3.0.html).

## Alert inventory and coverage

Snapshot source: [PixelQueue Dependabot alerts](https://github.com/DhruvGarg111/PixelQueue/security/dependabot).

- Open alerts: **26**
- Severity: **20 high**, **6 medium**
- Distinct advisories: **13**
- Direct manifests: `tests/requirements.txt` and `ml-service/requirements.txt`
- First patched version for every alert: **12.3.0**

Each row below represents two alerts for the same advisory: the first is from `tests/requirements.txt`, and the second is from `ml-service/requirements.txt`.

| Alerts | Severity | Advisory | Risk addressed by 12.3.0 |
|---|---|---|---|
| [#61](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/61) / [#49](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/49) | High | `GHSA-9hw9-ch79-4vh6` / `CVE-2026-59205` | Heap out-of-bounds write in `ImageCmsTransform.apply()` when image modes do not match. |
| [#60](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/60) / [#48](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/48) | High | `GHSA-vjc4-5qp5-m44j` / `CVE-2026-59204` | JPEG2000 tiled decoding can retain a growing scratch buffer and cause denial of service. |
| [#59](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/59) / [#47](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/47) | High | `GHSA-jjj6-mw9f-p565` / `CVE-2026-59200` | PDF stream decoding can trigger a decompression-bomb denial of service. |
| [#58](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/58) / [#46](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/46) | High | `GHSA-6r8x-57c9-28j4` / `CVE-2026-59199` | Signed-coordinate overflow can cause out-of-bounds writes in `Image.crop()` and `Image.paste()`. |
| [#57](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/57) / [#45](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/45) | Medium | `GHSA-fj7v-r99m-22gq` / `CVE-2026-59198` | TGA RLE encoding can disclose adjacent heap data. |
| [#56](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/56) / [#44](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/44) | High | `GHSA-xj96-63gp-2gmr` / `CVE-2026-59197` | Large `ImageFilter.RankFilter` sizes can cause an out-of-bounds write. |
| [#55](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/55) / [#43](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/43) | Medium | `GHSA-4x4j-2g7c-83w6` / `CVE-2026-55798` | `WindowsViewer.get_command()` can permit shell injection when an attacker controls the path. |
| [#54](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/54) / [#42](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/42) | High | `GHSA-phj9-mv4w-65pm` / `CVE-2026-55380` | GD images can bypass Pillow's decompression-bomb check. |
| [#53](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/53) / [#41](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/41) | High | `GHSA-45hq-cxwh-f6vc` / `CVE-2026-55379` | BDF font loading can bypass decompression-bomb protection. |
| [#52](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/52) / [#40](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/40) | High | `GHSA-5x94-69rx-g8h2` / `CVE-2026-54060` | `FontFile.compile()` can bypass decompression-bomb protection. |
| [#51](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/51) / [#39](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/39) | High | `GHSA-8v84-f9pq-wr9x` / `CVE-2026-54059` | PCF font bitmap loading can bypass decompression-bomb protection. |
| [#50](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/50) / [#38](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/38) | High | `GHSA-62p4-gmf7-7g93` / `CVE-2026-54058` | An attacker-controlled McIDAS row stride can cause an out-of-bounds read. |
| [#37](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/37) / [#36](https://github.com/DhruvGarg111/PixelQueue/security/dependabot/36) | Medium | `GHSA-pg7v-jwj7-p798` / `CVE-2026-59203` | A negative EPS `%%BeginBinary` count can cause an infinite loop. |

## Implementation plan

### 1. Create a focused remediation branch

Branch from current `origin/main` and keep the change dependency-only. Do not reuse the merged PR #35: its security update left both manifests on `pillow==12.2.0`, which is below the newly required minimum.

### 2. Update both direct pins atomically

Change only the following values:

```diff
# ml-service/requirements.txt
-pillow==12.2.0
+pillow==12.3.0

# tests/requirements.txt
-pillow==12.2.0
+pillow==12.3.0
```

Keep exact pins. The repository already uses exact dependency versions, and an exact `12.3.0` pin gives Dependabot a deterministic fixed version in both manifests.

Do not change the API or worker requirements: neither declares Pillow. Do not manually dismiss any alert; merging the corrected dependency graph into the default branch is the intended closure mechanism.

### 3. Verify dependency resolution and the ML service path

Use a clean Python 3.12 environment and install every Python requirement set needed by the test suite:

```powershell
python -m pip install -r api/requirements.txt -r worker/requirements.txt -r ml-service/requirements.txt -r tests/requirements.txt
python -m pip check
python -c "import PIL; print(PIL.__version__)"
pytest tests/ml_service/test_ml_service.py
```

Expected results:

- `pip check` has no conflicts.
- The reported Pillow version is `12.3.0`.
- The ML-service test still decodes a generated RGB PNG and returns valid auto-label predictions.

Build a fresh production-equivalent image rather than trusting a cached dependency layer:

```powershell
docker compose build --no-cache ml-service
docker compose up -d ml-service
docker compose exec ml-service python -c "import PIL; print(PIL.__version__)"
```

Then run the full Compose stack, including `worker`, and run the host-side end-to-end flow:

```powershell
docker compose up -d
.\scripts\run_demo_flow.ps1
```

The current documented `docker compose run --rm api pytest` command is not a self-contained security gate: `api/Dockerfile` installs only `api/requirements.txt`, which does not contain `pytest` or the test requirements. Use the clean test environment above for this remediation, or address a dedicated test-runner image as separate work.

### 4. Deploy and verify alert closure

Deploy the rebuilt ML-service image through the normal release path. Confirm `/healthz` is healthy and verify the in-container Pillow version before considering rollout complete.

After the change reaches the default branch, re-query the Dependabot API or dashboard until all 26 alert URLs above are closed and no open `pillow` alert remains. Allow GitHub's dependency graph to refresh; do not use dismissals to make the dashboard appear clean.

## Scope and risk notes

This upgrade is urgent because the ML service parses image bytes with Pillow. The normal upload path declares PNG, JPEG, or WebP MIME types and enforces byte limits, but the service ultimately processes decoded bytes; MIME declarations and a byte-size limit are not a replacement for patched image decoders.

The source currently does not call the advisory-specific `ImageCms`, `WindowsViewer`, `RankFilter`, TGA-output, or `FontFile` APIs. That lowers compatibility risk, but it does not remove the need to update the vulnerable library.

Pillow's 12.3.0 release includes the relevant security fixes. Its release notes specifically call out removal of invalid 1-bit TGA RLE encoding; PixelQueue's current source and tests use PNG image generation and RGB conversion instead, so that behavior change is not expected to apply.

## Follow-up hardening (separate from alert closure)

Schedule these after the dependency-only patch so they do not delay remediation:

1. Keep `ml-service` internal to the Compose network in production, or explicitly bind its published port to the intended private interface. Its current Compose configuration publishes port 8002.
2. Add tests for malformed image bytes, maximum decoded pixel dimensions, and behavior at the payload-size boundary. The current 15 MB ML-service byte limit and the API upload limit are useful but do not independently cap decoded pixel count.
3. Add a reproducible Python test-runner target or CI job that installs the test requirements before invoking pytest. This prevents documentation and verification drift.

## Completion criteria

- Both manifests pin `pillow==12.3.0`; neither still references `12.2.0`.
- A clean Python 3.12 environment passes `pip check` and reports Pillow 12.3.0.
- `tests/ml_service/test_ml_service.py` passes, and the Compose demo flow completes with the ML service and worker running.
- The deployed ML-service container reports Pillow 12.3.0 and remains healthy.
- Dependabot automatically closes alerts #36 through #61, with zero open Pillow alerts remaining.
