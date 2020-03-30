# Ribbon

Please cite our preprint on the BioRxiv: [https://www.biorxiv.org/content/early/2016/10/20/082123](https://www.biorxiv.org/content/early/2016/10/20/082123)

![Ribbon gallery](/images/gallery.png)

Ribbon is an interactive web visualization tool for viewing genomic alignments of short/long reads or assembled contigs to any reference genome. 

Ribbon is available online at genomeribbon.com and can even read large bam files straight from your computer without a local install. 

## Local deployment

If you need to deploy Ribbon locally, here are the steps:

1. Clone this repository: `git clone https://github.com/marianattestad/ribbon`

2. Launch `index.html` in your browser

That is the entire installation process for Ribbon. Don't you love web applications?


## Development

To develop new features in Ribbon:

1. Install [npm](https://www.npmjs.com/get-npm) if you don't already have it.

2. Clone this repository and build it:

   ```bash
   git clone https://github.com/marianattestad/ribbon
   cd ribbon
   npm install
   npm run build
   ```
