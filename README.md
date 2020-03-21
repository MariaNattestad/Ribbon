# Ribbon

Please cite our preprint on the BioRxiv: [https://www.biorxiv.org/content/early/2016/10/20/082123](https://www.biorxiv.org/content/early/2016/10/20/082123)

![Ribbon gallery](/images/gallery.png)

Ribbon is an interactive web visualization tool for viewing genomic alignments of short/long reads or assembled contigs to any reference genome. 

Ribbon is available online at genomeribbon.com and can even read large bam files straight from your computer without a local install. 

## Local deployment
If you need to deploy Ribbon locally, here are the steps:

1. Clone this repository

   ```bash
   git clone https://github.com/marianattestad/ribbon
   cd ribbon
   npm install
   npm run build
   ```

2. Launch a web server

   ```bash
   python -m SimpleHTTPServer 9000  # If you have Python 3, try `python3 -m http.server`
   ```

3. Then open a web browser and go to:

   ```
   localhost:9000
   ```

That is the entire installation process for Ribbon. Don't you love web applications?
