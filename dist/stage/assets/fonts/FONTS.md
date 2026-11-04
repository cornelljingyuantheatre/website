# Bundled web fonts

Both files are subsets containing only the characters this page renders.

| File | Face | Used for | Source |
|------|------|----------|--------|
| `aaruiyati-title.woff2` (20 glyphs) | AaRuiYaTi Regular 1.000, © 2021 HanMeiHutong (XiaMen) Technology Co., Ltd. (字体管家 / Aa字库) | 境, 缘 (184px) and Chinese / Drama / Society / At / Cornell (30.525px) | `AaRuiYaTi-2.ttf`, MD5 52833a912ef6531dc0054662a7362b60, from fonts.net.cn. Listed there as 非商免字体 (free for non-commercial use; commercial use requires written authorization). OS/2 fsType 8 (editable embedding). |
| `alibaba-puhuiti-3-85-bold.woff2` (112 glyphs) | Alibaba PuHuiTi 3.0 85 Bold, v3.01, © 2020-2023 Alibaba (China) Co., Ltd.; Alibaba Design / Hanyi Fonts | Home introduction; highlighted phrases in the page-2 story | npm `@fontpkg/alibaba-pu-hui-ti-3-0@3.1.2` (unmodified Alibaba release file). Alibaba publishes the family as free for commercial use. |
| `alibaba-puhuiti-3-65-medium.woff2` (232 glyphs) | Alibaba PuHuiTi 3.0 65 Medium, same source | Page-2 credits and story text | Same package. |

SF Pro (used in Figma for the date and "Steven") is licensed for Apple platforms only, so the page uses the system UI face (SF Pro on Apple devices, Segoe UI on Windows).

Glyph shapes were verified against the Figma outlines of node 132:24 (matching bounding boxes per word).
If the page text changes, re-subset from the original files, e.g.:

    pyftsubset AaRuiYaTi-2.ttf --text="境缘 ChineseDramaSocietyAtCornell" --flavor=woff2 --layout-features='*' --no-hinting --output-file=aaruiyati-title.woff2
