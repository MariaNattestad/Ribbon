# Ribbon
![Ribbon gallery](/images/gallery.png)

Ribbon is an interactive web visualization tool for viewing genomic alignments of short/long reads or assembled contigs to any reference genome. 



Ribbon is available online at genomeribbon.com and can even read large bam files straight from your computer without a local install. 

## Local deployment
If you need to deploy Ribbon locally, here are the steps:
1. Install XAMPP on your computer (includes Apache and PHP)
2. Go to the htdocs folder created during the install. On a Mac, the folder is located at /Applications/XAMPP/htdocs/

   ```
   cd /Applications/XAMPP/htdocs/
   ```

3. Clone this repository into the htdocs folder

   ```
   git clone https://github.com/marianattestad/ribbon
   ```

4. Then go to a web browser such as Chrome, Firefox, or Safari (Not tested on IE) and type into the url box:

   ```
   localhost/ribbon
   ```

That is the entire installation process for Ribbon. Don't you love web applications?
