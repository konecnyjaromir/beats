# BEATS AVL Black Pearl selection

This application bundles 54 WAV files selected from **AVL Black Pearl**, part of **AVL Drumkits**, created by **Glen MacArthur (2015)**.

- Original project: https://www.bandshed.net/avldrumkits/
- Author contact: info@bandshed.net
- Original formats: SFZ, SF2, h2drumkit
- Original author notice: [AVL-Drumkits-License.pdf](AVL-Drumkits-License.pdf), downloaded from https://bandshed.net/pdf/AVL-Drumkits%20CC-BY-SA%20License.pdf
- License: **Creative Commons Attribution-ShareAlike 3.0 Unported**, with the author's AVL Drumkits exception described below.
- Legal code: https://creativecommons.org/licenses/by-sa/3.0/ and the bundled [full license text](CC-BY-SA-3.0.txt).

## Author's exception and attribution requirements

The original author notice requires share-alike for modified samples and new sample libraries using these recordings. Produced music and other works that are not sample libraries can be licensed freely. Preserve the author's information and the notice (or its contents) when redistributing. A modified version of the sample library must use a different name.

The original notice is included verbatim as a PDF. The selected collection here is named **BEATS AVL Black Pearl selection**, not presented as a new official AVL release. No endorsement by Glen MacArthur or AVL Drumkits is implied.

## Provenance and changes

Distribution source: https://github.com/backmeupplz/drumkit-kits/tree/04c2ad754456ce48c75b01e8a508ed73a2ec082c/avl-black-pearl

48 WAV files are unchanged from the pinned distribution above. The six WAV files for notes 47 and 64 were decoded losslessly from the following AVL FLAC source:

https://github.com/studiorack/avl-drumkits/tree/b06cb2c27359cbc68a830a82bddced05bd73d1a0

The source files are Samples/47-Pearl13Tom2-{1,3,5}.flac and Samples/64-Maraca-{1,3,5}.flac. Their decoded PCM16 samples and sample rates were checked against the resulting WAV files and are identical. No gain, pitch or sample edits were applied.

We select velocity layers 1, 3 and 5 for note numbers 36, 37, 38, 39, 40, 41, 42, 44, 45, 46, 47, 49, 51, 53, 54, 55, 56 and 64. Runtime playback applies additional gain to soft and medium hits.

AVL uses a non-General-MIDI map. High tom uses the 12-inch Pearl tom (45), middle tom the 13-inch Pearl tom from the 5-piece kit (47), and low tom the floor tom (41). Note 48 is a swish hi-hat, not a tom; note 61 is a roto tom, not maracas. Maracas use 64. The pinned Black_Pearl_5pc.sfz definition identifies these source recordings.

[manifest.json](manifest.json) records SHA-256 hashes, source paths and pinned source versions. Unchanged WAV files were checked against their original Git blobs; the newly decoded files also record their source FLAC hashes and conversion details.

The upstream repository's MIT notice is preserved separately in [UPSTREAM-REPOSITORY-LICENSE.txt](UPSTREAM-REPOSITORY-LICENSE.txt). **It does not apply to these WAV recordings.** Their CC BY-SA 3.0 license and the author's notice continue to apply.

## Redistribution

Public distribution, including through GitHub and commercial applications, is permitted subject to the sample license. Keep this attribution, the original author notice, the license text and the sample manifest with the WAV files. Apply the required share-alike terms to adaptations and sample-library derivatives, and identify your changes and collection name. Do not describe these recordings as public domain or as MIT-licensed samples.
