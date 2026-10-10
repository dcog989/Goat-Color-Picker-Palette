# Changelog
All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

- - -
## v3.8.0 - 2026-10-10

#### Features

- (7e65a1c) add per-mode invert toggle to tabs - dcog989

#### Bug Fixes

- (895e7ba) narrow genAxis with the harmony guard so generated() typechecks - dcog989

- (89a7ceb) remove no-op system-ui font-face from critical CSS - dcog989

- (776a3aa) stop tsc emitting vite.config.d.ts into the repo root - dcog989

- (28d561d) use an explicit sourcemap mode instead of a dead NODE_ENV check - dcog989

- (67dd266) correct og:image URL and declare image metadata - dcog989

- (e37854a) handle clipboard write failures instead of ignoring the promise - dcog989

- (82f1d06) stop duplicate page requests while a page load is in flight - dcog989

- (7b52f94) ignore stale analysis results after clear or a newer file - dcog989

- (aba608f) keep the remembered hue when chroma is raised from zero - dcog989

- (22b1a76) fall back to the color hex when the closest name is pending or blank - dcog989

- (d2c3abc) make DTCG color walker iterative to avoid stack overflow on deep JSON - dcog989

- (dd592c8) clamp hue to [0, 359.999] in the h setter and setOkhslValues - dcog989

- (ae0357a) dispose the color-name debounce effect on destroy via $effect.root - dcog989

- (193973f) bound color-name data wait with a timeout instead of polling forever - dcog989

- (8de06e6) build dense aligned color-name arrays so list holes never yield undefined entries - dcog989

- (248de66) stop persist effect mutating the colors state it reads on quota overflow - dcog989

- (e6063b0) emit uniform 8-digit hex from generatePalette to stop mixed alpha output - dcog989

- (a9ee869) preserve single-color alpha by using hexa instead of hex in getColorSource - dcog989

- (f457a4e) cancel pending retry timer on teardown and reset retry budget on init - dcog989

- (3f3d2ac) bind dark: variant to app theme class instead of OS preference - dcog989

- (cc702ac) unify disabled button styling on one global rule - dcog989

- (0b2761f) use shared .icon-button for the precision toggle so hover text stays legible - dcog989

- (74441f7) use contrast-aware on-current text color for current-color hover states - dcog989

- (3364642) size the grid rows to panel content - dcog989

- (33d29a8) center and enlarge the custom-color swatch - dcog989

- (4b85aaf) restore keyboard focus indicator on range sliders - dcog989

- (4b6d1e5) resolve text-on-current from one token - dcog989

#### Performance Improvements

- (0834386) check the sRGB gamut directly instead of parsing an object per iteration - dcog989

- (a72d824) check sRGB gamut with oklchToLinearInto instead of parsing an object per iteration - dcog989

- (7fd02fa) mutate slider state in place so unchanged gradient ramps are not rebuilt - dcog989

- (8b670d9) cache rgbComp as a derived value instead of a getter - dcog989

- (4e92021) parse the current color once for both APCA contrast values - dcog989

- (88d58b8) parse each color once for palette sorting instead of per comparison - dcog989

- (de516a9) precompute lowercased color names for search filtering - dcog989

- (18df6c4) drop unused duplicate colors array from analysis worker payload - dcog989

- (cef025a) cache oklch conversion in a single $derived instead of recomputing per read - dcog989

- (fa394ba) build color-name coordinates with low-level parseHex/rgbToOklab - dcog989

#### Refactoring

- (e07f09a) drop redundant cssMinify option - dcog989

- (1ee836f) drop esbuild minifier in favour of Vite 8's default OXC - dcog989

- (7a4a84b) drop deprecated rollupOptions output block relying on Vite defaults - dcog989

- (b9c4b63) drop redundant contrast try/catch and reuse the harmony-mode derived - dcog989

- (12667a7) extract value-button reveal host, dedupe copy-value buttons - dcog989

- (c3958e1) add small-button base, dedupe ExportModal button chrome - dcog989

- (5f182f4) extract icon-button-inset variant for control-group steppers - dcog989

- (ae8019a) move panel scroll container (h-full overflow-y-auto) into .panel base - dcog989

- (1834a76) add shared segment/tab control bases, drive state via aria - dcog989

- (85b3028) extract shared .footer-link and .footer-divider classes - dcog989

- (a4aa494) route remaining small-caps labels through the shared label classes - dcog989

- (f7cbb6b) drop duplicate global transition rule and the transition-colors override - dcog989

- (e05801a) remove per-call-site radius overrides from segmented controls - dcog989

- (32af9ef) remove unused animation utility classes and keyframes - dcog989

- (612de1b) drop --color-brand alias and use --current-color directly - dcog989

- (6c4de12) align ExportModal with shared modal panel/title and Svelte transitions - dcog989

- (8c98b68) extract shared .overlay-button and .value-reveal from swatch and copy actions - dcog989

- (1f48c01) extract shared .control-group shell for mode, stepper and contrast tab groups - dcog989

- (8ec73dc) route small-caps labels through .section-heading and new .sub-label - dcog989

- (096933d) extract shared .text-input chrome for picker, contrast and library fields - dcog989

- (3fcc54d) extract shared .select-control class for palette, paintbox and export selects - dcog989

- (424ea48) remove redundant comparison caption - dcog989

- (d09dfd4) use the CSS-variable shorthand for injected info classes - dcog989

- (282eb45) replace actionButtonClass string with a .action-button base - dcog989

- (088cd6b) drop per-element will-change-transform duplicates - dcog989

- (d052baf) move the 1920px grid into Tailwind utilities - dcog989

- (594d5cf) extract shared button and modal chrome bases - dcog989

- (76d38fd) extract shared .section-heading base class - dcog989

- (53d7624) extract shared panel shell into a .panel base class - dcog989

- (de30592) drop custom scrollbar styling - dcog989

- (5de5292) remove duplicate body background write - dcog989

- (558c733) unify focus styling on the global :focus-visible outline - dcog989
- - -

## v3.7.1 - 2026-10-06
- - -

## v3.7.0 - 2026-10-06

#### Features

- (0348569) add DTCG design-tokens and GIMP GPL import/export - dcog989

#### Bug Fixes

- (306d01d) show a single row by default instead of two - dcog989

#### Refactoring

- (9ebb4da) rebrand to 'color-picker-palette' - dcog989
- - -

## v3.6.1 - 2026-10-04
- - -

## v3.6.0 - 2026-09-28

#### Features

- (218edd6) default to OKHSL picker and track sRGB gamut chroma in OKLCH - dcog989
- - -

## v3.5.3 - 2026-09-25

#### Bug Fixes

- (2062c05) show real decimal RGB channels in precise mode - dcog989

#### Refactoring

- (a60ca2b) randomize hue at fixed OKLCH L/C - dcog989

- (abd9b5a) generate random colors in OKLCH with perceptual lightness - dcog989

- (3e23aa2) use @colordx/core/fn rgbToHex - dcog989
- - -

## v3.5.2 - 2026-09-23

#### Bug Fixes

- (ed9f345) preserve hue/saturation when lightness hits 0 or 100 - dcog989

#### Refactoring

- (289895a) use colordx contrast instead of OKLCH lightness cutoffs for text color - dcog989

- (1006324) use colordx isReadable for WCAG pass/fail checks - dcog989

- (a9a05cb) replace hand-rolled CSS name table with colordx names plugin - dcog989
- - -

## v3.5.1 - 2026-09-22

#### Refactoring

- (e8680bf) use colordx okhsl plugin, drop custom OKHSL util - dcog989
- - -

## v3.5.0 - 2026-09-21

#### Features

- (26bd2c8) add HWB and OKHSL copy formats, relabel LAB to CIELAB - dcog989
- - -

## v3.4.7 - 2026-09-16
- - -

## v3.4.6 - 2026-09-05
- - -

## v3.4.5 - 2026-09-05
- - -

## v3.4.4 - 2026-09-02
- - -

## v3.4.3 - 2026-09-02

#### Bug Fixes

- (4dc04e1) package clean script - dcog989
- - -

## v3.4.2 - 2026-08-31

#### Bug Fixes

- (57646d9) allow onError handler without an error event - dcog989
- - -

## v3.4.1 - 2026-08-31
- - -

## v3.4.0 - 2026-08-31

#### Features

- (a5ef64a) add dynamic color URL sync with shareable links - dcog989

#### Bug Fixes

- (6f00579) stop header hanging on 'Searching...' when worker is slow or errors - dcog989

- (5c3db02) enforce coverage thresholds, block audit failures, drop stale vite externals - dcog989
- - -

## v3.3.3 - 2026-08-31
- - -

Changelog generated by [cocogitto](https://github.com/cocogitto/cocogitto).