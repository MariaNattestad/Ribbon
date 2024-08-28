# Ribbon v2.0 now includes SplitThreader

We are excited to announce that we have released a new version of Ribbon, v2.0.0 that now includes
SplitThreader plus several other improvements.

## SplitThreader

SplitThreader is another genomic visualization tool Maria built before Ribbon, which provides an overview of large structural variants and copy number profiling data, also cross-referencing these two data sources visually and programmatically.

### Making SplitThreader a front-end only application

Previously, SplitThreader had a back-end that used some python scripts to standardize variants and coverage data, which could take a few minutes before the visualization would be available. This was difficult to maintain, migrate to python3, and troubleshoot when it failed. We were able to refactor SplitThreader to cut out the python scripts and do some of that work on the front-end, which makes it much faster and easier to use.

### Moving SplitThreader into Ribbon

Many users of SplitThreader have used it to get an overview of large variants and find a variant of interest before opening Ribbon to zoom in on the read alignments supporting that variant. We decided the two tools could be better connected, so that users can load variants once and see them in both tools. SplitThreader has now been moved into Ribbon, so they can both be found at genomeribbon.com, just look for SplitThreader in the top navigation bar.
When a VCF or bedpe file is loaded into SplitThreader, it will now appear in Ribbon too.

### SplitThreader for only coverage or only variants

SplitThreader can now be used with either coverage or variants without requiring both for basic functionality.
When loading variants alone, the sizes of chromosomes comes from the annotation, which supports either hg19 or GRCh38. To use another reference genome, the coverage file is required, which sets the sizes of the chromosomes simply to maximum bin end for each chromosome.

## VCF support

Previously both Ribbon and SplitThreader only supported a .bedpe file for showing large structural variants, but now you can load a VCF into SplitThreader with breakend (BND) variants (those with ALT columns that look like `G]chr5:52747359]`), and it will use those to show rearrangements in both SplitThreader and in Ribbon (see a table in the "Large variants" tab).

## Access files by URL

Many file types in Ribbon and SplitThreader can now be loaded through a URL starting with `https://`, s3://, or gs://. 

## Load a session by JSON

A session can include multiple files to load by URL, which can load into both Ribbon and SplitThreader.
For example: 

```
{
    name: "Revio HG008 Tumor/Normal",
    bam: [
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/PacBio_Revio_20240125/HG008-T_PacBio-HiFi-Revio_20240125_116x_CHM13v2.0.bam",
      "https://42basepairs.com/download/s3/giab/data_somatic/HG008/Liss_lab/PacBio_Revio_20240125/HG008-N-P_PacBio-HiFi-Revio_20240125_35x_CHM13v2.0.bam",
    ],
    vcf: ["...", "..."],
    bedpe: "/resources/examples/skbr3.bedpe.csv",
    coverage: "/resources/examples/skbr3.coverage.bed",
    annotation_id: "hg19",
}
```

Fields available:

```
bam: [ array of URLs]
vcf: [ array of URLs]
bedpe: single URL
coverage: single URL
annotation_id: "hg19" or "GRCh38" (currently affects SplitThreader only)

# Use either vcf or bedpe, not both.
```

A couple of example sessions are available from the Examples tab.

## Specify a locus in the URL

Set a locus like this: `&locus=chr20:100000` or `&locus=chr20:100000-100500` to navigate there in Ribbon after any BAM is loaded. This is best to combine with a session that includes a BAM file.

Full example:
https://genomeribbon.com/?session=<url_to_a_JSON_session_bam>&locus=chr20:100000#examples

## Allow loading multiple bam files by URL

Multiple bams are only supported when loading them by URL, not locally. Simply comma-separate two URLs in the input field for "BAM from URL" under the "Input alignments" tab.

## HP tags in Ribbon

Ribbon can now show HP tags if they are present in a BAM file that has been haplotype phased. To color by HP tags, go to "Multi-read settings" tab, then under "Settings for read alignments", set "Color reads by:" to "Haplotype phasing".

## Changed default color of reads to raw strand

Reads were always flipped around if a read aligned in reverse for its longest alignment or the alignment that falls within the locus of interest, which is still true for the bottom single-read view. This would also affect the color before, but now we made a new option that is to color the read by its actual original strand, which is the default many users would be used to in other genome browsers. This can still be changed to the previous default by going to the "Multi-read settings" tab and setting "Color reads by:" to "Orientation".

## Ribbon UI streamlined

The panel on the right side of Ribbon containing all the settings now uses tabs instead of many collapsible panels to scroll through. This is easier to navigate and avoids scrolling down past the visualizations.

## Code modernization

We have updated Ribbon/SplitThreader to use modern ES6 imports, which were not originally available or commonly used when SplitThreader and Ribbon were built (2015-2016). Now this web app uses NPM to manage dependencies and Vite to bundle them, so individual javascript scripts in the application can import the dependencies they need. Previously everything was a global variable and the namespaces of everything was shared. This change was especially needed as we are using some new dependencies that just don't work with the old system, i.e. they can only be imported explicitly.
