# Ribbon

Please cite our preprint on the BioRxiv: [https://www.biorxiv.org/content/early/2016/10/20/082123](https://www.biorxiv.org/content/early/2016/10/20/082123)

![Ribbon gallery](/images/gallery.png)

Ribbon is an interactive web visualization tool for viewing genomic alignments of short/long reads or assembled contigs to any reference genome. 

Ribbon is available online at genomeribbon.com and can even read large bam files straight from your computer without a local install. 

## Local deployment
If you need to deploy Ribbon locally, here are the steps:

1. If you don't already have a server setup that includes PHP, then you can get that by installing XAMPP (includes Apache and PHP). Also install [npm](https://www.npmjs.com/get-npm) if you don't already have it.
2. Go to the htdocs folder created during the install. On a Mac, the folder is located at /Applications/XAMPP/htdocs/

   ```
   cd /Applications/XAMPP/htdocs/
   ```

3. Clone this repository into the htdocs folder and install dependencies

   ```
   git clone https://github.com/marianattestad/ribbon
   npm install
   ```

4. Then go to a web browser such as Chrome, Firefox, or Safari (Not tested on IE) and type into the url box:

   ```
   localhost/ribbon
   ```

That is the entire installation process for Ribbon. Don't you love web applications?
