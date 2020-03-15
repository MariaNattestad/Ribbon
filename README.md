# Ribbon

Please cite our preprint on the BioRxiv: [https://www.biorxiv.org/content/early/2016/10/20/082123](https://www.biorxiv.org/content/early/2016/10/20/082123)

![Ribbon gallery](/images/gallery.png)

Ribbon is an interactive web visualization tool for viewing genomic alignments of short/long reads or assembled contigs to any reference genome. 

Ribbon is available online at genomeribbon.com and can even read large bam files straight from your computer without a local install. 

## Local deployment
If you need to deploy Ribbon locally, here are the steps:

1. Clone this repository

   ```
   git clone https://github.com/marianattestad/ribbon
   cd ribbon
   npm install
   ```

2. Launch a web server

   ```
   python2 -m SimpleHTTPServer 9000
   ```

3. Then go to a web browser such as Chrome, Firefox, or Safari (Not tested on IE) and type into the url box:

   ```
   localhost:9000
   ```

That is the entire installation process for Ribbon. Don't you love web applications?
