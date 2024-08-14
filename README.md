# Ribbon

Please cite our paper in _Bioinformatics_: https://doi.org/10.1093/bioinformatics/btaa680 (preprint available on [bioRxiv](https://www.biorxiv.org/content/10.1101/082123v1)).

![Ribbon gallery](/images/gallery.png)

Ribbon is an interactive web visualization tool for viewing genomic alignments of short/long reads or assembled contigs to any reference genome. 

Ribbon is available online at [genomeribbon.com](https://genomeribbon.com) and can even read large bam files straight from your computer without a local install. 

## Local deployment

Ribbon works without internet access when deployed locally, although note that permalinks and examples don't work and will show errors in the console.

To deploy Ribbon locally:

```bash
# Clone this repository
git clone https://github.com/marianattestad/ribbon
cd ribbon

# Launch a web server to serve the assets on port 1234
npm run dev
```

Ribbon is now available at http://localhost:1234.


## Development

To develop new features in Ribbon, first install [npm](https://www.npmjs.com/get-npm) if you don't already have it.

Then clone this repository and build it:

```bash
# Clone repo and install dependencies
git clone https://github.com/marianattestad/ribbon
cd ribbon
npm install
npm run build
# To add any new packages, edit the build.sh after doing 
# `npm install <package>` to get the js and/or css included in the bundle!

# Launch a web server
python3 -m http.server 1234
```
