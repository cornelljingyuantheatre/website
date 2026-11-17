# Shows archive content audit

Source: 往年剧目信息汇总.xlsx, Sheet1. Imported 32 productions across 19 seasons (2016 Fall–2026 Spring). The 2020 Fall N/A row is excluded. Blank season cells inherit the preceding season.

## Needs source confirmation

- Row 18, 收信快乐: both synopses repeat the missing-wife plot of 如影随形. These two fields are withheld from the page pending confirmation; directors/cast/crew/media are retained.
- Row 17: title is 蝴蝶变形计, while synopsis uses 蝴蝶变形记. Retained source spelling.
- Some cells name multiple posters but provide only one hyperlink. Only supplied URLs are imported.

## Missing source fields

| Season | Production | Missing fields |
| --- | --- | --- |
| Fall 2025 | 《夏洛特烦恼》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos, recording |
| Spring 2025 | 《控方证人》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos, recording |
| Fall 2024 | 《喜剧之夜》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos |
| Spring 2024 | 《我和我和他和他》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos, recording |
| Spring 2024 | 《你好，打劫！》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos, recording |
| Fall 2023 | 《特洛马克》 | poster, trailer, photos, recording |
| Fall 2023 | 《老舍五则》 | poster, photos |
| Spring 2023 | 《恋爱的犀牛》 | poster, photos, recording |
| Spring 2023 | 《如影随形》 | photos, recording |
| Fall 2022 | 《扬名立万》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos, recording |
| Fall 2022 | 《东方快车谋杀案》 | trailer, photos, recording |
| Fall 2022 | 《Trifles》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos, recording |
| Spring 2022 | 《十二怒汉》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos, recording |
| Spring 2022 | 《风声》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos, recording |
| Fall 2021 | 《蝴蝶变形计》 | recording |
| Spring 2021 | 《收信快乐》 | Chinese synopsis, English synopsis, recording |
| Spring 2020 | 《无人生还》 | trailer, recording |
| Spring 2020 | 《哥本哈根》 | English synopsis, trailer, cast, photos, recording |
| Fall 2019 | 《你好，疯子》 | photos, recording |
| Fall 2019 | 《蓝袍先生》 | poster, photos, recording |
| Spring 2019 | 《活着》 | trailer, photos, recording |
| Spring 2019 | 《七》 | poster, trailer, crew, photos, recording |
| Fall 2018 | 《蒋公的面子》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos, recording |
| Fall 2018 | 《纸天使》 | poster, directors, Chinese synopsis, English synopsis, trailer, cast, crew, photos, recording |
| Spring 2018 | 《捕鼠器》 | trailer, photos |
| Spring 2018 | 《（这不是）喜剧的忧伤》 | trailer, photos, recording |
| Fall 2017 | 《艺术》 | trailer, photos, recording |
| Fall 2017 | 《一个无政府主义者的意外死亡》- 孟京辉 | photos, recording |
| Spring 2017 | 《天堂的隔壁是疯人院》 | photos, recording |
| Fall 2016 | 《禁止掉头》 | recording |
| Fall 2016 | 《琥珀》 | trailer, crew, photos, recording |

## Media handling

15 accessible poster thumbnails are saved locally. The Spring 2026 PDF poster is available via its supplied Drive link; no image preview was retrieved. Photo folders, trailers, and recordings open their original supplied URLs. Private-link access and video playback require manual verification. No unavailable media or credits are invented.

## Updating

Edit `data/shows.js`; add local poster images under `images/shows/`. Keep one object per production and preserve distinct IDs for multiple productions in a season. `index.html` loads the archive before `app.js`.
