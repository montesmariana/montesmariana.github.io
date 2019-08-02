The files in this folder allow you to visualize 2D scatterplots **as long as they respect a certain format**.
This file gives you the necessary instructions to reuse this somewhere else.
Last update (of this file): August 2nd, 2019

One note: when I use square brackets, it means you fill in information inside, but you shouldn't write the brackets

1. WHAT FILES DO I NEED?
To effectively use this visualization tool, you need:
- the level1.html, level2.html, level3.html files
- custom.css (CSS file)
- QLVLlogo.png (for the logo in the title)
- d3-legend.min.js (d3 file for legends; the rest of the sources are obtained online)
For each of the types you want to visualize,
- a file with the name [type].models.tsv (described below)
- a file with the name [type].tsv (described below)
If you want to use the selection with buttons (described below), the following files are necessary:
- buttons_selection.html
- selection.js
- copenhagechurch.jpg if you want to keep the background image, you may change it or just ignore it
Finally (or for starters) you need an index file with the links to access level1 for each type.
For that file, all that is really necessary is the link with an href of the following form: "http://level1.html?type=[type]",
and as long as the index file and the other files are in the same directory, it will work.
I prefer a pretty index, with background and explanation; so the file 'copenhagechurch.jpg' works for the background, for instance.

2. DO I NEED TO USE A GITHUB PAGE?

3. WHAT SHOULD [TYPE].MODELS.TSV LOOK LIKE?

4. WHAT SHOULD [TYPE].TSV LOOK LIKE?

5. WHAT SHOULD I NEED TO ADAPT THE 'SELECTION WITH BUTTONS' SECTION?
Study javascript.